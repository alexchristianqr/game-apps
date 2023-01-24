// @ts-ignore
import Minimax from 'tic-tac-toe-minimax'
const { GameStep, ComputerMove } = Minimax
import { Component, OnInit } from '@angular/core'

interface Level {
  value: string
  text: string
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  public gameBoard: Array<any> = [
    { value: 0, bgColor: 'div0' },
    { value: 1, bgColor: 'div1' },
    { value: 2, bgColor: 'div2' },
    { value: 3, bgColor: 'div3' },
    { value: 4, bgColor: 'div4' },
    { value: 5, bgColor: 'div5' },
    { value: 6, bgColor: 'div6' },
    { value: 7, bgColor: 'div7' },
    { value: 8, bgColor: 'div8' },
  ]
  public gameState: Array<any> = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  public winner: string | undefined
  public playing = false
  public computerFirst = false
  public dataLevels: Level[] = [
    { value: 'Easy', text: 'Fácil' },
    { value: 'Normal', text: 'Normal' },
    { value: 'Hard', text: 'Difícil' },
  ]
  public difficulty: 'Easy' | 'Normal' | 'Hard' = 'Normal'
  breakpoint: number = 1
  breakpoint2: number = 8
  breakpoint3: number = 6

  constructor() {
    /*
      1 2 3
      4 5 6
      7 8 9
    */
    // let matrix: Array<any> = [
    //   [1, 2, 3],
    //   [4, 4, 4],
    //   [7, 8, 9],
    // ]
    // console.log('ganador', this.checkForWinner(matrix))
  }

  ngOnInit() {
    this.breakpoint = window.innerWidth <= 319 ? 3 : 1
  }

  onResize(event: Event) {
    const w = event.target as Window
    this.breakpoint = w.innerWidth <= 319 ? 2 : 1
  }

  /**
   * Jugar
   * @param toggle
   */
  public toggleGame(toggle: boolean): void {
    if (toggle === this.playing) {
      return
    }

    this.gameBoard = [
      { value: 0, bgColor: 'div0' },
      { value: 1, bgColor: 'div1' },
      { value: 2, bgColor: 'div2' },
      { value: 3, bgColor: 'div3' },
      { value: 4, bgColor: 'div4' },
      { value: 5, bgColor: 'div5' },
      { value: 6, bgColor: 'div6' },
      { value: 7, bgColor: 'div7' },
      { value: 8, bgColor: 'div8' },
    ]
    this.gameState = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    // this.gameState = [
    //   {value:0, bgColor: 'div0'},
    //   {value:1, bgColor: 'div1'},
    //   {value:2, bgColor: 'div2'},
    //   {value:3, bgColor: 'div3'},
    //   {value:4, bgColor: 'div4'},
    //   {value:5, bgColor: 'div5'},
    //   {value:6, bgColor: 'div6'},
    //   {value:7, bgColor: 'div7'},
    //   {value:8, bgColor: 'div8'},
    // ]
    this.winner = undefined

    if (toggle && this.computerFirst) {
      this.makeComputerMove()
    }

    this.playing = toggle
  }

  /**
   * Turno del humano
   * @param field
   */
  public makeHumanMove(field: number): void {
    if (!this.playing || typeof this.gameState[field] !== 'number') {
      return
    }

    this.gameState[field] = 'X'
    setTimeout(() => {
      this.makeComputerMove()
    }, 250)
  }

  /**
   * Turno de la computadora
   * @private
   */
  private makeComputerMove(): void {
    const symbols = {
      huPlayer: 'X',
      aiPlayer: 'O',
    }

    const winnerMapping: { [index: string]: any } = {
      huPlayer: '¡Ganaste tú 🧑!',
      aiPlayer: '¡Ganó el robot 🤖!',
      draw: '¡Es un empate!',
    }

    const result = GameStep(this.gameState, symbols, this.difficulty)
    this.gameState = result.board

    if (result.winner) {
      this.winner = winnerMapping[result.winner]
      this.playing = false
    }
  }

  /**
   * Verificar jugador ganador
   * @param board
   * @private
   */
  private checkForWinner(board: Array<any>) {
    // console.log({ board })

    let tmp: Array<any> = []

    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
        tmp.push(board[i][0])
        // return board[i][0]
      }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
      if (board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
        tmp.push(board[0][i])
        // return board[0][i]
      }
    }

    // Check diagonals
    if (board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      tmp.push(board[0][0])
      // return board[0][0]
    }
    if (board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      tmp.push(board[0][2])
      // return board[0][2]
    }

    // console.log({tmp})

    return null
  }
}
