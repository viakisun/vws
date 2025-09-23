import { query } from '../src/lib/database/connection.ts'

// 추가할 직급 데이터
const executivePositions = [
  {
    name: '연구소장',
    description: '연구소 전체를 총괄하고 연구 방향을 설정하는 최고 책임자',
    department: 'PSR팀',
    level: 6 // 최고급 직급
  },
  {
    name: '상무',
    description: '회사 경영진으로 주요 의사결정에 참여하는 임원급 직급',
    department: '경영기획팀',
    level: 6 // 최고급 직급
  }
]

async function addExecutivePositions() {
  try {
    console.log('🔄 Adding executive positions...')

    for (const position of executivePositions) {
      // 중복 체크
      const existingPos = await query(
        'SELECT id FROM positions WHERE LOWER(name) = LOWER($1) AND department = $2',
        [position.name, position.department]
      )

      if (existingPos.rows.length > 0) {
        console.log(`⚠️  Position "${position.name}" already exists in ${position.department}`)
        continue
      }

      // 직급 추가
      const result = await query(
        `
				INSERT INTO positions (name, description, department, level, status, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id, name, description, department, level, status
			`,
        [
          position.name,
          position.description,
          position.department,
          position.level,
          'active',
          new Date(),
          new Date()
        ]
      )

      console.log(
        `✅ Added position: ${position.name} (${position.department}) - Level ${position.level}`
      )
    }

    // 결과 확인
    console.log('\n🔍 Verifying added positions...')
    const result = await query(`
			SELECT 
				name, description, department, level, status
			FROM positions 
			WHERE name IN ('연구소장', '상무')
			ORDER BY department, level DESC
		`)

    console.log('📋 Executive positions:')
    result.rows.forEach(row => {
      console.log(`  ${row.name} (${row.department}) - Level ${row.level}: ${row.description}`)
    })

    // 전체 직급 구조 확인
    console.log('\n📊 Complete position hierarchy:')
    const allPositions = await query(`
			SELECT 
				department,
				name,
				level
			FROM positions 
			WHERE status = 'active'
			ORDER BY department, level DESC, name ASC
		`)

    let currentDept = ''
    allPositions.rows.forEach(row => {
      if (row.department !== currentDept) {
        console.log(`\n📁 ${row.department}:`)
        currentDept = row.department
      }
      const levelIndicator = '  '.repeat(6 - row.level) + '└─ '
      console.log(`${levelIndicator}${row.name} (Level ${row.level})`)
    })

    console.log('\n✅ Executive positions added successfully!')
  } catch (error) {
    console.error('❌ Failed to add executive positions:', error)
    throw error
  }
}

// Run the script
addExecutivePositions()
  .then(() => {
    console.log('🎉 Executive positions setup completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Executive positions setup failed:', error)
    process.exit(1)
  })
