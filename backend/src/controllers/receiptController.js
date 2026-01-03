const asyncHandler = require('express-async-handler');
const multer = require('multer');
const OpenAI = require('openai');
const Expense = require('../models/expenseModel');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
}).single('receipt');

// @desc    Upload receipt and extract expense data
// @route   POST /api/receipts/upload
// @access  Private
const uploadReceipt = asyncHandler(async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!process.env.OPENAI_API_KEY) {
            // Clean up file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'OpenAI API key not configured' });
        }

        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
            // Read image file and convert to base64
            const imageBuffer = fs.readFileSync(req.file.path);
            const base64Image = imageBuffer.toString('base64');
            
            // Use OpenAI Vision to extract expense data
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Extract expense information from this receipt. Return a JSON object with: text (description), amount (number), date (YYYY-MM-DD format if visible, otherwise use today's date), and category (one of: Food, Transport, Shopping, Bills, Entertainment, Healthcare, Education, Travel, Other). Only return valid JSON, no other text."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300
            });

            const responseText = completion.choices[0].message.content.trim();
            
            // Parse JSON response (handle markdown code blocks if present)
            let expenseData;
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    expenseData = JSON.parse(jsonMatch[0]);
                } else {
                    expenseData = JSON.parse(responseText);
                }
            } catch (parseError) {
                console.error('Failed to parse AI response:', responseText);
                throw new Error('Failed to extract data from receipt');
            }

            // Validate and create expense
            if (!expenseData.text || !expenseData.amount) {
                throw new Error('Could not extract required information from receipt');
            }

            // Determine date
            let expenseDate = new Date();
            if (expenseData.date) {
                const parsedDate = new Date(expenseData.date);
                if (!isNaN(parsedDate.getTime())) {
                    expenseDate = parsedDate;
                }
            }

            // Create expense
            const expense = await Expense.create({
                user: req.user.id,
                text: expenseData.text,
                amount: parseFloat(expenseData.amount),
                category: expenseData.category || 'Other',
                date: expenseDate
            });

            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

            res.status(200).json({
                success: true,
                expense,
                message: 'Receipt processed successfully'
            });

        } catch (error) {
            // Clean up file on error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            console.error('Receipt processing error:', error);
            res.status(500).json({ error: error.message || 'Failed to process receipt' });
        }
    });
});

module.exports = { uploadReceipt };

