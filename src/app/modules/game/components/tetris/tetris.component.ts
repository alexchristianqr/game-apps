import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import Konva from "konva";
import { SoundService } from "../../../../common/services/sound.service";
import { PatternInterface } from "../../../../common/interfaces/pattern.interface";
import { dataLevels } from "../../../../common/constants";
import { pieces, endgameAudio, backgroundAudio, settings } from "./constants";

type Difficulty = "Easy" | "Normal" | "Hard";

@Component({
  selector: "app-tetris",
  templateUrl: "./tetris.component.html",
  styleUrls: ["./tetris.component.scss"]
})
export class TetrisComponent implements OnInit, OnDestroy, PatternInterface {
  stage!: Konva.Stage;
  layer!: Konva.Layer;

  readonly boardWidth = 12;
  readonly boardHeight = 20;
  readonly cellSize = 20;
  readonly levels = dataLevels;

  panelOpenState: boolean = false;
  winner: string | undefined;
  playing: boolean = false;
  defaultLevel: Difficulty = "Normal";
  defaultSettings = settings;

  board: string[][] = [];
  currentPiece: any;
  gameInterval: any;

  constructor(readonly soundService: SoundService) {}

  ngOnInit(): void {
    this.initBoard(); // Inicializar el tablero
    this.initKonva(); // Inicializar Konva

    // Inicializa los audios
    this.soundService.initAudio("background", `${backgroundAudio}`, this.defaultSettings.background.volume, true);
    this.soundService.initAudio("endgame", `${endgameAudio}`, this.defaultSettings.endgame.volume);
  }

  ngOnDestroy() {
    clearInterval(this.gameInterval); // Detener el intervalo
    this.stopAudios();
  }

  defaultStart(toggle: boolean = false, cb?: Function): void {
    this.spawnPiece(); // Generar una nueva pieza

    this.gameInterval = setInterval(() => {
      // Si el juego ha terminado, detener el intervalo y mostrar un mensaje
      if (this.isGameOver()) {
        clearInterval(this.gameInterval); // Detener el intervalo
        this.soundService.playAudio("endgame");
      } else {
        this.movePiece(0, 1); // Mover la pieza hacia abajo
      }
    }, 500);

    if (cb) cb();

    if (this.checkEnabled("background")) this.soundService.playAudio("background");

    this.playing = toggle;
  }

  async endGame(toggle: boolean): Promise<void> {
    console.log("[TetrisComponent.endGame]");

    this.playing = toggle;
    this.stopAudios();

    if (!this.gameInterval) return;
    clearInterval(this.gameInterval);

    this.initBoard(); // Inicializar el tablero
    this.initKonva(); // Inicializar Konva
  }

  async restartGame(toggle: boolean): Promise<void> {
    console.log("[TetrisComponent.restartGame]");

    clearInterval(this.gameInterval); // Detener el intervalo

    this.defaultStart(toggle);
  }

  async startGame(toggle: boolean): Promise<void> {
    console.log("[TetrisComponent.startGame]");

    this.defaultStart(toggle);
  }

  stopAudios(): void {
    this.soundService.stopAudio("background");
    this.soundService.stopAudio("endgame");
  }

