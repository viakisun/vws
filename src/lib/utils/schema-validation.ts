import { Pool } from 'pg'

// 데이터베이스 연결 풀
const pool = new Pool({
	host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
	port: 5432,
	database: 'postgres',
	user: 'postgres',
	password: 'viahubdev',
	ssl: { rejectUnauthorized: false }
})

// 스키마 검증 결과 타입
export interface SchemaValidationResult {
	isValid: boolean
	tableName: string
	columnName: string
	expectedType: string
	actualType: string
	issues: string[]
	message: string
}

// 칼럼명 규칙 정의
export interface ColumnRule {
	tableName: string
	columnName: string
	expectedType: string
	required: boolean
	description: string
	examples?: string[]
}

// 스키마 검증 유틸리티 클래스
export class SchemaValidator {
	// 프로젝트 관리 관련 테이블 스키마 규칙
	private static readonly PROJECT_SCHEMA_RULES: ColumnRule[] = [
		// projects 테이블
		{
			tableName: 'projects',
			columnName: 'id',
			expectedType: 'uuid',
			required: true,
			description: '프로젝트 고유 식별자'
		},
		{
			tableName: 'projects',
			columnName: 'title',
			expectedType: 'character varying',
			required: true,
			description: '프로젝트 제목'
		},
		{
			tableName: 'projects',
			columnName: 'budget_total',
			expectedType: 'numeric',
			required: false,
			description: '프로젝트 총 예산'
		},
		{
			tableName: 'projects',
			columnName: 'start_date',
			expectedType: 'date',
			required: true,
			description: '프로젝트 시작일'
		},
		{
			tableName: 'projects',
			columnName: 'end_date',
			expectedType: 'date',
			required: true,
			description: '프로젝트 종료일'
		},
		{
			tableName: 'projects',
			columnName: 'status',
			expectedType: 'character varying',
			required: false,
			description: '프로젝트 상태'
		},

		// project_budgets 테이블
		{
			tableName: 'project_budgets',
			columnName: 'id',
			expectedType: 'uuid',
			required: true,
			description: '예산 고유 식별자'
		},
		{
			tableName: 'project_budgets',
			columnName: 'project_id',
			expectedType: 'uuid',
			required: true,
			description: '프로젝트 ID (외래키)'
		},
		{
			tableName: 'project_budgets',
			columnName: 'period_number',
			expectedType: 'integer',
			required: true,
			description: '연차 번호'
		},
		{
			tableName: 'project_budgets',
			columnName: 'fiscal_year',
			expectedType: 'integer',
			required: true,
			description: '회계연도'
		},
		{
			tableName: 'project_budgets',
			columnName: 'start_date',
			expectedType: 'date',
			required: true,
			description: '연차 시작일'
		},
		{
			tableName: 'project_budgets',
			columnName: 'end_date',
			expectedType: 'date',
			required: true,
			description: '연차 종료일'
		},
		{
			tableName: 'project_budgets',
			columnName: 'total_budget',
			expectedType: 'numeric',
			required: true,
			description: '연차 총 예산'
		},
		{
			tableName: 'project_budgets',
			columnName: 'personnel_cost',
			expectedType: 'numeric',
			required: false,
			description: '인건비'
		},
		{
			tableName: 'project_budgets',
			columnName: 'research_material_cost',
			expectedType: 'numeric',
			required: false,
			description: '연구재료비'
		},
		{
			tableName: 'project_budgets',
			columnName: 'research_activity_cost',
			expectedType: 'numeric',
			required: false,
			description: '연구활동비'
		},
		{
			tableName: 'project_budgets',
			columnName: 'indirect_cost',
			expectedType: 'numeric',
			required: false,
			description: '간접비'
		},
		{
			tableName: 'project_budgets',
			columnName: 'spent_amount',
			expectedType: 'numeric',
			required: false,
			description: '집행액'
		},

		// project_members 테이블
		{
			tableName: 'project_members',
			columnName: 'id',
			expectedType: 'uuid',
			required: true,
			description: '참여연구원 고유 식별자'
		},
		{
			tableName: 'project_members',
			columnName: 'project_id',
			expectedType: 'uuid',
			required: true,
			description: '프로젝트 ID (외래키)'
		},
		{
			tableName: 'project_members',
			columnName: 'employee_id',
			expectedType: 'uuid',
			required: true,
			description: '직원 ID (외래키)'
		},
		{
			tableName: 'project_members',
			columnName: 'role',
			expectedType: 'character varying',
			required: true,
			description: '참여 역할'
		},
		{
			tableName: 'project_members',
			columnName: 'participation_rate',
			expectedType: 'numeric',
			required: true,
			description: '참여율 (%)'
		},
		{
			tableName: 'project_members',
			columnName: 'monthly_amount',
			expectedType: 'numeric',
			required: true,
			description: '월 급여액'
		},
		{
			tableName: 'project_members',
			columnName: 'start_date',
			expectedType: 'date',
			required: true,
			description: '참여 시작일'
		},
		{
			tableName: 'project_members',
			columnName: 'end_date',
			expectedType: 'date',
			required: true,
			description: '참여 종료일'
		},

		// employees 테이블
		{
			tableName: 'employees',
			columnName: 'id',
			expectedType: 'uuid',
			required: true,
			description: '직원 고유 식별자'
		},
		{
			tableName: 'employees',
			columnName: 'first_name',
			expectedType: 'character varying',
			required: true,
			description: '이름'
		},
		{
			tableName: 'employees',
			columnName: 'last_name',
			expectedType: 'character varying',
			required: true,
			description: '성'
		},
		{
			tableName: 'employees',
			columnName: 'hire_date',
			expectedType: 'date',
			required: false,
			description: '입사일'
		},
		{
			tableName: 'employees',
			columnName: 'termination_date',
			expectedType: 'date',
			required: false,
			description: '퇴사일'
		},
		{
			tableName: 'employees',
			columnName: 'status',
			expectedType: 'character varying',
			required: false,
			description: '재직 상태'
		},

		// evidence_items 테이블
		{
			tableName: 'evidence_items',
			columnName: 'id',
			expectedType: 'uuid',
			required: true,
			description: '증빙 항목 고유 식별자'
		},
		{
			tableName: 'evidence_items',
			columnName: 'project_budget_id',
			expectedType: 'uuid',
			required: true,
			description: '프로젝트 예산 ID (외래키)'
		},
		{
			tableName: 'evidence_items',
			columnName: 'category_id',
			expectedType: 'uuid',
			required: true,
			description: '증빙 카테고리 ID (외래키)'
		},
		{
			tableName: 'evidence_items',
			columnName: 'name',
			expectedType: 'character varying',
			required: true,
			description: '증빙 항목명'
		},
		{
			tableName: 'evidence_items',
			columnName: 'budget_amount',
			expectedType: 'numeric',
			required: false,
			description: '예산 금액'
		},
		{
			tableName: 'evidence_items',
			columnName: 'spent_amount',
			expectedType: 'numeric',
			required: false,
			description: '집행 금액'
		},
		{
			tableName: 'evidence_items',
			columnName: 'assignee_id',
			expectedType: 'uuid',
			required: false,
			description: '담당자 ID (외래키)'
		},
		{
			tableName: 'evidence_items',
			columnName: 'assignee_name',
			expectedType: 'character varying',
			required: false,
			description: '담당자명'
		},
		{
			tableName: 'evidence_items',
			columnName: 'due_date',
			expectedType: 'date',
			required: false,
			description: '마감일'
		}
	]

