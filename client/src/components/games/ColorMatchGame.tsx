"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Palette,
  Play,
  RotateCcw,
  Star,
  Target,
  Timer,
  Trophy
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Shape {
  id: number;
  color: string;
  matched: boolean;
  uniqueId: string;
}

interface GameState {
  shapes: Shape[];
  timer: number;
  score: number;
  selectedShape: Shape | null;
  level: number;
  isPlaying: boolean;
  isGameOver: boolean;
  targetScore: number;
}

interface Level {
  level: number;
  name: string;
  pairs: number;
  timeLimit: number;
  pointsPerMatch: number;
  targetScore: number;
  colors: string[];
}

const levels: Level[] = [
  {
    level: 1,
    name: "Easy",
    pairs: 6,
    timeLimit: 60,
    pointsPerMatch: 10,
    targetScore: 60,
    colors: ["#10B981", "#3B82F6", "#EF4444", "#F59E0B"]
  },
  {
    level: 2,
    name: "Medium",
    pairs: 8,
    timeLimit: 75,
    pointsPerMatch: 10,
    targetScore: 80,
    colors: ["#10B981", "#14B8A6", "#3B82F6", "#6366F1", "#EF4444", "#EC4899"]
  },
  {
    level: 3,
    name: "Hard",
    pairs: 10,
    timeLimit: 90,
    pointsPerMatch: 10,
    targetScore: 100,
    colors: ["#10B981", "#14B8A6", "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#EF4444"]
  },
  {
    level: 4,
    name: "Expert",
    pairs: 15,
    timeLimit: 100,
    pointsPerMatch: 10,
    targetScore: 150,
    colors: ["#059669", "#0891B2", "#0284C7", "#2563EB", "#4F46E5", "#7C3AED", "#C026D3", "#DC2626", "#D97706", "#65A30D"]
  },
  {
    level: 5,
    name: "Master",
    pairs: 18,
    timeLimit: 120,
    pointsPerMatch: 10,
    targetScore: 180,
    colors: ["#047857", "#0E7490", "#0369A1", "#1D4ED8", "#3730A3", "#6B21A8", "#A21CAF", "#B91C1C", "#C2410C", "#4D7C0F", "#115E59", "#92400E"]
  }
];

interface ColorMatchGameProps {
  onBackToGames: () => void;
}

