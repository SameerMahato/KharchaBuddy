const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['user', 'assistant', 'system']
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    tokens: {
        type: Number
    },
    model: {
        type: String
    },
    actions: [{
        type: {
            type: String
        },
        label: String,
        data: mongoose.Schema.Types.Mixed
    }],
    feedback: {
        type: String,
        enum: ['positive', 'negative']
    },
    feedbackComment: {
        type: String
    }
}, { _id: true });

const conversationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        default: 'New Conversation'
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    },
    messages: [messageSchema],
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
conversationSchema.index({ user: 1, status: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
