// Finance 모듈은 메인 데이터베이스 연결을 사용
import { getConnection } from '$lib/database/connection'

// Finance 모듈용 래퍼 함수들
export function getDatabasePool() {
  // 메인 데이터베이스 연결을 사용
  return getConnection()
}

// 데이터베이스 연결 테스트
export async function testConnection(): Promise<boolean> {
  try {
    const client = await getConnection()
    await client.query('SELECT NOW()')
    client.release()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// 연결 풀 종료 (메인 연결은 메인에서 관리)
export async function closePool(): Promise<void> {
  // 메인 데이터베이스 연결은 메인에서 관리하므로 여기서는 아무것도 하지 않음
  console.log('Finance module using main database connection - no action needed')
}
