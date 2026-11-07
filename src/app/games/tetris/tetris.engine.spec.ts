import { createGame, grounded, LOCK_DELAY_MS, MAX_LOCK_RESETS, step, type TetrisState } from "./tetris.engine";
import { COLS, emptyBoard, ROWS, type Board } from "./tetris.logic";

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Partida con una pieza concreta activa y un tablero dado */
function withState(over: Partial<TetrisState>): TetrisState {
  return { ...createGame(seeded(7)), ...over };
}

function rowWithGap(gapStart: number, gapSize: number): ("I" | null)[] {
  return Array.from({ length: COLS }, (_, x) => (x >= gapStart && x < gapStart + gapSize ? null : "I"));
}

describe("engine", () => {
  const rng = seeded(42);

  it("is deterministic for a given seed", () => {
    const a = createGame(seeded(1));
    const b = createGame(seeded(1));
    expect(a.active.id).toBe(b.active.id);
    expect(a.queue).toEqual(b.queue);
  });

  it("moves left/right and stops at the wall", () => {
    let s = createGame(seeded(3));
    for (let i = 0; i < 20; i++) s = step(s, { type: "left" }, rng);
    const atWall = s.active.x;
    expect(step(s, { type: "left" }, rng).active.x).toBe(atWall);
    expect(step(s, { type: "right" }, rng).active.x).toBe(atWall + 1);
  });

  it("gravity pulls the piece down over time", () => {
    const s = createGame(seeded(3));
    const after = step(s, { type: "tick", dt: 1000 }, rng);
    expect(after.active.y).toBe(s.active.y + 1);
  });

  it("soft drop scores 1 per row and hard drop 2 per row, then locks", () => {
    const s = createGame(seeded(5));
    const soft = step(s, { type: "softDrop" }, rng);
    expect(soft.score).toBe(1);
    const hard = step(s, { type: "hardDrop" }, rng);
    expect(hard.score).toBeGreaterThanOrEqual(2);
    expect(hard.events.map((e) => e.type)).toContain("lock");
    expect(hard.board.some((row) => row.some((c) => c !== null))).toBe(true);
  });

  it("locks after the lock delay once grounded", () => {
    let s = step(createGame(seeded(5)), { type: "hardDrop" }, rng);
    // Se baja con gravedad hasta apoyar y luego se espera el retardo
    for (let i = 0; i < 40 && !grounded(s); i++) s = step(s, { type: "softDrop" }, rng);
    const locked = step(s, { type: "tick", dt: LOCK_DELAY_MS }, rng);
    expect(locked.events.map((e) => e.type)).toContain("lock");
  });

  it("limits lock-delay resets so a piece cannot stall forever", () => {
    let s = withState({ active: { id: "O", rot: 0, x: 4, y: ROWS - 2 } });
    expect(grounded(s)).toBe(true);
    for (let i = 0; i < MAX_LOCK_RESETS + 3; i++) s = step(s, { type: i % 2 ? "left" : "right" }, rng);
    expect(s.lockResets).toBe(MAX_LOCK_RESETS);
  });

  it("clears a line, scores it and tracks combo / back-to-back", () => {
    const board = emptyBoard().map((row, y) => (y === ROWS - 1 ? rowWithGap(0, 2) : row)) as Board;
    // O vertical en columnas 0-1: completa la fila inferior
    const s = withState({ board, active: { id: "O", rot: 0, x: 0, y: 0 } });
    const result = step(s, { type: "hardDrop" }, rng);
    expect(result.lines).toBe(1);
    expect(result.combo).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(100);
    const clear = result.events.find((e) => e.type === "clear");
    expect(clear).toMatchObject({ lines: 1, rows: [ROWS - 1] });
  });

  it("a Tetris scores 800 and a second one in a row gets the 1.5× bonus", () => {
    const four = (gap: number): Board => emptyBoard().map((row, y) => (y >= ROWS - 4 ? rowWithGap(gap, 1) : row)) as Board;
    // I vertical (rot 1) en la columna libre
    const first = step(withState({ board: four(9), active: { id: "I", rot: 1, x: 7, y: 0 } }), { type: "hardDrop" }, rng);
    expect(first.lines).toBe(4);
    expect(first.score).toBeGreaterThanOrEqual(800);
    expect(first.backToBack).toBe(true);
    const second = step({ ...first, board: four(9), active: { id: "I", rot: 1, x: 7, y: 0 }, score: 0 }, { type: "hardDrop" }, rng);
    expect(second.events.find((e) => e.type === "clear")).toMatchObject({ backToBack: true });
    expect(second.score).toBeGreaterThanOrEqual(1200);
  });

  it("levels up when reaching 10 lines", () => {
    const board = emptyBoard().map((row, y) => (y === ROWS - 1 ? rowWithGap(0, 2) : row)) as Board;
    const s = withState({ board, active: { id: "O", rot: 0, x: 0, y: 0 }, lines: 9 });
    const result = step(s, { type: "hardDrop" }, rng);
    expect(result.level).toBe(2);
    expect(result.events.map((e) => e.type)).toContain("levelUp");
  });

  it("hold works once per piece and swaps with the held one", () => {
    const s = createGame(seeded(9));
    const first = s.active.id;
    const held = step(s, { type: "hold" }, rng);
    expect(held.hold).toBe(first);
    expect(held.canHold).toBe(false);
    expect(step(held, { type: "hold" }, rng).active).toBe(held.active);
    const after = step(held, { type: "hardDrop" }, rng);
    expect(after.canHold).toBe(true);
    const swapped = step(after, { type: "hold" }, rng);
    expect(swapped.active.id).toBe(first);
  });

  it("ends the game when a piece spawns on a full stack", () => {
    const board = emptyBoard().map((row, y) => (y < 4 ? rowWithGap(0, 0).map((_, x) => (x === 0 ? null : "I")) : row)) as Board;
    const s = withState({ board, active: { id: "O", rot: 0, x: 4, y: 10 } });
    const over = step(s, { type: "hardDrop" }, rng);
    expect(over.status).toBe("over");
    expect(over.events.map((e) => e.type)).toContain("over");
    expect(step(over, { type: "left" }, rng)).toBe(over);
  });

  it("rotates against the wall using kicks", () => {
    // T pegada a la izquierda: girar necesita un desplazamiento
    let s = withState({ active: { id: "T", rot: 0, x: -1, y: 10 } });
    s = step(s, { type: "cw" }, rng);
    expect(s.events.map((e) => e.type)).toContain("rotate");
    expect(s.active.rot).toBe(1);
  });
});
