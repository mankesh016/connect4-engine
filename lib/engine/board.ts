export type BoardState = number[][]; // 6 rows x 7 cols
export type CellCoords = [number, number];

export const ROWS = 6;
export const COLS = 7;

// Create empty 6x7 board initialized with zeros.
export function createBoard(): BoardState {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// Drops a disc of given player into given column.
export function dropDisc(
  board: BoardState,
  col: number,
  player: number,
): BoardState | null {
  if (col < 0 || col >= COLS) return null;

  // Search from bottom to up
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      const newBoard = board.map((row) => [...row]);
      newBoard[r][col] = player;
      return newBoard;
    }
  }

  return null; // Column is full
}

// scan if board have any winning sequence
export function getWinningCells(
  board: BoardState,
  player: number,
): CellCoords[] {
  // Horizontal check
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (
        board[r][c] === player &&
        board[r][c + 1] === player &&
        board[r][c + 2] === player &&
        board[r][c + 3] === player
      ) {
        return [
          [r, c],
          [r, c + 1],
          [r, c + 2],
          [r, c + 3],
        ];
      }
    }
  }

  // Vertical check
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      if (
        board[r][c] === player &&
        board[r + 1][c] === player &&
        board[r + 2][c] === player &&
        board[r + 3][c] === player
      ) {
        return [
          [r, c],
          [r + 1, c],
          [r + 2, c],
          [r + 3, c],
        ];
      }
    }
  }

  // Diagonal (positive slope /)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (
        board[r][c] === player &&
        board[r - 1][c + 1] === player &&
        board[r - 2][c + 2] === player &&
        board[r - 3][c + 3] === player
      ) {
        return [
          [r, c],
          [r - 1, c + 1],
          [r - 2, c + 2],
          [r - 3, c + 3],
        ];
      }
    }
  }

  // Diagonal (negative slope \)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (
        board[r][c] === player &&
        board[r + 1][c + 1] === player &&
        board[r + 2][c + 2] === player &&
        board[r + 3][c + 3] === player
      ) {
        return [
          [r, c],
          [r + 1, c + 1],
          [r + 2, c + 2],
          [r + 3, c + 3],
        ];
      }
    }
  }

  return [];
}

// check if a player is winning
export function checkWin(board: BoardState, player: number): boolean {
  return getWinningCells(board, player).length > 0;
}

// check if game is a draw
export function checkDraw(board: BoardState): boolean {
  const validCols = getValidColumns(board);
  if (validCols.length > 0) return false;

  return !checkWin(board, 1) && !checkWin(board, 2);
}

// return a list of not fully filled columns
export function getValidColumns(board: BoardState): number[] {
  const valid: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === 0) {
      valid.push(c);
    }
  }
  return valid;
}
