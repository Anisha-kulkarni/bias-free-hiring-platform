const pool = require('../src/db');

async function migrate_interactions() {
    try {
        console.log("Creating AI interactions tables...");

        // 1. Table for Question Generator History
        await pool.query(`
            CREATE TABLE IF NOT EXISTS generated_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50),
                unit_title VARCHAR(255),
                topic VARCHAR(255),
                questions JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Created 'generated_questions' table.");

        // 2. Table for Chat Window Interactions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_chat_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50),
                message_from_user TEXT,
                message_from_ai TEXT,
                context_unit VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Created 'ai_chat_history' table.");

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
    process.exit(0);
}

migrate_interactions();
