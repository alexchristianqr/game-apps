import { applyResult, EMPTY_SCORE, emptyBoard, isDraw, keyToIndex, moveFocus, other, outcomeOf, winningLine, type Cell } from "./tic-tac-toe.logic";

describe("winningLine", () => {
  it("returns null on an empty board", () => {
    expect(winningLine(emptyBoard())).toBeNull();
  });

  it("detects rows, columns and diagonals", () => {
    const cases: [number[], number[]][] = [
      [
        [0, 1, 2],
        [0, 1, 2]
      ],
      [
        [3, 4, 5],
        [3, 4, 5]
      ],
      [
        [0, 3, 6],
        [0, 3, 6]
      ],
      [
        [2, 5, 8],
        [2, 5, 8]
      ],
      [
        [0, 4, 8],
        [0, 4, 8]
      ],
      [
        [2, 4, 6],
        [2, 4, 6]
      ]
    ];
    for (const [cells, expected] of cases) {
      const board: Cell[] = emptyBoard();
      cells.forEach((i) => (board[i] = "X"));
      expect(winningLine(board)).toEqual(expected);
    }
  });

  it("ignores a draw", () => {
    const board: Cell[] = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    expect(winningLine(board)).toBeNull();
  });
});

describe("outcomeOf / isDraw", () => {
  it("reports the winner mark, a draw, or null while playing", () => {
    const win: Cell[] = ["O", "O", "O", 3, "X", "X", 6, 7, 8];
    const draw: Cell[] = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    expect(outcomeOf(win)).toBe("O");
    expect(outcomeOf(draw)).toBe("draw");
    expect(isDraw(draw)).toBe(true);
    expect(outcomeOf(emptyBoard())).toBeNull();
  });

  it("alternates marks", () => {
    expect(other("X")).toBe("O");
    expect(other("O")).toBe("X");
  });
});

describe("applyResult", () => {
  it("counts wins and tracks the best streak", () => {
    let s = applyResult(EMPTY_SCORE, "win");
    s = applyResult(s, "win");
    expect(s).toMatchObject({ wins: 2, streak: 2, best: 2 });
    s = applyResult(s, "loss");
    expect(s).toMatchObject({ losses: 1, streak: 0, best: 2 });
  });

  it("a draw breaks the streak without counting as a loss", () => {
    const s = applyResult(applyResult(EMPTY_SCORE, "win"), "draw");
    expect(s).toMatchObject({ draws: 1, losses: 0, streak: 0, best: 1 });
  });

  it("does not mutate the previous score", () => {
    applyResult(EMPTY_SCORE, "win");
    expect(EMPTY_SCORE.wins).toBe(0);
  });
});

describe("keyboard helpers", () => {
  it("maps digits to the numpad layout", () => {
    expect(keyToIndex("7")).toBe(0);
    expect(keyToIndex("5")).toBe(4);
    expect(keyToIndex("3")).toBe(8);
    expect(keyToIndex("0")).toBeNull();
    expect(keyToIndex("a")).toBeNull();
  });

  it("moves focus without wrapping", () => {
    expect(moveFocus(0, "ArrowLeft")).toBe(0);
    expect(moveFocus(0, "ArrowRight")).toBe(1);
    expect(moveFocus(4, "ArrowDown")).toBe(7);
    expect(moveFocus(8, "ArrowDown")).toBe(8);
  });
});
