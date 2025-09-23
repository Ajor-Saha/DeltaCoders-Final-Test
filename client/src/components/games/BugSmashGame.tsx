"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bug,
  Clock,
  Heart,
  Home,
  Mail,
  Pause,
  Play,
  RotateCcw,
  Star,
  Target,
  Timer,
  Trophy,
  Zap
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface StressObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: ObjectType;
  alive: boolean;
  age: number;
  rotation: number;
  size: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  text: string;
  life: number;
  startTime: number;
  alpha: number;
  size: number;
}

interface ObjectType {
  id: string;
  emoji: string;
  icon: React.ElementType;
  points: number;
  life: number;
  speed: number;
  size: number;
  comboBoost?: number;
  color: string;
}

interface GameState {
  score: number;
  lives: number;
  combo: number;
  comboTimer: number;
  timeLeft: number;
  running: boolean;
  paused: boolean;
  gameOver: boolean;
  difficulty: string;
  bestScore: number | null;
  currentLevel: number;
}

const objectTypes: Record<string, ObjectType> = {
  bug: {
    id: "bug",
    emoji: "🐞",
    icon: Bug,
    points: 10,
    life: 0,
    speed: 0.6,
    size: 34,
    color: "text-green-500"
  },
  error: {
    id: "error",
    emoji: "❗",
    icon: AlertTriangle,
    points: 25,
    life: 0,
    speed: 1.1,
    size: 40,
    color: "text-red-500"
  },
  deadline: {
    id: "deadline",
    emoji: "⏰",
    icon: Clock,
    points: -15,
    life: -1,
    speed: 1.6,
    size: 44,
    color: "text-orange-500"
  },
  email: {
    id: "email",
    emoji: "📧",
    icon: Mail,
    points: 15,
    life: 0,
    speed: 0.9,
    size: 36,
    comboBoost: 1.2,
    color: "text-blue-500"
  }
};

interface StressSmashGameProps {
  onBackToGames: () => void;
}

