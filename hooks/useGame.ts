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

  const makeMove = (colIndex: number) => {
    // ignore clicks if game is over
    if (winner !== null) return;

    const newBoard = dropDisc(board, colIndex, currentPlayer);
    if (!newBoard) return; // column is full

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

  const resetGame = () => {
    setBoard(createBoard());
    setCurrentPlayer(1);
    setWinner(null);
    setWinningCells([]);
  };

  return {
    board,
    currentPlayer,
    winner,
    winningCells,
    makeMove,
    resetGame,
  };
}
