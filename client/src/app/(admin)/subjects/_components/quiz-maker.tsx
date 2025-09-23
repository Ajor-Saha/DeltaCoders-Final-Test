"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Axios } from "@/config/axios";
import useAuthStore from "@/store/store";
import {
  Brain,
  CheckCircle2,
  Circle,
  Clock,
  List,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Trophy,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
}

interface QuizData {
  quiz: {
    id: string;
    subject: {
      name: string;
    };
    topic?: {
      title: string;
      difficulty: string;
    };
  };
  questions: QuizQuestion[];
  quiz_metadata: {
    total_questions: number;
    has_weakness_focus: boolean;
    weakness?: string;
  };
}

interface QuizMakerProps {
  quizData?: QuizData;
  isLoading?: boolean;
  onStartQuiz?: () => void;
  onRetakeQuiz?: () => void;
  topicId?: string;
  topic?: {
    topicId: string;
    title: string;
    difficulty: string;
  };
  onGenerateQuiz?: (topic: any, includeWeakness?: boolean, weakness?: string) => Promise<any>;
  onLoadQuiz?: (quizId: string) => Promise<any>;
}

interface QuizState {
  currentQuestion: number;
  selectedAnswers: { [key: number]: string };
  showResults: boolean;
  score: number;
  timeLeft: number;
  quizStarted: boolean;
  isSubmitting: boolean;
  feedback?: string;
  weaknesses?: Array<{
    question: string;
    yourAnswer: string;
    correctAnswer: string;
  }>;
  // New states for quiz management
  showQuizList: boolean;
  existingQuizzes: any[];
  isLoadingQuizzes: boolean;
  lastWeakness?: string;
}

const difficultyColors = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

