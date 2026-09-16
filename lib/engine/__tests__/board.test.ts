import { describe, it, expect } from "vitest";
import {
  createBoard,
  dropDisc,
  getWinningCells,
  checkWin,
  checkDraw,
  getValidColumns,
  getDropRow,
  getOpponent,
  ROWS,
  COLS,
  PLAYER,
} from "../board";

describe("createBoard", () => {
  it("creates a 6x7 grid filled with EMPTY", () => {
    const board = createBoard();

    expect(board).toHaveLength(ROWS);
    board.forEach((row) => {
      expect(row).toHaveLength(COLS);
      row.forEach((cell) => expect(cell).toBe(PLAYER.EMPTY));
    });
  });

  it("gives each row its own independent array (no shared references)", () => {
    const board = createBoard();

    board[0][0] = PLAYER.RED;

    // A common bug is filling rows with the *same* array reference, which
    // would make every row "see" this mutation. Rows 1+ must stay empty.
    expect(board[1][0]).toBe(PLAYER.EMPTY);
    expect(board[5][0]).toBe(PLAYER.EMPTY);
  });
});

describe("getOpponent", () => {
  it("returns YELLOW for RED and RED for YELLOW", () => {
    expect(getOpponent(PLAYER.RED)).toBe(PLAYER.YELLOW);
    expect(getOpponent(PLAYER.YELLOW)).toBe(PLAYER.RED);
  });
});

describe("dropDisc", () => {
  it("places the disc in the lowest empty row of the target column", () => {
    const board = createBoard();

    const result = dropDisc(board, 3, PLAYER.RED);

    expect(result).not.toBeNull();
    expect(result![5][3]).toBe(PLAYER.RED);
  });

  it("stacks discs bottom-up on repeated drops into the same column", () => {
    let board = createBoard();
    board = dropDisc(board, 2, PLAYER.RED)!;
    board = dropDisc(board, 2, PLAYER.YELLOW)!;
    board = dropDisc(board, 2, PLAYER.RED)!;

    expect(board[5][2]).toBe(PLAYER.RED); // first drop lands on the floor
    expect(board[4][2]).toBe(PLAYER.YELLOW); // second stacks on top
    expect(board[3][2]).toBe(PLAYER.RED); // third stacks again
    expect(board[2][2]).toBe(PLAYER.EMPTY); // rest of the column untouched
  });

  it("does not mutate the original board (returns a new board)", () => {
    const board = createBoard();

    const result = dropDisc(board, 0, PLAYER.RED);

    expect(board[5][0]).toBe(PLAYER.EMPTY); // original untouched
    expect(result![5][0]).toBe(PLAYER.RED); // new board has the disc
  });

  it("returns null when the column is already full", () => {
    let board = createBoard();
    for (let i = 0; i < ROWS; i++) {
      board = dropDisc(board, 4, PLAYER.RED)!;
    }

    const result = dropDisc(board, 4, PLAYER.YELLOW);

    expect(result).toBeNull();
  });

  it("returns null for an out-of-range column (negative or too large)", () => {
    const board = createBoard();

    expect(dropDisc(board, -1, PLAYER.RED)).toBeNull();
    expect(dropDisc(board, COLS, PLAYER.RED)).toBeNull();
  });
});

describe("getWinningCells", () => {
  it("detects a horizontal win", () => {
    const board = createBoard();
    board[5][0] = PLAYER.RED;
    board[5][1] = PLAYER.RED;
    board[5][2] = PLAYER.RED;
    board[5][3] = PLAYER.RED;

    expect(getWinningCells(board, PLAYER.RED)).toEqual([
      [5, 0],
      [5, 1],
      [5, 2],
      [5, 3],
    ]);
  });

  it("detects a horizontal win flush against the right edge of the board", () => {
    const board = createBoard();
    board[0][3] = PLAYER.YELLOW;
    board[0][4] = PLAYER.YELLOW;
    board[0][5] = PLAYER.YELLOW;
    board[0][6] = PLAYER.YELLOW;

    expect(getWinningCells(board, PLAYER.YELLOW)).toEqual([
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 6],
    ]);
  });

  it("detects a vertical win", () => {
    const board = createBoard();
    board[2][0] = PLAYER.RED;
    board[3][0] = PLAYER.RED;
    board[4][0] = PLAYER.RED;
    board[5][0] = PLAYER.RED;

    expect(getWinningCells(board, PLAYER.RED)).toEqual([
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
    ]);
  });

  it("detects a positive-slope diagonal win (/)", () => {
    const board = createBoard();
    board[3][0] = PLAYER.YELLOW;
    board[2][1] = PLAYER.YELLOW;
    board[1][2] = PLAYER.YELLOW;
    board[0][3] = PLAYER.YELLOW;

    expect(getWinningCells(board, PLAYER.YELLOW)).toEqual([
      [3, 0],
      [2, 1],
      [1, 2],
      [0, 3],
    ]);
  });

  it("detects a negative-slope diagonal win (\\)", () => {
    const board = createBoard();
    board[0][0] = PLAYER.RED;
    board[1][1] = PLAYER.RED;
    board[2][2] = PLAYER.RED;
    board[3][3] = PLAYER.RED;

    expect(getWinningCells(board, PLAYER.RED)).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });

  it("returns an empty array when there is no win", () => {
    const board = createBoard();
    board[5][0] = PLAYER.RED;
    board[5][1] = PLAYER.RED;

    expect(getWinningCells(board, PLAYER.RED)).toEqual([]);
  });

  it("does not count a line with a mix of both players' discs", () => {
    const board = createBoard();
    board[5][0] = PLAYER.RED;
    board[5][1] = PLAYER.RED;
    board[5][2] = PLAYER.YELLOW; // breaks the run
    board[5][3] = PLAYER.RED;

    expect(getWinningCells(board, PLAYER.RED)).toEqual([]);
  });

  it("returns exactly 4 cells even when two winning lines exist at once", () => {
    const board = createBoard();
    // Horizontal win on row 5, plus a vertical win sharing column 0.
    board[5][0] = PLAYER.RED;
    board[5][1] = PLAYER.RED;
    board[5][2] = PLAYER.RED;
    board[5][3] = PLAYER.RED;
    board[4][0] = PLAYER.RED;
    board[3][0] = PLAYER.RED;
    board[2][0] = PLAYER.RED;

    expect(getWinningCells(board, PLAYER.RED)).toHaveLength(4);
  });
});