	/**
	 * 데이터베이스 스키마 검증
	 */
	static async validateDatabaseSchema(): Promise<SchemaValidationResult[]> {
		const results: SchemaValidationResult[] = []

		try {
			// 실제 데이터베이스 스키마 조회
			const actualSchema = await this.getActualDatabaseSchema()

			// 각 테이블별로 검증
			for (const rule of this.PROJECT_SCHEMA_RULES) {
				const actualColumn = actualSchema.find(
					col => col.table_name === rule.tableName && col.column_name === rule.columnName
				)

				if (!actualColumn) {
					// 칼럼이 존재하지 않는 경우
					results.push({
						isValid: false,
						tableName: rule.tableName,
						columnName: rule.columnName,
						expectedType: rule.expectedType,
						actualType: 'NOT_FOUND',
						issues: [`칼럼 '${rule.columnName}'이 테이블 '${rule.tableName}'에 존재하지 않습니다.`],
						message: `필수 칼럼 누락: ${rule.tableName}.${rule.columnName}`
					})
				} else {
					// 칼럼이 존재하는 경우 타입 검증
					const typeMatch = this.compareDataTypes(rule.expectedType, actualColumn.data_type)
					if (!typeMatch) {
						results.push({
							isValid: false,
							tableName: rule.tableName,
							columnName: rule.columnName,
							expectedType: rule.expectedType,
							actualType: actualColumn.data_type,
							issues: [
								`칼럼 '${rule.columnName}'의 데이터 타입이 일치하지 않습니다.`,
								`예상: ${rule.expectedType}, 실제: ${actualColumn.data_type}`
							],
							message: `데이터 타입 불일치: ${rule.tableName}.${rule.columnName}`
						})
					} else {
						// 검증 통과
						results.push({
							isValid: true,
							tableName: rule.tableName,
							columnName: rule.columnName,
							expectedType: rule.expectedType,
							actualType: actualColumn.data_type,
							issues: [],
							message: `검증 통과: ${rule.tableName}.${rule.columnName}`
						})
					}
				}
			}

			return results
		} catch (error) {
			console.error('스키마 검증 중 오류:', error)
			throw error
		}
	}

