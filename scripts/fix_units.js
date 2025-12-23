const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'antigravity_learning';

async function fixUnits() {
    console.log("Fixing Units Table Schema and Data...");
    try {
        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        });

        // 1. Add missing columns if they don't exist
        console.log("Adding columns 'difficulty' and 'tags' to units table if missing...");
        try {
            await connection.query("ALTER TABLE units ADD COLUMN difficulty INT DEFAULT 1");
        } catch (e) { /* Ignore if exists */ }

        try {
            await connection.query("ALTER TABLE units ADD COLUMN tags JSON");
        } catch (e) {
            // Fallback for older MySQL versions that strictly don't support JSON alias in some contexts? 
            // Usually JSON is verified. Let's try TEXT if JSON fails, or ignore "Duplicate column" error.
            if (!e.message.includes("Duplicate column")) console.log("Note:", e.message);
        }

        // 2. Load Seed Data from JSON
        const seedPath = path.join(__dirname, '../data/units.json');
        if (fs.existsSync(seedPath)) {
            const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
            console.log(`Found ${seedData.length} units in seed file.`);

            // Clear table to avoid duplicates/messy state (optional, but cleaner for "fixing")
            await connection.query("TRUNCATE TABLE units");

            // Insert
            for (const unit of seedData) {
                // Ensure tags is stringified if it's an object/array
                const tagsVal = JSON.stringify(unit.tags || []);
                await connection.query(
                    'INSERT INTO units (title, type, difficulty, tags, content) VALUES (?, ?, ?, ?, ?)',
                    [unit.title, unit.type || 'text', unit.difficulty || 1, tagsVal, unit.content || '']
                );
            }
            console.log("✅ Units table re-seeded successfully.");
        } else {
            console.warn("⚠️ No seed file found at data/units.json");
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to fix units:", err);
        process.exit(1);
    }
}

fixUnits();
