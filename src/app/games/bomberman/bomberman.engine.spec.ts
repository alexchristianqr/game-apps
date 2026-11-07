import { BASE_SPEED, type Bomb, type BombermanState, createGame, FLAME_MS, nextLevel, OVERTIME_MS, step } from "./bomberman.engine";
import { BLOCK, EMPTY } from "./bomberman.levels";

function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = (): number => 0.5;

/** Arena sin bloques, enemigos ni mejoras: cada test coloca solo lo que necesita. */
function arena(): BombermanState {
  const s = createGame(seeded(1), 1);
  return { ...s, grid: s.grid.map((row) => row.map((c) => (c === BLOCK ? EMPTY : c))), enemies: [], hidden: [], powerUps: [], exit: { x: 13, y: 11 } };
}

const bombAt = (tx: number, ty: number, fuse = 10, range = 2): Bomb => ({ id: 99, tx, ty, fuse, range, passable: false });
const far = { x: 11.5, y: 11.5 };

describe("bomberman engine", () => {
  it("is deterministic: same seed and actions give the same game", () => {
    const run = (): BombermanState => {
      const r = seeded(42);
      let s = createGame(r, 2);
      s = step(s, { type: "dir", dir: "right" }, r);
      for (let i = 0; i < 120; i++) s = step(s, { type: "tick", dt: 16 }, r);
      s = step(s, { type: "bomb" }, r);
      for (let i = 0; i < 200; i++) s = step(s, { type: "tick", dt: 16 }, r);
      return s;
    };
    expect(run()).toEqual(run());
  });

  it("does not mutate the previous state", () => {
    const s = arena();
    const before = JSON.stringify(s);
    step(step(s, { type: "bomb" }, rng), { type: "tick", dt: 3000 }, rng);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("walks at the player speed and stops when the key is released", () => {
    let s = step(arena(), { type: "dir", dir: "right" }, rng);
    s = step(s, { type: "tick", dt: 500 }, rng);
    expect(s.player.x).toBeCloseTo(1.5 + BASE_SPEED * 0.5, 1);
    s = step(s, { type: "dir", dir: null }, rng);
    const x = s.player.x;
    expect(step(s, { type: "tick", dt: 200 }, rng).player.x).toBe(x);
  });

  it("places one bomb per tile and respects the limit", () => {
    let s = step(arena(), { type: "bomb" }, rng);
    expect(s.bombs).toHaveLength(1);
    expect(s.events).toContainEqual({ type: "bombPlaced", x: 1, y: 1 });
    s = step(s, { type: "bomb" }, rng);
    expect(s.bombs).toHaveLength(1);
    // Con una sola bomba permitida, otra casilla tampoco vale
    s = { ...s, player: { ...s.player, x: 5.5, y: 1.5 } };
    expect(step(s, { type: "bomb" }, rng).bombs).toHaveLength(1);
  });

  it("lets the player walk off the bomb he just placed, but not back onto it", () => {
    let s = step(arena(), { type: "bomb" }, rng);
    s = step(s, { type: "dir", dir: "right" }, rng);
    s = step(s, { type: "tick", dt: 600 }, rng);
    expect(s.player.x).toBeGreaterThan(2.5);
    s = step(s, { type: "dir", dir: "left" }, rng);
    s = step(s, { type: "tick", dt: 800 }, rng);
    expect(s.player.x).toBeGreaterThan(2.3);
  });

  it("explodes after the fuse and leaves flames for half a second", () => {
    let s = { ...arena(), player: { ...arena().player, ...far } };
    s = { ...s, bombs: [bombAt(1, 1, 100)] };
    s = step(s, { type: "tick", dt: 120 }, rng);
    const blast = s.events.find((e) => e.type === "explode");
    expect(blast).toBeDefined();
    expect(s.bombs).toHaveLength(0);
    expect(s.flames.length).toBeGreaterThan(3);
    s = step(s, { type: "tick", dt: FLAME_MS + 10 }, rng);
    expect(s.flames).toHaveLength(0);
  });

  it("kills enemies on the X and Y axes but not off the cross", () => {
    let s = arena();
    s = {
      ...s,
      player: { ...s.player, ...far },
      bombs: [bombAt(5, 5, 10, 3)],
      enemies: [
        { id: 1, kind: "balloon", x: 7.5, y: 5.5, tx: 7, ty: 5, last: null },
        { id: 2, kind: "balloon", x: 5.5, y: 7.5, tx: 5, ty: 7, last: null },
        { id: 3, kind: "balloon", x: 7.5, y: 7.5, tx: 7, ty: 7, last: null }
      ]
    };
    s = step(s, { type: "tick", dt: 20 }, rng);
    expect(s.enemies.map((e) => e.id)).toEqual([3]);
    expect(s.score).toBe(100 + 200);
  });

  it("doubles the points for each chained kill in the same explosion", () => {
    let s = arena();
    s = {
      ...s,
      player: { ...s.player, ...far },
      bombs: [bombAt(5, 5, 10, 4)],
      enemies: [
        { id: 1, kind: "balloon", x: 6.5, y: 5.5, tx: 6, ty: 5, last: null },
        { id: 2, kind: "ghost", x: 7.5, y: 5.5, tx: 7, ty: 5, last: null },
        { id: 3, kind: "hunter", x: 3.5, y: 5.5, tx: 3, ty: 5, last: null }
      ]
    };
    s = step(s, { type: "tick", dt: 20 }, rng);
    const kills = s.events.filter((e) => e.type === "enemyKilled");
    expect(kills.map((k) => (k.type === "enemyKilled" ? k.points : 0))).toEqual([100, 400, 1600]);
  });

  it("chains bombs: a flame detonates the bombs it reaches", () => {
    let s = arena();
    s = { ...s, player: { ...s.player, ...far }, bombs: [bombAt(5, 5, 10, 3), { ...bombAt(8, 5, 5000, 1), id: 100 }] };
    s = step(s, { type: "tick", dt: 20 }, rng);
    expect(s.events.filter((e) => e.type === "explode")).toHaveLength(2);
    expect(s.bombs).toHaveLength(0);
  });

  it("destroys the first block, scores it and reveals a hidden power-up", () => {
    let s = arena();
    s.grid[5][7] = BLOCK;
    s.grid[5][8] = BLOCK;
    s = { ...s, player: { ...s.player, ...far }, bombs: [bombAt(5, 5, 10, 4)], hidden: [{ x: 7, y: 5, kind: "range" }] };
    s = step(s, { type: "tick", dt: 20 }, rng);
    expect(s.grid[5][7]).toBe(EMPTY);
    expect(s.grid[5][8]).toBe(BLOCK);
    expect(s.score).toBe(10);
    expect(s.powerUps).toEqual([{ x: 7, y: 5, kind: "range" }]);
  });

  it("hurts the player in the flames, then protects him for a while", () => {
    let s = arena();
    s = { ...s, bombs: [bombAt(1, 1)] };
    s = step(s, { type: "tick", dt: 20 }, rng);
    expect(s.player.lives).toBe(2);
    expect(s.player.invuln).toBeGreaterThan(0);
    expect(s.events).toContainEqual({ type: "playerHit", lives: 2 });
    s = step(s, { type: "tick", dt: 100 }, rng);
    expect(s.player.lives).toBe(2);
  });

  it("hurts the player who touches an enemy", () => {
    let s = arena();
    s = { ...s, enemies: [{ id: 1, kind: "balloon", x: 1.6, y: 1.5, tx: 1, ty: 1, last: null }] };
    s = step(s, { type: "tick", dt: 16 }, rng);
    expect(s.player.lives).toBe(2);
  });

  it("ends the game on the last life and then ignores actions", () => {
    let s = arena();
    s = { ...s, player: { ...s.player, lives: 1 }, bombs: [bombAt(1, 1)] };
    s = step(s, { type: "tick", dt: 20 }, rng);
    expect(s.status).toBe("over");
    expect(s.events).toContainEqual({ type: "over" });
    expect(step(s, { type: "tick", dt: 100 }, rng)).toBe(s);
  });

  it("costs a life when the clock runs out and gives overtime", () => {
    let s = { ...arena(), timeLeft: 10 };
    s = step(s, { type: "tick", dt: 20 }, rng);
    expect(s.player.lives).toBe(2);
    expect(s.timeLeft).toBeCloseTo(OVERTIME_MS - 0, -3);
  });

  it("picks up power-ups", () => {
    let s = arena();
    s = { ...s, powerUps: [{ x: 1, y: 1, kind: "bomb" }] };
    s = step(s, { type: "tick", dt: 16 }, rng);
    expect(s.player.maxBombs).toBe(2);
    expect(s.powerUps).toHaveLength(0);
    s = { ...s, powerUps: [{ x: 1, y: 1, kind: "speed" }] };
    s = step(s, { type: "tick", dt: 16 }, rng);
    expect(s.player.speed).toBeGreaterThan(BASE_SPEED);
  });

  it("opens the exit when the last enemy dies and clears the level on reaching it", () => {
    let s = arena();
    s = { ...s, exit: { x: 3, y: 1 }, player: { ...s.player, x: 3.5, y: 1.5 } };
    s = step(s, { type: "tick", dt: 16 }, rng);
    expect(s.events.some((e) => e.type === "exitOpen")).toBe(true);
    expect(s.status).toBe("levelClear");
    expect(s.score).toBeGreaterThan(0);
  });

  it("keeps the exit closed while enemies remain", () => {
    let s = arena();
    s = { ...s, exit: { x: 3, y: 1 }, player: { ...s.player, x: 3.5, y: 1.5 }, enemies: [{ id: 1, kind: "balloon", x: 11.5, y: 11.5, tx: 11, ty: 11, last: null }] };
    s = step(s, { type: "tick", dt: 16 }, rng);
    expect(s.status).toBe("playing");
    expect(s.exitOpen).toBe(false);
  });

  it("carries lives, power-ups and score to the next level", () => {
    let s = arena();
    s = { ...s, score: 700, player: { ...s.player, lives: 2, maxBombs: 3, range: 5 } };
    const n = nextLevel(s, seeded(2));
    expect(n.level).toBe(2);
    expect(n.score).toBe(700);
    expect(n.player.lives).toBe(2);
    expect(n.player.maxBombs).toBe(3);
    expect(n.player.range).toBe(5);
    expect(n.enemies.length).toBeGreaterThan(0);
  });

  it("enemies move and never leave walkable tiles", () => {
    const r = seeded(7);
    let s = createGame(r, 3);
    s = { ...s, player: { ...s.player, invuln: 1e9 } };
    for (let i = 0; i < 600; i++) s = step(s, { type: "tick", dt: 16 }, r);
    for (const e of s.enemies) {
      const cell = s.grid[Math.floor(e.y)][Math.floor(e.x)];
      expect(cell === 1).toBe(false);
      if (e.kind !== "ghost") expect(cell).toBe(EMPTY);
    }
  });
});
