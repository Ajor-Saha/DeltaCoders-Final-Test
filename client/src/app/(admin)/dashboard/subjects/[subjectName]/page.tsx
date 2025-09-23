"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Axios } from "@/config/axios";
import useAuthStore from "@/store/store";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  PlayCircle,
  Target
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Topic {
  topicId: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

interface SubjectDetail {
  subjectId: string;
  subjectName: string;
  createdAt: string;
  updatedAt: string;
  topics: Topic[];
}

const difficultyColors = {
  Easy: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  Hard: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

export default function SubjectDetailPage() {
  const params = useParams();
  const subjectName = params.subjectName as string;
  const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [selectedContent, setSelectedContent] = useState<{
    type: 'overview' | 'learnings' | 'lessons' | 'quiz';
    topicId?: string;
    topic?: Topic;
  }>({ type: 'overview' });

  const { isAuthenticated, accessToken } = useAuthStore();

  // Find subject by name and get its details
  const fetchSubjectDetail = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);

      // First get all user subjects to find the subject ID
      const userSubjectsResponse = await Axios.get("/api/subject/user-subject", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (userSubjectsResponse.data.success) {
        const userSubjects = userSubjectsResponse.data.data;
        const decodedSubjectName = decodeURIComponent(subjectName).replace(/-/g, ' ');

        const matchingSubject = userSubjects.find((us: any) =>
          us.subject.subjectName.toLowerCase() === decodedSubjectName.toLowerCase()
        );

        if (matchingSubject) {
          // Now fetch the detailed subject info with topics
          const subjectDetailResponse = await Axios.get(`/api/subject/${matchingSubject.subject.subjectId}`);

          if (subjectDetailResponse.data.success) {
            setSubjectDetail(subjectDetailResponse.data.data);
          }
        } else {
          toast.error("Subject not found");
        }
      }
    } catch (error) {
      console.error("Error fetching subject detail:", error);
      toast.error("Failed to load subject details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectDetail();
  }, [subjectName, isAuthenticated, accessToken]);

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const selectContent = (type: 'learnings' | 'lessons' | 'quiz', topicId: string, topic: Topic) => {
    setSelectedContent({ type, topicId, topic });
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
            Please log in to view subject details.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading subject...</span>
      </div>
    );
  }

  if (!subjectDetail) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Subject Not Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The subject you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/dashboard/subjects">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard/subjects">
            <Button variant="ghost" size="sm" className="mb-4 p-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              {subjectDetail.subjectName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {subjectDetail.subjectName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subjectDetail.topics.length} Topics Available
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {/* Overview */}
            <button
              onClick={() => setSelectedContent({ type: 'overview' })}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedContent.type === 'overview'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="font-medium">Course Overview</span>
              </div>
            </button>

            <Separator className="my-4" />

            {/* Topics */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3">
                Topics
              </h3>

              {subjectDetail.topics.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No topics available yet</p>
                </div>
              ) : (
                subjectDetail.topics.map((topic) => (
                  <div key={topic.topicId} className="space-y-1">
                    {/* Topic Header */}
                    <button
                      onClick={() => toggleTopic(topic.topicId)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedTopics.has(topic.topicId) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span className="font-medium text-sm">{topic.title}</span>
                        </div>
                        <Badge className={`${difficultyColors[topic.difficulty]} text-xs`}>
                          {topic.difficulty}
                        </Badge>
                      </div>
                    </button>

                    {/* Topic Sub-items */}
                    {expandedTopics.has(topic.topicId) && (
                      <div className="ml-6 space-y-1">
                        <button
                          onClick={() => selectContent('learnings', topic.topicId, topic)}
                          className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                            selectedContent.topicId === topic.topicId && selectedContent.type === 'learnings'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>Overview</span>
                          </div>
                        </button>

                        <button
                          onClick={() => selectContent('lessons', topic.topicId, topic)}
                          className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                            selectedContent.topicId === topic.topicId && selectedContent.type === 'lessons'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" />
                            <span>Lessons</span>
                          </div>
                        </button>

                        <button
                          onClick={() => selectContent('quiz', topic.topicId, topic)}
                          className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                            selectedContent.topicId === topic.topicId && selectedContent.type === 'quiz'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                           <div className="flex items-center gap-2">
                             <HelpCircle className="w-4 h-4" />
                             <span>Quiz</span>
                           </div>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {selectedContent.type === 'overview' ? (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {subjectDetail.subjectName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Master the fundamentals and advanced concepts of {subjectDetail.subjectName}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {subjectDetail.topics.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Topics</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {subjectDetail.topics.length * 2}h
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Est. Duration</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {subjectDetail.topics.filter(t => t.difficulty === 'Easy').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Easy Topics</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Course Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjectDetail.topics.map((topic, index) => (
                  <div key={topic.topicId} className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {topic.title}
                        </h3>
                        <Badge className={`${difficultyColors[topic.difficulty]} text-xs`}>
                          {topic.difficulty}
                        </Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {topic.description || "No description available"}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {selectedContent.topic?.title}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <Badge className={`${difficultyColors[selectedContent.topic?.difficulty || 'Easy']}`}>
                  {selectedContent.topic?.difficulty}
                </Badge>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {selectedContent.type}
                </span>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                {selectedContent.type === 'learnings' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Learning Content</h3>
                    <div className="prose dark:prose-invert max-w-none">
                      <p>{selectedContent.topic?.description || "No description available for this topic."}</p>
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          What you'll learn:
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                          <li>Core concepts and fundamentals</li>
                          <li>Practical applications and examples</li>
                          <li>Best practices and common patterns</li>
                          <li>Advanced techniques and optimization</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {selectedContent.type === 'lessons' && (
                  <div className="text-center py-12">
                    <PlayCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Lessons Coming Soon
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Video lessons and interactive content will be available soon.
                    </p>
                  </div>
                )}

                 {selectedContent.type === 'quiz' && (
                   <div className="text-center py-12">
                     <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                       Quiz Coming Soon
                     </h3>
                     <p className="text-gray-600 dark:text-gray-400">
                       Interactive quizzes to test your knowledge will be available soon.
                     </p>
                   </div>
                 )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
