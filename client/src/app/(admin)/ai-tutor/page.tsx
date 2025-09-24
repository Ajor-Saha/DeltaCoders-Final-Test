"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import useAuthStore from "@/store/store";
import {
  BookOpen,
  Bot,
  Calculator,
  Code,
  Database,
  Globe,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  User,
  Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Message {
  id: string;
  messageId?: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  contextUsed?: {
    relevantChunks: number;
    hasPersonalizedContext: boolean;
    sources?: Array<{
      type: string;
      source: string;
      relevanceScore: number;
    }>;
  };
}

interface ChatInfo {
  chatId: string;
  isActive: boolean;
  createdAt: string;
}

interface InitializationState {
  isInitialized: boolean;
  isInitializing: boolean;
  currentStep: number;
  totalSteps: number;
  stepMessage: string;
  chatInfo?: ChatInfo;
  dataStatus?: {
    hasVectorData: boolean;
    enrolledSubjectsCount: number;
    lastSyncNeeded: boolean;
    subjects: string[];
  };
}

const initializationSteps = [
  "🔍 Agent is connecting to your learning data...",
  "📊 Agent is analyzing your progress and performance...",
  "🧠 Agent is processing your personalized context...",
  "⚡ Agent is creating your personal chatbot...",
  "🎯 Agent is ready to assist with your learning!",
];

const suggestedPrompts = [
  {
    icon: <BookOpen className="w-4 h-4" />,
    title: "Explain a concept",
    prompt: "Can you explain a difficult concept from my recent lessons?"
  },
  {
    icon: <Code className="w-4 h-4" />,
    title: "Quiz help",
    prompt: "Help me understand where I went wrong in my recent quizzes"
  },
  {
    icon: <Calculator className="w-4 h-4" />,
    title: "Study guidance",
    prompt: "Based on my performance, what should I focus on studying next?"
  },
  {
    icon: <Globe className="w-4 h-4" />,
    title: "Learning progress",
    prompt: "How am I performing across my subjects? Any weak areas?"
  }
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialization, setInitialization] = useState<InitializationState>({
    isInitialized: false,
    isInitializing: false,
    currentStep: 0,
    totalSteps: initializationSteps.length,
    stepMessage: "",
  });
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, isAuthenticated, accessToken } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  // Initialize AI tutor on first load
  useEffect(() => {
    if (isAuthenticated && accessToken && !initialization.isInitialized && !initialization.isInitializing) {
      initializeAITutor();
    }
  }, [isAuthenticated, accessToken]);

  const initializeAITutor = async () => {
    if (!isAuthenticated || !accessToken) {
      toast.error("Please log in to use AI Tutor");
      return;
    }

    setInitialization(prev => ({
      ...prev,
      isInitializing: true,
      currentStep: 0,
    }));

    try {
      // Step 1: Check if user data already exists
      setInitialization(prev => ({
        ...prev,
        currentStep: 1,
        stepMessage: "🔍 Agent is checking your existing data...",
      }));

      const statusResponse = await Axios.get('/api/aibot/check-data-status', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const dataStatus = statusResponse.data.data;
      setInitialization(prev => ({
        ...prev,
        dataStatus,
      }));

      // Step 2: Sync data only if needed
      if (dataStatus.lastSyncNeeded) {
        setInitialization(prev => ({
          ...prev,
          currentStep: 2,
          stepMessage: initializationSteps[0],
        }));

        await Axios.post('/api/aibot/sync-data', {}, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        toast.success(
          `🎯 AI Tutor synced data from ${dataStatus.enrolledSubjectsCount} subjects`,
          { duration: 3000 }
        );
      } else {
        setInitialization(prev => ({
          ...prev,
          currentStep: 2,
          stepMessage: "✅ Your data is already synced and ready!",
        }));
      }

      // Show remaining progress steps quickly
      for (let step = 3; step <= initializationSteps.length; step++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setInitialization(prev => ({
          ...prev,
          currentStep: step,
          stepMessage: initializationSteps[step - 1],
        }));
      }

      // Get chat history to check if chat exists
      const historyResponse = await Axios.get('/api/aibot/chat-history', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (historyResponse.data.success && historyResponse.data.data.messages.length > 0) {
        // Load existing messages
        const existingMessages: Message[] = historyResponse.data.data.messages.map((msg: any) => ({
          id: msg.messageId,
          messageId: msg.messageId,
          content: msg.userMessage,
          role: 'user' as const,
          timestamp: new Date(msg.createdAt),
        }));

        const aiMessages: Message[] = historyResponse.data.data.messages.map((msg: any) => ({
          id: msg.messageId + '_ai',
          messageId: msg.messageId,
          content: msg.aiResponse,
          role: 'assistant' as const,
          timestamp: new Date(msg.createdAt),
        }));

        // Interleave user and AI messages
        const allMessages: Message[] = [];
        for (let i = 0; i < existingMessages.length; i++) {
          allMessages.push(existingMessages[i]);
          allMessages.push(aiMessages[i]);
        }

        setMessages(allMessages);
      }

      if (historyResponse.data.success) {
        setInitialization(prev => ({
          ...prev,
          chatInfo: historyResponse.data.data.activeChat,
        }));
      }

      // Initialization complete
      await new Promise(resolve => setTimeout(resolve, 500));
      setInitialization(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false,
      }));

      const successMessage = dataStatus.lastSyncNeeded
        ? `🎉 AI Tutor initialized and synced ${dataStatus.enrolledSubjectsCount} subjects!`
        : `🎉 AI Tutor ready! Using existing data from ${dataStatus.enrolledSubjectsCount} subjects`;

      toast.success(successMessage, { duration: 4000 });

    } catch (error: any) {
      console.error('Error initializing AI Tutor:', error);
      setInitialization(prev => ({
        ...prev,
        isInitializing: false,
      }));
      const errorMessage = error.response?.data?.message || error.message || 'Failed to initialize AI Tutor';
      toast.error("Failed to initialize AI Tutor: " + errorMessage);
    }
  };

  const refreshUserData = async () => {
    if (!isAuthenticated || !accessToken) {
      toast.error("Please log in to refresh data");
      return;
    }

    setIsRefreshing(true);

    try {
      toast.info("🔄 Refreshing your learning data...", { duration: 2000 });

      const syncResponse = await Axios.post('/api/aibot/sync-data',
        { force: true }, // Force refresh
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // Update data status
      const statusResponse = await Axios.get('/api/aibot/check-data-status', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      setInitialization(prev => ({
        ...prev,
        dataStatus: statusResponse.data.data,
      }));

      toast.success(
        `✅ Data refreshed successfully! Updated ${syncResponse.data.data?.synced || 0} records`,
        { duration: 4000 }
      );

    } catch (error: any) {
      console.error('Error refreshing user data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh data';
      toast.error("Failed to refresh data: " + errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !isAuthenticated || !accessToken) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Create streaming message placeholder
    const streamingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
    };

    setCurrentStreamingMessage(streamingMessage);

    try {
      // Use fetch for SSE streaming (Axios doesn't handle SSE well)
      const response = await fetch(`${env.BACKEND_BASE_URL}/api/aibot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: userMessage.content,
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      let buffer = '';
      let fullContent = '';
      let messageMetadata: any = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'start':
                  console.log('Chat started:', data);
                  setCurrentStreamingMessage(prev => prev ? {
                    ...prev,
                    contextUsed: {
                      relevantChunks: data.contextUsed?.relevantChunks || 0,
                      hasPersonalizedContext: data.hasPersonalizedContext || false,
                      sources: data.contextUsed?.sources || []
                    }
                  } : null);
                  break;

                case 'chunk':
                  fullContent += data.content;
                  setCurrentStreamingMessage(prev => prev ? {
                    ...prev,
                    content: fullContent
                  } : null);
                  break;

                case 'metadata':
                  messageMetadata = data;
                  console.log('Message metadata:', data);
                  break;

                case 'complete':
                  console.log('Streaming complete:', data.message);
                  break;

                case 'error':
                  toast.error("AI Error: " + data.message);
                  break;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      // Add final message to messages list
      const finalMessage: Message = {
        id: messageMetadata?.messageId || (Date.now() + 1).toString(),
        messageId: messageMetadata?.messageId,
        content: fullContent,
        role: 'assistant',
        timestamp: new Date(messageMetadata?.chatInfo?.createdAt || Date.now()),
        contextUsed: currentStreamingMessage?.contextUsed,
      };

      setMessages(prev => [...prev, finalMessage]);
      setCurrentStreamingMessage(null);

    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.message || 'Failed to get AI response';
      toast.error("Failed to get AI response: " + errorMessage);
      setCurrentStreamingMessage(null);
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

  const handleRetryInitialization = () => {
    setInitialization({
      isInitialized: false,
      isInitializing: false,
      currentStep: 0,
      totalSteps: initializationSteps.length,
      stepMessage: "",
    });
    initializeAITutor();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show authentication required
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please log in to access your AI Tutor.
          </p>
        </div>
      </div>
    );
  }

  // Show initialization screen
  if (!initialization.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            {initialization.isInitializing ? (
              <div className="animate-spin">
                <Zap className="w-10 h-10 text-white" />
              </div>
            ) : (
              <Bot className="w-10 h-10 text-white" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {initialization.isInitializing ? "Initializing AI Tutor" : "AI Tutor Setup"}
          </h2>

          {initialization.isInitializing ? (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {initialization.stepMessage}
              </p>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(initialization.currentStep / initialization.totalSteps) * 100}%`
                  }}
                />
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                Step {initialization.currentStep} of {initialization.totalSteps}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Set up your personalized AI learning assistant
              </p>
              <Button
                onClick={initializeAITutor}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                <Database className="w-4 h-4 mr-2" />
                Initialize AI Tutor
              </Button>
              {initialization.isInitializing === false && initialization.currentStep > 0 && (
                <Button
                  onClick={handleRetryInitialization}
                  variant="outline"
                  className="ml-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              AI Tutor
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your personalized learning assistant
              {initialization.dataStatus && (
                <span className="ml-2">
                  • {initialization.dataStatus.enrolledSubjectsCount} subjects
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {initialization.isInitialized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshUserData}
                disabled={isRefreshing}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            )}
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              <Sparkles className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !currentStreamingMessage ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Hello {user?.firstName}! 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                I'm your AI Tutor, trained on your personal learning data.
              </p>
              {initialization.dataStatus && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                  📚 I have access to your learning data from {initialization.dataStatus.enrolledSubjectsCount} subjects: {" "}
                  {initialization.dataStatus.subjects.slice(0, 3).join(", ")}
                  {initialization.dataStatus.subjects.length > 3 && ` and ${initialization.dataStatus.subjects.length - 3} more`}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                I can help you understand concepts, explain your quiz results, suggest study plans, and answer questions based on your learning history.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {suggestedPrompts.map((suggestion, index) => (
                  <Card
                    key={index}
                    className="p-4 hover:shadow-md transition-all cursor-pointer border-dashed border-2 hover:border-purple-300 dark:hover:border-purple-600"
                    onClick={() => handleSuggestedPrompt(suggestion.prompt)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
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
                      {message.contextUsed && message.role === 'assistant' && (
                        <Badge variant="outline" className="text-xs">
                          {message.contextUsed.hasPersonalizedContext ? (
                            <>
                              <Database className="w-3 h-3 mr-1" />
                              {message.contextUsed.relevantChunks} context chunks
                            </>
                          ) : (
                            'General response'
                          )}
                        </Badge>
                      )}
                    </div>

                    <div className={`p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}>
                      {message.role === 'user' ? (
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {message.content}
                        </div>
                      ) : (
                        <div className="prose dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 mt-4">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-3">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2 mt-3">
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => (
                                <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-1 mb-3 text-gray-700 dark:text-gray-300">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-700 dark:text-gray-300">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-gray-700 dark:text-gray-300">
                                  {children}
                                </li>
                              ),
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-sm font-mono">
                                    {children}
                                  </code>
                                ) : (
                                  <code className={className}>
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }) => (
                                <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3 overflow-x-auto">
                                  {children}
                                </pre>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-purple-500 pl-3 py-1 mb-3 bg-purple-50 dark:bg-purple-900/20 text-gray-700 dark:text-gray-300 italic">
                                  {children}
                                </blockquote>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-gray-700 dark:text-gray-300">
                                  {children}
                                </em>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Context info for assistant messages */}
                    {message.contextUsed && message.role === 'assistant' && message.contextUsed.sources && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                        <details className="cursor-pointer">
                          <summary className="hover:text-gray-700 dark:hover:text-gray-300">
                            View context sources ({message.contextUsed.sources.length})
                          </summary>
                          <div className="mt-2 space-y-1">
                            {message.contextUsed.sources.slice(0, 3).map((source, idx) => (
                              <div key={idx} className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                                <span className="font-medium">{source.type}:</span> {source.source}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming message */}
              {currentStreamingMessage && (
                <div className="flex gap-4">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        AI Tutor
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(currentStreamingMessage.timestamp)}
                      </span>
                      {currentStreamingMessage.contextUsed && (
                        <Badge variant="outline" className="text-xs">
                          <Database className="w-3 h-3 mr-1" />
                          {currentStreamingMessage.contextUsed.relevantChunks} context chunks
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-purple-600 dark:text-purple-400">Typing...</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                      {currentStreamingMessage.content ? (
                        <div className="prose dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                                  {children}
                                </strong>
                              ),
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded text-sm font-mono">
                                    {children}
                                  </code>
                                ) : (
                                  <code className={className}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {currentStreamingMessage.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                        </div>
                      )}
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
                  placeholder="Ask me about your learning progress, quiz results, or any study questions..."
                  className="min-h-[50px] max-h-[150px] resize-none pr-12 border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="absolute right-2 bottom-2 h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600"
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
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{messages.length} messages</span>
                </div>
                {initialization.chatInfo && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Personalized AI</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
