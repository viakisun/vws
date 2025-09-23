#!/usr/bin/env node

/**
 * 자동 오류 체크 스크립트
 * 코드 작성 후 TypeScript 오류와 린터 오류를 자동으로 체크합니다.
 */

import { execSync } from 'child_process'

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(`${title}`, 'bright')
  log(`${'='.repeat(60)}`, 'cyan')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

async function checkTypeScriptErrors() {
  logSection('TypeScript 오류 체크')

  try {
    logInfo('Svelte 타입 체크 실행 중...')
    const result = execSync('npm run check', {
      encoding: 'utf8',
      stdio: 'pipe'
    })

    logSuccess('TypeScript 오류 없음!')
    return { success: true, errors: [] }
  } catch (error) {
    const output = error.stdout || error.stderr || ''
    const lines = output
      .split('\n')
      .filter(
        line => line.includes('error') || line.includes('Error') || line.includes('Type error')
      )

    if (lines.length > 0) {
      logError(`TypeScript 오류 발견 (${lines.length}개):`)
      lines.forEach(line => logError(`  ${line}`))
    } else {
      logWarning('TypeScript 체크 완료 (경고 있음)')
    }

    return { success: false, errors: lines }
  }
}

async function checkLinterErrors() {
  logSection('린터 오류 체크')

  try {
    logInfo('린터 체크 실행 중...')

    // 현재 작업 디렉토리에서 린터 실행
    const result = execSync('npx svelte-check --tsconfig ./tsconfig.json', {
      encoding: 'utf8',
      stdio: 'pipe'
    })

    logSuccess('린터 오류 없음!')
    return { success: true, errors: [] }
  } catch (error) {
    const output = error.stdout || error.stderr || ''
    const lines = output
      .split('\n')
      .filter(
        line =>
          line.includes('warning') ||
          line.includes('Warning') ||
          line.includes('error') ||
          line.includes('Error')
      )

    if (lines.length > 0) {
      logWarning(`린터 경고/오류 발견 (${lines.length}개):`)
      lines.forEach(line => logWarning(`  ${line}`))
    } else {
      logInfo('린터 체크 완료')
    }

    return { success: false, errors: lines }
  }
}

async function checkBuildErrors() {
  logSection('빌드 오류 체크')

  try {
    logInfo('빌드 테스트 실행 중...')

    const result = execSync('npm run build', {
      encoding: 'utf8',
      stdio: 'pipe'
    })

    logSuccess('빌드 성공!')
    return { success: true, errors: [] }
  } catch (error) {
    const output = error.stdout || error.stderr || ''
    const lines = output
      .split('\n')
      .filter(
        line =>
          line.includes('error') ||
          line.includes('Error') ||
          line.includes('failed') ||
          line.includes('Failed')
      )

    if (lines.length > 0) {
      logError(`빌드 오류 발견 (${lines.length}개):`)
      lines.forEach(line => logError(`  ${line}`))
    }

    return { success: false, errors: lines }
  }
}

async function generateErrorReport(tsResult, linterResult, buildResult) {
  logSection('오류 리포트')

  const totalErrors =
    tsResult.errors.length + linterResult.errors.length + buildResult.errors.length

  if (totalErrors === 0) {
    logSuccess('🎉 모든 체크 통과! 코드가 깔끔합니다.')
    return true
  }

  logError(`총 ${totalErrors}개의 문제가 발견되었습니다:`)

  if (tsResult.errors.length > 0) {
    logError(`  - TypeScript 오류: ${tsResult.errors.length}개`)
  }

  if (linterResult.errors.length > 0) {
    logWarning(`  - 린터 경고/오류: ${linterResult.errors.length}개`)
  }

  if (buildResult.errors.length > 0) {
    logError(`  - 빌드 오류: ${buildResult.errors.length}개`)
  }

  logInfo('\n💡 권장사항:')
  logInfo('  1. TypeScript 오류부터 수정하세요')
  logInfo('  2. 빌드 오류를 수정하세요')
  logInfo('  3. 린터 경고는 코드 품질 개선을 위해 수정하세요')

  return false
}

async function main() {
  log('🔍 자동 오류 체크 시작', 'bright')
  log('='.repeat(60), 'cyan')

  try {
    // 1. TypeScript 오류 체크
    const tsResult = await checkTypeScriptErrors()

    // 2. 린터 오류 체크
    const linterResult = await checkLinterErrors()

    // 3. 빌드 오류 체크
    const buildResult = await checkBuildErrors()

    // 4. 리포트 생성
    const allPassed = await generateErrorReport(tsResult, linterResult, buildResult)

    if (allPassed) {
      log('\n🎯 결과: 모든 체크 통과!', 'green')
      process.exit(0)
    } else {
      log('\n⚠️  결과: 문제가 발견되었습니다. 위의 권장사항을 따라 수정하세요.', 'yellow')
      process.exit(1)
    }
  } catch (error) {
    logError(`스크립트 실행 중 오류 발생: ${error.message}`)
    process.exit(1)
  }
}

// 스크립트 실행
main()
