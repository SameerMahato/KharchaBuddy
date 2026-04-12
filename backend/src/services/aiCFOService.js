const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Expense = require('../models/expenseModel');
const Budget = require('../models/budgetModel');
const UserMemory = require('../models/userMemoryModel');
const Conversation = require('../models/conversationModel');

class AICFOService {
    constructor() {
        // Initialize OpenAI
        this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        }) : null;

        // Initialize Gemini
        this.gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
        
        // Response cache (in-memory for now, should use Redis in production)
        this.responseCache = new Map();
        this.CACHE_TTL = 3600000; // 1 hour in milliseconds
    }

    /**
     * Get or create user memory
     */
    async getUserMemory(userId) {
        let memory = await UserMemory.findOne({ user: userId });
        
        if (!memory) {
            memory = await UserMemory.create({
                user: userId,
                spendingPatterns: [],
                preferences: [],
                interactions: [],
                personality: {}
            });
        }
        
        return memory;
    }

    /**
     * Update user memory with new interaction
     */
    async updateUserMemory(userId, interaction) {
        const memory = await this.getUserMemory(userId);
        
        memory.interactions.push({
            timestamp: new Date(),
            type: interaction.type || 'chat',
            content: interaction.content,
            outcome: interaction.outcome,
            sentiment: interaction.sentiment || 'neutral'
        });
        
        await memory.save();
        return memory;
    }

    /**
     * Analyze spending patterns and update memory
     */
    async analyzeSpendingPatterns(userId) {
        const expenses = await Expense.find({ user: userId })
            .sort({ date: -1 })
            .limit(100);

        if (expenses.length < 10) {
            return [];
        }

        // Group by category
        const categoryStats = {};
        expenses.forEach(expense => {
            if (!categoryStats[expense.category]) {
                categoryStats[expense.category] = {
                    amounts: [],
                    dates: []
                };
            }
            categoryStats[expense.category].amounts.push(expense.amount);
            categoryStats[expense.category].dates.push(expense.date);
        });

        // Calculate patterns
        const patterns = [];
        for (const [category, stats] of Object.entries(categoryStats)) {
            const avgAmount = stats.amounts.reduce((a, b) => a + b, 0) / stats.amounts.length;
            
            // Determine frequency
            let frequency = 'occasional';
            if (stats.dates.length >= 20) frequency = 'daily';
            else if (stats.dates.length >= 8) frequency = 'weekly';
            else if (stats.dates.length >= 3) frequency = 'monthly';

            patterns.push({
                category,
                frequency,
                averageAmount: Math.round(avgAmount * 100) / 100
            });
        }

        // Update memory
        const memory = await this.getUserMemory(userId);
        memory.spendingPatterns = patterns;
        await memory.save();

        return patterns;
    }

    /**
     * Generate financial snapshot
     */
    async getFinancialSnapshot(userId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get monthly expenses
        const monthlyExpenses = await Expense.find({
            user: userId,
            date: { $gte: startOfMonth }
        });

        const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Get budgets
        const budgets = await Budget.find({ user: userId });
        const budgetStatus = {};
        
        for (const budget of budgets) {
            const categoryExpenses = monthlyExpenses
                .filter(exp => exp.category === budget.category)
                .reduce((sum, exp) => sum + exp.amount, 0);
            
            budgetStatus[budget.category] = {
                allocated: budget.amount,
                spent: categoryExpenses,
                remaining: budget.amount - categoryExpenses,
                percentage: Math.round((categoryExpenses / budget.amount) * 100)
            };
        }

        return {
            currentBalance: 0, // Would come from bank integration
            monthlyExpenses: totalExpenses,
            budgetStatus,
            expenseCount: monthlyExpenses.length
        };
    }

    /**
     * Build system prompt with user context
     */
    async buildSystemPrompt(userId, userMemory, financialSnapshot) {
        const patterns = userMemory.spendingPatterns.slice(0, 5);
        const personality = userMemory.personality;

        let prompt = `You are an AI Financial CFO assistant for KharchaBuddy. You provide personalized financial advice.

USER CONTEXT:
- Financial Personality: ${personality.spendingStyle || 'balanced'} spender, ${personality.riskTolerance || 'moderate'} risk tolerance
- Financial Literacy: ${personality.financialLiteracy || 'beginner'}
- Planning Horizon: ${personality.planningHorizon || 'medium'}-term

CURRENT FINANCIAL STATE:
- Monthly Expenses: ₹${financialSnapshot.monthlyExpenses.toFixed(2)}
- Total Transactions: ${financialSnapshot.expenseCount}

SPENDING PATTERNS:`;

        if (patterns.length > 0) {
            patterns.forEach(pattern => {
                prompt += `\n- ${pattern.category}: ${pattern.frequency}, avg ₹${pattern.averageAmount}`;
            });
        } else {
            prompt += '\n- No established patterns yet';
        }

        prompt += `\n\nBUDGET STATUS:`;
        const budgetEntries = Object.entries(financialSnapshot.budgetStatus);
        if (budgetEntries.length > 0) {
            budgetEntries.forEach(([category, status]) => {
                prompt += `\n- ${category}: ₹${status.spent}/${status.allocated} (${status.percentage}%)`;
            });
        } else {
            prompt += '\n- No budgets set';
        }

        prompt += `\n\nINSTRUCTIONS:
- Provide concise, actionable financial advice
- Be encouraging and supportive
- Use Indian Rupees (₹) for amounts
- Suggest specific actions when appropriate
- Keep responses under 200 words unless detailed analysis is requested
- Be conversational and friendly`;

        return prompt;
    }

    /**
     * Analyze sentiment of user message
     */
    analyzeSentiment(message) {
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'thanks', 'thank you', 'awesome', 'love'];
        const negativeWords = ['bad', 'poor', 'terrible', 'worried', 'concerned', 'problem', 'issue', 'help'];
        
        const lowerMessage = message.toLowerCase();
        const hasPositive = positiveWords.some(word => lowerMessage.includes(word));
        const hasNegative = negativeWords.some(word => lowerMessage.includes(word));
        
        if (hasPositive && !hasNegative) return 'positive';
        if (hasNegative && !hasPositive) return 'negative';
        return 'neutral';
    }

    /**
     * Generate cache key for common queries
     */
    getCacheKey(userId, message) {
        const normalizedMessage = message.toLowerCase().trim();
        
        // Common query patterns
        const patterns = [
            'daily brief',
            'spending summary',
            'budget status',
            'how am i doing',
            'financial health'
        ];
        
        for (const pattern of patterns) {
            if (normalizedMessage.includes(pattern)) {
                // Cache key includes date to invalidate daily
                const dateKey = new Date().toISOString().split('T')[0];
                return `${userId}:${pattern}:${dateKey}`;
            }
        }
        
        return null;
    }

    /**
     * Get cached response if available
     */
    getCachedResponse(cacheKey) {
        if (!cacheKey) return null;
        
        const cached = this.responseCache.get(cacheKey);
        if (!cached) return null;
        
        // Check if expired
        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
            this.responseCache.delete(cacheKey);
            return null;
        }
        
        return cached.response;
    }

    /**
     * Cache response
     */
    cacheResponse(cacheKey, response) {
        if (!cacheKey) return;
        
        this.responseCache.set(cacheKey, {
            response,
            timestamp: Date.now()
        });
    }

    /**
     * Generate fallback response
     */
    async generateFallbackResponse(userId, financialSnapshot) {
        const budgetEntries = Object.entries(financialSnapshot.budgetStatus);
        let response = "I'm here to help with your finances! ";

        if (budgetEntries.length > 0) {
            const overBudget = budgetEntries.filter(([_, status]) => status.percentage > 90);
            if (overBudget.length > 0) {
                response += `⚠️ You're close to or over budget in ${overBudget.length} categories. `;
            } else {
                response += "Your budgets are looking good! ";
            }
        }

        response += `\n\nThis month you've spent ₹${financialSnapshot.monthlyExpenses.toFixed(2)} across ${financialSnapshot.expenseCount} transactions.`;
        
        response += "\n\nI can help you with:\n";
        response += "• Analyzing your spending patterns\n";
        response += "• Setting and tracking budgets\n";
        response += "• Making spending decisions\n";
        response += "• Planning for financial goals";

        return response;
    }

    /**
     * Chat with AI CFO (streaming version)
     */
    async chatStream(userId, message, conversationId = null, onChunk) {
        try {
            // Get or create conversation
            let conversation;
            if (conversationId) {
                conversation = await Conversation.findOne({ _id: conversationId, user: userId });
            }
            
            if (!conversation) {
                conversation = await Conversation.create({
                    user: userId,
                    title: message.substring(0, 50),
                    messages: []
                });
            }

            // Add user message
            conversation.messages.push({
                role: 'user',
                content: message,
                timestamp: new Date()
            });

            // Get user context
            const userMemory = await this.getUserMemory(userId);
            const financialSnapshot = await this.getFinancialSnapshot(userId);
            
            // Build system prompt
            const systemPrompt = await this.buildSystemPrompt(userId, userMemory, financialSnapshot);

            // Prepare conversation history
            const recentMessages = conversation.messages.slice(-10);
            const messages = [
                { role: 'system', content: systemPrompt },
                ...recentMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            ];

            let fullResponse = '';
            let model = 'unknown';

            // Try OpenAI streaming
            if (this.openai) {
                try {
                    const stream = await this.openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages,
                        max_tokens: 500,
                        temperature: 0.7,
                        stream: true
                    });

                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            fullResponse += content;
                            onChunk(content);
                        }
                    }

                    model = 'gpt-4o-mini';
                } catch (error) {
                    console.error('OpenAI streaming error:', error.message);
                    // Fallback to non-streaming
                    fullResponse = await this.generateFallbackResponse(userId, financialSnapshot);
                    onChunk(fullResponse);
                    model = 'fallback';
                }
            } else {
                // No streaming support for Gemini in this version, use regular response
                fullResponse = await this.generateFallbackResponse(userId, financialSnapshot);
                onChunk(fullResponse);
                model = 'fallback';
            }

            // Add assistant message
            conversation.messages.push({
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date(),
                model
            });

            conversation.lastMessageAt = new Date();
            await conversation.save();

            // Update user memory
            const sentiment = this.analyzeSentiment(message);
            await this.updateUserMemory(userId, {
                type: 'chat',
                content: message,
                outcome: fullResponse.substring(0, 100),
                sentiment
            });

            return {
                conversationId: conversation._id,
                model
            };

        } catch (error) {
            console.error('Chat stream error:', error);
            throw error;
        }
    }

    /**
     * Chat with AI CFO
     */
    async chat(userId, message, conversationId = null) {
        try {
            // Check cache
            const cacheKey = this.getCacheKey(userId, message);
            const cachedResponse = this.getCachedResponse(cacheKey);
            if (cachedResponse) {
                return {
                    message: cachedResponse,
                    cached: true,
                    conversationId
                };
            }

            // Get or create conversation
            let conversation;
            if (conversationId) {
                conversation = await Conversation.findOne({ _id: conversationId, user: userId });
            }
            
            if (!conversation) {
                conversation = await Conversation.create({
                    user: userId,
                    title: message.substring(0, 50),
                    messages: []
                });
            }

            // Add user message
            conversation.messages.push({
                role: 'user',
                content: message,
                timestamp: new Date()
            });

            // Get user context
            const userMemory = await this.getUserMemory(userId);
            const financialSnapshot = await this.getFinancialSnapshot(userId);
            
            // Analyze and update patterns
            await this.analyzeSpendingPatterns(userId);

            // Build system prompt
            const systemPrompt = await this.buildSystemPrompt(userId, userMemory, financialSnapshot);

            // Prepare conversation history (last 10 messages)
            const recentMessages = conversation.messages.slice(-10);
            const messages = [
                { role: 'system', content: systemPrompt },
                ...recentMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            ];

            let responseText;
            let model;

            // Try OpenAI first, fallback to Gemini, then rule-based
            if (this.openai) {
                try {
                    const completion = await Promise.race([
                        this.openai.chat.completions.create({
                            model: 'gpt-4o-mini',
                            messages,
                            max_tokens: 500,
                            temperature: 0.7
                        }),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout')), 10000)
                        )
                    ]);

                    responseText = completion.choices[0].message.content;
                    model = 'gpt-4o-mini';
                } catch (openaiError) {
                    console.error('OpenAI error:', openaiError.message);
                    
                    // Try Gemini
                    if (this.gemini) {
                        try {
                            const geminiModel = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
                            const prompt = systemPrompt + '\n\nUser: ' + message;
                            const result = await geminiModel.generateContent(prompt);
                            responseText = result.response.text();
                            model = 'gemini-pro';
                        } catch (geminiError) {
                            console.error('Gemini error:', geminiError.message);
                            responseText = await this.generateFallbackResponse(userId, financialSnapshot);
                            model = 'fallback';
                        }
                    } else {
                        responseText = await this.generateFallbackResponse(userId, financialSnapshot);
                        model = 'fallback';
                    }
                }
            } else if (this.gemini) {
                try {
                    const geminiModel = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
                    const prompt = systemPrompt + '\n\nUser: ' + message;
                    const result = await geminiModel.generateContent(prompt);
                    responseText = result.response.text();
                    model = 'gemini-pro';
                } catch (geminiError) {
                    console.error('Gemini error:', geminiError.message);
                    responseText = await this.generateFallbackResponse(userId, financialSnapshot);
                    model = 'fallback';
                }
            } else {
                responseText = await this.generateFallbackResponse(userId, financialSnapshot);
                model = 'fallback';
            }

            // Add assistant message
            conversation.messages.push({
                role: 'assistant',
                content: responseText,
                timestamp: new Date(),
                model
            });

            conversation.lastMessageAt = new Date();
            await conversation.save();

            // Update user memory
            const sentiment = this.analyzeSentiment(message);
            await this.updateUserMemory(userId, {
                type: 'chat',
                content: message,
                outcome: responseText.substring(0, 100),
                sentiment
            });

            // Cache response
            this.cacheResponse(cacheKey, responseText);

            return {
                message: responseText,
                conversationId: conversation._id,
                model,
                cached: false
            };

        } catch (error) {
            console.error('Chat error:', error);
            throw error;
        }
    }

    /**
     * Generate daily brief
     */
    async generateDailyBrief(userId) {
        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Get today's expenses
            const todayExpenses = await Expense.find({
                user: userId,
                date: { $gte: startOfDay }
            });

            const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

            // Get monthly expenses
            const monthlyExpenses = await Expense.find({
                user: userId,
                date: { $gte: startOfMonth }
            });

            const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

            // Get budgets
            const budgets = await Budget.find({ user: userId });
            const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
            const remainingBudget = totalBudget - monthlyTotal;

            // Calculate today's recommended budget
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const daysRemaining = daysInMonth - now.getDate() + 1;
            const todaysBudget = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

            // Check for budget alerts
            const alerts = [];
            for (const budget of budgets) {
                const categoryExpenses = monthlyExpenses
                    .filter(exp => exp.category === budget.category)
                    .reduce((sum, exp) => sum + exp.amount, 0);
                
                const percentage = (categoryExpenses / budget.amount) * 100;
                
                if (percentage >= 90) {
                    alerts.push({
                        type: 'danger',
                        category: budget.category,
                        message: `${budget.category} budget is at ${Math.round(percentage)}%`,
                        percentage: Math.round(percentage)
                    });
                } else if (percentage >= 75) {
                    alerts.push({
                        type: 'warning',
                        category: budget.category,
                        message: `${budget.category} budget is at ${Math.round(percentage)}%`,
                        percentage: Math.round(percentage)
                    });
                }
            }

            // Generate recommendations
            const recommendations = [];
            
            if (todayTotal > todaysBudget * 1.5) {
                recommendations.push({
                    priority: 'high',
                    message: `You've spent ₹${todayTotal.toFixed(2)} today, which is above your daily budget of ₹${todaysBudget.toFixed(2)}. Consider reviewing your expenses.`,
                    actionable: true
                });
            }

            if (alerts.length > 0) {
                recommendations.push({
                    priority: 'high',
                    message: `You have ${alerts.length} budget alert${alerts.length > 1 ? 's' : ''}. Review your spending in these categories.`,
                    actionable: true
                });
            }

            if (remainingBudget < totalBudget * 0.2 && daysRemaining > 7) {
                recommendations.push({
                    priority: 'high',
                    message: `You've used 80% of your monthly budget with ${daysRemaining} days remaining. Consider reducing discretionary spending.`,
                    actionable: true
                });
            }

            // Calculate financial health score (0-100)
            let healthScore = 100;
            if (monthlyTotal > totalBudget) healthScore -= 30;
            else if (monthlyTotal > totalBudget * 0.9) healthScore -= 15;
            
            if (alerts.filter(a => a.type === 'danger').length > 0) healthScore -= 20;
            if (alerts.filter(a => a.type === 'warning').length > 0) healthScore -= 10;

            healthScore = Math.max(0, Math.min(100, healthScore));

            // Generate summary
            let summary = `Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}! `;
            
            if (todayTotal > 0) {
                summary += `You've spent ₹${todayTotal.toFixed(2)} today. `;
            } else {
                summary += `No expenses recorded today yet. `;
            }

            summary += `Your recommended daily budget is ₹${todaysBudget.toFixed(2)}. `;
            
            if (healthScore >= 80) {
                summary += `Your financial health is excellent! Keep it up! 🎉`;
            } else if (healthScore >= 60) {
                summary += `Your financial health is good, but there's room for improvement.`;
            } else {
                summary += `Your financial health needs attention. Let's work on it together.`;
            }

            return {
                summary,
                todaysBudget: Math.round(todaysBudget * 100) / 100,
                todaySpent: Math.round(todayTotal * 100) / 100,
                monthlySpent: Math.round(monthlyTotal * 100) / 100,
                monthlyBudget: Math.round(totalBudget * 100) / 100,
                remainingBudget: Math.round(remainingBudget * 100) / 100,
                daysRemaining,
                upcomingBills: [], // Would be populated from bill tracking feature
                recommendations,
                alerts,
                financialHealthScore: Math.round(healthScore)
            };

        } catch (error) {
            console.error('Daily brief error:', error);
            throw error;
        }
    }

    /**
     * Spending decision advisor
     */
    async shouldSpend(userId, amount, category, description = '') {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Get monthly expenses
            const monthlyExpenses = await Expense.find({
                user: userId,
                date: { $gte: startOfMonth }
            });

            // Get budget for category
            const budget = await Budget.findOne({ user: userId, category });
            
            if (!budget) {
                return {
                    approved: true,
                    reason: 'No budget set for this category. Consider setting one to track spending.',
                    confidence: 0.5,
                    budgetImpact: {
                        category,
                        currentSpent: 0,
                        budgetLimit: 0,
                        afterSpending: amount,
                        percentageUsed: 0
                    },
                    alternatives: [],
                    suggestions: [
                        'Set a budget for this category',
                        'Track this expense to build spending patterns'
                    ]
                };
            }

            // Calculate current spending in category
            const categoryExpenses = monthlyExpenses
                .filter(exp => exp.category === category)
                .reduce((sum, exp) => sum + exp.amount, 0);

            const afterSpending = categoryExpenses + amount;
            const percentageUsed = (afterSpending / budget.amount) * 100;

            // Decision logic
            let approved = true;
            let reason = '';
            let confidence = 1.0;
            const alternatives = [];
            const suggestions = [];

            if (percentageUsed > 100) {
                approved = false;
                reason = `This expense would put you ${Math.round(percentageUsed - 100)}% over budget for ${category}. `;
                confidence = 0.9;
                
                suggestions.push('Consider if this purchase is essential');
                suggestions.push('Look for a lower-cost alternative');
                suggestions.push('Wait until next month if possible');
                
                alternatives.push({
                    option: 'Delay purchase',
                    impact: 'Stay within budget this month',
                    savings: amount
                });
            } else if (percentageUsed > 90) {
                approved = true;
                reason = `This expense is allowed but will use ${Math.round(percentageUsed)}% of your ${category} budget. `;
                confidence = 0.6;
                
                suggestions.push('You have limited budget remaining in this category');
                suggestions.push('Avoid additional spending in this category this month');
            } else if (percentageUsed > 75) {
                approved = true;
                reason = `This expense will use ${Math.round(percentageUsed)}% of your ${category} budget. Still within limits. `;
                confidence = 0.8;
                
                suggestions.push('Monitor remaining spending in this category');
            } else {
                approved = true;
                reason = `This expense looks good! You'll have used ${Math.round(percentageUsed)}% of your ${category} budget. `;
                confidence = 1.0;
            }

            // Check if amount is unusually high
            const categoryHistory = await Expense.find({ user: userId, category }).limit(20);
            if (categoryHistory.length >= 5) {
                const avgAmount = categoryHistory.reduce((sum, exp) => sum + exp.amount, 0) / categoryHistory.length;
                const stdDev = Math.sqrt(
                    categoryHistory.reduce((sum, exp) => sum + Math.pow(exp.amount - avgAmount, 2), 0) / categoryHistory.length
                );

                if (amount > avgAmount + (2 * stdDev)) {
                    reason += `Note: This amount is significantly higher than your usual ${category} spending (avg: ₹${avgAmount.toFixed(2)}). `;
                    confidence *= 0.8;
                    suggestions.push('This is higher than your typical spending in this category');
                }
            }

            return {
                approved,
                reason,
                confidence: Math.round(confidence * 100) / 100,
                budgetImpact: {
                    category,
                    currentSpent: Math.round(categoryExpenses * 100) / 100,
                    budgetLimit: budget.amount,
                    afterSpending: Math.round(afterSpending * 100) / 100,
                    percentageUsed: Math.round(percentageUsed)
                },
                alternatives,
                suggestions
            };

        } catch (error) {
            console.error('Spending decision error:', error);
            throw error;
        }
    }

    /**
     * Get conversation history
     */
    async getConversations(userId, limit = 10) {
        return await Conversation.find({ user: userId, status: 'active' })
            .sort({ lastMessageAt: -1 })
            .limit(limit)
            .select('_id title lastMessageAt messages');
    }

    /**
     * Get specific conversation
     */
    async getConversation(userId, conversationId) {
        return await Conversation.findOne({ _id: conversationId, user: userId });
    }

    /**
     * Archive conversation
     */
    async archiveConversation(userId, conversationId) {
        const conversation = await Conversation.findOne({ _id: conversationId, user: userId });
        if (!conversation) {
            throw new Error('Conversation not found');
        }
        
        conversation.status = 'archived';
        await conversation.save();
        return conversation;
    }
}

module.exports = new AICFOService();
