const axios = require('axios');
require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    console.log("Fetching models with axios...");
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
        console.log("Models (v1):", response.data.models.map(m => m.name));
    } catch (e1) {
        console.error("v1 failed:", e1.response?.status, e1.response?.data);
        try {
            const responseBeta = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            console.log("Models (v1beta):", responseBeta.data.models.map(m => m.name));
        } catch (e2) {
            console.error("v1beta failed:", e2.response?.status, e2.response?.data);
        }
    }
}
listModels();
