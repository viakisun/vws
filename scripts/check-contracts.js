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

async function checkContracts() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('🔄 Checking salary_contracts table...');
        
        const client = await pool.connect();
        
        // Check if salary_contracts table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'salary_contracts'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('❌ salary_contracts table does not exist!');
            return;
        }
        
        console.log('✅ salary_contracts table exists');
        
        // Check contract count
        const countResult = await client.query('SELECT COUNT(*) FROM salary_contracts');
        const totalCount = countResult.rows[0].count;
        console.log(`📊 Total contracts: ${totalCount}`);
        
        // Check active contracts
        const activeCountResult = await client.query("SELECT COUNT(*) FROM salary_contracts WHERE status = 'active'");
        const activeCount = activeCountResult.rows[0].count;
        console.log(`📊 Active contracts: ${activeCount}`);
        
        // Show sample contracts
        const sampleResult = await client.query(`
            SELECT 
                sc.id,
                sc.employee_id,
                sc.annual_salary,
                sc.start_date,
                sc.end_date,
                sc.status,
                e.first_name,
                e.last_name
            FROM salary_contracts sc
            LEFT JOIN employees e ON sc.employee_id = e.id
            WHERE sc.status = 'active'
            ORDER BY sc.start_date DESC
            LIMIT 5
        `);
        
        console.log('📋 Sample active contracts:');
        if (sampleResult.rows.length === 0) {
            console.log('   No active contracts found');
        } else {
            sampleResult.rows.forEach((contract, index) => {
                console.log(`   ${index + 1}. ${contract.first_name} ${contract.last_name} - ${contract.annual_salary}원 (${contract.start_date} ~ ${contract.end_date})`);
            });
        }
        
        // Check specific employee contracts
        const employeeResult = await client.query(`
            SELECT 
                e.id,
                e.first_name,
                e.last_name,
                COUNT(sc.id) as contract_count
            FROM employees e
            LEFT JOIN salary_contracts sc ON e.id = sc.employee_id AND sc.status = 'active'
            WHERE e.status = 'active'
            GROUP BY e.id, e.first_name, e.last_name
            ORDER BY contract_count DESC
            LIMIT 10
        `);
        
        console.log('👥 Employee contract summary:');
        employeeResult.rows.forEach((emp, index) => {
            console.log(`   ${index + 1}. ${emp.first_name} ${emp.last_name}: ${emp.contract_count} contracts`);
        });
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error checking contracts:', error.message);
        console.error('Error details:', error);
    } finally {
        await pool.end();
    }
}

// Run the check
checkContracts().then(() => {
    console.log('🏁 Contract check completed.');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
});
