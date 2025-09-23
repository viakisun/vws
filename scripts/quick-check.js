#!/usr/bin/env node

/**
 * 빠른 오류 체크 스크립트
 * 코드 작성 후 즉시 실행할 수 있는 간단한 체크
 */

import { execSync } from 'child_process'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function quickCheck() {
  log('🔍 빠른 오류 체크', 'bright')
  log('─'.repeat(40), 'blue')

  try {
    // TypeScript 체크
    log('TypeScript 체크 중...', 'blue')
    execSync('npm run check', { stdio: 'pipe' })
    log('✅ TypeScript: OK', 'green')

    // 빌드 체크
    log('빌드 테스트 중...', 'blue')
    execSync('npm run build', { stdio: 'pipe' })
    log('✅ 빌드: OK', 'green')

    log('\n🎉 모든 체크 통과!', 'green')
  } catch (error) {
    log('\n❌ 오류 발견!', 'red')
    log('자세한 내용을 보려면: npm run check:errors', 'yellow')
    process.exit(1)
  }
}

quickCheck()
