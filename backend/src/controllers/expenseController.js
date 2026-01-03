const asyncHandler = require('express-async-handler');
const Expense = require('../models/expenseModel');
const User = require('../models/userModel');
const OpenAI = require('openai');

// @desc    Get expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({ user: req.user.id });
    res.status(200).json(expenses);
});

// @desc    Set expense
// @route   POST /api/expenses
// @access  Private
const addExpense = asyncHandler(async (req, res) => {
    if (!req.body.text || !req.body.amount) {
        res.status(400);
        throw new Error('Please add a text and amount');
    }

    let category = req.body.category || 'Other';
    let isRecurring = req.body.isRecurring || false;
    
    // Auto-categorize using AI if OpenAI is available
    if (process.env.OPENAI_API_KEY && !req.body.category) {
        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const prompt = `Categorize this expense into one of these categories: Food, Transport, Shopping, Bills, Entertainment, Healthcare, Education, Travel, Other. Expense: "${req.body.text}". Respond with only the category name.`;
            
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 10,
                temperature: 0.3
            });
            
            const aiCategory = completion.choices[0].message.content.trim();
            const validCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Travel', 'Other'];
            if (validCategories.includes(aiCategory)) {
                category = aiCategory;
            }
        } catch (error) {
            console.log('AI categorization failed, using default');
        }
    }
    
    // Detect recurring expenses
    if (!req.body.isRecurring) {
        const recentExpenses = await Expense.find({
            user: req.user.id,
            text: { $regex: new RegExp(req.body.text, 'i') },
            date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
        }).sort({ date: -1 });
        
        if (recentExpenses.length >= 2) {
            isRecurring = true;
        }
    }

    const expense = await Expense.create({
        text: req.body.text,
        amount: req.body.amount,
        category,
        isRecurring,
        currency: req.body.currency || 'INR',
        exchangeRate: req.body.exchangeRate || 1,
        user: req.user.id
    });

    res.status(200).json(expense);
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        res.status(400);
        throw new Error('Expense not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the expense user
    if (expense.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedExpense);
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        res.status(400);
        throw new Error('Expense not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the expense user
    if (expense.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await expense.deleteOne();

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getExpenses,
    addExpense,
    updateExpense,
    deleteExpense
};
