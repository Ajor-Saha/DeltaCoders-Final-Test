"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Axios } from "@/config/axios";
import useAuthStore from "@/store/store";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface WeakTopic {
  topicId: string;
  title: string;
  description: string;
  difficulty: string;
  averagePerformance?: number;
  latestPerformance?: number;
  quizAttempts?: number;
  lastAttemptDate?: string;
  lessonContent?: string;
  isCurrentWeakness?: boolean;
  isWeak?: boolean;
}

interface AttemptedTopic {
  topicId: string;
  title: string;
  description: string;
  difficulty: string;
  averagePerformance?: number;
  latestPerformance?: number;
  quizAttempts?: number;
  lastAttemptDate?: string;
  isCurrentlyWeak?: boolean;
  isWeak?: boolean;
}

interface WeakLessonsData {
  lessonId: string;
  subject: {
    id: string;
    name: string;
  };
  analysis: {
    type?: string;
    totalTopics: number;
    attemptedTopics?: number;
    recentlyAttemptedTopics?: number;
    weakTopics: number;
    currentWeakTopics?: number;
    unattemptedTopics?: number;
    averageOverallPerformance?: number;
    averageRecentPerformance?: number;
    regenerated?: boolean;
  };
  attemptedTopics?: AttemptedTopic[];
  recentAttemptedTopics?: AttemptedTopic[];
  weakTopics: WeakTopic[];
  currentWeakTopics?: WeakTopic[];
  unattemptedTopics?: Array<{
    topicId: string;
    title: string;
    description: string;
    difficulty: string;
    status: string;
  }>;
  remedialContent: string;
  generatedAt: string;
  isRegenerated?: boolean;
}

interface ExistingLesson {
  id: string;
  userId: string;
  subject: {
    id: string;
    name: string;
  };
  content: {
    analysis: any;
    remedialContent: string;
    weakTopics: WeakTopic[];
    attemptedTopics?: AttemptedTopic[];
    currentWeakTopics?: WeakTopic[];
    recentAttemptedTopics?: AttemptedTopic[];
    unattemptedTopics?: any[];
  };
  createdAt: string;
  updatedAt: string;
}

interface WeakLessonsProps {
  subjectId: string;
  subjectName: string;
}

