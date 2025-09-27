#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * 이 스크립트는 데이터베이스 스키마 마이그레이션을 실행합니다.
 * 특히 DATE 타입을 TIMESTAMP WITH TIME ZONE으로 변환하는 마이그레이션을 처리합니다.
 * 
 * 사용법:
 *   npm run migrate
 *   node scripts/migrate.js
 */

import { config } from 'dotenv'
import { readFileSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 환경 변수 로드
config()

// 데이터베이스 설정
const dbConfig = {
  host: process.env.AWS_DB_HOST || 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: parseInt(process.env.AWS_DB_PORT || '5432'),
  database: process.env.AWS_DB_NAME || 'postgres',
  user: process.env.AWS_DB_USER || 'postgres',
  password: process.env.AWS_DB_PASSWORD || 'viahubdev',
  ssl: {
    rejectUnauthorized: false,
  },
}

// 마이그레이션 파일 경로
const MIGRATION_FILE = join(process.cwd(), 'src/lib/database/migrations/001-convert-date-to-timestamp.sql')

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function runMigration() {
  const pool = new Pool(dbConfig)
  
  try {
    log('🚀 데이터베이스 마이그레이션을 시작합니다...', 'cyan')
    
    // 마이그레이션 파일 읽기
    log('📖 마이그레이션 파일을 읽는 중...', 'blue')
    const migrationsDir = join(__dirname, '../src/lib/database/migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()
    
    if (migrationFiles.length === 0) {
      throw new Error('마이그레이션 파일을 찾을 수 없습니다.')
    }
    
    // 가장 최신 마이그레이션 파일 실행 (002-simple-date-to-timestamp.sql)
    const latestMigration = migrationFiles.find(file => file.includes('002-simple-date-to-timestamp')) || migrationFiles[0]
    const migrationSQL = readFileSync(join(migrationsDir, latestMigration), 'utf8')
    
    if (!migrationSQL.trim()) {
      throw new Error('마이그레이션 파일이 비어있습니다.')
    }
    
    log('✅ 마이그레이션 파일 로드 완료', 'green')
    
    // 데이터베이스 연결 테스트
    log('🔌 데이터베이스 연결을 테스트하는 중...', 'blue')
    const client = await pool.connect()
    
    try {
      const result = await client.query('SELECT NOW() as current_time')
      log(`✅ 데이터베이스 연결 성공: ${result.rows[0].current_time}`, 'green')
    } finally {
      client.release()
    }
    
    // 백업 테이블 존재 여부 확인
    log('🔍 백업 테이블 존재 여부를 확인하는 중...', 'blue')
    const backupCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'backup_%'
    `)
    
    if (backupCheck.rows.length > 0) {
      log(`⚠️  기존 백업 테이블 발견: ${backupCheck.rows.map(r => r.table_name).join(', ')}`, 'yellow')
      log('   마이그레이션이 이미 실행되었을 수 있습니다.', 'yellow')
      
      const readline = await import('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      const answer = await new Promise<string>((resolve) => {
        rl.question('계속 진행하시겠습니까? (y/N): ', resolve)
      })
      
      rl.close()
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        log('❌ 마이그레이션이 취소되었습니다.', 'red')
        return
      }
    }
    
    // 마이그레이션 실행
    log('⚡ 마이그레이션을 실행하는 중...', 'magenta')
    log('   이 작업은 몇 분이 걸릴 수 있습니다...', 'yellow')
    
    const startTime = Date.now()
    await pool.query(migrationSQL)
    const endTime = Date.now()
    
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    log(`✅ 마이그레이션 완료! (소요시간: ${duration}초)`, 'green')
    
    // 결과 검증
    log('🔍 마이그레이션 결과를 검증하는 중...', 'blue')
    
    const verification = await pool.query(`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name IN (
        'date', 'hire_date', 'start_date', 'end_date',
        'period_start', 'period_end', 'last_contact',
        'next_action_date', 'renewal_date'
      )
      ORDER BY table_name, column_name
    `)
    
    log('📊 변환된 칼럼 목록:', 'cyan')
    verification.rows.forEach(row => {
      const status = row.data_type === 'timestamp with time zone' ? '✅' : '❌'
      log(`   ${status} ${row.table_name}.${row.column_name}: ${row.data_type}`)
    })
    
    // 성공 통계
    const successCount = verification.rows.filter(r => r.data_type === 'timestamp with time zone').length
    const totalCount = verification.rows.length
    
    if (successCount === totalCount) {
      log(`🎉 모든 칼럼이 성공적으로 변환되었습니다! (${successCount}/${totalCount})`, 'green')
    } else {
      log(`⚠️  일부 칼럼 변환에 실패했습니다. (${successCount}/${totalCount})`, 'yellow')
    }
    
    // 정리 안내
    log('🧹 정리 안내:', 'cyan')
    log('   - 백업 테이블은 마이그레이션 검증 후 수동으로 삭제하세요', 'yellow')
    log('   - 애플리케이션을 재시작하여 새로운 스키마를 적용하세요', 'yellow')
    log('   - 날짜 관련 기능을 테스트해보세요', 'yellow')
    
  } catch (error) {
    log(`❌ 마이그레이션 실패: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// 스크립트 실행
runMigration()
  .then(() => {
    log('🏁 마이그레이션 프로세스가 완료되었습니다.', 'green')
    process.exit(0)
  })
  .catch((error) => {
    log(`💥 치명적 오류: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  })

export { runMigration }
