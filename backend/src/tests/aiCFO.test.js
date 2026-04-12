const aiCFOService = require('../services/aiCFOService');
const UserMemory = require('../models/userMemoryModel');
const Conversation = require('../models/conversationModel');
const Expense = require('../models/expenseModel');
const Budget = require('../models/budgetModel');

// Mock data
const mockUserId = '507f1f77bcf86cd799439011';

describe('AI CFO Service', () => {
    describe('getUserMemory', () => {
        it('should create new memory if none exists', async () => {
            const memory = await aiCFOService.getUserMemory(mockUserId);
            expect(memory).toBeDefined();
            expect(memory.user.toString()).toBe(mockUserId);
            expect(memory.spendingPatterns).toEqual([]);
        });

        it('should return existing memory', async () => {
            const existingMemory = await UserMemory.create({
                user: mockUserId,
                spendingPatterns: [{ category: 'Food', frequency: 'daily', averageAmount: 100 }]
            });

            const memory = await aiCFOService.getUserMemory(mockUserId);
            expect(memory._id.toString()).toBe(existingMemory._id.toString());
            expect(memory.spendingPatterns.length).toBe(1);
        });
    });

    describe('updateUserMemory', () => {
        it('should add interaction to memory', async () => {
            const interaction = {
                type: 'chat',
                content: 'How much did I spend today?',
                sentiment: 'neutral'
            };

            const memory = await aiCFOService.updateUserMemory(mockUserId, interaction);
            expect(memory.interactions.length).toBeGreaterThan(0);
            expect(memory.interactions[memory.interactions.length - 1].content).toBe(interaction.content);
        });

        it('should limit interactions to 100', async () => {
            const memory = await aiCFOService.getUserMemory(mockUserId);
            
            // Add 150 interactions
            for (let i = 0; i < 150; i++) {
                await aiCFOService.updateUserMemory(mockUserId, {
                    type: 'chat',
                    content: `Message ${i}`,
                    sentiment: 'neutral'
                });
            }

            const updatedMemory = await UserMemory.findOne({ user: mockUserId });
            expect(updatedMemory.interactions.length).toBeLessThanOrEqual(100);
        });
    });

    describe('analyzeSpendingPatterns', () => {
        it('should return empty array with insufficient data', async () => {
            const patterns = await aiCFOService.analyzeSpendingPatterns(mockUserId);
            expect(patterns).toEqual([]);
        });

        it('should identify spending patterns', async () => {
            // Create mock expenses
            const expenses = [];
            for (let i = 0; i < 30; i++) {
                expenses.push({
                    user: mockUserId,
                    text: 'Lunch',
                    amount: 150 + Math.random() * 50,
                    category: 'Food',
                    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
                });
            }
            await Expense.insertMany(expenses);

            const patterns = await aiCFOService.analyzeSpendingPatterns(mockUserId);
            expect(patterns.length).toBeGreaterThan(0);
            expect(patterns[0].category).toBe('Food');
            expect(patterns[0].frequency).toBe('daily');
            expect(patterns[0].averageAmount).toBeGreaterThan(0);
        });
    });

    describe('getFinancialSnapshot', () => {
        it('should return financial snapshot', async () => {
            // Create mock data
            await Expense.create({
                user: mockUserId,
                text: 'Groceries',
                amount: 500,
                category: 'Food',
                date: new Date()
            });

            await Budget.create({
                user: mockUserId,
                category: 'Food',
                amount: 5000,
                period: 'monthly'
            });

            const snapshot = await aiCFOService.getFinancialSnapshot(mockUserId);
            expect(snapshot.monthlyExpenses).toBe(500);
            expect(snapshot.budgetStatus.Food).toBeDefined();
            expect(snapshot.budgetStatus.Food.spent).toBe(500);
            expect(snapshot.budgetStatus.Food.remaining).toBe(4500);
        });
    });

    describe('analyzeSentiment', () => {
        it('should detect positive sentiment', () => {
            const sentiment = aiCFOService.analyzeSentiment('This is great! Thank you!');
            expect(sentiment).toBe('positive');
        });

        it('should detect negative sentiment', () => {
            const sentiment = aiCFOService.analyzeSentiment('I am worried about my spending');
            expect(sentiment).toBe('negative');
        });

        it('should detect neutral sentiment', () => {
            const sentiment = aiCFOService.analyzeSentiment('How much did I spend?');
            expect(sentiment).toBe('neutral');
        });
    });

    describe('generateDailyBrief', () => {
        it('should generate daily brief with no data', async () => {
            const brief = await aiCFOService.generateDailyBrief(mockUserId);
            expect(brief).toBeDefined();
            expect(brief.summary).toBeDefined();
            expect(brief.financialHealthScore).toBeGreaterThanOrEqual(0);
            expect(brief.financialHealthScore).toBeLessThanOrEqual(100);
        });

        it('should generate daily brief with expenses and budgets', async () => {
            // Create expenses
            await Expense.create({
                user: mockUserId,
                text: 'Coffee',
                amount: 150,
                category: 'Food',
                date: new Date()
            });

            // Create budget
            await Budget.create({
                user: mockUserId,
                category: 'Food',
                amount: 5000,
                period: 'monthly'
            });

            const brief = await aiCFOService.generateDailyBrief(mockUserId);
            expect(brief.todaySpent).toBe(150);
            expect(brief.todaysBudget).toBeGreaterThan(0);
            expect(brief.alerts).toBeDefined();
            expect(brief.recommendations).toBeDefined();
        });

        it('should generate alerts for overspending', async () => {
            // Create budget
            await Budget.create({
                user: mockUserId,
                category: 'Entertainment',
                amount: 1000,
                period: 'monthly'
            });

            // Create expenses exceeding budget
            await Expense.create({
                user: mockUserId,
                text: 'Movie',
                amount: 950,
                category: 'Entertainment',
                date: new Date()
            });

            const brief = await aiCFOService.generateDailyBrief(mockUserId);
            expect(brief.alerts.length).toBeGreaterThan(0);
            expect(brief.alerts[0].type).toBe('danger');
        });
    });

    describe('shouldSpend', () => {
        it('should approve spending within budget', async () => {
            await Budget.create({
                user: mockUserId,
                category: 'Shopping',
                amount: 5000,
                period: 'monthly'
            });

            const decision = await aiCFOService.shouldSpend(mockUserId, 500, 'Shopping');
            expect(decision.approved).toBe(true);
            expect(decision.budgetImpact.percentageUsed).toBe(10);
        });

        it('should reject spending over budget', async () => {
            await Budget.create({
                user: mockUserId,
                category: 'Shopping',
                amount: 1000,
                period: 'monthly'
            });

            await Expense.create({
                user: mockUserId,
                text: 'Clothes',
                amount: 800,
                category: 'Shopping',
                date: new Date()
            });

            const decision = await aiCFOService.shouldSpend(mockUserId, 500, 'Shopping');
            expect(decision.approved).toBe(false);
            expect(decision.budgetImpact.percentageUsed).toBeGreaterThan(100);
        });

        it('should warn for spending near budget limit', async () => {
            await Budget.create({
                user: mockUserId,
                category: 'Transport',
                amount: 2000,
                period: 'monthly'
            });

            await Expense.create({
                user: mockUserId,
                text: 'Uber',
                amount: 1500,
                category: 'Transport',
                date: new Date()
            });

            const decision = await aiCFOService.shouldSpend(mockUserId, 400, 'Transport');
            expect(decision.approved).toBe(true);
            expect(decision.budgetImpact.percentageUsed).toBeGreaterThan(90);
            expect(decision.confidence).toBeLessThan(1.0);
        });

        it('should handle category without budget', async () => {
            const decision = await aiCFOService.shouldSpend(mockUserId, 500, 'Other');
            expect(decision.approved).toBe(true);
            expect(decision.reason).toContain('No budget set');
        });
    });

    describe('chat', () => {
        it('should create new conversation', async () => {
            const result = await aiCFOService.chat(mockUserId, 'Hello');
            expect(result.conversationId).toBeDefined();
            expect(result.message).toBeDefined();
        });

        it('should continue existing conversation', async () => {
            const conversation = await Conversation.create({
                user: mockUserId,
                title: 'Test Conversation',
                messages: [{
                    role: 'user',
                    content: 'Hello',
                    timestamp: new Date()
                }]
            });

            const result = await aiCFOService.chat(
                mockUserId,
                'How am I doing?',
                conversation._id.toString()
            );

            expect(result.conversationId.toString()).toBe(conversation._id.toString());
            
            const updatedConversation = await Conversation.findById(conversation._id);
            expect(updatedConversation.messages.length).toBeGreaterThan(1);
        });

        it('should use fallback when no API keys', async () => {
            // Temporarily remove API keys
            const originalOpenAI = aiCFOService.openai;
            const originalGemini = aiCFOService.gemini;
            aiCFOService.openai = null;
            aiCFOService.gemini = null;

            const result = await aiCFOService.chat(mockUserId, 'Hello');
            expect(result.message).toBeDefined();
            expect(result.model).toBe('fallback');

            // Restore
            aiCFOService.openai = originalOpenAI;
            aiCFOService.gemini = originalGemini;
        });
    });

    describe('caching', () => {
        it('should cache common queries', async () => {
            const result1 = await aiCFOService.chat(mockUserId, 'daily brief');
            const result2 = await aiCFOService.chat(mockUserId, 'daily brief');
            
            expect(result2.cached).toBe(true);
        });

        it('should invalidate cache after TTL', async () => {
            const cacheKey = aiCFOService.getCacheKey(mockUserId, 'spending summary');
            aiCFOService.cacheResponse(cacheKey, 'Test response');
            
            // Simulate TTL expiry
            const cached = aiCFOService.responseCache.get(cacheKey);
            cached.timestamp = Date.now() - (aiCFOService.CACHE_TTL + 1000);
            
            const result = aiCFOService.getCachedResponse(cacheKey);
            expect(result).toBeNull();
        });
    });
});
