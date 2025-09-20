import { readFileSync, readdirSync, statSync } from 'fs'
import { extname, join } from 'path'

// 코드 의존성 분석 결과 타입
export interface DependencyAnalysis {
	filePath: string
	dependencies: string[]
	dependents: string[]
	imports: ImportInfo[]
	exports: ExportInfo[]
	usage: UsageInfo[]
	riskLevel: 'low' | 'medium' | 'high' | 'critical'
	changeImpact: ChangeImpact[]
}

export interface ImportInfo {
	path: string
	type: 'relative' | 'absolute' | 'package'
	importedItems: string[]
	lineNumber: number
}

export interface ExportInfo {
	name: string
	type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'let' | 'var'
	lineNumber: number
	isDefault: boolean
}

export interface UsageInfo {
	item: string
	locations: Array<{
		file: string
		lineNumber: number
		context: string
	}>
}

export interface ChangeImpact {
	affectedFile: string
	impactType: 'breaking' | 'non-breaking' | 'unknown'
	description: string
	severity: 'low' | 'medium' | 'high' | 'critical'
}

// 코드 의존성 분석기
export class CodeDependencyAnalyzer {
	private static readonly SRC_DIR = 'src'
	private static readonly SUPPORTED_EXTENSIONS = ['.ts', '.js', '.svelte', '.vue', '.jsx', '.tsx']
	private static readonly IGNORE_PATTERNS = ['node_modules', '.git', 'dist', 'build', '.svelte-kit']

	/**
	 * 전체 프로젝트 의존성 분석
	 */
	static async analyzeProjectDependencies(): Promise<Map<string, DependencyAnalysis>> {
		const analysis = new Map<string, DependencyAnalysis>()
		const files = this.getAllSourceFiles()

		console.log(`🔍 [의존성 분석] ${files.length}개 파일 분석 시작`)

		// 1단계: 각 파일의 기본 정보 수집
		for (const file of files) {
			try {
				const content = readFileSync(file, 'utf-8')
				const fileAnalysis = this.analyzeFile(file, content)
				analysis.set(file, fileAnalysis)
			} catch (error) {
				console.error(`파일 분석 실패: ${file}`, error)
			}
		}

		// 2단계: 의존성 관계 분석
		for (const [filePath, fileAnalysis] of analysis) {
			fileAnalysis.dependencies = this.findDependencies(filePath, analysis)
			fileAnalysis.dependents = this.findDependents(filePath, analysis)
			fileAnalysis.riskLevel = this.calculateRiskLevel(fileAnalysis)
		}

		// 3단계: 변경 영향도 분석
		for (const [filePath, fileAnalysis] of analysis) {
			fileAnalysis.changeImpact = this.calculateChangeImpact(filePath, fileAnalysis, analysis)
		}

		console.log(`✅ [의존성 분석] 완료 - ${analysis.size}개 파일 분석`)
		return analysis
	}

	/**
	 * 특정 파일의 의존성 분석
	 */
	static analyzeFileDependencies(filePath: string): DependencyAnalysis | null {
		try {
			const content = readFileSync(filePath, 'utf-8')
			return this.analyzeFile(filePath, content)
		} catch (error) {
			console.error(`파일 분석 실패: ${filePath}`, error)
			return null
		}
	}

	/**
	 * 변경 영향도 예측
	 */
	static predictChangeImpact(
		filePath: string,
		changeType: 'modify' | 'delete' | 'rename',
		analysis: Map<string, DependencyAnalysis>
	): ChangeImpact[] {
		const fileAnalysis = analysis.get(filePath)
		if (!fileAnalysis) return []

		const impacts: ChangeImpact[] = []

		// 직접 의존하는 파일들
		for (const dependent of fileAnalysis.dependents) {
			impacts.push({
				affectedFile: dependent,
				impactType: changeType === 'delete' ? 'breaking' : 'unknown',
				description: `${changeType} 변경으로 인한 직접적 영향`,
				severity: changeType === 'delete' ? 'critical' : 'medium'
			})
		}

		// 간접 의존하는 파일들 (2단계)
		for (const dependent of fileAnalysis.dependents) {
			const dependentAnalysis = analysis.get(dependent)
			if (dependentAnalysis) {
				for (const indirectDependent of dependentAnalysis.dependents) {
					impacts.push({
						affectedFile: indirectDependent,
						impactType: 'unknown',
						description: `${changeType} 변경으로 인한 간접적 영향`,
						severity: 'low'
					})
				}
			}
		}

		return impacts
	}

