import { Component, computed, ElementRef, inject, NgZone, OnDestroy, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Archive, ArrowDown, ArrowLeft, ArrowRight, ChevronDown, ChevronsDown, LucideAngularModule, Pause, Play, RotateCw } from "lucide-angular";
import { AudioService } from "../../core/services/audio/audio.service";
import { CelebrationService } from "../../core/services/celebration/celebration.service";
import { PreferencesService } from "../../core/services/preferences/preferences.service";
import { SfxService } from "../../core/services/sfx/sfx.service";
import { ButtonDirective } from "../../core/ui/button/button.directive";
import { PanelComponent } from "../../core/ui/panel/panel.component";
import { StatComponent } from "../../core/ui/stat/stat.component";
import { ToggleComponent } from "../../core/ui/toggle/toggle.component";
import { type Action, createGame, type GameEvent, step, type TetrisState } from "./tetris.engine";
import { cellsOf, COLS, dropDistance, HIDDEN_ROWS, ROWS, VISIBLE_ROWS } from "./tetris.logic";
import { PIECE_IDS, PIECES, type PieceId } from "./tetris.pieces";

type Phase = "idle" | "playing" | "paused" | "over";

interface TetrisSettings {
  startLevel: number;
  ghost: boolean;
  music: boolean;
  musicVolume: number;
  sfx: boolean;
  sfxVolume: number;
  touchButtons: boolean;
}

interface BoardCell {
  id: PieceId | null;
  ghost: boolean;
}

interface Popup {
  id: number;
  text: string;
  sub: string;
}

const SETTINGS_KEY = "tetris-settings";
const BEST_KEY = "tetris-best";

/** Autorrepetición al mantener una dirección: espera inicial (DAS) y cadencia (ARR), en ms. */
const DAS_MS = 150;
const ARR_MS = 45;
const SOFT_DROP_MS = 40;
const MAX_FRAME_MS = 100;

/** Tablero vacío antes de la primera partida. */
const EMPTY_CELLS: BoardCell[] = Array.from({ length: COLS * VISIBLE_ROWS }, () => ({ id: null, ghost: false }));

const LINE_TEXT = ["", "¡Bien!", "¡Doble!", "¡Triple!", "¡TETRIS!"];

const DEFAULT_SETTINGS: TetrisSettings = {
  startLevel: 1,
  ghost: true,
  music: true,
  musicVolume: 25,
  sfx: true,
  sfxVolume: 60,
  touchButtons: false
};

/** Teclas del juego: solo estas se interceptan, y solo durante la partida. */
const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "a", "A", "d", "D", "s", "S", "w", "W", "x", "X", "z", "Z", "c", "C", "Shift"]);

@Component({
  selector: "app-tetris",
  imports: [RouterLink, FormsModule, LucideAngularModule, ButtonDirective, PanelComponent, StatComponent, ToggleComponent],
  templateUrl: "./tetris.component.html",
  host: {
    "(document:keydown)": "onKeyDown($event)",
    "(document:keyup)": "onKeyUp($event)",
    "(document:visibilitychange)": "onHidden()",
    "(window:blur)": "onHidden()"
  }
})
export class TetrisComponent implements OnDestroy {
  public readonly icons = { ArrowLeft, ArrowRight, ArrowDown, ChevronDown, ChevronsDown, RotateCw, Archive, Pause, Play };
  public readonly previewIds = PIECE_IDS;

  public readonly phase = signal<Phase>("idle");
  public readonly state = signal<TetrisState | null>(null);
  public readonly settingsOpen = signal(false);
  public readonly helpOpen = signal(false);
  public readonly best = signal(0);
  public readonly newRecord = signal(false);
  public readonly shaking = signal(false);
  public readonly popup = signal<Popup | null>(null);
  public readonly flash = signal<{ id: number; rows: number[] } | null>(null);
  /** Texto para lectores de pantalla: líneas, nivel, pausa y fin de partida */
  public readonly announcement = signal("");

  public readonly startLevel = signal(DEFAULT_SETTINGS.startLevel);
  public readonly showGhost = signal(DEFAULT_SETTINGS.ghost);
  public readonly touchButtons = signal(DEFAULT_SETTINGS.touchButtons);
  public music = DEFAULT_SETTINGS.music;
  public musicVolume = DEFAULT_SETTINGS.musicVolume;
  public sfxOn = DEFAULT_SETTINGS.sfx;
  public sfxVolume = DEFAULT_SETTINGS.sfxVolume;

