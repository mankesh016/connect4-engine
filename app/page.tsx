"use client";

import Board from "@/components/Board";
import { useAI } from "@/hooks/useAI";
import { useGame } from "@/hooks/useGame";

export default function Home() {
  const {
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
  } = useGame();

  useAI({
    board,
    currentPlayer,
    gameMode,
    winner,
    isThinking,
    setIsThinking,
    makeMove,
    difficulty,
  });

  let statusText = "";
  if (isThinking) {
    statusText = "AI is Thinking...";
  } else if (winner === 1) {
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

        {/* Game Mode Selector */}
        <div className="flex gap-4">
          <button
            onClick={() => setGameMode("offline")}
            disabled={isThinking}
            className={`px-4 py-2 font-bold rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              gameMode === "offline"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            vs Human
          </button>
          <button
            onClick={() => setGameMode("ai")}
            disabled={isThinking}
            className={`px-4 py-2 font-bold rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              gameMode === "ai"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            vs AI
          </button>
        </div>

        {/* Difficulty Selector (Only for vs AI mode) */}
        {gameMode === "ai" && (
          <div className="flex items-center gap-2">
            <span className="text-md font-semibold text-gray-600">
              AI Difficulty
            </span>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((level) => {
                const isSelected = difficulty === level;
                const isDisabled = moveHistory.length > 0 || isThinking;
                return (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    disabled={isDisabled}
                    className={`px-3 py-1 rounded border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-gray-800 text-white border-gray-950 font-bold underline"
                        : "bg-white text-black border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Turn or result status */}
        <div className="text-lg font-semibold text-gray-700" id="game-status">
          {statusText}
        </div>

        <Board
          board={board}
          winningCells={winningCells}
          currentPlayer={currentPlayer}
          onColumnClick={makeMove}
          disabled={winner !== null || isThinking}
          lastMove={lastMove}
        />

        {/* Undo and Redo Controls */}
        <div className="flex gap-4">
          <button
            onClick={undo}
            disabled={moveHistory.length === 0 || isThinking}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-bold rounded cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0 || isThinking}
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
