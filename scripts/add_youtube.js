const pool = require('../src/db');

async function migrate() {
    try {
        console.log("Adding youtube_url column to units table...");
        try {
            await pool.query("ALTER TABLE units ADD COLUMN youtube_url VARCHAR(255) DEFAULT NULL");
            console.log("youtube_url column added.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("youtube_url column already exists.");
            } else {
                throw e;
            }
        }

        // Add some dummy data for demonstration
        console.log("Seeding YouTube URLs...");
        await pool.query("UPDATE units SET youtube_url = 'https://www.youtube.com/embed/aircAruvnKk' WHERE title LIKE '%Neural Networks%'");
        await pool.query("UPDATE units SET youtube_url = 'https://www.youtube.com/embed/IHHgFygx3nU' WHERE title LIKE '%Linear Algebra%'");

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
    process.exit(0);
}

migrate();
