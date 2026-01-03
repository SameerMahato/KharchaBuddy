const asyncHandler = require('express-async-handler');
const Budget = require('../models/budgetModel');
const Expense = require('../models/expenseModel');

// Exchange rates for currency conversion (INR base)
const exchangeRates = {
    USD: 83.00, EUR: 90.36, GBP: 65.57, JPY: 0.56, CAD: 112.05,
    AUD: 126.16, INR: 1, CNY: 597.60, BRL: 410.85, MXN: 1411.00
};

// @desc    Get budgets
// @route   GET /api/budgets
// @access  Private
const getBudgets = asyncHandler(async (req, res) => {
    const budgets = await Budget.find({ user: req.user.id });
    
    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(
        budgets.map(async (budget) => {
            const now = new Date();
            let startDate = new Date(budget.startDate);
            
            // Calculate period start based on budget period
            if (budget.period === 'weekly') {
                const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
                startDate = new Date(now.setDate(now.getDate() - (daysSinceStart % 7)));
            } else if (budget.period === 'monthly') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else {
                startDate = new Date(now.getFullYear(), 0, 1);
            }
            
            const expenses = await Expense.find({
                user: req.user.id,
                category: budget.category,
                date: { $gte: startDate }
            });
            
            // Convert all expenses to INR for budget comparison
            const spent = expenses.reduce((sum, e) => {
                const rate = exchangeRates[e.currency || 'INR'] || 1;
                return sum + (e.amount * rate);
            }, 0);
            const remaining = budget.amount - spent;
            const percentage = (spent / budget.amount) * 100;
            
            return {
                ...budget.toObject(),
                spent,
                remaining,
                percentage: Math.min(100, Math.max(0, percentage))
            };
        })
    );
    
    res.status(200).json(budgetsWithSpending);
});

// @desc    Create budget
// @route   POST /api/budgets
// @access  Private
const createBudget = asyncHandler(async (req, res) => {
    const { category, amount, period } = req.body;
    
    if (!category || !amount) {
        res.status(400);
        throw new Error('Please provide category and amount');
    }
    
    const budget = await Budget.create({
        user: req.user.id,
        category,
        amount,
        period: period || 'monthly'
    });
    
    res.status(201).json(budget);
});

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = asyncHandler(async (req, res) => {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
        res.status(404);
        throw new Error('Budget not found');
    }
    
    if (budget.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }
    
    const updatedBudget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    
    res.status(200).json(updatedBudget);
});

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = asyncHandler(async (req, res) => {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
        res.status(404);
        throw new Error('Budget not found');
    }
    
    if (budget.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }
    
    await budget.deleteOne();
    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getBudgets,
    createBudget,
    updateBudget,
    deleteBudget
};

