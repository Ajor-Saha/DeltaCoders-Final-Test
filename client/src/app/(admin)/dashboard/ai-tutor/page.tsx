"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import useAuthStore from "@/store/store";
import {
    BookOpen,
    Bot,
    Calculator,
    Code,
    Globe,
    Lightbulb,
    MessageSquare,
    Send,
    Sparkles,
    User
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const suggestedPrompts = [
  {
    icon: <BookOpen className="w-4 h-4" />,
    title: "Explain a concept",
    prompt: "Can you explain machine learning in simple terms?"
  },
  {
    icon: <Code className="w-4 h-4" />,
    title: "Code help",
    prompt: "Help me write a Python function to sort a list"
  },
  {
    icon: <Calculator className="w-4 h-4" />,
    title: "Solve problems",
    prompt: "Help me solve this math problem step by step"
  },
  {
    icon: <Globe className="w-4 h-4" />,
    title: "General knowledge",
    prompt: "What are the latest trends in web development?"
  }
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // TODO: Replace with actual AI API call
      // Simulate AI response for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about: "${userMessage.content}"\n\nThis is a placeholder response. The AI API integration will be implemented next. I'm here to help you learn and understand various subjects!\n\nSome things I can help with:\n• Explaining complex concepts\n• Providing step-by-step solutions\n• Answering questions about your subjects\n• Offering study tips and strategies`,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error("Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              AI Tutor
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your personal learning assistant
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              <Sparkles className="w-3 h-3 mr-1" />
              Online
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to AI Tutor! 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                I'm here to help you learn and understand any subject. Ask me questions, request explanations, or get help with problems!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {suggestedPrompts.map((suggestion, index) => (
                  <Card
                    key={index}
                    className="p-4 hover:shadow-md transition-all cursor-pointer border-dashed border-2 hover:border-blue-300 dark:hover:border-blue-600"
                    onClick={() => handleSuggestedPrompt(suggestion.prompt)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                        {suggestion.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {suggestion.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.prompt}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-4">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={`${
                      message.role === 'user'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {message.role === 'user' ? (user?.firstName || 'You') : 'AI Tutor'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>

                    <div className={`p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="prose dark:prose-invert max-w-none text-sm">
                        {message.content.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 last:mb-0">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        AI Tutor
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your subjects, or any learning question..."
                  className="min-h-[50px] max-h-[150px] resize-none pr-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="absolute right-2 bottom-2 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Lightbulb className="w-3 h-3" />
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-3 h-3" />
                <span>{messages.length} messages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
