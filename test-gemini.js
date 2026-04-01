const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        console.log("Listing models...");
        const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // dummy
        // The SDK might not have a direct listModels on the genAI instance depending on version
        // Let's try the direct fetch if needed, but let's try gemini-pro first
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await modelPro.generateContent("Hello?");
        console.log("Success with gemini-pro:", result.response.text());
    } catch (e) {
        console.error("Error Message:", e.message);
    }
}
test();
