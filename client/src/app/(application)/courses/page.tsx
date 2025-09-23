"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Axios } from "@/config/axios";
import {
    Award,
    BookOpen,
    Clock,
    HelpCircle,
    PlayCircle,
    Star,
    TrendingUp,
    Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Course {
  subjectId: string;
  subjectName: string;
  createdAt: string;
  updatedAt: string;
  topics: Array<{
    topicId: string;
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
  }>;
}

const difficultyLabels = {
  Easy: "Beginner Friendly",
  Medium: "For quick revision",
  Hard: "Advanced Level"
};

const badges = ["Popular", "New", "AI-Powered", "Trending", "Essential"];

const getRandomBadge = () => badges[Math.floor(Math.random() * badges.length)];

const getRandomTimeEstimate = () => {
  const times = ["10 min/day", "15 min/day", "20 min/day", "25 min/day"];
  return times[Math.floor(Math.random() * times.length)];
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const response = await Axios.get("/api/subject/all");

        if (response.data.success) {
          // Get subjects and their topics
          const subjects = response.data.data.subjects || [];

          // For each subject, fetch its topics
          const coursesWithTopics = await Promise.all(
            subjects.map(async (subject: any) => {
              try {
                const topicsResponse = await Axios.get(`/api/subject/${subject.subjectId}`);
                return {
                  ...subject,
                  topics: topicsResponse.data.success ? topicsResponse.data.data.topics || [] : []
                };
              } catch (error) {
                return { ...subject, topics: [] };
              }
            })
          );

          setCourses(coursesWithTopics);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = (subjectName: string) => {
    const encodedName = subjectName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/sign-in?redirect=/dashboard/subjects/${encodedName}`);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Explore Our Courses
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover comprehensive learning paths designed to help you master new skills and advance your career
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-80">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const lessonCount = course.topics.length;
              const quizCount = Math.floor(lessonCount * 0.8); // Approximate quiz count
              const difficulty = course.topics.length > 0 ? course.topics[0].difficulty : "Easy";
              const timeEstimate = getRandomTimeEstimate();
              const badge = getRandomBadge();

              return (
                <Card
                  key={course.subjectId}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:scale-[1.02]"
                  onClick={() => handleCourseClick(course.subjectName)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                          {course.subjectName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {course.subjectName}
                          </CardTitle>
                        </div>
                      </div>
                      <Badge className={`${
                        badge === 'Popular' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                        badge === 'New' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        badge === 'AI-Powered' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                        badge === 'Trending' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      } border-0 text-xs font-medium`}>
                        {badge === 'AI-Powered' ? (
                          <><Zap className="w-3 h-3 mr-1" />{badge}</>
                        ) : badge === 'Popular' ? (
                          <><Star className="w-3 h-3 mr-1" />{badge}</>
                        ) : badge === 'Trending' ? (
                          <><TrendingUp className="w-3 h-3 mr-1" />{badge}</>
                        ) : badge === 'Essential' ? (
                          <><Award className="w-3 h-3 mr-1" />{badge}</>
                        ) : (
                          badge
                        )}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Lesson Count Preview */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <PlayCircle className="w-4 h-4" />
                        <span>{lessonCount} Lessons</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <HelpCircle className="w-4 h-4" />
                        <span>{quizCount} Quizzes</span>
                      </div>
                    </div>

                    {/* Difficulty Tag */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${
                        difficulty === 'Easy' ? 'border-green-300 text-green-700 dark:border-green-600 dark:text-green-400' :
                        difficulty === 'Medium' ? 'border-yellow-300 text-yellow-700 dark:border-yellow-600 dark:text-yellow-400' :
                        'border-red-300 text-red-700 dark:border-red-600 dark:text-red-400'
                      } text-xs`}>
                        {difficultyLabels[difficulty]}
                      </Badge>
                    </div>

                    {/* Time Estimate */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{timeEstimate} • Self-paced</span>
                    </div>

                    {/* What You'll Get */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        What You'll Get:
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Interactive Quizzes</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Video Lessons</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span>Learning Resources</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCourseClick(course.subjectName);
                        }}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Start Learning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && courses.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              No courses available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Courses will appear here once they are created. Check back later for new learning opportunities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
