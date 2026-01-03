const asyncHandler = require('express-async-handler');
const Loan = require('../models/loanModel');
const LendingBudget = require('../models/lendingBudgetModel');

// Exchange rates (INR base)
const exchangeRates = {
    USD: 83.00, EUR: 90.36, GBP: 65.57, JPY: 0.56, CAD: 112.05,
    AUD: 126.16, INR: 1, CNY: 597.60, BRL: 410.85, MXN: 1411.00
};

// @desc    Get all loans
// @route   GET /api/loans
// @access  Private
const getLoans = asyncHandler(async (req, res) => {
    const loans = await Loan.find({ user: req.user.id }).sort({ dateGiven: -1 });
    res.status(200).json(loans);
});

// @desc    Create loan
// @route   POST /api/loans
// @access  Private
const createLoan = asyncHandler(async (req, res) => {
    const { friendName, amount, currency, type, description, expectedReturnDate, notes } = req.body;

    if (!friendName || !amount || !type) {
        res.status(400);
        throw new Error('Please provide friend name, amount, and type (given/received)');
    }

    // Check monthly lending budget if giving money
    if (type === 'given') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get or create lending budget
        let lendingBudget = await LendingBudget.findOne({ user: req.user.id });
        if (!lendingBudget) {
            lendingBudget = await LendingBudget.create({
                user: req.user.id,
                monthlyLimit: 10000,
                currency: 'INR'
            });
        }

        // Calculate total given this month
        const loansThisMonth = await Loan.find({
            user: req.user.id,
            type: 'given',
            dateGiven: { $gte: startOfMonth }
        });

        const totalGivenThisMonth = loansThisMonth.reduce((sum, loan) => {
            const rate = exchangeRates[loan.currency || 'INR'] || 1;
            return sum + (loan.amount * rate);
        }, 0);

        // Convert new loan amount to INR
        const loanRate = exchangeRates[currency || 'INR'] || 1;
        const newLoanInINR = amount * loanRate;
        const totalAfterThisLoan = totalGivenThisMonth + newLoanInINR;

        // Check if exceeds budget (unless forced)
        if (totalAfterThisLoan > lendingBudget.monthlyLimit && !req.body.force) {
            res.status(200).json({
                loan: null,
                warning: true,
                message: `⚠️ Monthly lending budget exceeded! You've given ₹${totalGivenThisMonth.toFixed(2)} this month (limit: ₹${lendingBudget.monthlyLimit.toFixed(2)}). This loan would make it ₹${totalAfterThisLoan.toFixed(2)}.`,
                totalGiven: totalGivenThisMonth,
                limit: lendingBudget.monthlyLimit,
                wouldExceed: true
            });
            return;
        }
    }

    const loan = await Loan.create({
        user: req.user.id,
        friendName,
        amount,
        currency: currency || 'INR',
        type,
        description: description || '',
        expectedReturnDate: expectedReturnDate || null,
        notes: notes || '',
        remainingAmount: amount // Initialize remaining amount to full amount
    });

    res.status(201).json({
        loan,
        warning: false,
        message: 'Loan recorded successfully'
    });
});

