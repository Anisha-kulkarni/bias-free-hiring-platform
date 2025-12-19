const pool = require('../src/db');

async function migrate() {
    try {
        console.log("Adding views column to units table...");
        try {
            await pool.query("ALTER TABLE units ADD COLUMN views INT DEFAULT 0");
            console.log("Views column added.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Views column already exists.");
            } else {
                throw e;
            }
        }
        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
    process.exit(0);
}

migrate();
