import { writable } from 'svelte/store'
import type { AuditLog, Person } from './types'
import { logger } from '$lib/utils/logger';

// 감사 로그 관리
export const auditLogs = writable<AuditLog[]>([])
export const securityPolicies = writable<Record<string, unknown>>({})
export const accessControl = writable<Record<string, unknown>>({})

// 감사 로그 생성
export function createAuditLog(
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  oldData: any,
  newData: any,
  metadata?: Record<string, unknown>
): string {
  const auditLog: AuditLog = {
    id: crypto.randomUUID(),
    actorId,
    action,
    entity,
    entityId,
    diff: { old: oldData, new: newData },
    at: new Date().toISOString()
  }

  // 메타데이터 추가
  if (metadata) {
    auditLog.metadata = metadata
  }

  auditLogs.update(logs => [...logs, auditLog])

  return auditLog.id
}

// 감사 로그 조회
export function getAuditLogs(filters?: {
  actorId?: string
  entity?: string
  entityId?: string
  action?: string
  startDate?: string
  endDate?: string
}): AuditLog[] {
  let filteredLogs: AuditLog[] = []

  auditLogs.subscribe(logs => {
    filteredLogs = logs.filter(log => {
      if (filters?.actorId && log.actorId !== filters.actorId) return false
      if (filters?.entity && log.entity !== filters.entity) return false
      if (filters?.entityId && log.entityId !== filters.entityId) return false
      if (filters?.action && log.action !== filters.action) return false
      if (filters?.startDate && log.at < filters.startDate) return false
      if (filters?.endDate && log.at > filters.endDate) return false
      return true
    })
  })()

  return filteredLogs.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

// 엔티티별 감사 로그 조회
export function getEntityAuditTrail(entity: string, entityId: string): AuditLog[] {
  return getAuditLogs({ entity, entityId })
}

// 사용자별 감사 로그 조회
export function getUserAuditTrail(actorId: string): AuditLog[] {
  return getAuditLogs({ actorId })
}

// 보안 정책 정의
export function defineSecurityPolicies(): void {
  const policies = {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90, // days
      historyCount: 5
    },
    session: {
      timeout: 30, // minutes
      maxConcurrent: 3,
      requireReauth: ['sensitive_operations']
    },
    access: {
      ipWhitelist: [],
      ipBlacklist: [],
      requireMFA: ['admin_operations', 'financial_operations'],
      auditLevel: 'detailed'
    },
    data: {
      encryption: {
        atRest: true,
        inTransit: true,
        algorithm: 'AES-256'
      },
      retention: {
        auditLogs: 2555, // 7 years in days
        documents: 1095, // 3 years in days
        backups: 365 // 1 year in days
      },
      anonymization: {
        enabled: true,
        fields: ['ssn', 'personal_id', 'bank_account']
      }
    }
  }

  securityPolicies.set(policies)
}

// 접근 제어 정책 정의
export function defineAccessControlPolicies(): void {
  const policies: Record<string, unknown> = {
    roles: {
      R1: {
        // 연구원
        permissions: ['read_own_data', 'create_research_notes', 'upload_documents'],
        restrictions: ['financial_data', 'personnel_data', 'audit_logs']
      },
      R2: {
        // PM
        permissions: ['read_project_data', 'approve_expenses', 'manage_milestones'],
        restrictions: ['financial_data', 'audit_logs']
      },
      R3: {
        // 담당부서
        permissions: ['read_department_data', 'process_expenses', 'manage_documents'],
        restrictions: ['personnel_data', 'audit_logs']
      },
      R4: {
        // 경영지원
        permissions: ['read_financial_data', 'manage_budgets', 'create_bundles'],
        restrictions: ['audit_logs']
      },
      R5: {
        // 연구소장
        permissions: ['read_all_data', 'approve_major_decisions', 'manage_personnel'],
        restrictions: []
      },
      R6: {
        // 경영진
        permissions: ['read_all_data', 'manage_all_resources', 'view_audit_logs'],
        restrictions: []
      },
      R7: {
        // 감사
        permissions: ['read_audit_logs', 'view_all_data', 'export_data'],
        restrictions: ['modify_data']
      }
    },
    dataClassification: {
      public: ['project_titles', 'public_milestones'],
      internal: ['project_details', 'budget_summaries', 'personnel_summaries'],
      confidential: ['financial_details', 'personnel_details', 'research_data'],
      restricted: ['audit_logs', 'security_data', 'personal_identifiers']
    }
  }

  accessControl.set(policies)
}

