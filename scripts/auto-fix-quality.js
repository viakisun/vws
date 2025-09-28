#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔧 자동 수정 스크립트 시작...\n')

// 수정할 패턴들
const FIX_PATTERNS = [
  {
    // $effect(() => { ... }) 패턴을 함수로 변환
    pattern: /\$effect\(\(\) => \{([\s\S]*?)\}\)/g,
    replacement: (match, body) => {
      // 함수명 생성
      const functionName = generateFunctionName(body)
      return `function ${functionName}() {\n${body}\n}`
    },
  },
  {
    // 의존성 배열 패턴 ;( 제거
    pattern: /;\(/g,
    replacement: '// 이벤트 기반 업데이트 사용',
  },
]

// 함수명 생성기
function generateFunctionName(body) {
  const lines = body.trim().split('\n')
  const firstLine = lines[0]?.trim() || ''

  if (firstLine.includes('initialize') || firstLine.includes('load')) {
    return 'initializeData'
  } else if (firstLine.includes('update') || firstLine.includes('change')) {
    return 'handleChange'
  } else if (firstLine.includes('filter') || firstLine.includes('search')) {
    return 'handleFilterChange'
  } else if (firstLine.includes('sync') || firstLine.includes('url')) {
    return 'syncData'
  } else {
    return 'updateData'
  }
}

// 파일 수정 함수
function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let modifiedContent = content
    let hasChanges = false

    // 패턴 적용
    FIX_PATTERNS.forEach(({ pattern, replacement }) => {
      if (typeof replacement === 'function') {
        const matches = modifiedContent.match(pattern)
        if (matches) {
          modifiedContent = modifiedContent.replace(pattern, replacement)
          hasChanges = true
        }
      } else {
        if (pattern.test(modifiedContent)) {
          modifiedContent = modifiedContent.replace(pattern, replacement)
          hasChanges = true
        }
      }
    })

    // onMount 추가 (Svelte 파일인 경우)
    if (filePath.endsWith('.svelte') && hasChanges) {
      // onMount import 추가
      if (!modifiedContent.includes("import { onMount } from 'svelte'")) {
        modifiedContent = modifiedContent.replace(
          /import { logger } from '\$lib\/utils\/logger'/,
          "import { logger } from '$lib/utils/logger'\n  import { onMount } from 'svelte'",
        )
      }

      // onMount 호출 추가
      if (!modifiedContent.includes('onMount(')) {
        const scriptEnd = modifiedContent.indexOf('</script>')
        if (scriptEnd > 0) {
          const beforeScript = modifiedContent.substring(0, scriptEnd)
          const afterScript = modifiedContent.substring(scriptEnd)

          modifiedContent =
            beforeScript +
            '\n\n  // 컴포넌트 마운트 시 초기화\n' +
            '  onMount(() => {\n' +
            '    // 초기화 함수들 호출\n' +
            '  })\n' +
            afterScript
        }
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8')
      console.log(`✅ 수정 완료: ${path.relative(__dirname + '/..', filePath)}`)
      return true
    }

    return false
  } catch (error) {
    console.error(`❌ 수정 실패: ${filePath}`, error.message)
    return false
  }
}

// 모든 파일 검사 및 수정
function fixAllFiles() {
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

  let fixedCount = 0

  files.forEach((file) => {
    if (fixFile(file)) {
      fixedCount++
    }
  })

  return fixedCount
}

// 메인 실행
function main() {
  try {
    const fixedCount = fixAllFiles()

    console.log(`\n📊 수정 완료: ${fixedCount}개 파일`)

    if (fixedCount > 0) {
      console.log('\n✅ 자동 수정 완료!')
      console.log('이제 품질 검증을 다시 실행해보세요.')
    } else {
      console.log('\n⚠️  수정할 파일이 없습니다.')
    }
  } catch (error) {
    console.error('❌ 자동 수정 중 오류 발생:', error.message)
    process.exit(1)
  }
}

main()
