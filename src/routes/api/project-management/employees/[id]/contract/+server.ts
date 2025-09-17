import { query } from '$lib/database/connection';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET /api/project-management/employees/[id]/contract - 특정 직원의 참여기간 내 계약 정보 조회
export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const { id } = params;
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

		if (!startDate || !endDate) {
			return json({
				success: false,
				message: '시작일과 종료일이 필요합니다.'
			}, { status: 400 });
		}

		console.log('계약 정보 조회:', { employeeId: id, startDate, endDate });

		// 먼저 해당 직원의 모든 활성 계약을 확인
		const allContractsQuery = `
			SELECT 
				sc.id,
				sc.employee_id,
				sc.annual_salary,
				sc.start_date,
				sc.end_date,
				sc.status,
				sc.contract_type
			FROM salary_contracts sc
			WHERE sc.employee_id = $1 
				AND sc.status = 'active'
			ORDER BY sc.start_date DESC
		`;

		const allContractsResult = await query(allContractsQuery, [id]);
		console.log('해당 직원의 모든 활성 계약:', allContractsResult.rows);

		// 참여기간과 겹치는 활성 계약 조회 (더 유연한 조건)
		const contractQuery = `
			SELECT 
				sc.id,
				sc.employee_id,
				sc.annual_salary,
				sc.start_date,
				sc.end_date,
				sc.status,
				sc.contract_type
			FROM salary_contracts sc
			WHERE sc.employee_id = $1 
				AND sc.status = 'active'
				AND (
					-- 계약이 참여기간과 겹치거나
					(sc.start_date <= $3 AND (sc.end_date IS NULL OR sc.end_date >= $2))
					-- 또는 계약이 참여기간을 포함하거나
					OR (sc.start_date <= $2 AND (sc.end_date IS NULL OR sc.end_date >= $3))
					-- 또는 참여기간이 계약을 포함하거나
					OR (sc.start_date >= $2 AND (sc.end_date IS NULL OR sc.end_date <= $3))
				)
			ORDER BY sc.start_date DESC
			LIMIT 1
		`;

		const result = await query(contractQuery, [id, startDate, endDate]);

		if (result.rows.length === 0) {
			// 계약이 없을 때 더 자세한 정보 제공
			const hasAnyContracts = allContractsResult.rows.length > 0;
			let message = '해당 기간에 유효한 계약이 없습니다.';
			
			if (hasAnyContracts) {
				const latestContract = allContractsResult.rows[0];
				message = `해당 기간(${startDate} ~ ${endDate})에 유효한 계약이 없습니다. 최신 계약: ${latestContract.start_date} ~ ${latestContract.end_date || '무기한'}`;
			} else {
				message = '해당 직원의 활성 계약이 없습니다.';
			}
			
			return json({
				success: false,
				message,
				data: null,
				debug: {
					requestedPeriod: { startDate, endDate },
					availableContracts: allContractsResult.rows.map(c => ({
						start_date: c.start_date,
						end_date: c.end_date,
						annual_salary: c.annual_salary
					}))
				}
			});
		}

		const contract = result.rows[0];
		console.log('찾은 계약:', contract);

		return json({
			success: true,
			data: {
				id: contract.id,
				employee_id: contract.employee_id,
				annual_salary: contract.annual_salary,
				start_date: contract.start_date,
				end_date: contract.end_date,
				status: contract.status,
				contract_type: contract.contract_type
			}
		});

	} catch (error) {
		console.error('계약 정보 조회 실패:', error);
		return json({
			success: false,
			message: '계약 정보를 불러오는데 실패했습니다.',
			error: error instanceof Error ? error.message : '알 수 없는 오류'
		}, { status: 500 });
	}
};
