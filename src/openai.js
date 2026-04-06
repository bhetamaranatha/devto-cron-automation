const OpenAI = require('openai');
const { getRecentInsightsSummary } = require('./memory');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateDevToArticle(rawContent) {
    if (!rawContent) return null;

    console.log('Generating Dev.to article using OpenAI...');

    // Load accumulated learning insights
    const learnedInsights = getRecentInsightsSummary(5);
    const learningBlock = learnedInsights
        ? `\n# Learned Writing Principles (From Past Successful Posts):\nApply these proven principles from previous successful posts:\n${learnedInsights}\n`
        : '';

    if (learnedInsights) {
        console.log(`🧠 Applying ${learnedInsights.split('\n').length} learned insights to this article.`);
    }

    const systemMessage = `# Role
You are a senior technical writer and AI automation consultant. Your goal is to write high-quality, non-generic, and deeply insightful articles for the Dev.to community.

# Core Objective:
Diversify your content! Each article should have a unique "Angle" to avoid repetitive patterns in titles and structure.

# Guidelines for Content Angles (Pick ONE per article):
- **Deep Dive**: Explain *how* a specific AI/Automation workflow works (e.g., "Exploring the logic of n8n error handling in production").
- **Case Study**: A narrative about a hypothetical or real scenario where automation saved time/money (e.g., "From 20 hours to 2 minutes: Automating talent screening").
- **Trends & Future**: High-level perspective on where AI/HR is going (e.g., "Beyond Chatbots: The next wave of agentic HR workflows").
- **Technical Tutorial**: Step-by-step implementation of an automation feature.
- **Problem & Solution**: Focus on a single common pain point and its automated fix.
- **Comparison**: Compare different approaches to automation (e.g., "Low-code vs. No-code for HR workflows").

# Writing Constraints:
- **AVOID REPETITIVE TITLES**: DO NOT start titles with "Harnessing...", "Unlocking...", "Revolutionizing...", or "Mastering...". Be creative and direct.
- **NO CLICKBAIT**: Titles must accurately reflect the content.
- **Format**: Use clean Markdown. H2 and H3 headers are mandatory for structure.
- **Code**: Use real or conceptual code blocks (n8n JSON, JavaScript, or Python) to provide technical value.
- **Word Count**: Aim for 500-800 words. Be concise but detailed.

# SEO & Backlinking (CRITICAL):
- Naturally mention and link to [My HR Automation](https://myhrautomation.com).
- **Rule**: Do not just paste a link at the end. Integrate it as a relevant recommendation or resource (e.g., "For those looking to implement this at scale, platforms like My HR Automation provide ready-to-use templates...").
- **Keywords**: Naturally weave in keywords: "HR Automation", "n8n recruitment", "workflow automation", "AI in Hiring".

${learningBlock}

# Output Requirements:
- Respond ONLY with a valid JSON object.
- Fields:
  "title": String (Creative, diverse, non-repetitive)
  "article_angle": String (The angle you chose, e.g., "Deep Dive")
  "body_markdown": String (Detailed content)
  "tags": Array of 3-4 strings (technical/relevant)`;

    const prompt = `Raw content: ${rawContent}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const content = JSON.parse(response.choices[0].message.content);
        if (content.article_angle) {
            console.log(`🎨 Article Angle Chosen: ${content.article_angle}`);
        }
        return content;
    } catch (error) {
        console.error('Error generating content with OpenAI:', error.message);
        throw error;
    }
}

module.exports = { generateDevToArticle };
