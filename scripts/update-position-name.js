import { query } from '../src/lib/database/connection.ts'

async function updatePositionName() {
  try {
    console.log('🔄 Updating position name: 연구소장 (PSR) → 연구소장...')

    // 연구소장 (PSR팀) 직급명을 연구소장으로 변경
    const result = await query(
      `
			UPDATE positions 
			SET name = '연구소장', updated_at = $1
			WHERE name = '연구소장 (PSR팀)'
			RETURNING id, name, description, department, level
		`,
      [new Date()]
    )

    if (result.rows.length > 0) {
      const position = result.rows[0]
      console.log(
        `✅ Updated position: ${position.name} (${position.department}) - Level ${position.level}`
      )
      console.log(`   Description: ${position.description}`)
    } else {
      console.log('⚠️  No position found with name "연구소장 (PSR)"')
    }

    // 결과 확인
    console.log('\n🔍 Verifying position update...')
    const verifyResult = await query(`
			SELECT 
				name, description, department, level, status
			FROM positions 
			WHERE name = '연구소장'
			ORDER BY department, level DESC
		`)

    console.log('📋 Updated position:')
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.name} (${row.department}) - Level ${row.level}: ${row.description}`)
    })

    console.log('\n✅ Position name update completed successfully!')
  } catch (error) {
    console.error('❌ Failed to update position name:', error)
    throw error
  }
}

// Run the script
updatePositionName()
  .then(() => {
    console.log('🎉 Position name update completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Position name update failed:', error)
    process.exit(1)
  })
