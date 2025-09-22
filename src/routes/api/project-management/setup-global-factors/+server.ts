import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async () => {
  try {
    // SQL 스크립트 파일 읽기
    const sqlScript = readFileSync(
      join(process.cwd(), 'scripts', 'setup-global-factors.sql'),
      'utf-8'
    )

    // 트랜잭션으로 실행
    await query('BEGIN')

    try {
      // SQL 스크립트 실행
      await query(sqlScript)
      await query('COMMIT')

      return json({
        success: true,
        message: '글로벌 팩터 테이블이 성공적으로 생성되었습니다.'
      })
    } catch (error) {
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('글로벌 팩터 테이블 생성 실패:', error)
    return json(
      {
        success: false,
        message: '글로벌 팩터 테이블 생성에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}
