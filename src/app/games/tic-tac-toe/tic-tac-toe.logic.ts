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

export type Mode = "robot" | "duo";
export type Mark = "X" | "O";
export type Result = "win" | "loss" | "draw";

export function isDraw(board: readonly Cell[]): boolean {
  return board.every((c) => !isFree(c)) && !winningLine(board);
}

/** Quién gana (por su marca), «draw» o null si la partida sigue. */
export function outcomeOf(board: readonly Cell[]): Mark | "draw" | null {
  const line = winningLine(board);
  if (line) return board[line[0]] as Mark;
  return isDraw(board) ? "draw" : null;
}

export function other(mark: Mark): Mark {
  return mark === "X" ? "O" : "X";
}

export interface Scoreboard {
  wins: number;
  losses: number;
  draws: number;
  /** Victorias seguidas actuales */
  streak: number;
  best: number;
}

export const EMPTY_SCORE: Scoreboard = { wins: 0, losses: 0, draws: 0, streak: 0, best: 0 };

/** Devuelve un marcador nuevo; la racha solo cuenta victorias consecutivas. */
export function applyResult(score: Scoreboard, result: Result): Scoreboard {
  if (result === "win") {
    const streak = score.streak + 1;
    return { ...score, wins: score.wins + 1, streak, best: Math.max(score.best, streak) };
  }
  if (result === "loss") return { ...score, losses: score.losses + 1, streak: 0 };
  return { ...score, draws: score.draws + 1, streak: 0 };
}

export type ThemeId = "classic" | "animals" | "food" | "space";

export interface PieceTheme {
  id: ThemeId;
  label: string;
  /** Símbolo visible y nombre accesible por jugador (X = primero, O = segundo) */
  x: { glyph: string; name: string };
  o: { glyph: string; name: string };
}

export const PIECE_THEMES: readonly PieceTheme[] = [
  { id: "classic", label: "Clásico", x: { glyph: "X", name: "X" }, o: { glyph: "O", name: "O" } },
  { id: "animals", label: "Mascotas", x: { glyph: "🐱", name: "gato" }, o: { glyph: "🐶", name: "perro" } },
  { id: "food", label: "Antojos", x: { glyph: "🍕", name: "pizza" }, o: { glyph: "🍩", name: "dona" } },
  { id: "space", label: "Espacio", x: { glyph: "🚀", name: "cohete" }, o: { glyph: "🪐", name: "planeta" } }
];

/** Teclas 1–9 con la disposición del teclado numérico: 7 8 9 arriba, 1 2 3 abajo. */
export function keyToIndex(key: string): number | null {
  if (!/^[1-9]$/.test(key)) return null;
  const n = Number(key);
  const row = 2 - Math.floor((n - 1) / 3);
  return row * 3 + ((n - 1) % 3);
}

/** Movimiento de las flechas sobre el tablero 3×3, sin dar la vuelta. */
export function moveFocus(index: number, key: string): number {
  const row = Math.floor(index / 3);
  const col = index % 3;
  if (key === "ArrowLeft" && col > 0) return index - 1;
  if (key === "ArrowRight" && col < 2) return index + 1;
  if (key === "ArrowUp" && row > 0) return index - 3;
  if (key === "ArrowDown" && row < 2) return index + 3;
  return index;
}