describe("checkWin", () => {
  it("returns true when the player has a winning line", () => {
    const board = createBoard();
    board[5][0] = PLAYER.RED;
    board[5][1] = PLAYER.RED;
    board[5][2] = PLAYER.RED;
    board[5][3] = PLAYER.RED;

    expect(checkWin(board, PLAYER.RED)).toBe(true);
  });

  it("returns false when the player has no winning line", () => {
    const board = createBoard();

    expect(checkWin(board, PLAYER.RED)).toBe(false);
  });
});

describe("checkDraw", () => {
  it("returns false on an empty board", () => {
    expect(checkDraw(createBoard())).toBe(false);
  });

  it("returns false on a partially filled board with no winner", () => {
    const board = createBoard();
    board[5][0] = PLAYER.RED;

    expect(checkDraw(board)).toBe(false);
  });

  // Full 6x7 board with no 4-in-a-row for either player in any direction
  // (verified by brute-force search, not just eyeballed).
  const NO_WIN_FULL_BOARD = [
    [1, 1, 1, 2, 2, 1, 1],
    [2, 2, 1, 1, 1, 2, 2],
    [2, 1, 1, 1, 2, 1, 1],
    [2, 2, 2, 1, 2, 1, 1],
    [1, 2, 1, 2, 1, 2, 1],
    [2, 2, 1, 2, 1, 2, 2],
  ];

  it("returns true when the board is completely full with no winner", () => {
    const board = NO_WIN_FULL_BOARD.map((row) => [...row]);

    expect(getValidColumns(board)).toEqual([]);
    expect(checkWin(board, PLAYER.RED)).toBe(false);
    expect(checkWin(board, PLAYER.YELLOW)).toBe(false);
    expect(checkDraw(board)).toBe(true);
  });

  it("returns false when the board is full but a player has actually won", () => {
    // Same full board, but row 0 overwritten into a horizontal win for
    // YELLOW — a full board is NOT automatically a draw.
    const board = NO_WIN_FULL_BOARD.map((row) => [...row]);
    board[0][0] = PLAYER.YELLOW;
    board[0][1] = PLAYER.YELLOW;
    board[0][2] = PLAYER.YELLOW;
    board[0][3] = PLAYER.YELLOW;

    expect(getValidColumns(board)).toEqual([]);
    expect(checkDraw(board)).toBe(false);
  });
});

describe("getValidColumns", () => {
  it("returns every column index on an empty board", () => {
    expect(getValidColumns(createBoard())).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("excludes columns that are full", () => {
    let board = createBoard();
    for (let i = 0; i < ROWS; i++) {
      board = dropDisc(board, 2, PLAYER.RED)!;
    }

    expect(getValidColumns(board)).toEqual([0, 1, 3, 4, 5, 6]);
  });

  it("returns an empty array when the whole board is full", () => {
    let board = createBoard();
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        board = dropDisc(board, c, PLAYER.RED)!;
      }
    }

    expect(getValidColumns(board)).toEqual([]);
  });
});

describe("getDropRow", () => {
  it("returns the bottom row for an empty column", () => {
    expect(getDropRow(createBoard(), 0)).toBe(5);
  });

  it("returns the next empty row above existing discs", () => {
    let board = createBoard();
    board = dropDisc(board, 0, PLAYER.RED)!;
    board = dropDisc(board, 0, PLAYER.YELLOW)!;

    expect(getDropRow(board, 0)).toBe(3);
  });

  it("returns null for a full column", () => {
    let board = createBoard();
    for (let i = 0; i < ROWS; i++) {
      board = dropDisc(board, 6, PLAYER.RED)!;
    }

    expect(getDropRow(board, 6)).toBeNull();
  });

  it("returns null for an out-of-range column", () => {
    const board = createBoard();

    expect(getDropRow(board, -1)).toBeNull();
    expect(getDropRow(board, COLS)).toBeNull();
  });
});
