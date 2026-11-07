// @ts-ignore -- la librería no trae tipos (deuda conocida en SPEC-004)
import Minimax from "tic-tac-toe-minimax";
import { Component, inject, OnDestroy, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ArrowLeft, ChevronDown, LucideAngularModule } from "lucide-angular";
import { AudioService } from "../../core/services/audio/audio.service";
import { CelebrationService } from "../../core/services/celebration/celebration.service";
import { ButtonDirective } from "../../core/ui/button/button.directive";
import { PanelComponent } from "../../core/ui/panel/panel.component";
import { ToggleComponent } from "../../core/ui/toggle/toggle.component";
import { Cell, emptyBoard, isFree, winningLine } from "./tic-tac-toe.logic";

const { GameStep } = Minimax;

type Difficulty = "Easy" | "Normal" | "Hard";
type Outcome = "huPlayer" | "aiPlayer" | "draw";

interface GameStepResult {
  board: Cell[];
  winner?: Outcome | null;
}

const MESSAGES: Record<Outcome, string> = {
  huPlayer: "¡Ganaste tú 🧑!",
  aiPlayer: "¡Ganó el robot 🤖!",
  draw: "¡Es un empate!"
};

@Component({
  selector: "app-tic-tac-toe",
  imports: [RouterLink, FormsModule, LucideAngularModule, ButtonDirective, PanelComponent, ToggleComponent],
  templateUrl: "./tic-tac-toe.component.html"
})
export class TicTacToeComponent implements OnDestroy {
  public readonly icons = { ArrowLeft, ChevronDown };

  public readonly board = signal<Cell[]>(emptyBoard());
  public readonly playing = signal(false);
  public readonly outcome = signal<Outcome | null>(null);
  public readonly winLine = signal<number[]>([]);
  /** Verdadero mientras el robot "piensa" (los 250 ms entre jugadas). */
  public readonly robotTurn = signal(false);
  public readonly settingsOpen = signal(false);

  public readonly dataLevels: { value: Difficulty; text: string }[] = [
    { value: "Easy", text: "Fácil" },
    { value: "Normal", text: "Normal" },
    { value: "Hard", text: "Difícil" }
  ];
  public difficulty: Difficulty = "Normal";

  // Ajustes del juego
  public computerFirst = true;
  public allowSoundEndGame = true;
  public volumeSoundEndGame = 100;
  public allowSoundThemeGame = true;
  public volumeSoundThemeGame = 25;

  private readonly audio = inject(AudioService);
  private readonly celebration = inject(CelebrationService);
  private robotTimer: ReturnType<typeof setTimeout> | undefined;

  public get message(): string | null {
    const outcome = this.outcome();
    return outcome ? MESSAGES[outcome] : null;
  }

  public ngOnDestroy(): void {
    clearTimeout(this.robotTimer);
    this.stopSounds();
  }

  public cellLabel(index: number): string {
    const cell = this.board()[index];
    return `Casilla ${index + 1}, ${isFree(cell) ? "vacía" : cell}`;
  }

  /** Colores de la casilla: ganadora, X (cian), O (rosa) o vacía. */
  public cellClass(cell: Cell, index: number): string {
    if (this.winLine().includes(index)) return "bg-neon-lime/20 ring-neon-lime shadow-glow-lime text-white";
    const color = cell === "X" ? "text-neon-cyan" : cell === "O" ? "text-neon-pink" : "";
    return `bg-white/5 ring-white/10 ${color}`;
  }

  public cellText(cell: Cell): string {
    return isFree(cell) ? "" : cell;
  }

  public startGame(): void {
    this.resetBoard(true);
    if (this.allowSoundThemeGame) this.takeSoundThemeGame();
    if (this.computerFirst) this.makeComputerMove();
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

  /** Turno del humano */
  public makeHumanMove(index: number): void {
    if (!this.playing() || this.robotTurn() || !isFree(this.board()[index])) return;

    this.board.update((b) => b.map((cell, i) => (i === index ? "X" : cell)));
    this.robotTurn.set(true);
    this.robotTimer = setTimeout(() => this.makeComputerMove(), 250);
  }

  private resetBoard(playing: boolean): void {
    clearTimeout(this.robotTimer);
    this.settingsOpen.set(false);
    this.board.set(emptyBoard());
    this.outcome.set(null);
    this.winLine.set([]);
    this.robotTurn.set(false);
    this.playing.set(playing);
  }

  /** Turno de la computadora */
  private makeComputerMove(): void {
    const result: GameStepResult = GameStep(this.board(), { huPlayer: "X", aiPlayer: "O" }, this.difficulty);
    this.board.set(result.board);
    this.robotTurn.set(false);

    if (!result.winner) return;

    this.outcome.set(result.winner);
    this.winLine.set(winningLine(result.board) ?? []);
    this.playing.set(false);

    this.audio.stopLoop();
    if (this.allowSoundEndGame) this.takeSoundEndGame();
    if (result.winner === "huPlayer") void this.celebration.celebrate();
  }
}
