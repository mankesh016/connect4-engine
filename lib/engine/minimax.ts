import {
  BoardState,
  checkWin,
  getValidColumns,
  dropDisc,
  checkDraw,
} from "./board";
import { scoreBoard } from "./heuristic";

export interface DifficultyConfig {
  depth: number;
  randomChance: number;
}

export function getDifficultyConfig(level: number): DifficultyConfig {
  switch (level) {
    case 1:
      return { depth: 1, randomChance: 0.6 };
    case 2:
      return { depth: 2, randomChance: 0.3 };
    case 3:
      return { depth: 4, randomChance: 0.0 };
    case 4:
      return { depth: 6, randomChance: 0.0 };
    case 5:
      return { depth: 9, randomChance: 0.0 };
    default:
      return { depth: 4, randomChance: 0.0 }; // Level 3 default
  }
}

// Standard Minimax algorithm with Alpha-Beta pruning.
// aiPlayer (default 2) is the maximizing player.
// opponent (default 1) is the minimizing player.
export function minimax(
  board: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: number = 2,
): { score: number; column: number } {
  const opponent = aiPlayer === 1 ? 2 : 1;

  // check for terminal states
  if (checkWin(board, aiPlayer)) {
    // AI wins (maximizing player)
    return { score: 10000000 + depth, column: -1 };
  }
  if (checkWin(board, opponent)) {
    // opponent wins (minimizing player)
    return { score: -10000000 - depth, column: -1 };
  }
  if (checkDraw(board) || depth === 0) {
    // Draw or depth limit reached
    return { score: scoreBoard(board, aiPlayer), column: -1 };
  }

  const validColumns = getValidColumns(board);

  // explore center columns first to maximize pruning!
  // column order 3, 2, 4, 1, 5, 0, 6
  const orderedColumns = [...validColumns].sort(
    (a, b) => Math.abs(3 - a) - Math.abs(3 - b),
  );

  if (isMaximizing) {
    let maxScore = -Infinity;
    let bestColumn = orderedColumns[0] ?? -1;

    for (const col of orderedColumns) {
      const nextBoard = dropDisc(board, col, aiPlayer);
      if (!nextBoard) continue;

      const result = minimax(
        nextBoard,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer,
      );
      if (result.score > maxScore) {
        maxScore = result.score;
        bestColumn = col;
      }
      alpha = Math.max(alpha, result.score);
      if (alpha >= beta) {
        break; // beta cut-off
      }
    }
    return { score: maxScore, column: bestColumn };
  } else {
    let minScore = Infinity;
    let bestColumn = orderedColumns[0] ?? -1;

    for (const col of orderedColumns) {
      const nextBoard = dropDisc(board, col, opponent);
      if (!nextBoard) continue;

      const result = minimax(nextBoard, depth - 1, alpha, beta, true, aiPlayer);
      if (result.score < minScore) {
        minScore = result.score;
        bestColumn = col;
      }
      beta = Math.min(beta, result.score);
      if (alpha >= beta) {
        break; // alpha cut-off
      }
    }
    return { score: minScore, column: bestColumn };
  }
}

// returns the best move (column index) for the AI, considering the difficulty
export function getBestMove(
  board: BoardState,
  level: number = 3,
  aiPlayer: number = 2,
): number {
  const config = getDifficultyConfig(level);
  const validColumns = getValidColumns(board);

  if (validColumns.length === 0) return -1;

  // level randomness chance
  if (Math.random() < config.randomChance) {
    const randomIndex = Math.floor(Math.random() * validColumns.length);
    return validColumns[randomIndex];
  }

  const result = minimax(
    board,
    config.depth,
    -Infinity,
    Infinity,
    true,
    aiPlayer,
  );
  return result.column;
}
