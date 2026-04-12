const mongoose = require('mongoose');

const spendingPatternSchema = mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'occasional'],
        required: true
    },
    averageAmount: {
        type: Number,
        required: true
    },
    timeOfDay: String,
    dayOfWeek: String,
    seasonality: String
}, { _id: false });

const userPreferenceSchema = mongoose.Schema({
    key: {
        type: String,
        required: true
    },
    value: mongoose.Schema.Types.Mixed,
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
    },
    learnedFrom: [String],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const interactionSchema = mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['chat', 'decision', 'feedback', 'action'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    outcome: String,
    sentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative']
    }
}, { _id: false });

const financialPersonalitySchema = mongoose.Schema({
    spendingStyle: {
        type: String,
        enum: ['frugal', 'balanced', 'liberal'],
        default: 'balanced'
    },
    planningHorizon: {
        type: String,
        enum: ['short', 'medium', 'long'],
        default: 'medium'
    },
    riskTolerance: {
        type: String,
        enum: ['conservative', 'moderate', 'aggressive'],
        default: 'moderate'
    },
    decisionMaking: {
        type: String,
        enum: ['analytical', 'intuitive', 'mixed'],
        default: 'mixed'
    },
    financialLiteracy: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    }
}, { _id: false });

const userMemorySchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    spendingPatterns: [spendingPatternSchema],
    preferences: [userPreferenceSchema],
    interactions: [interactionSchema],
    personality: {
        type: financialPersonalitySchema,
        default: () => ({})
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
userMemorySchema.index({ user: 1 });

// Limit interactions to last 100
userMemorySchema.pre('save', function(next) {
    if (this.interactions && this.interactions.length > 100) {
        this.interactions = this.interactions.slice(-100);
    }
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('UserMemory', userMemorySchema);
