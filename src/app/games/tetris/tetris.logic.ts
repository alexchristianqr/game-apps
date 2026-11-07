import { PIECE_IDS, PIECES, type PieceId } from "./tetris.pieces";

export const COLS = 10;
/** Filas visibles */
export const VISIBLE_ROWS = 20;
/** Filas ocultas encima del tablero, donde aparecen las piezas */
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

export type Board = readonly (readonly (PieceId | null)[])[];

export interface Active {
  id: PieceId;
  /** 0, 1 (derecha), 2, 3 (izquierda) */
  rot: number;
  x: number;
  y: number;
}

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<PieceId | null>(COLS).fill(null));
}

/** Casillas absolutas (x, y de tablero) que ocupa una pieza. */
export function cellsOf(piece: Active): [number, number][] {
  return PIECES[piece.id].rotations[piece.rot].map(([cx, cy]) => [piece.x + cx, piece.y + cy] as [number, number]);
}

export function collides(board: Board, piece: Active): boolean {
  return cellsOf(piece).some(([x, y]) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x] !== null));
}

/** Pieza nueva centrada arriba, asomando por la fila visible superior (y = filas ocultas - 1). */
export function spawn(id: PieceId): Active {
  const { size } = PIECES[id];
  return { id, rot: 0, x: Math.floor((COLS - size) / 2), y: HIDDEN_ROWS - 1 };
}

/** Cuántas filas puede caer la pieza antes de tocar algo (para la pieza fantasma y la caída dura). */
export function dropDistance(board: Board, piece: Active): number {
  let d = 0;
  while (!collides(board, { ...piece, y: piece.y + d + 1 })) d++;
  return d;
}

export function lockPiece(board: Board, piece: Active): Board {
  const next = board.map((row) => [...row]);
  for (const [x, y] of cellsOf(piece)) if (y >= 0) next[y][x] = piece.id;
  return next;
}

/** Quita las filas completas. Devuelve el tablero nuevo y los índices de las filas quitadas. */
export function clearLines(board: Board): { board: Board; rows: number[] } {
  const rows: number[] = [];
  board.forEach((row, y) => {
    if (row.every((c) => c !== null)) rows.push(y);
  });
  if (!rows.length) return { board, rows };
  const kept = board.filter((_, y) => !rows.includes(y));
  const fresh = Array.from({ length: rows.length }, () => Array<PieceId | null>(COLS).fill(null));
  return { board: [...fresh, ...kept], rows };
}

/** Hay algo por encima de la zona visible: el juego terminó por bloqueo fuera de tablero. */
export function lockedAbove(piece: Active): boolean {
  return cellsOf(piece).every(([, y]) => y < HIDDEN_ROWS);
}

export type Rng = () => number;

/** Una bolsa de las 7 piezas barajadas (Fisher-Yates). */
export function newBag(rng: Rng): PieceId[] {
  const bag = [...PIECE_IDS];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/** Mantiene al menos 7 piezas en cola para poder mostrar las siguientes. */
export function refill(queue: readonly PieceId[], rng: Rng): PieceId[] {
  const out = [...queue];
  while (out.length < 7) out.push(...newBag(rng));
  return out;
}

const LINE_POINTS = [0, 100, 300, 500, 800];

export function lineScore(lines: number, level: number, backToBack: boolean): number {
  const base = LINE_POINTS[Math.min(lines, 4)] * level;
  return backToBack && lines === 4 ? Math.floor(base * 1.5) : base;
}

/** Bonificación de combo: 50 × combo × nivel. `combo` es 0 en la primera limpieza seguida. */
export function comboScore(combo: number, level: number): number {
  return combo > 0 ? 50 * combo * level : 0;
}

export function levelFor(lines: number, startLevel = 1): number {
  return startLevel + Math.floor(lines / 10);
}

/** Milisegundos por fila de caída (curva de la guía oficial), con un mínimo jugable. */
export function gravityMs(level: number): number {
  const seconds = Math.pow(0.8 - (level - 1) * 0.007, level - 1);
  return Math.max(16, Math.round(seconds * 1000));
}
