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
}

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

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

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your message! I'm a demo chatbot. How else can I assist you?",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
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
                        {message.text}
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