  // Formatear la etiqueta del eje Y
  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + "k";
    }

    return `${value}`;
  }

  // Inicializar el tablero
  initBoard(): void {
    this.board = Array.from({ length: this.boardHeight }, () => new Array(this.boardWidth).fill(""));
  }

  // Inicializar Konva
  initKonva(): void {
    this.stage = new Konva.Stage({
      container: "tetris-board",
      width: this.boardWidth * this.cellSize,
      height: this.boardHeight * this.cellSize
    });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    this.drawBoard(); // Dibujar el tablero
  }

  // Dibujar el tablero
  drawBoard(): void {
    this.layer.destroyChildren(); // Limpiar la capa

    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
        // Crear una celda
        const cell = new Konva.Rect({
          x: x * this.cellSize,
          y: y * this.cellSize,
          width: this.cellSize,
          height: this.cellSize,
          fill: this.board[y][x] || "black",
          stroke: "grey",
          strokeWidth: 1
        });

        // Agregar la celda a la capa
        this.layer.add(cell);
      }
    }

    this.layer.draw(); // Dibujar la capa
  }

  // Generar una nueva pieza
  spawnPiece(): void {
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    this.currentPiece = {
      shape: randomPiece.shape,
      color: randomPiece.color,
      x: Math.floor(this.boardWidth / 2) - 1,
      y: 0
    };
    this.draw();
  }

  /**
   * Dibuja la pieza en el tablero
   * @private
   */
  private draw(): void {
    this.drawBoard();

    const { shape, color, x, y } = this.currentPiece;

    // Dibujar la pieza
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const cell = new Konva.Rect({
            x: (x + col) * this.cellSize,
            y: (y + row) * this.cellSize,
            width: this.cellSize,
            height: this.cellSize,
            fill: color,
            stroke: "grey",
            strokeWidth: 1
          });
          this.layer.add(cell);
        }
      }
    }

    // Dibujar el tablero
    this.layer.draw();
  }

  /**
   * Mueve la pieza en el tablero
   * @param offsetX
   * @param offsetY
   * @private
   */
  private movePiece(offsetX: number, offsetY: number): void {
    this.currentPiece.x += offsetX;
    this.currentPiece.y += offsetY;

    // Si la pieza no puede moverse, deshacer el movimiento
    if (!this.canMove(0, 0)) {
      this.currentPiece.x -= offsetX;
      this.currentPiece.y -= offsetY;

      if (offsetY === 1) {
        this.mergePiece();
        this.checkFullLines();
        this.spawnPiece();
      }
    }

    // Dibujar la pieza
    this.draw();
  }

  // Rotar la pieza
  private rotatePiece(): void {
    const newShape = this.currentPiece.shape[0].map((_: any, index: any) => this.currentPiece.shape.map((row: any) => row[index]).reverse());

    const originalShape = this.currentPiece.shape;
    this.currentPiece.shape = newShape;

    // Si la pieza no puede rotar, deshacer la rotación
    if (!this.canMove(0, 0)) {
      this.currentPiece.shape = originalShape;
    }

    // Dibujar la pieza
    this.draw();
  }

  // Manejar eventos de teclado
  @HostListener("window:keydown", ["$event"])
  handleKeyPress(event: KeyboardEvent): void {
    switch (event.key) {
      case "ArrowLeft":
        this.movePiece(-1, 0); // Mover a la izquierda
        break;
      case "ArrowRight":
        this.movePiece(1, 0); // Mover a la derecha
        break;
      case "ArrowDown":
        this.movePiece(0, 1); // Mover hacia abajo
        break;
      case "ArrowUp":
        this.rotatePiece(); // Rotar la pieza
        break;
    }
  }

  // Verificar si la pieza puede moverse
  canMove(offsetX: number, offsetY: number): boolean {
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (!this.currentPiece.shape[y][x]) continue; // Si la celda está vacía, continuar

        const newX = this.currentPiece.x + x + offsetX;
        const newY = this.currentPiece.y + y + offsetY;

        // Verificar si la pieza está dentro del tablero
        if (newX < 0 || newX >= this.boardWidth || newY >= this.boardHeight || (newY >= 0 && this.board[newY][newX])) {
          return false;
        }
      }
    }
    return true;
  }

  // Fusionar la pieza con el tablero
  private mergePiece(): void {
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        const isCellEmpty = this.currentPiece.shape[y][x];

        if (!isCellEmpty) continue; // Si la celda no está vacía, continuar

        this.board[this.currentPiece.y + y][this.currentPiece.x + x] = this.currentPiece.color;
      }
    }
  }

  // Verificar si hay líneas completas
  private checkFullLines(): void {
    for (let y = this.boardHeight - 1; y >= 0; y--) {
      const isFull = this.board[y].every((cell) => cell !== "");

      if (!isFull) continue; // Si la línea no está completa, continuar

      this.board.splice(y, 1);
      this.board.unshift(new Array(this.boardWidth).fill(""));
      y++;
    }
  }

  // Verificar si el juego ha terminado
  private isGameOver(): boolean {
    const isBoardFull = this.board[0].some((cell) => cell !== ""); // El juego termina si la primera fila del tablero está llena
    console.log({ isBoardFull });
    return isBoardFull;
  }

  onToggleChange(key: string, toggle: boolean): void {
    if (toggle) {
      if (this.checkEnabled(key)) this.soundService.playAudio(key);
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
