"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameAnalytics } from "@/hooks/useGameAnalytics";
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
import { AnalyzingLoader } from "./AnalyzingLoader";
import { TraitsDisplay } from "./TraitsDisplay";

interface StressObjectType {
  id: string;
  emoji: string;
  icon: React.ElementType;
  points: number;
  speed: number;
  size: number;
  comboBoost?: number;
  color: string; // hex/rgb for canvas drawing
  satisfactionLevel: number; // 1-10 how satisfying to smash
  spawnWeight: number; // weighted spawn probability
}

interface StressObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: StressObjectType;
  alive: boolean;
  age: number;
  rotation: number;
  size: number;
  pulsePhase: number;
  wobble: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // seconds remaining
  maxLife: number; // seconds
  color: string;
  size: number;
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
  stressRelief?: number; // 0-100, for effects
}

// Weighted stress object types (colors in hex for canvas)
const stressObjectTypes: StressObjectType[] = [
  {
    id: "bug",
    emoji: "🐞",
    icon: Bug,
    points: 10,
    speed: 80,
    size: 34,
    color: "#22c55e",
    satisfactionLevel: 9,
    spawnWeight: 3,
    comboBoost: 1.15,
  },
  {
    id: "error",
    emoji: "❗",
    icon: AlertTriangle,
    points: 25,
    speed: 70,
    size: 40,
    color: "#ef4444",
    satisfactionLevel: 10,
    spawnWeight: 3,
    comboBoost: 1.2,
  },
  {
    id: "deadline",
    emoji: "⏰",
    icon: Clock,
    points: -15,
    speed: 90,
    size: 44,
    color: "#f59e0b",
    satisfactionLevel: 3,
    spawnWeight: 3,
  },
  {
    id: "email",
    emoji: "📧",
    icon: Mail,
    points: 15,
    speed: 85,
    size: 36,
    color: "#3b82f6",
    satisfactionLevel: 6,
    spawnWeight: 4,
    comboBoost: 1.2,
  },
];

interface BugSmashGameProps {
  onBackToGames: () => void;
}

