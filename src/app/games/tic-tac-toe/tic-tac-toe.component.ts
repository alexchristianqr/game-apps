// @ts-ignore -- la librería no trae tipos (deuda conocida en SPEC-004)
import Minimax from "tic-tac-toe-minimax";
import { Component, computed, inject, OnDestroy, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ArrowLeft, ChevronDown, LucideAngularModule, RotateCcw, Trash2 } from "lucide-angular";
import { AudioService } from "../../core/services/audio/audio.service";
import { CelebrationService } from "../../core/services/celebration/celebration.service";
import { PreferencesService } from "../../core/services/preferences/preferences.service";
import { SfxService } from "../../core/services/sfx/sfx.service";
import { ButtonDirective } from "../../core/ui/button/button.directive";
import { PanelComponent } from "../../core/ui/panel/panel.component";
import { SegmentedComponent, type SegmentedOption } from "../../core/ui/segmented/segmented.component";
import { StatComponent } from "../../core/ui/stat/stat.component";
import { ToggleComponent } from "../../core/ui/toggle/toggle.component";
import {
  applyResult,
  type Cell,
  EMPTY_SCORE,
  emptyBoard,
  isFree,
  keyToIndex,
  type Mark,
  type Mode,
  moveFocus,
  other,
  outcomeOf,
  PIECE_THEMES,
  type PieceTheme,
  type Result,
  type Scoreboard,
  type ThemeId,
  winningLine
} from "./tic-tac-toe.logic";

const { GameStep } = Minimax;

type Difficulty = "Easy" | "Normal" | "Hard";

interface GameStepResult {
  board: Cell[];
}

interface Settings {
  mode: Mode;
  theme: ThemeId;
  difficulty: Difficulty;
  computerFirst: boolean;
  allowSoundEndGame: boolean;
  volumeSoundEndGame: number;
  allowSoundThemeGame: boolean;
  volumeSoundThemeGame: number;
}

const DEFAULTS: Settings = {
  mode: "robot",
  theme: "classic",
  difficulty: "Normal",
  computerFirst: true,
  allowSoundEndGame: true,
  volumeSoundEndGame: 100,
  allowSoundThemeGame: true,
  volumeSoundThemeGame: 25
};

const MODES: readonly SegmentedOption[] = [
  { value: "robot", label: "Contra el robot", icon: "🤖" },
  { value: "duo", label: "2 jugadores", icon: "👯" }
];

const LEVELS: readonly SegmentedOption[] = [
  { value: "Easy", label: "Fácil", icon: "😄" },
  { value: "Normal", label: "Normal", icon: "😎" },
  { value: "Hard", label: "Difícil", icon: "🔥" }
];

const THEME_OPTIONS: readonly SegmentedOption[] = PIECE_THEMES.map((t) => ({ value: t.id, label: t.label, icon: t.x.glyph === "X" ? "✖️" : t.x.glyph }));

const ROBOT_DELAY_MS = 450;
const SETTINGS_KEY = "ttt-settings";

@Component({
  selector: "app-tic-tac-toe",
  imports: [RouterLink, FormsModule, LucideAngularModule, ButtonDirective, PanelComponent, ToggleComponent, SegmentedComponent, StatComponent],
  templateUrl: "./tic-tac-toe.component.html",
  host: { "(document:keydown)": "onDocumentKey($event)" }
})
export class TicTacToeComponent implements OnDestroy {
  public readonly icons = { ArrowLeft, ChevronDown, RotateCcw, Trash2 };
  public readonly marks: readonly Mark[] = ["X", "O"];
  public readonly modeOptions = MODES;
  public readonly levelOptions = LEVELS;
  public readonly themeOptions = THEME_OPTIONS;

  public readonly board = signal<Cell[]>(emptyBoard());
  public readonly playing = signal(false);
  /** Resultado de la última partida: marca ganadora, empate o null */
  public readonly outcome = signal<Mark | "draw" | null>(null);
  public readonly winLine = signal<number[]>([]);
  public readonly turn = signal<Mark>("X");
  /** Verdadero mientras el robot «piensa» */
  public readonly robotTurn = signal(false);
  public readonly settingsOpen = signal(false);
  public readonly confirmReset = signal(false);
  public readonly focusIndex = signal(4);

  public readonly mode = signal<Mode>(DEFAULTS.mode);
  public readonly themeId = signal<ThemeId>(DEFAULTS.theme);
  private readonly scores = signal<Record<Mode, Scoreboard>>({ robot: EMPTY_SCORE, duo: EMPTY_SCORE });

  public readonly theme = computed<PieceTheme>(() => PIECE_THEMES.find((t) => t.id === this.themeId()) ?? PIECE_THEMES[0]);
  public readonly score = computed(() => this.scores()[this.mode()]);
  public readonly canPlay = computed(() => this.playing() && !this.robotTurn());