export default function ColorMatchGame({ onBackToGames }: ColorMatchGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    shapes: [],
    timer: 90,
    score: 0,
    selectedShape: null,
    level: 1,
    isPlaying: false,
    isGameOver: false,
    targetScore: 50
  });

  const currentLevel = levels[gameState.level - 1];

  const initGame = useCallback(() => {
    const shapes: Shape[] = [];
    const levelData = levels[gameState.level - 1];

    // Create pairs of shapes
    for (let i = 0; i < levelData.pairs; i++) {
      const color = levelData.colors[i % levelData.colors.length];
      shapes.push({
        id: i,
        color,
        matched: false,
        uniqueId: `${i}-a`
      });
      shapes.push({
        id: i,
        color,
        matched: false,
        uniqueId: `${i}-b`
      });
    }

    // Shuffle shapes
    shapes.sort(() => Math.random() - 0.5);

    setGameState(prev => ({
      ...prev,
      shapes,
      timer: levelData.timeLimit,
      score: 0,
      selectedShape: null,
      isPlaying: true,
      isGameOver: false,
      targetScore: levelData.targetScore
    }));
  }, [gameState.level]);

  const handleShapeClick = (shape: Shape) => {
    if (shape.matched || !gameState.isPlaying) return;

    setGameState(prev => {
      const newState = { ...prev };

      if (!prev.selectedShape) {
        // First shape selected
        newState.selectedShape = shape;
      } else if (prev.selectedShape.uniqueId === shape.uniqueId) {
        // Same shape clicked - deselect
        newState.selectedShape = null;
      } else if (prev.selectedShape.id === shape.id) {
        // Match found!
        const updatedShapes = prev.shapes.map(s =>
          s.id === shape.id ? { ...s, matched: true } : s
        );

        newState.shapes = updatedShapes;
        newState.score = prev.score + currentLevel.pointsPerMatch;
        newState.selectedShape = null;

        // Check if all pairs are matched
        if (updatedShapes.every(s => s.matched)) {
          newState.isGameOver = true;
          newState.isPlaying = false;
        }
      } else {
        // No match - deselect after brief delay
        newState.selectedShape = null;
        setTimeout(() => {
          setGameState(current => ({ ...current, selectedShape: null }));
        }, 500);
      }

      return newState;
    });
  };

  const startTimer = useCallback(() => {
    if (!gameState.isPlaying) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timer <= 1) {
          clearInterval(timer);
          return { ...prev, timer: 0, isGameOver: true, isPlaying: false };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isPlaying]);

  useEffect(() => {
    if (gameState.isPlaying) {
      const cleanup = startTimer();
      return cleanup;
    }
  }, [gameState.isPlaying, startTimer]);

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      shapes: [],
      timer: currentLevel.timeLimit,
      score: 0,
      selectedShape: null,
      isPlaying: false,
      isGameOver: false
    }));
  };

  const nextLevel = () => {
    if (gameState.level < levels.length) {
      setGameState(prev => ({
        ...prev,
        level: prev.level + 1,
        shapes: [],
        timer: levels[prev.level].timeLimit,
        score: 0,
        selectedShape: null,
        isPlaying: false,
        isGameOver: false,
        targetScore: levels[prev.level].targetScore
      }));
    }
  };

  const selectLevel = (level: number) => {
    setGameState(prev => ({
      ...prev,
      level,
      shapes: [],
      timer: levels[level - 1].timeLimit,
      score: 0,
      selectedShape: null,
      isPlaying: false,
      isGameOver: false,
      targetScore: levels[level - 1].targetScore
    }));
  };

  const getGridCols = () => {
    const totalShapes = currentLevel.pairs * 2;
    // if (totalShapes <= 12) return "grid-cols-4";
    if (totalShapes <= 16) return "grid-cols-4";
    if (totalShapes <= 20) return "grid-cols-5";
    if (totalShapes <= 36) return "grid-cols-6";
    return "grid-cols-7";
  };

  const isLevelComplete = gameState.score >= gameState.targetScore && gameState.shapes.every(s => s.matched);
  const canAdvance = isLevelComplete && gameState.level < levels.length;

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
                <Palette className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Color Match Game
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Level {gameState.level}: {currentLevel.name}
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
                  {gameState.timer}s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Time Left</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gameState.score}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gameState.targetScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Target</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentLevel.pairs}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pairs</div>
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {levels.map((level) => (
                    <Button
                      key={level.level}
                      onClick={() => selectLevel(level.level)}
                      variant={gameState.level === level.level ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col gap-4 ${
                        gameState.level === level.level
                          ? "bg-gradient-to-r from-teal-400 to-teal-600 text-white"
                          : "border-teal-200 hover:bg-teal-50"
                      }`}
                    >
                      <div className="text-lg font-bold">{level.name}</div>
                      <div className="text-xs opacity-80">
                        {level.pairs} pairs • {level.timeLimit}s
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

        {/* Game Board */}
        {gameState.shapes.length > 0 && (
          <motion.div
            className={`grid ${getGridCols()} gap-4 max-w-3xl mx-auto mb-6`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence>
              {gameState.shapes.map((shape) => (
                <motion.div
                  key={shape.uniqueId}
                  className={`aspect-square rounded-lg cursor-pointer transition-all duration-200 relative ${
                    shape.matched
                      ? "opacity-50 pointer-events-none grayscale"
                      : "hover:scale-102 shadow-md hover:shadow-lg"
                  } ${
                    gameState.selectedShape?.uniqueId === shape.uniqueId
                      ? "ring-3 ring-teal-400 scale-102"
                      : ""
                  }`}
                  style={{ backgroundColor: shape.matched ? "#9CA3AF" : shape.color }}
                  onClick={() => handleShapeClick(shape)}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  whileHover={{ scale: shape.matched ? 1 : 1.05 }}
                  whileTap={{ scale: shape.matched ? 1 : 0.98 }}
                >
                  {shape.matched && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
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
                    {isLevelComplete ? (
                      <Trophy className="h-8 w-8 text-white" />
                    ) : (
                      <Timer className="h-8 w-8 text-white" />
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isLevelComplete ? "Level Complete!" : "Time's Up!"}
                  </h2>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Final Score: {gameState.score} / {gameState.targetScore}
                  </p>

                  {isLevelComplete && (
                    <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Target Achieved!
                    </Badge>
                  )}

                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={resetGame}
                      variant="outline"
                      className="border-teal-200 hover:bg-teal-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Play Again
                    </Button>

                    {canAdvance && (
                      <Button
                        onClick={nextLevel}
                        className="bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white"
                      >
                        Next Level
                      </Button>
                    )}

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
