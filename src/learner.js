const OpenAI = require('openai');
const { saveInsight } = require('./memory');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * After a successful post, ask OpenAI to reflect on what made the content strong.
 * The insight is stored and used to improve future posts.
 */
async function learnFromSuccess(postContent, topic) {
    if (!postContent) return;

    console.log('🧠 AI Self-Learning: Reflecting on successful article...');

    const reflectionPrompt = `You are an expert technical content analyst for Dev.to. A Markdown article was just published successfully.

Topic area: "${topic || 'Software Development & AI'}"

Article content:
---
${postContent}
---

Analyze this article and extract ONE concise, actionable writing principle that made it effective for a developer audience. 
This principle will be used to make future articles better.

Respond with ONLY a single sentence starting with a verb, max 25 words. 
Example: "Use clear H2 headers and concise code blocks to improve readability and provide immediate value to developers."`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "user", content: reflectionPrompt }
            ],
            temperature: 0.4,
            max_tokens: 100,
        });

        const note = response.choices[0].message.content.trim().replace(/['"]/g, '');
        if (note && note.length > 10) {
            saveInsight({ note, topic: topic || 'AI in Business' });
            console.log(`✅ Insight saved: "${note}"`);
        }
    } catch (error) {
        // Non-critical — don't let learning failure break the workflow
        console.warn('⚠️ Learning reflection failed (non-critical):', error.message);
    }
}

module.exports = { learnFromSuccess };
