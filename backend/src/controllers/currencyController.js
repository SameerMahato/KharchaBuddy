const asyncHandler = require('express-async-handler');

// Simple exchange rates (in production, use a real API)
// Rates are relative to USD, then converted to INR base
const exchangeRates = {
    USD: 83.00,  // 1 USD = 83 INR
    EUR: 90.36,  // 1 EUR = 90.36 INR (0.92 * 83)
    GBP: 65.57,  // 1 GBP = 65.57 INR (0.79 * 83)
    JPY: 0.56,   // 1 JPY = 0.56 INR (149.50 / 83)
    CAD: 112.05, // 1 CAD = 112.05 INR (1.35 * 83)
    AUD: 126.16, // 1 AUD = 126.16 INR (1.52 * 83)
    INR: 1,      // Base currency
    CNY: 597.60, // 1 CNY = 597.60 INR (7.20 * 83)
    BRL: 410.85, // 1 BRL = 410.85 INR (4.95 * 83)
    MXN: 1411.00 // 1 MXN = 1411.00 INR (17.00 * 83)
};

// @desc    Get exchange rates
// @route   GET /api/currency/rates
// @access  Private
const getExchangeRates = asyncHandler(async (req, res) => {
    res.status(200).json(exchangeRates);
});

// @desc    Convert amount between currencies
// @route   POST /api/currency/convert
// @access  Private
const convertCurrency = asyncHandler(async (req, res) => {
    const { amount, from, to } = req.body;
    
    if (!amount || !from || !to) {
        res.status(400);
        throw new Error('Please provide amount, from, and to currencies');
    }

    if (!exchangeRates[from] || !exchangeRates[to]) {
        res.status(400);
        throw new Error('Invalid currency');
    }

    // Convert to INR first (base), then to target currency
    const inrAmount = amount * exchangeRates[from];
    const convertedAmount = inrAmount / exchangeRates[to];

    res.status(200).json({
        originalAmount: amount,
        originalCurrency: from,
        convertedAmount: convertedAmount.toFixed(2),
        targetCurrency: to,
        exchangeRate: exchangeRates[to] / exchangeRates[from]
    });
});

module.exports = {
    getExchangeRates,
    convertCurrency
};

