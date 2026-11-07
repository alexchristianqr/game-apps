import { type AiContext, canEnter, nextTile } from "./bomberman.ai";
import { BLOCK, COLS, EMPTY, isFixedWall, key, ROWS, WALL } from "./bomberman.levels";

function emptyGrid(): number[][] {
  return Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => (isFixedWall(x, y) ? WALL : EMPTY)));
}

function ctx(partial: Partial<AiContext> & Pick<AiContext, "from">): AiContext {
  return { grid: emptyGrid() as never, bombs: new Set(), danger: new Set(), last: null, target: { x: 13, y: 11 }, rng: () => 0.5, ...partial };
}

describe("enemy AI", () => {
  it("lets only the ghost enter breakable blocks", () => {
    const grid = emptyGrid();
    grid[1][3] = BLOCK;
    expect(canEnter("balloon", grid as never, new Set(), 3, 1)).toBe(false);
    expect(canEnter("ghost", grid as never, new Set(), 3, 1)).toBe(true);
    expect(canEnter("ghost", grid as never, new Set(), 2, 2)).toBe(false);
  });

  it("nobody walks onto a bomb", () => {
    expect(canEnter("ghost", emptyGrid() as never, new Set([key(3, 1)]), 3, 1)).toBe(false);
  });

  it("the hunter steps toward the player along the shortest path", () => {
    // rng alto → siempre persigue
    const next = nextTile("hunter", ctx({ from: { x: 5, y: 1 }, target: { x: 1, y: 1 }, rng: () => 0.9 }));
    expect(next).toEqual({ x: 4, y: 1 });
  });

  it("the hunter routes around tiles that are about to burn", () => {
    const danger = new Set([key(4, 1)]);
    const next = nextTile("hunter", ctx({ from: { x: 5, y: 1 }, target: { x: 1, y: 1 }, danger, rng: () => 0.9 }));
    // El pasillo directo arde; no entra en él
    expect(next).not.toEqual({ x: 4, y: 1 });
  });

  it("a balloon keeps going straight when it can", () => {
    const next = nextTile("balloon", ctx({ from: { x: 3, y: 1 }, last: { dx: 1, dy: 0 }, rng: () => 0.1 }));
    expect(next).toEqual({ x: 4, y: 1 });
  });

  it("a balloon turns back only when boxed in", () => {
    const grid = emptyGrid();
    grid[1][4] = BLOCK;
    // (3,1): arriba y abajo hay pilar/borde en (3,0) pero (3,2) es libre; se cierra con bomba
    const next = nextTile("balloon", ctx({ grid: grid as never, from: { x: 3, y: 1 }, last: { dx: 1, dy: 0 }, bombs: new Set([key(3, 2)]), rng: () => 0.1 }));
    expect(next).toEqual({ x: 2, y: 1 });
  });

  it("waits still when every neighbour is dangerous", () => {
    const danger = new Set([key(2, 1), key(4, 1), key(3, 2)]);
    expect(nextTile("balloon", ctx({ from: { x: 3, y: 1 }, danger }))).toBeNull();
  });
});
