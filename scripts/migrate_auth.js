const db = require('../src/db');

async function migrate() {
    console.log("Starting Auth Migration...");
    try {
        const connection = await db.getConnection();

        // Add is_verified
        try {
            await connection.query("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE");
            console.log("Added is_verified column.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
            else console.log("is_verified already exists.");
        }

        // Add verification_token
        try {
            await connection.query("ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL");
            console.log("Added verification_token column.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
            else console.log("verification_token already exists.");
        }

        // Add reset_token
        try {
            await connection.query("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL");
            console.log("Added reset_token column.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
            else console.log("reset_token already exists.");
        }

        // Add reset_token_expires
        try {
            await connection.query("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME DEFAULT NULL");
            console.log("Added reset_token_expires column.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
            else console.log("reset_token_expires already exists.");
        }

        // Increase password column length for hashes if necessary (usually 60 chars for bcrypt, likely varchar(255) already but good to check)
        try {
            await connection.query("ALTER TABLE users MODIFY COLUMN password VARCHAR(255)");
            console.log("Ensured password column is wide enough.");
        } catch (e) {
            console.error(e.message);
        }

        connection.release();
        console.log("Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
