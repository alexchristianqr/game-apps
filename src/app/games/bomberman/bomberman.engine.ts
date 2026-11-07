import { ENEMY_POINTS, ENEMY_SPEED, nextTile } from "./bomberman.ai";
import { type Cell, EMPTY, type EnemyKind, generateLevel, key, levelConfig, type PowerKind, type Rng } from "./bomberman.levels";
import { blastCells, type BombTile, type Dir, moveBy, overlapsTile, tileOf } from "./bomberman.logic";

export const START_LIVES = 3;
export const FUSE_MS = 2000;
export const FLAME_MS = 500;
export const INVULN_MS = 2500;
export const BASE_SPEED = 5;
export const MAX_SPEED = 7.4;
export const MAX_RANGE = 8;
export const MAX_BOMBS = 6;
/** Tiempo de gracia tras agotarse el reloj y perder una vida */
export const OVERTIME_MS = 60_000;

export interface Player {
  x: number;
  y: number;
  /** Dirección que se mantiene pulsada; `null` si está quieto */
  held: Dir | null;
  facing: Dir;
  moving: boolean;
  lives: number;
  maxBombs: number;
  range: number;
  speed: number;
  /** Ms de invulnerabilidad que quedan tras un golpe */
  invuln: number;
}

export interface Bomb extends BombTile {
  id: number;
  fuse: number;
  range: number;
}

export interface Flame {
  x: number;
  y: number;
  ttl: number;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  /** Casilla a la que se dirige */
  tx: number;
  ty: number;
  last: { dx: number; dy: number } | null;
}

export interface PowerUp {
  x: number;
  y: number;
  kind: PowerKind;
}

export type GameEvent =
  | { type: "bombPlaced"; x: number; y: number }
  | { type: "explode"; x: number; y: number; cells: [number, number][] }
  | { type: "blockDestroyed"; x: number; y: number }
  | { type: "enemyKilled"; kind: EnemyKind; x: number; y: number; points: number; chain: number }
  | { type: "powerUp"; kind: PowerKind; x: number; y: number }
  | { type: "playerHit"; lives: number }
  | { type: "exitOpen" }
  | { type: "levelClear"; bonus: number }
  | { type: "over" };

