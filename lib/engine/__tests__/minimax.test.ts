import { describe, it, expect, vi, afterEach } from "vitest";
import { getDifficultyConfig, minimax, getBestMove } from "../minimax";
import { createBoard, dropDisc, getValidColumns, PLAYER } from "../board";

describe("getDifficultyConfig", () => {
  it.each([
    [1, { depth: 1, randomChance: 0.6 }],
    [2, { depth: 2, randomChance: 0.3 }],
    [3, { depth: 4, randomChance: 0.0 }],
    [4, { depth: 6, randomChance: 0.0 }],
    [5, { depth: 9, randomChance: 0.0 }],
  ])("maps level %i to %o", (level, expected) => {
    expect(getDifficultyConfig(level)).toEqual(expected);
  });

  it("falls back to the level-3 default for an unknown level", () => {
    const fallback = { depth: 4, randomChance: 0.0 };

    expect(getDifficultyConfig(0)).toEqual(fallback);
    expect(getDifficultyConfig(6)).toEqual(fallback);
    expect(getDifficultyConfig(-1)).toEqual(fallback);
  });
});

describe("minimax", () => {
  it("scores an immediate AI win as a large positive terminal score", () => {
    const board = createBoard();
    board[5][0] = PLAYER.YELLOW;
    board[5][1] = PLAYER.YELLOW;
    board[5][2] = PLAYER.YELLOW;
    board[5][3] = PLAYER.YELLOW; // YELLOW (AI) has already won on this board

    const result = minimax(board, 4, -Infinity, Infinity, true, PLAYER.YELLOW);

    expect(result.score).toBeGreaterThan(1000000);
    expect(result.column).toBe(-1); // terminal state, no further move to make
  });

  it("scores an immediate opponent win as a large negative terminal score", () => {
    const board = createBoard();
    board[5][0] = PLAYER.RED;
    board[5][1] = PLAYER.RED;
    board[5][2] = PLAYER.RED;
    board[5][3] = PLAYER.RED; // RED (opponent) has already won

    const result = minimax(board, 4, -Infinity, Infinity, true, PLAYER.YELLOW);

    expect(result.score).toBeLessThan(-1000000);
    expect(result.column).toBe(-1);
  });

  it("falls back to the heuristic score once depth runs out with no winner", () => {
    const board = createBoard();
    board[5][3] = PLAYER.YELLOW;

    const result = minimax(board, 0, -Infinity, Infinity, true, PLAYER.YELLOW);

    expect(result.column).toBe(-1);
    expect(result.score).toBe(3); // matches scoreBoard's center-column bonus
  });
});

describe("getBestMove", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns -1 when the board is completely full", () => {
    let board = createBoard();
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < 6; r++) {
        board = dropDisc(board, c, PLAYER.RED)!;
      }
    }

    expect(getBestMove(board, 5, PLAYER.YELLOW)).toBe(-1);
  });

  it("takes an immediate winning move when one is available", () => {
    const board = createBoard();
    board[5][0] = PLAYER.YELLOW;
    board[5][1] = PLAYER.YELLOW;
    board[5][2] = PLAYER.YELLOW; // col 3 completes the win

    // Use the top difficulty (randomChance 0) so the result is deterministic.
    const move = getBestMove(board, 5, PLAYER.YELLOW);

    expect(move).toBe(3);
  });

  it("blocks an immediate opponent win when it has no win of its own", () => {
    const board = createBoard();
    board[5][0] = PLAYER.RED;
    board[5][1] = PLAYER.RED;
    board[5][2] = PLAYER.RED; // col 3 would let RED win next turn

    const move = getBestMove(board, 5, PLAYER.YELLOW);

    expect(move).toBe(3);
  });

  it("takes its own win instead of blocking an unrelated opponent threat", () => {
    const board = createBoard();
    // YELLOW (AI) can win immediately by playing column 3.
    board[5][0] = PLAYER.YELLOW;
    board[5][1] = PLAYER.YELLOW;
    board[5][2] = PLAYER.YELLOW;
    // RED separately has a pending vertical threat in column 6 (irrelevant —
    // the game ends the moment YELLOW plays its winning move).
    board[5][6] = PLAYER.RED;
    board[4][6] = PLAYER.RED;
    board[3][6] = PLAYER.RED;

    const move = getBestMove(board, 5, PLAYER.YELLOW);

    expect(move).toBe(3);
  });

  it("always returns one of the currently valid columns", () => {
    const board = createBoard();
    // A plausible mid-game position — no column here is actually full,
    // this just checks the general invariant on an arbitrary in-progress board.
    board[5][3] = PLAYER.RED;
    board[4][3] = PLAYER.YELLOW;
    board[3][3] = PLAYER.RED;
    board[5][2] = PLAYER.YELLOW;
    board[5][4] = PLAYER.YELLOW;

    const move = getBestMove(board, 3, PLAYER.RED);

    expect(getValidColumns(board)).toContain(move);
  });

  it("plays a random valid column when the difficulty's random chance triggers", () => {
    const board = createBoard(); // every column valid: [0,1,2,3,4,5,6]

    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1) // below level 1's 0.6 randomChance -> random branch
      .mockReturnValueOnce(0); // picks index 0 of the valid columns

    const move = getBestMove(board, 1, PLAYER.YELLOW);

    expect(move).toBe(0);
  });

  it("ignores Math.random entirely at the top difficulty (randomChance 0)", () => {
    const board = createBoard();
    board[5][0] = PLAYER.YELLOW;
    board[5][1] = PLAYER.YELLOW;
    board[5][2] = PLAYER.YELLOW;

    // Even if Math.random() returns 0, `0 < 0` is false, so level 5 must
    // always take the real minimax move, never the random branch.
    vi.spyOn(Math, "random").mockReturnValue(0);

    const move = getBestMove(board, 5, PLAYER.YELLOW);

    expect(move).toBe(3); // still takes the winning move, not a random column
  });
});
