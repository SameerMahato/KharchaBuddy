const asyncHandler = require('express-async-handler');
const Budget = require('../models/budgetModel');
const Expense = require('../models/expenseModel');
const Loan = require('../models/loanModel');
const LendingBudget = require('../models/lendingBudgetModel');

// Exchange rates for currency conversion (INR base)
const exchangeRates = {
    USD: 83.00, EUR: 90.36, GBP: 65.57, JPY: 0.56, CAD: 112.05,
    AUD: 126.16, INR: 1, CNY: 597.60, BRL: 410.85, MXN: 1411.00
};

// @desc    Get spending alerts
// @route   GET /api/alerts
// @access  Private
const getAlerts = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const alerts = [];

    // Get all budgets
    const budgets = await Budget.find({ user: userId });

    for (const budget of budgets) {
        const now = new Date();
        let startDate = new Date(budget.startDate);
        
        // Calculate period start
        if (budget.period === 'weekly') {
            const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
            startDate = new Date(now.setDate(now.getDate() - (daysSinceStart % 7)));
        } else if (budget.period === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            startDate = new Date(now.getFullYear(), 0, 1);
        }
        
        const expenses = await Expense.find({
            user: userId,
            category: budget.category,
            date: { $gte: startDate }
        });
        
        // Convert all expenses to INR for budget comparison
        const spent = expenses.reduce((sum, e) => {
            const rate = exchangeRates[e.currency || 'INR'] || 1;
            return sum + (e.amount * rate);
        }, 0);
        const percentage = (spent / budget.amount) * 100;
        const remaining = budget.amount - spent;

        // Generate alerts
        if (percentage >= 100) {
            alerts.push({
                type: 'danger',
                category: budget.category,
                message: `Budget exceeded! You've spent ₹${spent.toFixed(2)} of ₹${budget.amount.toFixed(2)}`,
                percentage: percentage.toFixed(1)
            });
        } else if (percentage >= 80) {
            alerts.push({
                type: 'warning',
                category: budget.category,
                message: `Budget warning: ${percentage.toFixed(1)}% used. ₹${remaining.toFixed(2)} remaining`,
                percentage: percentage.toFixed(1)
            });
        } else if (percentage >= 50 && remaining < 100) {
            alerts.push({
                type: 'info',
                category: budget.category,
                message: `${percentage.toFixed(1)}% of budget used. ₹${remaining.toFixed(2)} remaining`,
                percentage: percentage.toFixed(1)
            });
        }
    }

    // Check for high spending days (threshold in INR: ₹2000)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayExpenses = await Expense.find({
        user: userId,
        date: { $gte: today }
    });
    
    const todayTotal = todayExpenses.reduce((sum, e) => {
        const rate = exchangeRates[e.currency || 'INR'] || 1;
        return sum + (e.amount * rate);
    }, 0);
    if (todayTotal > 2000) {
        alerts.push({
            type: 'warning',
            category: 'Daily Spending',
            message: `High spending today: ₹${todayTotal.toFixed(2)}`,
            percentage: null
        });
    }

    // Check lending budget
    const lendingBudget = await LendingBudget.findOne({ user: userId });
    if (lendingBudget) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const loansThisMonth = await Loan.find({
            user: userId,
            type: 'given',
            dateGiven: { $gte: startOfMonth }
        });

        const totalGivenThisMonth = loansThisMonth.reduce((sum, loan) => {
            const rate = exchangeRates[loan.currency || 'INR'] || 1;
            return sum + (loan.amount * rate);
        }, 0);

        const percentage = (totalGivenThisMonth / lendingBudget.monthlyLimit) * 100;

        if (percentage >= 100) {
            alerts.push({
                type: 'danger',
                category: 'Lending Budget',
                message: `⚠️ Monthly lending budget exceeded! You've given ₹${totalGivenThisMonth.toFixed(2)} (limit: ₹${lendingBudget.monthlyLimit.toFixed(2)})`,
                percentage: percentage.toFixed(1)
            });
        } else if (percentage >= 80) {
            alerts.push({
                type: 'warning',
                category: 'Lending Budget',
                message: `Lending budget warning: ${percentage.toFixed(1)}% used. ₹${(lendingBudget.monthlyLimit - totalGivenThisMonth).toFixed(2)} remaining`,
                percentage: percentage.toFixed(1)
            });
        }
    }

    // Check pending loans
    const pendingLoans = await Loan.find({
        user: userId,
        type: 'given',
        isPaidBack: false
    });

    const totalPending = pendingLoans.reduce((sum, loan) => {
        const rate = exchangeRates[loan.currency || 'INR'] || 1;
        return sum + (loan.amount * rate);
    }, 0);

    if (totalPending > 0) {
        alerts.push({
            type: 'info',
            category: 'Pending Loans',
            message: `You have ₹${totalPending.toFixed(2)} pending from ${pendingLoans.length} friend(s)`,
            percentage: null
        });
    }

    res.status(200).json({ alerts, count: alerts.length });
});

module.exports = { getAlerts };

