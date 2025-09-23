"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Home,
  MapPin,
  Navigation,
  Play,
  RotateCcw,
  Star,
  Timer,
  Trophy
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Cell {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
}

interface GameState {
  grid: Cell[][];
  player: { x: number; y: number };
  exit: { x: number; y: number };
  timer: number;
  moves: number;
  difficulty: string;
  isPlaying: boolean;
  isGameOver: boolean;
  hasWon: boolean;
  bestTime: number | null;
  bestMoves: number | null;
}

interface Difficulty {
  name: string;
  rows: number;
  cols: number;
  timeLimit: number;
  description: string;
}

const difficulties: Record<string, Difficulty> = {
  easy: {
    name: "Easy",
    rows: 8,
    cols: 8,
    timeLimit: 120,
    description: "8x8 maze • 2 minutes"
  },
  medium: {
    name: "Medium",
    rows: 12,
    cols: 12,
    timeLimit: 180,
    description: "12x12 maze • 3 minutes"
  },
  hard: {
    name: "Hard",
    rows: 16,
    cols: 16,
    timeLimit: 240,
    description: "16x16 maze • 4 minutes"
  },
  expert: {
    name: "Expert",
    rows: 20,
    cols: 20,
    timeLimit: 300,
    description: "20x20 maze • 5 minutes"
  }
};

interface MazeEscapeGameProps {
  onBackToGames: () => void;
}

