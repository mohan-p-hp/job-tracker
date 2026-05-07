const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runAllMigrations() {
  try {
    console.log('🚀 Running all migrations for production...');
    
    const migrations = [
      'time_tracking.sql',
      'tags.sql', 
      'dependencies.sql'
    ];
    
    for (const migration of migrations) {
      console.log(`\n📋 Running migration: ${migration}`);
      
      const sqlPath = path.join(__dirname, 'config', migration);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await db.query(statement.trim());
            console.log('✅ Executed:', statement.trim().substring(0, 100) + '...');
          } catch (err) {
            // Column already exists or other non-critical error
            if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
              console.log('⚠️  Skipping (already exists):', err.message);
            } else {
              throw err;
            }
          }
        }
      }
    }
    
    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    const [tables] = await db.query('SHOW TABLES');
    console.log('Tables found:', tables.map(t => Object.values(t)[0]));
    
    // Verify new columns exist
    console.log('\n🔍 Verifying columns in todos table...');
    const [columns] = await db.query('DESCRIBE todos');
    const columnNames = columns.map(c => c.Field);
    console.log('Columns:', columnNames);
    
    const requiredColumns = ['total_time_tracked', 'dependency_status'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns);
      console.log('⚠️  Database migrations may not have run completely!');
    } else {
      console.log('✅ All required columns present!');
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runAllMigrations();