  /** Línea ganadora como segmento SVG en un lienzo 3×3 (centro de la primera y última casilla). */
  public readonly winSegment = computed(() => {
    const line = this.winLine();
    if (line.length !== 3) return null;
    const point = (i: number): { x: number; y: number } => ({ x: (i % 3) + 0.5, y: Math.floor(i / 3) + 0.5 });
    return { a: point(line[0]), b: point(line[2]) };
  });

  public readonly message = computed<string | null>(() => {
    const outcome = this.outcome();
    if (!outcome) return null;
    if (outcome === "draw") return "¡Es un empate!";
    if (this.mode() === "robot") return outcome === "X" ? "¡Ganaste tú 🧑!" : "¡Ganó el robot 🤖!";
    return `¡Ganó el ${this.playerName(outcome)} 🎉!`;
  });

  public readonly resultEmoji = computed(() => {
    const outcome = this.outcome();
    if (outcome === "draw") return "🤝";
    if (this.mode() === "robot") return outcome === "X" ? "🏆" : "🤖";
    return "🏆";
  });

  // Ajustes que no cambian lo que se pinta: propiedades simples enlazadas con ngModel.
  public difficulty: Difficulty = DEFAULTS.difficulty;
  public computerFirst = DEFAULTS.computerFirst;
  public allowSoundEndGame = DEFAULTS.allowSoundEndGame;
  public volumeSoundEndGame = DEFAULTS.volumeSoundEndGame;
  public allowSoundThemeGame = DEFAULTS.allowSoundThemeGame;
  public volumeSoundThemeGame = DEFAULTS.volumeSoundThemeGame;

  private readonly audio = inject(AudioService);
  private readonly sfx = inject(SfxService);
  private readonly celebration = inject(CelebrationService);
  private readonly prefs = inject(PreferencesService);
  private robotTimer: ReturnType<typeof setTimeout> | undefined;
  /** En 2 jugadores el que empieza se alterna para que sea justo. */
  private duoStarter: Mark = "X";

  public constructor() {
    const saved = this.prefs.load<Settings>(SETTINGS_KEY, DEFAULTS);
    this.mode.set(saved.mode === "duo" ? "duo" : "robot");
    this.themeId.set(PIECE_THEMES.some((t) => t.id === saved.theme) ? saved.theme : DEFAULTS.theme);
    this.difficulty = saved.difficulty;
    this.computerFirst = saved.computerFirst;
    this.allowSoundEndGame = saved.allowSoundEndGame;
    this.volumeSoundEndGame = saved.volumeSoundEndGame;
    this.allowSoundThemeGame = saved.allowSoundThemeGame;
    this.volumeSoundThemeGame = saved.volumeSoundThemeGame;
    this.scores.set({
      robot: this.prefs.load<Scoreboard>("ttt-score-robot", EMPTY_SCORE),
      duo: this.prefs.load<Scoreboard>("ttt-score-duo", EMPTY_SCORE)
    });
  }

  public ngOnDestroy(): void {
    clearTimeout(this.robotTimer);
    this.stopSounds();
  }

  // ---- Presentación ----

  public playerName(mark: Mark): string {
    if (this.mode() === "robot") return mark === "X" ? "Tú" : "Robot";
    return mark === "X" ? "Jugador 1" : "Jugador 2";
  }

  public glyph(mark: Mark): string {
    const t = this.theme();
    return mark === "X" ? t.x.glyph : t.o.glyph;
  }

  public cellLabel(index: number): string {
    const cell = this.board()[index];
    if (isFree(cell)) return `Casilla ${index + 1}, vacía`;
    const t = this.theme();
    return `Casilla ${index + 1}, ${cell === "X" ? t.x.name : t.o.name}`;
  }

  /** Colores de la casilla: ganadora, X (cian), O (rosa) o vacía. */
  public cellClass(cell: Cell, index: number): string {
    if (this.winLine().includes(index)) return "bg-neon-lime/20 ring-neon-lime shadow-glow-lime text-white";
    if (cell === "X") return "bg-neon-cyan/15 ring-neon-cyan/60 text-neon-cyan";
    if (cell === "O") return "bg-neon-pink/15 ring-neon-pink/60 text-neon-pink";
    return "bg-white/5 ring-white/10";
  }

  public cellGlyph(cell: Cell): string {
    return isFree(cell) ? "" : this.glyph(cell);
  }

  // ---- Ajustes ----

  public setMode(value: string): void {
    this.mode.set(value === "duo" ? "duo" : "robot");
    this.persist();
  }

  public setTheme(value: string): void {
    if (PIECE_THEMES.some((t) => t.id === value)) this.themeId.set(value as ThemeId);
    this.persist();
  }

