"use client";

import StressSmashGame from "@/components/games/BugSmashGame";
import ColorMatchGame from "@/components/games/ColorMatchGame";
import MazeEscapeGame from "@/components/games/MazeEscapeGame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Clock,
  Gamepad2,
  Navigation,
  Palette,
  Play,
  Puzzle,
  Star,
  Target,
  Users,
  Zap
} from "lucide-react";
import React, { useState } from "react";

interface Game {
  id: string;
  title: string;
  description: string;
  players: number;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  icon: React.ElementType;
  color: string;
  isOnline: boolean;
  rating: number;
}

const gamesData: Record<string, Game[]> = {
  puzzle: [
    {
      id: "color-match",
      title: "Color Match",
      description: "Match colored shapes in this relaxing puzzle game with multiple levels",
      players: 1,
      duration: "5-15 min",
      difficulty: "Easy",
      category: "Memory",
      icon: Palette,
      color: "from-teal-400 to-teal-600",
      isOnline: true,
      rating: 4.6
    },
    {
      id: "maze-escape",
      title: "Maze Escape",
      description: "Navigate through challenging mazes with increasing difficulty",
      players: 1,
      duration: "3-20 min",
      difficulty: "Medium",
      category: "Navigation",
      icon: Navigation,
      color: "from-teal-400 to-teal-600",
      isOnline: true,
      rating: 4.7
    }
  ],
  action: [
    {
      id: "stress-smash",
      title: "Stress Smash",
      description: "Smash stress objects like bugs, errors, and deadlines to relieve pressure",
      players: 1,
      duration: "2-10 min",
      difficulty: "Medium",
      category: "Stress Relief",
      icon: Zap,
      color: "from-teal-400 to-teal-600",
      isOnline: true,
      rating: 4.8
    }
  ]
};

const tabs = [
  { id: "all", label: "All Games", icon: Gamepad2 },
  { id: "puzzle", label: "Puzzle Games", icon: Puzzle },
  { id: "action", label: "Action Games", icon: Target }
];

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [currentGame, setCurrentGame] = useState<string | null>(null);

  const handlePlayGame = (gameId: string) => {
    setCurrentGame(gameId);
  };

  const handleBackToGames = () => {
    setCurrentGame(null);
  };

  // Get games based on active tab
  const getGamesForTab = (tab: string) => {
    if (tab === "all") {
      // Return all games from all categories
      return Object.values(gamesData).flat();
    }
    return gamesData[tab] || [];
  };

  // If a game is selected, render the game component
  if (currentGame === "color-match") {
    return <ColorMatchGame onBackToGames={handleBackToGames} />;
  }

  if (currentGame === "maze-escape") {
    return <MazeEscapeGame onBackToGames={handleBackToGames} />;
  }

  if (currentGame === "stress-smash") {
    return <StressSmashGame onBackToGames={handleBackToGames} />;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Hard": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black/0 dark:to-black/5 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-teal-400 to-teal-600 dark:from-teal-600 dark:to-teal-800 rounded-xl">
              <Gamepad2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Games Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover and play amazing games across different categories
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-xl p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-teal-400 to-teal-600 dark:from-teal-600 dark:to-teal-800 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-700/80"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Games Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {getGamesForTab(activeTab)?.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 bg-gradient-to-r ${game.color} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                        <game.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                          {game.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {game.category}
                        </p>
                      </div>
                    </div>
                    {game.isOnline && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Online
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {game.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4" />
                      {game.players} Player{game.players > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      {game.duration}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={getDifficultyColor(game.difficulty)}>
                      {game.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {renderStars(game.rating)}
                      <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                        {game.rating}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePlayGame(game.id)}
                    className="w-full bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 dark:from-teal-600 dark:to-teal-800 dark:hover:from-teal-700 dark:hover:to-teal-900 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Play Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
