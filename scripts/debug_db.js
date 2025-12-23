const db = require('../src/db');

async function debug() {
    console.log("Checking DB connection...");
    try {
        const connection = await db.getConnection();
        console.log("DB Connected successfully.");

        const [columns] = await connection.query("SHOW COLUMNS FROM users");
        console.log("Users table columns:", columns.map(c => c.Field));

        connection.release();
        process.exit(0);
    } catch (err) {
        console.error("DB Connection Failed:", err.message);
        console.error(err);
        process.exit(1);
    }
}

debug();
