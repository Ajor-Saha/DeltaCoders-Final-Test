import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Eye, Home, Play, Trophy, Zap } from 'lucide-react';

interface GameTraits {
  cognitiveLoad: number;
  focus: number;
  attention: number;
}

interface TraitsDisplayProps {
  traits: GameTraits;
  gameName: string;
  score?: number;
  onPlayAgain?: () => void;
  onBackToMenu?: () => void;
}

export const TraitsDisplay = ({ traits, gameName, score, onPlayAgain, onBackToMenu }: TraitsDisplayProps) => {
  const getTraitColor = (value: number) => {
    if (value >= 80) return 'text-green-600 dark:text-green-400';
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (value >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTraitBadgeColor = (value: number) => {
    if (value >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (value >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (value >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  const getTraitLevel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Average';
    return 'Needs Practice';
  };

  const formatGameName = (name: string) => {
    return name.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="border-2 border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-gray-900/50 dark:to-teal-900/50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-xl text-teal-700 dark:text-teal-300">
          Performance Analysis
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-400">
          {formatGameName(gameName)} Session Complete
        </p>
        {score !== undefined && (
          <Badge className="bg-gradient-to-r from-teal-400 to-teal-600 text-white mt-2">
            Score: {score}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cognitive Load */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-teal-400 to-teal-600 rounded-lg">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Cognitive Load
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getTraitColor(100 - traits.cognitiveLoad)}`}>
                {100 - traits.cognitiveLoad}%
              </span>
              <Badge className={getTraitBadgeColor(100 - traits.cognitiveLoad)}>
                {getTraitLevel(100 - traits.cognitiveLoad)}
              </Badge>
            </div>
          </div>
          <Progress
            value={100 - traits.cognitiveLoad}
            className="h-2 bg-teal-100 dark:bg-teal-900/20"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            How well you handled mental complexity
          </p>
        </div>

        {/* Focus */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-teal-400 to-teal-600 rounded-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Focus
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getTraitColor(traits.focus)}`}>
                {traits.focus}%
              </span>
              <Badge className={getTraitBadgeColor(traits.focus)}>
                {getTraitLevel(traits.focus)}
              </Badge>
            </div>
          </div>
          <Progress
            value={traits.focus}
            className="h-2 bg-teal-100 dark:bg-teal-900/20"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Your concentration and task efficiency
          </p>
        </div>

        {/* Attention */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-teal-400 to-teal-600 rounded-lg">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Attention
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getTraitColor(traits.attention)}`}>
                {traits.attention}%
              </span>
              <Badge className={getTraitBadgeColor(traits.attention)}>
                {getTraitLevel(traits.attention)}
              </Badge>
            </div>
          </div>
          <Progress
            value={traits.attention}
            className="h-2 bg-teal-100 dark:bg-teal-900/20"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Your sustained attention and alertness
          </p>
        </div>

        {/* Overall Performance */}
        <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
          <h4 className="font-medium text-teal-700 dark:text-teal-300 mb-2">
            Overall Performance
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {(() => {
              const avg = Math.round((traits.focus + traits.attention + (100 - traits.cognitiveLoad)) / 3);
              if (avg >= 80) return "Outstanding performance! You're in the zone! 🌟";
              if (avg >= 60) return "Great job! You're showing strong cognitive skills! 💪";
              if (avg >= 40) return "Good effort! Keep practicing to improve further! 📈";
              return "Every session helps you improve! Keep going! 🎯";
            })()}
          </p>
        </div>

        {(onPlayAgain || onBackToMenu) && (
          <div className="flex gap-3 justify-center">
            {onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className="px-4 py-2 bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Play Again
              </button>
            )}
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="px-4 py-2 border border-teal-200 hover:bg-teal-50 text-teal-700 rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Menu
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
