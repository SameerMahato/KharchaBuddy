const asyncHandler = require('express-async-handler');
const aiCFOService = require('../services/aiCFOService');

// @desc    Chat with AI CFO (streaming)
// @route   POST /api/ai-cfo/chat/stream
// @access  Private
const chatStream = asyncHandler(async (req, res) => {
    const { message, conversationId } = req.body;

    if (!message || message.trim().length === 0) {
        res.status(400);
        throw new Error('Message is required');
    }

    if (message.length > 1000) {
        res.status(400);
        throw new Error('Message is too long (max 1000 characters)');
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const result = await aiCFOService.chatStream(
            req.user.id,
            message,
            conversationId,
            (chunk) => {
                // Send chunk as SSE
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
        );

        // Send final metadata
        res.write(`data: ${JSON.stringify({ 
            done: true, 
            conversationId: result.conversationId,
            model: result.model
        })}\n\n`);
        
        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

// @desc    Chat with AI CFO
// @route   POST /api/ai-cfo/chat
// @access  Private
const chat = asyncHandler(async (req, res) => {
    const { message, conversationId } = req.body;

    if (!message || message.trim().length === 0) {
        res.status(400);
        throw new Error('Message is required');
    }

    if (message.length > 1000) {
        res.status(400);
        throw new Error('Message is too long (max 1000 characters)');
    }

    const result = await aiCFOService.chat(req.user.id, message, conversationId);

    res.status(200).json({
        success: true,
        data: result
    });
});

// @desc    Get daily financial brief
// @route   GET /api/ai-cfo/daily-brief
// @access  Private
const getDailyBrief = asyncHandler(async (req, res) => {
    const brief = await aiCFOService.generateDailyBrief(req.user.id);

    res.status(200).json({
        success: true,
        data: brief
    });
});

// @desc    Get spending decision advice
// @route   POST /api/ai-cfo/should-spend
// @access  Private
const shouldSpend = asyncHandler(async (req, res) => {
    const { amount, category, description } = req.body;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Valid amount is required');
    }

    if (!category) {
        res.status(400);
        throw new Error('Category is required');
    }

    const decision = await aiCFOService.shouldSpend(
        req.user.id,
        amount,
        category,
        description
    );

    res.status(200).json({
        success: true,
        data: decision
    });
});

// @desc    Get conversation history
// @route   GET /api/ai-cfo/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const conversations = await aiCFOService.getConversations(req.user.id, limit);

    res.status(200).json({
        success: true,
        data: conversations
    });
});

// @desc    Get specific conversation
// @route   GET /api/ai-cfo/conversations/:id
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
    const conversation = await aiCFOService.getConversation(req.user.id, req.params.id);

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    res.status(200).json({
        success: true,
        data: conversation
    });
});

// @desc    Archive conversation
// @route   PUT /api/ai-cfo/conversations/:id/archive
// @access  Private
const archiveConversation = asyncHandler(async (req, res) => {
    const conversation = await aiCFOService.archiveConversation(req.user.id, req.params.id);

    res.status(200).json({
        success: true,
        data: conversation
    });
});

// @desc    Get user memory and patterns
// @route   GET /api/ai-cfo/memory
// @access  Private
const getUserMemory = asyncHandler(async (req, res) => {
    const memory = await aiCFOService.getUserMemory(req.user.id);

    res.status(200).json({
        success: true,
        data: {
            spendingPatterns: memory.spendingPatterns,
            personality: memory.personality,
            recentInteractions: memory.interactions.slice(-10),
            lastUpdated: memory.lastUpdated
        }
    });
});

// @desc    Update spending patterns
// @route   POST /api/ai-cfo/analyze-patterns
// @access  Private
const analyzePatterns = asyncHandler(async (req, res) => {
    const patterns = await aiCFOService.analyzeSpendingPatterns(req.user.id);

    res.status(200).json({
        success: true,
        data: patterns
    });
});

// @desc    Provide feedback on AI response
// @route   POST /api/ai-cfo/feedback
// @access  Private
const provideFeedback = asyncHandler(async (req, res) => {
    const { conversationId, messageId, feedback, comment } = req.body;

    if (!conversationId || !messageId || !feedback) {
        res.status(400);
        throw new Error('conversationId, messageId, and feedback are required');
    }

    if (!['positive', 'negative'].includes(feedback)) {
        res.status(400);
        throw new Error('feedback must be "positive" or "negative"');
    }

    const conversation = await aiCFOService.getConversation(req.user.id, conversationId);
    
    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    const message = conversation.messages.id(messageId);
    
    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    message.feedback = feedback;
    if (comment) {
        message.feedbackComment = comment;
    }

    await conversation.save();

    res.status(200).json({
        success: true,
        message: 'Feedback recorded'
    });
});

module.exports = {
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
};
