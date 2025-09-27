import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 이사급 직원들을 이사 명부로 이관하고 직원 명부에서 제외
export const POST: RequestHandler = async () => {
  try {
    // 이사급 직원들을 찾기 (대표, 이사, 상무 등)
    const executivePositions = [
      '대표',
      '이사',
      '상무',
      '대표이사',
      '연구소장',
      '기술이사',
      '상무이사',
    ]

    const executiveEmployees = await query(
      `
			SELECT * FROM employees 
			WHERE position IN (${executivePositions.map((_, i) => `$${i + 1}`).join(', ')})
			AND status = 'active'
		`,
      executivePositions,
    )

    // 임원 직원 마이그레이션 시작

    const migratedExecutives: unknown[] = []

    for (const employee of executiveEmployees.rows) {
      const emp = employee as Record<string, unknown>
      // 직책 매핑
      let jobTitleName = 'CEO' // 기본값
      const position = String(emp.position)
      if (position.includes('대표')) {
        jobTitleName = 'CEO'
      } else if (position.includes('연구소장') || position.includes('기술이사')) {
        jobTitleName = 'CTO'
      } else if (position.includes('상무')) {
        jobTitleName = 'CFO'
      } else if (position.includes('이사')) {
        jobTitleName = 'Director'
      }

      // 해당 직책 ID 찾기
      const jobTitleResult = await query('SELECT id FROM job_titles WHERE name = $1', [
        jobTitleName,
      ])

      if (jobTitleResult.rows.length === 0) {
        // 직책을 찾을 수 없음, 건너뛰기
        continue
      }

      const jobTitleId = (jobTitleResult.rows[0] as Record<string, unknown>).id

      // Executive ID 생성
      const execIdResult = await query('SELECT COUNT(*) as count FROM executives')
      const execCount = parseInt(String((execIdResult.rows[0] as Record<string, unknown>).count)) + 1
      const executiveId = `EXE${execCount.toString().padStart(3, '0')}`

      // 이사 명부에 추가
      const executiveResult = await query(
        `
				INSERT INTO executives (
					executive_id, first_name, last_name, email, phone, job_title_id, 
					department, appointment_date, status, bio, created_at, updated_at
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
				RETURNING id, executive_id, first_name, last_name, email, job_title_id
			`,
        [
          executiveId,
          emp.first_name,
          emp.last_name,
          emp.email,
          emp.phone,
          jobTitleId,
          emp.department,
          emp.hire_date,
          'active',
          `${position}로 임명된 임원진입니다.`,
          new Date(),
          new Date(),
        ],
      )

      migratedExecutives.push(executiveResult.rows[0])

      // 직원 명부에서 비활성화 (완전 삭제하지 않고 상태만 변경)
      await query(
        `
				UPDATE employees SET
					status = 'inactive',
					updated_at = $1
				WHERE id = $2
			`,
        [new Date(), emp.id],
      )

      // 임원 테이블로 마이그레이션 완료
    }

    const response: ApiResponse<unknown> = {
      success: true,
      message: `${migratedExecutives.length}명의 이사급 직원이 이사 명부로 이관되었습니다.`,
      data: {
        migratedCount: migratedExecutives.length,
        migratedExecutives: migratedExecutives,
      },
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('Error migrating executives:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '이사급 직원 이관에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
