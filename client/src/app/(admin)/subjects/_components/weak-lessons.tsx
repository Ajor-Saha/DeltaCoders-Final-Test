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
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface DetailedRemedialLesson {
  topicId: string;
  title: string;
  difficulty: string;
  performance: number;
  conceptReview: {
    coreConceptsToReview: string[];
    fundamentalPrinciples: string;
    keyTermsAndDefinitions: Array<{
      term: string;
      definition: string;
    }>;
  };
  learningPath: {
    [key: string]: {
      title: string;
      description: string;
      timeRequired: string;
    };
  };
  practiceExercises: {
    basicLevel: string[];
    intermediateLevel: string[];
    advancedLevel: string[];
  };
  commonMistakes: Array<{
    mistake: string;
    correction: string;
  }>;
  studyResources: {
    recommendedReadings: string[];
    videoLessons: string[];
    onlinePractice: string[];
  };
  selfAssessment: Array<{
    question: string;
    expectedAnswer: string;
  }>;
  timeAllocation: {
    totalRecommendedTime: string;
    dailyStudyTime: string;
    breakdown: {
      conceptReview: string;
      practiceExercises: string;
      selfAssessment: string;
    };
  };
  additionalPracticeQuestions: Array<{
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correctAnswer: string;
    explanation: string;
    difficulty: string;
    targetedWeakness: string;
  }>;
  mistakeAnalysis?: {
    totalMistakes: number;
    commonErrorPatterns: string[];
    improvementFocus: string;
  };
}

