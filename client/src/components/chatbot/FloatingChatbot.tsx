"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X } from "lucide-react";
import React, { useState } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  hasLink?: boolean;
}

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your SmartStudy AI assistant. I'm here to help you navigate and use this platform efficiently. Feel free to ask me about features, how to get started, or any questions about the platform!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // Platform navigation and features
    if (message.includes('dashboard') || message.includes('home')) {
      return "📊 The Dashboard shows your learning progress, recent quiz results, cognitive scores, and enrolled subjects. You can track your performance and see analytics of your learning journey!";
    }

    if (message.includes('subject') || message.includes('course') || message.includes('topic')) {
      return "📚 You can add subjects, generate AI-powered topics and lessons, take quizzes, and track your progress. Each subject has multiple topics with generated content tailored to your learning level!";
    }

    if (message.includes('quiz') || message.includes('test') || message.includes('exam')) {
      return "🎯 Our AI generates adaptive quizzes based on your topics. After completing quizzes, you'll get detailed results, cognitive assessments, and weak area identification for targeted learning!";
    }

    if (message.includes('ai') || message.includes('tutor') || message.includes('chat')) {
      return "🤖 Our AI tutor feature (currently in development) will provide personalized learning assistance based on your progress data. You can chat with it about your course content!";
    }

    if (message.includes('game') || message.includes('cognitive') || message.includes('brain')) {
      return "🧠 Play cognitive games to improve attention, memory, and focus. The platform tracks your game analytics and provides cognitive assessments to measure your mental performance!";
    }

    if (message.includes('progress') || message.includes('track') || message.includes('analytics')) {
      return "📈 Track your learning progress per subject, view quiz results over time, monitor cognitive scores, and identify weak topics that need more attention. All data is visualized in beautiful charts!";
    }

    if (message.includes('resource') || message.includes('material') || message.includes('video')) {
      return "📖 The platform curates external learning resources including YouTube videos and documentation for each topic to supplement your learning experience!";
    }

    if (message.includes('start') || message.includes('begin') || message.includes('how to') || message.includes('getting started')) {
      return "🚀 Getting Started:\n1. Add a subject from the dashboard\n2. Generate AI topics and lessons\n3. Take quizzes to test your knowledge\n4. Review your progress and weak areas\n5. Use curated resources for deeper learning\n6. Play cognitive games for brain training!";
    }

    if (message.includes('feature') || message.includes('what can') || message.includes('capabilities')) {
      return "✨ Platform Features:\n• AI-generated lessons & quizzes\n• Progress tracking & analytics\n• Cognitive assessments\n• Brain training games\n• Weak topic identification\n• External resource curation\n• Personalized learning paths\n• Real-time performance monitoring";
    }

    // Default response for unmatched queries
    return "🔧 This chatbot feature is currently being enhanced! For now, I can help you understand how to use SmartStudy efficiently.\n\n💡 Try asking about: subjects, quizzes, dashboard, progress tracking, games, or getting started.\n\n🔗 You can explore more features and our codebase on GitHub:\n\nFeel free to ask me anything about navigating the platform!";
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = () => {
    if (inputMessage.trim() === "") return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // Generate intelligent bot response
    setTimeout(() => {
      const responseText = getBotResponse(inputMessage);
      const hasGitHubLink = responseText.includes("GitHub:");

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: "bot",
        timestamp: new Date(),
        hasLink: hasGitHubLink,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.hasLink && message.text.includes("GitHub:")) {
      const parts = message.text.split("GitHub:");
      return (
        <div>
          {parts[0]}
          <span className="font-semibold">GitHub:</span>
          <br />
          <a
            href="https://github.com/Ajor-Saha/DeltaCoders-Final-Test"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline font-medium transition-colors duration-200"
          >
            🔗 DeltaCoders-Final-Test Repository
          </a>
          <br />
          {parts[1]}
        </div>
      );
    }

    // For regular messages, preserve line breaks
    return message.text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < message.text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <>
      {/* Floating Chat Button - Only show when chat is closed */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={toggleChat}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 dark:from-teal-600 dark:to-teal-800 dark:hover:from-teal-700 dark:hover:to-teal-900 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-110"
            size="icon"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </div>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-8 right-12 z-40 aspect-[4/5] h-[65%] transform transition-all duration-300 ease-in-out">
          <Card className="w-full h-full shadow-2xl border-0 bg-white dark:bg-gray-900 flex flex-col">
            <CardHeader className="bg-gradient-to-r from-teal-400 to-teal-600 dark:from-teal-600 dark:to-teal-800 text-white rounded-t-lg p-4 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-white text-teal-600 text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
                AI Assistant
                <button
                  onClick={toggleChat}
                  className="ml-auto p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 min-h-0 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.sender === "user"
                            ? "bg-teal-500 hover:bg-teal-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {renderMessageContent(message)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={sendMessage}
                    size="icon"
                    className="bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700"
                    disabled={inputMessage.trim() === ""}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
