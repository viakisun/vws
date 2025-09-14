import { query } from '../src/lib/database/connection.ts';

// 추가할 새로운 조직들
const newOrganizations = [
	{
		name: '대표',
		description: '회사의 최고 경영진으로 전체 경영을 총괄하는 조직',
		level: 7 // 최고급
	},
	{
		name: '전략기획실',
		description: '회사의 전략 수립 및 기획을 담당하는 조직',
		level: 6 // 고급
	},
	{
		name: '연구소',
		description: '연구개발 및 기술 혁신을 담당하는 조직',
		level: 6 // 고급
	}
];

async function addNewOrganizations() {
	try {
		console.log('🔄 Adding new organizations...');
		
		for (const org of newOrganizations) {
			// 중복 체크
			const existingOrg = await query(
				'SELECT id FROM positions WHERE LOWER(name) = LOWER($1)',
				[org.name]
			);
			
			if (existingOrg.rows.length > 0) {
				console.log(`⚠️  Organization "${org.name}" already exists`);
				continue;
			}
			
			// 조직 추가
			const result = await query(`
				INSERT INTO positions (name, description, department, level, status, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id, name, description, department, level, status
			`, [
				org.name,
				org.description,
				org.name, // department도 같은 이름으로 설정
				org.level,
				'active',
				new Date(),
				new Date()
			]);
			
			console.log(`✅ Added organization: ${org.name} - Level ${org.level}`);
		}
		
		// 결과 확인
		console.log('\n🔍 Verifying added organizations...');
		const result = await query(`
			SELECT 
				name, description, department, level, status
			FROM positions 
			WHERE name IN ('대표', '전략기획실', '연구소')
			ORDER BY level DESC, name ASC
		`);
		
		console.log('📋 New organizations:');
		result.rows.forEach(row => {
			console.log(`  ${row.name} (${row.department}) - Level ${row.level}: ${row.description}`);
		});
		
		// 전체 조직 구조 확인
		console.log('\n📊 Complete organization hierarchy:');
		const allPositions = await query(`
			SELECT 
				department,
				name,
				level
			FROM positions 
			WHERE status = 'active'
			ORDER BY 
				CASE department
					WHEN '대표' THEN 1
					WHEN '전략기획실' THEN 2
					WHEN '연구소' THEN 3
					WHEN '부서없음' THEN 999
					ELSE 100
				END,
				level DESC,
				name ASC
		`);
		
		let currentDept = '';
		allPositions.rows.forEach(row => {
			if (row.department !== currentDept) {
				console.log(`\n📁 ${row.department}:`);
				currentDept = row.department;
			}
			const levelIndicator = '  '.repeat(7 - row.level) + '└─ ';
			console.log(`${levelIndicator}${row.name} (Level ${row.level})`);
		});
		
		console.log('\n✅ New organizations added successfully!');
		
	} catch (error) {
		console.error('❌ Failed to add new organizations:', error);
		throw error;
	}
}

// Run the script
addNewOrganizations()
	.then(() => {
		console.log('🎉 New organizations setup completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 New organizations setup failed:', error);
		process.exit(1);
	});
