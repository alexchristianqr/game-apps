import { afterNextRender, Component, computed, ElementRef, inject, NgZone, OnDestroy, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bomb, ChevronDown, LucideAngularModule, Pause, Play } from "lucide-angular";
import { AudioService } from "../../core/services/audio/audio.service";
import { CelebrationService } from "../../core/services/celebration/celebration.service";
import { PreferencesService } from "../../core/services/preferences/preferences.service";
import { SfxService } from "../../core/services/sfx/sfx.service";
import { ButtonDirective } from "../../core/ui/button/button.directive";
import { PanelComponent } from "../../core/ui/panel/panel.component";
import { StatComponent } from "../../core/ui/stat/stat.component";
import { ToggleComponent } from "../../core/ui/toggle/toggle.component";
import { type Action, type BombermanState, BASE_SPEED, createGame, type GameEvent, nextLevel, step } from "./bomberman.engine";
import type { PowerKind } from "./bomberman.levels";
import type { Dir } from "./bomberman.logic";
import { BombermanRenderer } from "./bomberman.renderer";

type Phase = "idle" | "playing" | "paused" | "levelClear" | "over";

interface BombermanSettings {
  music: boolean;
  musicVolume: number;
  sfx: boolean;
  sfxVolume: number;
  touchButtons: boolean;
}

interface Popup {
  id: number;
  text: string;
  sub: string;
}

const SETTINGS_KEY = "bomberman-settings";
const BEST_KEY = "bomberman-best";
const MAX_FRAME_MS = 50;

const DEFAULT_SETTINGS: BombermanSettings = { music: true, musicVolume: 25, sfx: true, sfxVolume: 60, touchButtons: false };

const POWER_TEXT: Record<PowerKind, string> = { bomb: "¡+1 bomba!", range: "¡Más alcance!", speed: "¡Más rápido!" };

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right"
};
const BOMB_KEYS = new Set([" ", "x", "X"]);

@Component({
  selector: "app-bomberman",
  imports: [RouterLink, FormsModule, LucideAngularModule, ButtonDirective, PanelComponent, StatComponent, ToggleComponent],
  templateUrl: "./bomberman.component.html",
  host: {
    "(document:keydown)": "onKeyDown($event)",
    "(document:keyup)": "onKeyUp($event)",
    "(document:visibilitychange)": "onHidden()",
    "(window:blur)": "onHidden()"
  }
})
export class BombermanComponent implements OnDestroy {
  public readonly icons = { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Bomb, ChevronDown, Pause, Play };

  public readonly phase = signal<Phase>("idle");
  public readonly webglFailed = signal(false);
  public readonly settingsOpen = signal(false);
  public readonly helpOpen = signal(false);
  public readonly touchButtons = signal(DEFAULT_SETTINGS.touchButtons);
  public readonly best = signal(0);
  public readonly newRecord = signal(false);
  public readonly popup = signal<Popup | null>(null);
  /** Texto para lectores de pantalla */
  public readonly announcement = signal("");

  // Marcador: solo cambia cuando cambia el valor, no en cada cuadro
  public readonly score = signal(0);
  public readonly level = signal(1);
  public readonly lives = signal(3);
  public readonly enemies = signal(0);
  public readonly seconds = signal(180);
  public readonly maxBombs = signal(1);
  public readonly range = signal(2);
  public readonly speed = signal(0);
  public readonly levelBonus = signal(0);

  public music = DEFAULT_SETTINGS.music;
  public musicVolume = DEFAULT_SETTINGS.musicVolume;
  public sfxOn = DEFAULT_SETTINGS.sfx;
  public sfxVolume = DEFAULT_SETTINGS.sfxVolume;

  public readonly clock = computed(() => `${Math.floor(this.seconds() / 60)}:${String(this.seconds() % 60).padStart(2, "0")}`);
  public readonly livesText = computed(() => "♥".repeat(Math.max(0, this.lives())) || "—");
  public readonly boardLabel = computed(() => `Arena de Bomberman. Nivel ${this.level()}, ${this.lives()} vidas, ${this.enemies()} enemigos, ${this.score()} puntos.`);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
  private readonly stageRef = viewChild<ElementRef<HTMLElement>>("stage");

  private readonly audio = inject(AudioService);
  private readonly sfx = inject(SfxService);
  private readonly celebration = inject(CelebrationService);
  private readonly prefs = inject(PreferencesService);
  private readonly zone = inject(NgZone);

