import { Card, CardContent } from '@/components/ui/card';
import { Brain, Eye, Zap } from 'lucide-react';

export const AnalyzingLoader = () => {
  return (
    <Card className="border-2 border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-gray-900/50 dark:to-teal-900/50">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          {/* Animated Icons */}
          <div className="flex justify-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full animate-pulse">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="p-3 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}>
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="p-3 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}>
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Loading Spinner */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>

          {/* Text */}
          <div>
            <h3 className="text-lg font-semibold text-teal-700 dark:text-teal-300 mb-2">
              Analyzing Your Performance...
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              AI is evaluating your cognitive traits and performance patterns
            </p>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            <div className="text-left">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Processing game data</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-teal-100 dark:bg-teal-900/20 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-1.5 rounded-full w-full"></div>
              </div>
            </div>

            <div className="text-left">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Calculating cognitive load</span>
                <span className="animate-pulse">85%</span>
              </div>
              <div className="w-full bg-teal-100 dark:bg-teal-900/20 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-1.5 rounded-full w-4/5 animate-pulse"></div>
              </div>
            </div>

            <div className="text-left">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Analyzing focus patterns</span>
                <span className="animate-pulse">70%</span>
              </div>
              <div className="w-full bg-teal-100 dark:bg-teal-900/20 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-1.5 rounded-full w-3/5 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