  public persist(): void {
    this.prefs.save<Settings>(SETTINGS_KEY, {
      mode: this.mode(),
      theme: this.themeId(),
      difficulty: this.difficulty,
      computerFirst: this.computerFirst,
      allowSoundEndGame: this.allowSoundEndGame,
      volumeSoundEndGame: this.volumeSoundEndGame,
      allowSoundThemeGame: this.allowSoundThemeGame,
      volumeSoundThemeGame: this.volumeSoundThemeGame
    });
  }

  public resetScore(): void {
    if (!this.confirmReset()) {
      this.confirmReset.set(true);
      return;
    }
    this.confirmReset.set(false);
    this.setScore(this.mode(), EMPTY_SCORE);
  }

  // ---- Flujo de la partida ----

  public startGame(): void {
    this.resetBoard(true);
    this.sfx.muted = !this.allowSoundThemeGame;
    this.sfx.volume = this.volumeSoundThemeGame * 2;
    if (this.allowSoundThemeGame) this.takeSoundThemeGame();

    if (this.mode() === "duo") {
      this.turn.set(this.duoStarter);
      this.duoStarter = other(this.duoStarter);
    } else if (this.computerFirst) {
      this.turn.set("O");
      this.makeComputerMove();
    }
  }

  public restartGame(): void {
    this.audio.stopLoop();
    this.startGame();
  }

  public endGame(): void {
    this.resetBoard(false);
    this.stopSounds();
  }

  public stopSounds(): void {
    this.audio.stopAll();
  }

  public takeSoundThemeGame(): void {
    this.audio.playLoop("assets/sounds/theme_game.mp3", this.volumeSoundThemeGame);
  }

  public takeSoundEndGame(): void {
    this.audio.stopLoop();
    this.audio.playEffect("assets/sounds/end_game.mp3", this.volumeSoundEndGame);
  }

  /** Jugada de la persona en turno (en modo robot, siempre X). */
  public makeHumanMove(index: number): void {
    if (!this.canPlay() || !isFree(this.board()[index])) return;

    const mark = this.mode() === "robot" ? "X" : this.turn();
    this.board.update((b) => b.map((cell, i) => (i === index ? mark : cell)));
    this.sfx.place();

    if (this.settleIfOver()) return;

    if (this.mode() === "duo") {
      this.turn.set(other(mark));
      return;
    }
    this.turn.set("O");
    this.robotTurn.set(true);
    this.robotTimer = setTimeout(() => this.makeComputerMove(), ROBOT_DELAY_MS);
  }

  // ---- Teclado ----

  public onBoardKey(event: KeyboardEvent): void {
    if (!event.key.startsWith("Arrow")) return;
    event.preventDefault();
    const next = moveFocus(this.focusIndex(), event.key);
    this.focusIndex.set(next);
    const buttons = (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>("button");
    buttons[next]?.focus();
  }

  /** Teclas 1–9 juegan la casilla en cualquier momento, salvo mientras se escribe en un campo. */
  public onDocumentKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const index = keyToIndex(event.key);
    if (index !== null) this.makeHumanMove(index);
  }

  // ---- Interno ----

  private resetBoard(playing: boolean): void {
    clearTimeout(this.robotTimer);
    this.settingsOpen.set(false);
    this.confirmReset.set(false);
    this.board.set(emptyBoard());
    this.outcome.set(null);
    this.winLine.set([]);
    this.robotTurn.set(false);
    this.turn.set("X");
    this.playing.set(playing);
  }

  /** Turno del robot */
  private makeComputerMove(): void {
    const result: GameStepResult = GameStep(this.board(), { huPlayer: "X", aiPlayer: "O" }, this.difficulty);
    this.board.set(result.board);
    this.robotTurn.set(false);
    this.sfx.place();
    if (this.settleIfOver()) return;
    this.turn.set("X");
  }

  /** Si la partida terminó, registra el resultado y celebra. Devuelve true si terminó. */
  private settleIfOver(): boolean {
    const board = this.board();
    const outcome = outcomeOf(board);
    if (!outcome) return false;

    this.outcome.set(outcome);
    this.winLine.set(winningLine(board) ?? []);
    this.playing.set(false);
    this.robotTurn.set(false);

    const result: Result = outcome === "draw" ? "draw" : outcome === "X" ? "win" : "loss";
    this.setScore(this.mode(), applyResult(this.score(), result));

    this.audio.stopLoop();
    if (this.allowSoundEndGame) this.takeSoundEndGame();
    // En modo robot solo se celebra la victoria de la persona; en dúo, cualquiera.
    if (outcome !== "draw" && (this.mode() === "duo" || outcome === "X")) void this.celebration.celebrate();
    return true;
  }

  private setScore(mode: Mode, score: Scoreboard): void {
    this.scores.update((all) => ({ ...all, [mode]: score }));
    this.prefs.save<Scoreboard>(`ttt-score-${mode}`, score);
  }
}
