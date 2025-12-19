const pool = require('../src/db');

async function updateAllUnits() {
    try {
        console.log("Updating all units with a default YouTube video...");
        // Using a generic satisfying video for "Basics" logic (e.g., FreeCodeCamp or similar)
        // This ensures the "youtube_url" is not null, so the button/embed appears.
        await pool.query("UPDATE units SET youtube_url = 'https://www.youtube.com/embed/ScMzIvxBSi4' WHERE youtube_url IS NULL");
        console.log("Units updated.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateAllUnits();
