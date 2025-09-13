import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/database/connection';

// 데이터베이스 테이블 생성
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { tables } = data;

		const results = [];

		for (const table of tables) {
			try {
				if (table === 'departments') {
					// 부서 테이블 생성
					await query(`
						CREATE TABLE IF NOT EXISTS departments (
							id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
							name VARCHAR(100) NOT NULL UNIQUE,
							description TEXT,
							status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
							created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
							updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
						)
					`);
					results.push({ table: 'departments', success: true, message: '부서 테이블이 생성되었습니다.' });
				} else if (table === 'positions') {
					// 직급 테이블 생성
					await query(`
						CREATE TABLE IF NOT EXISTS positions (
							id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
							name VARCHAR(100) NOT NULL,
							description TEXT,
							department VARCHAR(100) NOT NULL,
							level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
							status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
							created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
							updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
							UNIQUE(name, department)
						)
					`);
					results.push({ table: 'positions', success: true, message: '직급 테이블이 생성되었습니다.' });
				}
			} catch (error: any) {
				results.push({ 
					table, 
					success: false, 
					message: `테이블 생성 실패: ${error.message}` 
				});
			}
		}

		return json({
			success: true,
			results,
			message: '데이터베이스 설정이 완료되었습니다.'
		});
	} catch (error: any) {
		console.error('Error setting up database:', error);
		return json({
			success: false,
			error: error.message || '데이터베이스 설정에 실패했습니다.'
		}, { status: 500 });
	}
};
