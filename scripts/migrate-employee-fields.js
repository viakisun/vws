import { query } from '../src/lib/database/connection.ts';

async function migrateEmployeeFields() {
    try {
        console.log('🔄 Starting employee fields migration...');
        
        // Add birth_date column
        console.log('📅 Adding birth_date column...');
        await query(`
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE
        `);
        
        // Add termination_date column
        console.log('📅 Adding termination_date column...');
        await query(`
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS termination_date DATE
        `);
        
        // Add indexes for better performance
        console.log('🔍 Adding indexes...');
        await query(`
            CREATE INDEX IF NOT EXISTS idx_employees_birth_date ON employees(birth_date)
        `);
        
        await query(`
            CREATE INDEX IF NOT EXISTS idx_employees_termination_date ON employees(termination_date)
        `);
        
        // Update status to 'terminated' for employees with termination_date
        console.log('🔄 Updating employee statuses...');
        await query(`
            UPDATE employees 
            SET status = 'terminated' 
            WHERE termination_date IS NOT NULL AND status != 'terminated'
        `);
        
        // Add comments to columns
        console.log('📝 Adding column comments...');
        await query(`
            COMMENT ON COLUMN employees.birth_date IS 'Employee birth date'
        `);
        
        await query(`
            COMMENT ON COLUMN employees.termination_date IS 'Employee termination date (when they left the company)'
        `);
        
        console.log('✅ Employee fields migration completed successfully!');
        
        // Verify the changes
        console.log('🔍 Verifying changes...');
        const result = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            AND column_name IN ('birth_date', 'termination_date')
            ORDER BY column_name
        `);
        
        console.log('📋 New columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration
migrateEmployeeFields()
    .then(() => {
        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
