// @ts-ignore
import Minimax from "tic-tac-toe-minimax";

const { GameStep } = Minimax;
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import { MatSelectModule } from "@angular/material/select";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSliderModule } from "@angular/material/slider";
import { AudioService } from "../../core/services/audio/audio.service";

interface Level {
  value: string;
  text: string;
}

interface Board {
  value: number;
  bgColor: string;
}

type Difficulty = "Easy" | "Normal" | "Hard";

@Component({
  selector: "app-tic-tac-toe",
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule
  ],
  templateUrl: "./tic-tac-toe.component.html",
  styleUrls: ["./tic-tac-toe.component.scss"]
})
export class TicTacToeComponent implements OnInit, OnDestroy {
  panelOpenState = false;
  public gameBoard: Array<Board> = [
    { value: 0, bgColor: "div0" },
    { value: 1, bgColor: "div1" },
    { value: 2, bgColor: "div2" },
    { value: 3, bgColor: "div3" },
    { value: 4, bgColor: "div4" },
    { value: 5, bgColor: "div5" },
    { value: 6, bgColor: "div6" },
    { value: 7, bgColor: "div7" },
    { value: 8, bgColor: "div8" }
  ];
  public gameState: Array<any> = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  public winner: string | undefined;
  public playing = false;
  public dataLevels: Level[] = [
    { value: "Easy", text: "Fácil" },
    { value: "Normal", text: "Normal" },
    { value: "Hard", text: "Difícil" }
  ];
  public difficulty: Difficulty = "Normal";
  breakpoint: number = 1;
  breakpoint2: number = 8;
  breakpoint3: number = 6;

  // Ajustes del juego
  public computerFirst = true;
  public allowSoundEndGame = true;
  public volumeSoundEndGame = 100;
  public allowSoundThemeGame = true;
  public volumeSoundThemeGame = 25;

  private readonly audio = inject(AudioService);

  ngOnInit() {
    this.breakpoint = window.innerWidth <= 319 ? 3 : 1;
  }

  ngOnDestroy() {
    this.stopSounds();
  }

  public onResize(event: Event) {
    const w = event.target as Window;
    this.breakpoint = w.innerWidth <= 319 ? 2 : 1;
  }

  public formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + "k";
    }

    return `${value}`;
  }

  /**
   * Jugar
   * @param toggle
   * @param cb
   */

  public clickPlayGame(toggle: boolean = false, cb?: Function): void {
    this.panelOpenState = false;
    this.gameBoard = [
      { value: 0, bgColor: "div0" },
      { value: 1, bgColor: "div1" },
      { value: 2, bgColor: "div2" },
      { value: 3, bgColor: "div3" },
      { value: 4, bgColor: "div4" },
      { value: 5, bgColor: "div5" },
      { value: 6, bgColor: "div6" },
      { value: 7, bgColor: "div7" },
      { value: 8, bgColor: "div8" }
    ];
    this.gameState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    this.winner = undefined;
    if (cb) cb();
    this.playing = toggle;
  }

  public endGame(): void {
    this.clickPlayGame(false, () => {
      this.stopSounds();
    });
  }

  public stopSounds(): void {
    this.audio.stopAll();
  }

  public restartGame(toggle: boolean): void {
    this.audio.stopLoop();
    this.clickPlayGame(true, () => {
      if (this.allowSoundThemeGame) this.takeSoundThemeGame();
      if (toggle && this.computerFirst) this.makeComputerMove();
    });
  }

  public startGame(toggle: boolean): void {
    this.clickPlayGame(toggle, () => {
      if (this.allowSoundThemeGame) this.takeSoundThemeGame();
      if (toggle && this.computerFirst) this.makeComputerMove();
    });
  }

  public takeSoundThemeGame(): void {
    this.audio.playLoop("assets/sounds/theme_game.mp3", this.volumeSoundThemeGame);
  }

  public takeSoundEndGame(): void {
    this.audio.stopLoop();
    this.audio.playEffect("assets/sounds/end_game.mp3", this.volumeSoundEndGame);
  }

  /**
   * Turno del humano
   * @param field
   */
  public makeHumanMove(field: number): void {
    if (!this.playing || typeof this.gameState[field] !== "number") {
      return;
    }

    this.gameState[field] = "X";
    setTimeout(() => {
      this.makeComputerMove();
    }, 250);
  }

  /**
   * Turno de la computadora
   * @private
   */
  private makeComputerMove(): void {
    const symbols = {
      huPlayer: "X",
      aiPlayer: "O"
    };

    const winnerMapping: { [index: string]: any } = {
      huPlayer: "¡Ganaste tú 🧑!",
      aiPlayer: "¡Ganó el robot 🤖!",
      draw: "¡Es un empate!"
    };

    const result = GameStep(this.gameState, symbols, this.difficulty);
    this.gameState = result.board;

    if (!result.winner) return;

    this.winner = winnerMapping[result.winner];
    this.playing = false;

    this.audio.stopLoop();
    if (this.allowSoundEndGame) this.takeSoundEndGame();
  }
}
