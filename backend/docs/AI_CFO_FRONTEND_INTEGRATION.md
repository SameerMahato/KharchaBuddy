# AI CFO Frontend Integration Guide

## Overview

This guide shows how to integrate the AI CFO Service into your React/Next.js frontend.

## Setup

### 1. Create API Client

```typescript
// src/utils/aiCFOApi.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  model: string;
  cached: boolean;
}

export interface DailyBrief {
  summary: string;
  todaysBudget: number;
  todaySpent: number;
  monthlySpent: number;
  monthlyBudget: number;
  remainingBudget: number;
  daysRemaining: number;
  recommendations: Recommendation[];
  alerts: Alert[];
  financialHealthScore: number;
}

export interface SpendingDecision {
  approved: boolean;
  reason: string;
  confidence: number;
  budgetImpact: BudgetImpact;
  alternatives: Alternative[];
  suggestions: string[];
}

class AICFOApi {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async chat(message: string, conversationId?: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/api/ai-cfo/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ message, conversationId })
    });

    if (!response.ok) {
      throw new Error('Failed to chat with AI CFO');
    }

    const data = await response.json();
    return data.data;
  }

  async chatStream(
    message: string,
    conversationId: string | undefined,
    onChunk: (chunk: string) => void,
    onComplete: (conversationId: string, model: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/ai-cfo/chat/stream`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message, conversationId })
      });

      if (!response.ok) {
        throw new Error('Failed to start chat stream');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.chunk) {
                onChunk(data.chunk);
              } else if (data.done) {
                onComplete(data.conversationId, data.model);
              } else if (data.error) {
                onError(data.error);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getDailyBrief(): Promise<DailyBrief> {
    const response = await fetch(`${API_BASE}/api/ai-cfo/daily-brief`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get daily brief');
    }

    const data = await response.json();
    return data.data;
  }

  async shouldSpend(
    amount: number,
    category: string,
    description?: string
  ): Promise<SpendingDecision> {
    const response = await fetch(`${API_BASE}/api/ai-cfo/should-spend`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount, category, description })
    });

    if (!response.ok) {
      throw new Error('Failed to get spending decision');
    }

    const data = await response.json();
    return data.data;
  }

  async getConversations(limit: number = 10) {
    const response = await fetch(
      `${API_BASE}/api/ai-cfo/conversations?limit=${limit}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get conversations');
    }

    const data = await response.json();
    return data.data;
  }

  async getConversation(conversationId: string) {
    const response = await fetch(
      `${API_BASE}/api/ai-cfo/conversations/${conversationId}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get conversation');
    }

    const data = await response.json();
    return data.data;
  }

  async archiveConversation(conversationId: string) {
    const response = await fetch(
      `${API_BASE}/api/ai-cfo/conversations/${conversationId}/archive`,
      {
        method: 'PUT',
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error('Failed to archive conversation');
    }

    const data = await response.json();
    return data.data;
  }

  async getUserMemory() {
    const response = await fetch(`${API_BASE}/api/ai-cfo/memory`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get user memory');
    }

    const data = await response.json();
    return data.data;
  }

  async analyzePatterns() {
    const response = await fetch(`${API_BASE}/api/ai-cfo/analyze-patterns`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to analyze patterns');
    }

    const data = await response.json();
    return data.data;
  }

  async provideFeedback(
    conversationId: string,
    messageId: string,
    feedback: 'positive' | 'negative',
    comment?: string
  ) {
    const response = await fetch(`${API_BASE}/api/ai-cfo/feedback`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ conversationId, messageId, feedback, comment })
    });

    if (!response.ok) {
      throw new Error('Failed to provide feedback');
    }

    const data = await response.json();
    return data;
  }
}

export const aiCFOApi = new AICFOApi();
```

### 2. Create React Hook

```typescript
// src/hooks/useAICFO.ts

import { useState, useCallback } from 'react';
import { aiCFOApi, ChatResponse, DailyBrief, SpendingDecision } from '@/utils/aiCFOApi';

