const mysql = require('mysql2/promise');
require('dotenv').config();

// Load env vars explicitly if needed for debugging script independent of app
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'antigravity_learning';

async function setup() {
    console.log(`Connecting to MySQL at ${DB_HOST}...`);
    try {
        // First connect without DB to check/create DB
        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD
        });

        console.log(`Creating database ${DB_NAME} if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
        await connection.query(`USE \`${DB_NAME}\``);

        console.log("Creating tables...");

        // Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                learning_style VARCHAR(50) DEFAULT 'visual',
                pacing VARCHAR(50) DEFAULT 'moderate',
                current_level INT DEFAULT 1,
                is_verified BOOLEAN DEFAULT FALSE,
                verification_token VARCHAR(255),
                reset_token VARCHAR(255),
                reset_token_expires DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log(" - users table ready");

        // Units Table (Mock content for now)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS units (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                type VARCHAR(50),
                content TEXT,
                views INT DEFAULT 0
            )
        `);
        console.log(" - units table ready");

        // Check if units exist, if not add some dummy data
        const [units] = await connection.query("SELECT * FROM units");
        if (units.length === 0) {
            console.log("Seeding units...");
            await connection.query(`
                INSERT INTO units (title, type, content) VALUES 
                ('Algebra Basics', 'Math', 'Introduction to variables and equations.'),
                ('Physics: Motion', 'Physics', 'Understanding velocity and acceleration.')
            `);
        }

        // AI Questions History
        await connection.query(`
            CREATE TABLE IF NOT EXISTS generated_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255),
                topic VARCHAR(255),
                questions JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log(" - generated_questions table ready");

        // AI Chat History
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ai_chat_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255),
                message_from_user TEXT,
                message_from_ai TEXT,
                context_unit VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log(" - ai_chat_history table ready");

        console.log("Database setup complete! You can now run the app.");
        process.exit(0);
    } catch (err) {
        console.error("Setup failed:", err);
        process.exit(1);
    }
}

setup();
