import { Pool } from 'pg'

// PostgreSQL 연결 풀 생성
let pool: Pool | null = null

export function getDatabasePool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/finance',
      max: 20, // 최대 연결 수
      idleTimeoutMillis: 30000, // 30초
      connectionTimeoutMillis: 2000, // 2초
    })

    // 연결 에러 처리
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
  }

  return pool
}

// 데이터베이스 연결 테스트
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getDatabasePool()
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// 연결 풀 종료
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