export function QuizMaker({
  quizData,
  isLoading = false,
  onStartQuiz,
  onRetakeQuiz,
  topicId,
  topic,
  onGenerateQuiz,
  onLoadQuiz
}: QuizMakerProps) {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    selectedAnswers: {},
    showResults: false,
    score: 0,
    timeLeft: 0,
    quizStarted: false,
    isSubmitting: false,
    showQuizList: true, // Start by showing quiz options
    existingQuizzes: [],
    isLoadingQuizzes: false,
  });

  // Auto-start quiz when data is available and user hasn't chosen to show quiz list
  useEffect(() => {
    if (quizData?.questions?.length && !quizState.quizStarted && !isLoading && !quizState.showQuizList) {
      startQuiz();
    }
  }, [quizData, isLoading, quizState.showQuizList]);

  // Load existing quizzes when component mounts
  useEffect(() => {
    if (topicId && isAuthenticated) {
      fetchExistingQuizzes();
    }
  }, [topicId, isAuthenticated]);

  // Fetch existing quizzes for the topic
  const fetchExistingQuizzes = async () => {
    if (!topicId || !accessToken) return;

    setQuizState(prev => ({ ...prev, isLoadingQuizzes: true }));
    try {
      const response = await Axios.get(`/api/topic/quizzes/${topicId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        setQuizState(prev => ({
          ...prev,
          existingQuizzes: response.data.data || [],
          isLoadingQuizzes: false,
        }));
      }
    } catch (error: any) {
      console.error('Error fetching existing quizzes:', error);
      setQuizState(prev => ({
        ...prev,
        existingQuizzes: [],
        isLoadingQuizzes: false,
      }));
    }
  };

  // Generate new quiz
  const generateNewQuiz = async (includeWeakness = false) => {
    if (!topic || !onGenerateQuiz) return;

    setQuizState(prev => ({ ...prev, showQuizList: false }));

    const weaknessData = includeWeakness ? quizState.lastWeakness : undefined;
    await onGenerateQuiz(topic, includeWeakness, weaknessData);
  };

  // Load existing quiz
  const loadExistingQuiz = async (quizId: string) => {
    if (!onLoadQuiz) return;

    setQuizState(prev => ({ ...prev, showQuizList: false }));
    await onLoadQuiz(quizId);
  };

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizState.quizStarted && !quizState.showResults && quizState.timeLeft > 0) {
      timer = setTimeout(() => {
        setQuizState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (quizState.timeLeft === 0 && quizState.quizStarted && !quizState.showResults) {
      handleSubmitQuiz();
    }
    return () => clearTimeout(timer);
  }, [quizState.timeLeft, quizState.quizStarted, quizState.showResults]);

  const startQuiz = () => {
    if (!quizData?.questions?.length) return;

    const timeLimit = quizData.questions.length * 60; // 1 minute per question
    setQuizState(prev => ({
      ...prev,
      quizStarted: true,
      timeLeft: timeLimit,
      currentQuestion: 0,
      selectedAnswers: {},
      showResults: false,
      score: 0,
    }));

    if (onStartQuiz) onStartQuiz();
    toast.success("Quiz started! Good luck! 🍀");
  };

  const selectAnswer = (questionIndex: number, answer: string) => {
    setQuizState(prev => ({
      ...prev,
      selectedAnswers: {
        ...prev.selectedAnswers,
        [questionIndex]: answer,
      },
    }));
  };

  const nextQuestion = () => {
    if (!quizData?.questions) return;

    if (quizState.currentQuestion < quizData.questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
      }));
    } else {
      handleSubmitQuiz();
    }
  };

  const previousQuestion = () => {
    if (quizState.currentQuestion > 0) {
      setQuizState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1,
      }));
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizData?.questions || !accessToken) return;

    setQuizState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Format answers for submission
      const answers: Record<string, string> = {};
      quizData.questions.forEach((question, index) => {
        if (quizState.selectedAnswers[index]) {
          answers[question.id] = quizState.selectedAnswers[index];
        }
      });

      // Submit quiz using Axios
      const response = await Axios.post('/api/topic/submit-quiz', {
        quizId: quizData.quiz.id,
        answers,
        timeTaken: quizData.questions.length * 60 - quizState.timeLeft, // Calculate time taken
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        const { score, feedback, weaknesses } = response.data.data;

        // Store weakness summary for future quiz generation
        const weaknessSummary = weaknesses?.map((w: any) => w.question).join(', ') || '';

        setQuizState(prev => ({
          ...prev,
          showResults: true,
          score,
          feedback,
          weaknesses,
          lastWeakness: weaknessSummary,
          isSubmitting: false,
        }));

        // Show result toast
        if (score >= 80) {
          toast.success(`Excellent! You scored ${score}%! 🎉`);
        } else if (score >= 60) {
          toast.success(`Good job! You scored ${score}%! 👏`);
        } else {
          toast.info(`You scored ${score}%. Keep practicing! 💪`);
        }
      } else {
        throw new Error(response.data.message || 'Failed to submit quiz');
      }
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit quiz';
      toast.error('Failed to submit quiz: ' + errorMessage);
      setQuizState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const retakeQuiz = () => {
    setQuizState({
      currentQuestion: 0,
      selectedAnswers: {},
      showResults: false,
      score: 0,
      timeLeft: 0,
      quizStarted: false,
      isSubmitting: false,
      showQuizList: true,
      existingQuizzes: quizState.existingQuizzes,
      isLoadingQuizzes: false,
      lastWeakness: quizState.lastWeakness,
    });
    if (onRetakeQuiz) onRetakeQuiz();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Loading state (only when actively generating or loading)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Generating Quiz Questions...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            AI is creating personalized questions for you
          </p>
        </div>
      </div>
    );
  }

  // Quiz selection interface (default state when no quiz is loaded)
  if (!quizData?.questions?.length || quizState.showQuizList) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Quiz Options for {topic?.title}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Choose to continue with existing quizzes or generate a new one
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generate New Quiz Options */}
            <div className="space-y-3">
              <Button
                onClick={() => generateNewQuiz(false)}
                className="w-full flex items-center justify-center gap-2 h-12"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                Generate New Quiz
              </Button>

              {quizState.lastWeakness && (
                <Button
                  onClick={() => generateNewQuiz(true)}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 h-12 border-yellow-200 hover:bg-yellow-50 text-yellow-700 hover:text-yellow-800"
                  size="lg"
                >
                  <RefreshCw className="w-5 h-5" />
                  Generate Quiz Based on Previous Weaknesses
                </Button>
              )}
            </div>

            {/* Existing Quizzes */}
            {quizState.isLoadingQuizzes ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading existing quizzes...</p>
              </div>
            ) : quizState.existingQuizzes.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pt-4 border-t">
                  <List className="w-4 h-4" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Previous Quizzes</h3>
                </div>
                {quizState.existingQuizzes.map((quiz, index) => (
                  <Card key={quiz.quizId} className="border-gray-200 hover:border-blue-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            Quiz #{index + 1}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {quiz.questionCount || 0} questions • Created {new Date(quiz.createdAt).toLocaleDateString()}
                          </p>
                          {quiz.attemptCount > 0 && (
                            <p className="text-xs text-blue-600">
                              Attempted {quiz.attemptCount} time(s)
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => loadExistingQuiz(quiz.quizId)}
                          variant="outline"
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Take Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-t">
                <Brain className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500 text-sm">No previous quizzes found for this topic</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz results view
  if (quizState.showResults) {
    const correctAnswers = quizData.questions.filter(
      (question, index) => quizState.selectedAnswers[index] === question.correctAnswer
    ).length;

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Here are your results for {quizData.quiz.topic?.title || quizData.quiz.subject.name}
            </p>
          </CardHeader>
          {quizState.feedback && (
            <CardContent className="border-t border-gray-200 dark:border-gray-800 mt-4 pt-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-lg font-semibold mb-2">Feedback & Analysis</h3>
                <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {quizState.feedback}
                </div>
              </div>
            </CardContent>
          )}
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(quizState.score)} mb-2`}>
                {quizState.score}%
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {correctAnswers} out of {quizData.questions.length} correct
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Progress</span>
                <span>{correctAnswers}/{quizData.questions.length}</span>
              </div>
              <Progress value={(correctAnswers / quizData.questions.length) * 100} className="h-3" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={retakeQuiz} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Retake Quiz
              </Button>

              {quizState.weaknesses && quizState.weaknesses.length > 0 && (
                <Button
                  onClick={() => {
                    setQuizState(prev => ({ ...prev, showResults: false, showQuizList: false,
                    currentQuestion: 0,
                    quizStarted: false,
                     }));
                    generateNewQuiz(true);
                  }}
                  variant="default"
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700"
                >
                  <Brain className="w-4 h-4" />
                  Generate Quiz for Weaknesses
                </Button>
              )}

              <Button
                onClick={() => setQuizState(prev => ({ ...prev, showQuizList: true, showResults: false }))}
                variant="outline"
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                All Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weakness Analysis */}
        {quizState.weaknesses && quizState.weaknesses.length > 0 && (
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <Brain className="w-5 h-5" />
                Areas for Improvement
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review these questions to strengthen your knowledge
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {quizState.weaknesses.map((weakness, index) => (
                <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {weakness.question}
                  </p>
                  <div className="text-sm space-y-1">
                    <p className="text-red-600 dark:text-red-400">
                      <span className="font-medium">Your Answer:</span> {weakness.yourAnswer}
                    </p>
                    <p className="text-green-600 dark:text-green-400">
                      <span className="font-medium">Correct Answer:</span> {weakness.correctAnswer}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
            {quizState.weaknesses && quizState.weaknesses.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Focus on the questions you missed to improve your understanding
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {quizData.questions.map((question, index) => {
              const userAnswer = quizState.selectedAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 mt-1">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {index + 1}. {question.question}
                      </h4>
                      <div className="space-y-2 text-sm">
                        {userAnswer && (
                          <p className={isCorrect ? "text-green-600" : "text-red-600"}>
                            Your answer: {userAnswer}
                          </p>
                        )}
                        {!isCorrect && (
                          <p className="text-green-600">
                            Correct answer: {question.correctAnswer}
                          </p>
                        )}
                        {!userAnswer && (
                          <p className="text-gray-500">No answer selected</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz start screen
  if (!quizState.quizStarted) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">
              Quiz: {quizData.quiz.topic?.title || quizData.quiz.subject.name}
            </CardTitle>
            {quizData.quiz.topic && (
              <Badge className={difficultyColors[quizData.quiz.topic.difficulty?.toLowerCase() as keyof typeof difficultyColors] || difficultyColors.medium}>
                {quizData.quiz.topic.difficulty}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {quizData.quiz_metadata.total_questions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Questions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {quizData.quiz_metadata.total_questions}min
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Time Limit</div>
              </div>
            </div>

            {quizData.quiz_metadata.has_weakness_focus && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                  🎯 This quiz focuses on your weakness areas: {quizData.quiz_metadata.weakness}
                </p>
              </div>
            )}

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Quiz Instructions:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>You have 1 minute per question</li>
                <li>Select one answer for each question</li>
                <li>You can navigate between questions</li>
                <li>Submit when ready or time runs out</li>
              </ul>
            </div>

            <Button onClick={startQuiz} size="lg" className="w-full flex items-center gap-2">
              <Play className="w-5 h-5" />
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz in progress
  const currentQ = quizData.questions[quizState.currentQuestion];
  const progress = ((quizState.currentQuestion + 1) / quizData.questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Question {quizState.currentQuestion + 1} of {quizData.questions.length}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {quizData.quiz.topic?.title || quizData.quiz.subject.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">{formatTime(quizState.timeLeft)}</span>
              </div>
              <Badge className={difficultyColors[currentQ.difficulty?.toLowerCase() as keyof typeof difficultyColors] || difficultyColors.medium}>
                {currentQ.difficulty}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-4" />
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
            {currentQ.question}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((option, optionIndex) => {
              const isSelected = quizState.selectedAnswers[quizState.currentQuestion] === option;

              return (
                <button
                  key={optionIndex}
                  onClick={() => selectAnswer(quizState.currentQuestion, option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <span className={`${isSelected ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-300"}`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={previousQuestion}
              variant="outline"
              disabled={quizState.currentQuestion === 0}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Object.keys(quizState.selectedAnswers).length} of {quizData.questions.length} answered
            </span>

            {quizState.currentQuestion === quizData.questions.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={quizState.isSubmitting}
                className="flex items-center gap-2"
              >
                {quizState.isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Quiz"
                )}
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