export function useAICFO() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chat = useCallback(async (message: string, conversationId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiCFOApi.chat(message, conversationId);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to chat';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDailyBrief = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const brief = await aiCFOApi.getDailyBrief();
      return brief;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get daily brief';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const shouldSpend = useCallback(async (
    amount: number,
    category: string,
    description?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const decision = await aiCFOApi.shouldSpend(amount, category, description);
      return decision;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get spending decision';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    chat,
    getDailyBrief,
    shouldSpend,
    loading,
    error
  };
}
```

## Components

### 1. Chat Interface

```typescript
// src/components/AICFOChat.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { aiCFOApi } from '@/utils/aiCFOApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AICFOChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Use streaming for better UX
      setStreaming(true);
      let assistantContent = '';

      // Add placeholder for assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      await aiCFOApi.chatStream(
        userMessage.content,
        conversationId,
        (chunk) => {
          // Update last message with new chunk
          assistantContent += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = assistantContent;
            return newMessages;
          });
        },
        (newConversationId, model) => {
          setConversationId(newConversationId);
          setStreaming(false);
          setLoading(false);
        },
        (error) => {
          console.error('Stream error:', error);
          setStreaming(false);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[600px] p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {streaming && index === messages.length - 1 && (
                <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your finances..."
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </Card>
  );
}
```

### 2. Daily Brief Widget

```typescript
// src/components/DailyBriefWidget.tsx

'use client';

import { useEffect, useState } from 'react';
import { useAICFO } from '@/hooks/useAICFO';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DailyBriefWidget() {
  const { getDailyBrief, loading } = useAICFO();
  const [brief, setBrief] = useState<any>(null);

  useEffect(() => {
    loadBrief();
  }, []);

  const loadBrief = async () => {
    try {
      const data = await getDailyBrief();
      setBrief(data);
    } catch (error) {
      console.error('Failed to load daily brief:', error);
    }
  };

  if (loading) {
    return <Card className="p-6"><p>Loading your daily brief...</p></Card>;
  }

  if (!brief) {
    return null;
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Daily Financial Brief</span>
          <Badge className={getHealthColor(brief.financialHealthScore)}>
            Health: {brief.financialHealthScore}/100
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">{brief.summary}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Today's Budget</p>
            <p className="text-2xl font-bold">₹{brief.todaysBudget.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Today's Spent</p>
            <p className="text-2xl font-bold">₹{brief.todaySpent.toFixed(0)}</p>
          </div>
        </div>

        {brief.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Alerts</h4>
            {brief.alerts.map((alert: any, index: number) => (
              <Alert key={index} variant={alert.type === 'danger' ? 'destructive' : 'default'}>
                <AlertDescription>
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {brief.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Recommendations</h4>
            {brief.recommendations.map((rec: any, index: number) => (
              <div key={index} className="text-sm text-gray-700">
                • {rec.message}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3. Spending Decision Dialog

```typescript
// src/components/SpendingDecisionDialog.tsx

'use client';

import { useState } from 'react';
import { useAICFO } from '@/hooks/useAICFO';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
  'Healthcare', 'Education', 'Travel', 'Other'
];

export function SpendingDecisionDialog() {
  const { shouldSpend, loading } = useAICFO();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [decision, setDecision] = useState<any>(null);

  const handleCheck = async () => {
    if (!amount || !category) return;

    try {
      const result = await shouldSpend(
        parseFloat(amount),
        category,
        description
      );
      setDecision(result);
    } catch (error) {
      console.error('Failed to get decision:', error);
    }
  };

  const handleReset = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setDecision(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Should I Spend?</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Spending Decision Advisor</DialogTitle>
        </DialogHeader>

        {!decision ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="New laptop"
              />
            </div>

            <Button
              onClick={handleCheck}
              disabled={loading || !amount || !category}
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Check'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              decision.approved ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className="font-semibold text-lg mb-2">
                {decision.approved ? '✅ Approved' : '❌ Not Recommended'}
              </p>
              <p className="text-gray-700">{decision.reason}</p>
              <p className="text-sm text-gray-500 mt-2">
                Confidence: {(decision.confidence * 100).toFixed(0)}%
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Budget Impact</h4>
              <div className="space-y-1 text-sm">
                <p>Current: ₹{decision.budgetImpact.currentSpent}</p>
                <p>After: ₹{decision.budgetImpact.afterSpending}</p>
                <p>Limit: ₹{decision.budgetImpact.budgetLimit}</p>
                <p className="font-semibold">
                  Usage: {decision.budgetImpact.percentageUsed}%
                </p>
              </div>
            </div>

            {decision.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Suggestions</h4>
                <ul className="space-y-1 text-sm">
                  {decision.suggestions.map((suggestion: string, index: number) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={handleReset} variant="outline" className="w-full">
              Check Another
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

## Usage in Pages

### Dashboard Page

```typescript
// src/app/dashboard/page.tsx

import { DailyBriefWidget } from '@/components/DailyBriefWidget';
import { AICFOChat } from '@/components/AICFOChat';
import { SpendingDecisionDialog } from '@/components/SpendingDecisionDialog';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyBriefWidget />
        <AICFOChat />
      </div>

      <div className="flex justify-center">
        <SpendingDecisionDialog />
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Error Handling

```typescript
try {
  const response = await aiCFOApi.chat(message);
  // Handle success
} catch (error) {
  if (error instanceof Error) {
    // Show user-friendly error
    toast.error(error.message);
  }
}
```

### 2. Loading States

```typescript
{loading ? (
  <Skeleton className="h-20" />
) : (
  <DailyBriefWidget />
)}
```

### 3. Caching with React Query

```typescript
import { useQuery } from '@tanstack/react-query';

export function useDailyBrief() {
  return useQuery({
    queryKey: ['dailyBrief'],
    queryFn: () => aiCFOApi.getDailyBrief(),
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false
  });
}
```

### 4. Optimistic Updates

```typescript
const handleFeedback = async (feedback: 'positive' | 'negative') => {
  // Optimistically update UI
  setLocalFeedback(feedback);
  
  try {
    await aiCFOApi.provideFeedback(conversationId, messageId, feedback);
  } catch (error) {
    // Revert on error
    setLocalFeedback(null);
    toast.error('Failed to submit feedback');
  }
};
```

## Testing

### Component Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AICFOChat } from '@/components/AICFOChat';

describe('AICFOChat', () => {
  it('sends message and displays response', async () => {
    render(<AICFOChat />);
    
    const input = screen.getByPlaceholderText(/ask me anything/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await userEvent.type(input, 'How much did I spend?');
    await userEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/you've spent/i)).toBeInTheDocument();
    });
  });
});
```

## Performance Tips

1. **Lazy Load Chat**: Load chat component only when needed
2. **Debounce Input**: Debounce typing for search/autocomplete
3. **Virtual Scrolling**: Use virtual scrolling for long message lists
4. **Memoization**: Memoize expensive computations
5. **Code Splitting**: Split chat component into separate bundle

---

**Ready to integrate!** Start with the Daily Brief Widget for quick wins, then add the Chat Interface for full AI CFO experience.
