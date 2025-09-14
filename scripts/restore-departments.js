import { query } from '../src/lib/database/connection.ts';

// 직원별 부서 배치 (입사일과 경력, 이름을 고려하여 배치)
const departmentAssignments = {
	// 경영기획팀 (대표이사 직속)
	'1001': '경영기획팀', // 박기선 - 최고 경력자
	'1002': '경영기획팀', // 한승훈 - 퇴사했지만 경영진급
	
	// 경영지원팀 (재무이사 직속)
	'1003': '경영지원팀', // 이건희
	'1004': '경영지원팀', // 문민종 - 퇴사
	'1005': '경영지원팀', // 오지영 - 퇴사
	'1006': '경영지원팀', // 백승현 - 퇴사
	'1007': '경영지원팀', // 두아현 - 퇴사
	'1008': '경영지원팀', // 김수영 - 퇴사
	'1009': '경영지원팀', // 김두현 - 퇴사
	'1010': '경영지원팀', // 정은지 - 퇴사
	'1011': '경영지원팀', // 최시용
	'1012': '경영지원팀', // 김순영 - 퇴사
	'1013': '경영지원팀', // 차수연 - 퇴사
	'1014': '경영지원팀', // 김상환 - 퇴사
	'1015': '경영지원팀', // 김채연 - 퇴사
	'1016': '경영지원팀', // 황태희 - 퇴사
	'1017': '경영지원팀', // 전재일 - 퇴사
	'1018': '경영지원팀', // 장미경 - 퇴사
	'1019': '경영지원팀', // 한가연 - 퇴사
	'1020': '경영지원팀', // 송승엽 - 퇴사
	
	// PSR팀 (연구소장 직속) - 연구개발 중심
	'1021': 'PSR팀', // 차지은
	'1022': 'PSR팀', // 장한진
	'1023': 'PSR팀', // 김대곤
	'1024': 'PSR팀', // 김혁일 - 퇴사
	'1025': 'PSR팀', // 노인규 - 퇴사
	'1026': 'PSR팀', // 이지후
	'1027': 'PSR팀', // 박형일 - 퇴사
	'1028': 'PSR팀', // 정예원 - 퇴사
	'1029': 'PSR팀', // 김수겸 - 퇴사
	'1030': 'PSR팀', // 오준 - 퇴사
	'1031': 'PSR팀', // 김현영
	'1032': 'PSR팀', // 오현종
	'1033': 'PSR팀', // 고동훤
	'1034': 'PSR팀', // 최현민
	'1035': 'PSR팀', // 김성호
	'1036': 'PSR팀', // 장영아
	'1037': 'PSR팀', // 오현아
	'1038': 'PSR팀'  // 최제윤
};

// 직책도 함께 업데이트
const positionAssignments = {
	// 경영기획팀
	'1001': '대표이사', // 박기선
	'1002': '경영기획팀장', // 한승훈
	
	// 경영지원팀
	'1003': '재무이사', // 이건희
	'1004': '경영지원팀장', // 문민종
	'1005': '인사팀장', // 오지영
	'1006': '총무팀장', // 백승현
	'1007': '회계팀장', // 두아현
	'1008': '인사담당', // 김수영
	'1009': '총무담당', // 김두현
	'1010': '회계담당', // 정은지
	'1011': '경영지원담당', // 최시용
	'1012': '인사담당', // 김순영
	'1013': '총무담당', // 차수연
	'1014': '회계담당', // 김상환
	'1015': '경영지원담당', // 김채연
	'1016': '인사담당', // 황태희
	'1017': '총무담당', // 전재일
	'1018': '회계담당', // 장미경
	'1019': '경영지원담당', // 한가연
	'1020': '인사담당', // 송승엽
	
	// PSR팀
	'1021': '연구소장', // 차지은
	'1022': 'PSR팀장', // 장한진
	'1023': '선임연구원', // 김대곤
	'1024': '연구원', // 김혁일
	'1025': '연구원', // 노인규
	'1026': '연구원', // 이지후
	'1027': '연구원', // 박형일
	'1028': '연구원', // 정예원
	'1029': '연구원', // 김수겸
	'1030': '연구원', // 오준
	'1031': '선임연구원', // 김현영
	'1032': '선임연구원', // 오현종
	'1033': '연구원', // 고동훤
	'1034': '연구원', // 최현민
	'1035': '연구원', // 김성호
	'1036': '연구원', // 장영아
	'1037': '연구원', // 오현아
	'1038': '연구원'  // 최제윤
};

async function restoreDepartments() {
	try {
		console.log('🔄 Starting department restoration...');
		
		// 각 직원의 부서와 직책 업데이트
		for (const [employeeId, department] of Object.entries(departmentAssignments)) {
			const position = positionAssignments[employeeId];
			
			await query(`
				UPDATE employees 
				SET department = $1, position = $2, updated_at = $3
				WHERE employee_id = $4
			`, [department, position, new Date(), employeeId]);
			
			console.log(`✅ Updated employee ${employeeId}: ${department} - ${position}`);
		}
		
		// 결과 확인
		console.log('🔍 Verifying department assignments...');
		const result = await query(`
			SELECT 
				department,
				COUNT(*) as count,
				COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
				COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated_count
			FROM employees 
			GROUP BY department
			ORDER BY department
		`);
		
		console.log('📋 Department summary:');
		result.rows.forEach(row => {
			console.log(`  ${row.department}: ${row.count}명 (재직: ${row.active_count}명, 퇴사: ${row.terminated_count}명)`);
		});
		
		// 부서별 직원 목록
		console.log('👥 Department details:');
		const detailResult = await query(`
			SELECT 
				employee_id, first_name, last_name, department, position, status
			FROM employees 
			ORDER BY department, position, employee_id
		`);
		
		let currentDept = '';
		detailResult.rows.forEach(row => {
			if (row.department !== currentDept) {
				console.log(`\n📁 ${row.department}:`);
				currentDept = row.department;
			}
			const statusIcon = row.status === 'active' ? '🟢' : '🔴';
			console.log(`  ${statusIcon} ${row.employee_id}: ${row.last_name}${row.first_name} (${row.position})`);
		});
		
		console.log('\n✅ Department restoration completed successfully!');
		
	} catch (error) {
		console.error('❌ Department restoration failed:', error);
		throw error;
	}
}

// Run the restoration
restoreDepartments()
	.then(() => {
		console.log('🎉 Department restoration completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Department restoration failed:', error);
		process.exit(1);
	});
