"use client";

import { useBoardHover } from "@/hooks/useBoardHover";
import Cell from "./Cell";

interface BoardProps {
  board: number[][]; // 6 rows x 7 cols
  winningCells?: [number, number][];
  currentPlayer: number;
  onColumnClick: (colIndex: number) => void;
  disabled?: boolean;
}

export default function Board({
  board,
  winningCells = [],
  currentPlayer,
  onColumnClick,
  disabled = false,
}: BoardProps) {
  const { setHoveredCol, getColStatus, getCellProps } = useBoardHover({
    board,
    currentPlayer,
    disabled,
    winningCells,
  });

  const handleColHover = (colIdx: number) => {
    if (!disabled) {
      setHoveredCol(colIdx);
    }
  };

  const handleColClick = (colIdx: number, isColFull: boolean) => {
    if (!disabled && !isColFull) {
      onColumnClick(colIdx);
    }
  };

  const renderGhostCell = (colIdx: number) => {
    const { isColFull, cursorClass, ghostDiscClass } = getColStatus(colIdx);

    return (
      <div
        key={colIdx}
        onMouseEnter={() => handleColHover(colIdx)}
        onClick={() => handleColClick(colIdx, isColFull)}
        className={`w-12 h-12 flex items-center justify-center ${cursorClass}`}
      >
        <div
          className={`w-10 h-10 rounded-full ${ghostDiscClass} transition-colors duration-150`}
        />
      </div>
    );
  };

  const renderColumn = (colIdx: number) => {
    const { isColFull, cursorClass } = getColStatus(colIdx);

    return (
      <div
        key={colIdx}
        onMouseEnter={() => handleColHover(colIdx)}
        onClick={() => handleColClick(colIdx, isColFull)}
        className={`flex flex-col gap-1 ${cursorClass}`}
      >
        {Array.from({ length: 6 }).map((_, rowIdx) => (
          <Cell key={rowIdx} {...getCellProps(rowIdx, colIdx)} />
        ))}
      </div>
    );
  };

  return (
    <div
      className="flex flex-col items-center select-none"
      onMouseLeave={() => setHoveredCol(null)}
    >
      {/* floating ghost disc preview outside */}
      <div className="grid grid-cols-7 gap-1 px-2 mb-2">
        {Array.from({ length: 7 }).map((_, colIdx) => renderGhostCell(colIdx))}
      </div>

      {/* rendered column by column */}
      <div className="grid grid-cols-7 gap-1 p-2 bg-blue-800 rounded">
        {Array.from({ length: 7 }).map((_, colIdx) => renderColumn(colIdx))}
      </div>
    </div>
  );
}
