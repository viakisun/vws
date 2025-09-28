#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 심각한 오류만 검증 중...\n')

// 금지된 패턴들 (심각한 오류만)
const CRITICAL_PATTERNS = [
  {
    pattern: /\$effect\(\(\) => \{/g,
    message: '복잡한 $effect 사용 금지',
    suggestion: '이벤트 기반 접근법 사용: function handleChange() { updateData() }',
  },
  {
    pattern: /;\(/g,
    message: '의존성 배열 패턴 금지',
    suggestion: '이벤트 기반 업데이트 사용',
  },
]

// 파일 검사 함수
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const errors = []

  // 심각한 패턴만 검사
  CRITICAL_PATTERNS.forEach(({ pattern, message, suggestion }) => {
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

  return { errors }
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
  const criticalFiles = []

  files.forEach((file) => {
    const { errors } = checkFile(file)

    if (errors.length > 0) {
      criticalFiles.push({
        file: path.relative(__dirname + '/..', file),
        errors: errors,
      })

      errors.forEach((error) => {
        totalErrors += error.count
      })
    }
  })

  return { totalErrors, criticalFiles }
}

// 메인 실행
function main() {
  try {
    const { totalErrors, criticalFiles } = checkAllFiles()

    console.log('📊 심각한 오류 검증 결과:')
    console.log(`  ❌ 심각한 오류: ${totalErrors}개`)
    console.log(`  📁 문제 파일: ${criticalFiles.length}개\n`)

    if (totalErrors > 0) {
      console.log('🚨 심각한 오류가 발견된 파일들:')
      criticalFiles.forEach(({ file, errors }) => {
        console.log(`\n📁 ${file}`)
        errors.forEach((error) => {
          console.log(`  ❌ ${error.message} (${error.count}개 발견)`)
          console.log(`     💡 ${error.suggestion}`)
        })
      })

      console.log('\n🚫 심각한 오류 발견!')
      console.log('이 오류들을 먼저 수정해야 합니다.')
      process.exit(1)
    } else {
      console.log('\n✅ 심각한 오류 없음!')
      console.log('이제 경고 사항을 점진적으로 개선할 수 있습니다.')
    }
  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error.message)
    process.exit(1)
  }
}

main()