const difficultyColors = {
  Easy: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  Hard: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const performanceColors = {
  excellent: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  average: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  poor: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const getPerformanceColor = (performance: number) => {
  if (performance >= 85) return performanceColors.excellent;
  if (performance >= 75) return performanceColors.good;
  if (performance >= 60) return performanceColors.average;
  return performanceColors.poor;
};

const getPerformanceLabel = (performance: number) => {
  if (performance >= 85) return "Excellent";
  if (performance >= 75) return "Good";
  if (performance >= 60) return "Average";
  return "Needs Improvement";
};

export function WeakLessons({ subjectId, subjectName }: WeakLessonsProps) {
  const [existingLessons, setExistingLessons] = useState<ExistingLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<ExistingLesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['analysis']));
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (subjectId && !hasInitialLoad) {
      loadExistingLessons();
      setHasInitialLoad(true);
    }
  }, [subjectId, hasInitialLoad]);

  const loadExistingLessons = async () => {
    if (!isAuthenticated || !accessToken) {
      toast.error("Please log in to view weak lessons");
      return;
    }

    setIsLoading(true);
    try {
      const response = await Axios.get(`/api/weak-lessons/user/${subjectId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        const lessons = response.data.data.lessons;
        setExistingLessons(lessons);

        // Auto-select the most recent lesson if available
        if (lessons.length > 0) {
          setSelectedLesson(lessons[lessons.length - 1]);
        }

        if (lessons.length === 0) {
          toast.info("No existing weak lessons found. Generate your first analysis!");
        }
      }
    } catch (error: any) {
      console.error('Error loading existing lessons:', error);
      if (error.response?.status !== 404) {
        toast.error("Failed to load existing lessons");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeakLessons = async () => {
    if (!isAuthenticated || !accessToken) {
      toast.error("Please log in to generate weak lessons");
      return;
    }

    setIsGenerating(true);
    setLoadingStep("🔍 Analyzing your quiz performance...");

    // Simulate step progression for better UX
    const steps = [
      "🔍 Analyzing your quiz performance...",
      "🎯 Identifying weakness patterns...",
      "📊 Evaluating topic difficulties...",
      "🧠 AI agent is creating remedial content...",
      "✨ Finalizing personalized study plan..."
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setLoadingStep(steps[stepIndex]);
      }
    }, 2000);

    try {
      const response = await Axios.post(
        `/api/weak-lessons/generate/${subjectId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      clearInterval(stepInterval);

      if (response.data.success) {
        const newLessonData: WeakLessonsData = response.data.data;

        // Check if no weak topics were found
        if (!newLessonData.weakTopics || newLessonData.weakTopics.length === 0) {
          setLoadingStep("🎉 No weak topics found for this subject!");
          setTimeout(() => {
            setIsGenerating(false);
            setLoadingStep("");
            toast.success("Great news! No weaknesses detected in this subject! 🏆");
          }, 2000);
          return;
        }

        // Convert to existing lesson format
        const newLesson: ExistingLesson = {
          id: newLessonData.lessonId,
          userId: '', // Not needed for display
          subject: newLessonData.subject,
          content: {
            analysis: newLessonData.analysis,
            remedialContent: newLessonData.remedialContent,
            weakTopics: newLessonData.weakTopics,
            attemptedTopics: newLessonData.attemptedTopics,
            unattemptedTopics: newLessonData.unattemptedTopics,
          },
          createdAt: newLessonData.generatedAt,
          updatedAt: newLessonData.generatedAt,
        };

        setExistingLessons(prev => [...prev, newLesson]);
        setSelectedLesson(newLesson);
        setLoadingStep("✅ Weak lessons generated successfully!");

        setTimeout(() => {
          setIsGenerating(false);
          setLoadingStep("");
          toast.success("Weak lessons generated successfully! 🎯");
        }, 1500);
      }
    } catch (error: any) {
      clearInterval(stepInterval);
      console.error('Error generating weak lessons:', error);
      const errorMessage = error.response?.data?.message || "Failed to generate weak lessons";

      setLoadingStep("❌ Failed to generate analysis");
      setTimeout(() => {
        setIsGenerating(false);
        setLoadingStep("");
        toast.error(errorMessage);
      }, 2000);
    }
  };

  const regenerateLatestWeakLessons = async () => {
    if (!isAuthenticated || !accessToken) {
      toast.error("Please log in to regenerate weak lessons");
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await Axios.post(
        `/api/weak-lessons/regenerate-weak-topics`,
        { subjectId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.success) {
        const regeneratedLessonData: WeakLessonsData = response.data.data;

        // Convert to existing lesson format
        const regeneratedLesson: ExistingLesson = {
          id: regeneratedLessonData.lessonId,
          userId: '',
          subject: regeneratedLessonData.subject,
          content: {
            analysis: regeneratedLessonData.analysis,
            remedialContent: regeneratedLessonData.remedialContent,
            weakTopics: regeneratedLessonData.currentWeakTopics || regeneratedLessonData.weakTopics,
            attemptedTopics: regeneratedLessonData.recentAttemptedTopics,
            currentWeakTopics: regeneratedLessonData.currentWeakTopics,
            recentAttemptedTopics: regeneratedLessonData.recentAttemptedTopics,
            unattemptedTopics: regeneratedLessonData.unattemptedTopics,
          },
          createdAt: regeneratedLessonData.generatedAt,
          updatedAt: regeneratedLessonData.generatedAt,
        };

        setExistingLessons(prev => [...prev, regeneratedLesson]);
        setSelectedLesson(regeneratedLesson);
        toast.success("Latest weak lessons regenerated successfully! 🔄");
      }
    } catch (error: any) {
      console.error('Error regenerating weak lessons:', error);
      const errorMessage = error.response?.data?.message || "Failed to regenerate weak lessons";
      toast.error(errorMessage);
    } finally {
      setIsRegenerating(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && !selectedLesson) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-red-500" />
              Weakness Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
                <p className="text-gray-600 dark:text-gray-400">Loading weak lessons...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show step-by-step generation progress
  if (isGenerating) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-red-500" />
              Weakness Analysis for {subjectName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center max-w-md">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-6 relative">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <Brain className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  AI Analysis in Progress
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                  {loadingStep}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Our AI is working hard to create your personalized study plan...
                </p>

                {/* Progress indicator */}
                <div className="mt-6">
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`w-2 h-2 rounded-full ${
                          loadingStep.includes(['🔍', '🎯', '📊', '🧠', '✨'][step - 1])
                            ? 'bg-blue-500 animate-pulse'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedLesson) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-red-500" />
              Weakness Analysis for {subjectName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Weakness Analysis Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Generate your first weakness analysis to identify areas that need improvement based on your quiz performance.
              </p>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={generateWeakLessons}
                  disabled={isGenerating}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Weakness Analysis
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  What is Weakness Analysis?
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Our AI analyzes your quiz performance to identify topics where you struggle the most,
                  then creates personalized remedial lessons to help you improve in those specific areas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = selectedLesson.content.analysis;
  const weakTopics = selectedLesson.content.currentWeakTopics || selectedLesson.content.weakTopics;
  const attemptedTopics = selectedLesson.content.recentAttemptedTopics || selectedLesson.content.attemptedTopics;
  const isRegenerated = analysis.regenerated || analysis.type === 'latest_performance_analysis';

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-red-500" />
              Weakness Analysis
              {isRegenerated && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Latest Analysis
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {existingLessons.length > 0 && (
                <Button
                  onClick={regenerateLatestWeakLessons}
                  disabled={isRegenerating}
                  variant="outline"
                  size="sm"
                >
                  {isRegenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Update Analysis
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={generateWeakLessons}
                disabled={isGenerating}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    New Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generated on {formatDate(selectedLesson.createdAt)}
          </p>
        </CardHeader>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <button
            onClick={() => toggleSection('analysis')}
            className="flex items-center gap-2 w-full text-left"
          >
            {expandedSections.has('analysis') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Performance Overview
            </CardTitle>
          </button>
        </CardHeader>
        {expandedSections.has('analysis') && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analysis.totalTopics}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Topics</div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analysis.recentlyAttemptedTopics || analysis.attemptedTopics || 0}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {isRegenerated ? 'Recently Attempted' : 'Attempted Topics'}
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {analysis.currentWeakTopics || analysis.weakTopics}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Weak Areas</div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analysis.averageRecentPerformance || analysis.averageOverallPerformance || 0}%
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Avg Performance
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Weak Topics */}
      {weakTopics && weakTopics.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('weak-topics')}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedSections.has('weak-topics') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Areas Needing Improvement ({weakTopics.length})
              </CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('weak-topics') && (
            <CardContent>
              <div className="space-y-4">
                {weakTopics.map((topic, index) => (
                  <div key={topic.topicId} className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 font-semibold text-xs">
                          {index + 1}
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {topic.title}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={difficultyColors[topic.difficulty as keyof typeof difficultyColors]}>
                          {topic.difficulty}
                        </Badge>
                        <Badge className={getPerformanceColor(topic.latestPerformance || topic.averagePerformance || 0)}>
                          {topic.latestPerformance || topic.averagePerformance || 0}%
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {topic.description}
                    </p>
                    {topic.lastAttemptDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        Last attempt: {formatDate(topic.lastAttemptDate)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* No Weak Topics Found */}
      {(!weakTopics || weakTopics.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Excellent Performance!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Weak Topics Found!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Congratulations! Our analysis shows that you have no significant weaknesses in <strong>{subjectName}</strong>.
                You're performing well across all attempted topics.
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 dark:text-green-400">Strong Performance</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 dark:text-blue-400">Keep It Up!</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strong Topics */}
      {attemptedTopics && attemptedTopics.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('strong-topics')}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedSections.has('strong-topics') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Strong Areas ({attemptedTopics.filter(t => !(t.isCurrentlyWeak || t.isWeak)).length})
              </CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('strong-topics') && (
            <CardContent>
              <div className="space-y-3">
                {attemptedTopics
                  .filter(topic => !(topic.isCurrentlyWeak || topic.isWeak))
                  .map((topic, index) => (
                  <div key={topic.topicId} className="p-3 border border-green-200 dark:border-green-800 rounded-lg bg-green-50/50 dark:bg-green-900/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-xs">
                          ✓
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {topic.title}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={difficultyColors[topic.difficulty as keyof typeof difficultyColors]}>
                          {topic.difficulty}
                        </Badge>
                        <Badge className={getPerformanceColor(topic.latestPerformance || topic.averagePerformance || 0)}>
                          {topic.latestPerformance || topic.averagePerformance || 0}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* AI Remedial Content */}
      <Card>
        <CardHeader>
          <button
            onClick={() => toggleSection('remedial-content')}
            className="flex items-center gap-2 w-full text-left"
          >
            {expandedSections.has('remedial-content') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              AI-Generated Study Plan
            </CardTitle>
          </button>
        </CardHeader>
        {expandedSections.has('remedial-content') && (
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-700 dark:text-gray-300">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900 dark:text-gray-100">
                      {children}
                    </strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 italic">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {selectedLesson.content.remedialContent}
              </ReactMarkdown>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lesson History */}
      {existingLessons.length > 1 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('history')}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedSections.has('history') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                Analysis History ({existingLessons.length})
              </CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('history') && (
            <CardContent>
              <div className="space-y-2">
                {existingLessons.slice().reverse().map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedLesson?.id === lesson.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(lesson.createdAt)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {lesson.content.analysis.currentWeakTopics || lesson.content.weakTopics?.length || 0} weak areas found
                        </div>
                      </div>
                      {lesson.content.analysis.regenerated && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          Latest
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
