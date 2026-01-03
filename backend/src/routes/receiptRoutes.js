const express = require('express');
const router = express.Router();
const { uploadReceipt } = require('../controllers/receiptController');
const { protect } = require('../middleware/authMiddleware');

router.post('/upload', protect, uploadReceipt);

module.exports = router;

