const mongoose = require('mongoose');

const lendingBudgetSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    monthlyLimit: {
        type: Number,
        required: true,
        default: 10000, // Default ₹10,000 per month
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LendingBudget', lendingBudgetSchema);

