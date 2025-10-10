#!/usr/bin/env tsx
/**
 * 리소스 검증 스크립트
 *
 * resources.ts와 DB의 permissions 테이블이 일치하는지 검증합니다.
 *
 * Usage:
 *   npm run validate-resources
 *   tsx scripts/validate-resources.ts
 */

import { Pool } from 'pg'
import { getResourceData } from '../src/lib/config/resources.js'

type ResourceDefinition = ReturnType<typeof getResourceData>[number]

// ============================================
// 설정
// ============================================

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:viahubdev@db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com:5432/postgres'

const pool = new Pool({
  connectionString: DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

// ============================================
// 색상 유틸리티
// ============================================

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function color(text: string, colorCode: string): string {
  return `${colorCode}${text}${colors.reset}`
}

// ============================================
// 리소스 추출
// ============================================

/**
 * resources.ts에서 모든 리소스 키 추출
 * 모든 리소스 포함 (부모 + 자식 모두)
 */
function extractAllResourceKeys(resources: readonly ResourceDefinition[]): string[] {
  const keys = new Set<string>()

  function extract(resource: ResourceDefinition) {
    // 모든 리소스 포함
    keys.add(resource.key)

    // 하위 리소스 재귀 처리
    if (resource.children) {
      resource.children.forEach((child) => extract(child))
    }
  }

  resources.forEach((res) => extract(res))
  return Array.from(keys).sort()
}

/**
 * DB에서 모든 리소스 조회
 */
async function getDBResources(): Promise<string[]> {
  const result = await pool.query<{ resource: string }>(`
    SELECT DISTINCT resource 
    FROM permissions 
    ORDER BY resource
  `)
  return result.rows.map((row) => row.resource)
}

// ============================================
// 비교 및 검증
// ============================================

interface ValidationResult {
  success: boolean
  codeResources: string[]
  dbResources: string[]
  missingInDB: string[]
  missingInCode: string[]
  matched: string[]
}

async function validateResources(): Promise<ValidationResult> {
  console.log(color('\n🔍 Validating resources...', colors.cyan))
  console.log(color('━'.repeat(60), colors.blue))

  // 1. 리소스 추출
  console.log('\n📋 Extracting resources from code...')
  const resourceData = getResourceData()
  const codeResources = extractAllResourceKeys(resourceData)
  console.log(color(`   Found ${codeResources.length} resources`, colors.green))

  console.log('\n📋 Fetching resources from database...')
  const dbResources = await getDBResources()
  console.log(color(`   Found ${dbResources.length} resources`, colors.green))

  // 2. 비교
  const codeSet = new Set(codeResources)
  const dbSet = new Set(dbResources)

  const missingInDB = codeResources.filter((r) => !dbSet.has(r))
  const missingInCode = dbResources.filter((r) => !codeSet.has(r))
  const matched = codeResources.filter((r) => dbSet.has(r))

  // 3. 결과 출력
  console.log(color('\n━'.repeat(60), colors.blue))
  console.log(color('\n📊 Validation Results:', colors.bold))

  if (missingInDB.length === 0 && missingInCode.length === 0) {
    console.log(color('\n✅ Perfect match! All resources are synchronized.', colors.green))
  } else {
    console.log(color('\n❌ Found mismatches:', colors.red))

    if (missingInDB.length > 0) {
      console.log(color('\n⚠️  Resources in code but NOT in DB:', colors.yellow))
      missingInDB.forEach((resource) => {
        console.log(color(`   - ${resource}`, colors.yellow))
      })
      console.log(color(`   Total: ${missingInDB.length}`, colors.yellow))
    }

    if (missingInCode.length > 0) {
      console.log(color('\n⚠️  Resources in DB but NOT in code:', colors.yellow))
      missingInCode.forEach((resource) => {
        console.log(color(`   - ${resource}`, colors.yellow))
      })
      console.log(color(`   Total: ${missingInCode.length}`, colors.yellow))
    }
  }

  // 4. 통계
  console.log(color('\n📈 Statistics:', colors.cyan))
  console.log(
    `   Code resources:    ${color(String(codeResources.length).padStart(3), colors.bold)}`,
  )
  console.log(`   DB resources:      ${color(String(dbResources.length).padStart(3), colors.bold)}`)
  console.log(`   Matched:           ${color(String(matched.length).padStart(3), colors.green)}`)
  console.log(
    `   Missing in DB:     ${color(String(missingInDB.length).padStart(3), missingInDB.length > 0 ? colors.red : colors.green)}`,
  )
  console.log(
    `   Missing in code:   ${color(String(missingInCode.length).padStart(3), missingInCode.length > 0 ? colors.red : colors.green)}`,
  )

  // 5. 매칭된 리소스 표시
  if (matched.length > 0 && process.argv.includes('--verbose')) {
    console.log(color('\n✅ Matched resources:', colors.green))
    matched.forEach((resource) => {
      console.log(color(`   ✓ ${resource}`, colors.green))
    })
  }

  console.log(color('\n━'.repeat(60), colors.blue))

  return {
    success: missingInDB.length === 0 && missingInCode.length === 0,
    codeResources,
    dbResources,
    missingInDB,
    missingInCode,
    matched,
  }
}

// ============================================
// 권장 사항 출력
// ============================================

function printRecommendations(result: ValidationResult) {
  if (result.success) {
    console.log(color('\n🎉 No action needed!', colors.green))
    console.log(color('   All resources are perfectly synchronized.\n', colors.green))
    return
  }

  console.log(color('\n💡 Recommendations:', colors.cyan))

  if (result.missingInDB.length > 0) {
    console.log(color('\n1️⃣  Sync resources to database:', colors.yellow))
    console.log(color('   npm run sync-resources', colors.bold))
    console.log(color('   (This will add missing permissions to DB)', colors.cyan))
  }

  if (result.missingInCode.length > 0) {
    console.log(color('\n2️⃣  Add missing resources to code:', colors.yellow))
    console.log(color('   Edit src/lib/config/resources.ts', colors.bold))
    console.log(color('   Add the following resources:', colors.cyan))
    result.missingInCode.forEach((resource) => {
      console.log(color(`   - ${resource}`, colors.yellow))
    })
  }

  console.log('')
}

// ============================================
// 메인 실행
// ============================================

async function main() {
  try {
    const result = await validateResources()
    printRecommendations(result)

    await pool.end()

    // Exit code
    process.exit(result.success ? 0 : 1)
  } catch (error) {
    console.error(color('\n❌ Error:', colors.red), error)
    await pool.end()
    process.exit(1)
  }
}

// 직접 실행 시 (ES 모듈)
main()

export { validateResources, extractAllResourceKeys }
