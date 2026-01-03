const express = require('express');
const router = express.Router();
const { getInsights } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, getInsights);

module.exports = router;
