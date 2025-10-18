/**
 * R&D 프로젝트 조회 스크립트
 * 실행: npx tsx find-rd-projects.ts
 */

import { query } from './src/lib/database/connection'

async function findRdProjects() {
  try {
    console.log('🔍 R&D 개발 프로젝트 조회 중...\n')

    // 1. 모든 프로젝트 목록
    const allProjects = await query(`
      SELECT 
        rdp.id,
        p.code,
        p.title,
        rdp.project_type,
        p.status,
        rdp.created_at
      FROM rd_dev_projects rdp
      JOIN projects p ON rdp.project_id = p.id
      ORDER BY rdp.created_at DESC
      LIMIT 10
    `)

    console.log('📋 전체 R&D 프로젝트:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (allProjects.rows.length === 0) {
      console.log('❌ R&D 개발 프로젝트가 없습니다!')
      console.log('\n💡 해결 방법:')
      console.log('1. 시드 스크립트 실행: npx tsx scripts/seed-smart-farm-robot.ts')
      console.log('2. 또는: npx tsx scripts/seed-worker-follow-amr-enhanced.ts')
    } else {
      allProjects.rows.forEach((row: any, index: number) => {
        console.log(`\n${index + 1}. ${row.title}`)
        console.log(`   ID: ${row.id}`)
        console.log(`   코드: ${row.code}`)
        console.log(`   타입: ${row.project_type}`)
        console.log(`   상태: ${row.status}`)
        console.log(`   생성일: ${row.created_at}`)
      })

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`\n✅ 총 ${allProjects.rows.length}개의 프로젝트를 찾았습니다.`)
      console.log('\n📌 첫 번째 프로젝트 URL:')
      console.log(`   http://localhost:5173/rd-development/projects/${allProjects.rows[0].id}`)
    }

    // 2. 특정 ID 확인
    const targetId = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6'
    console.log(`\n\n🔍 특정 ID 확인: ${targetId}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const specificProject = await query(
      `
      SELECT 
        rdp.*,
        p.title,
        p.code
      FROM rd_dev_projects rdp
      LEFT JOIN projects p ON rdp.project_id = p.id
      WHERE rdp.id = $1
    `,
      [targetId],
    )

    if (specificProject.rows.length === 0) {
      console.log('❌ 해당 ID의 프로젝트를 찾을 수 없습니다.')
    } else {
      console.log('✅ 프로젝트를 찾았습니다!')
      console.log(JSON.stringify(specificProject.rows[0], null, 2))
    }

    // 3. 관련 데이터 확인
    if (allProjects.rows.length > 0) {
      const firstProjectId = allProjects.rows[0].id

      console.log(`\n\n📊 첫 번째 프로젝트의 관련 데이터:`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      const phases = await query('SELECT COUNT(*) FROM rd_dev_phases WHERE project_id = $1', [
        firstProjectId,
      ])
      const deliverables = await query(
        'SELECT COUNT(*) FROM rd_dev_deliverables WHERE project_id = $1',
        [firstProjectId],
      )
      const institutions = await query(
        'SELECT COUNT(*) FROM rd_dev_institutions WHERE project_id = $1',
        [firstProjectId],
      )
      const kpis = await query('SELECT COUNT(*) FROM rd_dev_kpis WHERE project_id = $1', [
        firstProjectId,
      ])
      const scenarios = await query(
        'SELECT COUNT(*) FROM rd_dev_verification_scenarios WHERE project_id = $1',
        [firstProjectId],
      )

      console.log(`Phases: ${phases.rows[0].count}`)
      console.log(`Deliverables: ${deliverables.rows[0].count}`)
      console.log(`Institutions: ${institutions.rows[0].count}`)
      console.log(`KPIs: ${kpis.rows[0].count}`)
      console.log(`Scenarios: ${scenarios.rows[0].count}`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ 에러 발생:', error)
    process.exit(1)
  }
}

findRdProjects()
