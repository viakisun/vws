#!/usr/bin/env node

// 자동 검증 서비스 CLI 도구

import { exec, spawn } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

class AutoValidationCLI {
  constructor() {
    this.serviceFile = 'src/lib/services/auto-validation-service.js'
    this.pidFile = join(process.cwd(), 'logs', 'auto-validation.pid')
    this.logFile = join(process.cwd(), 'logs', 'auto-validation.log')
    this.ensureLogDirectory()
  }

  /**
   * CLI 실행
   */
  async run() {
    const command = process.argv[2]
    const args = process.argv.slice(3)

    switch (command) {
      case 'start':
        await this.start()
        break
      case 'stop':
        await this.stop()
        break
      case 'restart':
        await this.restart()
        break
      case 'status':
        await this.status()
        break
      case 'logs':
        await this.logs(args[0] || '50')
        break
      case 'test':
        await this.test()
        break
      case 'help':
        this.help()
        break
      default:
        console.log('❌ 알 수 없는 명령어입니다.')
        this.help()
    }
  }

  /**
   * 서비스 시작
   */
  async start() {
    if (this.isRunning()) {
      console.log('⚠️ 자동 검증 서비스가 이미 실행 중입니다.')
      return
    }

    console.log('🚀 자동 검증 서비스 시작...')

    try {
      // TypeScript 파일을 JavaScript로 컴파일
      await this.compileService()

      // 백그라운드에서 서비스 실행
      const serviceProcess = spawn('node', [this.serviceFile], {
        detached: true,
        stdio: 'ignore'
      })

      serviceProcess.unref()

      // PID 저장
      writeFileSync(this.pidFile, serviceProcess.pid.toString())

      console.log('✅ 자동 검증 서비스가 시작되었습니다.')
      console.log(`📋 PID: ${serviceProcess.pid}`)
      console.log(`📝 로그: ${this.logFile}`)
      console.log('')
      console.log('사용 가능한 명령어:')
      console.log('  npm run auto-validation status  - 상태 확인')
      console.log('  npm run auto-validation logs    - 로그 확인')
      console.log('  npm run auto-validation stop    - 서비스 중지')
    } catch (error) {
      console.error('❌ 서비스 시작 실패:', error.message)
    }
  }

  /**
   * 서비스 중지
   */
  async stop() {
    if (!this.isRunning()) {
      console.log('⚠️ 자동 검증 서비스가 실행 중이 아닙니다.')
      return
    }

    console.log('🛑 자동 검증 서비스 중지...')

    try {
      const pid = parseInt(readFileSync(this.pidFile, 'utf-8'))
      process.kill(pid, 'SIGTERM')

      // PID 파일 삭제
      writeFileSync(this.pidFile, '')

      console.log('✅ 자동 검증 서비스가 중지되었습니다.')
    } catch (error) {
      console.error('❌ 서비스 중지 실패:', error.message)
    }
  }

  /**
   * 서비스 재시작
   */
  async restart() {
    console.log('🔄 자동 검증 서비스 재시작...')
    await this.stop()
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 대기
    await this.start()
  }

  /**
   * 서비스 상태 확인
   */
  async status() {
    console.log('📊 자동 검증 서비스 상태')
    console.log('=' * 40)

    if (this.isRunning()) {
      const pid = parseInt(readFileSync(this.pidFile, 'utf-8'))
      console.log('✅ 상태: 실행 중')
      console.log(`📋 PID: ${pid}`)
      console.log(`📝 로그 파일: ${this.logFile}`)

      // 최근 로그 확인
      if (existsSync(this.logFile)) {
        const logs = readFileSync(this.logFile, 'utf-8').split('\n')
        const recentLogs = logs.slice(-5).filter(log => log.trim())
        console.log('')
        console.log('📝 최근 로그:')
        recentLogs.forEach(log => console.log(`  ${log}`))
      }
    } else {
      console.log('❌ 상태: 중지됨')
    }
  }

  /**
   * 로그 확인
   */
  async logs(lines = '50') {
    if (!existsSync(this.logFile)) {
      console.log('📝 로그 파일이 존재하지 않습니다.')
      return
    }

    console.log(`📝 자동 검증 서비스 로그 (최근 ${lines}줄)`)
    console.log('=' * 50)

    try {
      const { stdout } = await this.execAsync(`tail -n ${lines} "${this.logFile}"`)
      console.log(stdout)
    } catch (error) {
      console.error('❌ 로그 확인 실패:', error.message)
    }
  }