export default function MazeEscapeGame({ onBackToGames }: MazeEscapeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    player: { x: 0, y: 0 },
    exit: { x: 0, y: 0 },
    timer: 120,
    moves: 0,
    difficulty: "easy",
    isPlaying: false,
    isGameOver: false,
    hasWon: false,
    bestTime: null,
    bestMoves: null
  });

  const currentDifficulty = difficulties[gameState.difficulty];
  const cellSize = 400 / Math.max(currentDifficulty.rows, currentDifficulty.cols);

  const createCell = (x: number, y: number): Cell => ({
    x,
    y,
    walls: { top: true, right: true, bottom: true, left: true },
    visited: false
  });

  const getNeighbors = (cell: Cell, grid: Cell[][]): Array<{neighbor: Cell, wall: keyof Cell['walls'], opposite: keyof Cell['walls']}> => {
    const neighbors = [];
    const { x, y } = cell;
    const directions = [
      { dx: 0, dy: -1, wall: 'top' as const, opposite: 'bottom' as const },
      { dx: 1, dy: 0, wall: 'right' as const, opposite: 'left' as const },
      { dx: 0, dy: 1, wall: 'bottom' as const, opposite: 'top' as const },
      { dx: -1, dy: 0, wall: 'left' as const, opposite: 'right' as const },
    ];

    for (const d of directions) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx >= 0 && nx < currentDifficulty.cols && ny >= 0 && ny < currentDifficulty.rows) {
        const neighbor = grid[ny][nx];
        if (!neighbor.visited) {
          neighbors.push({ neighbor, wall: d.wall, opposite: d.opposite });
        }
      }
    }
    return neighbors;
  };

  const generateMaze = useCallback((): Cell[][] => {
    const grid: Cell[][] = [];
    const stack: Cell[] = [];

    // Initialize grid
    for (let y = 0; y < currentDifficulty.rows; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < currentDifficulty.cols; x++) {
        row.push(createCell(x, y));
      }
      grid.push(row);
    }

    // Generate maze using recursive backtracking
    let current = grid[0][0];
    current.visited = true;
    stack.push(current);

    while (stack.length > 0) {
      const neighbors = getNeighbors(current, grid);
      if (neighbors.length > 0) {
        const { neighbor, wall, opposite } = neighbors[Math.floor(Math.random() * neighbors.length)];
        current.walls[wall] = false;
        neighbor.walls[opposite] = false;
        stack.push(current);
        neighbor.visited = true;
        current = neighbor;
      } else {
        current = stack.pop()!;
      }
    }

    return grid;
  }, [currentDifficulty]);

  const drawMaze = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size based on difficulty
    canvas.width = 400;
    canvas.height = 400;

    // Draw maze walls
    ctx.strokeStyle = '#14B8A6'; // Teal color
    ctx.lineWidth = 2;

    for (const row of gameState.grid) {
      for (const cell of row) {
        const x = cell.x * cellSize;
        const y = cell.y * cellSize;

        if (cell.walls.top) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
          ctx.stroke();
        }
        if (cell.walls.right) {
          ctx.beginPath();
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
          ctx.stroke();
        }
        if (cell.walls.bottom) {
          ctx.beginPath();
          ctx.moveTo(x + cellSize, y + cellSize);
          ctx.lineTo(x, y + cellSize);
          ctx.stroke();
        }
        if (cell.walls.left) {
          ctx.beginPath();
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    }

    // Draw player (cyan circle)
    ctx.fillStyle = '#06B6D4';
    ctx.beginPath();
    ctx.arc(
      gameState.player.x * cellSize + cellSize / 2,
      gameState.player.y * cellSize + cellSize / 2,
      Math.max(cellSize / 4, 3),
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw exit (gold square)
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(
      gameState.exit.x * cellSize + cellSize / 4,
      gameState.exit.y * cellSize + cellSize / 4,
      cellSize / 2,
      cellSize / 2
    );
  }, [gameState.grid, gameState.player, gameState.exit, cellSize]);

  const initGame = useCallback(() => {
    const grid = generateMaze();
    const exit = {
      x: currentDifficulty.cols - 1,
      y: currentDifficulty.rows - 1
    };

    setGameState(prev => ({
      ...prev,
      grid,
      player: { x: 0, y: 0 },
      exit,
      timer: currentDifficulty.timeLimit,
      moves: 0,
      isPlaying: true,
      isGameOver: false,
      hasWon: false
    }));
  }, [generateMaze, currentDifficulty]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!gameState.isPlaying) return;

    setGameState(prev => {
      const newX = prev.player.x + dx;
      const newY = prev.player.y + dy;
      const cell = prev.grid[prev.player.y]?.[prev.player.x];

      if (!cell) return prev;

      // Check if move is valid (no wall blocking)
      let canMove = false;
      if (dx === 0 && dy === -1 && !cell.walls.top) canMove = true;
      else if (dx === 1 && dy === 0 && !cell.walls.right) canMove = true;
      else if (dx === 0 && dy === 1 && !cell.walls.bottom) canMove = true;
      else if (dx === -1 && dy === 0 && !cell.walls.left) canMove = true;

      if (!canMove) return prev;

      const newPlayer = { x: newX, y: newY };
      const newMoves = prev.moves + 1;

      // Check if player reached exit
      if (newX === prev.exit.x && newY === prev.exit.y) {
        const newBestTime = prev.bestTime === null || prev.timer > prev.bestTime ? prev.timer : prev.bestTime;
        const newBestMoves = prev.bestMoves === null || newMoves < prev.bestMoves ? newMoves : prev.bestMoves;

        return {
          ...prev,
          player: newPlayer,
          moves: newMoves,
          isPlaying: false,
          isGameOver: true,
          hasWon: true,
          bestTime: newBestTime,
          bestMoves: newBestMoves
        };
      }

      return {
        ...prev,
        player: newPlayer,
        moves: newMoves
      };
    });
  }, [gameState.isPlaying]);

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      grid: [],
      player: { x: 0, y: 0 },
      exit: { x: 0, y: 0 },
      timer: currentDifficulty.timeLimit,
      moves: 0,
      isPlaying: false,
      isGameOver: false,
      hasWon: false
    }));
  };

  const selectDifficulty = (difficulty: string) => {
    setGameState(prev => ({
      ...prev,
      difficulty,
      grid: [],
      player: { x: 0, y: 0 },
      exit: { x: 0, y: 0 },
      timer: difficulties[difficulty].timeLimit,
      moves: 0,
      isPlaying: false,
      isGameOver: false,
      hasWon: false
    }));
  };

  // Timer effect
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timer <= 1) {
          return {
            ...prev,
            timer: 0,
            isPlaying: false,
            isGameOver: true,
            hasWon: false
          };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameState.isPlaying) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer(1, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer, gameState.isPlaying]);

  // Draw maze when game state changes
  useEffect(() => {
    if (gameState.grid.length > 0) {
      drawMaze();
    }
  }, [drawMaze, gameState.grid]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-teal-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-teal-400 to-teal-600 rounded-xl">
                <Navigation className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Maze Escape
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentDifficulty.name} • {currentDifficulty.description}
                </p>
              </div>
            </div>
            <Button
              onClick={onBackToGames}
              variant="outline"
              className="border-teal-200 hover:bg-teal-50"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="p-4 text-center">
                <Timer className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(gameState.timer)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Time Left</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="p-4 text-center">
                <MapPin className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gameState.moves}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Moves</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gameState.bestTime ? formatTime(currentDifficulty.timeLimit - gameState.bestTime) : '--'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Best Time</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gameState.bestMoves || '--'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Best Moves</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Difficulty Selection */}
        {!gameState.isPlaying && !gameState.isGameOver && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-center">Select Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(difficulties).map(([key, difficulty]) => (
                    <Button
                      key={key}
                      onClick={() => selectDifficulty(key)}
                      variant={gameState.difficulty === key ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col gap-2 ${
                        gameState.difficulty === key
                          ? "bg-gradient-to-r from-teal-400 to-teal-600 text-white"
                          : "border-teal-200 hover:bg-teal-50"
                      }`}
                    >
                      <div className="text-lg font-bold">{difficulty.name}</div>
                      <div className="text-xs opacity-80">
                        {difficulty.description}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Game Controls */}
        <motion.div
          className="mb-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {!gameState.isPlaying && !gameState.isGameOver && (
            <Button
              onClick={initGame}
              className="bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white mr-4"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Game
            </Button>
          )}

          {gameState.isPlaying && (
            <Button
              onClick={resetGame}
              variant="outline"
              className="border-teal-200 hover:bg-teal-50 mr-4"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </motion.div>

        {/* Game Canvas and Controls */}
        {gameState.grid.length > 0 && (
          <motion.div
            className="flex flex-col lg:flex-row items-center justify-center gap-6 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Canvas */}
            <div className="bg-gray-900 p-4 rounded-xl shadow-2xl">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="border-2 border-teal-400 rounded-lg"
                style={{
                  maxWidth: '400px',
                  maxHeight: '400px',
                  width: '100%',
                  height: 'auto'
                }}
              />
            </div>

            {/* Controls */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                Controls
              </h3>
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                <div></div>
                <Button
                  onClick={() => movePlayer(0, -1)}
                  variant="outline"
                  size="icon"
                  className="border-teal-200 hover:bg-teal-50"
                  disabled={!gameState.isPlaying}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <div></div>

                <Button
                  onClick={() => movePlayer(-1, 0)}
                  variant="outline"
                  size="icon"
                  className="border-teal-200 hover:bg-teal-50"
                  disabled={!gameState.isPlaying}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div></div>
                <Button
                  onClick={() => movePlayer(1, 0)}
                  variant="outline"
                  size="icon"
                  className="border-teal-200 hover:bg-teal-50"
                  disabled={!gameState.isPlaying}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div></div>
                <Button
                  onClick={() => movePlayer(0, 1)}
                  variant="outline"
                  size="icon"
                  className="border-teal-200 hover:bg-teal-50"
                  disabled={!gameState.isPlaying}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <div></div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use arrow keys or WASD to move
                </p>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                    <span className="text-xs">Player</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500"></div>
                    <span className="text-xs">Exit</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Game Over Modal */}
        <AnimatePresence>
          {gameState.isGameOver && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    {gameState.hasWon ? (
                      <Trophy className="h-8 w-8 text-white" />
                    ) : (
                      <Timer className="h-8 w-8 text-white" />
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {gameState.hasWon ? "🎉 You Escaped!" : "⏰ Time's Up!"}
                  </h2>

                  <div className="text-gray-600 dark:text-gray-400 mb-4 space-y-1">
                    <p>Moves: {gameState.moves}</p>
                    <p>Time: {formatTime(currentDifficulty.timeLimit - gameState.timer)}</p>
                    {gameState.hasWon && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Maze Completed!
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={resetGame}
                      variant="outline"
                      className="border-teal-200 hover:bg-teal-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Play Again
                    </Button>

                    <Button
                      onClick={onBackToGames}
                      variant="outline"
                      className="border-teal-200 hover:bg-teal-50"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Menu
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
