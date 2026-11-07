import { emptyBoard, winningLine, type Cell } from "./tic-tac-toe.logic";

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
