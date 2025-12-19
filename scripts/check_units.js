const db = require('../src/db');

async function checkUnits() {
    try {
        const [rows] = await db.query('SELECT id, title, youtube_url, content FROM units');
        console.log('Units:', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUnits();
