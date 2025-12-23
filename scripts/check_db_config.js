require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    console.log("Checking DB Configuration...");
    console.log(`DB_HOST: ${process.env.DB_HOST}`);
    console.log(`DB_USER: ${process.env.DB_USER}`);
    console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '******' : '(empty)'}`);
    console.log(`DB_NAME: ${process.env.DB_NAME}`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        console.log("Successfully connected to MySQL server!");

        // Check if database exists
        const [rows] = await connection.query(`SHOW DATABASES LIKE '${process.env.DB_NAME}'`);
        if (rows.length > 0) {
            console.log(`Database '${process.env.DB_NAME}' exists.`);
        } else {
            console.log(`Database '${process.env.DB_NAME}' does NOT exist.`);
            console.log("Attempting to create it...");
            await connection.query(`CREATE DATABASE \`${process.env.DB_NAME}\``);
            console.log(`Database '${process.env.DB_NAME}' created successfully.`);
        }

        await connection.end();
    } catch (err) {
        console.error("Connection failed:", err.message);
    }
})();
