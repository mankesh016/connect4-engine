"use client";

import Cell from "./Cell";

interface BoardProps {
  board: number[][]; // 6 rows x 7 cols
  winningCells?: [number, number][];
}

export default function Board({ board, winningCells = [] }: BoardProps) {
  // Check if a cell is one of the winning cells
  const isCellWinning = (r: number, c: number) => {
    return winningCells.some(
      ([winRow, winCol]) => winRow === r && winCol === c,
    );
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* 6x7 Grid of Cells */}
      <div className="flex flex-col gap-1 p-2 bg-blue-800 rounded">
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-7 gap-1">
            {row.map((cellValue, colIdx) => (
              <Cell
                key={colIdx}
                value={cellValue}
                isWinning={isCellWinning(rowIdx, colIdx)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
