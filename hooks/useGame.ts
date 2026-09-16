import { useState } from "react";
import {
  createBoard,
  dropDisc,
  getWinningCells,
  checkDraw,
  getDropRow,
  getOpponent,
  BoardState,
  CellCoords,
  PLAYER,
} from "../lib/engine/board";

export type GameMode = "offline" | "ai";

// A snapshot of whose turn it was on a given board, so undo/redo can restore
// both directly instead of re-deriving currentPlayer via flip-counting.
interface Snapshot {
  board: BoardState;
  currentPlayer: number;
}

export function useGame() {
  const [board, setBoard] = useState<BoardState>(createBoard());
  const [currentPlayer, setCurrentPlayer] = useState<number>(PLAYER.RED);
  const [winner, setWinner] = useState<number | "draw" | null>(null);
  const [winningCells, setWinningCells] = useState<CellCoords[]>([]);
  const [moveHistory, setMoveHistory] = useState<Snapshot[]>([]);
  const [redoStack, setRedoStack] = useState<Snapshot[]>([]);

  const [gameMode, setGameModeState] = useState<GameMode>("offline");
  const [difficulty, setDifficulty] = useState<number>(3); // 1...5
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(
    null,
  );

  const makeMove = (colIndex: number) => {
    // ignore clicks if game is over
    if (winner !== null) return;

    const targetRow = getDropRow(board, colIndex);
    if (targetRow === null) return;

    const newBoard = dropDisc(board, colIndex, currentPlayer);
    if (!newBoard) return; // column is full

    setLastMove({ row: targetRow, col: colIndex });
    setMoveHistory((prev) => [...prev, { board, currentPlayer }]);
    setRedoStack([]);

    const winCells = getWinningCells(newBoard, currentPlayer);
    if (winCells.length > 0) {
      setBoard(newBoard);
      setWinner(currentPlayer);
      setWinningCells(winCells);
      return;
    }

    if (checkDraw(newBoard)) {
      setBoard(newBoard);
      setWinner("draw");
      return;
    }

    setBoard(newBoard);
    setCurrentPlayer(getOpponent(currentPlayer));
  };

  const recalculateGameOutcomes = (board: BoardState) => {
    const win1 = getWinningCells(board, PLAYER.RED);
    const win2 = getWinningCells(board, PLAYER.YELLOW);
    if (win1.length > 0) {
      setWinner(PLAYER.RED);
      setWinningCells(win1);
    } else if (win2.length > 0) {
      setWinner(PLAYER.YELLOW);
      setWinningCells(win2);
    } else if (checkDraw(board)) {
      setWinner("draw");
      setWinningCells([]);
    } else {
      setWinner(null);
      setWinningCells([]);
    }
  };

  const undo = () => {
    if (moveHistory.length === 0 || isThinking) return;

    // In vs-AI mode, a "turn" is the human's move plus the AI's reply. A
    // single-ply undo would land back on the AI's turn with the board
    // already set for it to move on — the useAI effect would immediately
    // fire again, making Undo look like it did nothing (or worse). Undoing
    // both plies atomically returns the human to their own previous turn.
    const steps = gameMode === "ai" ? Math.min(2, moveHistory.length) : 1;
    const targetIndex = moveHistory.length - steps;
    const target = moveHistory[targetIndex];

    setLastMove(null);
    setRedoStack((prev) => [...prev, { board, currentPlayer }]);
    setMoveHistory(moveHistory.slice(0, targetIndex));
    setBoard(target.board);
    setCurrentPlayer(target.currentPlayer);

    recalculateGameOutcomes(target.board);
  };

  const redo = () => {
    if (redoStack.length === 0 || isThinking) return;

    const target = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    setLastMove(null);
    setMoveHistory((prev) => [...prev, { board, currentPlayer }]);
    setRedoStack(newRedo);
    setBoard(target.board);
    setCurrentPlayer(target.currentPlayer);

    recalculateGameOutcomes(target.board);
  };

  const resetGame = () => {
    setBoard(createBoard());
    setCurrentPlayer(PLAYER.RED);
    setWinner(null);
    setWinningCells([]);
    setMoveHistory([]);
    setRedoStack([]);
    setIsThinking(false);
    setLastMove(null);
  };

  const setGameMode = (mode: GameMode) => {
    setGameModeState(mode);
    resetGame();
  };

  return {
    board,
    currentPlayer,
    winner,
    winningCells,
    moveHistory,
    redoStack,
    gameMode,
    setGameMode,
    difficulty,
    setDifficulty,
    isThinking,
    setIsThinking,
    lastMove,
    makeMove,
    undo,
    redo,
    resetGame,
  };
}
