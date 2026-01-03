const asyncHandler = require('express-async-handler');
const OpenAI = require('openai');
const Expense = require('../models/expenseModel');

// @desc    Analyze expenses and get insights
// @route   POST /api/ai/analyze
// @access  Private
const getInsights = asyncHandler(async (req, res) => {
    // 1. Fetch user expenses
    const expenses = await Expense.find({ user: req.user.id });

    if (!expenses || expenses.length === 0) {
        res.status(200).json({ message: "No expenses to analyze yet. Add some spending!" });
        return;
    }

    // Prepare data for prompt
    const expenseData = expenses.map(e => `${e.text}: $${e.amount} on ${e.date.toDateString()}`).join('\n');

    // 2. Check for API Key
    if (!process.env.OPENAI_API_KEY) {
        res.status(200).json({
            message: "I see you're tracking your expenses! (Mock Analysis: Add OPENAI_API_KEY to .env for real AI advice).\n\n1. Great job tracking!\n2. Consider setting a budget.\n3. Watch out for recurring subscriptions."
        });
        return;
    }

    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const prompt = `You are a helpful financial assistant. Analyze the following expenses and provide 3 brief, actionable tips to save money or improve spending habits:\n\n${expenseData}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful financial assistant that provides concise, actionable advice."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 300,
            temperature: 0.7
        });

        const text = completion.choices[0].message.content;
        res.status(200).json({ message: text });
    } catch (error) {
        console.error("OpenAI Error:", error.message);
        
        // Provide intelligent mock insights based on actual expense data
        const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
        const avgAmount = totalAmount / expenses.length;
        const categories = [...new Set(expenses.map(e => e.text.toLowerCase()))];
        
        let mockInsights = `Based on your ${expenses.length} expense${expenses.length > 1 ? 's' : ''} (Total: $${totalAmount.toFixed(2)}):\n\n`;
        mockInsights += `1. Your average expense is $${avgAmount.toFixed(2)}. Consider tracking which categories take up most of your budget.\n\n`;
        mockInsights += `2. You have ${categories.length} different expense categories. Review recurring subscriptions and eliminate unused services.\n\n`;
        mockInsights += `3. Set a monthly budget target and track your progress. Aim to save at least 20% of your income.\n\n`;
        mockInsights += `\n(Note: AI service unavailable. Please check your OpenAI API key.)`;
        
        res.status(200).json({ message: mockInsights });
    }
});

module.exports = {
    getInsights
};
