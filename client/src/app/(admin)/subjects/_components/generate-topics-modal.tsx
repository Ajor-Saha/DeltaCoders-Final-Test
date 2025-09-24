'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Axios } from '@/config/axios';
import useAuthStore from '@/store/store';
import { BookOpen, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Topic {
  topicId: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  createdAt: string;
}

interface GenerateTopicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
  onTopicsGenerated: (topics: Topic[]) => void;
}

export default function GenerateTopicsModal({
  isOpen,
  onClose,
  subjectId,
  subjectName,
  onTopicsGenerated,
}: GenerateTopicsModalProps) {
  const [userPreference, setUserPreference] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { isAuthenticated, accessToken } = useAuthStore();

  const handleGenerate = async () => {
    if (!userPreference.trim()) {
      toast.error('Please enter your learning preferences');
      return;
    }

    if (!isAuthenticated || !accessToken) {
      toast.error('Please log in to generate topics');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await Axios.post(
        '/api/topic/generate-topics-preferences',
        {
          subjectId,
          user_preference: userPreference.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.success) {
        const generatedTopics = response.data.data.topics.map((topic: any) => ({
          topicId: topic.topicId,
          title: topic.title,
          description: topic.description,
          difficulty: topic.difficulty,
          createdAt: topic.createdAt,
        }));

        onTopicsGenerated(generatedTopics);
        toast.success(`Successfully generated ${generatedTopics.length} personalized topics! 🎯`);

        // Reset form and close modal
        setUserPreference('');
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to generate topics');
      }
    } catch (error: any) {
      console.error('Error generating topics:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate topics';
      toast.error('Failed to generate topics: ' + errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setUserPreference('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generate Personalized Topics
          </DialogTitle>
          <DialogDescription>
            Tell us your learning preferences for <strong>{subjectName}</strong>, and we'll create
            personalized topics just for you using AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preference">Your Learning Preferences</Label>
            <Textarea
              id="preference"
              placeholder="Example: I want to focus on practical applications, real-world examples, and hands-on projects. I prefer interactive learning with visual explanations..."
              value={userPreference}
              onChange={(e) => setUserPreference(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isGenerating}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Be specific about your interests, learning style, or particular areas you'd like to explore.
            </div>
          </div>

          {/* Preview Section */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  What you'll get:
                </div>
                <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-1">
                  <li>• 2-3 personalized topics tailored to your preferences</li>
                  <li>• Topics that complement your existing course content</li>
                  <li>• Appropriate difficulty levels based on your needs</li>
                  <li>• Clear learning objectives for each topic</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!userPreference.trim() || isGenerating}
            className="min-w-[120px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Topics
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
