const axios = require('axios');
require('dotenv').config();

/**
 * Creates an article on dev.to
 * @param {Object} articleData - The article data
 * @param {string} articleData.title - The title of the article
 * @param {string} articleData.body_markdown - The content of the article in Markdown
 * @param {string[]} [articleData.tags] - Array of tags (max 4)
 * @param {boolean} [articleData.published] - Whether to publish the article immediately
 */
async function createDevToArticle(articleData) {
    if (!articleData || !articleData.body_markdown) {
        return { posted: false, skipped: true };
    }

    const apiKey = process.env.DEVTO_API_KEY;

    if (!apiKey || apiKey === 'your_devto_api_key_here') {
        console.warn('\n[SKIP] Dev.to API Key is not set or is the default value.');
        console.log('--- Content generated (not posted) ---');
        console.log('Title:', articleData.title);
        console.log('Body:', articleData.body_markdown.slice(0, 100) + '...');
        console.log('--------------------------------------');
        return { posted: false, skipped: true, articleId: null };
    }

    try {
        // Sanitize tags: Dev.to tags must be alphanumeric
        const sanitizedTags = (articleData.tags || ['ai', 'automation', 'productivity'])
            .map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, ''))
            .filter(tag => tag.length > 0)
            .slice(0, 4);

        console.log('Posting to Dev.to...');
        const response = await axios.post('https://dev.to/api/articles', {
            article: {
                title: articleData.title || 'AI Insights: ' + new Date().toLocaleDateString(),
                body_markdown: articleData.body_markdown,
                published: articleData.published !== undefined ? articleData.published : true,
                tags: sanitizedTags
            }
        }, {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        const articleId = response.data.id;
        const url = response.data.url;
        console.log('Successfully posted to Dev.to!');
        console.log('ID:', articleId);
        console.log('URL:', url);

        return { posted: true, skipped: false, articleId, url };
    } catch (error) {
        console.error('Error posting to Dev.to:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { createDevToArticle };
