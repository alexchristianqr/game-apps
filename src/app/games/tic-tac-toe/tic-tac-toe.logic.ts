export type Cell = "X" | "O" | number;

const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

/** Tablero inicial: cada casilla libre guarda su índice, que es lo que espera la librería minimax. */
export function emptyBoard(): Cell[] {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8];
}

export function isFree(cell: Cell): cell is number {
  return typeof cell === "number";
}

/** Índices de la línea ganadora, o null si nadie ha completado una. */
export function winningLine(board: readonly Cell[]): number[] | null {
  for (const [a, b, c] of LINES) {
    if (!isFree(board[a]) && board[a] === board[b] && board[a] === board[c]) return [a, b, c];
  }
  return null;
}
