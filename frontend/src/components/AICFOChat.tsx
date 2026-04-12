"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import api from '@/utils/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export default function AICFOChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI CFO. I can help you with financial advice, budget planning, expense analysis, and more. What would you like to know?",
      timestamp: new Date(),
      suggestions: [
        "Show my spending summary",
        "How can I save more?",
        "Analyze my budget",
        "Predict next month's expenses"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai-cfo/chat', {
        message: messageText,
        conversationId: 'default' // In production, manage conversation IDs
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        suggestions: response.data.suggestions?.map((s: any) => s.title) || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    try {
      await api.post('/ai-cfo/feedback', {
        messageId,
        feedback
      });
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">AI CFO Assistant</h3>
            <p className="text-gray-400 text-xs">Your personal financial advisor</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
            )}
            
            <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-white/10'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              
              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full border border-white/10 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Feedback buttons for assistant messages */}
              {message.role === 'assistant' && message.id !== '1' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleFeedback(message.id, 'positive')}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3 text-gray-500 hover:text-green-400" />
                  </button>
                  <button
                    onClick={() => handleFeedback(message.id, 'negative')}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    <ThumbsDown className="w-3 h-3 text-gray-500 hover:text-red-400" />
                  </button>
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-purple-400" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-gray-800 rounded-2xl px-4 py-3 border border-white/10">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-gray-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about your finances..."
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
