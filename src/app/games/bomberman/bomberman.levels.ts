export type Rng = () => number;

export const COLS = 15;
export const ROWS = 13;

/** Contenido de una casilla. Las bombas y las llamas viven aparte, en el estado. */
export const EMPTY = 0;
export const WALL = 1;
export const BLOCK = 2;
export type Cell = typeof EMPTY | typeof WALL | typeof BLOCK;

export type EnemyKind = "balloon" | "ghost" | "hunter";
export type PowerKind = "bomb" | "range" | "speed";

export interface LevelConfig {
  balloons: number;
  ghosts: number;
  hunters: number;
  /** Probabilidad de que una casilla libre lleve un bloque rompible */
  density: number;
  /** Tiempo del nivel, en ms */
  timeMs: number;
  powerUps: number;
}

export interface LevelLayout {
  grid: Cell[][];
  start: { x: number; y: number };
  exit: { x: number; y: number };
  /** Power-ups escondidos bajo bloques */
  hidden: { x: number; y: number; kind: PowerKind }[];
  enemies: { kind: EnemyKind; x: number; y: number }[];
}

export const PLAYER_START = { x: 1, y: 1 } as const;

export function isFixedWall(x: number, y: number): boolean {
  return x <= 0 || y <= 0 || x >= COLS - 1 || y >= ROWS - 1 || (x % 2 === 0 && y % 2 === 0);
}

/** Más enemigos y de peor carácter a medida que se sube; sin tope duro de niveles. */
export function levelConfig(level: number): LevelConfig {
  const n = Math.max(1, Math.floor(level));
  return {
    balloons: Math.min(3 + Math.floor(n / 2), 7),
    ghosts: n >= 2 ? Math.min(n - 1, 4) : 0,
    hunters: n >= 3 ? Math.min(n - 2, 3) : 0,
    density: Math.min(0.36 + n * 0.02, 0.5),
    timeMs: 180_000,
    powerUps: Math.max(2, 4 - Math.floor(n / 4))
  };
}

const POWER_KINDS: readonly PowerKind[] = ["bomb", "range", "speed"];

/** Zona de salida del jugador: siempre libre para no empezar encerrado. */
function inSafeZone(x: number, y: number): boolean {
  return (x === 1 && y <= 3) || (y === 1 && x <= 3);
}

export function generateLevel(level: number, rng: Rng): LevelLayout {
  const cfg = levelConfig(level);
  const grid: Cell[][] = [];
  for (let y = 0; y < ROWS; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < COLS; x++) {
      if (isFixedWall(x, y)) row.push(WALL);
      else if (inSafeZone(x, y)) row.push(EMPTY);
      else row.push(rng() < cfg.density ? BLOCK : EMPTY);
    }
    grid.push(row);
  }

  const free: { x: number; y: number }[] = [];
  for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) if (grid[y][x] !== WALL && !inSafeZone(x, y)) free.push({ x, y });
  shuffle(free, rng);

  const dist = (c: { x: number; y: number }): number => Math.abs(c.x - PLAYER_START.x) + Math.abs(c.y - PLAYER_START.y);

  // Enemigos: lejos de la salida del jugador; si caen sobre un bloque, lo limpian.
  const enemies: LevelLayout["enemies"] = [];
  const spawnFree = free.filter((c) => dist(c) >= 7);
  const kinds: EnemyKind[] = [...Array<EnemyKind>(cfg.balloons).fill("balloon"), ...Array<EnemyKind>(cfg.ghosts).fill("ghost"), ...Array<EnemyKind>(cfg.hunters).fill("hunter")];
  const taken = new Set<string>();
  for (const kind of kinds) {
    const spot = spawnFree.find((c) => !taken.has(key(c.x, c.y)));
    if (!spot) break;
    taken.add(key(spot.x, spot.y));
    grid[spot.y][spot.x] = EMPTY;
    enemies.push({ kind, x: spot.x, y: spot.y });
  }

  // Salida: bajo un bloque lejano; si no hay ninguno, se fuerza uno.
  let blocks = free.filter((c) => grid[c.y][c.x] === BLOCK);
  let exitCell = blocks.find((c) => dist(c) >= 10) ?? blocks[blocks.length - 1];
  if (!exitCell) {
    exitCell = free.find((c) => dist(c) >= 10 && !taken.has(key(c.x, c.y))) ?? free[free.length - 1];
    grid[exitCell.y][exitCell.x] = BLOCK;
  }
  const exit = { x: exitCell.x, y: exitCell.y };

  // Power-ups: bajo otros bloques, repartiendo tipos.
  blocks = free.filter((c) => grid[c.y][c.x] === BLOCK && !(c.x === exit.x && c.y === exit.y));
  const hidden: LevelLayout["hidden"] = blocks.slice(0, cfg.powerUps).map((c, i) => ({ x: c.x, y: c.y, kind: POWER_KINDS[i % POWER_KINDS.length] }));

  return { grid, start: { ...PLAYER_START }, exit, hidden, enemies };
}

export function key(x: number, y: number): string {
  return `${x},${y}`;
}

function shuffle<T>(list: T[], rng: Rng): void {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}