// 접근 권한 검증
export function checkAccessPermission(
  userId: string,
  resource: string,
  action: string,
  context?: any
): {
  allowed: boolean
  reason?: string
  auditRequired: boolean
} {
  // 1. 사용자 역할 확인
  const user = getUserById(userId)
  if (!user) {
    return { allowed: false, reason: 'User not found', auditRequired: true }
  }

  // 2. 역할별 권한 확인
  const rolePermissions = getRolePermissions(user.roleSet)
  if (!rolePermissions.includes(action)) {
    return { allowed: false, reason: 'Insufficient permissions', auditRequired: true }
  }

  // 3. 데이터 분류 확인
  const dataClassification = getDataClassification(resource)
  if (
    dataClassification === 'restricted' &&
    !user.roleSet.includes('R6') &&
    !user.roleSet.includes('R7')
  ) {
    return { allowed: false, reason: 'Restricted data access', auditRequired: true }
  }

  // 4. 컨텍스트 기반 검증
  if (context) {
    const contextCheck = validateContext(user, resource, action, context)
    if (!contextCheck.allowed) {
      return { allowed: false, reason: contextCheck.reason, auditRequired: true }
    }
  }

  // 5. MFA 요구사항 확인
  const mfaRequired = isMFARequired(action)
  if (mfaRequired && !context?.mfaVerified) {
    return { allowed: false, reason: 'MFA required', auditRequired: false }
  }

  return { allowed: true, auditRequired: true }
}

// 사용자 ID로 사용자 정보 가져오기
function getUserById(userId: string): Person | null {
  // 실제 구현에서는 사용자 스토어에서 가져옴
  return {
    id: userId,
    name: 'Test User',
    email: 'test@example.com',
    department: 'Test Department',
    roleSet: ['R1'],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// 역할별 권한 가져오기
function getRolePermissions(roleSet: string[]): string[] {
  let permissions: string[] = []

  accessControl.subscribe(policies => {
    roleSet.forEach(role => {
      const rolePolicy = (policies as any).roles?.[role]
      if (rolePolicy) {
        permissions = [...permissions, ...rolePolicy.permissions]
      }
    })
  })()

  return [...new Set(permissions)] // 중복 제거
}

// 데이터 분류 가져오기
function getDataClassification(resource: string): string {
  let classification = 'public'

  accessControl.subscribe(policies => {
    Object.entries((policies as any).dataClassification || {}).forEach(([level, resources]) => {
      if (Array.isArray(resources) && resources.includes(resource)) {
        classification = level
      }
    })
  })()

  return classification
}

// 컨텍스트 기반 검증
function validateContext(
  user: Person,
  resource: string,
  action: string,
  context: any
): { allowed: boolean; reason?: string } {
  // 1. 소유권 확인
  if (context.ownerId && context.ownerId !== user.id) {
    // 소유자가 아닌 경우 추가 권한 확인
    if (!user.roleSet.includes('R5') && !user.roleSet.includes('R6')) {
      return { allowed: false, reason: 'Not owner and insufficient role' }
    }
  }

  // 2. 프로젝트 접근 권한 확인
  if (context.projectId) {
    const hasProjectAccess = checkProjectAccess(user.id, context.projectId)
    if (!hasProjectAccess) {
      return { allowed: false, reason: 'No project access' }
    }
  }

  // 3. 시간 기반 제한 확인
  if (context.timeRestriction) {
    const now = new Date()
    const restriction = new Date(context.timeRestriction)
    if (now > restriction) {
      return { allowed: false, reason: 'Time restriction exceeded' }
    }
  }

  return { allowed: true }
}

// 프로젝트 접근 권한 확인
function checkProjectAccess(userId: string, projectId: string): boolean {
  // 실제 구현에서는 프로젝트 참여자 목록을 확인
  return true // 모의 구현
}

// MFA 요구사항 확인
function isMFARequired(action: string): boolean {
  let policies: any = {}

  securityPolicies.subscribe(p => {
    policies = p
  })()

  return policies.session?.requireReauth?.includes(action) || false
}

// 보안 이벤트 로깅
export function logSecurityEvent(
  eventType: 'login' | 'logout' | 'access_denied' | 'data_export' | 'suspicious_activity',
  userId: string,
  details: Record<string, unknown>
): void {
  const securityLog = {
    id: crypto.randomUUID(),
    eventType,
    userId,
    details,
    timestamp: new Date().toISOString(),
    ipAddress: details.ipAddress || 'unknown',
    userAgent: details.userAgent || 'unknown'
  }

  // 보안 로그는 별도 스토어에 저장 (실제 구현)
  logger.log('Security Event:', securityLog)

  // 감사 로그에도 기록
  createAuditLog(userId, `security_${eventType}`, 'security', securityLog.id, {}, details, {
    eventType,
    ipAddress: details.ipAddress
  })
}

// 데이터 마스킹
export function maskSensitiveData(data: any, userRole: string): any {
  if (!data) return data

  let policies: any = {}
  securityPolicies.subscribe(p => {
    policies = p
  })()

  const maskFields = policies.data?.anonymization?.fields || []

  if (typeof data === 'object') {
    const masked = { ...data }

    maskFields.forEach(field => {
      if (masked[field]) {
        masked[field] = maskValue(masked[field], userRole)
      }
    })

    return masked
  }

  return data
}

// 값 마스킹
function maskValue(value: string, userRole: string): string {
  // 감사 역할은 전체 값 표시
  if (userRole === 'R7') {
    return value
  }

  // 경영진은 부분 마스킹
  if (userRole === 'R6') {
    if (value.length > 4) {
      return (
        value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2)
      )
    }
    return '*'.repeat(value.length)
  }

  // 기타 역할은 완전 마스킹
  return '*'.repeat(value.length)
}

// 감사 로그 내보내기
export function exportAuditLogs(
  format: 'json' | 'csv' | 'excel',
  filters?: {
    startDate?: string
    endDate?: string
    entity?: string
    action?: string
  }
): string {
  const logs = getAuditLogs(filters)

  if (format === 'json') {
    return JSON.stringify(logs, null, 2)
  } else if (format === 'csv') {
    const csvHeader = 'ID,Actor ID,Action,Entity,Entity ID,Timestamp,Details\n'
    const csvRows = logs
      .map(
        log =>
          `${log.id},${log.actorId},${log.action},${log.entity},${log.entityId},${log.at},"${JSON.stringify(log.diff).replace(/"/g, '""')}"`
      )
      .join('\n')
    return csvHeader + csvRows
  }

  return JSON.stringify(logs, null, 2)
}

// 보안 정책 위반 감지
export function detectSecurityViolations(): {
  violations: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    recommendation: string
  }>
} {
  const violations = []

  // 1. 비정상적인 접근 패턴 감지
  const suspiciousAccess = detectSuspiciousAccess()
  if (suspiciousAccess.length > 0) {
    violations.push({
      type: 'suspicious_access',
      severity: 'high',
      description: `${suspiciousAccess.length}건의 비정상적인 접근이 감지되었습니다.`,
      recommendation: '해당 사용자의 접근을 제한하고 추가 조사를 수행하세요.'
    })
  }

  // 2. 권한 상승 시도 감지
  const privilegeEscalation = detectPrivilegeEscalation()
  if (privilegeEscalation.length > 0) {
    violations.push({
      type: 'privilege_escalation',
      severity: 'critical',
      description: `${privilegeEscalation.length}건의 권한 상승 시도가 감지되었습니다.`,
      recommendation: '즉시 해당 계정을 비활성화하고 보안팀에 보고하세요.'
    })
  }

  // 3. 대량 데이터 접근 감지
  const bulkDataAccess = detectBulkDataAccess()
  if (bulkDataAccess.length > 0) {
    violations.push({
      type: 'bulk_data_access',
      severity: 'medium',
      description: `${bulkDataAccess.length}건의 대량 데이터 접근이 감지되었습니다.`,
      recommendation: '해당 접근의 정당성을 확인하고 필요시 접근을 제한하세요.'
    })
  }

  return { violations }
}

