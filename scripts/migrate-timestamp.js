#!/usr/bin/env node
// 프로젝트 날짜 필드를 DATE에서 TIMESTAMP WITH TIME ZONE으로 마이그레이션

import pg from 'pg'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env') })

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'workstream',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
})

async function runMigration() {
  const client = await pool.connect()

  try {
    console.log('🚀 프로젝트 날짜 필드 마이그레이션 시작...')

    // 트랜잭션 시작
    await client.query('BEGIN')

    // projects.start_date 마이그레이션
    console.log('  ⏳ projects.start_date를 TIMESTAMP WITH TIME ZONE으로 변환 중...')
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'projects' 
            AND column_name = 'start_date' 
            AND data_type = 'date'
        ) THEN
          ALTER TABLE projects 
          ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE 
          USING start_date::TIMESTAMP WITH TIME ZONE;
          RAISE NOTICE 'projects.start_date 변환 완료';
        ELSE
          RAISE NOTICE 'projects.start_date는 이미 TIMESTAMP WITH TIME ZONE 타입입니다';
        END IF;
      END $$;
    `)

    // projects.end_date 마이그레이션
    console.log('  ⏳ projects.end_date를 TIMESTAMP WITH TIME ZONE으로 변환 중...')
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'projects' 
            AND column_name = 'end_date' 
            AND data_type = 'date'
        ) THEN
          ALTER TABLE projects 
          ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE 
          USING end_date::TIMESTAMP WITH TIME ZONE;
          RAISE NOTICE 'projects.end_date 변환 완료';
        ELSE
          RAISE NOTICE 'projects.end_date는 이미 TIMESTAMP WITH TIME ZONE 타입입니다';
        END IF;
      END $$;
    `)

    // 트랜잭션 커밋
    await client.query('COMMIT')

    console.log('✅ 마이그레이션 완료!')

    // 결과 확인
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
        AND column_name IN ('start_date', 'end_date')
      ORDER BY column_name;
    `)

    console.log('\n📊 현재 projects 테이블 날짜 필드 타입:')
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`)
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 마이그레이션 실패:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 마이그레이션 중 오류 발생:', error)
    process.exit(1)
  })
