// Finance 모듈은 메인 데이터베이스 연결을 사용
import { query } from '$lib/database/connection'

// Finance 모듈용 래퍼 함수들
export function getDatabasePool() {
  // 메인 데이터베이스 연결을 사용
  return query
}

// 데이터베이스 연결 테스트
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT NOW()')
    return true
  } catch (_error) {
    // 연결 실패 시 로그는 상위 레벨에서 처리
    return false
  }
}

// 연결 풀 종료 (메인 연결은 메인에서 관리)
export function closePool(): void {
  // 메인 데이터베이스 연결은 메인에서 관리하므로 여기서는 아무것도 하지 않음
  // 로그는 필요시 상위 레벨에서 처리
}
