"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Axios } from "@/config/axios";
import useAuthStore from "@/store/store";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  HelpCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Interfaces
interface ShortQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  maxMarks: number;
  userAnswer?: string;
  userMarks?: number;
  evaluation?: string;
  createdAt: string;
}

interface ShortQuestionExam {
  id: string;
  subjectId: string;
  totalQuestions: number;
  totalMarks: number;
  isCompleted: boolean;
  userScore: number;
  createdAt: string;
  completedAt?: string;
}

interface ShortQuestionsProps {
  topicId?: string;
  topic?: any;
  subjectId: string;
  subjectName: string;
}

export function ShortQuestions({ topicId, topic, subjectId, subjectName }: ShortQuestionsProps) {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [exams, setExams] = useState<ShortQuestionExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<ShortQuestionExam | null>(null);
  const [questions, setQuestions] = useState<ShortQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'idle' | 'gathering' | 'analyzing' | 'generating'>('idle');
  const [searchTerm, setSearchTerm] = useState("");
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, [subjectId]);

  const fetchExams = async () => {
    if (!isAuthenticated || !accessToken || !subjectId) return;

    setIsLoading(true);
    try {
      const response = await Axios.get(`/api/short-questions/exams/${subjectId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        setExams(response.data.data.exams || []);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error("Failed to load exams");
    } finally {
      setIsLoading(false);
    }
  };

  const createNewExam = async () => {
    if (!isAuthenticated || !accessToken || !subjectId) {
      toast.error("Please log in to create an exam");
      return;
    }

    setIsCreating(true);
    setLoadingStage('gathering');
    try {
      // Simulate different stages with delays
      setTimeout(() => setLoadingStage('analyzing'), 1000);
      setTimeout(() => setLoadingStage('generating'), 3000);

      const response = await Axios.post('/api/short-questions/create', {
        subjectId,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        toast.success("New exam created successfully!");
        await fetchExams(); // Refresh exam list
      }
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast.error("Failed to create exam");
    } finally {
      setLoadingStage('idle');
      setIsCreating(false);
    }
  };

  const fetchExamQuestions = async (examId: string) => {
    if (!isAuthenticated || !accessToken) return;

    setIsLoading(true);
    try {
      const response = await Axios.get(`/api/short-questions/exam/${examId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        const examData = response.data.data;
        setSelectedExam(examData.exam);
        setQuestions(examData.questions || []);

        // Initialize user answers from existing data
        const answers: {[key: string]: string} = {};
        examData.questions.forEach((q: ShortQuestion) => {
          if (q.userAnswer) {
            answers[q.id] = q.userAnswer;
          }
        });
        setUserAnswers(answers);
      }
    } catch (error) {
      console.error("Error fetching exam questions:", error);
      toast.error("Failed to load exam questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitExam = async () => {
    if (!selectedExam || !accessToken) return;

    // Check if all questions have answers
    const unansweredQuestions = questions.filter(q =>
      !userAnswers[q.id] || userAnswers[q.id].trim() === ''
    );

    if (unansweredQuestions.length > 0) {
      toast.error(`Please answer all questions. ${unansweredQuestions.length} questions remaining.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const answersArray = questions.map(q => ({
        questionId: q.id,
        userAnswer: userAnswers[q.id] || ''
      }));

      const response = await Axios.post(`/api/short-questions/exam/${selectedExam.id}/submit`, {
        answers: answersArray
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        const result = response.data.data;

        // Enhanced success message with evaluation method
        const evaluationMethod = result.evaluationMethod === 'AI-powered' ? '🤖 AI Evaluated' : '📝 Basic Evaluation';
        toast.success(`Exam submitted! Score: ${result.totalScore}/${result.totalMarks} (${result.percentage}%) ${evaluationMethod}`);

        // Show overall feedback if available
        if (result.overallFeedback && result.evaluationMethod === 'AI-powered') {
          setTimeout(() => {
            toast.info(`AI Feedback: ${result.overallFeedback}`);
          }, 1500);
        }

        // Refresh exam to show results
        await fetchExamQuestions(selectedExam.id);
        await fetchExams(); // Update exam list
      }
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      toast.error("Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExam = async (examId: string) => {
    if (!accessToken) {
      toast.error("Please log in to delete an exam");
      return;
    }

    // Confirm deletion
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return;
    }

    setDeletingExamId(examId);
    try {
      const response = await Axios.delete(`/api/short-questions/exam/${examId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        const result = response.data.data;
        toast.success(
          `Exam deleted successfully! Removed ${result.deletedQuestionsCount} questions.`
        );

        // If we're currently viewing this exam, go back to exam list
        if (selectedExam && selectedExam.id === examId) {
          setSelectedExam(null);
          setQuestions([]);
          setUserAnswers({});
        }

        // Refresh exam list
        await fetchExams();
      }
    } catch (error: any) {
      console.error('Error deleting exam:', error);
      const errorMessage = error.response?.data?.message || "Failed to delete exam";
      toast.error(errorMessage);
    } finally {
      setDeletingExamId(null);
    }
  };

  const filteredQuestions = questions.filter(q =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please log in to access short questions.
          </p>
        </div>
      </div>
    );
  }

  // Show individual exam view
  if (selectedExam && questions.length > 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                setSelectedExam(null);
                setQuestions([]);
                setUserAnswers({});
              }}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Short Question Exam
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {subjectName} - {selectedExam.totalQuestions} Questions, {selectedExam.totalMarks} Marks
              </p>
            </div>
          </div>
          {selectedExam.isCompleted && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              Completed: {selectedExam.userScore}/{selectedExam.totalMarks}
            </Badge>
          )}
        </div>

        {/* Progress */}
        {!selectedExam.isCompleted && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(userAnswers).filter(k => userAnswers[k]?.trim()).length}
                </div>
                <div className="text-sm text-gray-500">Answered</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {questions.length - Object.keys(userAnswers).filter(k => userAnswers[k]?.trim()).length}
                </div>
                <div className="text-sm text-gray-500">Remaining</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((Object.keys(userAnswers).filter(k => userAnswers[k]?.trim()).length / questions.length) * 100)}%
                </div>
                <div className="text-sm text-gray-500">Progress</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {!selectedExam.isCompleted && (
            <Button
              onClick={submitExam}
              disabled={isSubmitting || Object.keys(userAnswers).filter(k => userAnswers[k]?.trim()).length === 0}
              className="ml-4"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Exam
                </>
              )}
            </Button>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {filteredQuestions.map((question, index) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Question {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {question.maxMarks} marks
                    </Badge>
                    {selectedExam.isCompleted && (
                      <Badge className={question.userMarks === question.maxMarks ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                        {question.userMarks}/{question.maxMarks}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-900 dark:text-gray-100">
                    {question.question}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Answer:
                  </label>
                  <Textarea
                    placeholder="Type your answer here..."
                    value={userAnswers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    disabled={selectedExam.isCompleted}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Show correct answer and evaluation after exam completion */}
                {selectedExam.isCompleted && question.correctAnswer && (
                  <div className="space-y-2">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <label className="text-sm font-medium text-green-800 dark:text-green-400 block mb-2">
                        Expected Answer:
                      </label>
                      <p className="text-green-700 dark:text-green-300">
                        {question.correctAnswer}
                      </p>
                    </div>
                    {question.evaluation && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <label className="text-sm font-medium text-blue-800 dark:text-blue-400 block mb-2">
                          Feedback:
                        </label>
                        <p className="text-blue-700 dark:text-blue-300">
                          {question.evaluation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show exam list view
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Short Question Exams
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Practice exams for {subjectName}
          </p>
        </div>

        <Button
          onClick={createNewExam}
          disabled={isCreating}
          className="flex items-center gap-2"
        >
          {isCreating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Create New Exam
        </Button>
      </div>

      {/* Loading State for Creating Exam */}
      {isCreating && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
              {loadingStage === 'gathering' && "AI Agent is gathering all content from your subjects..."}
              {loadingStage === 'analyzing' && "AI Agent is analyzing topics and difficulty levels..."}
              {loadingStage === 'generating' && "AI Agent is generating high-quality questions..."}
            </p>
            <p className="text-sm text-gray-500">
              This may take a few moments to ensure quality questions
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {exams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {exams.length}
              </div>
              <div className="text-sm text-gray-500">Total Exams</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {exams.filter(e => e.isCompleted).length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {exams.filter(e => !e.isCompleted).length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {exams.filter(e => e.isCompleted).length > 0
                  ? Math.round(exams.filter(e => e.isCompleted).reduce((avg, e) => avg + (e.userScore / e.totalMarks * 100), 0) / exams.filter(e => e.isCompleted).length)
                  : 0}%
              </div>
              <div className="text-sm text-gray-500">Average Score</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exams List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Exams Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first short question exam to start practicing
            </p>
            <Button onClick={createNewExam} disabled={isCreating}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Exam
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-all duration-200 relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Exam #{exam.id.slice(-4)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {exam.isCompleted ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteExam(exam.id);
                        }}
                        disabled={deletingExamId === exam.id}
                        title="Delete exam"
                      >
                        {deletingExamId === exam.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent
                  className="space-y-4 cursor-pointer"
                  onClick={() => fetchExamQuestions(exam.id)}
                >
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{exam.totalQuestions} Questions</span>
                    <span>{exam.totalMarks} Marks</span>
                  </div>

                  {exam.isCompleted && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your Score:</span>
                        <span className="font-medium">
                          {exam.userScore}/{exam.totalMarks} ({Math.round((exam.userScore / exam.totalMarks) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(exam.userScore / exam.totalMarks) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Created {new Date(exam.createdAt).toLocaleDateString()}
                    {exam.completedAt && (
                      <span className="block">
                        Completed {new Date(exam.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <Button className="w-full" size="sm">
                    {exam.isCompleted ? "Review Exam" : "Take Exam"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
