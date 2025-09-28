#!/usr/bin/env node

// 필드명 규칙 검증 스크립트
const { readFileSync, readdirSync, statSync } = require('fs')
const { join } = require('path')

const FIELD_NAMING_RULES = {
  frontend: {
    pattern: /^[a-z]+([A-Z][a-z]*)*$/,
    name: 'camelCase',
    files: ['src/lib/**/*.ts', 'src/lib/**/*.svelte', 'src/routes/**/*.svelte'],
  },
  backend: {
    pattern: /^[a-z]+(_[a-z]+)*$/,
    name: 'snake_case',
    files: ['src/routes/api/**/*.ts', 'src/lib/database/**/*.ts'],
  },
}

function findFiles() {
  const files = []
  const baseDir = process.cwd()

  function walkDir(dir) {
    try {
      const items = readdirSync(dir)
      for (const item of items) {
        const fullPath = join(dir, item)
        const stat = statSync(fullPath)

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath)
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.svelte'))) {
          files.push(fullPath)
        }
      }
    } catch {
      // 디렉토리 접근 권한 없음 등 무시
    }
  }

  walkDir(baseDir)
  return files
}

function checkFieldNaming(filePath, rules) {
  const errors = []

  try {
    const content = readFileSync(filePath, 'utf-8')

    // JavaScript 내장 메서드와 브라우저 API 제외 목록
    const excludedMethods = [
      // JavaScript 내장 메서드
      'toISOString',
      'toLocaleString',
      'toLocaleDateString',
      'toString',
      'toFixed',
      'toUpperCase',
      'toLowerCase',
      'getTime',
      'getFullYear',
      'getMonth',
      'getDate',
      'getUTCFullYear',
      'getUTCMonth',
      'getUTCDate',
      'setUTCFullYear',
      'setUTCMonth',
      'setUTCDate',
      'setMonth',
      'getElementById',
      'createElement',
      'appendChild',
      'removeChild',
      'createObjectURL',
      'revokeObjectURL',
      'addEventListener',
      'removeEventListener',
      'preventDefault',
      'charAt',
      'indexOf',
      'startsWith',
      'endsWith',
      'localeCompare',
      'padStart',
      'forEach',
      'flatMap',
      'isArray',
      'matchMedia',
      'querySelector',
      'setProperty',
      'setAttribute',
      'getItem',
      'setItem',
      'resolvedOptions',
      'randomUUID',
      'clearAllMocks',
      'mockResolvedValue',
      'mockRejectedValue',
      'mockImplementation',
      'toBe',
      'toEqual',
      'toBeDefined',
      'toBeInstanceOf',
      'toHaveLength',
      'toHaveBeenCalledWith',
      'toMatch',
      'importActual',

      // 브라우저 API
      'URL',
      'DateTimeFormat',
      'NumberFormat',
      'DateTimeFormatOptions',
      'NODE_ENV',

      // 상수 (대문자로 시작하는 것들)
      'UTC',
      'MM',
      'DD',
      'PM',
      'RESEARCHER',
      'READ_PROJECT',
      'WRITE_PROJECT',
      'APPROVE_EXPENSE',
      'MANAGE_PERSONNEL',
      'CREATE_REPORT',
      'UPLOAD_DOCUMENT',
      'DEPARTMENT_HEAD',
      'MANAGEMENT_SUPPORT',
      'READ_ALL',
      'WRITE_ALL',
      'APPROVE_ALL',
      'MANAGE_BUDGET',
      'VIEW_AUDIT_LOG',
      'LAB_HEAD',
      'EXECUTIVE',
      'AUDITOR',
      'RECEIPT',
      'MANAGEMENT_SUPPORT',
      'EXECUTIVE',
      'LAB_HEAD',

      // 테스트 관련
      'statusText',
      'searchParams',
      'dataTransfer',
      'currentTarget',
    ]

    // 객체 속성 접근 패턴 찾기 (obj.fieldName, obj['fieldName'])
    const propertyAccessRegex = /\.([a-zA-Z_][a-zA-Z0-9_]*)/g
    const bracketAccessRegex = /\[['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\]/g

    let match
    while ((match = propertyAccessRegex.exec(content)) !== null) {
      const fieldName = match[1]

      // 제외 목록에 있거나 내장 메서드인 경우 스킵
      if (
        excludedMethods.includes(fieldName) ||
        fieldName.startsWith('_') || // private 필드
        fieldName.match(/^[A-Z][A-Z_]*$/)
      ) {
        // 상수
        continue
      }

      if (!rules.pattern.test(fieldName)) {
        errors.push(
          `Line ${getLineNumber(content, match.index)}: '${fieldName}' should be ${rules.name}`,
        )
      }
    }

    while ((match = bracketAccessRegex.exec(content)) !== null) {
      const fieldName = match[1]

      // 제외 목록에 있거나 내장 메서드인 경우 스킵
      if (
        excludedMethods.includes(fieldName) ||
        fieldName.startsWith('_') || // private 필드
        fieldName.match(/^[A-Z][A-Z_]*$/)
      ) {
        // 상수
        continue
      }

      if (!rules.pattern.test(fieldName)) {
        errors.push(
          `Line ${getLineNumber(content, match.index)}: '${fieldName}' should be ${rules.name}`,
        )
      }
    }
  } catch (error) {
    errors.push(`Error reading file: ${error}`)
  }

  return errors
}

function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length
}

function main() {
  console.log('🔍 필드명 규칙 검증 시작...\n')

  let totalErrors = 0

  // 프론트엔드 파일 검사
  console.log('📱 프론트엔드 파일 검사 (camelCase 강제)')
  const frontendFiles = findFiles('src/lib/**/*.ts').concat(findFiles('src/lib/**/*.svelte'))

  for (const file of frontendFiles) {
    const errors = checkFieldNaming(file, FIELD_NAMING_RULES.frontend)
    if (errors.length > 0) {
      console.log(`\n❌ ${file}`)
      errors.forEach((error) => console.log(`   ${error}`))
      totalErrors += errors.length
    }
  }

  // 백엔드 파일 검사
  console.log('\n🖥️  백엔드 파일 검사 (snake_case 강제)')
  const backendFiles = findFiles('src/routes/api/**/*.ts')

  for (const file of backendFiles) {
    const errors = checkFieldNaming(file, FIELD_NAMING_RULES.backend)
    if (errors.length > 0) {
      console.log(`\n❌ ${file}`)
      errors.forEach((error) => console.log(`   ${error}`))
      totalErrors += errors.length
    }
  }

  console.log(`\n📊 검증 완료: ${totalErrors}개 오류 발견`)

  if (totalErrors > 0) {
    console.log('\n💡 해결 방법:')
    console.log('   - 프론트엔드: monthly_salary → monthlySalary')
    console.log('   - 백엔드: monthlySalary → monthly_salary')
    process.exit(1)
  } else {
    console.log('✅ 모든 필드명이 규칙을 준수합니다!')
  }
}

if (require.main === module) {
  main()
}
