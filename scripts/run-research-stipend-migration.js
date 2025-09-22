#!/usr/bin/env node

/**
 * 연구수당 컬럼 추가 마이그레이션 실행 스크립트
 *
 * 사용법:
 * node scripts/run-research-stipend-migration.js
 */

const fetch = require('node-fetch')

async function runMigration() {
	try {
		console.log('🚀 연구수당 컬럼 추가 마이그레이션을 시작합니다...')

		const response = await fetch(
			'http://localhost:5173/api/project-management/migrate-add-research-stipend',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		const result = await response.json()

		if (result.success) {
			console.log('✅ 마이그레이션이 성공적으로 완료되었습니다!')
			console.log('📋 추가된 컬럼들:')
			result.addedColumns.forEach(col => {
				console.log(`  - ${col.name} (${col.type}) - 기본값: ${col.default}`)
			})
		} else {
			console.error('❌ 마이그레이션 실패:', result.message)
			if (result.error) {
				console.error('오류 상세:', result.error)
			}
			process.exit(1)
		}
	} catch (error) {
		console.error('❌ 마이그레이션 실행 중 오류 발생:', error.message)
		console.error('서버가 실행 중인지 확인해주세요. (npm run dev)')
		process.exit(1)
	}
}

// 스크립트 실행
runMigration()
