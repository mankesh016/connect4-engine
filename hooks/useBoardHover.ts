import { useState } from "react";
import { getDropRow } from "../lib/engine/board";

interface UseBoardHoverProps {
  board: number[][];
  currentPlayer: number;
  disabled: boolean;
  winningCells: [number, number][];
}

export function useBoardHover({
  board,
  currentPlayer,
  disabled,
  winningCells,
}: UseBoardHoverProps) {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const isCellWinning = (r: number, c: number) => {
    return winningCells.some(
      ([winRow, winCol]) => winRow === r && winCol === c,
    );
  };

  const landingRow = hoveredCol !== null ? getDropRow(board, hoveredCol) : null;

  // retrieve hover and cursor configuration for a column
  const getColStatus = (colIdx: number) => {
    const isColFull = board[0][colIdx] !== 0;
    const isCurrentHovered = hoveredCol === colIdx && !disabled;

    const cursorClass = disabled
      ? "cursor-default"
      : isColFull
        ? "cursor-not-allowed"
        : "cursor-pointer";

    // Ghost preview disc color style
    let ghostDiscClass = "bg-transparent";
    if (isCurrentHovered && !isColFull) {
      ghostDiscClass =
        currentPlayer === 1 ? "bg-red-500/60" : "bg-yellow-500/60";
    }

    return {
      isColFull,
      cursorClass,
      ghostDiscClass,
    };
  };

  // retrieve cell props dynamically based on row/column position
  const getCellProps = (rowIdx: number, colIdx: number) => {
    const cellValue = board[rowIdx][colIdx];
    const isWinning = isCellWinning(rowIdx, colIdx);
    const isLanding =
      !disabled && hoveredCol === colIdx && landingRow === rowIdx;

    return {
      value: isLanding ? currentPlayer : cellValue,
      isWinning,
      isLanding,
    };
  };

  return {
    hoveredCol,
    setHoveredCol,
    getColStatus,
    getCellProps,
  };
}
