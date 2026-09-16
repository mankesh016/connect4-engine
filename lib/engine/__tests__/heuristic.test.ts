import { describe, it, expect } from "vitest";
import { evaluateWindow, scoreBoard } from "../heuristic";
import { createBoard, PLAYER } from "../board";

const E = PLAYER.EMPTY;
const R = PLAYER.RED;
const Y = PLAYER.YELLOW;

describe("evaluateWindow", () => {
  it("scores four in a row as an overwhelming win", () => {
    expect(evaluateWindow([R, R, R, R], R)).toBe(100000);
  });

  it("scores three of the player's discs plus one empty as +10", () => {
    expect(evaluateWindow([R, R, R, E], R)).toBe(10);
    // Order shouldn't matter — only the counts do.
    expect(evaluateWindow([E, R, R, R], R)).toBe(10);
  });

  it("scores two of the player's discs plus two empty as +2", () => {
    expect(evaluateWindow([R, R, E, E], R)).toBe(2);
  });

  it("penalizes an opponent's three-plus-one-empty as -80 (urgent block)", () => {
    expect(evaluateWindow([Y, Y, Y, E], R)).toBe(-80);
  });

  it("scores an all-empty window as 0", () => {
    expect(evaluateWindow([E, E, E, E], R)).toBe(0);
  });

  it("scores a window mixing both players' discs as 0 (no live pattern)", () => {
    // One of each plus empties — neither player has an uninterrupted run.
    expect(evaluateWindow([R, Y, E, E], R)).toBe(0);
  });

  it("does not penalize the opponent already holding all 4 cells", () => {
    // By the time a window is fully opponent-owned, checkWin would already
    // have ended the game before scoreBoard is ever called — evaluateWindow
    // itself has no special case for it, so it scores as a plain 0.
    expect(evaluateWindow([Y, Y, Y, Y], R)).toBe(0);
  });

  it("scores from the requested player's perspective, not a fixed side", () => {
    const window = [R, R, R, E];
    expect(evaluateWindow(window, R)).toBe(10); // R has the 3-in-a-row
    expect(evaluateWindow(window, Y)).toBe(-80); // Y sees it as an opponent threat
  });
});

describe("scoreBoard", () => {
  it("scores an empty board as 0 for either player", () => {
    const board = createBoard();

    expect(scoreBoard(board, PLAYER.RED)).toBe(0);
    expect(scoreBoard(board, PLAYER.YELLOW)).toBe(0);
  });

  it("gives a lone center-column disc exactly the center bonus (+3)", () => {
    const board = createBoard();
    board[5][3] = PLAYER.RED; // center column is index 3

    // A single disc can't complete any 4-cell window pattern on its own,
    // so the only contribution is the center-column bonus: 1 disc * 3.
    expect(scoreBoard(board, PLAYER.RED)).toBe(3);
  });

  it("hand-computed: two stacked center discs score center bonus + one live vertical window", () => {
    const board = createBoard();
    board[4][3] = PLAYER.RED;
    board[5][3] = PLAYER.RED;

    // Center bonus: 2 discs * 3 = 6.
    // Vertical windows in column 3 are rows [0-3], [1-4], [2-5]; only the
    // [2-5] window contains both discs (2 player + 2 empty = +2).
    // No horizontal/diagonal window contains more than one of these discs.
    expect(scoreBoard(board, PLAYER.RED)).toBe(8);
  });

  it("scores a stronger position higher than a weaker one for the same player", () => {
    const weak = createBoard();
    weak[5][0] = PLAYER.RED;

    const strong = createBoard();
    strong[5][0] = PLAYER.RED;
    strong[5][1] = PLAYER.RED;
    strong[5][2] = PLAYER.RED; // one move from a horizontal win

    expect(scoreBoard(strong, PLAYER.RED)).toBeGreaterThan(
      scoreBoard(weak, PLAYER.RED),
    );
  });

  it("scores the same board differently depending on whose perspective is asked", () => {
    const board = createBoard();
    board[5][0] = PLAYER.RED;
    board[5][1] = PLAYER.RED;
    board[5][2] = PLAYER.RED; // RED is one move from winning; YELLOW must block

    const redScore = scoreBoard(board, PLAYER.RED);
    const yellowScore = scoreBoard(board, PLAYER.YELLOW);

    expect(redScore).toBeGreaterThan(0);
    expect(yellowScore).toBeLessThan(0);
  });
});
