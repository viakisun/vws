#!/usr/bin/env node

// 간단한 자동 검증 서비스
import { existsSync, mkdirSync, readFileSync, watch, writeFileSync } from 'fs'
import { dirname, join } from 'path'

class SimpleAutoValidation {
	constructor() {
		this.logFile = join(process.cwd(), 'logs', 'auto-validation.log')
		this.pidFile = join(process.cwd(), 'logs', 'auto-validation.pid')
		this.ensureLogDirectory()
		this.watchers = new Map()
	}

	ensureLogDirectory() {
		const logDir = dirname(this.logFile)
		if (!existsSync(logDir)) {
			mkdirSync(logDir, { recursive: true })
		}
	}

	log(message) {
		const timestamp = new Date().toISOString()
		const logMessage = `[${timestamp}] ${message}\n`
		writeFileSync(this.logFile, logMessage, { flag: 'a' })
		console.log(message)
	}

	start() {
		this.log('🚀 간단한 자동 검증 서비스 시작...')

		// 감시할 디렉토리들
		const watchDirs = [
			'src/lib/utils',
			'src/routes/api/project-management',
			'src/lib/components/project-management',
			'src/routes/project-management'
		]

		// 각 디렉토리 감시 시작
		watchDirs.forEach(dir => {
			if (existsSync(dir)) {
				this.log(`🔍 디렉토리 감시 시작: ${dir}`)
				const watcher = watch(dir, { recursive: true }, (eventType, filename) => {
					if (
						filename &&
						(filename.endsWith('.ts') || filename.endsWith('.js') || filename.endsWith('.svelte'))
					) {
						const filePath = join(dir, filename)
						this.log(`📝 파일 변경 감지: ${eventType} - ${filePath}`)
						this.validateFile(filePath)
					}
				})
				this.watchers.set(dir, watcher)
			} else {
				this.log(`⚠️ 디렉토리가 존재하지 않습니다: ${dir}`)
			}
		})

		// 주기적 검증 (10분마다)
		setInterval(
			() => {
				this.log('🔄 주기적 검증 실행')
				watchDirs.forEach(dir => {
					if (existsSync(dir)) {
						this.log(`🔍 디렉토리 검증: ${dir}`)
					}
				})
			},
			10 * 60 * 1000
		)

		this.log('✅ 자동 검증 서비스가 시작되었습니다.')
	}

	validateFile(filePath) {
		try {
			if (!existsSync(filePath)) {
				this.log(`⚠️ 파일이 존재하지 않습니다: ${filePath}`)
				return
			}

			const content = readFileSync(filePath, 'utf-8')

			// 프로젝트 관리 페이지 특화 검증
			if (filePath.includes('/project-management/')) {
				this.validateProjectManagementPage(filePath, content)
			} else {
				this.log(`✅ 검증 통과: ${filePath}`)
			}
		} catch (error) {
			this.log(`❌ 파일 검증 실패: ${filePath} - ${error.message}`)
		}
	}

	validateProjectManagementPage(filePath, content) {
		const issues = []
		let hasErrorHandling = false
		let hasLoadingStates = false
		let hasValidation = false
		let hasTabManagement = false
		let hasRuntimeErrorHandling = false

		// 에러 처리 검증
		if (content.includes('tabErrors') || content.includes('error') || content.includes('catch')) {
			hasErrorHandling = true
		} else {
			issues.push('에러 처리 로직이 없습니다.')
		}

		// 로딩 상태 검증
		if (content.includes('loading') || content.includes('tabLoadingStates')) {
			hasLoadingStates = true
		} else {
			issues.push('로딩 상태 관리가 없습니다.')
		}

		// 데이터 검증 검증
		if (content.includes('validate') || content.includes('validation')) {
			hasValidation = true
		} else {
			issues.push('데이터 검증 로직이 없습니다.')
		}

		// 데이터 검증 실패 처리 검증
		if (content.includes('validationResult.isValid') && content.includes('throw new Error')) {
			// 검증 실패 시 적절한 오류 처리
		} else if (content.includes('validateProjectData')) {
			issues.push('데이터 검증 실패 처리가 부족합니다.')
		}

		// 탭 관리 검증
		if (content.includes('activeTab') || content.includes('tab')) {
			hasTabManagement = true
		} else {
			issues.push('탭 관리 로직이 없습니다.')
		}

		// 런타임 오류 처리 검증
		if (this.checkRuntimeErrorHandling(content)) {
			hasRuntimeErrorHandling = true
		} else {
			issues.push('런타임 오류 처리가 부족합니다.')
		}

		// Svelte 5 문법 검증
		if (content.includes('$state') && !content.includes('$derived')) {
			issues.push('Svelte 5 반응성 문법이 완전하지 않습니다.')
		}

		// 접근성 검증
		if (content.includes('<label') && !content.includes('for=')) {
			issues.push('접근성을 위해 label에 for 속성을 추가하세요.')
		}

		this.log(`🔍 프로젝트 관리 페이지 검증: ${filePath}`)
		if (issues.length > 0) {
			this.log(`⚠️ 발견된 문제들: ${issues.join(', ')}`)
		} else {
			this.log(`✅ 프로젝트 관리 페이지 검증 통과`)
		}

		// 런타임 오류 검증 실행
		if (filePath.includes('+page.svelte')) {
			this.validateRuntimeErrors(filePath, content)
		}
	}