	/**
	 * 실제 데이터베이스 스키마 조회
	 */
	private static async getActualDatabaseSchema() {
		const result = await pool.query(`
			SELECT 
				table_name,
				column_name,
				data_type,
				is_nullable,
				column_default
			FROM information_schema.columns 
			WHERE table_schema = 'public'
			AND table_name IN ('projects', 'project_budgets', 'project_members', 'employees', 'evidence_items', 'evidence_categories')
			ORDER BY table_name, ordinal_position
		`)

		return result.rows
	}

	/**
	 * 데이터 타입 비교 (유연한 매칭)
	 */
	private static compareDataTypes(expected: string, actual: string): boolean {
		// 정확한 매칭
		if (expected === actual) return true

		// 유연한 매칭 규칙
		const typeMappings: { [key: string]: string[] } = {
			uuid: ['uuid'],
			'character varying': ['character varying', 'varchar', 'text'],
			numeric: ['numeric', 'decimal', 'real', 'double precision'],
			integer: ['integer', 'int4', 'bigint', 'int8'],
			date: ['date', 'timestamp without time zone', 'timestamp with time zone'],
			boolean: ['boolean', 'bool']
		}

		const expectedTypes = typeMappings[expected] || [expected]
		return expectedTypes.includes(actual)
	}

	/**
	 * 칼럼명 일관성 검증
	 */
	static async validateColumnNamingConsistency(): Promise<SchemaValidationResult[]> {
		const results: SchemaValidationResult[] = []

		try {
			// 실제 데이터베이스 스키마 조회
			const actualSchema = await this.getActualDatabaseSchema()

			// 칼럼명 규칙 검증
			for (const column of actualSchema) {
				const issues: string[] = []

				// 1. 소문자 사용 검증
				if (column.column_name !== column.column_name.toLowerCase()) {
					issues.push('칼럼명은 소문자로 작성해야 합니다.')
				}

				// 2. 언더스코어 사용 검증 (camelCase 금지)
				if (column.column_name.includes('-') || /[A-Z]/.test(column.column_name)) {
					issues.push('칼럼명은 언더스코어(_)를 사용해야 합니다. (camelCase 금지)')
				}

				// 3. 예약어 사용 검증
				const reservedWords = ['name', 'type', 'order', 'group', 'user', 'date', 'time']
				if (reservedWords.includes(column.column_name.toLowerCase())) {
					issues.push(`예약어 '${column.column_name}' 사용을 피해야 합니다.`)
				}

				// 4. 외래키 명명 규칙 검증
				if (column.column_name.endsWith('_id') && column.data_type === 'uuid') {
					// 외래키는 테이블명_id 형태여야 함
					const expectedTableName = column.column_name.replace('_id', '')
					if (!expectedTableName || expectedTableName.length < 2) {
						issues.push('외래키 칼럼명은 의미있는 테이블명_id 형태여야 합니다.')
					}
				}

				if (issues.length > 0) {
					results.push({
						isValid: false,
						tableName: column.table_name,
						columnName: column.column_name,
						expectedType: 'naming_convention',
						actualType: column.data_type,
						issues,
						message: `칼럼명 규칙 위반: ${column.table_name}.${column.column_name}`
					})
				} else {
					results.push({
						isValid: true,
						tableName: column.table_name,
						columnName: column.column_name,
						expectedType: 'naming_convention',
						actualType: column.data_type,
						issues: [],
						message: `칼럼명 규칙 준수: ${column.table_name}.${column.column_name}`
					})
				}
			}

			return results
		} catch (error) {
			console.error('칼럼명 일관성 검증 중 오류:', error)
			throw error
		}
	}

