const express = require('express');
const router = express.Router();
const {
    chat,
    chatStream,
    getDailyBrief,
    shouldSpend,
    getConversations,
    getConversation,
    archiveConversation,
    getUserMemory,
    analyzePatterns,
    provideFeedback
} = require('../controllers/aiCFOController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Chat endpoints
router.post('/chat', chat);
router.post('/chat/stream', chatStream);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.put('/conversations/:id/archive', archiveConversation);
router.post('/feedback', provideFeedback);

// Daily brief
router.get('/daily-brief', getDailyBrief);

// Spending decision
router.post('/should-spend', shouldSpend);

// User memory and patterns
router.get('/memory', getUserMemory);
router.post('/analyze-patterns', analyzePatterns);

module.exports = router;
