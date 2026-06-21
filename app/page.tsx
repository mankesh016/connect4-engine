"use client";

import Board from "@/components/Board";
import { useGame } from "@/hooks/useGame";

export default function Home() {
  const {
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
  } = useGame();

  let statusText = "";
  if (winner === 1) {
    statusText = "Red wins!";
  } else if (winner === 2) {
    statusText = "Yellow wins!";
  } else if (winner === "draw") {
    statusText = "It's a draw!";
  } else {
    statusText = currentPlayer === 1 ? "Red's turn" : "Yellow's turn";
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 text-black">
      <main className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Connect 4 Engine
        </h1>

        {/* Turn or result status */}
        <div className="text-lg font-semibold text-gray-700" id="game-status">
          {statusText}
        </div>

        <Board
          board={board}
          winningCells={winningCells}
          currentPlayer={currentPlayer}
          onColumnClick={makeMove}
          disabled={winner !== null}
        />

        {/* Undo and Redo Controls */}
        <div className="flex gap-4">
          <button
            onClick={undo}
            disabled={moveHistory.length === 0}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-bold rounded cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-bold rounded cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            Redo
          </button>
        </div>

        {/* New Game reset button */}
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded cursor-pointer"
        >
          New Game
        </button>
      </main>
    </div>
  );
}
