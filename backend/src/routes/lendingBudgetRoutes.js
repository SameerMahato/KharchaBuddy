const express = require('express');
const router = express.Router();
const { getLendingBudget, updateLendingBudget } = require('../controllers/lendingBudgetController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getLendingBudget).put(protect, updateLendingBudget);

module.exports = router;

