import { type Active, type Board, clearLines, collides, comboScore, dropDistance, emptyBoard, gravityMs, levelFor, lineScore, lockedAbove, lockPiece, refill, type Rng, spawn } from "./tetris.logic";
import { kicksFor, type PieceId } from "./tetris.pieces";

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export type GameEvent =
  | { type: "move" }
  | { type: "rotate" }
  | { type: "hold" }
  | { type: "hardDrop"; distance: number }
  | { type: "lock" }
  | { type: "clear"; rows: number[]; lines: number; points: number; backToBack: boolean }
  | { type: "levelUp"; level: number }
  | { type: "over" };

export interface TetrisState {
  board: Board;
  active: Active;
  hold: PieceId | null;
  canHold: boolean;
  queue: readonly PieceId[];
  score: number;
  lines: number;
  level: number;
  startLevel: number;
  /** Limpiezas seguidas menos una; -1 si la última pieza no limpió nada */
  combo: number;
  backToBack: boolean;
  status: "playing" | "over";
  /** Tiempo acumulado hacia la próxima bajada de gravedad */
  fall: number;
  /** Tiempo que lleva apoyada la pieza */
  lockMs: number;
  lockResets: number;
  /** Eventos de la última acción, para efectos y sonido */
  events: readonly GameEvent[];
}

export type Action = { type: "left" } | { type: "right" } | { type: "softDrop" } | { type: "hardDrop" } | { type: "cw" } | { type: "ccw" } | { type: "hold" } | { type: "tick"; dt: number };

export function createGame(rng: Rng, startLevel = 1): TetrisState {
  const queue = refill([], rng);
  const [first, ...rest] = queue;
  return {
    board: emptyBoard(),
    active: spawn(first),
    hold: null,
    canHold: true,
    queue: refill(rest, rng),
    score: 0,
    lines: 0,
    level: startLevel,
    startLevel,
    combo: -1,
    backToBack: false,
    status: "playing",
    fall: 0,
    lockMs: 0,
    lockResets: 0,
    events: []
  };
}

export function grounded(state: TetrisState): boolean {
  return collides(state.board, { ...state.active, y: state.active.y + 1 });
}

/** Reglas: un único punto de entrada; el componente solo despacha acciones. */
export function step(state: TetrisState, action: Action, rng: Rng): TetrisState {
  if (state.status === "over") return state;
  const s: TetrisState = { ...state, events: [] };
  switch (action.type) {
    case "left":
      return shift(s, -1);
    case "right":
      return shift(s, 1);
    case "cw":
      return rotate(s, 1);
    case "ccw":
      return rotate(s, 3);
    case "softDrop":
      return softDrop(s, rng);
    case "hardDrop":
      return hardDrop(s, rng);
    case "hold":
      return hold(s, rng);
    case "tick":
      return tick(s, action.dt, rng);
  }
}

function emit(state: TetrisState, ...events: GameEvent[]): TetrisState {
  return { ...state, events: [...state.events, ...events] };
}

/** Tras mover o girar apoyada, se reinicia el tiempo de bloqueo (con un máximo para no jugar infinito). */
function afterAdjust(state: TetrisState, moved: Active): TetrisState {
  const next: TetrisState = { ...state, active: moved };
  if (!grounded(next)) return { ...next, lockMs: 0 };
  if (state.lockResets >= MAX_LOCK_RESETS) return next;
  return { ...next, lockMs: 0, lockResets: state.lockResets + 1 };
}

function shift(state: TetrisState, dx: number): TetrisState {
  const moved = { ...state.active, x: state.active.x + dx };
  if (collides(state.board, moved)) return state;
  return emit(afterAdjust(state, moved), { type: "move" });
}

function rotate(state: TetrisState, turn: number): TetrisState {
  const from = state.active.rot;
  const to = (from + turn) % 4;
  for (const [dx, dy] of kicksFor(state.active.id, from, to)) {
    const candidate = { ...state.active, rot: to, x: state.active.x + dx, y: state.active.y + dy };
    if (!collides(state.board, candidate)) return emit(afterAdjust(state, candidate), { type: "rotate" });
  }
  return state;
}

function softDrop(state: TetrisState, rng: Rng): TetrisState {
  if (grounded(state)) return lock(state, rng);
  return { ...state, active: { ...state.active, y: state.active.y + 1 }, score: state.score + 1, fall: 0, lockMs: 0, lockResets: 0 };
}

function hardDrop(state: TetrisState, rng: Rng): TetrisState {
  const distance = dropDistance(state.board, state.active);
  const dropped: TetrisState = { ...state, active: { ...state.active, y: state.active.y + distance }, score: state.score + distance * 2 };
  return lock(emit(dropped, { type: "hardDrop", distance }), rng);
}

function hold(state: TetrisState, rng: Rng): TetrisState {
  if (!state.canHold) return state;
  const swapped = state.hold;
  const incoming = swapped ?? state.queue[0];
  const queue = swapped ? state.queue : refill(state.queue.slice(1), rng);
  const active = spawn(incoming);
  const base: TetrisState = { ...state, hold: state.active.id, canHold: false, queue, active, fall: 0, lockMs: 0, lockResets: 0 };
  if (collides(base.board, active)) return emit({ ...base, status: "over" }, { type: "over" });
  return emit(base, { type: "hold" });
}

function tick(state: TetrisState, dt: number, rng: Rng): TetrisState {
  if (grounded(state)) {
    const lockMs = state.lockMs + dt;
    return lockMs >= LOCK_DELAY_MS ? lock({ ...state, lockMs }, rng) : { ...state, lockMs };
  }
  let s: TetrisState = { ...state, fall: state.fall + dt };
  const every = gravityMs(s.level);
  while (s.fall >= every) {
    s = { ...s, fall: s.fall - every, active: { ...s.active, y: s.active.y + 1 } };
    if (grounded(s)) {
      s = { ...s, fall: 0 };
      break;
    }
  }
  return s;
}

/** Fija la pieza, puntúa, sube de nivel y saca la siguiente. */
function lock(state: TetrisState, rng: Rng): TetrisState {
  const overByLockOut = lockedAbove(state.active);
  const placed = lockPiece(state.board, state.active);
  const { board, rows } = clearLines(placed);
  const lines = rows.length;

  const combo = lines > 0 ? state.combo + 1 : -1;
  const backToBack = lines > 0 ? lines === 4 : state.backToBack;
  const points = lines > 0 ? lineScore(lines, state.level, state.backToBack) + comboScore(combo, state.level) : 0;
  const totalLines = state.lines + lines;
  const level = levelFor(totalLines, state.startLevel);

  const events: GameEvent[] = [{ type: "lock" }];
  if (lines > 0) events.push({ type: "clear", rows, lines, points, backToBack: lines === 4 && state.backToBack });
  if (level > state.level) events.push({ type: "levelUp", level });

  const [nextId, ...rest] = state.queue;
  const next = spawn(nextId);
  const result: TetrisState = {
    ...state,
    board,
    active: next,
    queue: refill(rest, rng),
    canHold: true,
    score: state.score + points,
    lines: totalLines,
    level,
    combo,
    backToBack,
    fall: 0,
    lockMs: 0,
    lockResets: 0,
    events: [...state.events, ...events]
  };
  if (overByLockOut || collides(board, next)) return { ...result, status: "over", events: [...result.events, { type: "over" }] };
  return result;
}