  private readonly rng = (): number => Math.random();
  private current: BombermanState = createGame(this.rng, 1);
  private renderer: BombermanRenderer | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private raf: number | null = null;
  private lastTime = 0;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private fxId = 0;
  private destroyed = false;

  // Entrada: teclado (pila, manda la última pulsada), botones en pantalla y mando
  private readonly keyStack: Dir[] = [];
  private touchDir: Dir | null = null;
  private padDir: Dir | null = null;
  private sentDir: Dir | null = null;
  private padPrev: boolean[] = [];

  public constructor() {
    const saved = this.prefs.load<BombermanSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
    this.music = !!saved.music;
    this.musicVolume = clamp(saved.musicVolume, 0, 100);
    this.sfxOn = !!saved.sfx;
    this.sfxVolume = clamp(saved.sfxVolume, 0, 100);
    // En pantallas táctiles los botones se muestran de entrada, salvo que ya se haya elegido otra cosa.
    const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    this.touchButtons.set(this.hasSavedSettings() ? !!saved.touchButtons : coarse);
    this.best.set(this.prefs.load<number>(BEST_KEY, 0, (v): v is number => typeof v === "number"));
    this.syncHud(this.current);

    // El renderer necesita el canvas ya en el DOM; fuera del navegador no hay WebGL.
    afterNextRender(() => this.initRenderer());
  }

  public ngOnDestroy(): void {
    this.destroyed = true;
    this.stopLoop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.renderer?.dispose();
    this.renderer = null;
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.audio.stopAll();
  }

  // ---- Flujo ----

  public startGame(): void {
    this.current = createGame(this.rng, 1);
    this.newRecord.set(false);
    this.popup.set(null);
    this.releaseInput();
    this.syncHud(this.current);
    this.applyAudioSettings();
    this.phase.set("playing");
    this.announce("¡Empieza la partida! Nivel 1");
    this.playMusic();
  }

  public restartGame(): void {
    this.audio.stopLoop();
    this.startGame();
  }

  public endGame(): void {
    this.releaseInput();
    this.audio.stopAll();
    this.current = createGame(this.rng, 1);
    this.syncHud(this.current);
    this.phase.set("idle");
  }

  public continueToNextLevel(): void {
    if (this.phase() !== "levelClear") return;
    this.current = nextLevel(this.current, this.rng);
    this.popup.set(null);
    this.syncHud(this.current);
    this.phase.set("playing");
    this.announce(`Nivel ${this.current.level}`);
  }

  public togglePause(): void {
    const phase = this.phase();
    if (phase === "playing") {
      this.phase.set("paused");
      this.releaseInput();
      this.audio.stopLoop();
      this.announce("Pausa");
    } else if (phase === "paused") {
      this.phase.set("playing");
      this.playMusic();
      this.announce("Seguimos");
    }
  }

  /** Pausa sola al perder el foco: nadie pierde una vida por cambiar de pestaña. */
  public onHidden(): void {
    if (this.phase() === "playing" && (typeof document === "undefined" || document.hidden || !document.hasFocus())) this.togglePause();
  }

  // ---- Teclado ----

