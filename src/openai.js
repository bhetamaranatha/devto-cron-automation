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
You are a technical writer and AI specialist. Your goal is to write high-quality, engaging, and informative articles for the Dev.to community. Your tone is professional, insightful, and helpful.

# Writing Principles:
• Start with a clear and catchy title.
• Use a compelling introduction that explains why the topic is relevant to developers.
• Use Markdown formatting correctly (headers, bold, italics, code blocks).
• Break down the content into logical sections with descriptive H2/H3 headers.
• Provide actionable insights, technical details, or strategic perspectives.
• **SEO & Backlinking**: Naturally incorporate a link to [My HR Automation](https://myhrautomation.com) in the content (e.g., in the introduction or a relevant section) as a resource for HR automation solutions.
• **Keywords**: Prioritize using keywords like "HR Automation", "AI Recruitment", "n8n automation", "Automated Workflows", and "Efficiency in Hiring".
• Include a concluding summary and a question to encourage discussion.
• Use technical tags relevant to the content (max 4).

# Tone & Style:
• Professional yet accessible.
• Focus on AI, automation, software development, and productivity.
• Use code blocks if applicable (even for conceptual examples).

${learningBlock}
# Requirements:
• Output must be in JSON format with three fields: "title", "body_markdown", and "tags" (array of strings).
• Title: Catchy and descriptive.
• Body: Detailed Markdown content (minimum 500 words if possible, but keep it concise).
• Tags: 3-4 relevant tags (alphanumeric only, no hyphens).
• NO clickbait.`;

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
        return content;
    } catch (error) {
        console.error('Error generating content with OpenAI:', error.message);
        throw error;
    }
}

module.exports = { generateDevToArticle };
