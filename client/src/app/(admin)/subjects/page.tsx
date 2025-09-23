"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Axios } from "@/config/axios";
import useAuthStore from "@/store/store";
import { BookOpen, Calendar, Plus, TrendingUp, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SubjectForm } from "./_components/subject-form";

interface UserSubject {
  id: string;
  userId: string;
  subjectId: string;
  level: "beginner" | "intermediate" | "advanced";
  createdAt: string;
  updatedAt: string;
  subject: {
    subjectId: string;
    subjectName: string;
  };
}

const levelColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const levelIcons = {
  beginner: "🌱",
  intermediate: "📈",
  advanced: "🚀",
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const router = useRouter();

  const handleSubjectClick = (subjectName: string) => {
    const encodedName = subjectName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/subjects/${encodedName}`);
  };

  const fetchUserSubjects = async () => {
    if (!isAuthenticated || !accessToken) return;

    try {
      setIsLoading(true);
      const response = await Axios.get("/api/subject/user-subject", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        setSubjects(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSubjects();
  }, [isAuthenticated, accessToken]);

  const handleSubjectAdded = () => {
    setShowAddForm(false);
    fetchUserSubjects(); // Refresh the list
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please log in to view your subjects.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  My Learning Subjects
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track your learning journey across different subjects and skill levels
                </p>
              </div>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Subject
              </Button>
            </div>
          </div>

          {/* Add Subject Form */}
          {showAddForm && (
            <div className="mb-8">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add New Subject
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SubjectForm onSuccess={handleSubjectAdded} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading subjects...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && subjects.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                No subjects yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Start your learning journey by adding your first subject. Track your progress and skill levels across different topics.
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Subject
              </Button>
            </div>
          )}

          {/* Subjects Grid */}
          {!isLoading && subjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((userSubject) => (
                <Card
                  key={userSubject.id}
                  className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleSubjectClick(userSubject.subject.subjectName)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {userSubject.subject.subjectName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {userSubject.subject.subjectName}
                          </CardTitle>
                        </div>
                      </div>
                      <span className="text-2xl">{levelIcons[userSubject.level]}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Level Badge */}
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <Badge className={`${levelColors[userSubject.level]} border-0 font-medium`}>
                        {userSubject.level.charAt(0).toUpperCase() + userSubject.level.slice(1)}
                      </Badge>
                    </div>

                    {/* Date Information */}
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Added: {formatDate(userSubject.createdAt)}</span>
                      </div>
                      {userSubject.updatedAt !== userSubject.createdAt && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Updated: {formatDate(userSubject.updatedAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Indicator */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Learning Progress
                        </span>
                        <span className="text-xs text-gray-500">
                          {userSubject.level === 'beginner' ? '33%' :
                           userSubject.level === 'intermediate' ? '66%' : '100%'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            userSubject.level === 'beginner' ? 'bg-green-500 w-1/3' :
                            userSubject.level === 'intermediate' ? 'bg-yellow-500 w-2/3' :
                            'bg-red-500 w-full'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats Summary */}
          {!isLoading && subjects.length > 0 && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {subjects.filter(s => s.level === 'beginner').length}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Beginner Level
                </div>
              </Card>

              <Card className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {subjects.filter(s => s.level === 'intermediate').length}
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                  Intermediate Level
                </div>
              </Card>

              <Card className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {subjects.filter(s => s.level === 'advanced').length}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Advanced Level
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
