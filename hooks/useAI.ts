import { useEffect, useRef } from "react";
import { BoardState } from "../lib/engine/board";
import { getBestMove } from "../lib/engine/minimax";

interface UseAIProps {
  board: BoardState;
  currentPlayer: number;
  gameMode: "offline" | "ai";
  winner: number | "draw" | null;
  isThinking: boolean;
  setIsThinking: (thinking: boolean) => void;
  makeMove: (col: number) => void;
  difficulty: number;
}

export function useAI({
  board,
  currentPlayer,
  gameMode,
  winner,
  setIsThinking,
  makeMove,
  difficulty,
}: UseAIProps) {
  const boardRef = useRef(board);
  const makeMoveRef = useRef(makeMove);
  const setIsThinkingRef = useRef(setIsThinking);
  const difficultyRef = useRef(difficulty);

  useEffect(() => {
    boardRef.current = board;
    makeMoveRef.current = makeMove;
    setIsThinkingRef.current = setIsThinking;
    difficultyRef.current = difficulty;
  });

  const thinkingRef = useRef(false);

  useEffect(() => {
    // Only run AI is not already processing
    if (
      gameMode === "ai" &&
      currentPlayer === 2 &&
      winner === null &&
      !thinkingRef.current
    ) {
      thinkingRef.current = true;
      setIsThinkingRef.current(true);

      const timer = setTimeout(() => {
        // Run minimax search on latest board
        const bestMove = getBestMove(
          boardRef.current,
          difficultyRef.current,
          2,
        );

        setIsThinkingRef.current(false);
        thinkingRef.current = false;

        if (bestMove !== -1) {
          makeMoveRef.current(bestMove);
        }
      }, 600);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [currentPlayer, gameMode, winner]);
}