	/**
	 * 안전한 변경 절차 생성
	 */
	static generateSafeChangeProcedure(
		filePath: string,
		changeType: 'modify' | 'delete' | 'rename',
		analysis: Map<string, DependencyAnalysis>
	): {
		procedure: string[]
		risks: string[]
		recommendations: string[]
		affectedFiles: string[]
	} {
		const fileAnalysis = analysis.get(filePath)
		if (!fileAnalysis) {
			return {
				procedure: [],
				risks: ['파일을 찾을 수 없습니다.'],
				recommendations: ['파일 경로를 확인하세요.'],
				affectedFiles: []
			}
		}

		const impacts = this.predictChangeImpact(filePath, changeType, analysis)
		const affectedFiles = [...new Set(impacts.map(impact => impact.affectedFile))]

		const procedure: string[] = []
		const risks: string[] = []
		const recommendations: string[] = []

		// 절차 생성
		procedure.push('1. 변경 전 백업 생성')
		procedure.push('2. 의존성 분석 결과 검토')
		procedure.push('3. 영향받는 파일들 식별')
		procedure.push('4. 단계별 변경 실행')
		procedure.push('5. 변경 후 검증')

		// 위험 요소 식별
		if (fileAnalysis.riskLevel === 'critical' || fileAnalysis.riskLevel === 'high') {
			risks.push('높은 위험도 파일 - 신중한 변경 필요')
		}

		if (affectedFiles.length > 10) {
			risks.push('많은 파일에 영향 - 광범위한 테스트 필요')
		}

		if (impacts.some(impact => impact.impactType === 'breaking')) {
			risks.push('Breaking Change 감지 - 하위 호환성 문제 가능')
		}

		// 권장사항
		if (changeType === 'delete') {
			recommendations.push('삭제 전 모든 참조 제거')
			recommendations.push('대체 방안 마련')
		}

		if (changeType === 'rename') {
			recommendations.push('단계적 이름 변경 (별칭 유지)')
			recommendations.push('모든 참조 업데이트')
		}

		if (changeType === 'modify') {
			recommendations.push('하위 호환성 유지')
			recommendations.push('API 변경 시 버전 관리')
		}

		recommendations.push('변경 후 전체 테스트 실행')
		recommendations.push('문서 업데이트')

		return {
			procedure,
			risks,
			recommendations,
			affectedFiles
		}
	}

	/**
	 * 모든 소스 파일 목록 가져오기
	 */
	private static getAllSourceFiles(): string[] {
		const files: string[] = []

		try {
			const scanDirectory = (dir: string) => {
				if (!statSync(dir).isDirectory()) {
					return
				}

				const items = readdirSync(dir)

				for (const item of items) {
					const fullPath = join(dir, item)

					try {
						const stat = statSync(fullPath)

						if (stat.isDirectory()) {
							if (!this.IGNORE_PATTERNS.some(pattern => item.includes(pattern))) {
								scanDirectory(fullPath)
							}
						} else if (stat.isFile()) {
							const ext = extname(item)
							if (this.SUPPORTED_EXTENSIONS.includes(ext)) {
								files.push(fullPath)
							}
						}
					} catch (error) {
						// 개별 파일/디렉토리 접근 실패는 무시
						console.warn(`파일 접근 실패: ${fullPath}`)
					}
				}
			}

			scanDirectory(this.SRC_DIR)
		} catch (error) {
			console.error('소스 디렉토리 스캔 실패:', error)
		}

		return files
	}

	/**
	 * 파일 분석
	 */
	private static analyzeFile(filePath: string, content: string): DependencyAnalysis {
		const imports = this.extractImports(content)
		const exports = this.extractExports(content)

		return {
			filePath,
			dependencies: [],
			dependents: [],
			imports,
			exports,
			usage: [],
			riskLevel: 'low',
			changeImpact: []
		}
	}

	/**
	 * Import 정보 추출
	 */
	private static extractImports(content: string): ImportInfo[] {
		const imports: ImportInfo[] = []
		const lines = content.split('\n')

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim()

			// ES6 import
			const es6Match = line.match(
				/^import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/
			)
			if (es6Match) {
				imports.push({
					path: es6Match[1],
					type: this.getImportType(es6Match[1]),
					importedItems: this.extractImportedItems(line),
					lineNumber: i + 1
				})
			}

			// CommonJS require
			const requireMatch = line.match(/require\(['"]([^'"]+)['"]\)/)
			if (requireMatch) {
				imports.push({
					path: requireMatch[1],
					type: this.getImportType(requireMatch[1]),
					importedItems: [],
					lineNumber: i + 1
				})
			}
		}

