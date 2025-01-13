import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import Konva from "konva";
import { SoundService } from "../../../common/services/sound.service";

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
  selector: "app-tetris",
  templateUrl: "./tetris.component.html",
  styleUrls: ["./tetris.component.scss"],
  providers: [SoundService]
})
export class TetrisComponent implements OnInit, OnDestroy {
  panelOpenState: boolean = false;
  gameBoard: Array<Board> = [
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
  gameState: Array<any> = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  winner: string | undefined;
  playing: boolean = false;
  readonly dataLevels: Level[] = [
    { value: "Easy", text: "Fácil" },
    { value: "Normal", text: "Normal" },
    { value: "Hard", text: "Difícil" }
  ];
  difficulty: Difficulty = "Normal";
  breakpoint: number = 1;
  breakpoint2: number = 8;
  breakpoint3: number = 6;

  stage!: Konva.Stage;
  layer!: Konva.Layer;
  board: string[][] = [];
  currentPiece: any;
  gameInterval: any;

  readonly boardWidth = 12;
  readonly boardHeight = 20;
  readonly cellSize = 20;

  pieces = [
    {
      shape: [[1, 1, 1, 1]],
      color: "cyan"
    }, // I
    {
      shape: [
        [1, 1],
        [1, 1]
      ],
      color: "yellow"
    }, // O
    {
      shape: [
        [0, 1, 0],
        [1, 1, 1]
      ],
      color: "purple"
    }, // T
    {
      shape: [
        [1, 0, 0],
        [1, 1, 1]
      ],
      color: "green"
    }, // L
    {
      shape: [
        [0, 0, 1],
        [1, 1, 1]
      ],
      color: "red"
    }, // J
    {
      shape: [
        [1, 1, 0],
        [0, 1, 1]
      ],
      color: "blue"
    }, // S
    {
      shape: [
        [0, 1, 1],
        [1, 1, 0]
      ],
      color: "orange"
    } // Z
  ];

  // playing: boolean = false;

  ngOnInit(): void {
    this.initBoard(); // Inicializar el tablero
    this.initKonva(); // Inicializar Konva
    this.spawnPiece(); // Generar una nueva pieza

    this.gameInterval = setInterval(() => {
      // Si el juego ha terminado, detener el intervalo y mostrar un mensaje
      if (this.isGameOver()) {
        clearInterval(this.gameInterval); // Detener el intervalo
        alert("Game Over!");
      } else {
        this.movePiece(0, 1); // Mover la pieza hacia abajo
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
    }
  }

  /**
   * Funciones del ciclo de vida del juego
   */
  // Iniciar el juego
  startGame(): void {}

  // Reiniciar el juego
  restartGame(): void {}

  // Pausar el juego
  pauseGame(): void {}

  // Reanudar el juego
  resumeGame(): void {}

  // Finalizar el juego
  endGame(): void {}

  /**
   * Funciones específicas del juego
   */

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
    const randomPiece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
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
}
