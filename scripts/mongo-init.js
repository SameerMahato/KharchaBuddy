// MongoDB Initialization Script
db = db.getSiblingDB('kharchabuddy');

// Create collections
db.createCollection('users');
db.createCollection('transactions');
db.createCollection('budgets');
db.createCollection('loans');
db.createCollection('goals');
db.createCollection('conversations');
db.createCollection('bank_connections');

// Create indexes for users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true });

// Create indexes for transactions
db.transactions.createIndex({ userId: 1, date: -1 });
db.transactions.createIndex({ userId: 1, category: 1, date: -1 });
db.transactions.createIndex({ userId: 1, source: 1 });
db.transactions.createIndex({ userId: 1, isAnomaly: 1 });

// Create indexes for budgets
db.budgets.createIndex({ userId: 1, period: 1 });
db.budgets.createIndex({ userId: 1, startDate: 1 });

// Create indexes for loans
db.loans.createIndex({ userId: 1, isPaidBack: 1 });
db.loans.createIndex({ userId: 1, type: 1 });
db.loans.createIndex({ userId: 1, dateGiven: -1 });

// Create indexes for goals
db.goals.createIndex({ userId: 1, status: 1 });
db.goals.createIndex({ userId: 1, targetDate: 1 });

// Create indexes for conversations
db.conversations.createIndex({ userId: 1, status: 1 });
db.conversations.createIndex({ userId: 1, lastMessageAt: -1 });

// Create indexes for bank connections
db.bank_connections.createIndex({ userId: 1, status: 1 });

print('MongoDB initialization completed successfully');