  /**
   * 테스트 실행
   */
  async test() {
    console.log('🧪 자동 검증 서비스 테스트')
    console.log('=' * 40)

    try {
      // 1. 서비스 파일 존재 확인
      console.log('1. 서비스 파일 확인...')
      if (existsSync(this.serviceFile)) {
        console.log('  ✅ 서비스 파일 존재')
      } else {
        console.log('  ❌ 서비스 파일 없음')
        return
      }

      // 2. 의존성 확인
      console.log('2. 의존성 확인...')
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
      const requiredDeps = ['prettier', 'typescript']
      const missingDeps = requiredDeps.filter(dep => !packageJson.devDependencies?.[dep])

      if (missingDeps.length === 0) {
        console.log('  ✅ 모든 의존성 설치됨')
      } else {
        console.log(`  ❌ 누락된 의존성: ${missingDeps.join(', ')}`)
        console.log(`  💡 설치 명령어: npm install --save-dev ${missingDeps.join(' ')}`)
      }

      // 3. 디렉토리 구조 확인
      console.log('3. 디렉토리 구조 확인...')
      const requiredDirs = [
        'src/lib/utils',
        'src/routes/api/project-management',
        'src/lib/components/project-management'
      ]

      requiredDirs.forEach(dir => {
        if (existsSync(dir)) {
          console.log(`  ✅ ${dir}`)
        } else {
          console.log(`  ❌ ${dir} (없음)`)
        }
      })

      // 4. 권한 확인
      console.log('4. 권한 확인...')
      try {
        writeFileSync(this.logFile, 'test')
        console.log('  ✅ 로그 파일 쓰기 권한')
      } catch (error) {
        console.log('  ❌ 로그 파일 쓰기 권한 없음')
      }

      console.log('')
      console.log('✅ 테스트 완료')
    } catch (error) {
      console.error('❌ 테스트 실패:', error.message)
    }
  }

  /**
   * 도움말 표시
   */
  help() {
    console.log('🤖 자동 검증 서비스 CLI')
    console.log('')
    console.log('사용법: npm run auto-validation <명령어>')
    console.log('')
    console.log('명령어:')
    console.log('  start     - 서비스 시작')
    console.log('  stop      - 서비스 중지')
    console.log('  restart   - 서비스 재시작')
    console.log('  status    - 서비스 상태 확인')
    console.log('  logs [n]  - 로그 확인 (기본: 50줄)')
    console.log('  test      - 서비스 테스트')
    console.log('  help      - 도움말 표시')
    console.log('')
    console.log('예시:')
    console.log('  npm run auto-validation start')
    console.log('  npm run auto-validation status')
    console.log('  npm run auto-validation logs 100')
  }

  /**
   * 서비스가 실행 중인지 확인
   */
  isRunning() {
    if (!existsSync(this.pidFile)) {
      return false
    }

    try {
      const pid = parseInt(readFileSync(this.pidFile, 'utf-8'))
      process.kill(pid, 0) // 프로세스 존재 확인
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 서비스 파일 컴파일
   */
  async compileService() {
    console.log('🔨 서비스 파일 컴파일...')

    try {
      // TypeScript를 JavaScript로 컴파일
      const { stdout, stderr } = await this.execAsync(
        'npx tsc src/lib/services/auto-validation-service.ts --outDir . --target es2020 --module commonjs'
      )

      if (stderr) {
        console.log('⚠️ 컴파일 경고:', stderr)
      }

      console.log('✅ 컴파일 완료')
    } catch (error) {
      console.error('❌ 컴파일 실패:', error.message)
      throw error
    }
  }

  /**
   * execAsync 헬퍼
   */
  execAsync(command) {
    const execAsync = promisify(exec)
    return execAsync(command)
  }

  /**
   * 로그 디렉토리 생성
   */
  ensureLogDirectory() {
    const logDir = join(process.cwd(), 'logs')
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }
  }
}

// CLI 실행
const cli = new AutoValidationCLI()
cli.run().catch(error => {
  console.error('❌ CLI 실행 실패:', error)
  process.exit(1)
})
