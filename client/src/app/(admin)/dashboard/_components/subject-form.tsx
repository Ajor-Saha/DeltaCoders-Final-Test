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
import { getFilteredSubjects } from "@/constants/subjectlist";
import { BookOpen, Check, Send, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SubjectFormData {
  subject: string;
  skillLevel: string;
}

const skillLevels = [
  { value: "beginner", label: "Beginner", description: "Just starting out" },
  { value: "intermediate", label: "Intermediate", description: "Some experience" },
  { value: "advanced", label: "Advanced", description: "Experienced" },
];

export function SubjectForm() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.subject.trim() || !formData.skillLevel) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call in next prompt
      console.log("Form submitted:", formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset form after successful submission
      setFormData({ subject: "", skillLevel: "" });
      alert("Subject submitted successfully!");

    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form. Please try again.");
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
