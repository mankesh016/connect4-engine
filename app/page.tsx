"use client";

import Board from "@/components/Board";
import { useGame } from "@/hooks/useGame";

export default function Home() {
  const { board, currentPlayer, winner, winningCells, makeMove, resetGame } =
    useGame();

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

        {/* Column buttons */}
        <div className="flex flex-col items-center select-none">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {Array.from({ length: 7 }).map((_, colIdx) => (
              <button
                key={colIdx}
                onClick={() => makeMove(colIdx)}
                disabled={winner !== null}
                className="w-12 h-8 flex items-center justify-center font-bold bg-gray-200 border border-gray-300 hover:bg-gray-300 rounded text-black text-sm disabled:opacity-50 cursor-pointer"
              >
                {colIdx}
              </button>
            ))}
          </div>

          <Board board={board} winningCells={winningCells} />
        </div>

        {/* New Game reset button */}
        <button
          onClick={resetGame}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded cursor-pointer"
        >
          New Game
        </button>
      </main>
    </div>
  );
}
