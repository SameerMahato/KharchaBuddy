const mongoose = require('mongoose');

const loanSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    friendName: {
        type: String,
        required: [true, 'Please provide friend name']
    },
    amount: {
        type: Number,
        required: [true, 'Please provide amount'],
        min: 0
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CNY', 'BRL', 'MXN']
    },
    type: {
        type: String,
        enum: ['given', 'received'],
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    dateGiven: {
        type: Date,
        default: Date.now
    },
    dateReturned: {
        type: Date,
        default: null
    },
    isPaidBack: {
        type: Boolean,
        default: false
    },
    isReturnedOnTime: {
        type: Boolean,
        default: false
    },
    partialPayments: [{
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            default: ''
        }
    }],
    remainingAmount: {
        type: Number,
        default: function() {
            return this.amount;
        }
    },
    expectedReturnDate: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Auto-calculate if returned within 2 months
loanSchema.methods.checkIfReturnedOnTime = function() {
    if (this.isPaidBack && this.dateReturned) {
        const twoMonthsFromGiven = new Date(this.dateGiven);
        twoMonthsFromGiven.setMonth(twoMonthsFromGiven.getMonth() + 2);
        this.isReturnedOnTime = this.dateReturned <= twoMonthsFromGiven;
        return this.isReturnedOnTime;
    }
    return false;
};

// Update remaining amount when partial payment is added
loanSchema.methods.addPartialPayment = function(paymentAmount, notes = '') {
    if (this.isPaidBack) {
        throw new Error('Loan is already fully paid');
    }
    
    if (paymentAmount > this.remainingAmount) {
        throw new Error('Payment amount exceeds remaining amount');
    }
    
    this.partialPayments.push({
        amount: paymentAmount,
        date: new Date(),
        notes: notes
    });
    
    this.remainingAmount -= paymentAmount;
    
    // Auto-mark as paid if remaining amount is 0 or less
    if (this.remainingAmount <= 0) {
        this.isPaidBack = true;
        this.dateReturned = new Date();
        
        // Check if returned within 2 months
        const twoMonthsFromGiven = new Date(this.dateGiven);
        twoMonthsFromGiven.setMonth(twoMonthsFromGiven.getMonth() + 2);
        this.isReturnedOnTime = this.dateReturned <= twoMonthsFromGiven;
    }
    
    return this;
};

module.exports = mongoose.model('Loan', loanSchema);

