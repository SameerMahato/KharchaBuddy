const asyncHandler = require('express-async-handler');
const Expense = require('../models/expenseModel');

// @desc    Get expense analytics
// @route   GET /api/analytics
// @access  Private
const getAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { period = 'month' } = req.query; // month, week, year

    // Calculate date range
    const now = new Date();
    let startDate;
    if (period === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'year') {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    } else {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const expenses = await Expense.find({
        user: userId,
        date: { $gte: startDate }
    });

    // Calculate totals (convert all to INR for consistency)
    const exchangeRates = {
        USD: 83.00, EUR: 90.36, GBP: 65.57, JPY: 0.56, CAD: 112.05,
        AUD: 126.16, INR: 1, CNY: 597.60, BRL: 410.85, MXN: 1411.00
    };

    const total = expenses.reduce((sum, e) => {
        const rate = exchangeRates[e.currency || 'INR'] || 1;
        return sum + (e.amount * rate);
    }, 0);
    const avgExpense = expenses.length > 0 ? total / expenses.length : 0;

    // Category breakdown (in INR)
    const categoryBreakdown = expenses.reduce((acc, expense) => {
        const cat = expense.category || 'Other';
        const rate = exchangeRates[expense.currency || 'INR'] || 1;
        acc[cat] = (acc[cat] || 0) + (expense.amount * rate);
        return acc;
    }, {});

    // Daily spending trend (in INR)
    const dailyTrend = expenses.reduce((acc, expense) => {
        const date = new Date(expense.date).toISOString().split('T')[0];
        const rate = exchangeRates[expense.currency || 'INR'] || 1;
        acc[date] = (acc[date] || 0) + (expense.amount * rate);
        return acc;
    }, {});

    // Monthly spending trend (in INR)
    const monthlyTrend = expenses.reduce((acc, expense) => {
        const d = new Date(expense.date);
        const monthYear = d.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g., "Jan 2024"
        const rate = exchangeRates[expense.currency || 'INR'] || 1;

        // Initialize if not exists
        if (!acc[monthYear]) {
            acc[monthYear] = { name: d.toLocaleString('default', { month: 'short' }), income: 0, expense: 0, year: d.getFullYear(), monthIdx: d.getMonth() };
        }
        acc[monthYear].expense += (expense.amount * rate);
        return acc;
    }, {});

    // Convert object to sorted array
    const monthlyTrendArray = Object.values(monthlyTrend).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIdx - b.monthIdx;
    });

    // Top expenses (convert to INR for comparison)
    const topExpenses = expenses
        .map(e => {
            const rate = exchangeRates[e.currency || 'INR'] || 1;
            return { ...e.toObject(), inrAmount: e.amount * rate };
        })
        .sort((a, b) => b.inrAmount - a.inrAmount)
        .slice(0, 5)
        .map(e => ({
            text: e.text,
            amount: e.inrAmount,
            originalAmount: e.amount,
            currency: e.currency || 'INR',
            date: e.date
        }));

    res.status(200).json({
        total,
        avgExpense,
        count: expenses.length,
        categoryBreakdown,
        dailyTrend,
        topExpenses,
        monthlyTrend: monthlyTrendArray,
        period
    });
});

module.exports = { getAnalytics };
