"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Axios } from "@/config/axios";
import { getFilteredSubjects } from "@/constants/subjectlist";
import useAuthStore from "@/store/store";
import { BookOpen, Check, Send, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface SubjectFormData {
  subject: string;
  skillLevel: string;
}

interface SubjectFormProps {
  onSuccess?: () => void;
}

const skillLevels = [
  { value: "beginner", label: "Beginner", description: "Just starting out" },
  { value: "intermediate", label: "Intermediate", description: "Some experience" },
  { value: "advanced", label: "Advanced", description: "Experienced" },
];

export function SubjectForm({ onSuccess }: SubjectFormProps) {
  const [formData, setFormData] = useState<SubjectFormData>({
    subject: "",
    skillLevel: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get authentication state
  const { isAuthenticated, user, accessToken } = useAuthStore();

  // Log token for debugging
  console.log("🔐 JWT Token:", accessToken);
  console.log("👤 User:", user);
  console.log("✅ Is Authenticated:", isAuthenticated);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    if (!isAuthenticated || !user) {
      toast.error("Please log in to add subjects");
      return;
    }

    // Basic validation
    if (!formData.subject.trim() || !formData.skillLevel) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the actual backend API
      const response = await Axios.post('/api/subject/add-subject', {
        subjectName: formData.subject.trim(),
        level: formData.skillLevel
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Success handling
      if (response.status === 200 || response.status === 201) {
        // Reset form after successful submission
        setFormData({ subject: "", skillLevel: "" });
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);

        toast.success("Subject added successfully! 🎉", {
          description: `${formData.subject} (${formData.skillLevel}) has been added to your learning list.`
        });

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }

        console.log("Subject added successfully:", response.data);
      }

    } catch (error: any) {
      console.error("Error submitting form:", error);

      // Handle different types of errors
      if (error.response?.status === 401) {
        toast.error("Authentication failed", {
          description: "Please log in again to continue."
        });
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || "Invalid input data";
        toast.error("Validation Error", {
          description: errorMessage
        });
      } else if (error.response?.status === 409) {
        toast.error("Subject already exists", {
          description: "You have already added this subject to your learning list."
        });
      } else {
        toast.error("Failed to add subject", {
          description: "Please check your connection and try again."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, subject: value }));

    // Get filtered suggestions
    if (value.trim()) {
      const filteredSuggestions = getFilteredSubjects(value, 8);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleSkillLevelChange = (value: string) => {
    setFormData(prev => ({ ...prev, skillLevel: value }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, subject: suggestion }));
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show authentication message if user is not logged in
  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center min-h-[400px] p-4">
        <Card className="w-full max-w-md shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Authentication Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please log in to add subjects to your learning list.
            </p>
            <Button
              onClick={() => window.location.href = '/sign-in'}
              className="bg-primary hover:bg-primary/90"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[400px] p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Add Learning Subject
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Tell us what you'd like to learn and your current skill level
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject Input */}
            <div className="space-y-2 relative">
              <Label
                htmlFor="subject"
                className="text-sm font-medium flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Subject
              </Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="subject"
                  type="text"
                  placeholder="e.g., Data Science, Machine Learning, React..."
                  value={formData.subject}
                  onChange={handleSubjectChange}
                  onKeyDown={handleKeyDown}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700"
                  disabled={isSubmitting}
                  autoComplete="off"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion}
                        className={`px-4 py-3 cursor-pointer transition-colors duration-150 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          index === selectedSuggestionIndex
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        <span className="text-sm font-medium">{suggestion}</span>
                        {index === selectedSuggestionIndex && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    ))}

                    {/* Footer showing total matches */}
                    <div className="px-4 py-2 text-xs text-muted-foreground border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Skill Level Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Skill Level
              </Label>
              <Select
                value={formData.skillLevel}
                onValueChange={handleSkillLevelChange}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select your current level" />
                </SelectTrigger>
                <SelectContent>
                  {skillLevels.map((level) => (
                    <SelectItem
                      key={level.value}
                      value={level.value}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{level.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {level.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Subject
                </div>
              )}
            </Button>
          </form>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-muted-foreground">
              Your learning preferences will help us personalize your experience
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