  public onKeyDown(event: KeyboardEvent): void {
    if (isTyping(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === "p" || event.key === "P" || event.key === "Escape") {
      if (this.phase() === "playing" || this.phase() === "paused") {
        event.preventDefault();
        if (!event.repeat) this.togglePause();
      }
      return;
    }
    if (this.phase() !== "playing") return;

    const dir = KEY_DIRS[event.key];
    if (dir) {
      event.preventDefault();
      if (!this.keyStack.includes(dir)) this.keyStack.push(dir);
      this.syncDir();
    } else if (BOMB_KEYS.has(event.key)) {
      event.preventDefault();
      if (!event.repeat) this.dispatch({ type: "bomb" });
    }
  }

  public onKeyUp(event: KeyboardEvent): void {
    // Espacio sobre un botón enfocado dispararía un clic: se evita mientras se juega.
    if (this.phase() === "playing" && (KEY_DIRS[event.key] || BOMB_KEYS.has(event.key)) && !isTyping(event.target)) event.preventDefault();
    const dir = KEY_DIRS[event.key];
    if (!dir) return;
    const i = this.keyStack.indexOf(dir);
    if (i >= 0) this.keyStack.splice(i, 1);
    this.syncDir();
  }

  // ---- Botones en pantalla ----

  public press(dir: Dir): void {
    if (this.phase() !== "playing") return;
    this.touchDir = dir;
    this.syncDir();
  }

  public release(dir: Dir): void {
    if (this.touchDir === dir) this.touchDir = null;
    this.syncDir();
  }

  /** Un solo toque desde el teclado (Enter/Espacio sobre un botón): `detail === 0` distingue el clic de teclado. */
  public tapBomb(event: MouseEvent): void {
    if (event.detail !== 0) return;
    this.dispatch({ type: "bomb" });
  }

  public dropBomb(): void {
    this.dispatch({ type: "bomb" });
  }

  // ---- Ajustes ----

  public setTouchButtons(value: boolean): void {
    this.touchButtons.set(value);
    this.persist();
  }

  public persist(): void {
    this.applyAudioSettings();
    this.prefs.save<BombermanSettings>(SETTINGS_KEY, {
      music: this.music,
      musicVolume: this.musicVolume,
      sfx: this.sfxOn,
      sfxVolume: this.sfxVolume,
      touchButtons: this.touchButtons()
    });
  }

  // ---- Renderer y bucle ----

  private initRenderer(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || this.destroyed) return;
    try {
      const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.renderer = new BombermanRenderer(canvas, { reducedMotion: reduced });
    } catch {
      // Sin WebGL (navegador antiguo, GPU bloqueada): se avisa en lugar de dejar un lienzo vacío.
      this.webglFailed.set(true);
      return;
    }
    const stage = this.stageRef()?.nativeElement;
    if (stage && typeof ResizeObserver === "function") {
      this.resizeObserver = new ResizeObserver(() => this.renderer?.setSize(stage.clientWidth, stage.clientHeight));
      this.resizeObserver.observe(stage);
    }
    this.startLoop();
  }

