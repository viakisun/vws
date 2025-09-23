import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database configuration
const dbConfig = {
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: {
    rejectUnauthorized: false
  }
}

async function setupEvidenceDatabase() {
  const pool = new Pool(dbConfig)

  try {
    console.log('데이터베이스 연결 중...')

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'setup-evidence-management.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('증빙 관리 데이터베이스 스키마 실행 중...')

    // SQL 실행
    await pool.query(sqlContent)

    console.log('✅ 증빙 관리 데이터베이스 스키마가 성공적으로 생성되었습니다!')

    // 테이블 확인
    const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'evidence_%'
            ORDER BY table_name
        `)

    console.log('\n생성된 테이블:')
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`)
    })

    // 뷰 확인
    const viewsResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'evidence_%'
            ORDER BY table_name
        `)

    console.log('\n생성된 뷰:')
    viewsResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`)
    })

    // 기본 데이터 확인
    const categoriesResult = await pool.query('SELECT * FROM evidence_categories')
    console.log('\n기본 증빙 카테고리:')
    categoriesResult.rows.forEach(row => {
      console.log(`- ${row.name}: ${row.description}`)
    })
  } catch (error) {
    console.error('❌ 데이터베이스 설정 중 오류 발생:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// 실행
setupEvidenceDatabase()
  .then(() => {
    console.log('\n🎉 증빙 관리 데이터베이스 설정이 완료되었습니다!')
    process.exit(0)
  })
  .catch(error => {
    console.error('설정 실패:', error)
    process.exit(1)
  })

export { setupEvidenceDatabase }
