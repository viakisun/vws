#!/usr/bin/env node

/**
 * 사용하지 않는 import들을 자동으로 제거하는 스크립트
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

function findUnusedImports(content, filePath) {
  const lines = content.split('\n')
  const changes = []

  // Svelte 파일에서 사용하지 않는 import 찾기
  if (filePath.endsWith('.svelte')) {
    // import 문들 찾기
    const importLines = []
    let inImportBlock = false
    let importStart = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // import 시작
      if (line.startsWith('import') && line.includes('{')) {
        inImportBlock = true
        importStart = i
        importLines.push({ line, index: i })
      }
      // import 블록의 끝
      else if (inImportBlock && line.includes('}') && line.includes('from')) {
        inImportBlock = false
        importLines.push({ line, index: i })

        // 이 import 블록 분석
        const importBlock = lines.slice(importStart, i + 1).join('\n')
        const imports = extractImports(importBlock)

        // 각 import가 실제로 사용되는지 확인
        const usedImports = []
        for (const imp of imports) {
          if (isImportUsed(content, imp, filePath)) {
            usedImports.push(imp)
          }
        }

        // 사용되지 않는 import가 있으면 수정
        if (usedImports.length !== imports.length) {
          const newImportBlock = rebuildImportBlock(importBlock, usedImports)
          changes.push({
            start: importStart,
            end: i + 1,
            old: importBlock,
            new: newImportBlock
          })
        }
      }
      // import 블록 내부
      else if (inImportBlock) {
        importLines.push({ line, index: i })
      }
    }
  }

  return changes
}

function extractImports(importBlock) {
  const imports = []
  const lines = importBlock.split('\n')

  for (const line of lines) {
    if (line.includes('{') && line.includes('}')) {
      const match = line.match(/\{([^}]+)\}/)
      if (match) {
        const importList = match[1].split(',').map(imp => imp.trim())
        imports.push(...importList)
      }
    }
  }

  return imports.filter(imp => imp && !imp.includes('type'))
}

function isImportUsed(content, importName, filePath) {
  // Svelte 파일에서 사용되는 패턴들
  const patterns = [
    new RegExp(`<${importName}\\b`, 'g'), // 컴포넌트 사용
    new RegExp(`\\b${importName}\\b`, 'g'), // 일반 사용
    new RegExp(`\\$${importName}\\b`, 'g'), // 스토어 사용
    new RegExp(`{${importName}\\b`, 'g'), // 표현식 사용
    new RegExp(`:${importName}\\b`, 'g') // 이벤트 핸들러
  ]

  // import 문 자체는 제외
  const contentWithoutImports = content.replace(/import\s+.*?from\s+['"][^'"]+['"];?\s*/g, '')

  for (const pattern of patterns) {
    if (pattern.test(contentWithoutImports)) {
      return true
    }
  }

  return false
}

function rebuildImportBlock(originalBlock, usedImports) {
  if (usedImports.length === 0) {
    return '' // 전체 import 블록 제거
  }

  const lines = originalBlock.split('\n')
  const newLines = []

  let inImportBlock = false
  let importStart = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('import') && line.includes('{')) {
      inImportBlock = true
      importStart = i

      // import 문 시작 부분
      const importPrefix = line.substring(0, line.indexOf('{'))
      const importSuffix = lines[i + 1] || ''
      const fromPart = importSuffix.includes('from') ? importSuffix : lines[i + 2] || ''

      // 사용되는 import들만 포함
      const importList = usedImports.join(',\n\t\t')
      newLines.push(`${importPrefix}{`)
      newLines.push(`\t\t${importList}`)
      newLines.push(`\t}${fromPart}`)

      // 다음 줄로 건너뛰기
      i += importSuffix.includes('from') ? 1 : 2
    } else if (!inImportBlock) {
      newLines.push(lines[i])
    }
  }

  return newLines.join('\n')
}

function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    const changes = findUnusedImports(content, filePath)

    if (changes.length > 0) {
      let newContent = content

      // 뒤에서부터 수정 (인덱스 변경 방지)
      for (let i = changes.length - 1; i >= 0; i--) {
        const change = changes[i]
        const before = newContent.substring(0, change.start)
        const after = newContent.substring(change.end)
        newContent = before + change.new + after
      }

      writeFileSync(filePath, newContent, 'utf8')
      console.log(`✅ 수정됨: ${filePath} (${changes.length}개 변경)`)
      return changes.length
    }

    return 0
  } catch (error) {
    console.error(`❌ 오류: ${filePath}`, error.message)
    return 0
  }
}

function processDirectory(dirPath) {
  let totalChanges = 0

  try {
    const items = readdirSync(dirPath)

    for (const item of items) {
      const fullPath = join(dirPath, item)
      const stat = statSync(fullPath)

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        totalChanges += processDirectory(fullPath)
      } else if (stat.isFile() && (extname(item) === '.svelte' || extname(item) === '.ts')) {
        totalChanges += processFile(fullPath)
      }
    }
  } catch (error) {
    console.error(`❌ 디렉토리 처리 오류: ${dirPath}`, error.message)
  }

  return totalChanges
}

// 메인 실행
console.log('🧹 사용하지 않는 import 정리 시작...')
const totalChanges = processDirectory('./src')
console.log(`\n🎉 완료! 총 ${totalChanges}개 파일이 수정되었습니다.`)
