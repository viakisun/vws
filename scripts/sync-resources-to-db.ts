#!/usr/bin/env tsx
/**
 * 리소스 동기화 스크립트
 *
 * resources.ts의 정의를 DB에 자동으로 동기화합니다.
 *
 * 기능:
 * 1. resources.ts에서 모든 리소스 추출
 * 2. 각 리소스에 대해 4개 액션 (read, write, delete, approve) 생성
 * 3. ADMIN 역할에 자동 할당
 * 4. 권한 캐시 무효화
 *
 * Usage:
 *   npm run sync-resources           # 실제 동기화
 *   npm run sync-resources:dry       # 미리보기만
 *   tsx scripts/sync-resources-to-db.ts --dry-run
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

const DRY_RUN = process.argv.includes('--dry-run')
const ACTIONS = ['read', 'write', 'delete', 'approve'] as const

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

interface ResourceInfo {
  key: string
  nameKo: string
  description: string
}

/**
 * resources.ts에서 동기화할 리소스 추출
 * 모든 리소스를 DB에 동기화 (부모 + 자식 모두)
 */
function extractResourcesToSync(resources: readonly ResourceDefinition[]): ResourceInfo[] {
  const result: ResourceInfo[] = []

  function extract(resource: ResourceDefinition) {
    // 모든 리소스 포함
    result.push({
      key: resource.key,
      nameKo: resource.nameKo,
      description: resource.description || resource.nameKo,
    })

    // 하위 리소스 재귀 처리
    if (resource.children) {
      resource.children.forEach((child) => extract(child))
    }
  }

  resources.forEach((res) => extract(res))
  return result
}

// ============================================
// 액션명 한글화
// ============================================

function getActionNameKo(action: string): string {
  const map: Record<string, string> = {
    read: '조회',
    write: '수정',
    delete: '삭제',
    approve: '승인',
  }
  return map[action] || action
}

// ============================================
// 권한 동기화
// ============================================

interface SyncStats {
  totalResources: number
  totalPermissions: number
  newPermissions: number
  updatedPermissions: number
  assignedToAdmin: number
}

async function syncPermissions(): Promise<SyncStats> {
  const stats: SyncStats = {
    totalResources: 0,
    totalPermissions: 0,
    newPermissions: 0,
    updatedPermissions: 0,
    assignedToAdmin: 0,
  }

  console.log(color('\n🔄 Starting resource synchronization...', colors.cyan))
  console.log(color('━'.repeat(60), colors.blue))

  if (DRY_RUN) {
    console.log(color('\n⚠️  DRY RUN MODE - No changes will be made', colors.yellow))
  }

  // 1. 리소스 추출
  console.log('\n📋 Extracting resources from code...')
  const resourceData = getResourceData()
  const resources = extractResourcesToSync(resourceData)
  stats.totalResources = resources.length
  console.log(color(`   Found ${resources.length} resources`, colors.green))

  if (!DRY_RUN) {
    await pool.query('BEGIN')
  }

  try {
    // 2. 각 리소스별 권한 생성
    console.log('\n🔧 Creating permissions...')

    for (const resource of resources) {
      console.log(color(`\n   📦 ${resource.key}`, colors.bold))

      for (const action of ACTIONS) {
        const code = `${resource.key}.${action}`
        const description = `${resource.nameKo} ${getActionNameKo(action)}`

        stats.totalPermissions++

        if (DRY_RUN) {
          console.log(color(`      + ${code}`, colors.cyan))
          console.log(color(`        └─ ${description}`, colors.cyan))
          stats.newPermissions++
        } else {
          // 권한 생성 또는 업데이트
          const result = await pool.query(
            `
            INSERT INTO permissions (code, resource, action, description, scope, is_active)
            VALUES ($1, $2, $3, $4, 'all', true)
            ON CONFLICT (code) DO UPDATE 
            SET 
              description = EXCLUDED.description,
              is_active = true
            RETURNING (xmax = 0) AS is_new
          `,
            [code, resource.key, action, description],
          )

          const isNew = result.rows[0]?.is_new
          if (isNew) {
            console.log(color(`      ✓ ${code} (new)`, colors.green))
            stats.newPermissions++
          } else {
            console.log(color(`      ↻ ${code} (updated)`, colors.blue))
            stats.updatedPermissions++
          }
        }
      }
    }

    // 3. ADMIN 역할에 권한 할당
    console.log(color('\n👑 Assigning permissions to ADMIN role...', colors.magenta))

    if (DRY_RUN) {
      console.log(
        color(`   Would assign ${stats.totalPermissions} permissions to ADMIN`, colors.cyan),
      )
      stats.assignedToAdmin = stats.totalPermissions
    } else {
      const result = await pool.query(
        `
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT 
          (SELECT id FROM roles WHERE code = 'ADMIN'),
          p.id
        FROM permissions p
        WHERE p.resource = ANY($1::text[])
          AND NOT EXISTS (
            SELECT 1 FROM role_permissions rp
            WHERE rp.role_id = (SELECT id FROM roles WHERE code = 'ADMIN')
              AND rp.permission_id = p.id
          )
        RETURNING *
      `,
        [resources.map((r) => r.key)],
      )

      stats.assignedToAdmin = result.rowCount || 0
      console.log(color(`   ✓ Assigned ${stats.assignedToAdmin} new permissions`, colors.green))
    }

    // 4. 권한 캐시 무효화
    console.log(color('\n🗑️  Clearing permission cache...', colors.yellow))

    if (DRY_RUN) {
      console.log(color('   Would clear permission cache', colors.cyan))
    } else {
      await pool.query('DELETE FROM permission_cache')
      console.log(color('   ✓ Cache cleared', colors.green))
    }

    if (!DRY_RUN) {
      await pool.query('COMMIT')
      console.log(color('\n✅ Transaction committed successfully', colors.green))
    }
  } catch (error) {
    if (!DRY_RUN) {
      await pool.query('ROLLBACK')
      console.log(color('\n❌ Transaction rolled back', colors.red))
    }
    throw error
  }

  return stats
}

