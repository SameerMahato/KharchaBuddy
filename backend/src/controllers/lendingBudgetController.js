const asyncHandler = require('express-async-handler');
const LendingBudget = require('../models/lendingBudgetModel');

// @desc    Get lending budget
// @route   GET /api/lending-budget
// @access  Private
const getLendingBudget = asyncHandler(async (req, res) => {
    let budget = await LendingBudget.findOne({ user: req.user.id });
    
    if (!budget) {
        budget = await LendingBudget.create({
            user: req.user.id,
            monthlyLimit: 10000,
            currency: 'INR'
        });
    }
    
    res.status(200).json(budget);
});

// @desc    Update lending budget
// @route   PUT /api/lending-budget
// @access  Private
const updateLendingBudget = asyncHandler(async (req, res) => {
    let budget = await LendingBudget.findOne({ user: req.user.id });
    
    if (!budget) {
        budget = await LendingBudget.create({
            user: req.user.id,
            monthlyLimit: req.body.monthlyLimit || 10000,
            currency: req.body.currency || 'INR'
        });
    } else {
        budget.monthlyLimit = req.body.monthlyLimit || budget.monthlyLimit;
        budget.currency = req.body.currency || budget.currency;
        await budget.save();
    }
    
    res.status(200).json(budget);
});

module.exports = {
    getLendingBudget,
    updateLendingBudget
};

