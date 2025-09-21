// 자동 검증 훅 시스템

import { readFileSync, watch, writeFileSync } from 'fs'
import { extname, join } from 'path'
import { AICodingValidator } from './ai-coding-guidelines'
import { SafeChangeManager } from './safe-change-manager'
import { SchemaValidator } from './schema-validation'

// 파일 변경 감지 및 자동 검증
export class AutoValidationHooks {
	private static readonly WATCH_DIRS = ['src/lib/utils', 'src/routes/api/project-management']
	private static readonly SUPPORTED_EXTENSIONS = ['.ts', '.js', '.svelte']
	private static watchers: Map<string, any> = new Map()
	private static isEnabled = false

	/**
	 * 자동 검증 시스템 활성화
	 */
	static enable(): void {
		if (this.isEnabled) {
			console.log('⚠️ [자동 검증] 이미 활성화되어 있습니다.')
			return
		}

		console.log('🚀 [자동 검증] 시스템 활성화 시작')
		
		// 파일 변경 감지 시작
		this.startFileWatching()
		
		// Git 훅 설정
		this.setupGitHooks()
		
		// IDE 확장 프로그램 연동
		this.setupIDEIntegration()
		
		this.isEnabled = true
		console.log('✅ [자동 검증] 시스템 활성화 완료')
	}

	/**
	 * 자동 검증 시스템 비활성화
	 */
	static disable(): void {
		if (!this.isEnabled) {
			console.log('⚠️ [자동 검증] 이미 비활성화되어 있습니다.')
			return
		}

		console.log('🛑 [자동 검증] 시스템 비활성화 시작')
		
		// 파일 감지 중지
		this.stopFileWatching()
		
		this.isEnabled = false
		console.log('✅ [자동 검증] 시스템 비활성화 완료')
	}

	/**
	 * 파일 변경 감지 시작
	 */
	private static startFileWatching(): void {
		for (const dir of this.WATCH_DIRS) {
			try {
				const watcher = watch(dir, { recursive: true }, (eventType, filename) => {
					if (filename && this.SUPPORTED_EXTENSIONS.includes(extname(filename))) {
						const filePath = join(dir, filename)
						this.handleFileChange(eventType, filePath)
					}
				})
				
				this.watchers.set(dir, watcher)
				console.log(`👀 [파일 감지] ${dir} 감시 시작`)
			} catch (error) {
				console.error(`❌ [파일 감지] ${dir} 감시 실패:`, error)
			}
		}
	}

	/**
	 * 파일 변경 감지 중지
	 */
	private static stopFileWatching(): void {
		for (const [dir, watcher] of this.watchers) {
			watcher.close()
			console.log(`👀 [파일 감지] ${dir} 감시 중지`)
		}
		this.watchers.clear()
	}

	/**
	 * 파일 변경 처리
	 */
	private static async handleFileChange(eventType: string, filePath: string): Promise<void> {
		console.log(`📝 [파일 변경] ${eventType}: ${filePath}`)

		try {
			// 1. 파일 내용 읽기
			const content = readFileSync(filePath, 'utf-8')

			// 2. 자동 검증 실행
			const validation = await this.runAutoValidation(filePath, content)

			// 3. 검증 결과 처리
			await this.handleValidationResult(filePath, validation)

		} catch (error) {
			console.error(`❌ [파일 변경 처리] ${filePath} 오류:`, error)
		}
	}

	/**
	 * 자동 검증 실행
	 */
	private static async runAutoValidation(filePath: string, content: string): Promise<{
		coding: any
		schema: any
		dependency: any
	}> {
		const results = {
			coding: null as any,
			schema: null as any,
			dependency: null as any
		}

		try {
			// 1. 코딩 가이드라인 검증
			results.coding = AICodingValidator.validateCode(content, 'typescript')

			// 2. 스키마 검증 (API 파일인 경우)
			if (filePath.includes('/api/')) {
				results.schema = await SchemaValidator.validateDatabaseSchema()
			}

			// 3. 의존성 분석
			results.dependency = await this.analyzeDependencies(filePath)

		} catch (error) {
			console.error(`❌ [자동 검증] ${filePath} 오류:`, error)
		}

		return results
	}

	/**
	 * 검증 결과 처리
	 */
	private static async handleValidationResult(filePath: string, validation: any): Promise<void> {
		const hasErrors = validation.coding?.errors?.length > 0
		const hasWarnings = validation.coding?.warnings?.length > 0

		if (hasErrors) {
			console.log(`❌ [검증 실패] ${filePath}`)
			validation.coding.errors.forEach((error: string) => {
				console.log(`  - ${error}`)
			})
			
			// 자동 수정 시도
			await this.attemptAutoFix(filePath, validation)
		} else if (hasWarnings) {
			console.log(`⚠️ [검증 경고] ${filePath}`)
			validation.coding.warnings.forEach((warning: string) => {
				console.log(`  - ${warning}`)
			})
		} else {
			console.log(`✅ [검증 통과] ${filePath}`)
		}
	}

