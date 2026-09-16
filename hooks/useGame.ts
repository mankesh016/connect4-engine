import { useEffect, useState } from "react";
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

const STORAGE_KEY = "connect4-state";

interface PersistedState {
  board: BoardState;
  currentPlayer: number;
  winner: number | "draw" | null;
  winningCells: CellCoords[];
  moveHistory: Snapshot[];
  redoStack: Snapshot[];
  gameMode: GameMode;
  difficulty: number;
  lastMove: { row: number; col: number } | null;
}

// Light structural check, not a full schema validator — good enough to
// refuse to load anything that isn't shaped like a board, and to fall back
// to a fresh game rather than crash if the format ever changes.
function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.board) &&
    typeof v.currentPlayer === "number" &&
    Array.isArray(v.winningCells) &&
    Array.isArray(v.moveHistory) &&
    Array.isArray(v.redoStack) &&
    (v.gameMode === "offline" || v.gameMode === "ai") &&
    typeof v.difficulty === "number"
  );
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

  // Guards the persist effect below so it can't fire with the pre-load
  // default state before the restore effect's setters have actually taken
  // effect. This has to be real state (not a ref flipped inside the restore
  // effect): both effects run in the same post-mount pass, and a ref
  // mutated by the first effect would already read `true` by the time the
  // second one checks it — while that second effect's `board`/`currentPlayer`
  // closure still holds the stale pre-restore defaults from the render that
  // scheduled it. Using state forces the persist effect to wait for an
  // actual re-render (with the restored values already applied) before it
  // runs again.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isPersistedState(parsed)) {
          // Restoring several independent pieces of state from an external
          // store (localStorage) on mount is one of the few cases React's
          // own docs call out as a legitimate need for an effect — it can't
          // be read during render on the server, so it can't be computed
          // during render without a hydration mismatch. React 18 batches
          // these into a single re-render regardless of the count, so this
          // isn't the "effect chain" cascade the rule is otherwise guarding
          // against; splitting 9 independent useState hooks into one
          // reducer purely to silence it isn't worth the churn here.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setBoard(parsed.board);
          setCurrentPlayer(parsed.currentPlayer);
          setWinner(parsed.winner);
          setWinningCells(parsed.winningCells);
          setMoveHistory(parsed.moveHistory);
          setRedoStack(parsed.redoStack);
          setGameModeState(parsed.gameMode);
          setDifficulty(parsed.difficulty);
          setLastMove(parsed.lastMove ?? null);
        }
      }
    } catch {
      // Corrupted JSON, inaccessible storage (private browsing), etc. —
      // fall back to a fresh game instead of throwing.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return; // skip the pre-restore initial render

    try {
      const toSave: PersistedState = {
        board,
        currentPlayer,
        winner,
        winningCells,
        moveHistory,
        redoStack,
        gameMode,
        difficulty,
        lastMove,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Storage full/unavailable — persistence is a nice-to-have, never
      // let it break gameplay.
    }
  }, [
    hydrated,
    board,
    currentPlayer,
    winner,
    winningCells,
    moveHistory,
    redoStack,
    gameMode,
    difficulty,
    lastMove,
  ]);

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
