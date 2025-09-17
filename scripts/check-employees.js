import { Pool } from 'pg';

// Database configuration
const dbConfig = {
    host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'viahubdev',
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

async function checkEmployees() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('🔄 Checking employees table...');
        
        const client = await pool.connect();
        
        // Check if employees table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'employees'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('❌ Employees table does not exist!');
            return;
        }
        
        console.log('✅ Employees table exists');
        
        // Check employee count
        const countResult = await client.query('SELECT COUNT(*) FROM employees');
        const totalCount = countResult.rows[0].count;
        console.log(`📊 Total employees: ${totalCount}`);
        
        // Check active employees
        const activeCountResult = await client.query("SELECT COUNT(*) FROM employees WHERE status = 'active'");
        const activeCount = activeCountResult.rows[0].count;
        console.log(`📊 Active employees: ${activeCount}`);
        
        // Show sample employees
        const sampleResult = await client.query(`
            SELECT id, first_name, last_name, department, position, status
            FROM employees 
            WHERE status = 'active'
            LIMIT 5
        `);
        
        console.log('👥 Sample active employees:');
        if (sampleResult.rows.length === 0) {
            console.log('   No active employees found');
        } else {
            sampleResult.rows.forEach((emp, index) => {
                console.log(`   ${index + 1}. ${emp.first_name} ${emp.last_name} (${emp.department}/${emp.position})`);
            });
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error checking employees:', error.message);
        console.error('Error details:', error);
    } finally {
        await pool.end();
    }
}

// Run the check
checkEmployees().then(() => {
    console.log('🏁 Employee check completed.');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
});