interface StudySchedule {
  weeklySchedule: {
    totalWeeks: number;
    studyDaysPerWeek: number;
    averageDailyTime: string;
    week1: {
      [day: string]: {
        topic: string;
        activities: string[];
        duration: string;
      };
    };
    week2: {
      [day: string]: {
        topic: string;
        activities: string[];
        duration: string;
      };
    };
  };
  studyTips: string[];
  milestones: Array<{
    week: number;
    goal: string;
  }>;
}

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
    performanceSummary?: string;
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
  detailedRemedialLessons: DetailedRemedialLesson[];
  personalizedStudySchedule: StudySchedule | null;
  remedialSummary: {
    totalWeakTopics: number;
    detailedLessonsGenerated: number;
    totalPracticeQuestions: number;
    averageStudyTimeRequired: string;
    message: string;
  };
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
    detailedRemedialLessons?: DetailedRemedialLesson[];
    personalizedStudySchedule?: StudySchedule | null;
    remedialSummary?: {
      totalWeakTopics: number;
      detailedLessonsGenerated: number;
      totalPracticeQuestions: number;
      averageStudyTimeRequired: string;
      message: string;
    };
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
            detailedRemedialLessons: newLessonData.detailedRemedialLessons,
            personalizedStudySchedule: newLessonData.personalizedStudySchedule,
            remedialSummary: newLessonData.remedialSummary,
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
            detailedRemedialLessons: regeneratedLessonData.detailedRemedialLessons,
            personalizedStudySchedule: regeneratedLessonData.personalizedStudySchedule,
            remedialSummary: regeneratedLessonData.remedialSummary,
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

            {/* Remedial Summary - Show if available */}
            {selectedLesson.content.remedialSummary && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                    Comprehensive Learning Plan Generated
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedLesson.content.remedialSummary.detailedLessonsGenerated}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Detailed Lessons</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedLesson.content.remedialSummary.totalPracticeQuestions}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Practice Questions</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {selectedLesson.content.remedialSummary.averageStudyTimeRequired}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Study Time</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {selectedLesson.content.personalizedStudySchedule ? '2' : '0'}
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">Week Schedule</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-purple-700 dark:text-purple-300">
                  {selectedLesson.content.remedialSummary.message}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Detailed Remedial Lessons Section */}
      {selectedLesson.content.detailedRemedialLessons && selectedLesson.content.detailedRemedialLessons.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('detailed-lessons')}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedSections.has('detailed-lessons') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                Detailed Remedial Lessons ({selectedLesson.content.detailedRemedialLessons.length})
              </CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('detailed-lessons') && (
            <CardContent>
              <div className="space-y-6">
                {selectedLesson.content.detailedRemedialLessons.map((lesson, index) => (
                  <div key={lesson.topicId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                    {/* Lesson Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {lesson.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={difficultyColors[lesson.difficulty as keyof typeof difficultyColors]}>
                              {lesson.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-red-600 border-red-200 dark:text-red-400 dark:border-red-800">
                              {lesson.performance}% Performance
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Recommended Time
                        </div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {lesson.timeAllocation?.totalRecommendedTime || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Mistake Analysis */}
                    {lesson.mistakeAnalysis && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <h4 className="font-medium text-red-900 dark:text-red-100">Your Mistakes Analysis</h4>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                          <strong>{lesson.mistakeAnalysis.totalMistakes}</strong> mistakes identified.
                          Focus: {lesson.mistakeAnalysis.improvementFocus}
                        </p>
                        <div className="text-xs text-red-600 dark:text-red-400">
                          Common patterns: {lesson.mistakeAnalysis.commonErrorPatterns.slice(0, 2).map((pattern, i) => (
                            <span key={i} className="block">• {pattern.substring(0, 100)}...</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tabbed Content */}
                    <div className="space-y-4">
                      {/* Concept Review */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                        <button
                          onClick={() => toggleSection(`concept-${lesson.topicId}`)}
                          className="flex items-center gap-2 w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg"
                        >
                          {expandedSections.has(`concept-${lesson.topicId}`) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <Brain className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Core Concepts Review</span>
                        </button>
                        {expandedSections.has(`concept-${lesson.topicId}`) && (
                          <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="space-y-3">
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key Concepts:</h5>
                                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {lesson.conceptReview?.coreConceptsToReview?.map((concept, i) => (
                                    <li key={i}>{concept}</li>
                                  )) || <li>No concepts available</li>}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Fundamental Principles:</h5>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {lesson.conceptReview?.fundamentalPrinciples || 'No principles available'}
                                </p>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key Terms:</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {lesson.conceptReview?.keyTermsAndDefinitions?.map((term, i) => (
                                    <div key={i} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                      <span className="font-medium text-blue-900 dark:text-blue-100">{term.term}:</span>
                                      <span className="text-sm text-blue-700 dark:text-blue-300 ml-1">{term.definition}</span>
                                    </div>
                                  )) || <div className="text-sm text-gray-500">No terms available</div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Learning Path */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                        <button
                          onClick={() => toggleSection(`path-${lesson.topicId}`)}
                          className="flex items-center gap-2 w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg"
                        >
                          {expandedSections.has(`path-${lesson.topicId}`) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <Target className="w-4 h-4 text-green-500" />
                          <span className="font-medium">Step-by-Step Learning Path</span>
                        </button>
                        {expandedSections.has(`path-${lesson.topicId}`) && (
                          <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="space-y-3">
                              {lesson.learningPath && Object.entries(lesson.learningPath).map(([step, details], i) => (
                                <div key={step} className="flex gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-sm">
                                    {i + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 dark:text-gray-100">{details?.title || 'No title'}</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{details?.description || 'No description'}</p>
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-2">
                                      <Clock className="w-3 h-3" />
                                      {details?.timeRequired || 'Time not specified'}
                                    </span>
                                  </div>
                                </div>
                              )) || <div className="text-sm text-gray-500">No learning path available</div>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Practice Exercises */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                        <button
                          onClick={() => toggleSection(`practice-${lesson.topicId}`)}
                          className="flex items-center gap-2 w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg"
                        >
                          {expandedSections.has(`practice-${lesson.topicId}`) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">Practice Exercises</span>
                        </button>
                        {expandedSections.has(`practice-${lesson.topicId}`) && (
                          <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h5 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                                  <Star className="w-4 h-4" />
                                  Basic Level
                                </h5>
                                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {lesson.practiceExercises?.basicLevel?.map((exercise, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-green-500 mt-0.5">•</span>
                                      {exercise}
                                    </li>
                                  )) || <li className="text-gray-500">No basic exercises available</li>}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-1">
                                  <Star className="w-4 h-4" />
                                  Intermediate Level
                                </h5>
                                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {lesson.practiceExercises?.intermediateLevel?.map((exercise, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-yellow-500 mt-0.5">•</span>
                                      {exercise}
                                    </li>
                                  )) || <li className="text-gray-500">No intermediate exercises available</li>}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                                  <Star className="w-4 h-4" />
                                  Advanced Level
                                </h5>
                                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {lesson.practiceExercises?.advancedLevel?.map((exercise, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-red-500 mt-0.5">•</span>
                                      {exercise}
                                    </li>
                                  )) || <li className="text-gray-500">No advanced exercises available</li>}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional Practice Questions */}
                      {lesson.additionalPracticeQuestions && lesson.additionalPracticeQuestions.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                          <button
                            onClick={() => toggleSection(`questions-${lesson.topicId}`)}
                            className="flex items-center gap-2 w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg"
                          >
                            {expandedSections.has(`questions-${lesson.topicId}`) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <HelpCircle className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">Personalized Practice Questions ({lesson.additionalPracticeQuestions.length})</span>
                          </button>
                          {expandedSections.has(`questions-${lesson.topicId}`) && (
                            <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="space-y-4">
                                {lesson.additionalPracticeQuestions.map((question, qIndex) => (
                                  <div key={qIndex} className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                        Question {qIndex + 1}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">{question.difficulty}</Badge>
                                        <Badge variant="secondary" className="text-xs">{question.targetedWeakness}</Badge>
                                      </div>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                      {question.question}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                      {Object.entries(question.options).map(([letter, option]) => (
                                        <div key={letter} className={`p-2 rounded border text-sm ${letter === question.correctAnswer
                                          ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200'
                                          : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                                        }`}>
                                          <span className="font-medium">{letter})</span> {option}
                                          {letter === question.correctAnswer && (
                                            <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                                      <p className="text-sm text-green-800 dark:text-green-200">
                                        <strong>Explanation:</strong> {question.explanation}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Study Resources */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                        <button
                          onClick={() => toggleSection(`resources-${lesson.topicId}`)}
                          className="flex items-center gap-2 w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg"
                        >
                          {expandedSections.has(`resources-${lesson.topicId}`) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <FileText className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">Study Resources</span>
                        </button>
                        {expandedSections.has(`resources-${lesson.topicId}`) && (
                          <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1">
                                  <BookOpen className="w-4 h-4 text-blue-500" />
                                  Recommended Readings
                                </h5>
                                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {lesson.studyResources?.recommendedReadings?.map((reading, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-blue-500 mt-0.5">📖</span>
                                      {reading}
                                    </li>
                                  )) || <li className="text-gray-500">No readings available</li>}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1">
                                  <PlayCircle className="w-4 h-4 text-red-500" />
                                  Video Lessons
                                </h5>
                                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {lesson.studyResources?.videoLessons?.map((video, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-red-500 mt-0.5">🎥</span>
                                      {video}
                                    </li>
                                  )) || <li className="text-gray-500">No videos available</li>}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1">
                                  <Users className="w-4 h-4 text-green-500" />
                                  Online Practice
                                </h5>
                                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {lesson.studyResources?.onlinePractice?.map((practice, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-green-500 mt-0.5">💻</span>
                                      {practice}
                                    </li>
                                  )) || <li className="text-gray-500">No online practice available</li>}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Personalized Study Schedule */}
      {selectedLesson.content.personalizedStudySchedule && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('study-schedule')}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedSections.has('study-schedule') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Personalized Study Schedule ({selectedLesson.content.personalizedStudySchedule.weeklySchedule.totalWeeks} Weeks)
              </CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('study-schedule') && (
            <CardContent>
              <div className="space-y-6">
                {/* Schedule Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedLesson.content.personalizedStudySchedule?.weeklySchedule?.totalWeeks || '0'}
                    </div>
                    <div className="text-sm text-indigo-700 dark:text-indigo-300">Weeks</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedLesson.content.personalizedStudySchedule?.weeklySchedule?.studyDaysPerWeek || '0'}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Days/Week</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {selectedLesson.content.personalizedStudySchedule?.weeklySchedule?.averageDailyTime || 'N/A'}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Daily Time</div>
                  </div>
                </div>

                {/* Weekly Schedules */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Week 1 */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                        1
                      </span>
                      Week 1
                    </h4>
                    <div className="space-y-2">
                      {selectedLesson.content.personalizedStudySchedule?.weeklySchedule?.week1 &&
                        Object.entries(selectedLesson.content.personalizedStudySchedule.weeklySchedule.week1).map(([day, details]) => (
                        <div key={day} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-indigo-500">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{day}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{details?.duration || 'N/A'}</span>
                          </div>
                          <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">{details?.topic || 'No topic'}</div>
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {details?.activities?.map((activity, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                {activity}
                              </li>
                            )) || <li>No activities</li>}
                          </ul>
                        </div>
                      )) || <div className="text-sm text-gray-500">No schedule available for Week 1</div>}
                    </div>
                  </div>

                  {/* Week 2 */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold text-sm">
                        2
                      </span>
                      Week 2
                    </h4>
                    <div className="space-y-2">
                      {selectedLesson.content.personalizedStudySchedule?.weeklySchedule?.week2 &&
                        Object.entries(selectedLesson.content.personalizedStudySchedule.weeklySchedule.week2).map(([day, details]) => (
                        <div key={day} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-purple-500">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{day}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{details?.duration || 'N/A'}</span>
                          </div>
                          <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">{details?.topic || 'No topic'}</div>
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {details?.activities?.map((activity, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                {activity}
                              </li>
                            )) || <li>No activities</li>}
                          </ul>
                        </div>
                      )) || <div className="text-sm text-gray-500">No schedule available for Week 2</div>}
                    </div>
                  </div>
                </div>

                {/* Study Tips */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Study Tips
                  </h4>
                  <ul className="space-y-2">
                    {selectedLesson.content.personalizedStudySchedule?.studyTips?.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                        <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">💡</span>
                        {tip}
                      </li>
                    )) || <li className="text-sm text-gray-500">No study tips available</li>}
                  </ul>
                </div>

                {/* Milestones */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Milestones & Goals
                  </h4>
                  <div className="space-y-2">
                    {selectedLesson.content.personalizedStudySchedule?.milestones?.map((milestone, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-xs">
                          W{milestone?.week || 'N/A'}
                        </div>
                        <span className="text-green-800 dark:text-green-200">{milestone?.goal || 'No goal specified'}</span>
                      </div>
                    )) || <div className="text-sm text-gray-500">No milestones available</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

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