// 비정상적인 접근 패턴 감지
function detectSuspiciousAccess(): unknown[] {
  // 실제 구현에서는 접근 로그를 분석
  return []
}

// 권한 상승 시도 감지
function detectPrivilegeEscalation(): unknown[] {
  // 실제 구현에서는 권한 변경 로그를 분석
  return []
}

// 대량 데이터 접근 감지
function detectBulkDataAccess(): unknown[] {
  // 실제 구현에서는 데이터 접근 로그를 분석
  return []
}

// 보안 정책 업데이트
export function updateSecurityPolicy(policyType: string, policyData: any): void {
  securityPolicies.update(policies => ({
    ...policies,
    [policyType]: policyData
  }))

  // 정책 변경 감사 로그
  createAuditLog(
    'current-user',
    'update_security_policy',
    'security_policy',
    policyType,
    {},
    policyData
  )
}

// 접근 제어 정책 업데이트
export function updateAccessControlPolicy(policyType: string, policyData: any): void {
  accessControl.update(policies => ({
    ...policies,
    [policyType]: policyData
  }))

  // 정책 변경 감사 로그
  createAuditLog(
    'current-user',
    'update_access_control',
    'access_control',
    policyType,
    {},
    policyData
  )
}

// 보안 대시보드 데이터
export function getSecurityDashboardData(): any {
  const recentLogs = getAuditLogs().slice(0, 10)
  const violations = detectSecurityViolations()

  return {
    recentLogs,
    violations: violations.violations,
    totalLogs: getAuditLogs().length,
    securityEvents: {
      login: getAuditLogs({ action: 'security_login' }).length,
      logout: getAuditLogs({ action: 'security_logout' }).length,
      accessDenied: getAuditLogs({ action: 'security_access_denied' }).length,
      dataExport: getAuditLogs({ action: 'security_data_export' }).length
    }
  }
}