export interface BombermanState {
  level: number;
  grid: Cell[][];
  exit: { x: number; y: number };
  exitOpen: boolean;
  hidden: { x: number; y: number; kind: PowerKind }[];
  player: Player;
  start: { x: number; y: number };
  bombs: Bomb[];
  flames: Flame[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  score: number;
  /** Tiempo que queda, en ms */
  timeLeft: number;
  status: "playing" | "levelClear" | "over";
  nextId: number;
  /** Eventos del último paso, para efectos y sonido */
  events: readonly GameEvent[];
}

export type Action = { type: "dir"; dir: Dir | null } | { type: "bomb" } | { type: "tick"; dt: number };

/** Estado nuevo. Con `carry` se conservan vidas, puntos y mejoras al pasar de nivel. */
export function createGame(rng: Rng, level = 1, carry?: Pick<BombermanState, "score"> & Pick<Player, "lives" | "maxBombs" | "range" | "speed">): BombermanState {
  const layout = generateLevel(level, rng);
  return {
    level,
    grid: layout.grid,
    exit: layout.exit,
    exitOpen: false,
    hidden: layout.hidden,
    player: {
      x: layout.start.x + 0.5,
      y: layout.start.y + 0.5,
      held: null,
      facing: "down",
      moving: false,
      lives: carry?.lives ?? START_LIVES,
      maxBombs: carry?.maxBombs ?? 1,
      range: carry?.range ?? 2,
      speed: carry?.speed ?? BASE_SPEED,
      invuln: 0
    },
    start: layout.start,
    bombs: [],
    flames: [],
    enemies: layout.enemies.map((e, i) => ({ id: i + 1, kind: e.kind, x: e.x + 0.5, y: e.y + 0.5, tx: e.x, ty: e.y, last: null })),
    powerUps: [],
    score: carry?.score ?? 0,
    timeLeft: levelConfig(level).timeMs,
    status: "playing",
    nextId: layout.enemies.length + 1,
    events: []
  };
}

/** Pasa al nivel siguiente conservando lo ganado. */
export function nextLevel(state: BombermanState, rng: Rng): BombermanState {
  const p = state.player;
  return createGame(rng, state.level + 1, { score: state.score, lives: p.lives, maxBombs: p.maxBombs, range: p.range, speed: p.speed });
}

function clone(state: BombermanState): BombermanState {
  return {
    ...state,
    grid: state.grid.map((row) => row.slice()),
    hidden: state.hidden.slice(),
    player: { ...state.player },
    bombs: state.bombs.map((b) => ({ ...b })),
    flames: state.flames.map((f) => ({ ...f })),
    enemies: state.enemies.map((e) => ({ ...e })),
    powerUps: state.powerUps.slice(),
    events: []
  };
}

/** Motor puro: mismo estado, acción y generador → mismo resultado. Devuelve un estado nuevo. */
export function step(state: BombermanState, action: Action, rng: Rng): BombermanState {
  if (state.status !== "playing") return state;
  const s = clone(state);
  const events: GameEvent[] = [];

  switch (action.type) {
    case "dir":
      s.player.held = action.dir;
      if (action.dir) s.player.facing = action.dir;
      break;
    case "bomb":
      placeBomb(s, events);
      break;
    case "tick":
      tick(s, Math.max(0, action.dt), rng, events);
      break;
  }
  s.events = events;
  return s;
}

function placeBomb(s: BombermanState, events: GameEvent[]): void {
  const [tx, ty] = tileOf(s.player.x, s.player.y);
  if (s.bombs.length >= s.player.maxBombs || s.bombs.some((b) => b.tx === tx && b.ty === ty)) return;
  s.bombs.push({ id: s.nextId++, tx, ty, fuse: FUSE_MS, range: s.player.range, passable: true });
  events.push({ type: "bombPlaced", x: tx, y: ty });
}

function tick(s: BombermanState, dt: number, rng: Rng, events: GameEvent[]): void {
  const p = s.player;
  p.invuln = Math.max(0, p.invuln - dt);

  // Jugador
  p.moving = false;
  if (p.held) {
    const before = { x: p.x, y: p.y };
    const moved = moveBy(s.grid, s.bombs, before, p.held, (p.speed * dt) / 1000);
    p.moving = moved.x !== before.x || moved.y !== before.y;
    p.x = moved.x;
    p.y = moved.y;
  }
  // La bomba recién puesta deja de ser atravesable en cuanto el jugador sale de su casilla
  for (const b of s.bombs) if (b.passable && !overlapsTile(p.x, p.y, b.tx, b.ty)) b.passable = false;

  pickUp(s, events);

  // Mechas y llamas
  for (const b of s.bombs) b.fuse -= dt;
  for (const f of s.flames) f.ttl -= dt;
  s.flames = s.flames.filter((f) => f.ttl > 0);
  const chain = { kills: 0 };
  detonate(s, events, chain);

  moveEnemies(s, dt, rng);
  burn(s, events, chain);
  touchEnemies(s, events);

  // Salida y tiempo
  if (!s.exitOpen && s.enemies.length === 0) {
    s.exitOpen = true;
    events.push({ type: "exitOpen" });
  }
  s.timeLeft -= dt;
  if (s.timeLeft <= 0 && s.status === "playing") {
    s.timeLeft = OVERTIME_MS;
    hitPlayer(s, events, true);
  }
  if (s.status === "playing" && s.exitOpen && Math.floor(p.x) === s.exit.x && Math.floor(p.y) === s.exit.y && s.grid[s.exit.y][s.exit.x] === EMPTY) {
    const bonus = Math.floor(s.timeLeft / 1000) * 10 + s.level * 500;
    s.score += bonus;
    s.status = "levelClear";
    p.held = null;
    p.moving = false;
    events.push({ type: "levelClear", bonus });
  }
}

function pickUp(s: BombermanState, events: GameEvent[]): void {
  const [tx, ty] = tileOf(s.player.x, s.player.y);
  const i = s.powerUps.findIndex((u) => u.x === tx && u.y === ty);
  if (i < 0) return;
  const [u] = s.powerUps.splice(i, 1);
  const p = s.player;
  if (u.kind === "bomb") p.maxBombs = Math.min(MAX_BOMBS, p.maxBombs + 1);
  else if (u.kind === "range") p.range = Math.min(MAX_RANGE, p.range + 1);
  else p.speed = Math.min(MAX_SPEED, p.speed + 0.6);
  s.score += 50;
  events.push({ type: "powerUp", kind: u.kind, x: tx, y: ty });
}

/** Detona las bombas con la mecha agotada; una llama que alcanza otra bomba la hace estallar al instante. */
function detonate(s: BombermanState, events: GameEvent[], chain: { kills: number }): void {
  for (;;) {
    const bomb = s.bombs.find((b) => b.fuse <= 0);
    if (!bomb) break;
    s.bombs = s.bombs.filter((b) => b !== bomb);
    const { cells, destroyed } = blastCells(s.grid, bomb.tx, bomb.ty, bomb.range);
    events.push({ type: "explode", x: bomb.tx, y: bomb.ty, cells });

    for (const [x, y] of cells) {
      const flame = s.flames.find((f) => f.x === x && f.y === y);
      if (flame) flame.ttl = FLAME_MS;
      else s.flames.push({ x, y, ttl: FLAME_MS });
      for (const other of s.bombs) if (other.tx === x && other.ty === y) other.fuse = 0;
    }
    for (const [x, y] of destroyed) {
      s.grid[y][x] = EMPTY;
      s.score += 10;
      events.push({ type: "blockDestroyed", x, y });
      const h = s.hidden.findIndex((u) => u.x === x && u.y === y);
      if (h >= 0) s.powerUps.push(...s.hidden.splice(h, 1));
    }
  }
  burn(s, events, chain);
}

function inFlames(s: BombermanState, x: number, y: number): boolean {
  const [tx, ty] = tileOf(x, y);
  return s.flames.some((f) => f.x === tx && f.y === ty);
}

/** Las llamas matan a quien esté en ellas; cada muerte seguida en la misma explosión vale el doble. */
function burn(s: BombermanState, events: GameEvent[], chain: { kills: number }): void {
  if (!s.flames.length) return;
  const survivors: Enemy[] = [];
  for (const e of s.enemies) {
    if (!inFlames(s, e.x, e.y)) {
      survivors.push(e);
      continue;
    }
    chain.kills++;
    const points = ENEMY_POINTS[e.kind] * 2 ** Math.min(chain.kills - 1, 3);
    s.score += points;
    events.push({ type: "enemyKilled", kind: e.kind, x: e.x, y: e.y, points, chain: chain.kills });
  }
  s.enemies = survivors;
  if (s.status === "playing" && s.player.invuln <= 0 && inFlames(s, s.player.x, s.player.y)) hitPlayer(s, events, false);
}

function touchEnemies(s: BombermanState, events: GameEvent[]): void {
  if (s.player.invuln > 0 || s.status !== "playing") return;
  if (s.enemies.some((e) => Math.hypot(e.x - s.player.x, e.y - s.player.y) < 0.7)) hitPlayer(s, events, false);
}

function hitPlayer(s: BombermanState, events: GameEvent[], timeout: boolean): void {
  const p = s.player;
  p.lives--;
  events.push({ type: "playerHit", lives: p.lives });
  if (p.lives <= 0) {
    s.status = "over";
    p.held = null;
    p.moving = false;
    events.push({ type: "over" });
    return;
  }
  // Reaparece en la salida con un respiro; si fue por el reloj, no se pierde el tablero
  p.x = s.start.x + 0.5;
  p.y = s.start.y + 0.5;
  p.invuln = INVULN_MS;
  if (!timeout) p.held = null;
}

function moveEnemies(s: BombermanState, dt: number, rng: Rng): void {
  const bombs = new Set(s.bombs.map((b) => key(b.tx, b.ty)));
  const danger = dangerTiles(s);
  const target = { x: Math.floor(s.player.x), y: Math.floor(s.player.y) };

  for (const e of s.enemies) {
    let dist = (ENEMY_SPEED[e.kind] * dt) / 1000;
    // Un paso por casilla: al llegar al centro se decide el siguiente
    for (let guard = 0; guard < 4 && dist > 1e-6; guard++) {
      const gx = e.tx + 0.5;
      const gy = e.ty + 0.5;
      const d = Math.hypot(gx - e.x, gy - e.y);
      if (d > dist) {
        e.x += ((gx - e.x) / d) * dist;
        e.y += ((gy - e.y) / d) * dist;
        break;
      }
      e.x = gx;
      e.y = gy;
      dist -= d;
      const next = nextTile(e.kind, { grid: s.grid, bombs, danger, from: { x: e.tx, y: e.ty }, last: e.last, target, rng });
      if (!next) break;
      e.last = { dx: next.x - e.tx, dy: next.y - e.ty };
      e.tx = next.x;
      e.ty = next.y;
    }
  }
}

/** Casillas que arden ahora o arderán con las bombas puestas (incluidas las que encadenan). */
function dangerTiles(s: BombermanState): Set<string> {
  const out = new Set<string>();
  for (const f of s.flames) out.add(key(f.x, f.y));
  for (const b of s.bombs) for (const [x, y] of blastCells(s.grid, b.tx, b.ty, b.range).cells) out.add(key(x, y));
  return out;
}
