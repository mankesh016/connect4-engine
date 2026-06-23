import { ROWS, COLS, BoardState } from "./board";

// Evaluates a single window of 4 consecutive cells.
// Scores the window from the perspective of the specified player:
// 3 of yours + 1 empty = +10
// 2 of yours + 2 empty = +2
// opponent 3 + 1 empty = -80 (block urgently)
export function evaluateWindow(window: number[], player: number): number {
  let score = 0;
  const opponent = player === 1 ? 2 : 1;

  const playerCount = window.filter((cell) => cell === player).length;
  const opponentCount = window.filter((cell) => cell === opponent).length;
  const emptyCount = window.filter((cell) => cell === 0).length;

  if (playerCount === 4) {
    score += 100000;
  } else if (playerCount === 3 && emptyCount === 1) {
    score += 10;
  } else if (playerCount === 2 && emptyCount === 2) {
    score += 2;
  }

  if (opponentCount === 3 && emptyCount === 1) {
    score -= 80;
  }

  return score;
}

export function scoreBoard(board: BoardState, player: number): number {
  let score = 0;

  // center column bonus
  // +3 for each disc of the player in column 3 (biased towards center)
  const centerCol = 3;
  let centerCount = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board[r][centerCol] === player) {
      centerCount++;
    }
  }
  score += centerCount * 3;

  // horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [
        board[r][c],
        board[r][c + 1],
        board[r][c + 2],
        board[r][c + 3],
      ];
      score += evaluateWindow(window, player);
    }
  }

  // vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const window = [
        board[r][c],
        board[r + 1][c],
        board[r + 2][c],
        board[r + 3][c],
      ];
      score += evaluateWindow(window, player);
    }
  }

  // diagonal (positive slope /)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [
        board[r][c],
        board[r - 1][c + 1],
        board[r - 2][c + 2],
        board[r - 3][c + 3],
      ];
      score += evaluateWindow(window, player);
    }
  }

  // diagonal (negative slope \)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [
        board[r][c],
        board[r + 1][c + 1],
        board[r + 2][c + 2],
        board[r + 3][c + 3],
      ];
      score += evaluateWindow(window, player);
    }
  }

  return score;
}