  public readonly score = computed(() => this.state()?.score ?? 0);
  public readonly level = computed(() => this.state()?.level ?? this.startLevel());
  public readonly lines = computed(() => this.state()?.lines ?? 0);
  public readonly holdId = computed(() => this.state()?.hold ?? null);
  public readonly canHold = computed(() => this.state()?.canHold ?? true);
  public readonly nextIds = computed(() => this.state()?.queue.slice(0, 3) ?? []);

  /** Solo cambia cuando cambia lo que se pinta: la gravedad y el bloqueo mueven contadores cada cuadro. */
  private readonly view = computed(() => this.state(), {
    equal: (a, b) => a === b || (!!a && !!b && a.board === b.board && a.active === b.active && a.status === b.status)
  });

  public readonly cells = computed<BoardCell[]>(() => {
    const s = this.view();
    if (!s) return EMPTY_CELLS;
    const grid: BoardCell[] = [];
    for (let y = HIDDEN_ROWS; y < ROWS; y++) for (let x = 0; x < COLS; x++) grid.push({ id: s.board[y][x], ghost: false });

    const put = (x: number, y: number, cell: BoardCell): void => {
      if (y >= HIDDEN_ROWS) grid[(y - HIDDEN_ROWS) * COLS + x] = cell;
    };
    if (this.showGhost()) {
      const d = dropDistance(s.board, s.active);
      if (d > 0) for (const [x, y] of cellsOf({ ...s.active, y: s.active.y + d })) put(x, y, { id: s.active.id, ghost: true });
    }
    for (const [x, y] of cellsOf(s.active)) put(x, y, { id: s.active.id, ghost: false });
    return grid;
  });

  public readonly boardLabel = computed(() => `Tablero de Tetris. ${this.score()} puntos, nivel ${this.level()}, ${this.lines()} líneas.`);

  private readonly boardEl = viewChild<ElementRef<HTMLElement>>("boardEl");

  private readonly audio = inject(AudioService);
  private readonly sfx = inject(SfxService);
  private readonly celebration = inject(CelebrationService);
  private readonly prefs = inject(PreferencesService);
  private readonly zone = inject(NgZone);

  private readonly rng = (): number => Math.random();
  private raf: number | null = null;
  private lastTime = 0;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private fxId = 0;

  // Entrada mantenida (teclado, botones táctiles y mando)
  private keyLeft = false;
  private keyRight = false;
  private keyDown = false;
  private padLeft = false;
  private padRight = false;
  private padDown = false;
  private curDir: -1 | 0 | 1 = 0;
  private heldMs = 0;
  private charged = false;
  private downMs = 0;
  private padPrev: boolean[] = [];

  // Gesto táctil sobre el tablero
  private touch: { x: number; y: number; t: number; anchorX: number; anchorY: number; cell: number } | null = null;

  public constructor() {
    const saved = this.prefs.load<TetrisSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
    this.startLevel.set(clamp(Math.round(saved.startLevel), 1, 10));
    this.showGhost.set(!!saved.ghost);
    this.music = !!saved.music;
    this.musicVolume = clamp(saved.musicVolume, 0, 100);
    this.sfxOn = !!saved.sfx;
    this.sfxVolume = clamp(saved.sfxVolume, 0, 100);
    // En pantallas táctiles los botones se muestran de entrada, salvo que ya se haya elegido otra cosa.
    const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    this.touchButtons.set(this.hasSavedSettings() ? !!saved.touchButtons : coarse);
    this.best.set(this.prefs.load<number>(BEST_KEY, 0, (v): v is number => typeof v === "number"));
  }

  public ngOnDestroy(): void {
    this.stopLoop();
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.audio.stopAll();
  }

  // ---- Flujo ----

  public startGame(): void {
    this.state.set(createGame(this.rng, this.startLevel()));
    this.newRecord.set(false);
    this.popup.set(null);
    this.flash.set(null);
    this.releaseInput();
    this.applyAudioSettings();
    this.phase.set("playing");
    this.announce("¡Empieza la partida!");
    this.playMusic();
    this.startLoop();
  }