  private startLoop(): void {
    if (this.raf !== null || typeof requestAnimationFrame !== "function") return;
    this.lastTime = 0;
    // Fuera de la zona: un rAF dentro dispararía detección de cambios en cada cuadro.
    this.zone.runOutsideAngular(() => {
      const frame = (time: number): void => {
        if (this.destroyed) return;
        const dt = this.lastTime ? Math.min(time - this.lastTime, MAX_FRAME_MS) : 0;
        this.lastTime = time;
        this.update(dt);
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    });
  }

  private stopLoop(): void {
    if (this.raf !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  private update(dt: number): void {
    this.pollGamepad();
    if (this.phase() === "playing") this.dispatch({ type: "tick", dt });
    // La escena sigue viva en pausa e inicio (luces y polvo), pero sin avanzar el juego
    this.renderer?.frame(this.current, dt / 1000, this.phase() !== "playing");
  }

  // ---- Entrada ----

  private syncDir(): void {
    const wanted = this.touchDir ?? this.padDir ?? this.keyStack[this.keyStack.length - 1] ?? null;
    if (wanted === this.sentDir) return;
    this.sentDir = wanted;
    this.dispatch({ type: "dir", dir: wanted });
  }

  private releaseInput(): void {
    this.keyStack.length = 0;
    this.touchDir = null;
    this.padDir = null;
    this.sentDir = null;
    this.current = { ...this.current, player: { ...this.current.player, held: null, moving: false } };
  }

  private pollGamepad(): void {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return;
    const pad = Array.from(navigator.getGamepads()).find((p): p is Gamepad => !!p && p.connected);
    if (!pad) {
      if (this.padDir) {
        this.padDir = null;
        this.syncDir();
      }
      return;
    }
    const down = (i: number): boolean => !!pad.buttons[i]?.pressed;
    const edge = (i: number): boolean => down(i) && !this.padPrev[i];
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;

    if (edge(9)) this.togglePause();
    let dir: Dir | null = null;
    if (this.phase() === "playing") {
      if (down(12) || ay < -0.5) dir = "up";
      else if (down(13) || ay > 0.5) dir = "down";
      else if (down(14) || ax < -0.5) dir = "left";
      else if (down(15) || ax > 0.5) dir = "right";
      if (edge(0) || edge(2)) this.dispatch({ type: "bomb" });
    }
    if (dir !== this.padDir) {
      this.padDir = dir;
      this.syncDir();
    }
    this.padPrev = pad.buttons.map((b) => b.pressed);
  }

  // ---- Motor y efectos ----

  private dispatch(action: Action): void {
    if (this.phase() !== "playing") return;
    const next = step(this.current, action, this.rng);
    if (next === this.current) return;
    this.current = next;
    if (next.events.length) {
      this.renderer?.pushEvents(next.events);
      this.handleEvents(next.events, next);
    }
    if (action.type === "tick") this.syncHud(next);
  }

  private handleEvents(events: readonly GameEvent[], state: BombermanState): void {
    // Una cadena de bombas suena como una sola explosión grande, no como cinco encimadas
    let exploded = false;
    for (const event of events) {
      switch (event.type) {
        case "bombPlaced":
          this.sfx.place();
          break;
        case "explode":
          if (!exploded) this.sfx.explosion();
          exploded = true;
          break;
        case "enemyKilled":
          this.showPopup(`+${event.points}`, event.chain > 1 ? `¡Cadena ×${2 ** Math.min(event.chain - 1, 3)}!` : "");
          this.announce(`Enemigo eliminado, ${event.points} puntos`);
          break;
        case "powerUp":
          this.sfx.powerUp();
          this.showPopup(POWER_TEXT[event.kind], "");
          this.announce(POWER_TEXT[event.kind]);
          break;
        case "playerHit":
          this.sfx.drop();
          this.announce(event.lives > 0 ? `¡Te alcanzaron! Quedan ${event.lives} vidas` : "Sin vidas");
          if (event.lives > 0) this.showPopup("¡Ouch!", `${event.lives} ${event.lives === 1 ? "vida" : "vidas"}`);
          break;
        case "exitOpen":
          this.sfx.levelUp();
          this.showPopup("¡Salida abierta!", "Corre hacia el portal");
          this.announce("Todos los enemigos eliminados. La salida está abierta");
          break;
        case "levelClear":
          this.onLevelClear(event.bonus);
          break;
        case "over":
          this.onOver(state);
          break;
      }
    }
  }

  private onLevelClear(bonus: number): void {
    this.levelBonus.set(bonus);
    this.phase.set("levelClear");
    this.releaseInput();
    this.sfx.win();
    this.announce(`Nivel superado. Bonus de ${bonus} puntos`);
    void this.celebration.celebrate();
  }

  private onOver(state: BombermanState): void {
    this.phase.set("over");
    this.releaseInput();
    this.audio.stopLoop();
    this.sfx.lose();
    this.syncHud(state);
    const record = state.score > this.best();
    if (record) {
      this.best.set(state.score);
      this.prefs.save<number>(BEST_KEY, state.score);
      this.newRecord.set(true);
      void this.celebration.celebrate();
    }
    this.announce(`Fin de la partida. ${state.score} puntos.${record ? " ¡Nuevo récord!" : ""}`);
  }

  private syncHud(state: BombermanState): void {
    this.score.set(state.score);
    this.level.set(state.level);
    this.lives.set(state.player.lives);
    this.enemies.set(state.enemies.length);
    this.seconds.set(Math.max(0, Math.ceil(state.timeLeft / 1000)));
    this.maxBombs.set(state.player.maxBombs);
    this.range.set(state.player.range);
    this.speed.set(Math.round((state.player.speed - BASE_SPEED) / 0.6));
  }

  private showPopup(text: string, sub: string): void {
    const id = ++this.fxId;
    this.popup.set({ id, text, sub });
    this.later(() => this.popup()?.id === id && this.popup.set(null), 1100);
  }

  private announce(text: string): void {
    this.announcement.set(text);
  }

  /** Temporizadores registrados: se liberan todos al destruir (P9). */
  private later(fn: () => unknown, ms: number): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, ms);
    this.timers.add(timer);
  }

  private applyAudioSettings(): void {
    this.sfx.muted = !this.sfxOn;
    this.sfx.volume = this.sfxVolume;
  }

  private playMusic(): void {
    if (this.music) this.audio.playLoop("assets/sounds/theme_game.mp3", this.musicVolume);
  }

  private hasSavedSettings(): boolean {
    try {
      return localStorage.getItem("game-apps:" + SETTINGS_KEY) !== null;
    } catch {
      return false;
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName);
}