		return imports
	}

	/**
	 * Export 정보 추출
	 */
	private static extractExports(content: string): ExportInfo[] {
		const exports: ExportInfo[] = []
		const lines = content.split('\n')

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim()

			// Named export
			const namedExportMatch = line.match(
				/^export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/
			)
			if (namedExportMatch) {
				exports.push({
					name: namedExportMatch[1],
					type: this.getExportType(line),
					lineNumber: i + 1,
					isDefault: false
				})
			}

			// Default export
			const defaultExportMatch = line.match(/^export\s+default\s+(\w+)/)
			if (defaultExportMatch) {
				exports.push({
					name: defaultExportMatch[1],
					type: this.getExportType(line),
					lineNumber: i + 1,
					isDefault: true
				})
			}
		}

		return exports
	}

	/**
	 * 의존성 찾기
	 */
	private static findDependencies(
		filePath: string,
		analysis: Map<string, DependencyAnalysis>
	): string[] {
		const fileAnalysis = analysis.get(filePath)
		if (!fileAnalysis) return []

		const dependencies: string[] = []

		for (const importInfo of fileAnalysis.imports) {
			if (importInfo.type === 'relative') {
				const resolvedPath = this.resolveImportPath(filePath, importInfo.path)
				if (resolvedPath && analysis.has(resolvedPath)) {
					dependencies.push(resolvedPath)
				}
			}
		}

		return dependencies
	}

	/**
	 * 의존하는 파일들 찾기
	 */
	private static findDependents(
		filePath: string,
		analysis: Map<string, DependencyAnalysis>
	): string[] {
		const dependents: string[] = []

		for (const [otherFilePath, otherAnalysis] of analysis) {
			if (otherFilePath === filePath) continue

			const dependencies = this.findDependencies(otherFilePath, analysis)
			if (dependencies.includes(filePath)) {
				dependents.push(otherFilePath)
			}
		}

		return dependents
	}

	/**
	 * 위험도 계산
	 */
	private static calculateRiskLevel(
		analysis: DependencyAnalysis
	): 'low' | 'medium' | 'high' | 'critical' {
		let riskScore = 0

		// 의존하는 파일 수
		riskScore += analysis.dependencies.length * 1

		// 의존하는 파일 수
		riskScore += analysis.dependents.length * 2

		// Export 수
		riskScore += analysis.exports.length * 1

		// 글로벌 유틸리티 파일인지 확인
		if (analysis.filePath.includes('/utils/') || analysis.filePath.includes('/lib/')) {
			riskScore += 5
		}

		// API 파일인지 확인
		if (analysis.filePath.includes('/api/')) {
			riskScore += 3
		}

		if (riskScore >= 20) return 'critical'
		if (riskScore >= 15) return 'high'
		if (riskScore >= 10) return 'medium'
		return 'low'
	}

	/**
	 * 변경 영향도 계산
	 */
	private static calculateChangeImpact(
		filePath: string,
		analysis: DependencyAnalysis,
		allAnalysis: Map<string, DependencyAnalysis>
	): ChangeImpact[] {
		const impacts: ChangeImpact[] = []

		for (const dependent of analysis.dependents) {
			impacts.push({
				affectedFile: dependent,
				impactType: 'unknown',
				description: '직접 의존성으로 인한 영향',
				severity: analysis.riskLevel === 'critical' ? 'high' : 'medium'
			})
		}

		return impacts
	}

	/**
	 * Import 타입 결정
	 */
	private static getImportType(path: string): 'relative' | 'absolute' | 'package' {
		if (path.startsWith('.')) return 'relative'
		if (path.startsWith('/')) return 'absolute'
		return 'package'
	}

	/**
	 * Export 타입 결정
	 */
	private static getExportType(line: string): ExportInfo['type'] {
		if (line.includes('function')) return 'function'
		if (line.includes('class')) return 'class'
		if (line.includes('interface')) return 'interface'
		if (line.includes('type')) return 'type'
		if (line.includes('const')) return 'const'
		if (line.includes('let')) return 'let'
		return 'var'
	}

	/**
	 * Import된 항목들 추출
	 */
	private static extractImportedItems(line: string): string[] {
		const items: string[] = []

		// Named imports: import { a, b, c } from '...'
		const namedMatch = line.match(/import\s+{([^}]+)}\s+from/)
		if (namedMatch) {
			const namedItems = namedMatch[1].split(',').map(item => item.trim())
			items.push(...namedItems)
		}

		// Default import: import defaultName from '...'
		const defaultMatch = line.match(/import\s+(\w+)\s+from/)
		if (defaultMatch && !line.includes('{')) {
			items.push(defaultMatch[1])
		}

		// Namespace import: import * as name from '...'
		const namespaceMatch = line.match(/import\s+\*\s+as\s+(\w+)\s+from/)
		if (namespaceMatch) {
			items.push(namespaceMatch[1])
		}

		return items
	}

	/**
	 * Import 경로 해결
	 */
	private static resolveImportPath(filePath: string, importPath: string): string | null {
		// 상대 경로 해결 로직
		// 실제 구현에서는 path.resolve 등을 사용
		return null
	}
}
