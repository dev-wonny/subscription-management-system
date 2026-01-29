const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
    const initSqlPath = path.join(__dirname, 'migrations', 'init.sql');
    const sql = fs.readFileSync(initSqlPath, 'utf8');

    try {
        console.log('Running migration...');
        await db.query(sql);
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