export default function StressSmashGame({ onBackToGames }: StressSmashGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const objectIdRef = useRef<number>(0);
  const particleIdRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const spawnIntervalRef = useRef<number>(900);

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 5,
    combo: 1,
    comboTimer: 0,
    timeLeft: 60,
    running: false,
    paused: false,
    gameOver: false,
    difficulty: "normal",
    bestScore: null,
    currentLevel: 1
  });

  const [objects, setObjects] = useState<StressObject[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [message, setMessage] = useState<string>("");

  const canvasWidth = 600;
  const canvasHeight = 400;

  // Utility functions
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const choose = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Show temporary message
  const showMessage = useCallback((text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 1500);
  }, []);

  // Create stress object
  const createStressObject = useCallback((): StressObject => {
    const x = rand(60, canvasWidth - 60);
    const y = canvasHeight + 40;
    const angle = rand(-0.6, -1.5);
    const typeKeys = Object.keys(objectTypes);
    const type = objectTypes[choose(typeKeys)];
    const speed = type.speed * (1 + Math.random() * 0.6);
    const vx = Math.cos(angle) * speed * 60;
    const vy = Math.sin(angle) * speed * 60;

    return {
      id: objectIdRef.current++,
      x,
      y,
      vx,
      vy,
      type,
      alive: true,
      age: 0,
      rotation: rand(-0.6, 0.6),
      size: type.size
    };
  }, []);

  // Create particle effect
  const createParticle = useCallback((x: number, y: number): Particle => {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(80, 260);
    const effects = ["✨", "💥", "⭐", "+"];

    return {
      id: particleIdRef.current++,
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      text: choose(effects),
      life: 700,
      startTime: Date.now(),
      alpha: 1,
      size: rand(12, 20)
    };
  }, []);

  // Smash object
  const smashObject = useCallback((object: StressObject) => {
    if (!object.alive) return;

    setGameState(prev => {
      let newScore = prev.score;
      let newLives = prev.lives;
      let newCombo = prev.combo;
      let newComboTimer = prev.comboTimer;

      if (object.type.points < 0) {
        // Negative object: give some points back for clicking
        newScore += Math.max(-10, object.type.points + 10);
      } else {
        // Good smash
        newScore += Math.round(object.type.points * newCombo);
        newCombo = Math.min(10, newCombo * (object.type.comboBoost || 1.05));
        newComboTimer = 2000; // 2s to continue combo
      }

      // Email combo boost
      if (object.type.comboBoost) {
        newCombo = Math.min(12, newCombo * object.type.comboBoost);
        showMessage("Combo Boost!");
      } else {
        showMessage("SMASH!");
      }

      // Update best score
      const newBestScore = prev.bestScore === null || newScore > prev.bestScore ? newScore : prev.bestScore;

      return {
        ...prev,
        score: newScore,
        lives: newLives,
        combo: newCombo,
        comboTimer: newComboTimer,
        bestScore: newBestScore
      };
    });

    // Create particles
    setParticles(prev => [
      ...prev,
      ...Array.from({ length: 8 }, () => createParticle(object.x, object.y))
    ]);

    // Play sound effect (simple beep)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 500 + Math.random() * 600;
      oscillator.type = 'sawtooth';
      gainNode.gain.value = 0.1;

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }

    // Vibration for mobile
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  }, [createParticle, showMessage]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.running || gameState.paused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find ALL objects under click location
    let hitAnyObject = false;

    setObjects(prev => {
      const clickedObjects: StressObject[] = [];
      const remainingObjects: StressObject[] = [];

      prev.forEach(obj => {
        const dx = x - obj.x;
        const dy = y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < obj.size * 0.8 && obj.alive) {
          clickedObjects.push(obj);
          hitAnyObject = true;
        } else {
          remainingObjects.push(obj);
        }
      });

      // Process all clicked objects for scoring and effects
      if (clickedObjects.length > 0) {
        clickedObjects.forEach(obj => {
          // Process each object individually for scoring
          setGameState(prevState => {
            let newScore = prevState.score;
            let newLives = prevState.lives;
            let newCombo = prevState.combo;
            let newComboTimer = prevState.comboTimer;

            if (obj.type.points < 0) {
              // Negative object: give some points back for clicking
              newScore += Math.max(-10, obj.type.points + 10);
            } else {
              // Good smash
              newScore += Math.round(obj.type.points * newCombo);
              newCombo = Math.min(10, newCombo * (obj.type.comboBoost || 1.05));
              newComboTimer = 2000; // 2s to continue combo
            }

            // Email combo boost
            if (obj.type.comboBoost) {
              newCombo = Math.min(12, newCombo * obj.type.comboBoost);
            }

            // Update best score
            const newBestScore = prevState.bestScore === null || newScore > prevState.bestScore ? newScore : prevState.bestScore;

            return {
              ...prevState,
              score: newScore,
              lives: newLives,
              combo: newCombo,
              comboTimer: newComboTimer,
              bestScore: newBestScore
            };
          });

          // Create particles for each smashed object
          setParticles(prevParticles => [
            ...prevParticles,
            ...Array.from({ length: 8 }, () => createParticle(obj.x, obj.y))
          ]);
        });

        // Show message and play effects
        if (clickedObjects.length > 1) {
          showMessage(`${clickedObjects.length}x SMASH!`);
        } else if (clickedObjects[0]?.type.comboBoost) {
          showMessage("Combo Boost!");
        } else {
          showMessage("SMASH!");
        }

        // Play sound effect
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 500 + Math.random() * 600;
          oscillator.type = 'sawtooth';
          gainNode.gain.value = 0.1 * Math.min(clickedObjects.length, 3); // Louder for multiple hits

          oscillator.start();
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
          // Audio not supported
        }

        // Vibration for mobile
        if (navigator.vibrate) {
          navigator.vibrate(20 * Math.min(clickedObjects.length, 3));
        }

        return remainingObjects;
      }

      return prev;
    });

    // Handle missed click outside the objects forEach to avoid state conflicts
    if (!hitAnyObject) {
      setGameState(prevState => ({
        ...prevState,
        combo: Math.max(1, prevState.combo * 0.95)
      }));
    }
  }, [gameState.running, gameState.paused, createParticle, showMessage]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!gameState.running || gameState.paused) {
      lastFrameRef.current = timestamp;
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const deltaTime = timestamp - lastFrameRef.current;
    lastFrameRef.current = timestamp;

    // Update game state
    setGameState(prev => {
      let newComboTimer = Math.max(0, prev.comboTimer - deltaTime);
      let newCombo = prev.combo;

      if (newComboTimer === 0) {
        newCombo = Math.max(1, newCombo - (0.5 * deltaTime) / 1000);
      }

      let newTimeLeft = prev.timeLeft - deltaTime / 1000;

      if (newTimeLeft <= 0 || prev.lives <= 0) {
        return {
          ...prev,
          timeLeft: 0,
          running: false,
          gameOver: true,
          combo: newCombo,
          comboTimer: newComboTimer
        };
      }

      return {
        ...prev,
        timeLeft: newTimeLeft,
        combo: newCombo,
        comboTimer: newComboTimer
      };
    });

    // Spawn objects
    lastSpawnRef.current += deltaTime;
    if (lastSpawnRef.current > spawnIntervalRef.current) {
      setObjects(prev => [...prev, createStressObject()]);
      lastSpawnRef.current = 0;
      spawnIntervalRef.current = Math.max(360, spawnIntervalRef.current * 0.985);
    }

    // Update objects
    setObjects(prev => prev.filter(obj => {
      obj.age += deltaTime;
      obj.x += (obj.vx * deltaTime) / 1000;
      obj.y += (obj.vy * deltaTime) / 1000;
      obj.rotation += 0.02;

      // Remove objects that go off screen
      if (obj.y < -80 || obj.x < -100 || obj.x > canvasWidth + 100) {
        // Penalty for deadline objects that escape
        if (obj.type.id === "deadline" && obj.alive) {
          setGameState(prevState => ({
            ...prevState,
            lives: Math.max(0, prevState.lives - 1)
          }));
          showMessage("-1 Life!");
        }
        return false;
      }
      return true;
    }));

    // Update particles
    setParticles(prev => prev.filter(particle => {
      const age = Date.now() - particle.startTime;
      if (age > particle.life) return false;

      particle.x += (particle.dx * deltaTime) / 1000;
      particle.y += (particle.dy * deltaTime) / 1000;
      particle.alpha = 1 - age / particle.life;
      particle.dy += (280 * deltaTime) / 1000; // gravity

      return true;
    }));

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.running, gameState.paused, createStressObject, showMessage]);

  // Canvas drawing
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background
    ctx.fillStyle = 'rgba(20, 184, 166, 0.05)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw objects
    objects.forEach(obj => {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, obj.size * 0.3, obj.size * 0.6, obj.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Background circle
      ctx.fillStyle = 'rgba(20, 184, 166, 0.1)';
      ctx.beginPath();
      ctx.arc(0, 0, obj.size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Emoji
      ctx.font = `${obj.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.type.emoji, 0, 0);
      ctx.restore();
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.font = `${particle.size}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(particle.text, particle.x, particle.y);
      ctx.restore();
    });
  }, [objects, particles]);

  // Game controls
  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      lives: 5,
      combo: 1,
      comboTimer: 0,
      timeLeft: 60,
      running: true,
      paused: false,
      gameOver: false
    }));
    setObjects([]);
    setParticles([]);
    lastSpawnRef.current = 0;
    spawnIntervalRef.current = 900;
    lastFrameRef.current = performance.now();
    showMessage("Go!");
  }, [showMessage]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      paused: !prev.paused
    }));
    showMessage(gameState.paused ? "Resumed" : "Paused");
  }, [gameState.paused, showMessage]);

  const resetGame = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startGame();
  }, [startGame]);

  // Effects
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    if (gameState.running && !gameState.paused) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.running, gameState.paused, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!gameState.running) startGame();
        else resetGame();
      }
      if (e.key === 'p' || e.key === 'P') {
        pauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.running, startGame, resetGame, pauseGame]);

  const formatTime = (seconds: number) => {
    return Math.ceil(Math.max(0, seconds));
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-teal-400 to-teal-600 rounded-xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Stress Smash
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Smash stress objects to relieve pressure and score points!
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
        </motion.div>

        {/* Main Game Layout */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Game Area - Takes up 3 columns */}
          <div className="lg:col-span-3">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-teal-600" />
                    Gaming Zone
                  </CardTitle>

                  {/* Game Controls */}
                  <div className="flex gap-2">
                    <Button
                      onClick={startGame}
                      disabled={gameState.running && !gameState.gameOver}
                      size="sm"
                      className="bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {gameState.running ? "Playing..." : "Start"}
                    </Button>

                    {gameState.running && (
                      <Button
                        onClick={pauseGame}
                        variant="outline"
                        size="sm"
                        className="border-teal-200 hover:bg-teal-50"
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        {gameState.paused ? "Resume" : "Pause"}
                      </Button>
                    )}

                    <Button
                      onClick={resetGame}
                      variant="outline"
                      size="sm"
                      className="border-teal-200 hover:bg-teal-50"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    onClick={handleCanvasClick}
                    className="border-2 border-teal-400/50 rounded-lg cursor-crosshair w-full"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      aspectRatio: `${canvasWidth}/${canvasHeight}`
                    }}
                  />

                  {/* Message Overlay */}
                  <AnimatePresence>
                    {message && (
                      <motion.div
                        className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-4 py-2 rounded-lg text-lg font-bold border border-teal-400/50"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        {message}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Panel - Takes up 1 column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Game Stats */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-teal-600" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-teal-600" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {Math.max(0, gameState.score)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Score</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Heart className="h-6 w-6 mx-auto mb-1 text-red-500" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {gameState.lives}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Lives</div>
                  </div>

                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Star className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {gameState.combo.toFixed(1)}x
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Combo</div>
                  </div>

                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Timer className="h-6 w-6 mx-auto mb-1 text-teal-600" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatTime(gameState.timeLeft)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Time</div>
                  </div>

                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {gameState.bestScore || '--'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Best</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to Play */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-teal-600" />
                  How to Play
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <Bug className="h-4 w-4 text-green-500" />
                    <span>🐞 Bug (+10 pts)</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>❗ Error (+25 pts)</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>⏰ Deadline (-1 life)</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>📧 Email (combo boost)</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Pro Tips:</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Click objects to smash them</li>
                    <li>• Build combos for higher scores</li>
                    <li>• Watch out for fast deadlines</li>
                    <li>• Use Space/P for shortcuts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Game Over Modal */}
        <AnimatePresence>
          {gameState.gameOver && (
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
                    <Trophy className="h-8 w-8 text-white" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {gameState.lives <= 0 ? "💀 Out of Lives!" : "⏰ Time's Up!"}
                  </h2>

                  <div className="text-gray-600 dark:text-gray-400 mb-4 space-y-1">
                    <p>Final Score: {Math.max(0, gameState.score)}</p>
                    <p>Best Combo: {gameState.combo.toFixed(1)}x</p>
                    {gameState.bestScore && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {gameState.score >= gameState.bestScore ? "New Best Score!" : `Best: ${gameState.bestScore}`}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={resetGame}
                      className="bg-gradient-to-r from-teal-400 to-teal-600 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
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
