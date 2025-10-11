/**
 * 남은 RETURNING * 패턴을 찾아서 로그로 출력
 */
import { execSync } from 'child_process'

const paths = [
  'src/routes/api/project-management',
  'src/routes/api/sales',
  'src/routes/api/templates',
]

console.log('🔍 남은 RETURNING * 찾기...\n')

for (const path of paths) {
  try {
    const result = execSync(
      `grep -rn "RETURNING \\*" ${path} --include="*.ts" || true`,
      { encoding: 'utf-8' },
    )
    if (result.trim()) {
      console.log(`\n📁 ${path}:`)
      console.log(result)
    }
  } catch (e) {
    // ignore
  }
}

console.log('\n✅ 완료!')

