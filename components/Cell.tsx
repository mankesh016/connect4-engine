import { memo } from "react";
import { PLAYER } from "@/lib/engine/board";

interface CellProps {
  value: number; // 0 = empty, 1 = Red, 2 = Yellow
  isWinning?: boolean;
  isLanding?: boolean;
  isLastMove?: boolean;
}

function Cell({
  value,
  isWinning = false,
  isLanding = false,
  isLastMove = false,
}: CellProps) {
  let bgColor = "bg-gray-300"; // Default empty
  if (value === PLAYER.RED) {
    bgColor = isLanding ? "bg-red-500/50" : "bg-red-500";
  } else if (value === PLAYER.YELLOW) {
    bgColor = isLanding ? "bg-yellow-500/50" : "bg-yellow-500";
  }

  const winBorder = isWinning ? "border-4 border-green-500" : "";

  return (
    <div className="flex items-center justify-center w-12 h-12 bg-blue-900 border border-blue-950">
      <div
        className={`w-10 h-10 rounded-full ${bgColor} ${winBorder} flex items-center justify-center relative`}
      >
        {isLastMove && (
          <div className="absolute w-2 h-2 rounded-full bg-white opacity-70" />
        )}
      </div>
    </div>
  );
}

export default memo(Cell);