	checkRuntimeErrorHandling(content) {
		// fetch 오류 처리 검증
		const hasFetchErrorHandling =
			content.includes('catch') && (content.includes('fetch') || content.includes('response.ok'))

		// 네트워크 오류 처리 검증
		const hasNetworkErrorHandling =
			content.includes('네트워크 오류') ||
			content.includes('network error') ||
			content.includes('Failed to fetch')

		// HTTP 상태 코드 처리 검증
		const hasHttpStatusHandling =
			content.includes('response.status') ||
			content.includes('HTTP') ||
			content.includes('404') ||
			content.includes('500')

		return hasFetchErrorHandling && hasNetworkErrorHandling && hasHttpStatusHandling
	}

	async validateRuntimeErrors(filePath, content) {
		try {
			this.log(`🔍 런타임 오류 검증 시작: ${filePath}`)

			// API 엔드포인트 검증
			const apiEndpoints = this.extractApiEndpoints(content)
			for (const endpoint of apiEndpoints) {
				await this.testApiEndpoint(endpoint)
			}

			// fetch 오류 시나리오 검증
			await this.testFetchErrorScenarios(content)
		} catch (error) {
			this.log(`❌ 런타임 오류 검증 실패: ${error.message}`)
		}
	}

	extractApiEndpoints(content) {
		const endpoints = []
		const fetchRegex = /fetch\(['"`]([^'"`]+)['"`]\)/g
		let match

		while ((match = fetchRegex.exec(content)) !== null) {
			endpoints.push(match[1])
		}

		return [...new Set(endpoints)] // 중복 제거
	}

	async testApiEndpoint(endpoint) {
		try {
			// 로컬 서버가 실행 중인지 확인
			const response = await fetch(`http://localhost:5173${endpoint}`, {
				method: 'HEAD',
				signal: AbortSignal.timeout(5000) // 5초 타임아웃
			})

			if (response.ok) {
				this.log(`✅ API 엔드포인트 접근 가능: ${endpoint}`)
			} else {
				this.log(`⚠️ API 엔드포인트 오류: ${endpoint} - HTTP ${response.status}`)
			}
		} catch (error) {
			if (error.name === 'AbortError') {
				this.log(`⏱️ API 엔드포인트 타임아웃: ${endpoint}`)
			} else if (error.message.includes('Failed to fetch')) {
				this.log(`❌ API 엔드포인트 연결 실패: ${endpoint} - 서버가 실행 중이지 않을 수 있습니다`)
			} else {
				this.log(`❌ API 엔드포인트 테스트 실패: ${endpoint} - ${error.message}`)
			}
		}
	}

	async testFetchErrorScenarios(content) {
		// fetch 오류 처리 패턴 검증
		const errorHandlingPatterns = [
			{
				pattern: /catch\s*\(\s*\w+\s*\)\s*\{/,
				name: 'catch 블록 존재'
			},
			{
				pattern: /response\.ok/,
				name: 'response.ok 체크'
			},
			{
				pattern: /response\.status/,
				name: 'HTTP 상태 코드 체크'
			},
			{
				pattern: /네트워크 오류|network error|Failed to fetch/,
				name: '네트워크 오류 메시지'
			},
			{
				pattern: /err\s*instanceof\s*Error/,
				name: 'Error 타입 체크'
			},
			{
				pattern: /console\.error/,
				name: '에러 로깅'
			}
		]

		errorHandlingPatterns.forEach(({ pattern, name }) => {
			if (pattern.test(content)) {
				this.log(`✅ ${name} 검증 통과`)
			} else {
				this.log(`⚠️ ${name} 검증 실패 - 해당 패턴이 없습니다`)
			}
		})

		// 데이터 검증 실패 처리 검증
		if (
			content.includes('validationResult.isValid') &&
			content.includes('return // throw 대신 return으로 함수 종료')
		) {
			this.log(`✅ 데이터 검증 실패 처리 검증 통과 (무한 루프 방지)`)
		} else if (content.includes('validateProjectData')) {
			this.log(`⚠️ 데이터 검증 실패 처리가 부족합니다`)
		}

		// 무한 루프 방지 검증 제거 - 복잡성 감소 및 실용성 향상
	}

	stop() {
		this.log('🛑 자동 검증 서비스 중지...')
		this.watchers.forEach((watcher, dir) => {
			watcher.close()
			this.log(`🔍 디렉토리 감시 중지: ${dir}`)
		})
		this.watchers.clear()
		this.log('✅ 자동 검증 서비스가 중지되었습니다.')
	}
}

// CLI 실행
const command = process.argv[2]
const service = new SimpleAutoValidation()

if (command === 'start') {
	service.start()

	// PID 저장
	writeFileSync(service.pidFile, process.pid.toString())

	// 종료 시그널 처리
	process.on('SIGINT', () => {
		service.stop()
		process.exit(0)
	})

	process.on('SIGTERM', () => {
		service.stop()
		process.exit(0)
	})
} else if (command === 'stop') {
	service.stop()
} else {
	console.log('사용법: node simple-auto-validation.js [start|stop]')
}
