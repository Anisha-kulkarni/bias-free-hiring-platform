const pool = require('../src/db');

async function migrate() {
    try {
        console.log("Adding password column to users table...");
        // Check if column exists first to avoid error (simplified approach: just try add and catch)
        try {
            await pool.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) DEFAULT 'password123'");
            console.log("Password column added.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Password column already exists.");
            } else {
                throw e;
            }
        }

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    } // Pool will stay open unless we close it, but for a script it's fine to just exit or let node handle it? 
    // db.js module exports a pool. We should probably close it.
    // simpler:
    process.exit(0);
}

migrate();
