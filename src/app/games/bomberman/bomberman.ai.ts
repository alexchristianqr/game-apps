import { BLOCK, type Cell, type EnemyKind, key, type Rng, WALL } from "./bomberman.levels";
import { cellAt, DIR_LIST, DIRS } from "./bomberman.logic";

export interface AiContext {
  grid: readonly (readonly Cell[])[];
  /** Casillas con una bomba: ningún enemigo las cruza */
  bombs: ReadonlySet<string>;
  /** Casillas que arden o van a arder: se evitan */
  danger: ReadonlySet<string>;
  from: { x: number; y: number };
  /** Último paso dado, para seguir recto en lugar de dar bandazos */
  last: { dx: number; dy: number } | null;
  /** Casilla del jugador (la persigue el Cazador) */
  target: { x: number; y: number };
  rng: Rng;
}

/** Casillas por segundo. El Cazador es más lento que el jugador (5) para que se pueda huir de él. */
export const ENEMY_SPEED: Record<EnemyKind, number> = { balloon: 2.6, ghost: 1.9, hunter: 3.8 };
export const ENEMY_POINTS: Record<EnemyKind, number> = { balloon: 100, ghost: 200, hunter: 400 };

/** El Fantasma atraviesa los bloques rompibles, pero no los muros fijos ni las bombas. */
export function canEnter(kind: EnemyKind, grid: readonly (readonly Cell[])[], bombs: ReadonlySet<string>, x: number, y: number): boolean {
  const cell = cellAt(grid, x, y);
  if (cell === WALL) return false;
  if (cell === BLOCK && kind !== "ghost") return false;
  return !bombs.has(key(x, y));
}

function neighbours(kind: EnemyKind, ctx: AiContext, avoidDanger: boolean): { x: number; y: number; dx: number; dy: number }[] {
  const out: { x: number; y: number; dx: number; dy: number }[] = [];
  for (const dir of DIR_LIST) {
    const [dx, dy] = DIRS[dir];
    const x = ctx.from.x + dx;
    const y = ctx.from.y + dy;
    if (!canEnter(kind, ctx.grid, ctx.bombs, x, y)) continue;
    if (avoidDanger && ctx.danger.has(key(x, y))) continue;
    out.push({ x, y, dx, dy });
  }
  return out;
}

function tile(o: { x: number; y: number }): { x: number; y: number } {
  return { x: o.x, y: o.y };
}

/** Deambular: sigue recto casi siempre y gira al azar en cruces; solo da la vuelta si no queda otra. */
function wander(kind: EnemyKind, ctx: AiContext): { x: number; y: number } | null {
  const options = neighbours(kind, ctx, true);
  if (!options.length) return null;
  if (ctx.last) {
    const straight = options.find((o) => o.dx === ctx.last!.dx && o.dy === ctx.last!.dy);
    if (straight && (options.length === 1 || ctx.rng() < 0.75)) return tile(straight);
    const forward = options.filter((o) => !(o.dx === -ctx.last!.dx && o.dy === -ctx.last!.dy));
    if (forward.length) return tile(forward[Math.floor(ctx.rng() * forward.length)]);
  }
  return tile(options[Math.floor(ctx.rng() * options.length)]);
}

/** Primer paso del camino más corto hacia el jugador por casillas seguras (búsqueda en anchura). */
function chase(ctx: AiContext): { x: number; y: number } | null {
  const start = key(ctx.from.x, ctx.from.y);
  const goal = key(ctx.target.x, ctx.target.y);
  if (start === goal) return null;
  const first = new Map<string, { x: number; y: number }>();
  const seen = new Set<string>([start]);
  let frontier: { x: number; y: number }[] = [ctx.from];
  while (frontier.length) {
    const next: { x: number; y: number }[] = [];
    for (const cur of frontier) {
      for (const dir of DIR_LIST) {
        const [dx, dy] = DIRS[dir];
        const x = cur.x + dx;
        const y = cur.y + dy;
        const k = key(x, y);
        if (seen.has(k) || !canEnter("hunter", ctx.grid, ctx.bombs, x, y) || ctx.danger.has(k)) continue;
        seen.add(k);
        first.set(k, first.get(key(cur.x, cur.y)) ?? { x, y });
        if (k === goal) return first.get(k)!;
        next.push({ x, y });
      }
    }
    frontier = next;
  }
  return null;
}

/** Elige la casilla vecina a la que ir, o `null` para esperar quieto (p. ej. si todo alrededor arde). */
export function nextTile(kind: EnemyKind, ctx: AiContext): { x: number; y: number } | null {
  if (kind === "hunter" && ctx.rng() > 0.15) return chase(ctx) ?? wander(kind, ctx);
  return wander(kind, ctx);
}