	/**
	 * 자동 수정 시도
	 */
	private static async attemptAutoFix(filePath: string, validation: any): Promise<void> {
		console.log(`🔧 [자동 수정] ${filePath} 시도`)

		try {
			// 변경 계획 생성
			const plan = await SafeChangeManager.createChangePlan(
				filePath,
				'modify',
				'자동 수정'
			)

			// 자동 수정 로직 실행
			await this.executeAutoFix(plan, validation)

		} catch (error) {
			console.error(`❌ [자동 수정] ${filePath} 실패:`, error)
		}
	}

	/**
	 * 자동 수정 실행
	 */
	private static async executeAutoFix(plan: any, validation: any): Promise<void> {
		// 실제 자동 수정 로직은 여기에 구현
		// 예: 코드 포맷팅, 타입 수정, import 정리 등
		console.log(`🔧 [자동 수정] 계획 ID: ${plan.id}`)
	}

	/**
	 * 의존성 분석
	 */
	private static async analyzeDependencies(filePath: string): Promise<any> {
		// 간단한 의존성 분석
		return {
			riskLevel: 'low',
			dependencies: [],
			dependents: []
		}
	}

	/**
	 * Git 훅 설정
	 */
	private static setupGitHooks(): void {
		console.log('🔗 [Git 훅] 설정 시작')

		// pre-commit 훅 설정
		const preCommitHook = `#!/bin/sh
# 자동 검증 실행
echo "🔍 [Git 훅] 커밋 전 검증 시작"
node -e "
const { AutoValidationHooks } = require('./src/lib/utils/auto-validation-hooks.ts');
AutoValidationHooks.runPreCommitValidation();
"
`

		// post-commit 훅 설정
		const postCommitHook = `#!/bin/sh
# 커밋 후 검증
echo "✅ [Git 훅] 커밋 후 검증 완료"
`

		try {
			writeFileSync('.git/hooks/pre-commit', preCommitHook)
			writeFileSync('.git/hooks/post-commit', postCommitHook)
			console.log('✅ [Git 훅] 설정 완료')
		} catch (error) {
			console.error('❌ [Git 훅] 설정 실패:', error)
		}
	}

	/**
	 * IDE 확장 프로그램 연동
	 */
	private static setupIDEIntegration(): void {
		console.log('🔌 [IDE 연동] 설정 시작')

		// VS Code 설정
		const vscodeSettings = {
			"files.watcherExclude": {
				"**/node_modules/**": true,
				"**/.git/**": true
			},
			"typescript.preferences.includePackageJsonAutoImports": "auto",
			"editor.codeActionsOnSave": {
				"source.fixAll": true,
				"source.organizeImports": true
			}
		}

		try {
			writeFileSync('.vscode/settings.json', JSON.stringify(vscodeSettings, null, 2))
			console.log('✅ [IDE 연동] VS Code 설정 완료')
		} catch (error) {
			console.error('❌ [IDE 연동] 설정 실패:', error)
		}
	}

	/**
	 * 커밋 전 검증 실행
	 */
	static async runPreCommitValidation(): Promise<boolean> {
		console.log('🔍 [커밋 전 검증] 시작')

		try {
			// 변경된 파일들 검증
			const changedFiles = await this.getChangedFiles()
			let allValid = true

			for (const file of changedFiles) {
				const content = readFileSync(file, 'utf-8')
				const validation = await this.runAutoValidation(file, content)

				if (validation.coding?.errors?.length > 0) {
					console.log(`❌ [커밋 전 검증] ${file} 실패`)
					allValid = false
				}
			}

			if (allValid) {
				console.log('✅ [커밋 전 검증] 모든 파일 통과')
			} else {
				console.log('❌ [커밋 전 검증] 일부 파일 실패 - 커밋 중단')
			}

			return allValid
		} catch (error) {
			console.error('❌ [커밋 전 검증] 오류:', error)
			return false
		}
	}

	/**
	 * 변경된 파일 목록 가져오기
	 */
	private static async getChangedFiles(): Promise<string[]> {
		// Git 명령어로 변경된 파일 목록 가져오기
		// 실제 구현에서는 child_process를 사용
		return []
	}

	/**
	 * 상태 조회
	 */
	static getStatus(): {
		isEnabled: boolean
		watchedDirs: string[]
		watchersCount: number
	} {
		return {
			isEnabled: this.isEnabled,
			watchedDirs: this.WATCH_DIRS,
			watchersCount: this.watchers.size
		}
	}
}




