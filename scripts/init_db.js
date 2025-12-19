const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf-8'));
const units = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/units.json'), 'utf-8'));

async function initDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        console.log(`Creating database ${process.env.DB_NAME} if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        await connection.query(`USE \`${process.env.DB_NAME}\``);

        console.log('Creating tables...');

        // Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100),
                learning_style VARCHAR(50),
                pacing VARCHAR(50),
                current_level INT
            )
        `);

        // Units Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS units (
                id VARCHAR(50) PRIMARY KEY,
                title VARCHAR(255),
                type VARCHAR(50),
                difficulty INT,
                tags JSON,
                content TEXT
            )
        `);

        console.log('Seeding data...');

        // Seed Users
        for (const user of users) {
            await connection.execute(
                'INSERT IGNORE INTO users (id, name, email, learning_style, pacing, current_level) VALUES (?, ?, ?, ?, ?, ?)',
                [user.id, user.name, user.email, user.preferences.learningStyle, user.preferences.pacing, user.preferences.currentLevel]
            );
        }

        // Seed Units
        for (const unit of units) {
            await connection.execute(
                'INSERT IGNORE INTO units (id, title, type, difficulty, tags, content) VALUES (?, ?, ?, ?, ?, ?)',
                [unit.id, unit.title, unit.type, unit.difficulty, JSON.stringify(unit.tags), unit.content]
            );
        }

        console.log('Database initialized successfully.');

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await connection.end();
    }
}

initDB();
