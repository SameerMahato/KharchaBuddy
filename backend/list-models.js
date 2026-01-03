require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    console.log("Listing available Gemini models...");
    const key = process.env.GEMINI_API_KEY;
    
    if (!key) {
        console.error("No API key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    
    // Try common model names
    const modelNames = [
        "gemini-1.5-flash",
        "gemini-1.0-pro",
        "gemini-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash-latest"
    ];
    
    console.log("\nTrying common model names...");
    for (const modelName of modelNames) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello in one word.");
            const response = await result.response;
            const text = response.text();
            console.log(`✓ ${modelName} WORKS! Response: ${text}`);
            return modelName;
        } catch (err) {
            const errorMsg = err.message.split('\n')[0];
            console.log(`✗ ${modelName} failed: ${errorMsg.substring(0, 80)}...`);
        }
    }
    
    console.log("\nNone of the common models worked. Please check your API key and model availability.");
}

listModels();

