const { createDevToArticle } = require('./devto');

async function run() {
    try {
        const articleData = {
            title: "Test auto post from Render cron",
            body_markdown: "This is a test article generated from the automation cron job.",
            published: false, // Don't actually publish the test
            tags: ['test', 'automation']
        };
        await createDevToArticle(articleData);
        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Failed:", err);
        process.exit(1);
    }
}

run();
