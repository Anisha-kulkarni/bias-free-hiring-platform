const db = require('../src/db');

async function checkUsers() {
    try {
        const [rows] = await db.query('SELECT * FROM users');
        console.log('Users in DB:');
        console.log('Credentials:', rows.map(u => ({ email: u.email, password: u.password })));
        process.exit(0);
    } catch (err) {
        console.error('Error querying users:', err);
        process.exit(1);
    }
}

checkUsers();
