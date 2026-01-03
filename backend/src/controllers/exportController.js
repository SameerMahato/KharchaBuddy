const asyncHandler = require('express-async-handler');
const Expense = require('../models/expenseModel');

// @desc    Export expenses as CSV
// @route   GET /api/export/csv
// @access  Private
const exportCSV = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
    
    // CSV header
    let csv = 'Date,Description,Amount,Category,Recurring\n';
    
    // CSV rows
    expenses.forEach(expense => {
        const date = new Date(expense.date).toLocaleDateString();
        const text = `"${expense.text.replace(/"/g, '""')}"`;
        const amount = expense.amount;
        const category = expense.category || 'Other';
        const recurring = expense.isRecurring ? 'Yes' : 'No';
        csv += `${date},${text},${amount},${category},${recurring}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.status(200).send(csv);
});

// @desc    Get export summary
// @route   GET /api/export/summary
// @access  Private
const getExportSummary = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({ user: req.user.id });
    
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryTotals = expenses.reduce((acc, e) => {
        const cat = e.category || 'Other';
        acc[cat] = (acc[cat] || 0) + e.amount;
        return acc;
    }, {});
    
    res.status(200).json({
        totalExpenses: expenses.length,
        totalAmount: total,
        categoryTotals,
        dateRange: {
            earliest: expenses.length > 0 ? expenses[expenses.length - 1].date : null,
            latest: expenses.length > 0 ? expenses[0].date : null
        }
    });
});

module.exports = {
    exportCSV,
    getExportSummary
};

