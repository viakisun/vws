import { query } from '../src/lib/database/connection.ts';

// 직원별 직책 업데이트 매핑
const positionUpdates = [
	// 연구소장
	{ employeeId: '1021', newPosition: '연구소장' }, // 차지은
	
	// 상무 (경영기획팀의 고위직들을 상무로 승격)
	{ employeeId: '1001', newPosition: '상무' }, // 박기선 (대표이사 → 상무)
	{ employeeId: '1002', newPosition: '상무' }, // 한승훈 (경영기획팀장 → 상무)
];

async function updateEmployeePositions() {
	try {
		console.log('🔄 Updating employee positions...');
		
		for (const update of positionUpdates) {
			// 직원 정보 조회
			const employeeResult = await query(
				'SELECT id, first_name, last_name, department, position FROM employees WHERE employee_id = $1',
				[update.employeeId]
			);
			
			if (employeeResult.rows.length === 0) {
				console.log(`⚠️  Employee with ID ${update.employeeId} not found`);
				continue;
			}
			
			const employee = employeeResult.rows[0];
			const oldPosition = employee.position;
			
			// 직책 업데이트
			await query(`
				UPDATE employees 
				SET position = $1, updated_at = $2
				WHERE employee_id = $3
			`, [update.newPosition, new Date(), update.employeeId]);
			
			console.log(`✅ Updated ${employee.last_name}${employee.first_name} (${update.employeeId}): ${oldPosition} → ${update.newPosition}`);
		}
		
		// 결과 확인
		console.log('\n🔍 Verifying position updates...');
		const result = await query(`
			SELECT 
				employee_id, first_name, last_name, department, position, status
			FROM employees 
			WHERE position IN ('연구소장', '상무')
			ORDER BY position, employee_id
		`);
		
		console.log('📋 Updated executive positions:');
		result.rows.forEach(row => {
			const statusIcon = row.status === 'active' ? '🟢' : '🔴';
			console.log(`  ${statusIcon} ${row.employee_id}: ${row.last_name}${row.first_name} - ${row.position} (${row.department})`);
		});
		
		// 전체 직급 분포 확인
		console.log('\n📊 Position distribution:');
		const positionStats = await query(`
			SELECT 
				position,
				COUNT(*) as count,
				COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
				COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated_count
			FROM employees 
			GROUP BY position
			ORDER BY 
				CASE position
					WHEN '상무' THEN 1
					WHEN '연구소장' THEN 2
					WHEN '대표이사' THEN 3
					WHEN '재무이사' THEN 4
					WHEN 'PSR팀장' THEN 5
					WHEN '경영기획팀장' THEN 6
					WHEN '경영지원팀장' THEN 7
					WHEN '선임연구원' THEN 8
					WHEN '연구원' THEN 9
					ELSE 10
				END,
				position
		`);
		
		positionStats.rows.forEach(row => {
			console.log(`  ${row.position}: ${row.count}명 (재직: ${row.active_count}명, 퇴사: ${row.terminated_count}명)`);
		});
		
		console.log('\n✅ Employee position updates completed successfully!');
		
	} catch (error) {
		console.error('❌ Failed to update employee positions:', error);
		throw error;
	}
}

// Run the script
updateEmployeePositions()
	.then(() => {
		console.log('🎉 Employee position updates completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Employee position updates failed:', error);
		process.exit(1);
	});