// ============================================
// 결과 출력
// ============================================

function printResults(stats: SyncStats) {
  console.log(color('\n━'.repeat(60), colors.blue))
  console.log(color('\n📊 Synchronization Results:', colors.bold))

  console.log(color('\n📈 Statistics:', colors.cyan))
  console.log(
    `   Resources processed:      ${color(String(stats.totalResources).padStart(3), colors.bold)}`,
  )
  console.log(
    `   Total permissions:        ${color(String(stats.totalPermissions).padStart(3), colors.bold)}`,
  )
  console.log(
    `   New permissions:          ${color(String(stats.newPermissions).padStart(3), colors.green)}`,
  )
  console.log(
    `   Updated permissions:      ${color(String(stats.updatedPermissions).padStart(3), colors.blue)}`,
  )
  console.log(
    `   Assigned to ADMIN:        ${color(String(stats.assignedToAdmin).padStart(3), colors.magenta)}`,
  )

  if (DRY_RUN) {
    console.log(color('\n⚠️  This was a DRY RUN - no actual changes were made', colors.yellow))
    console.log(color('   Run without --dry-run to apply changes', colors.yellow))
  } else {
    console.log(color('\n✅ Synchronization completed successfully!', colors.green))
  }

  console.log(color('\n━'.repeat(60), colors.blue))
  console.log('')
}

// ============================================
// 안전 확인
// ============================================

function printSafetyWarning() {
  if (DRY_RUN) return

  console.log(color('\n⚠️  WARNING: This will modify the database!', colors.yellow))
  console.log(color('━'.repeat(60), colors.yellow))
  console.log('\n   This script will:')
  console.log('   • Create new permissions in the database')
  console.log('   • Update existing permission descriptions')
  console.log('   • Assign all permissions to ADMIN role')
  console.log('   • Clear the permission cache')
  console.log('\n   Recommended: Backup your database first!')
  console.log(
    color('   pg_dump -t permissions -t role_permissions > backup_permissions.sql\n', colors.cyan),
  )
}

// ============================================
// 메인 실행
// ============================================

async function main() {
  try {
    printSafetyWarning()

    const stats = await syncPermissions()
    printResults(stats)

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error(color('\n❌ Error:', colors.red), error)
    await pool.end()
    process.exit(1)
  }
}

// 직접 실행 시 (ES 모듈)
main()

export { syncPermissions, extractResourcesToSync }
