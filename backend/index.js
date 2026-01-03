const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/db/db');
const expenseRoutes = require('./src/routes/expenseRoutes');
const userRoutes = require('./src/routes/userRoutes');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', require('./src/routes/aiRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/budgets', require('./src/routes/budgetRoutes'));
app.use('/api/export', require('./src/routes/exportRoutes'));
app.use('/api/receipts', require('./src/routes/receiptRoutes'));
app.use('/api/alerts', require('./src/routes/alertRoutes'));
app.use('/api/currency', require('./src/routes/currencyRoutes'));
app.use('/api/loans', require('./src/routes/loanRoutes'));
app.use('/api/lending-budget', require('./src/routes/lendingBudgetRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
