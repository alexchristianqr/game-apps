import { clearLines, collides, COLS, comboScore, dropDistance, emptyBoard, gravityMs, levelFor, lineScore, lockPiece, newBag, refill, ROWS, spawn, type Board } from "./tetris.logic";
import { kicksFor, PIECE_IDS, PIECES } from "./tetris.pieces";

/** RNG determinista sencillo (LCG) */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function fillRow(board: Board, y: number, skip: number[] = []): Board {
  return board.map((row, i) => (i === y ? row.map((_, x) => (skip.includes(x) ? null : "I")) : row));
}

describe("pieces", () => {
  it("every piece keeps 4 cells in all 4 rotations", () => {
    for (const id of PIECE_IDS) for (const r of PIECES[id].rotations) expect(r.length, id).toBe(4);
  });

  it("rotating clockwise turns the T spawn into the expected shapes", () => {
    const key = (cells: readonly (readonly number[])[]): string =>
      cells
        .map((c) => c.join())
        .sort()
        .join(";");
    const { rotations } = PIECES.T;
    expect(key(rotations[1])).toBe(
      key([
        [1, 0],
        [1, 1],
        [2, 1],
        [1, 2]
      ])
    );
    expect(key(rotations[2])).toBe(
      key([
        [0, 1],
        [1, 1],
        [2, 1],
        [1, 2]
      ])
    );
    expect(key(rotations[3])).toBe(
      key([
        [1, 0],
        [0, 1],
        [1, 1],
        [1, 2]
      ])
    );
  });

  it("O has no kicks and I has its own table", () => {
    expect(kicksFor("O", 0, 1)).toEqual([[0, 0]]);
    expect(kicksFor("I", 0, 1)).toHaveLength(5);
    expect(kicksFor("T", 0, 1)[1]).toEqual([-1, 0]);
  });
});

describe("board", () => {
  it("detects walls, floor and occupied cells", () => {
    const board = emptyBoard();
    expect(collides(board, { id: "O", rot: 0, x: -1, y: 5 })).toBe(true);
    expect(collides(board, { id: "O", rot: 0, x: COLS - 1, y: 5 })).toBe(true);
    expect(collides(board, { id: "O", rot: 0, x: 4, y: ROWS - 1 })).toBe(true);
    expect(collides(board, { id: "O", rot: 0, x: 4, y: ROWS - 2 })).toBe(false);
    const locked = lockPiece(board, { id: "O", rot: 0, x: 4, y: ROWS - 2 });
    expect(collides(locked, { id: "O", rot: 0, x: 4, y: ROWS - 4 + 1 })).toBe(true);
  });

  it("computes the ghost distance down to the floor and onto the stack", () => {
    const piece = spawn("O");
    expect(dropDistance(emptyBoard(), piece)).toBe(ROWS - 2 - piece.y);
    const stacked = fillRow(emptyBoard(), ROWS - 1);
    expect(dropDistance(stacked, piece)).toBe(ROWS - 3 - piece.y);
  });

  it("clears full rows and shifts the rest down", () => {
    let board = emptyBoard();
    board = fillRow(board, ROWS - 1);
    board = fillRow(board, ROWS - 2);
    board = fillRow(board, ROWS - 3, [0]);
    const result = clearLines(board);
    expect(result.rows).toEqual([ROWS - 2, ROWS - 1]);
    expect(result.board).toHaveLength(ROWS);
    // La fila incompleta bajó al fondo
    expect(result.board[ROWS - 1].filter((c) => c !== null)).toHaveLength(COLS - 1);
  });

  it("returns the same board when nothing is complete", () => {
    const board = emptyBoard();
    expect(clearLines(board).board).toBe(board);
  });
});

describe("7-bag", () => {
  it("each bag has all 7 pieces exactly once", () => {
    const bag = newBag(seeded(1));
    expect([...bag].sort()).toEqual([...PIECE_IDS].sort());
  });

  it("refill keeps at least 7 in queue without losing the existing order", () => {
    const queue = refill(["T", "I"], seeded(2));
    expect(queue.length).toBeGreaterThanOrEqual(7);
    expect(queue.slice(0, 2)).toEqual(["T", "I"]);
  });
});

describe("scoring", () => {
  it("scales line points by level and rewards back-to-back tetrises", () => {
    expect(lineScore(1, 1, false)).toBe(100);
    expect(lineScore(2, 3, false)).toBe(900);
    expect(lineScore(4, 1, false)).toBe(800);
    expect(lineScore(4, 1, true)).toBe(1200);
    expect(lineScore(3, 1, true)).toBe(500);
  });

  it("adds a combo bonus only from the second consecutive clear", () => {
    expect(comboScore(0, 2)).toBe(0);
    expect(comboScore(2, 2)).toBe(200);
  });

  it("levels up every 10 lines and speeds up gravity", () => {
    expect(levelFor(9)).toBe(1);
    expect(levelFor(10)).toBe(2);
    expect(levelFor(25, 5)).toBe(7);
    expect(gravityMs(1)).toBe(1000);
    expect(gravityMs(5)).toBeLessThan(gravityMs(1));
    expect(gravityMs(99)).toBeGreaterThanOrEqual(16);
  });
});