	/**
	 * SQL 쿼리에서 칼럼명 검증
	 */
	static validateQueryColumns(query: string, tableName: string): SchemaValidationResult[] {
		const results: SchemaValidationResult[] = []

		try {
			// SELECT, INSERT, UPDATE, DELETE 쿼리에서 칼럼명 추출
			const columnMatches = query.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []
			const tableRules = this.PROJECT_SCHEMA_RULES.filter(rule => rule.tableName === tableName)

			for (const columnName of columnMatches) {
				// SQL 키워드나 함수명 제외
				const sqlKeywords = [
					'SELECT',
					'FROM',
					'WHERE',
					'INSERT',
					'UPDATE',
					'DELETE',
					'INTO',
					'SET',
					'VALUES',
					'AND',
					'OR',
					'NOT',
					'IN',
					'EXISTS',
					'BETWEEN',
					'LIKE',
					'IS',
					'NULL',
					'ORDER',
					'BY',
					'GROUP',
					'HAVING',
					'JOIN',
					'LEFT',
					'RIGHT',
					'INNER',
					'OUTER',
					'ON',
					'AS',
					'ASC',
					'DESC',
					'COUNT',
					'SUM',
					'AVG',
					'MIN',
					'MAX',
					'DISTINCT',
					'CASE',
					'WHEN',
					'THEN',
					'ELSE',
					'END'
				]

				if (sqlKeywords.includes(columnName.toUpperCase())) continue

				// 테이블 규칙에서 해당 칼럼 찾기
				const rule = tableRules.find(r => r.columnName === columnName)
				if (!rule) {
					results.push({
						isValid: false,
						tableName,
						columnName,
						expectedType: 'defined_column',
						actualType: 'undefined',
						issues: [`칼럼 '${columnName}'이 테이블 '${tableName}'에 정의되지 않았습니다.`],
						message: `정의되지 않은 칼럼 사용: ${tableName}.${columnName}`
					})
				}
			}

			return results
		} catch (error) {
			console.error('쿼리 칼럼 검증 중 오류:', error)
			return [
				{
					isValid: false,
					tableName,
					columnName: 'query_parsing',
					expectedType: 'valid_query',
					actualType: 'error',
					issues: [`쿼리 파싱 오류: ${error instanceof Error ? error.message : 'Unknown error'}`],
					message: '쿼리 파싱 실패'
				}
			]
		}
	}

	/**
	 * 스키마 규칙 추가
	 */
	static addSchemaRule(rule: ColumnRule): void {
		const existingIndex = this.PROJECT_SCHEMA_RULES.findIndex(
			r => r.tableName === rule.tableName && r.columnName === rule.columnName
		)

		if (existingIndex >= 0) {
			this.PROJECT_SCHEMA_RULES[existingIndex] = rule
		} else {
			this.PROJECT_SCHEMA_RULES.push(rule)
		}
	}

	/**
	 * 스키마 규칙 조회
	 */
	static getSchemaRules(): ColumnRule[] {
		return [...this.PROJECT_SCHEMA_RULES]
	}

	/**
	 * 특정 테이블의 스키마 규칙 조회
	 */
	static getTableSchemaRules(tableName: string): ColumnRule[] {
		return this.PROJECT_SCHEMA_RULES.filter(rule => rule.tableName === tableName)
	}
}

export { pool }




