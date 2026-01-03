const mongoose = require('mongoose');
const User = require('./src/models/userModel');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        // Use the exact same URI as the app
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // List all users
        const users = await User.find({});
        console.log('\n--- REGISTERED USERS IN DATABASE ---');
        console.log(`Total count: ${users.length}`);
        users.forEach(u => {
            console.log(`- Name: ${u.name}, Email: ${u.email}, Created: ${u.createdAt}`);
        });
        console.log('------------------------------------\n');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();
