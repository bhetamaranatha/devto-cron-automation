const { searchAIUpdates } = require('./tavily');
const { generateDevToArticle } = require('./openai');
const { createDevToArticle } = require('./devto');
const { saveExecution } = require('./memory');
const { learnFromSuccess } = require('./learner');
require('dotenv').config();

// Global timeout: kill process after 10 minutes (safety net)
const GLOBAL_TIMEOUT_MS = 10 * 60 * 1000;
const globalTimer = setTimeout(() => {
    console.error('FATAL: Global timeout reached (10 min). Force exiting.');
    process.exit(1);
}, GLOBAL_TIMEOUT_MS);

async function runWorkflow() {
    const startTime = Date.now();
    console.log(`\n--- Starting Workflow (Dev.to): ${new Date().toLocaleString()} ---`);

    let rawContent = null;
    let articleData = null;

    try {
        // 1. Research (timeout: 60 detik)
        console.log('Step 1: Searching AI updates...');
        rawContent = await Promise.race([
            searchAIUpdates(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('searchAIUpdates timeout (60s)')), 60_000)
            )
        ]);

        if (!rawContent) {
            console.log('No content found. Skipping this cycle.');
            saveExecution({
                status: 'skipped',
                reason: 'No content found from Tavily',
                topic: null,
                content: null,
                articleId: null,
                durationMs: Date.now() - startTime,
            });
            return;
        }

        const topic = rawContent.slice(0, 120).replace(/\s+/g, ' ').trim();
        console.log(`Topic: ${topic}`);

        // 2. Generate Content (timeout: 90 detik)
        console.log('Step 2: Generating Dev.to article...');
        articleData = await Promise.race([
            generateDevToArticle(rawContent),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('generateDevToArticle timeout (90s)')), 90_000)
            )
        ]);

        if (!articleData || !articleData.body_markdown) {
            console.log('Failed to generate article data.');
            saveExecution({
                status: 'failed',
                reason: 'AI returned empty response',
                topic,
                content: null,
                articleId: null,
                durationMs: Date.now() - startTime,
            });
            return;
        }

        // 3. Post to Dev.to (timeout: 30 detik)
        console.log('Step 3: Posting to Dev.to...');
        const result = await Promise.race([
            createDevToArticle(articleData),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('createDevToArticle timeout (30s)')), 30_000)
            )
        ]);

        const status = result.skipped ? 'skipped' : 'success';
        const record = saveExecution({
            status,
            reason: result.skipped ? 'Dev.to API key not configured' : null,
            topic,
            content: articleData.body_markdown,
            articleId: result.articleId || null,
            articleUrl: result.url || null,
            durationMs: Date.now() - startTime,
        });

        console.log(`--- Workflow Completed (${status}) in ${record.durationMs}ms ---\n`);

        // 4. Self-Learning (timeout: 60 detik)
        if (status === 'success' || status === 'skipped') {
            console.log('Step 4: Running self-learning...');
            await Promise.race([
                learnFromSuccess(articleData.body_markdown, topic),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('learnFromSuccess timeout (60s)')), 60_000)
                )
            ]);
        }

    } catch (error) {
        console.error('--- Workflow Failed ---', error.message);
        saveExecution({
            status: 'failed',
            reason: error.message,
            topic: rawContent ? rawContent.slice(0, 120).trim() : null,
            content: articleData ? articleData.body_markdown : null,
            articleId: null,
            durationMs: Date.now() - startTime,
        });
        // Exit dengan error code supaya GitHub Actions tau ini gagal
        clearTimeout(globalTimer);
        process.exit(1);
    }

    clearTimeout(globalTimer);
    console.log('Process completed. Exiting cleanly.');
    process.exit(0);
}

// Hanya jalankan workflow langsung — TANPA internal cron
console.log('Dev.to Automation Worker Started...');
console.log(`Time: ${new Date().toLocaleString()}`);
console.log(`Global timeout: ${GLOBAL_TIMEOUT_MS / 1000}s\n`);

runWorkflow();

module.exports = { runWorkflow };
