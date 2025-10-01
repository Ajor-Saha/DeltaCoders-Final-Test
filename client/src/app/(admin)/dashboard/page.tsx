"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Axios } from "@/config/axios";
import useAuthStore from "@/store/store";
import {
  Activity,
  BookOpen,
  Brain,
  Calendar,
  Clock,
  Gamepad2,
  Target,
  TrendingUp,
  Trophy
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

interface QuizResult {
  resultId: string;
  quizId: string;
  score: number; // percent 0-100
  totalMarks: number; // total questions
  timeTaken: number; // seconds
  completedAt: string;
  subject: {
    name: string;
  };
  topic: {
    title: string;
  };
}

interface GameResult {
  gameId: string;
  gameName: string;
  score: number;
  level: number;
  completedAt: string;
  duration: number; // seconds
}

interface CognitiveScore {
  assessmentId: string;
  weightedScore: number; // percent
  stressScore: number; // 0-100
  attentionScore: number; // 0-100
  cognitiveScore: number; // 0-100 (display as Personal Trait)
  createdAt: string;
}

interface Course {
  courseId: string;
  courseName: string;
  progress: number; // percent
  enrolledAt: string;
  totalLessons: number;
  completedLessons: number;
  level: string; // beginner, intermediate, advanced
}

export default function DashboardClient() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    recentQuizzes: [] as QuizResult[],
    gameResults: [] as GameResult[],
    cognitiveScores: [] as CognitiveScore[],
    courses: [] as Course[],
    stats: {
      totalQuizzes: 0,
      avgQuizScore: 0,
      totalGamesPlayed: 0,
      avgCognitiveScore: 0,
      coursesEnrolled: 0,
    }
  });

  useEffect(() => {
    if (accessToken) {
      fetchDashboardData();
    }
  }, [accessToken]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch real dashboard statistics, recent quizzes, and subjects with progress in parallel
      const [statsResponse, recentQuizzesResponse, subjectsProgressResponse] = await Promise.all([
        Axios.get('/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        Axios.get('/api/dashboard/recent-quizzes', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        Axios.get('/api/dashboard/subjects-progress', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ]);

      const statsData = statsResponse.data.success ? statsResponse.data.data : {
        totalQuizzes: 0,
        avgQuizScore: 0,
        totalGamesPlayed: 0,
        avgCognitiveScore: 0,
        coursesEnrolled: 0,
      };

      const recentQuizzesData = recentQuizzesResponse.data.success
        ? recentQuizzesResponse.data.data
        : [];

      const subjectsProgressData = subjectsProgressResponse.data.success
        ? subjectsProgressResponse.data.data
        : [];

      // Mock data for other sections (to be replaced with real APIs later)
      const mockData = {
        recentQuizzes: recentQuizzesData,
        gameResults: [
          {
            gameId: "g1",
            gameName: "Color Match",
            score: 1250,
            level: 8,
            completedAt: new Date().toISOString(),
            duration: 180
          },
          {
            gameId: "g2",
            gameName: "Memory Challenge",
            score: 950,
            level: 6,
            completedAt: new Date(Date.now() - 43200000).toISOString(),
            duration: 150
          },
          {
            gameId: "g3",
            gameName: "Pattern Recognition",
            score: 1100,
            level: 7,
            completedAt: new Date(Date.now() - 86400000).toISOString(),
            duration: 200
          },
          {
            gameId: "g4",
            gameName: "Speed Math",
            score: 1400,
            level: 9,
            completedAt: new Date(Date.now() - 172800000).toISOString(),
            duration: 210
          },
          {
            gameId: "g5",
            gameName: "Focus Dash",
            score: 1020,
            level: 6,
            completedAt: new Date(Date.now() - 259200000).toISOString(),
            duration: 160
          }
        ],
        cognitiveScores: [
          {
            assessmentId: "c1",
            weightedScore: 87.5,
            stressScore: 25,
            attentionScore: 88,
            cognitiveScore: 85,
            createdAt: new Date().toISOString()
          },
          {
            assessmentId: "c2",
            weightedScore: 82.3,
            stressScore: 35,
            attentionScore: 82,
            cognitiveScore: 80,
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            assessmentId: "c3",
            weightedScore: 84.1,
            stressScore: 28,
            attentionScore: 86,
            cognitiveScore: 83,
            createdAt: new Date(Date.now() - 172800000).toISOString()
          }
        ],
        courses: subjectsProgressData.map((subject: any) => ({
          courseId: subject.subjectId,
          courseName: subject.subjectName,
          progress: subject.progressPercentage,
          enrolledAt: subject.enrolledAt,
          totalLessons: subject.totalTopics,
          completedLessons: subject.completedTopics,
          level: subject.level
        })),
        stats: statsData
      };
      setDashboardData(mockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getCognitiveScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleContinueLearning = (subjectName: string) => {
    const encodedName = subjectName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/subjects/${encodedName}`);
  };

  // Derived chart data
  const quizTrendData = useMemo(() => {
    return dashboardData.recentQuizzes
      .slice()
      .reverse()
      .map((q, idx) => ({
        name: `Q${dashboardData.recentQuizzes.length - idx}`,
        score: q.score,
        correct: Math.round((q.score / 100) * q.totalMarks),
        total: q.totalMarks,
      }));
  }, [dashboardData.recentQuizzes]);

  const gameScoresData = useMemo(() => {
    return dashboardData.gameResults.map(g => ({ name: g.gameName, score: g.score }));
  }, [dashboardData.gameResults]);

  const courseProgressData = useMemo(() => {
    return dashboardData.courses.map(c => ({ name: c.courseName, progress: c.progress }));
  }, [dashboardData.courses]);

  const latestTraits = dashboardData.cognitiveScores[0];
  const traitPieData = latestTraits
    ? [
        { name: "Stress", value: latestTraits.stressScore, color: "#ef4444" },
        { name: "Attention", value: latestTraits.attentionScore, color: "#10b981" },
        { name: "Personal Trait", value: latestTraits.cognitiveScore, color: "#6366f1" },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="space-y-6">
            {/* Welcome Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-80" />
                <Skeleton className="h-5 w-64" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>

            {/* Stats Overview Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-6">
              <div className="flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <div className="grid w-full grid-cols-4 gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              </div>

              {/* Main Content Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Quiz Results Skeleton */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-8 w-12" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Chart Skeleton */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </CardHeader>
                  <CardContent className="h-64">
                    <Skeleton className="h-full w-full" />
                  </CardContent>
                </Card>
              </div>

              {/* Second Row Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  </CardHeader>
                  <CardContent className="h-64">
                    <Skeleton className="h-full w-full" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-6 w-44" />
                    </div>
                  </CardHeader>
                  <CardContent className="h-64">
                    <Skeleton className="h-full w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.firstName || 'Student'}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's your learning progress and achievements
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Quizzes</p>
                    <p className="text-2xl font-bold">{dashboardData.stats.totalQuizzes}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Avg Quiz Score</p>
                    <p className="text-2xl font-bold">{dashboardData.stats.avgQuizScore}%</p>
                  </div>
                  <Target className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Games Played</p>
                    <p className="text-2xl font-bold">{dashboardData.stats.totalGamesPlayed}</p>
                  </div>
                  <Gamepad2 className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Personal Trait</p>
                    <p className="text-2xl font-bold">{dashboardData.stats.avgCognitiveScore}</p>
                  </div>
                  <Brain className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-100 text-sm">Courses</p>
                    <p className="text-2xl font-bold">{dashboardData.stats.coursesEnrolled}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-pink-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="traits">Personal Traits</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Quiz Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                      Recent Quiz Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dashboardData.recentQuizzes.length > 0 ? (
                      dashboardData.recentQuizzes.map((quiz) => (
                        <div key={quiz.resultId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {quiz.subject.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {quiz.topic.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {Math.floor(quiz.timeTaken / 60)}m {quiz.timeTaken % 60}s
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(quiz.score)}`}>
                              {quiz.score}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((quiz.score / 100) * quiz.totalMarks)}/{quiz.totalMarks}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No Quiz Results Yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Start taking quizzes to see your recent results here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quiz Score Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Quiz Score Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={quizTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="score" stroke="#10b981" name="Score %" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weighted vs Correct */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Correct Answers by Quiz
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quizTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="correct" fill="#6366f1" name="Correct" />
                        <Bar dataKey="total" fill="#94a3b8" name="Total" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Course Progress Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Course Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={courseProgressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" hide />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="progress" fill="#22c55e" name="Progress %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="traits" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Traits over time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-orange-600" />
                      Personal Traits Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData.cognitiveScores.slice().reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={(d) => new Date((d as any).createdAt).toLocaleDateString()} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="attentionScore" stroke="#22c55e" name="Attention" strokeWidth={2} />
                        <Line type="monotone" dataKey="cognitiveScore" stroke="#6366f1" name="Personal Trait" strokeWidth={2} />
                        <Line type="monotone" dataKey="weightedScore" stroke="#f59e0b" name="Weighted Score" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Traits Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-pink-600" />
                      Latest Traits Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip />
                        <Legend />
                        <Pie data={traitPieData} dataKey="value" nameKey="name" outerRadius={80} label>
                          {traitPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="games" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-purple-600" />
                    Game Statistics & Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{dashboardData.gameResults.length}</div>
                      <div className="text-sm text-purple-600">Games Played</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{Math.max(...dashboardData.gameResults.map(g => g.score))}</div>
                      <div className="text-sm text-green-600">Best Score</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{Math.max(...dashboardData.gameResults.map(g => g.level))}</div>
                      <div className="text-sm text-blue-600">Highest Level</div>
                    </div>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gameScoresData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="score" fill="#a78bfa" name="Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Enrolled Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {dashboardData.courses.map((course) => (
                      <div key={course.courseId} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{course.courseName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Enrolled {new Date(course.enrolledAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={course.progress > 50 ? "default" : "secondary"}>
                            {course.progress}%
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <Progress value={course.progress} className="h-2" />

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {course.completedLessons} of {course.totalLessons} lessons
                            </span>
                            <span className="font-medium">
                              {course.totalLessons - course.completedLessons} remaining
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleContinueLearning(course.courseName)}
                          >
                            Continue Learning
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
