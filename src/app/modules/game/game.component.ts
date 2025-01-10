// @ts-ignore
import Minimax from "tic-tac-toe-minimax";

const { GameStep } = Minimax;
import { Component, OnDestroy, OnInit } from "@angular/core";

interface Level {
  value: string;
  text: string;
}

interface Board {
  value: number;
  bgColor: string;
}

@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"]
})
export class GameComponent implements OnInit, OnDestroy {
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
  public difficulty: "Easy" | "Normal" | "Hard" = "Normal";
  breakpoint: number = 1;
  breakpoint2: number = 8;
  breakpoint3: number = 6;

  // Ajustes del juego
  public computerFirst = true;
  public allowSoundEndGame = true;
  public volumeSoundEndGame = 100;
  public allowSoundThemeGame = true;
  public volumeSoundThemeGame = 25;

  // Sonidos del juego
  private themeAudio: HTMLAudioElement | null = null;
  private endAudio: HTMLAudioElement | null = null;

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
    this.stopSoundThemeGame();
    this.stopSoundEndGame();
  }

  public restartGame(toggle: boolean): void {
    this.stopSoundThemeGame();
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
    this.themeAudio = new Audio("assets/sounds/theme_game.mp3");
    this.themeAudio.volume = this.volumeSoundThemeGame / 100;
    this.themeAudio.loop = true;
    this.themeAudio.play().catch(console.error);
  }

  public takeSoundEndGame(): void {
    this.endAudio = new Audio("assets/sounds/end_game.mp3");
    this.endAudio.volume = this.volumeSoundEndGame / 100;
    this.endAudio.play().catch(console.error);

    this.stopSoundThemeGame();

    setTimeout(() => {
      this.stopSoundEndGame();
    }, 2000);
  }

  // Detener los sonidos
  stopSoundThemeGame(): void {
    if (this.themeAudio) {
      this.themeAudio.pause();
      this.themeAudio = null;
    }
  }

  stopSoundEndGame(): void {
    if (this.endAudio) {
      this.endAudio.pause();
      this.endAudio = null;
    }
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

    if (result.winner) {
      this.winner = winnerMapping[result.winner];
      this.playing = false;
      if (this.allowSoundEndGame) this.takeSoundEndGame();
    }
  }

  /**
   * Verificar jugador ganador
   * @param board
   * @private
   */
  private checkForWinner(board: Array<any>) {
    // console.log({ board })

    let tmp: Array<any> = [];

    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
        tmp.push(board[i][0]);
      }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
      if (board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
        tmp.push(board[0][i]);
      }
    }

    // Check diagonals
    if (board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      tmp.push(board[0][0]);
    }
    if (board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      tmp.push(board[0][2]);
    }

    return null;
  }
}
