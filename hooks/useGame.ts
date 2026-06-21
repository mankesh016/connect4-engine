import { useState } from "react";
import {
  createBoard,
  dropDisc,
  getWinningCells,
  checkDraw,
  BoardState,
  CellCoords,
} from "../lib/engine/board";

export function useGame() {
  const [board, setBoard] = useState<BoardState>(createBoard());
  // 1 => red (player 1), 2 => yellow (player 2)
  const [currentPlayer, setCurrentPlayer] = useState<number>(1);
  const [winner, setWinner] = useState<number | "draw" | null>(null);
  const [winningCells, setWinningCells] = useState<CellCoords[]>([]);
  const [moveHistory, setMoveHistory] = useState<BoardState[]>([]);
  const [redoStack, setRedoStack] = useState<BoardState[]>([]);

  const makeMove = (colIndex: number) => {
    // ignore clicks if game is over
    if (winner !== null) return;

    const newBoard = dropDisc(board, colIndex, currentPlayer);
    if (!newBoard) return; // column is full

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
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

  const recalculateGameOutcomes = (board: BoardState) => {
    const win1 = getWinningCells(board, 1);
    const win2 = getWinningCells(board, 2);
    if (win1.length > 0) {
      setWinner(1);
      setWinningCells(win1);
    } else if (win2.length > 0) {
      setWinner(2);
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
    if (moveHistory.length === 0) return;

    const previousBoard = moveHistory[moveHistory.length - 1];
    const newHistory = moveHistory.slice(0, -1);

    // Push current board to redo stack
    setRedoStack((prev) => [...prev, board]);
    setMoveHistory(newHistory);
    setBoard(previousBoard);

    recalculateGameOutcomes(previousBoard);
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const nextBoard = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    // Push current board to history stack
    setMoveHistory((prev) => [...prev, board]);
    setRedoStack(newRedo);
    setBoard(nextBoard);

    recalculateGameOutcomes(nextBoard);
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

  const resetGame = () => {
    setBoard(createBoard());
    setCurrentPlayer(1);
    setWinner(null);
    setWinningCells([]);
    setMoveHistory([]);
    setRedoStack([]);
  };

  return {
    board,
    currentPlayer,
    winner,
    winningCells,
    moveHistory,
    redoStack,
    makeMove,
    undo,
    redo,
    resetGame,
  };
}
