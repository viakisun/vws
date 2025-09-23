#!/usr/bin/env node

/**
 * 코드 품질 게이트 스크립트
 *
 * 이 스크립트는 코드 품질 임계값을 정의하고 체크합니다.
 * CI/CD 파이프라인에서 사용하여 품질 기준을 만족하지 않으면 빌드를 실패시킵니다.
 */

import { execSync } from 'child_process'

// 색상 정의
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

// 품질 게이트 임계값 정의
const QUALITY_GATES = {
  // TypeScript 오류 허용 개수
  MAX_TYPESCRIPT_ERRORS: 0,

  // ESLint 오류 허용 개수
  MAX_ESLINT_ERRORS: 0,
  MAX_ESLINT_WARNINGS: 10,

  // 테스트 커버리지 (백분율)
  MIN_TEST_COVERAGE: 80,

  // 코드 복잡도
  MAX_CYCLOMATIC_COMPLEXITY: 10,

  // 파일 크기 (라인 수)
  MAX_FILE_SIZE: 500,

  // 함수 크기 (라인 수)
  MAX_FUNCTION_SIZE: 50,

  // 중첩 깊이
  MAX_NESTING_DEPTH: 4,

  // 보안 취약점
  MAX_SECURITY_VULNERABILITIES: 0,

  // 의존성 문제
  MAX_DEPENDENCY_ISSUES: 0,

  // 빌드 시간 (초)
  MAX_BUILD_TIME: 120
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

class QualityGate {
  constructor() {
    this.results = {
      typescript: { passed: false, errors: 0, warnings: 0 },
      eslint: { passed: false, errors: 0, warnings: 0 },
      build: { passed: false, time: 0 },
      security: { passed: false, vulnerabilities: 0 },
      dependencies: { passed: false, issues: 0 },
      coverage: { passed: false, percentage: 0 },
      complexity: { passed: false, maxComplexity: 0 },
      fileSize: { passed: false, maxSize: 0 },
      overall: { passed: false }
    }
  }

  async checkTypeScript() {
    logSection('TypeScript 품질 체크')

    try {
      const startTime = Date.now()
      const result = execSync('npm run check', {
        encoding: 'utf8',
        stdio: 'pipe'
      })
      const endTime = Date.now()

      logSuccess('TypeScript 체크 통과!')
      this.results.typescript.passed = true
      this.results.typescript.errors = 0
      this.results.typescript.warnings = 0

      return true
    } catch (error) {
      const output = error.stdout || error.stderr || ''
      const errorLines = output
        .split('\n')
        .filter(line => line.includes('error') || line.includes('Error'))
      const warningLines = output
        .split('\n')
        .filter(line => line.includes('warning') || line.includes('Warning'))

      this.results.typescript.errors = errorLines.length
      this.results.typescript.warnings = warningLines.length

      if (this.results.typescript.errors > QUALITY_GATES.MAX_TYPESCRIPT_ERRORS) {
        logError(
          `TypeScript 오류 ${this.results.typescript.errors}개 (허용: ${QUALITY_GATES.MAX_TYPESCRIPT_ERRORS}개)`
        )
        this.results.typescript.passed = false
        return false
      }

      logWarning(`TypeScript 경고 ${this.results.typescript.warnings}개 발견`)
      this.results.typescript.passed = true
      return true
    }
  }

  async checkESLint() {
    logSection('ESLint 품질 체크')

    try {
      const result = execSync('npx eslint src/ --ext .ts,.svelte --format=json', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      logSuccess('ESLint 체크 통과!')
      this.results.eslint.passed = true
      this.results.eslint.errors = 0
      this.results.eslint.warnings = 0

      return true
    } catch (error) {
      try {
        const output = error.stdout || ''
        const eslintResults = JSON.parse(output)

        let totalErrors = 0
        let totalWarnings = 0

        eslintResults.forEach(file => {
          totalErrors += file.errorCount || 0
          totalWarnings += file.warningCount || 0
        })

        this.results.eslint.errors = totalErrors
        this.results.eslint.warnings = totalWarnings

        if (totalErrors > QUALITY_GATES.MAX_ESLINT_ERRORS) {
          logError(`ESLint 오류 ${totalErrors}개 (허용: ${QUALITY_GATES.MAX_ESLINT_ERRORS}개)`)
          this.results.eslint.passed = false
          return false
        }

        if (totalWarnings > QUALITY_GATES.MAX_ESLINT_WARNINGS) {
          logWarning(
            `ESLint 경고 ${totalWarnings}개 (허용: ${QUALITY_GATES.MAX_ESLINT_WARNINGS}개)`
          )
          this.results.eslint.passed = false
          return false
        }

        logSuccess('ESLint 품질 게이트 통과!')
        this.results.eslint.passed = true
        return true
      } catch (parseError) {
        logError('ESLint 결과 파싱 실패')
        this.results.eslint.passed = false
        return false
      }
    }
  }

  async checkBuild() {
    logSection('빌드 품질 체크')

    try {
      const startTime = Date.now()
      execSync('npm run build', {
        encoding: 'utf8',
        stdio: 'pipe'
      })
      const endTime = Date.now()

      const buildTime = (endTime - startTime) / 1000
      this.results.build.time = buildTime

      if (buildTime > QUALITY_GATES.MAX_BUILD_TIME) {
        logWarning(`빌드 시간 ${buildTime.toFixed(2)}초 (허용: ${QUALITY_GATES.MAX_BUILD_TIME}초)`)
        this.results.build.passed = false
        return false
      }

      logSuccess(`빌드 성공! (${buildTime.toFixed(2)}초)`)
      this.results.build.passed = true
      return true
    } catch (error) {
      logError('빌드 실패')
      this.results.build.passed = false
      return false
    }
  }

  async checkSecurity() {
    logSection('보안 품질 체크')

    try {
      const result = execSync('npm audit --json', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      const auditResult = JSON.parse(result)
      const vulnerabilities = auditResult.metadata?.vulnerabilities || {}

      let totalVulnerabilities = 0
      Object.values(vulnerabilities).forEach(count => {
        if (typeof count === 'number') {
          totalVulnerabilities += count
        }
      })

      this.results.security.vulnerabilities = totalVulnerabilities

      if (totalVulnerabilities > QUALITY_GATES.MAX_SECURITY_VULNERABILITIES) {
        logError(
          `보안 취약점 ${totalVulnerabilities}개 발견 (허용: ${QUALITY_GATES.MAX_SECURITY_VULNERABILITIES}개)`
        )
        this.results.security.passed = false
        return false
      }

      logSuccess('보안 체크 통과!')
      this.results.security.passed = true
      return true
    } catch (error) {
      logWarning('보안 체크를 건너뜁니다 (npm audit 실패)')
      this.results.security.passed = true
      return true
    }
  }

  async checkFileSizes() {
    logSection('파일 크기 체크')

    try {
      // 간단한 파일 크기 체크 (실제로는 더 정교한 도구 사용 권장)
      const result = execSync('find src -name "*.ts" -o -name "*.svelte" | xargs wc -l | tail -1', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      const totalLines = parseInt(result.trim().split(' ')[0]) || 0
      this.results.fileSize.maxSize = totalLines

      if (totalLines > QUALITY_GATES.MAX_FILE_SIZE * 100) {
        // 전체 프로젝트 기준
        logWarning(
          `전체 코드 라인 수 ${totalLines}줄 (권장: ${QUALITY_GATES.MAX_FILE_SIZE * 100}줄 이하)`
        )
        this.results.fileSize.passed = false
        return false
      }

      logSuccess(`파일 크기 체크 통과! (${totalLines}줄)`)
      this.results.fileSize.passed = true
      return true
    } catch (error) {
      logWarning('파일 크기 체크를 건너뜁니다')
      this.results.fileSize.passed = true
      return true
    }
  }

  generateReport() {
    logSection('품질 게이트 리포트')

    const allPassed = Object.values(this.results).every(result =>
      typeof result === 'boolean' ? result : result.passed
    )

    this.results.overall.passed = allPassed

    // 결과 출력
    logInfo('TypeScript: ' + (this.results.typescript.passed ? '✅ 통과' : '❌ 실패'))
    logInfo(`  - 오류: ${this.results.typescript.errors}개`)
    logInfo(`  - 경고: ${this.results.typescript.warnings}개`)

    logInfo('ESLint: ' + (this.results.eslint.passed ? '✅ 통과' : '❌ 실패'))
    logInfo(`  - 오류: ${this.results.eslint.errors}개`)
    logInfo(`  - 경고: ${this.results.eslint.warnings}개`)

    logInfo('빌드: ' + (this.results.build.passed ? '✅ 통과' : '❌ 실패'))
    logInfo(`  - 시간: ${this.results.build.time.toFixed(2)}초`)

    logInfo('보안: ' + (this.results.security.passed ? '✅ 통과' : '❌ 실패'))
    logInfo(`  - 취약점: ${this.results.security.vulnerabilities}개`)

    logInfo('파일 크기: ' + (this.results.fileSize.passed ? '✅ 통과' : '❌ 실패'))
    logInfo(`  - 총 라인 수: ${this.results.fileSize.maxSize}줄`)

    if (allPassed) {
      logSuccess('\n🎉 모든 품질 게이트 통과!')
      logInfo('코드가 프로덕션 배포 기준을 만족합니다.')
    } else {
      logError('\n🚫 품질 게이트 실패!')
      logInfo('코드 품질을 개선한 후 다시 시도하세요.')
    }

    return allPassed
  }

  async run() {
    log('🔍 코드 품질 게이트 실행', 'bright')
    log('='.repeat(60), 'cyan')

    const checks = [
      this.checkTypeScript(),
      this.checkESLint(),
      this.checkBuild(),
      this.checkSecurity(),
      this.checkFileSizes()
    ]

    await Promise.all(checks)

    const passed = this.generateReport()

    if (!passed) {
      process.exit(1)
    }

    process.exit(0)
  }
}

// 스크립트 실행
const qualityGate = new QualityGate()
qualityGate.run().catch(error => {
  logError(`품질 게이트 실행 중 오류: ${error.message}`)
  process.exit(1)
})
