const express = require('express');
const router = express.Router();
const { getExchangeRates, convertCurrency } = require('../controllers/currencyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/rates', protect, getExchangeRates);
router.post('/convert', protect, convertCurrency);

module.exports = router;

