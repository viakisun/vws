import { json } from '@sveltejs/kit';
import { query } from '$lib/database/connection.js';
import * as XLSX from 'xlsx';

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
			const workbook = XLSX.read(buffer, { type: 'array' });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			
			// Excel 데이터를 JSON으로 변환
			const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
			
			if (jsonData.length < 2) {
				return json({ error: '파일에 데이터가 없습니다.' }, { status: 400 });
			}

			// 헤더 추출
			headers = jsonData[0] as string[];
			console.log('프로젝트 Excel 파싱된 헤더:', headers);

			// 데이터 추출
			data = jsonData.slice(1).map((row: any, index: number) => {
				const rowData: any = {};
				headers.forEach((header, headerIndex) => {
					rowData[header] = row[headerIndex] || '';
				});
				console.log(`프로젝트 Excel 행 ${index + 2} 파싱 결과:`, rowData);
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
			console.log('프로젝트 CSV 파싱된 헤더:', headers);
			
			// 데이터 파싱
			data = lines.slice(1).map((line, index) => {
				const values = parseCSVLine(line);
				const row: any = {};
				headers.forEach((header, headerIndex) => {
					row[header] = values[headerIndex] || '';
				});
				console.log(`프로젝트 CSV 행 ${index + 2} 파싱 결과:`, row);
				return row;
			});
		} else {
			return json({ error: '지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일을 업로드해주세요.' }, { status: 400 });
		}

		// 데이터 검증 및 변환
		const projects = data.map((row: any, index: number) => {
			const rowNumber = index + 2; // 헤더 행을 고려하여 +2
			
			// 필수 필드 검증
			const requiredFields = ['프로젝트명', '시작일', '종료일'];
			const missingFields = requiredFields.filter(field => !row[field] || String(row[field]).trim() === '');
			
			if (missingFields.length > 0) {
				throw new Error(`행 ${rowNumber}: 필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
			}

			// 날짜 검증 (Excel 날짜 지원)
			const parseExcelDate = (dateValue: any): Date => {
				if (typeof dateValue === 'number' && dateValue > 25569) {
					// Excel 날짜를 JavaScript Date로 변환
					const excelEpoch = new Date(1900, 0, 1);
					return new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
				} else {
					return new Date(String(dateValue));
				}
			};
			
			const startDate = parseExcelDate(row['시작일']);
			const endDate = parseExcelDate(row['종료일']);
			
			if (isNaN(startDate.getTime())) {
				throw new Error(`행 ${rowNumber}: 올바르지 않은 시작일 형식입니다: ${row['시작일']}`);
			}
			
			if (isNaN(endDate.getTime())) {
				throw new Error(`행 ${rowNumber}: 올바르지 않은 종료일 형식입니다: ${row['종료일']}`);
			}
			
			if (startDate >= endDate) {
				throw new Error(`행 ${rowNumber}: 시작일은 종료일보다 이전이어야 합니다.`);
			}

			// 예산 검증
			let budget = 0;
			if (row['예산'] && String(row['예산']).trim() !== '') {
				budget = parseFloat(String(row['예산']));
				if (isNaN(budget) || budget < 0) {
					throw new Error(`행 ${rowNumber}: 올바르지 않은 예산 형식입니다: ${row['예산']}`);
				}
			}

			// 상태 검증
			const validStatuses = ['planning', 'active', 'completed', 'cancelled', 'on_hold'];
			const status = row['상태'] || 'planning';
			if (!validStatuses.includes(status)) {
				throw new Error(`행 ${rowNumber}: 올바르지 않은 상태입니다: ${status}. 허용된 값: ${validStatuses.join(', ')}`);
			}

			// 카테고리 검증
			const validCategories = ['development', 'research', 'infrastructure', 'maintenance', 'other'];
			const category = row['카테고리'] || 'development';
			if (!validCategories.includes(category)) {
				throw new Error(`행 ${rowNumber}: 올바르지 않은 카테고리입니다: ${category}. 허용된 값: ${validCategories.join(', ')}`);
			}

			// 우선순위 검증
			const validPriorities = ['low', 'medium', 'high', 'urgent'];
			const priority = row['우선순위'] || 'medium';
			if (!validPriorities.includes(priority)) {
				throw new Error(`행 ${rowNumber}: 올바르지 않은 우선순위입니다: ${priority}. 허용된 값: ${validPriorities.join(', ')}`);
			}

			// 프로젝트 코드 생성 (프로젝트명 기반 + 타임스탬프)
			const projectName = String(row['프로젝트명']).trim();
			const timestamp = Date.now().toString().slice(-6);
			const random = Math.random().toString(36).substr(2, 4);
			const projectCode = projectName.replace(/[^a-zA-Z0-9가-힣]/g, '').substring(0, 15) + '_' + timestamp + '_' + random;

			return {
				code: projectCode,
				title: projectName,
				description: row['설명'] ? String(row['설명']).trim() : '',
				start_date: startDate,
				end_date: endDate,
				budget_total: budget,
				status: status,
				sponsor: row['담당자'] ? String(row['담당자']).trim() : '',
				sponsor_type: 'internal',
				created_at: new Date(),
				updated_at: new Date()
			};
		});

		// 데이터베이스에 저장
		let successCount = 0;
		
		for (const project of projects) {
			try {
				// UPSERT: 프로젝트 코드가 존재하면 UPDATE, 없으면 INSERT
				await query(`
					INSERT INTO projects (
						code, title, description, start_date, end_date, 
						budget_total, status, sponsor, sponsor_type, 
						created_at, updated_at
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
					ON CONFLICT (code) 
					DO UPDATE SET
						title = EXCLUDED.title,
						description = EXCLUDED.description,
						start_date = EXCLUDED.start_date,
						end_date = EXCLUDED.end_date,
						budget_total = EXCLUDED.budget_total,
						status = EXCLUDED.status,
						sponsor = EXCLUDED.sponsor,
						sponsor_type = EXCLUDED.sponsor_type,
						updated_at = EXCLUDED.updated_at
				`, [
					project.code,
					project.title,
					project.description,
					project.start_date,
					project.end_date,
					project.budget_total,
					project.status,
					project.sponsor,
					project.sponsor_type,
					project.created_at,
					project.updated_at
				]);
				successCount++;
			} catch (error) {
				console.error('프로젝트 저장 실패:', error);
			}
		}

		return json({
			success: true,
			count: successCount,
			total: projects.length,
			message: `${successCount}개의 프로젝트가 성공적으로 업로드되었습니다.`
		});

	} catch (error) {
		console.error('업로드 에러:', error);
		return json({
			error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.'
		}, { status: 500 });
	}
}
