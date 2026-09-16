import { getBestMove } from "./minimax";
import type { BoardState } from "./board";

export interface AIWorkerRequest {
  board: BoardState;
  level: number;
  aiPlayer: number;
}

export interface AIWorkerResponse {
  column: number;
}

// `self` inside a worker is a DedicatedWorkerGlobalScope, but the project's
// tsconfig only loads the "dom" lib (for the main-thread side), which
// declares a different, incompatible `self`. Cast once so onmessage/
// postMessage below get the plain Worker-side signatures without pulling in
// the conflicting "webworker" lib project-wide.
const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<AIWorkerRequest>) => {
  const { board, level, aiPlayer } = event.data;
  const column = getBestMove(board, level, aiPlayer);
  const response: AIWorkerResponse = { column };
  ctx.postMessage(response);
};
