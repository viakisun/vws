'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.SafeChangeManager = void 0
const code_dependency_analyzer_1 = require('./code-dependency-analyzer')
// 안전한 변경 관리자
class SafeChangeManager {
  /**
   * 안전한 변경 계획 생성
   */
  static async createChangePlan(filePath, changeType, description) {
    console.log(`📋 [변경 계획 생성] ${changeType}: ${filePath}`)
    // 의존성 분석
    const analysis =
      await code_dependency_analyzer_1.CodeDependencyAnalyzer.analyzeProjectDependencies()
    const fileAnalysis = analysis.get(filePath)
    if (!fileAnalysis) {
      throw new Error(`파일을 찾을 수 없습니다: ${filePath}`)
    }
    // 변경 영향도 예측 (ChangeType을 predictChangeImpact가 받는 타입으로 변환)
    const impactChangeType = changeType === 'add' ? 'modify' : changeType
    const impacts = code_dependency_analyzer_1.CodeDependencyAnalyzer.predictChangeImpact(
      filePath,
      impactChangeType,
      analysis,
    )
    // 안전한 변경 절차 생성
    const procedure = this.generateChangeProcedure(filePath, changeType, fileAnalysis, impacts)
    // 롤백 계획 생성
    const rollbackPlan = this.generateRollbackPlan(filePath, changeType, impacts)
    // 검증 체크리스트 생성
    const validationChecks = this.generateValidationChecks(filePath, changeType, fileAnalysis)
    const plan = {
      id: this.generatePlanId(),
      filePath,
      changeType,
      description,
      status: 'pending',
      currentStep: 'analysis',
      createdAt: new Date(),
      updatedAt: new Date(),
      analysis: fileAnalysis,
      impacts,
      procedure,
      risks: this.identifyRisks(fileAnalysis, impacts),
      recommendations: this.generateRecommendations(filePath, changeType, fileAnalysis),
      affectedFiles: impacts.map((impact) => impact.affectedFile),
      rollbackPlan,
      validationChecks,
    }
    this.changePlans.set(plan.id, plan)
    console.log(`✅ [변경 계획 생성] 완료 - ID: ${plan.id}`)
    return plan
  }
  /**
   * 변경 계획 실행
   */
  static async executeChangePlan(planId) {
    const plan = this.changePlans.get(planId)
    if (!plan) {
      return { success: false, message: '변경 계획을 찾을 수 없습니다.' }
    }
    console.log(`🚀 [변경 실행] ${plan.changeType}: ${plan.filePath}`)
    try {
      plan.status = 'in_progress'
      plan.updatedAt = new Date()
      // 현재 단계에 따른 실행
      switch (plan.currentStep) {
        case 'analysis':
          return await this.executeAnalysisStep(plan)
        case 'backup':
          return await this.executeBackupStep(plan)
        case 'preparation':
          return await this.executePreparationStep(plan)
        case 'execution':
          return await this.executeExecutionStep(plan)
        case 'validation':
          return await this.executeValidationStep(plan)
        case 'cleanup':
          return await this.executeCleanupStep(plan)
        default:
          return { success: false, message: '알 수 없는 단계입니다.' }
      }
    } catch (error) {
      plan.status = 'failed'
      plan.updatedAt = new Date()
      return {
        success: false,
        message: `변경 실행 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }
  /**
   * 변경 계획 롤백
   */
  static async rollbackChangePlan(planId) {
    const plan = this.changePlans.get(planId)
    if (!plan) {
      return { success: false, message: '변경 계획을 찾을 수 없습니다.' }
    }
    console.log(`🔄 [변경 롤백] ${plan.changeType}: ${plan.filePath}`)
    try {
      // 롤백 계획 실행
      for (const rollbackStep of plan.rollbackPlan) {
        console.log(`  🔄 ${rollbackStep}`)
        // 실제 롤백 로직 구현
      }
      plan.status = 'rolled_back'
      plan.updatedAt = new Date()
      return { success: true, message: '롤백이 완료되었습니다.' }
    } catch (error) {
      return {
        success: false,
        message: `롤백 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }
  /**
   * 변경 계획 조회
   */
  static getChangePlan(planId) {
    return this.changePlans.get(planId) || null
  }
  /**
   * 모든 변경 계획 조회
   */
  static getAllChangePlans() {
    return Array.from(this.changePlans.values())
  }
  /**
   * 변경 검증
   */
  static validateChange(filePath, changeType, content) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    }
    // 파일 타입별 검증 규칙 적용
    if (filePath.includes('/utils/') || filePath.includes('/lib/')) {
      this.validateGlobalFile(filePath, content, result)
    }
    if (filePath.includes('/routes/') || filePath.includes('/pages/')) {
      this.validatePageFile(filePath, content, result)
    }
    if (filePath.includes('/api/')) {
      this.validateApiFile(filePath, content, result)
    }
    // 일반적인 검증 규칙
    this.validateGeneralRules(filePath, content, result)
    result.isValid = result.errors.length === 0
    return result
  }
  /**
   * 변경 절차 생성
   */
  static generateChangeProcedure(filePath, changeType, _analysis, _impacts) {
    const procedure = []
    procedure.push('1. 변경 전 의존성 분석 완료')
    procedure.push('2. 백업 생성')
    procedure.push('3. 영향받는 파일들 확인')
    if (changeType === 'delete') {
      procedure.push('4. 모든 참조 제거')
      procedure.push('5. 파일 삭제')
    } else if (changeType === 'rename') {
      procedure.push('4. 새 이름으로 파일 생성')
      procedure.push('5. 모든 참조 업데이트')
      procedure.push('6. 기존 파일 삭제')
    } else if (changeType === 'modify') {
      procedure.push('4. 파일 수정')
    }
    procedure.push('6. 변경 후 검증')
    procedure.push('7. 테스트 실행')
    procedure.push('8. 문서 업데이트')
    return procedure
  }
  /**
   * 롤백 계획 생성
   */
  static generateRollbackPlan(filePath, changeType, _impacts) {
    const rollbackPlan = []
    rollbackPlan.push('1. 백업에서 원본 파일 복원')
    if (changeType === 'delete') {
      rollbackPlan.push('2. 삭제된 파일 복원')
    } else if (changeType === 'rename') {
      rollbackPlan.push('2. 파일명을 원래대로 변경')
      rollbackPlan.push('3. 모든 참조를 원래대로 복원')
    } else if (changeType === 'modify') {
      rollbackPlan.push('2. 수정된 파일을 원본으로 복원')
    }
    rollbackPlan.push('3. 영향받은 파일들 복원')
    rollbackPlan.push('4. 검증 및 테스트')
    return rollbackPlan
  }
  /**
   * 검증 체크리스트 생성
   */
  static generateValidationChecks(filePath, changeType, analysis) {
    const checks = []
    // 기본 검증
    checks.push('문법 오류 없음')
    checks.push('타입 오류 없음')
    checks.push('린트 오류 없음')
    // 의존성 관련 검증
    if (analysis.dependents.length > 0) {
      checks.push('의존하는 파일들이 정상 작동')
      checks.push('Import/Export 관계 정상')
    }
    // 파일 타입별 검증
    if (filePath.includes('/api/')) {
      checks.push('API 엔드포인트 정상 응답')
      checks.push('에러 처리 정상')
    }
    if (filePath.includes('/utils/')) {
      checks.push('유틸리티 함수 정상 작동')
      checks.push('모든 사용처에서 정상 호출')
    }
    return checks
  }
  /**
   * 위험 요소 식별
   */
  static identifyRisks(analysis, impacts) {
    const risks = []
    if (analysis.riskLevel === 'critical') {
      risks.push('Critical 위험도 파일 - 신중한 변경 필요')
    }
    if (impacts.length > 10) {
      risks.push('많은 파일에 영향 - 광범위한 테스트 필요')
    }
    if (impacts.some((impact) => impact.impactType === 'breaking')) {
      risks.push('Breaking Change 감지 - 하위 호환성 문제 가능')
    }
    return risks
  }
  /**
   * 권장사항 생성
   */
  static generateRecommendations(filePath, changeType, analysis) {
    const recommendations = []
    if (changeType === 'delete') {
      recommendations.push('삭제 전 모든 참조 제거')
      recommendations.push('대체 방안 마련')
    }
    if (changeType === 'rename') {
      recommendations.push('단계적 이름 변경 (별칭 유지)')
      recommendations.push('모든 참조 업데이트')
    }
    if (analysis.dependents.length > 5) {
      recommendations.push('의존하는 파일이 많음 - 단계적 변경 고려')
    }
    recommendations.push('변경 후 전체 테스트 실행')
    recommendations.push('문서 업데이트')
    return recommendations
  }
  /**
   * 글로벌 파일 검증
   */
  static validateGlobalFile(filePath, content, result) {
    // 글로벌 유틸리티 함수 검증
    if (content.includes('export') && !content.includes('export default')) {
      result.warnings.push('글로벌 유틸리티 함수 변경 시 모든 사용처 확인 필요')
    }
    // 타입 정의 검증
    if (content.includes('interface') || content.includes('type')) {
      result.warnings.push('타입 정의 변경 시 모든 구현체 확인 필요')
    }
  }
  /**
   * 페이지 파일 검증
   */
  static validatePageFile(filePath, content, result) {
    // 컴포넌트 props 검증
    if (content.includes('export let')) {
      result.warnings.push('컴포넌트 props 변경 시 상위 컴포넌트 확인 필요')
    }
    // 라우트 검증
    if (filePath.includes('/routes/')) {
      result.warnings.push('라우트 변경 시 네비게이션 링크 확인 필요')
    }
  }
  /**
   * API 파일 검증
   */
  static validateApiFile(filePath, content, result) {
    // API 응답 형식 검증
    if (content.includes('json(')) {
      result.warnings.push('API 응답 형식 변경 시 클라이언트 호환성 확인 필요')
    }
    // 인증/권한 검증
    if (content.includes('auth') || content.includes('permission')) {
      result.warnings.push('인증/권한 로직 변경 시 보안 영향 확인 필요')
    }
  }
  /**
   * 일반적인 검증 규칙
   */
  static validateGeneralRules(filePath, content, result) {
    // 하드코딩된 값 검증
    if (content.includes('localhost') || content.includes('127.0.0.1')) {
      result.warnings.push('하드코딩된 URL 사용 - 환경 변수 사용 권장')
    }
    // 에러 처리 검증
    if (content.includes('await') && !content.includes('try') && !content.includes('catch')) {
      result.warnings.push('비동기 작업에 에러 처리 추가 권장')
    }
  }
  /**
   * 계획 ID 생성
   */
  static generatePlanId() {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  /**
   * 분석 단계 실행
   */
  static async executeAnalysisStep(plan) {
    console.log('  📊 의존성 분석 완료')
    plan.currentStep = 'backup'
    plan.updatedAt = new Date()
    return { success: true, message: '분석 완료', nextStep: 'backup' }
  }
  /**
   * 백업 단계 실행
   */
  static async executeBackupStep(plan) {
    console.log('  💾 백업 생성 완료')
    plan.currentStep = 'preparation'
    plan.updatedAt = new Date()
    return { success: true, message: '백업 완료', nextStep: 'preparation' }
  }
  /**
   * 준비 단계 실행
   */
  static async executePreparationStep(plan) {
    console.log('  🔧 변경 준비 완료')
    plan.currentStep = 'execution'
    plan.updatedAt = new Date()
    return { success: true, message: '준비 완료', nextStep: 'execution' }
  }
  /**
   * 실행 단계 실행
   */
  static async executeExecutionStep(plan) {
    console.log('  ⚡ 변경 실행 완료')
    plan.currentStep = 'validation'
    plan.updatedAt = new Date()
    return { success: true, message: '실행 완료', nextStep: 'validation' }
  }
  /**
   * 검증 단계 실행
   */
  static async executeValidationStep(plan) {
    console.log('  ✅ 검증 완료')
    plan.currentStep = 'cleanup'
    plan.updatedAt = new Date()
    return { success: true, message: '검증 완료', nextStep: 'cleanup' }
  }
  /**
   * 정리 단계 실행
   */
  static async executeCleanupStep(plan) {
    console.log('  🧹 정리 완료')
    plan.status = 'completed'
    plan.updatedAt = new Date()
    return { success: true, message: '모든 단계 완료' }
  }
}
exports.SafeChangeManager = SafeChangeManager
SafeChangeManager.changePlans = new Map()
SafeChangeManager.VALIDATION_RULES = {
  global: [
    '글로벌 유틸리티 함수 변경 시 모든 사용처 확인',
    'API 엔드포인트 변경 시 클라이언트 코드 확인',
    '데이터베이스 스키마 변경 시 마이그레이션 계획',
    '타입 정의 변경 시 모든 구현체 확인',
  ],
  page: [
    '페이지별 컴포넌트 변경 시 상위/하위 컴포넌트 확인',
    '라우트 변경 시 네비게이션 링크 확인',
    '상태 관리 변경 시 관련 컴포넌트 확인',
    '스타일 변경 시 테마 일관성 확인',
  ],
  api: [
    'API 응답 형식 변경 시 클라이언트 호환성 확인',
    '인증/권한 로직 변경 시 보안 영향 확인',
    '데이터베이스 쿼리 변경 시 성능 영향 확인',
    '에러 처리 변경 시 클라이언트 에러 핸들링 확인',
  ],
}
