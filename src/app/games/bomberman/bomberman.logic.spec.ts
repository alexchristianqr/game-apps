import { BLOCK, COLS, EMPTY, generateLevel, isFixedWall, PLAYER_START, ROWS, WALL } from "./bomberman.levels";
import { blastCells, boxBlocked, moveBy } from "./bomberman.logic";

function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Arena sin bloques: solo el borde y los pilares. */
function emptyGrid(): number[][] {
  return Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => (isFixedWall(x, y) ? WALL : EMPTY)));
}

describe("blastCells", () => {
  it("draws a cross along the X and Y axes", () => {
    const { cells } = blastCells(emptyGrid() as never, 1, 1, 2);
    expect(cells).toContainEqual([1, 1]);
    expect(cells).toContainEqual([3, 1]);
    expect(cells).toContainEqual([1, 3]);
    // Los brazos nunca salen de los ejes
    expect(cells.every(([x, y]) => x === 1 || y === 1)).toBe(true);
  });

  it("stops at a fixed wall", () => {
    // (2,2) es un pilar: desde (2,1) el brazo hacia abajo no avanza nada
    const { cells } = blastCells(emptyGrid() as never, 2, 1, 4);
    expect(cells.filter(([x, y]) => x === 2 && y > 1)).toEqual([]);
    expect(cells).toContainEqual([6, 1]);
  });

  it("burns the first block and does not pass through it", () => {
    const grid = emptyGrid();
    grid[1][4] = BLOCK;
    grid[1][5] = BLOCK;
    const { cells, destroyed } = blastCells(grid as never, 1, 1, 6);
    expect(destroyed).toEqual([[4, 1]]);
    expect(cells).toContainEqual([4, 1]);
    expect(cells).not.toContainEqual([5, 1]);
  });

  it("limits each arm to the range", () => {
    const { cells } = blastCells(emptyGrid() as never, 1, 1, 1);
    expect(cells).toHaveLength(3);
  });
});

describe("moveBy", () => {
  it("does not walk through walls", () => {
    const grid = emptyGrid() as never;
    const out = moveBy(grid, [], { x: 1.5, y: 1.5 }, "up", 2);
    expect(out.y).toBeGreaterThanOrEqual(1.36 - 1e-9);
    expect(boxBlocked(grid, [], out.x, out.y)).toBe(false);
  });

  it("slides around a corner instead of getting stuck", () => {
    const grid = emptyGrid() as never;
    // Casi alineado con el pasillo de y=1: al pegar contra el pilar (2,2) se centra y sigue
    const out = moveBy(grid, [], { x: 1.5, y: 1.78 }, "right", 1.5);
    expect(out.x).toBeGreaterThan(2.5);
  });

  it("cannot cross a solid bomb but can leave its own tile while passable", () => {
    const grid = emptyGrid() as never;
    const solid = moveBy(grid, [{ tx: 3, ty: 1, passable: false }], { x: 1.5, y: 1.5 }, "right", 3);
    expect(solid.x).toBeLessThan(2.7);
    const passable = moveBy(grid, [{ tx: 3, ty: 1, passable: true }], { x: 3.5, y: 1.5 }, "right", 1);
    expect(passable.x).toBeGreaterThan(4);
  });

  it("lets a ghost pass through blocks", () => {
    const grid = emptyGrid();
    grid[1][3] = BLOCK;
    const walker = moveBy(grid as never, [], { x: 2.5, y: 1.5 }, "right", 1.5);
    const ghost = moveBy(grid as never, [], { x: 2.5, y: 1.5 }, "right", 1.5, true);
    expect(walker.x).toBeLessThan(2.7);
    expect(ghost.x).toBeGreaterThan(3.5);
  });
});

describe("generateLevel", () => {
  it("keeps borders and pillars fixed and the start area free", () => {
    const { grid } = generateLevel(1, seeded(3));
    expect(grid[0].every((c) => c === WALL)).toBe(true);
    expect(grid[2][2]).toBe(WALL);
    expect(grid[PLAYER_START.y][PLAYER_START.x]).toBe(EMPTY);
    expect(grid[1][2]).toBe(EMPTY);
    expect(grid[2][1]).toBe(EMPTY);
  });

  it("hides the exit under a block and spawns enemies away from the start", () => {
    const layout = generateLevel(3, seeded(11));
    expect(layout.grid[layout.exit.y][layout.exit.x]).toBe(BLOCK);
    expect(layout.enemies.length).toBeGreaterThan(0);
    for (const e of layout.enemies) expect(Math.abs(e.x - 1) + Math.abs(e.y - 1)).toBeGreaterThanOrEqual(7);
    for (const e of layout.enemies) expect(layout.grid[e.y][e.x]).toBe(EMPTY);
  });

  it("adds tougher enemies in later levels", () => {
    const first = generateLevel(1, seeded(5)).enemies.map((e) => e.kind);
    const third = generateLevel(3, seeded(5)).enemies.map((e) => e.kind);
    expect(first.every((k) => k === "balloon")).toBe(true);
    expect(third).toContain("ghost");
    expect(third).toContain("hunter");
  });

  it("is deterministic for the same seed", () => {
    expect(generateLevel(2, seeded(9))).toEqual(generateLevel(2, seeded(9)));
  });
});