  public restartGame(): void {
    this.audio.stopLoop();
    this.startGame();
  }

  public endGame(): void {
    this.stopLoop();
    this.releaseInput();
    this.audio.stopAll();
    this.state.set(null);
    this.phase.set("idle");
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
      this.startLoop();
    }
  }

  /** Pausa sola al perder el foco: nadie pierde una partida por cambiar de pestaña. */
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
    if (this.phase() !== "playing" || !GAME_KEYS.has(event.key)) return;
    event.preventDefault();

    switch (event.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.press("left");
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.press("right");
        break;
      case "ArrowDown":
      case "s":
      case "S":
        this.press("down");
        break;
      default:
        if (event.repeat) break;
        this.keyAction(event.key);
    }
  }

  public onKeyUp(event: KeyboardEvent): void {
    // Espacio y Enter sobre un botón enfocado dispararían un clic: se evita mientras se juega.
    if (this.phase() === "playing" && GAME_KEYS.has(event.key) && !isTyping(event.target)) event.preventDefault();
    switch (event.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.release("left");
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.release("right");
        break;
      case "ArrowDown":
      case "s":
      case "S":
        this.release("down");
        break;
    }
  }

  private keyAction(key: string): void {
    switch (key) {
      case " ":
        this.dispatch({ type: "hardDrop" });
        break;
      case "ArrowUp":
      case "w":
      case "W":
      case "x":
      case "X":
        this.dispatch({ type: "cw" });
        break;
      case "z":
      case "Z":
        this.dispatch({ type: "ccw" });
        break;
      case "c":
      case "C":
      case "Shift":
        this.dispatch({ type: "hold" });
        break;
    }
  }

  // ---- Botones en pantalla ----

  /** Empieza a mantener una dirección (tecla, botón o gesto). */
  public press(dir: "left" | "right" | "down"): void {
    if (this.phase() !== "playing") return;
    if (dir === "down") {
      if (!this.keyDown) {
        this.keyDown = true;
        this.downMs = 0;
        this.dispatch({ type: "softDrop" });
      }
      return;
    }
    if (dir === "left") this.keyLeft = true;
    else this.keyRight = true;
    const wanted = this.wantedDir();
    if (wanted !== this.curDir) {
      this.curDir = wanted;
      this.heldMs = 0;
      this.charged = false;
      if (wanted) this.dispatch({ type: wanted < 0 ? "left" : "right" });
    }
  }

  public release(dir: "left" | "right" | "down"): void {
    if (dir === "left") this.keyLeft = false;
    else if (dir === "right") this.keyRight = false;
    else this.keyDown = false;
  }

  /** Un solo toque desde el teclado (Enter/Espacio sobre un botón): `detail === 0` distingue el clic de teclado. */
  public tap(event: MouseEvent, action: Action): void {
    if (event.detail !== 0) return;
    this.dispatch(action);
  }

  public act(action: Action): void {
    this.dispatch(action);
  }

  // ---- Gestos táctiles sobre el tablero ----

  public onPointerDown(event: PointerEvent): void {
    if (this.phase() !== "playing") return;
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture?.(event.pointerId);
    const cell = el.getBoundingClientRect().width / COLS;
    this.touch = { x: event.clientX, y: event.clientY, t: performance.now(), anchorX: event.clientX, anchorY: event.clientY, cell };
  }

  public onPointerMove(event: PointerEvent): void {
    const t = this.touch;
    if (!t || this.phase() !== "playing") return;
    while (event.clientX - t.anchorX >= t.cell) {
      t.anchorX += t.cell;
      this.dispatch({ type: "right" });
    }
    while (t.anchorX - event.clientX >= t.cell) {
      t.anchorX -= t.cell;
      this.dispatch({ type: "left" });
    }
    while (event.clientY - t.anchorY >= t.cell) {
      t.anchorY += t.cell;
      this.dispatch({ type: "softDrop" });
    }
  }

  public onPointerUp(event: PointerEvent): void {
    const t = this.touch;
    this.touch = null;
    if (!t || this.phase() !== "playing") return;
    const dx = event.clientX - t.x;
    const dy = event.clientY - t.y;
    const elapsed = performance.now() - t.t;

    if (Math.hypot(dx, dy) < 12 && elapsed < 300) this.dispatch({ type: "cw" });
    else if (dy > t.cell * 3 && elapsed < 350 && Math.abs(dx) < t.cell * 2) this.dispatch({ type: "hardDrop" });
    else if (dy < -t.cell * 2 && elapsed < 350 && Math.abs(dx) < t.cell * 2) this.dispatch({ type: "hold" });
  }

  public onPointerCancel(): void {
    this.touch = null;
  }

  // ---- Presentación ----

  public cellClass(cell: BoardCell): string {
    if (!cell.id) return "bg-white/[0.04]";
    const color = PIECES[cell.id].color;
    return cell.ghost ? `border-2 border-current opacity-40 ${color}` : `candy-block ${color}`;
  }

  /** Miniatura 4×2 de una pieza, centrada, para «Guardada» y «Siguientes». */
  public mini(id: PieceId | null): boolean[] {
    const grid = Array<boolean>(8).fill(false);
    if (!id) return grid;
    const cells = PIECES[id].rotations[0];
    const minX = Math.min(...cells.map(([x]) => x));
    const maxX = Math.max(...cells.map(([x]) => x));
    const minY = Math.min(...cells.map(([, y]) => y));
    const offset = Math.floor((4 - (maxX - minX + 1)) / 2);
    for (const [x, y] of cells) grid[(y - minY) * 4 + (x - minX) + offset] = true;
    return grid;
  }

  public pieceColor(id: PieceId): string {
    return PIECES[id].color;
  }

  public setStartLevel(value: number): void {
    this.startLevel.set(clamp(Math.round(Number(value)), 1, 10));
    this.persist();
  }

  public setGhost(value: boolean): void {
    this.showGhost.set(value);
    this.persist();
  }

  public setTouchButtons(value: boolean): void {
    this.touchButtons.set(value);
    this.persist();
  }

  public persist(): void {
    this.applyAudioSettings();
    this.prefs.save<TetrisSettings>(SETTINGS_KEY, {
      startLevel: this.startLevel(),
      ghost: this.showGhost(),
      music: this.music,
      musicVolume: this.musicVolume,
      sfx: this.sfxOn,
      sfxVolume: this.sfxVolume,
      touchButtons: this.touchButtons()
    });
  }

  // ---- Bucle ----

  private startLoop(): void {
    if (this.raf !== null || typeof requestAnimationFrame !== "function") return;
    this.lastTime = 0;
    // Fuera de la zona: un rAF dentro dispararía detección de cambios en cada cuadro.
    this.zone.runOutsideAngular(() => {
      const frame = (time: number): void => {
        const dt = this.lastTime ? Math.min(time - this.lastTime, MAX_FRAME_MS) : 0;
        this.lastTime = time;
        this.update(dt);
        this.raf = this.phase() === "playing" || this.phase() === "paused" ? requestAnimationFrame(frame) : null;
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
    if (this.phase() !== "playing") return;

    // Dirección mantenida: primer movimiento ya hecho al pulsar; luego DAS y ARR.
    const wanted = this.wantedDir();
    if (wanted !== this.curDir) {
      this.curDir = wanted;
      this.heldMs = 0;
      this.charged = false;
      if (wanted) this.dispatch({ type: wanted < 0 ? "left" : "right" });
    } else if (wanted) {
      this.heldMs += dt;
      let threshold = this.charged ? ARR_MS : DAS_MS;
      while (this.heldMs >= threshold && this.phase() === "playing") {
        this.heldMs -= threshold;
        this.charged = true;
        threshold = ARR_MS;
        this.dispatch({ type: wanted < 0 ? "left" : "right" });
      }
    }

    if (this.keyDown || this.padDown) {
      this.downMs += dt;
      while (this.downMs >= SOFT_DROP_MS && this.phase() === "playing") {
        this.downMs -= SOFT_DROP_MS;
        this.dispatch({ type: "softDrop" });
      }
    }

    if (this.phase() === "playing") this.dispatch({ type: "tick", dt });
  }

  private wantedDir(): -1 | 0 | 1 {
    const left = this.keyLeft || this.padLeft;
    const right = this.keyRight || this.padRight;
    return left === right ? 0 : left ? -1 : 1;
  }

  private releaseInput(): void {
    this.keyLeft = this.keyRight = this.keyDown = false;
    this.padLeft = this.padRight = this.padDown = false;
    this.curDir = 0;
    this.heldMs = 0;
    this.charged = false;
    this.downMs = 0;
    this.touch = null;
  }

  private pollGamepad(): void {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return;
    const pad = Array.from(navigator.getGamepads()).find((p): p is Gamepad => !!p && p.connected);
    if (!pad) {
      this.padLeft = this.padRight = this.padDown = false;
      return;
    }
    const down = (i: number): boolean => !!pad.buttons[i]?.pressed;
    const axis = pad.axes[0] ?? 0;
    const pressed = pad.buttons.map((b) => b.pressed);
    const edge = (i: number): boolean => down(i) && !this.padPrev[i];

    if (edge(9)) this.togglePause();
    if (this.phase() === "playing") {
      this.padLeft = down(14) || axis < -0.5;
      this.padRight = down(15) || axis > 0.5;
      this.padDown = down(13);
      if (edge(0) || edge(3)) this.dispatch({ type: "cw" });
      if (edge(1)) this.dispatch({ type: "ccw" });
      if (edge(2) || edge(12)) this.dispatch({ type: "hardDrop" });
      if (edge(4) || edge(5)) this.dispatch({ type: "hold" });
    } else {
      this.padLeft = this.padRight = this.padDown = false;
    }
    this.padPrev = pressed;
  }

  // ---- Motor y efectos ----

  private dispatch(action: Action): void {
    const current = this.state();
    if (!current || this.phase() !== "playing") return;
    const next = step(current, action, this.rng);
    if (next === current) return;
    this.state.set(next);
    if (next.events.length) this.handleEvents(next.events, next);
  }

  private handleEvents(events: readonly GameEvent[], state: TetrisState): void {
    for (const event of events) {
      switch (event.type) {
        case "move":
          this.sfx.move();
          break;
        case "rotate":
          this.sfx.rotate();
          break;
        case "hold":
          this.sfx.hold();
          break;
        case "hardDrop":
          this.sfx.drop();
          this.shake();
          break;
        case "lock":
          if (!events.some((e) => e.type === "hardDrop" || e.type === "clear")) this.sfx.place();
          break;
        case "clear":
          this.onClear(event, state);
          break;
        case "levelUp":
          this.sfx.levelUp();
          this.showPopup(`Nivel ${event.level} 🚀`, "¡Más rápido!");
          this.announce(`Nivel ${event.level}`);
          break;
        case "over":
          this.onOver(state);
          break;
      }
    }
  }

  private onClear(event: Extract<GameEvent, { type: "clear" }>, state: TetrisState): void {
    this.sfx.clear(event.lines);
    const id = ++this.fxId;
    this.flash.set({ id, rows: event.rows });
    this.later(() => this.flash()?.id === id && this.flash.set(null), 380);

    const extras = [event.backToBack ? "¡Otra vez! ×1.5" : "", state.combo > 0 ? `Combo ×${state.combo}` : ""].filter(Boolean).join(" · ");
    this.showPopup(`${LINE_TEXT[event.lines]} +${event.points}`, extras);
    this.announce(`${event.lines} ${event.lines === 1 ? "línea" : "líneas"}, ${event.points} puntos`);

    const rect = this.boardEl()?.nativeElement.getBoundingClientRect();
    if (rect && event.lines >= 2 && typeof innerWidth === "number") {
      const y = (rect.top + (((event.rows[0] - HIDDEN_ROWS) / VISIBLE_ROWS) * rect.height || 0)) / innerHeight;
      void this.celebration.burst((rect.left + rect.width / 2) / innerWidth, y, event.lines * 25);
    }
  }

  private onOver(state: TetrisState): void {
    this.phase.set("over");
    this.releaseInput();
    this.audio.stopLoop();
    this.sfx.lose();
    const record = state.score > this.best();
    if (record) {
      this.best.set(state.score);
      this.prefs.save<number>(BEST_KEY, state.score);
      this.newRecord.set(true);
      void this.celebration.celebrate();
    }
    this.announce(`Fin de la partida. ${state.score} puntos.${record ? " ¡Nuevo récord!" : ""}`);
  }

  private shake(): void {
    this.shaking.set(true);
    this.later(() => this.shaking.set(false), 260);
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