// @desc    Add partial payment to loan
// @route   POST /api/loans/:id/partial-payment
// @access  Private
const addPartialPayment = asyncHandler(async (req, res) => {
    const { amount, notes } = req.body;
    
    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Please provide a valid payment amount');
    }

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
        res.status(404);
        throw new Error('Loan not found');
    }

    if (loan.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (loan.isPaidBack) {
        res.status(400);
        throw new Error('Loan is already fully paid');
    }

    // Convert payment amount to loan currency if needed
    const paymentRate = exchangeRates[req.body.currency || loan.currency || 'INR'] || 1;
    const loanRate = exchangeRates[loan.currency || 'INR'] || 1;
    const paymentInLoanCurrency = (amount * paymentRate) / loanRate;

    if (paymentInLoanCurrency > loan.remainingAmount) {
        res.status(400);
        throw new Error(`Payment amount (₹${(paymentInLoanCurrency * loanRate).toFixed(2)}) exceeds remaining amount (₹${(loan.remainingAmount * loanRate).toFixed(2)})`);
    }

    try {
        loan.addPartialPayment(paymentInLoanCurrency, notes || '');
        await loan.save();

        const message = loan.isPaidBack 
            ? (loan.isReturnedOnTime 
                ? '✅ Fully paid! Money returned on time (within 2 months)!' 
                : '✅ Fully paid! (but after 2 months)')
            : `Partial payment of ₹${(paymentInLoanCurrency * loanRate).toFixed(2)} added. Remaining: ₹${(loan.remainingAmount * loanRate).toFixed(2)}`;

        res.status(200).json({
            ...loan.toObject(),
            message
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Mark loan as paid back
// @route   PUT /api/loans/:id/return
// @access  Private
const markAsPaid = asyncHandler(async (req, res) => {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
        res.status(404);
        throw new Error('Loan not found');
    }

    if (loan.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    // If there's remaining amount, mark the rest as paid
    if (loan.remainingAmount > 0) {
        loan.addPartialPayment(loan.remainingAmount, 'Marked as fully paid');
    } else {
        // Check if returned within 2 months
        const twoMonthsFromGiven = new Date(loan.dateGiven);
        twoMonthsFromGiven.setMonth(twoMonthsFromGiven.getMonth() + 2);
        const isReturnedOnTime = new Date() <= twoMonthsFromGiven;

        loan.isPaidBack = true;
        loan.dateReturned = new Date();
        loan.isReturnedOnTime = isReturnedOnTime;
    }
    
    await loan.save();

    const message = loan.isReturnedOnTime 
        ? '✅ Money returned on time (within 2 months)!' 
        : 'Money returned (but after 2 months)';

    res.status(200).json({
        ...loan.toObject(),
        message
    });
});

// @desc    Update loan
// @route   PUT /api/loans/:id
// @access  Private
const updateLoan = asyncHandler(async (req, res) => {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
        res.status(404);
        throw new Error('Loan not found');
    }

    if (loan.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const updatedLoan = await Loan.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });

    res.status(200).json(updatedLoan);
});

// @desc    Delete loan
// @route   DELETE /api/loans/:id
// @access  Private
const deleteLoan = asyncHandler(async (req, res) => {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
        res.status(404);
        throw new Error('Loan not found');
    }

    if (loan.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    await loan.deleteOne();
    res.status(200).json({ id: req.params.id });
});

// @desc    Get loan statistics
// @route   GET /api/loans/stats
// @access  Private
const getLoanStats = asyncHandler(async (req, res) => {
    const loans = await Loan.find({ user: req.user.id });

    const pendingGiven = loans.filter(l => l.type === 'given' && !l.isPaidBack);
    const pendingReceived = loans.filter(l => l.type === 'received' && !l.isPaidBack);
    const paidBack = loans.filter(l => l.isPaidBack);
    const returnedOnTime = loans.filter(l => l.isReturnedOnTime);

    const totalPendingGiven = pendingGiven.reduce((sum, loan) => {
        const rate = exchangeRates[loan.currency || 'INR'] || 1;
        const remaining = loan.remainingAmount !== undefined ? loan.remainingAmount : loan.amount;
        return sum + (remaining * rate);
    }, 0);

    const totalPendingReceived = pendingReceived.reduce((sum, loan) => {
        const rate = exchangeRates[loan.currency || 'INR'] || 1;
        return sum + (loan.amount * rate);
    }, 0);

    // Monthly lending stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const loansThisMonth = await Loan.find({
        user: req.user.id,
        type: 'given',
        dateGiven: { $gte: startOfMonth }
    });

    const totalGivenThisMonth = loansThisMonth.reduce((sum, loan) => {
        const rate = exchangeRates[loan.currency || 'INR'] || 1;
        return sum + (loan.amount * rate);
    }, 0);

    const lendingBudget = await LendingBudget.findOne({ user: req.user.id });
    const monthlyLimit = lendingBudget?.monthlyLimit || 10000;

    res.status(200).json({
        totalPendingGiven,
        totalPendingReceived,
        pendingCount: pendingGiven.length + pendingReceived.length,
        paidBackCount: paidBack.length,
        returnedOnTimeCount: returnedOnTime.length,
        totalGivenThisMonth,
        monthlyLimit,
        budgetPercentage: (totalGivenThisMonth / monthlyLimit) * 100,
        friendsOwing: pendingGiven.map(l => {
            const rate = exchangeRates[l.currency || 'INR'] || 1;
            const remaining = l.remainingAmount !== undefined ? l.remainingAmount : l.amount;
            return {
                name: l.friendName,
                amount: remaining * rate,
                originalAmount: l.amount * rate,
                currency: l.currency || 'INR',
                date: l.dateGiven,
                hasPartialPayments: l.partialPayments && l.partialPayments.length > 0
            };
        })
    });
});

module.exports = {
    getLoans,
    createLoan,
    markAsPaid,
    addPartialPayment,
    updateLoan,
    deleteLoan,
    getLoanStats
};

