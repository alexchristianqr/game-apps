import { BLOCK, type Cell, COLS, EMPTY, ROWS, WALL } from "./bomberman.levels";

export type Dir = "up" | "down" | "left" | "right";

export const DIRS: Record<Dir, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0]
};

export const DIR_LIST: readonly Dir[] = ["up", "down", "left", "right"];

/** Media anchura de la caja del jugador y de los enemigos, en casillas: cabe por un pasillo con holgura. */
export const HALF = 0.36;

export interface BombTile {
  tx: number;
  ty: number;
  /** El jugador aún solapa la bomba que acaba de poner: puede salir de ella */
  passable: boolean;
}

export interface Blast {
  /** Casillas en llamas: el centro y los cuatro brazos de la cruz */
  cells: [number, number][];
  /** Bloques rompibles que alcanza la llama */
  destroyed: [number, number][];
}

export function cellAt(grid: readonly (readonly Cell[])[], x: number, y: number): Cell {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return WALL;
  return grid[y][x];
}

/**
 * Explosión en cruz sobre los ejes X e Y: cada brazo avanza hasta `range` casillas y se corta en un
 * muro fijo (que no se quema). Un bloque rompible sí arde, pero frena el brazo: la llama no lo atraviesa.
 */
export function blastCells(grid: readonly (readonly Cell[])[], ox: number, oy: number, range: number): Blast {
  const cells: [number, number][] = [[ox, oy]];
  const destroyed: [number, number][] = [];
  for (const dir of DIR_LIST) {
    const [dx, dy] = DIRS[dir];
    for (let i = 1; i <= range; i++) {
      const x = ox + dx * i;
      const y = oy + dy * i;
      const cell = cellAt(grid, x, y);
      if (cell === WALL) break;
      cells.push([x, y]);
      if (cell === BLOCK) {
        destroyed.push([x, y]);
        break;
      }
    }
  }
  return { cells, destroyed };
}

function tileBlocked(grid: readonly (readonly Cell[])[], bombs: readonly BombTile[], tx: number, ty: number, passBlocks: boolean): boolean {
  const cell = cellAt(grid, tx, ty);
  if (cell === WALL) return true;
  if (cell === BLOCK && !passBlocks) return true;
  return bombs.some((b) => b.tx === tx && b.ty === ty && !b.passable);
}

/** ¿Choca la caja centrada en (x, y) con algo sólido? Se comprueban sus cuatro esquinas. */
export function boxBlocked(grid: readonly (readonly Cell[])[], bombs: readonly BombTile[], x: number, y: number, passBlocks = false): boolean {
  for (const cx of [x - HALF, x + HALF]) for (const cy of [y - HALF, y + HALF]) if (tileBlocked(grid, bombs, Math.floor(cx), Math.floor(cy), passBlocks)) return true;
  return false;
}

/**
 * Mueve una caja `dist` casillas en `dir`. Avanza en pasos cortos para no atravesar paredes y, si
 * topa con una esquina, la desliza hacia el centro del pasillo: así no hace falta clavar el giro.
 */
export function moveBy(grid: readonly (readonly Cell[])[], bombs: readonly BombTile[], pos: { x: number; y: number }, dir: Dir, dist: number, passBlocks = false): { x: number; y: number } {
  const [dx, dy] = DIRS[dir];
  let { x, y } = pos;
  let remaining = dist;
  while (remaining > 1e-6) {
    const s = Math.min(remaining, 0.1);
    remaining -= s;
    const nx = x + dx * s;
    const ny = y + dy * s;
    if (!boxBlocked(grid, bombs, nx, ny, passBlocks)) {
      x = nx;
      y = ny;
      continue;
    }
    // Deslizar por la esquina hacia el centro del carril contiguo
    if (dx !== 0) {
      const off = Math.floor(y) + 0.5 - y;
      if (Math.abs(off) > 1e-6 && !boxBlocked(grid, bombs, nx, Math.floor(y) + 0.5, passBlocks)) {
        y += Math.sign(off) * Math.min(s * 1.6, Math.abs(off));
        continue;
      }
    } else {
      const off = Math.floor(x) + 0.5 - x;
      if (Math.abs(off) > 1e-6 && !boxBlocked(grid, bombs, Math.floor(x) + 0.5, ny, passBlocks)) {
        x += Math.sign(off) * Math.min(s * 1.6, Math.abs(off));
        continue;
      }
    }
    // Pegarse a la pared: avanzar lo que quepa en lugar de dejar un hueco
    let t = s;
    for (let i = 0; i < 4; i++) {
      t /= 2;
      if (!boxBlocked(grid, bombs, x + dx * t, y + dy * t, passBlocks)) {
        x += dx * t;
        y += dy * t;
        break;
      }
    }
    break;
  }
  return { x, y };
}

/** ¿Solapa la caja centrada en (x, y) la casilla (tx, ty)? */
export function overlapsTile(x: number, y: number, tx: number, ty: number): boolean {
  return x + HALF > tx && x - HALF < tx + 1 && y + HALF > ty && y - HALF < ty + 1;
}

export function tileOf(x: number, y: number): [number, number] {
  return [Math.floor(x), Math.floor(y)];
}

export function isFree(grid: readonly (readonly Cell[])[], x: number, y: number): boolean {
  return cellAt(grid, x, y) === EMPTY;
}