export default function BugSmashGame({ onBackToGames }: BugSmashGameProps) {
  const { startSession, trackAction, trackError, endSession, traits, isAnalyzing, sessionActive } = useGameAnalytics('bug-smash');
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
    currentLevel: 1,
    stressRelief: 0,
  });

  const [objects, setObjects] = useState<StressObject[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [message, setMessage] = useState<string>("");

  const canvasWidth = 600;
  const canvasHeight = 400;

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const choose = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const showMessage = useCallback((text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 1500);
  }, []);

  const createStressObject = useCallback((): StressObject => {
    // Weighted random selection
    const totalWeight = stressObjectTypes.reduce((sum, t) => sum + t.spawnWeight, 0);
    let r = Math.random() * totalWeight;
    let selected = stressObjectTypes[0];
    for (const t of stressObjectTypes) {
      r -= t.spawnWeight;
      if (r <= 0) { selected = t; break; }
    }

    // Spawn from edges with directional velocity
    const spawnSide = Math.floor(Math.random() * 4);
    let x = 0, y = 0, vx = 0, vy = 0;
    switch (spawnSide) {
      case 0: // Top
        x = Math.random() * canvasWidth;
        y = -selected.size;
        vx = (Math.random() - 0.5) * 50;
        vy = selected.speed + Math.random() * 30;
        break;
      case 1: // Right
        x = canvasWidth + selected.size;
        y = Math.random() * canvasHeight;
        vx = -(selected.speed + Math.random() * 30);
        vy = (Math.random() - 0.5) * 50;
        break;
      case 2: // Bottom
        x = Math.random() * canvasWidth;
        y = canvasHeight + selected.size;
        vx = (Math.random() - 0.5) * 50;
        vy = -(selected.speed + Math.random() * 30);
        break;
      default: // Left
        x = -selected.size;
        y = Math.random() * canvasHeight;
        vx = selected.speed + Math.random() * 30;
        vy = (Math.random() - 0.5) * 50;
        break;
    }

    return {
      id: objectIdRef.current++,
      x,
      y,
      vx,
      vy,
      type: selected,
      alive: true,
      age: 0,
      rotation: Math.random() * Math.PI * 2,
      size: selected.size,
      pulsePhase: Math.random() * Math.PI * 2,
      wobble: Math.random() * 0.02 + 0.01,
    };
  }, []);

  const createParticle = useCallback((x: number, y: number, color: string): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 200 + 100;
    return {
      id: particleIdRef.current++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color,
      size: Math.random() * 8 + 4,
    };
  }, []);

  // smashObject removed: click handler will implement StressSmash scoring/FX inline

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient reacts to stress relief if present
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const relief = gameState.stressRelief ?? 0;
    const gradient = ctx.createRadialGradient(
      canvasWidth/2, canvasHeight/2, 0,
      canvasWidth/2, canvasHeight/2, canvasWidth/2
    );
    gradient.addColorStop(0, `rgba(20, 184, 166, ${0.05 + relief * 0.001})`);
    gradient.addColorStop(1, 'rgba(15, 118, 110, 0.02)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw objects with pulsing glow
    objects.forEach(obj => {
      if (!obj.alive) return;
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation);
      const pulseScale = 1 + Math.sin(obj.pulsePhase || 0) * 0.1;
      ctx.scale(pulseScale, pulseScale);

      // Shadow glow
      ctx.shadowColor = obj.type.color;
      ctx.shadowBlur = 10 + Math.sin(obj.pulsePhase || 0) * 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Background circle
      ctx.fillStyle = obj.type.color + '20';
      ctx.beginPath();
      ctx.arc(0, 0, obj.size * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Emoji
      ctx.shadowColor = 'transparent';
      ctx.font = `${obj.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.type.emoji, 0, 0);
      ctx.restore();
    });

    // Draw particles as fading circles
    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [objects, particles]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.running || gameState.paused) return;
    event.preventDefault();
    trackAction();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let hitAnyObject = false;
    let totalSatisfaction = 0;
    const clickedObjects: StressObject[] = [];

    setObjects(prev => {
      const remaining: StressObject[] = [];
      prev.forEach(obj => {
        const dx = x - obj.x;
        const dy = y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < obj.size * 0.9 && obj.alive) {
          obj.alive = false;
          clickedObjects.push(obj);
          hitAnyObject = true;
          totalSatisfaction += obj.type.satisfactionLevel;
          const particleCount = Math.min(15, Math.max(8, obj.type.satisfactionLevel));
          setParticles(prevP => ([
            ...prevP,
            ...Array.from({ length: particleCount }, () => createParticle(obj.x, obj.y, obj.type.color))
          ]));
        } else if (obj.alive) {
          remaining.push(obj);
        }
      });
      return remaining;
    });

    if (clickedObjects.length > 0) {
      let totalPoints = 0;
      let comboMultiplier = gameState.combo;
      clickedObjects.forEach(obj => {
        if (obj.type.points < 0) {
          totalPoints += Math.max(-10, obj.type.points + 5);
          setTimeout(() => trackError(), 0);
        } else {
          totalPoints += Math.round(obj.type.points * comboMultiplier);
          if (obj.type.comboBoost) {
            comboMultiplier = Math.min(10, comboMultiplier * obj.type.comboBoost);
          } else {
            comboMultiplier = Math.min(10, comboMultiplier * 1.05);
          }
        }
      });

      setGameState(prev => {
        const newScore = prev.score + totalPoints;
        const newBest = prev.bestScore === null || newScore > prev.bestScore ? newScore : prev.bestScore;
        return {
          ...prev,
          score: newScore,
          combo: comboMultiplier,
          comboTimer: 3000,
          bestScore: newBest,
          stressRelief: Math.min(100, (prev.stressRelief ?? 0) + totalSatisfaction),
        };
      });

      if (clickedObjects.length > 1) {
        showMessage(`${clickedObjects.length}x SMASH COMBO! +${totalPoints} 💥`);
      } else if (totalPoints > 0) {
        const s = clickedObjects[0].type.satisfactionLevel;
        showMessage(s >= 9 ? `ULTRA SMASH! +${totalPoints} ⚡` : s >= 7 ? `GREAT SMASH! +${totalPoints} 💥` : `SMASHED! +${totalPoints} 👊`);
      } else {
        showMessage(`OOPS! ${totalPoints} 😰`);
      }

      // Audio FX
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const avgS = totalSatisfaction / clickedObjects.length;
        for (let i = 0; i < Math.min(clickedObjects.length, 3); i++) {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain); gain.connect(audioContext.destination);
          osc.frequency.value = 200 + (avgS * 30) + (i * 100);
          osc.type = avgS >= 8 ? 'sawtooth' : 'square';
          gain.gain.value = Math.min(0.1, 0.05 + (avgS * 0.005));
          osc.start(audioContext.currentTime + i * 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2 + i * 0.02);
          osc.stop(audioContext.currentTime + 0.2 + i * 0.02);
        }
      } catch {}

      // Haptics
      if (navigator.vibrate) {
        if (clickedObjects.length > 1) navigator.vibrate([30, 10, 30, 10, 30]);
        else navigator.vibrate(Math.min(50, totalSatisfaction * 5));
      }
    } else {
      trackError();
      setGameState(prev => ({ ...prev, combo: Math.max(1, prev.combo * 0.95) }));
    }
  }, [gameState.running, gameState.paused, gameState.combo, createParticle, showMessage, trackAction, trackError]);

  const gameLoop = useCallback((timestamp: number) => {
    if (!gameState.running || gameState.paused) {
      lastFrameRef.current = timestamp;
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const deltaTime = timestamp - lastFrameRef.current;
    lastFrameRef.current = timestamp;

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

    lastSpawnRef.current += deltaTime;
    if (lastSpawnRef.current > spawnIntervalRef.current) {
      setObjects(prev => [...prev, createStressObject()]);
      lastSpawnRef.current = 0;
      spawnIntervalRef.current = Math.max(360, spawnIntervalRef.current * 0.985);
    }

    setObjects(prev => prev.filter(obj => {
      if (!obj.alive) return false;
      obj.age += deltaTime;
      obj.x += (obj.vx * deltaTime) / 1000;
      obj.y += (obj.vy * deltaTime) / 1000;
      obj.rotation += obj.wobble || 0.02;
      obj.pulsePhase = (obj.pulsePhase || 0) + deltaTime * 0.005;

      const margin = 100;
      if (obj.x < -margin || obj.x > canvasWidth + margin || obj.y < -margin || obj.y > canvasHeight + margin) {
        if (obj.type.id === "deadline" && obj.alive) {
          setGameState(prevState => ({ ...prevState, lives: Math.max(0, prevState.lives - 1) }));
          showMessage("-1 Life!");
          setTimeout(() => trackError(), 0);
        }
        return false;
      }
      return true;
    }));

    setParticles(prev => prev.filter(p => {
      p.life -= deltaTime / 1000;
      p.x += (p.vx * deltaTime) / 1000;
      p.y += (p.vy * deltaTime) / 1000;
      p.vy += 200 * deltaTime / 1000; // gravity
      return p.life > 0;
    }));

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.running, gameState.paused, createStressObject, showMessage, trackError]);

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
    startSession();
  }, [showMessage, startSession]);

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

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, objects, particles]);

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

  useEffect(() => {
    if (gameState.gameOver && sessionActive) {
      endSession(gameState.score);
    }
  }, [gameState.gameOver, gameState.score, sessionActive, endSession]);

  const formatTime = (seconds: number) => {
    return Math.ceil(Math.max(0, seconds));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-teal-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-teal-400 to-teal-600 rounded-xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bug Smash</h1>
                <p className="text-gray-600 dark:text-gray-400">Smash bugs and errors for points—watch out for deadlines!</p>
              </div>
            </div>
            <Button onClick={onBackToGames} variant="outline" className="border-teal-200 hover:bg-teal-50">
              <Home className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </div>
        </motion.div>

        <motion.div className="grid grid-cols-1 lg:grid-cols-4 gap-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <div className="lg:col-span-3">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-teal-600" />
                    Gaming Zone
                  </CardTitle>
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
          <div className="lg:col-span-1 space-y-6">
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
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{Math.max(0, gameState.score)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Score</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Heart className="h-6 w-6 mx-auto mb-1 text-red-500" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{gameState.lives}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Lives</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Star className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{gameState.combo.toFixed(1)}x</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Combo</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Timer className="h-6 w-6 mx-auto mb-1 text-teal-600" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatTime(gameState.timeLeft)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Time</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{gameState.bestScore || '--'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Best</div>
                  </div>
                </div>
              </CardContent>
            </Card>
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

        <AnimatePresence>
          {gameState.gameOver && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="max-w-md w-full"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
              >
                {isAnalyzing ? (
                  <AnalyzingLoader />
                ) : traits ? (
                  <TraitsDisplay
                    traits={traits}
                    gameName="bug-smash"
                    score={Math.max(0, gameState.score)}
                    onPlayAgain={resetGame}
                    onBackToMenu={onBackToGames}
                  />
                ) : (
                  <Card className="bg-white dark:bg-gray-800">
                    <CardContent className="p-8">
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
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
