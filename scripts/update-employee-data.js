import { query } from '../src/lib/database/connection.ts';

// 직원 데이터 (입사일 순)
const employeeData = [
	{ name: '박기선', hireDate: '2019-05-01', birthDate: '1978-01-22', terminationDate: null },
	{ name: '한승훈', hireDate: '2020-05-01', birthDate: '1979-10-31', terminationDate: '2022-08-31' },
	{ name: '이건희', hireDate: '2020-07-06', birthDate: '1995-01-03', terminationDate: null },
	{ name: '문민종', hireDate: '2020-11-01', birthDate: '1995-06-08', terminationDate: '2023-08-31' },
	{ name: '오지영', hireDate: '2021-06-01', birthDate: '1978-02-16', terminationDate: '2022-10-31' },
	{ name: '백승현', hireDate: '2021-07-01', birthDate: '1994-01-06', terminationDate: '2025-05-31' },
	{ name: '두아현', hireDate: '2021-07-01', birthDate: '1996-05-08', terminationDate: '2022-10-31' },
	{ name: '김수영', hireDate: '2021-12-01', birthDate: '1999-12-02', terminationDate: '2023-08-31' },
	{ name: '김두현', hireDate: '2022-03-01', birthDate: '1997-01-22', terminationDate: '2023-08-31' },
	{ name: '정은지', hireDate: '2022-03-01', birthDate: '1997-05-12', terminationDate: '2025-06-30' },
	{ name: '최시용', hireDate: '2022-04-01', birthDate: '1991-10-23', terminationDate: null },
	{ name: '김순영', hireDate: '2022-08-16', birthDate: '1979-07-26', terminationDate: '2022-08-31' },
	{ name: '차수연', hireDate: '2022-09-01', birthDate: '1984-03-21', terminationDate: '2023-10-31' },
	{ name: '김상환', hireDate: '2022-09-01', birthDate: '1978-11-16', terminationDate: '2022-11-30' },
	{ name: '김채연', hireDate: '2022-10-01', birthDate: '1999-05-14', terminationDate: '2023-10-31' },
	{ name: '황태희', hireDate: '2022-11-01', birthDate: '1970-03-01', terminationDate: '2023-10-31' },
	{ name: '전재일', hireDate: '2023-01-01', birthDate: '1973-09-10', terminationDate: '2023-10-31' },
	{ name: '장미경', hireDate: '2023-03-01', birthDate: '1978-02-06', terminationDate: '2024-11-30' },
	{ name: '한가연', hireDate: '2023-04-01', birthDate: '1996-10-15', terminationDate: '2023-10-31' },
	{ name: '송승엽', hireDate: '2023-06-01', birthDate: '1984-02-28', terminationDate: '2023-10-31' },
	{ name: '차지은', hireDate: '2023-12-11', birthDate: '1993-11-13', terminationDate: null },
	{ name: '장한진', hireDate: '2024-09-01', birthDate: '1988-08-05', terminationDate: null },
	{ name: '김대곤', hireDate: '2024-10-01', birthDate: '1980-02-14', terminationDate: null },
	{ name: '김혁일', hireDate: '2024-10-01', birthDate: '1997-07-25', terminationDate: '2024-11-30' },
	{ name: '노인규', hireDate: '2024-12-01', birthDate: '1973-03-23', terminationDate: '2025-02-28' },
	{ name: '이지후', hireDate: '2024-12-01', birthDate: '1991-07-04', terminationDate: null },
	{ name: '박형일', hireDate: '2024-12-01', birthDate: '1996-02-13', terminationDate: '2025-02-28' },
	{ name: '정예원', hireDate: '2024-12-01', birthDate: '1997-10-19', terminationDate: '2025-02-28' },
	{ name: '김수겸', hireDate: '2025-01-01', birthDate: '1994-10-08', terminationDate: '2025-02-28' },
	{ name: '오준', hireDate: '2025-01-16', birthDate: '1993-02-19', terminationDate: '2025-03-31' },
	{ name: '김현영', hireDate: '2025-02-01', birthDate: '1985-07-21', terminationDate: null },
	{ name: '오현종', hireDate: '2025-03-01', birthDate: '1980-02-25', terminationDate: null },
	{ name: '고동훤', hireDate: '2025-05-01', birthDate: '1993-09-23', terminationDate: null },
	{ name: '최현민', hireDate: '2025-07-01', birthDate: '1982-03-11', terminationDate: null },
	{ name: '김성호', hireDate: '2025-07-14', birthDate: '1986-01-05', terminationDate: null },
	{ name: '장영아', hireDate: '2025-07-14', birthDate: '2000-08-12', terminationDate: null },
	{ name: '오현아', hireDate: '2025-09-01', birthDate: '1979-07-04', terminationDate: null },
	{ name: '최제윤', hireDate: '2025-09-01', birthDate: '1996-07-29', terminationDate: null }
];

async function updateEmployeeData() {
	try {
		console.log('🔄 Starting employee data update...');
		
		// 기존 직원 데이터 삭제
		console.log('🗑️ Clearing existing employee data...');
		await query('DELETE FROM employees');
		
		// 직원 데이터 삽입
		console.log('👥 Inserting employee data...');
		let employeeId = 1001;
		
		for (const emp of employeeData) {
			const [lastName, firstName] = emp.name.length === 2 ? [emp.name[0], emp.name[1]] : [emp.name.slice(0, 1), emp.name.slice(1)];
			
			const status = emp.terminationDate ? 'terminated' : 'active';
			const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`;
			
			await query(`
				INSERT INTO employees (
					employee_id, first_name, last_name, email, phone,
					department, position, salary, hire_date, birth_date, termination_date, status,
					employment_type, created_at, updated_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
			`, [
				employeeId.toString(),
				firstName,
				lastName,
				email,
				'010-0000-0000',
				'부서없음',
				'직원',
				30000000, // 기본 급여 3천만원
				emp.hireDate,
				emp.birthDate,
				emp.terminationDate,
				status,
				'full-time',
				new Date(),
				new Date()
			]);
			
			console.log(`✅ Added employee: ${emp.name} (ID: ${employeeId})`);
			employeeId++;
		}
		
		// 결과 확인
		console.log('🔍 Verifying data...');
		const result = await query(`
			SELECT 
				employee_id, first_name, last_name, hire_date, birth_date, termination_date, status, department
			FROM employees 
			ORDER BY hire_date ASC
		`);
		
		console.log('📋 Employee data summary:');
		console.log(`Total employees: ${result.rows.length}`);
		console.log(`Active employees: ${result.rows.filter(r => r.status === 'active').length}`);
		console.log(`Terminated employees: ${result.rows.filter(r => r.status === 'terminated').length}`);
		
		console.log('📅 First 5 employees:');
		result.rows.slice(0, 5).forEach(row => {
			console.log(`  ${row.employee_id}: ${row.last_name}${row.first_name} (입사: ${row.hire_date}, 생일: ${row.birth_date})`);
		});
		
		console.log('✅ Employee data update completed successfully!');
		
	} catch (error) {
		console.error('❌ Employee data update failed:', error);
		throw error;
	}
}

// Run the update
updateEmployeeData()
	.then(() => {
		console.log('🎉 Employee data update completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Employee data update failed:', error);
		process.exit(1);
	});
