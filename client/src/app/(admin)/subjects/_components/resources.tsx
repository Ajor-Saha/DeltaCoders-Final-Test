"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Axios } from "@/config/axios";
import useAuthStore from "@/store/store";
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Link as LinkIcon,
  Search,
  Star,
  Video
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Resource {
  resourceId: string;
  title: string;
  description: string;
  url: string;
  type: "video" | "article" | "book" | "website" | "pdf" | "other";
  difficulty: "beginner" | "intermediate" | "advanced";
  rating?: number;
  createdAt: string;
  tags: string[];
}

interface ResourcesProps {
  topicId?: string;
  topic?: {
    topicId: string;
    title: string;
    difficulty: string;
  };
  subjectId?: string;
  subjectName?: string;
}

const resourceTypeIcons = {
  video: Video,
  article: FileText,
  book: BookOpen,
  website: Globe,
  pdf: Download,
  other: LinkIcon,
};

const resourceTypeColors = {
  video: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  article: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  book: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  website: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  pdf: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

export function Resources({ topicId, topic, subjectId, subjectName }: ResourcesProps) {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'idle' | 'searching' | 'processing' | 'generating'>('idle');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  useEffect(() => {
    fetchResources();
  }, [topicId, subjectId]);

  const fetchResources = async () => {
    if (!isAuthenticated || !accessToken) return;

    setIsLoading(true);
    setLoadingStage('searching');
    try {
      // First try to get/generate resources using the existing API
      let targetSubjectId = subjectId;

      // If only topicId is provided, we need to use the subjectId from page props
      if (topicId && !subjectId && topic) {
        // We'll call the generate endpoint which will check for existing resources first
      }

      const response = await Axios.post('/api/resource/create-resources', {
        subjectId: targetSubjectId,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success && response.data.data) {
        // Update loading stage based on search metadata
        const isExisting = response.data.data.search_metadata?.is_existing_data;
        if (!isExisting) {
          setLoadingStage('processing');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
          setLoadingStage('generating');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate generation time
        }

        // Transform the API response to match our frontend Resource interface
        const transformedResources: Resource[] = [];

        if (response.data.data.topics) {
          for (const topic of response.data.data.topics) {
            for (const resource of topic.resources || []) {
              transformedResources.push({
                resourceId: `${resource.title}-${topic.topic_name}-${Math.random().toString(36).substring(7)}`,
                title: resource.title,
                description: topic.description || `Resource for ${topic.topic_name}`,
                url: resource.url,
                type: resource.type === 'video' ? 'video' :
                      resource.type === 'article' ? 'article' : 'website',
                difficulty: resource.difficulty?.toLowerCase() === 'advanced' ? 'advanced' :
                           resource.difficulty?.toLowerCase() === 'beginner' ? 'beginner' : 'intermediate',
                rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
                createdAt: new Date().toISOString(),
                tags: [topic.topic_name, resource.source || 'external'],
              });
            }
          }
        }

        // Filter resources if topicId is provided
        let filteredResources = transformedResources;
        if (topicId && topic) {
          filteredResources = transformedResources.filter(resource =>
            resource.tags.some(tag => tag.toLowerCase().includes(topic.title.toLowerCase()))
          );
        }

        setResources(filteredResources);

        if (isExisting) {
          toast.success("Existing resources loaded successfully!");
        } else {
          toast.success("New resources generated successfully!");
        }
      }
    } catch (error: any) {
      console.error("Error fetching resources:", error);
      if (error.response?.status === 404) {
        // No resources found, that's ok - just show empty state
        setResources([]);
      } else {
        toast.error("Failed to load resources");
      }
    } finally {
      setLoadingStage('idle');
      setIsLoading(false);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "all" || r.type === selectedType;
    const matchesDifficulty = selectedDifficulty === "all" || r.difficulty === selectedDifficulty;
    return matchesSearch && matchesType && matchesDifficulty;
  });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please log in to access learning resources.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Learning Resources
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {topic ? `Curated resources for ${topic.title}` : `Resources for ${subjectName}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        >
          <option value="all">All Types</option>
          <option value="video">Videos</option>
          <option value="article">Articles</option>
          <option value="book">Books</option>
          <option value="website">Websites</option>
          <option value="pdf">PDFs</option>
          <option value="other">Other</option>
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Statistics */}
      {resources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {resources.length}
              </div>
              <div className="text-sm text-gray-500">Total Resources</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resources Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {loadingStage === 'searching' && "AI Agent is searching for relevant sources..."}
              {loadingStage === 'processing' && "AI Agent is analyzing and gathering sources..."}
              {loadingStage === 'generating' && "Generating curated learning resources..."}
              {loadingStage === 'idle' && "Loading resources..."}
            </p>
            {loadingStage !== 'idle' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                This may take a few moments
              </p>
            )}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Resources Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {resources.length === 0
                ? "No resources available for this topic."
                : "No resources match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => {
              const IconComponent = resourceTypeIcons[resource.type];
              return (
                <Card key={resource.resourceId} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${resourceTypeColors[resource.type]}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2 leading-tight">
                            {resource.title}
                          </CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {resource.description}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={resourceTypeColors[resource.type]}>
                        {resource.type}
                      </Badge>
                      <Badge className={difficultyColors[resource.difficulty]}>
                        {resource.difficulty}
                      </Badge>
                    </div>

                    {resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                            +{resource.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {resource.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {resource.rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => window.open(resource.url, '_blank')}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visit
                      </Button>
                    </div>

                    <div className="text-xs text-gray-400">
                      Added {new Date(resource.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
