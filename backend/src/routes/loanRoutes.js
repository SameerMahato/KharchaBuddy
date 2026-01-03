const express = require('express');
const router = express.Router();
const { getLoans, createLoan, markAsPaid, addPartialPayment, updateLoan, deleteLoan, getLoanStats } = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getLoans).post(protect, createLoan);
router.get('/stats', protect, getLoanStats);
router.post('/:id/partial-payment', protect, addPartialPayment);
router.put('/:id/return', protect, markAsPaid);
router.route('/:id').put(protect, updateLoan).delete(protect, deleteLoan);

module.exports = router;

