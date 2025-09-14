import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection.js';
import * as ExcelJS from 'exceljs';

export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		
		if (!file) {
			return json({ error: '파일이 선택되지 않았습니다.' }, { status: 400 });
		}

		// 파일 확장자 확인
		const fileName = file.name.toLowerCase();
		const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
		const isCSV = fileName.endsWith('.csv');

		let data: any[] = [];
		let headers: string[] = [];

		if (isExcel) {
			// Excel 파일 파싱
			const buffer = await file.arrayBuffer();
			const workbook = new ExcelJS.Workbook();
			await workbook.xlsx.load(buffer);
			
			const worksheet = workbook.worksheets[0];
			if (!worksheet) {
				return json({ error: 'Excel 파일에 워크시트가 없습니다.' }, { status: 400 });
			}
			
			const rows = worksheet.getRows();
			if (!rows || rows.length < 2) {
				return json({ error: '파일에 데이터가 없습니다.' }, { status: 400 });
			}

			// 헤더 추출 (첫 번째 행)
			headers = rows[0].values.slice(1) as string[]; // ExcelJS는 1-based indexing
			console.log('Excel 파싱된 헤더:', headers);

			// 데이터 추출
			data = rows.slice(1).map((row, index) => {
				const rowData: any = {};
				const rowValues = row.values.slice(1) as any[]; // ExcelJS는 1-based indexing
				headers.forEach((header, headerIndex) => {
					rowData[header] = rowValues[headerIndex] || '';
				});
				console.log(`Excel 행 ${index + 2} 파싱 결과:`, rowData);
				return rowData;
			});
		} else if (isCSV) {
			// CSV 파일 파싱
			const text = await file.text();
			const lines = text.split('\n').filter(line => line.trim());
			
			if (lines.length < 2) {
				return json({ error: '파일에 데이터가 없습니다.' }, { status: 400 });
			}

			// CSV 파싱 함수
			function parseCSVLine(line: string): string[] {
				const result: string[] = [];
				let current = '';
				let inQuotes = false;
				
				for (let i = 0; i < line.length; i++) {
					const char = line[i];
					
					if (char === '"') {
						inQuotes = !inQuotes;
					} else if (char === ',' && !inQuotes) {
						result.push(current.trim());
						current = '';
					} else {
						current += char;
					}
				}
				
				result.push(current.trim());
				return result;
			}

			// 헤더 파싱
			headers = parseCSVLine(lines[0]);
			console.log('CSV 파싱된 헤더:', headers);
			
			// 데이터 파싱
			data = lines.slice(1).map((line, index) => {
				const values = parseCSVLine(line);
				const row: any = {};
				headers.forEach((header, headerIndex) => {
					row[header] = values[headerIndex] || '';
				});
				console.log(`CSV 행 ${index + 2} 파싱 결과:`, row);
				return row;
			});
		} else {
			return json({ error: '지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일을 업로드해주세요.' }, { status: 400 });
		}

		// 데이터 검증 및 변환
		const employees = data.map((row: any, index: number) => {
			const rowNumber = index + 2; // 헤더 행을 고려하여 +2
			
			// 필수 필드 검증 (새로운 템플릿 형식)
			const requiredFields = ['성', '이름', '이메일', '부서', '직급', '급여'];
			const missingFields = requiredFields.filter(field => !row[field] || String(row[field]).trim() === '');
			
			if (missingFields.length > 0) {
				throw new Error(`행 ${rowNumber}: 필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
			}

			// 성과 이름 분리 검증
			const lastName = String(row['성']).trim();
			const firstName = String(row['이름']).trim();
			
			if (!lastName || !firstName) {
				throw new Error(`행 ${rowNumber}: 성과 이름은 반드시 분리되어 입력되어야 합니다.`);
			}

			// 이메일 형식 검증 (있는 경우)
			if (row['이메일'] && row['이메일'].trim() !== '') {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(row['이메일'].trim())) {
					throw new Error(`행 ${rowNumber}: 올바르지 않은 이메일 형식입니다: ${row['이메일']}`);
				}
			}

			// 전화번호 형식 검증 (있는 경우)
			if (row['전화번호'] && row['전화번호'].trim() !== '') {
				const phoneRegex = /^[\d\-\+\(\)\s]+$/;
				if (!phoneRegex.test(row['전화번호'].trim())) {
					throw new Error(`행 ${rowNumber}: 올바르지 않은 전화번호 형식입니다: ${row['전화번호']}`);
				}
			}

			// 급여 검증
			let salary = 0;
			if (row['급여'] && String(row['급여']).trim() !== '') {
				salary = parseFloat(String(row['급여']));
				if (isNaN(salary) || salary < 0) {
					throw new Error(`행 ${rowNumber}: 올바르지 않은 급여 형식입니다: ${row['급여']}`);
				}
			}

			// 입사일 검증
			let hireDate = new Date();
			if (row['입사일'] && String(row['입사일']).trim() !== '') {
				const hireDateValue = row['입사일'];
				
				// Excel 날짜 (숫자)인지 확인
				if (typeof hireDateValue === 'number' && hireDateValue > 25569) {
					// Excel 날짜를 JavaScript Date로 변환 (Excel epoch: 1900-01-01)
					// Excel은 1900년을 1로 시작하지만, JavaScript는 1970년을 0으로 시작
					const excelEpoch = new Date(1900, 0, 1);
					hireDate = new Date(excelEpoch.getTime() + (hireDateValue - 2) * 24 * 60 * 60 * 1000);
				} else {
					// 일반 날짜 문자열 처리
					hireDate = new Date(String(hireDateValue));
				}
				
				if (isNaN(hireDate.getTime())) {
					throw new Error(`행 ${rowNumber}: 올바르지 않은 입사일 형식입니다: ${row['입사일']}`);
				}
			}

			// 상태 검증
			const validStatuses = ['active', 'inactive', 'on_leave'];
			const status = row['상태'] || 'active';
			if (!validStatuses.includes(status)) {
				throw new Error(`행 ${rowNumber}: 올바르지 않은 상태입니다: ${status}. 허용된 값: ${validStatuses.join(', ')}`);
			}

			// 미들네임 처리 (선택사항)
			const middleName = row['미들네임'] ? String(row['미들네임']).trim() : '';
			
			// employee_id 생성 (V00001 형식)
			// 업로드 시에는 임시로 인덱스 기반 생성, 실제 저장 시에는 순차적으로 할당
			const tempId = rowNumber; // 행 번호를 임시 ID로 사용
			const employeeId = `V${tempId.toString().padStart(5, '0')}`;

			return {
				employee_id: employeeId,
				first_name: firstName,
				last_name: lastName,
				middle_name: middleName,
				email: email,
				phone: row['전화번호'] ? String(row['전화번호']).trim() : '',
				department: String(row['부서']).trim(),
				position: String(row['직급']).trim(),
				salary: salary,
				hire_date: hireDate,
				status: status,
				employment_type: row['고용형태'] || 'full-time',
				created_at: new Date(),
				updated_at: new Date()
			};
		});

		// 데이터베이스에 저장
		let successCount = 0;
		
		for (const employee of employees) {
			try {
				console.log('직원 데이터 저장 시도:', employee);
				
				// 새로운 사번 생성 (V00001 형식)
				const countResult = await query('SELECT COUNT(*) as count FROM employees');
				const nextId = (countResult.rows[0]?.count || 0) + 1;
				const newEmployeeId = `V${nextId.toString().padStart(5, '0')}`;
				
				// UPSERT: 이메일이 존재하면 UPDATE, 없으면 INSERT
				await query(`
					INSERT INTO employees (
						employee_id, first_name, last_name, middle_name, email, phone, 
						department, position, salary, hire_date, status, 
						employment_type, created_at, updated_at
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
					ON CONFLICT (email) 
					DO UPDATE SET
						first_name = EXCLUDED.first_name,
						last_name = EXCLUDED.last_name,
						middle_name = EXCLUDED.middle_name,
						phone = EXCLUDED.phone,
						department = EXCLUDED.department,
						position = EXCLUDED.position,
						salary = EXCLUDED.salary,
						hire_date = EXCLUDED.hire_date,
						status = EXCLUDED.status,
						employment_type = EXCLUDED.employment_type,
						updated_at = EXCLUDED.updated_at
				`, [
					newEmployeeId,
					employee.first_name,
					employee.last_name,
					employee.middle_name,
					employee.email,
					employee.phone,
					employee.department,
					employee.position,
					employee.salary,
					employee.hire_date,
					employee.status,
					employee.employment_type,
					employee.created_at,
					employee.updated_at
				]);
				console.log('직원 저장/업데이트 성공:', newEmployeeId);
				successCount++;
			} catch (error) {
				console.error('직원 저장 실패:', error);
				console.error('직원 데이터:', employee);
			}
		}

		return json({
			success: true,
			count: successCount,
			total: employees.length,
			message: `${successCount}명의 직원이 성공적으로 업로드되었습니다.`
		});

	} catch (error) {
		console.error('업로드 에러:', error);
		return json({
			error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.'
		}, { status: 500 });
	}
}
