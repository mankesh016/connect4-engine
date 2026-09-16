import { useEffect, useRef } from "react";
import { BoardState, PLAYER } from "../lib/engine/board";
import type {
  AIWorkerRequest,
  AIWorkerResponse,
} from "../lib/engine/ai.worker";

interface UseAIProps {
  board: BoardState;
  currentPlayer: number;
  gameMode: "offline" | "ai";
  winner: number | "draw" | null;
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
  const workerRef = useRef<Worker | null>(null);

  // Create the minimax worker once for the lifetime of this hook, and
  // terminate it on unmount so it doesn't keep running in the background.
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../lib/engine/ai.worker.ts", import.meta.url),
      { type: "module" },
    );

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Only run AI is not already processing
    if (
      gameMode === "ai" &&
      currentPlayer === PLAYER.YELLOW &&
      winner === null &&
      !thinkingRef.current
    ) {
      thinkingRef.current = true;
      setIsThinkingRef.current(true);

      let cancelled = false;

      const timer = setTimeout(() => {
        const worker = workerRef.current;
        if (!worker) return;

        const handleResult = (event: MessageEvent<AIWorkerResponse>) => {
          worker.removeEventListener("message", handleResult);
          if (cancelled) return; // board moved on (e.g. an undo) while the worker was thinking

          setIsThinkingRef.current(false);
          thinkingRef.current = false;

          const { column } = event.data;
          if (column !== -1) {
            makeMoveRef.current(column);
          }
        };

        worker.addEventListener("message", handleResult);

        // Run minimax search on the latest board, off the main thread.
        const request: AIWorkerRequest = {
          board: boardRef.current,
          level: difficultyRef.current,
          aiPlayer: PLAYER.YELLOW,
        };
        worker.postMessage(request);
      }, 600);

      return () => {
        cancelled = true;
        clearTimeout(timer);
        // Don't leave the UI stuck on "AI is Thinking..." if this turn gets
        // torn down (e.g. undo) before the worker replies.
        if (thinkingRef.current) {
          thinkingRef.current = false;
          setIsThinkingRef.current(false);
        }
      };
    }
  }, [currentPlayer, gameMode, winner]);
}
