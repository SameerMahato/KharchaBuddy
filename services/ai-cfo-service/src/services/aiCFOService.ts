import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { getUserMemory } from './memoryService';
import { getFinancialSnapshot } from './snapshotService';
import { cacheResponse, getCachedResponse } from '../utils/cache';
import { publishEvent } from '../utils/eventPublisher';
import { Counter, Histogram } from 'prom-client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Metrics
const llmRequestCounter = new Counter({
  name: 'ai_cfo_llm_requests_total',
  help: 'Total number of LLM requests',
  labelNames: ['provider', 'status'],
});

const llmLatencyHistogram = new Histogram({
  name: 'ai_cfo_llm_latency_seconds',
  help: 'LLM request latency in seconds',
  labelNames: ['provider'],
  buckets: [0.5, 1, 2, 3, 5, 10],
});

interface ChatRequest {
  userId: string;
  message: string;
  conversationId?: string;
}

interface ChatResponse {
  response: string;
  conversationId: string;
  provider: 'openai' | 'gemini' | 'fallback';
  cached: boolean;
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const { userId, message, conversationId } = request;

  // Check cache
  const cacheKey = `chat:${userId}:${message}`;
  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    logger.info('Cache hit for chat request', { userId, message: message.substring(0, 50) });
    return { ...cached, cached: true };
  }

  // Load user context
  const [memory, snapshot] = await Promise.all([
    getUserMemory(userId),
    getFinancialSnapshot(userId),
  ]);

  // Build system prompt
  const systemPrompt = buildSystemPrompt(memory, snapshot);

  // Try OpenAI first
  try {
    const startTime = Date.now();
    const response = await chatWithOpenAI(systemPrompt, message);
    const latency = (Date.now() - startTime) / 1000;
    
    llmRequestCounter.inc({ provider: 'openai', status: 'success' });
    llmLatencyHistogram.observe({ provider: 'openai' }, latency);

    const result: ChatResponse = {
      response,
      conversationId: conversationId || generateConversationId(),
      provider: 'openai',
      cached: false,
    };

    // Cache response
    await cacheResponse(cacheKey, result, 1800); // 30 min

    // Publish event
    await publishEvent('ai-cfo.chat', {
      userId,
      message,
      response,
      provider: 'openai',
      latency,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    logger.warn('OpenAI failed, trying Gemini', { error });
    llmRequestCounter.inc({ provider: 'openai', status: 'error' });
  }

  // Fallback to Gemini
  try {
    const startTime = Date.now();
    const response = await chatWithGemini(systemPrompt, message);
    const latency = (Date.now() - startTime) / 1000;
    
    llmRequestCounter.inc({ provider: 'gemini', status: 'success' });
    llmLatencyHistogram.observe({ provider: 'gemini' }, latency);

    const result: ChatResponse = {
      response,
      conversationId: conversationId || generateConversationId(),
      provider: 'gemini',
      cached: false,
    };

    await cacheResponse(cacheKey, result, 1800);

    await publishEvent('ai-cfo.chat', {
      userId,
      message,
      response,
      provider: 'gemini',
      latency,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    logger.error('Gemini failed, using fallback', { error });
    llmRequestCounter.inc({ provider: 'gemini', status: 'error' });
  }

  // Final fallback
  const response = generateFallbackResponse(message, snapshot);
  return {
    response,
    conversationId: conversationId || generateConversationId(),
    provider: 'fallback',
    cached: false,
  };
}

async function chatWithOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
}

async function chatWithGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-pro' });
  const prompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

function buildSystemPrompt(memory: any, snapshot: any): string {
  return `You are an AI CFO (Chief Financial Officer) assistant for KharchaBuddy, a personal finance management platform.

Your role is to:
- Provide personalized financial advice based on the user's spending patterns and goals
- Answer questions about their expenses, budgets, and financial health
- Offer actionable recommendations to improve their financial situation
- Be conversational, empathetic, and supportive

User Context:
${memory ? `- Spending patterns: ${memory.spendingPatterns || 'Learning...'}
- Preferences: ${memory.preferences || 'Learning...'}
- Financial personality: ${memory.financialPersonality || 'Balanced'}` : '- New user, still learning their patterns'}

Current Financial Snapshot:
- Total spent this month: ₹${snapshot.totalSpent || 0}
- Budget remaining: ₹${snapshot.budgetRemaining || 0}
- Top category: ${snapshot.topCategory || 'N/A'}
- Savings rate: ${snapshot.savingsRate || 0}%

Guidelines:
- Keep responses concise (2-3 sentences)
- Use Indian Rupees (₹) for currency
- Be encouraging and positive
- Provide specific, actionable advice
- If you don't have enough data, say so and ask clarifying questions`;
}

function generateFallbackResponse(message: string, snapshot: any): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('spend') || lowerMessage.includes('expense')) {
    return `Based on your current spending of ₹${snapshot.totalSpent || 0} this month, you're ${snapshot.budgetRemaining > 0 ? 'within budget' : 'over budget'}. Consider reviewing your ${snapshot.topCategory || 'top spending'} category for potential savings.`;
  }

  if (lowerMessage.includes('budget')) {
    return `You have ₹${snapshot.budgetRemaining || 0} remaining in your budget this month. ${snapshot.budgetRemaining < 1000 ? 'Try to be mindful of your spending for the rest of the month.' : 'You\'re doing well! Keep it up.'}`;
  }

  if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
    return `Your current savings rate is ${snapshot.savingsRate || 0}%. A good target is 20% of your income. Consider setting up automatic transfers to your savings account.`;
  }

  return "I'm here to help with your finances! You can ask me about your spending, budgets, savings goals, or get personalized financial advice.";
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export async function* chatStream(request: ChatRequest): AsyncGenerator<string> {
  const { userId, message } = request;

  // Load user context
  const [memory, snapshot] = await Promise.all([
    getUserMemory(userId),
    getFinancialSnapshot(userId),
  ]);

  const systemPrompt = buildSystemPrompt(memory, snapshot);

  try {
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    logger.error('Streaming failed', { error });
    yield generateFallbackResponse(message, snapshot);
  }
}
