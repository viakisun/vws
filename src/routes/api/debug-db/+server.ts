import { json } from '@sveltejs/kit';
import { Pool } from 'pg';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
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

	const pool = new Pool(dbConfig);
	
	try {
		console.log('Testing direct database connection...');
		console.log('Config:', { ...dbConfig, password: '[HIDDEN]' });
		
		const client = await pool.connect();
		console.log('✅ Database connection successful!');
		
		const result = await client.query('SELECT version() as version, current_database() as database, current_user as user');
		console.log('Query result:', result.rows[0]);
		
		client.release();
		await pool.end();
		
		return json({
			success: true,
			message: 'Direct database connection successful',
			database: result.rows[0]
		});

	} catch (error) {
		console.error('❌ Direct database connection failed:', error);
		await pool.end();
		
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error',
			details: {
				code: (error as any)?.code,
				detail: (error as any)?.detail
			}
		}, { status: 500 });
	}
};
