require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log("Testing Gemini API...");
    const key = process.env.GEMINI_API_KEY;
    console.log("Key present:", !!key);

    if (!key) {
        console.error("No key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    
    // Try different model names
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.0-pro",
        "gemini-pro",
        "gemini-1.5-pro"
    ];

    for (const modelName of modelsToTry) {
        try {
            console.log(`\nTrying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = "Say hello in one word.";
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log(`✓ SUCCESS with ${modelName}! Response: ${text}`);
            console.log(`\nUse this model name: ${modelName}`);
            return modelName;
        } catch (error) {
            console.log(`✗ ${modelName} failed: ${error.message.split('\n')[0].substring(0, 100)}`);
        }
    }
    
    console.log("\n❌ None of the models worked. The API key might not have access to these models.");
    console.log("Please check your Google AI Studio project settings.");
}

testGemini();
