import Board from "@/components/Board";

export default function Home() {
  // Hardcoded 6x7 board some discs:
  // 0 = empty
  // 1 = Red (Player 1)
  // 2 = Yellow (Player 2)

  const staticBoard = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 2, 1, 0, 0],
    [0, 0, 0, 1, 2, 0, 0],
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 text-black">
      <main className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Connect 4 Engine
        </h1>

        <div className="text-lg font-semibold text-gray-700">Player 1 turn</div>

        <Board board={staticBoard} winningCells={[[5, 4]]} />
      </main>
    </div>
  );
}
