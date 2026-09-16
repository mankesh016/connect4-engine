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

export function useGame() {
  const [board, setBoard] = useState<BoardState>(createBoard());
  const [currentPlayer, setCurrentPlayer] = useState<number>(PLAYER.RED);
  const [winner, setWinner] = useState<number | "draw" | null>(null);
  const [winningCells, setWinningCells] = useState<CellCoords[]>([]);
  const [moveHistory, setMoveHistory] = useState<BoardState[]>([]);
  const [redoStack, setRedoStack] = useState<BoardState[]>([]);

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
    setMoveHistory((prev) => [...prev, board]);
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

    setLastMove(null);

    const previousBoard = moveHistory[moveHistory.length - 1];
    const newHistory = moveHistory.slice(0, -1);

    // Push current board to redo stack
    setRedoStack((prev) => [...prev, board]);
    setMoveHistory(newHistory);
    setBoard(previousBoard);

    recalculateGameOutcomes(previousBoard);
    setCurrentPlayer(getOpponent(currentPlayer));
  };

  const redo = () => {
    if (redoStack.length === 0 || isThinking) return;

    setLastMove(null);

    const nextBoard = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    // Push current board to history stack
    setMoveHistory((prev) => [...prev, board]);
    setRedoStack(newRedo);
    setBoard(nextBoard);

    recalculateGameOutcomes(nextBoard);
    setCurrentPlayer(getOpponent(currentPlayer));
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
