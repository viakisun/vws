#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 품질 검증 시작...\n')

// 금지된 패턴들
const FORBIDDEN_PATTERNS = [
  {
    pattern: /\$effect\(\(\) => \{/g,
    message: '복잡한 $effect 사용 금지',
    suggestion: '이벤트 기반 접근법 사용: function handleChange() { updateData() }',
  },
  {
    pattern: /derivedFunction\(\)/g,
    message: '템플릿에서 함수 호출 금지',
    suggestion: '변수 직접 접근 사용: {#each data as item}',
  },
  {
    pattern: /;\(/g,
    message: '의존성 배열 패턴 금지',
    suggestion: '이벤트 기반 업데이트 사용',
  },
  {
    pattern: /\$derived\(\(\) => \{[\s\S]*?\}\)\)/g,
    message: '복잡한 $derived 사용 금지',
    suggestion: '단순한 상태 변수와 이벤트 핸들러 사용',
  },
]

// 필수 패턴들
const REQUIRED_PATTERNS = [
  {
    pattern: /handleFilterChange|handleChange|updateData/g,
    message: '이벤트 기반 업데이트 메서드 필요',
    suggestion: 'function handleFilterChange() { updateFilteredData() }',
  },
]

// 파일 검사 함수
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const errors = []
  const warnings = []

  // 금지된 패턴 검사
  FORBIDDEN_PATTERNS.forEach(({ pattern, message, suggestion }) => {
    const matches = content.match(pattern)
    if (matches) {
      errors.push({
        file: filePath,
        pattern: pattern.source,
        message,
        suggestion,
        count: matches.length,
      })
    }
  })

  // 필수 패턴 검사
  REQUIRED_PATTERNS.forEach(({ pattern, message, suggestion }) => {
    const matches = content.match(pattern)
    if (!matches) {
      warnings.push({
        file: filePath,
        message,
        suggestion,
      })
    }
  })

  return { errors, warnings }
}

// 모든 Svelte/TypeScript 파일 검사
function checkAllFiles() {
  const srcDir = path.join(__dirname, '..', 'src')
  const files = []

  function findFiles(dir) {
    const items = fs.readdirSync(dir)
    items.forEach((item) => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        findFiles(fullPath)
      } else if (item.endsWith('.svelte') || item.endsWith('.ts')) {
        files.push(fullPath)
      }
    })
  }

  findFiles(srcDir)

  let totalErrors = 0
  let totalWarnings = 0

  files.forEach((file) => {
    const { errors, warnings } = checkFile(file)

    if (errors.length > 0 || warnings.length > 0) {
      console.log(`📁 ${path.relative(__dirname + '/..', file)}`)

      errors.forEach((error) => {
        console.log(`  ❌ ${error.message} (${error.count}개 발견)`)
        console.log(`     💡 ${error.suggestion}`)
        totalErrors += error.count
      })

      warnings.forEach((warning) => {
        console.log(`  ⚠️  ${warning.message}`)
        console.log(`     💡 ${warning.suggestion}`)
        totalWarnings++
      })

      console.log('')
    }
  })

  return { totalErrors, totalWarnings }
}

// 메인 실행
function main() {
  try {
    const { totalErrors, totalWarnings } = checkAllFiles()

    console.log('📊 검증 결과:')
    console.log(`  ❌ 오류: ${totalErrors}개`)
    console.log(`  ⚠️  경고: ${totalWarnings}개`)

    if (totalErrors > 0) {
      console.log('\n🚫 품질 검증 실패!')
      console.log('반응성 패턴을 수정하고 다시 시도하세요.')
      process.exit(1)
    } else if (totalWarnings > 0) {
      console.log('\n⚠️  품질 검증 경고!')
      console.log('권장 패턴을 적용하는 것을 고려하세요.')
    } else {
      console.log('\n✅ 품질 검증 통과!')
    }
  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error.message)
    process.exit(1)
  }
}

main()
