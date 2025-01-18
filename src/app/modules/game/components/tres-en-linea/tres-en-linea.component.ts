// @ts-ignore
import Minimax from "tic-tac-toe-minimax";

const { GameStep } = Minimax;

import { Component, OnDestroy, OnInit } from "@angular/core";
import { SoundService } from "../../../../common/services/sound.service";
import { dataLevels } from "../../../../common/constants";
import { Board, board, settings, backgroundAudio, endgameAudio } from "./constants";
import { PatternInterface } from "../../../../common/interfaces/pattern.interface";
import { Store } from "@ngrx/store";

type Difficulty = "Easy" | "Normal" | "Hard";

@Component({
  selector: "app-tres-en-linea",
  templateUrl: "./tres-en-linea.component.html",
  styleUrls: ["./tres-en-linea.component.scss"]
})
export class TresEnLineaComponent implements OnInit, OnDestroy, PatternInterface {
  readonly levels = dataLevels;

  panelOpenState: boolean = false;
  gameBoard: Array<Board> = board;
  gameState: Array<any> = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  winner: string | undefined;
  playing: boolean = false;
  defaultLevel: Difficulty = "Normal";
  defaultSettings = settings;

  breakpoint: number = 1;
  breakpoint2: number = 8;
  breakpoint3: number = 6;

  computerFirst: boolean = true;

  constructor(
    readonly soundService: SoundService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.breakpoint = window.innerWidth <= 319 ? 3 : 1;

    // Inicializa los audios
    this.soundService.initAudio("background", `${backgroundAudio}`, this.defaultSettings.background.volume, true);
    this.soundService.initAudio("endgame", `${endgameAudio}`, this.defaultSettings.endgame.volume);
  }

  ngOnDestroy() {
    this.stopAudios();
  }

  defaultStartGame(toggle: boolean, cb?: Function): void {
    this.panelOpenState = false;
    this.gameBoard = board;
    this.gameState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    this.winner = undefined;

    if (this.checkEnabled("background")) this.soundService.playAudio("background");
    if (toggle && this.computerFirst) this.makeComputerMove();

    if (cb) cb();
    this.playing = toggle;
  }

  async endGame(toggle: boolean): Promise<void> {
    console.log("[TresEnLineaComponent.endGame]");

    this.playing = toggle;
    this.stopAudios();
  }

  async restartGame(toggle: boolean): Promise<void> {
    console.log("[TresEnLineaComponent.restartGame]");

    this.soundService.stopAudio("background");

    this.defaultStartGame(toggle);
  }

  async startGame(toggle: boolean = false): Promise<void> {
    console.log("[TresEnLineaComponent.startGame]");

    this.defaultStartGame(toggle);
  }

  stopAudios(): void {
    this.soundService.stopAudio("background");
    this.soundService.stopAudio("endgame");
  }

  onResize(event: Event) {
    const w = event.target as Window;
    this.breakpoint = w.innerWidth <= 319 ? 2 : 1;
  }

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + "k";
    }

    return `${value}`;
  }

  makeHumanMove(field: number): void {
    if (!this.playing || typeof this.gameState[field] !== "number") {
      return;
    }

    this.gameState[field] = "X";
    setTimeout(async () => {
      await this.makeComputerMove();
    }, 250);
  }

  /**
   * Turno de la computadora
   * @private
   */
  private async makeComputerMove(): Promise<void> {
    const symbols = {
      huPlayer: "X",
      aiPlayer: "O"
    };

    const winnerMapping: { [index: string]: any } = {
      huPlayer: "¡Ganaste tú 🧑!",
      aiPlayer: "¡Ganó el robot 🤖!",
      draw: "¡Es un empate!"
    };

    const result = GameStep(this.gameState, symbols, this.defaultLevel);
    this.gameState = result.board;

    if (!result.winner) return;

    this.winner = winnerMapping[result.winner];
    this.playing = false;

    if (this.soundService.getAudio("background")) this.soundService.stopAudio("background");
    if (settings.endgame.enabled) this.soundService.playAudio("endgame");
  }

  onToggleChange(key: string, toggle: boolean): void {
    if (toggle) {
      if (settings[key].enabled) this.soundService.playAudio(key);
    } else {
      this.soundService.stopAudio(key);
    }
  }

  checkEnabled(key: string): boolean {
    return settings[key].enabled;
  }

  onVolumeChange(key: string, volume: number): void {
    this.soundService.setAudioVolume(key, volume);
  }
}
