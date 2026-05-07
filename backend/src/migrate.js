const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running time tracking migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'config', 'time_tracking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 100) + '...');
        await db.query(statement.trim());
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runMigration();
