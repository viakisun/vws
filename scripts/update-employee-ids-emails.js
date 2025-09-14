import { query } from '../src/lib/database/connection.ts';

// 한글 이름을 영문 이메일로 변환하는 함수
function generateEmail(firstName, lastName) {
	// 한글 이름을 영문으로 변환하는 매핑
	const nameMapping = {
		// 성씨
		'박': 'park', '김': 'kim', '이': 'lee', '최': 'choi', '정': 'jung', '한': 'han',
		'문': 'moon', '오': 'oh', '백': 'baek', '두': 'doo', '차': 'cha', '황': 'hwang',
		'전': 'jeon', '장': 'jang', '송': 'song', '노': 'no', '고': 'ko',
		
		// 이름
		'기선': 'kiseon', '승훈': 'seunghoon', '건희': 'gunhee', '민종': 'minjong',
		'지영': 'jiyoung', '승현': 'seunghyun', '아현': 'ahyun', '수영': 'suyoung',
		'두현': 'doohyun', '은지': 'eunji', '시용': 'siyong', '순영': 'sunyoung',
		'수연': 'suyeon', '상환': 'sanghwan', '채연': 'chaeyeon', '태희': 'taehee',
		'재일': 'jaeil', '미경': 'mikyung', '가연': 'gayeon', '승엽': 'seungyeop',
		'지은': 'jieun', '한진': 'hanjin', '대곤': 'daegon', '혁일': 'hyukil',
		'인규': 'ingyu', '지후': 'jihuu', '형일': 'hyungil', '예원': 'yewon',
		'수겸': 'sugyeom', '준': 'jun', '현영': 'hyunyoung', '현종': 'hyunjong',
		'동훤': 'donghwon', '현민': 'hyunmin', '성호': 'sungho', '영아': 'younga',
		'현아': 'hyuna', '제윤': 'jeyoon'
	};
	
	// 성과 이름을 영문으로 변환
	const lastEng = nameMapping[lastName] || lastName.toLowerCase();
	const firstEng = nameMapping[firstName] || firstName.toLowerCase();
	
	// 이메일 형식: kspark@viasoft.ai (이름성@viasoft.ai)
	return `${firstEng}${lastEng}@viasoft.ai`;
}

// 이메일 중복 체크 및 번호 추가
function generateUniqueEmail(firstName, lastName, existingEmails) {
	let baseEmail = generateEmail(firstName, lastName);
	let email = baseEmail;
	let counter = 1;
	
	// 중복 체크
	while (existingEmails.includes(email)) {
		counter++;
		const counterStr = counter.toString().padStart(2, '0');
		email = baseEmail.replace('@viasoft.ai', `${counterStr}@viasoft.ai`);
	}
	
	return email;
}

async function updateEmployeeIdsAndEmails() {
	try {
		console.log('🔄 Starting employee ID and email update...');
		
		// 모든 직원 조회 (입사일 순으로 정렬)
		const employeesResult = await query(`
			SELECT id, first_name, last_name, hire_date, employee_id, email
			FROM employees 
			ORDER BY hire_date ASC
		`);
		
		const employees = employeesResult.rows;
		console.log(`📋 Found ${employees.length} employees to update`);
		
		// 새로운 사번과 이메일 생성
		const updates = [];
		const existingEmails = [];
		
		employees.forEach((emp, index) => {
			const newEmployeeId = (1001 + index).toString();
			const newEmail = generateUniqueEmail(emp.first_name, emp.last_name, existingEmails);
			
			existingEmails.push(newEmail);
			
			updates.push({
				id: emp.id,
				oldEmployeeId: emp.employee_id,
				newEmployeeId: newEmployeeId,
				oldEmail: emp.email,
				newEmail: newEmail,
				name: `${emp.last_name}${emp.first_name}`
			});
		});
		
		// 데이터베이스 업데이트 (사번 중복 방지를 위해 2단계로 진행)
		console.log('📝 Updating employee IDs and emails...');
		
		// 1단계: 모든 사번을 임시 번호로 변경
		console.log('🔄 Step 1: Setting temporary employee IDs...');
		for (let i = 0; i < updates.length; i++) {
			const update = updates[i];
			const tempId = `TEMP${i + 1}`;
			await query(`
				UPDATE employees 
				SET employee_id = $1, updated_at = $2
				WHERE id = $3
			`, [tempId, new Date(), update.id]);
		}
		
		// 2단계: 최종 사번과 이메일로 업데이트
		console.log('🔄 Step 2: Setting final employee IDs and emails...');
		for (const update of updates) {
			await query(`
				UPDATE employees 
				SET employee_id = $1, email = $2, updated_at = $3
				WHERE id = $4
			`, [update.newEmployeeId, update.newEmail, new Date(), update.id]);
			
			console.log(`✅ ${update.name}: ${update.oldEmployeeId} → ${update.newEmployeeId}, ${update.oldEmail} → ${update.newEmail}`);
		}
		
		// 결과 확인
		console.log('\n🔍 Verifying updates...');
		const result = await query(`
			SELECT 
				employee_id, first_name, last_name, email, hire_date, department, position
			FROM employees 
			ORDER BY employee_id ASC
		`);
		
		console.log('📋 Updated employee list:');
		result.rows.forEach(row => {
			const statusIcon = row.employee_id.startsWith('10') ? '🟢' : '🔴';
			console.log(`${statusIcon} ${row.employee_id}: ${row.last_name}${row.first_name} (${row.email}) - ${row.department} ${row.position}`);
		});
		
		// 이메일 도메인 확인
		const emailDomains = await query(`
			SELECT 
				SUBSTRING(email FROM '@(.+)$') as domain,
				COUNT(*) as count
			FROM employees 
			GROUP BY SUBSTRING(email FROM '@(.+)$')
		`);
		
		console.log('\n📧 Email domain summary:');
		emailDomains.rows.forEach(row => {
			console.log(`  ${row.domain}: ${row.count}명`);
		});
		
		console.log('\n✅ Employee ID and email update completed successfully!');
		
	} catch (error) {
		console.error('❌ Employee ID and email update failed:', error);
		throw error;
	}
}

// Run the update
updateEmployeeIdsAndEmails()
	.then(() => {
		console.log('🎉 Employee ID and email update completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Employee ID and email update failed:', error);
		process.exit(1);
	});
