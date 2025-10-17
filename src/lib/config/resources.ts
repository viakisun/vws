/**
 * 리소스 중앙 정의
 * - 모든 시스템 리소스를 한 곳에서 관리
 * - navigation.ts, permission-matrix.ts, routes.ts에서 공통 사용
 * - 페이지 추가/삭제 시 이 파일만 수정하면 모든 곳에 자동 반영
 * - 아이콘은 resource-icons.ts에서 별도 관리 (Node.js 환경 호환성)
 */

import type { ComponentType } from 'svelte'
import { Routes } from './routes.enum'

// ============================================
// Resource Definition (리소스 정의)
// ============================================

export interface ResourceDefinition {
  /** 리소스 키 (DB의 resource 필드와 매칭) */
  readonly key: string
  /** 한글 이름 (UI 표시용) */
  readonly nameKo: string
  /** 영문 이름 */
  readonly nameEn: string
  /** 라우트 (있는 경우) */
  readonly route?: Routes
  /** 아이콘 (있는 경우) */
  readonly icon?: ComponentType
  /** 하위 리소스 */
  readonly children?: readonly ResourceDefinition[]
  /** 설명 */
  readonly description?: string
}

// ============================================
// Resource Registry (리소스 레지스트리)
// ============================================

/**
 * 전체 리소스 정의
 *
 * 🎯 새 페이지 추가 방법:
 * 1. 여기에 리소스 추가
 * 2. routes.enum.ts에 라우트 추가
 * 3. routes.ts에 권한 추가
 * 4. 끝! navigation과 permission-matrix는 자동 반영
 */
export const RESOURCE_REGISTRY: readonly ResourceDefinition[] = Object.freeze([
  // ============================================
  // COMMON (공통)
  // ============================================
  {
    key: 'common.dashboard',
    nameKo: '대시보드',
    nameEn: 'Dashboard',
    route: Routes.DASHBOARD,
    description: '전체 시스템 현황 대시보드',
  },
  {
    key: 'common.calendar',
    nameKo: '일정',
    nameEn: 'Calendar',
    route: Routes.CALENDAR,
    description: '일정 관리',
  },
  {
    key: 'common.messages',
    nameKo: '메시지',
    nameEn: 'Messages',
    route: Routes.MESSAGES,
    description: '메시지 및 알림',
  },
  {
    key: 'common.profile',
    nameKo: '프로필',
    nameEn: 'Profile',
    description: '사용자 프로필 관리',
  },

  // ============================================
  // FINANCE (재무관리)
  // ============================================
  {
    key: 'finance',
    nameKo: '재무 관리',
    nameEn: 'Finance Management',
    route: Routes.FINANCE,
    description: '재무 관리 통합',
    children: [
      {
        key: 'finance.accounts',
        nameKo: '계정 과목',
        nameEn: 'Accounts',
      },
      {
        key: 'finance.transactions',
        nameKo: '거래 내역',
        nameEn: 'Transactions',
      },
      {
        key: 'finance.budgets',
        nameKo: '예산',
        nameEn: 'Budgets',
      },
    ],
  },
  {
    key: 'salary.management',
    nameKo: '급여 관리',
    nameEn: 'Salary Management',
    route: Routes.SALARY,
    description: '직원 급여 관리 시스템',
  },

  // ============================================
  // HR (인사관리)
  // ============================================
  {
    key: 'hr',
    nameKo: '인사 관리',
    nameEn: 'HR Management',
    route: Routes.HR,
    description: '인사 관리 통합',
    children: [
      {
        key: 'hr.employees',
        nameKo: '직원 관리',
        nameEn: 'Employees',
      },
      {
        key: 'hr.payslips',
        nameKo: '급여명세서',
        nameEn: 'Payslips',
      },
      {
        key: 'hr.attendance',
        nameKo: '출퇴근',
        nameEn: 'Attendance',
      },
      {
        key: 'hr.leaves',
        nameKo: '휴가',
        nameEn: 'Leaves',
      },
    ],
  },

  // ============================================
  // PROJECT (연구개발사업 관리)
  // ============================================
  {
    key: 'project',
    nameKo: '연구개발사업 관리',
    nameEn: 'Research & Development',
    route: Routes.PROJECT,
    description: '연구개발사업 관리',
    children: [
      {
        key: 'project.projects',
        nameKo: '프로젝트',
        nameEn: 'Projects',
      },
      {
        key: 'project.deliverables',
        nameKo: '산출물',
        nameEn: 'Deliverables',
      },
    ],
  },

  // ============================================
  // PLANNER (플래너)
  // ============================================
  {
    key: 'planner',
    nameKo: '플래너',
    nameEn: 'Planner',
    route: Routes.PLANNER,
    description: 'VIA 이니셔티브 플래너',
    children: [
      {
        key: 'planner.products',
        nameKo: '제품',
        nameEn: 'Products',
      },
      {
        key: 'planner.initiatives',
        nameKo: '이니셔티브',
        nameEn: 'Initiatives',
      },
      {
        key: 'planner.threads',
        nameKo: '스레드',
        nameEn: 'Threads',
      },
      {
        key: 'planner.formations',
        nameKo: '포메이션',
        nameEn: 'Formations',
      },
      {
        key: 'planner.milestones',
        nameKo: '마일스톤',
        nameEn: 'Milestones',
      },
    ],
  },

  // ============================================
  // R&D Development (개발자 중심 R&D 관리)
  // ============================================
  {
    key: 'rd_development',
    nameKo: 'R&D 개발',
    nameEn: 'R&D Development',
    route: Routes.RD_DEVELOPMENT,
    description: '개발자 중심 R&D 프로젝트 관리',
    children: [
      {
        key: 'rd_development.projects',
        nameKo: '프로젝트',
        nameEn: 'Projects',
      },
      {
        key: 'rd_development.deliverables',
        nameKo: '산출물',
        nameEn: 'Deliverables',
      },
      {
        key: 'rd_development.timeline',
        nameKo: '타임라인',
        nameEn: 'Timeline',
      },
      {
        key: 'rd_development.institutions',
        nameKo: '참여기관',
        nameEn: 'Institutions',
      },
    ],
  },

  // ============================================
  // CRM (고객 관계 관리)
  // ============================================
  {
    key: 'crm',
    nameKo: 'CRM',
    nameEn: 'CRM',
    route: Routes.CRM,
    description: '고객 관계 관리',
    children: [
      {
        key: 'crm.customers',
        nameKo: '고객',
        nameEn: 'Customers',
      },
      {
        key: 'crm.interactions',
        nameKo: '상호작용',
        nameEn: 'Interactions',
      },
      {
        key: 'crm.opportunities',
        nameKo: '영업 기회',
        nameEn: 'Opportunities',
      },
      {
        key: 'crm.contracts',
        nameKo: '계약',
        nameEn: 'Contracts',
      },
      {
        key: 'crm.transactions',
        nameKo: '거래',
        nameEn: 'Transactions',
      },
      {
        key: 'crm.reports',
        nameKo: '보고서',
        nameEn: 'Reports',
      },
    ],
  },

  // ============================================
  // SYSTEM (시스템)
  // ============================================
  {
    key: 'reports',
    nameKo: '보고서',
    nameEn: 'Reports',
    route: Routes.REPORTS,
    description: '각종 보고서 생성',
  },
  {
    key: 'analytics',
    nameKo: '분석',
    nameEn: 'Analytics',
    route: Routes.ANALYTICS,
    description: '데이터 분석 및 통계',
  },
  {
    key: 'settings',
    nameKo: '설정',
    nameEn: 'Settings',
    route: Routes.SETTINGS,
    description: '시스템 설정',
  },
  {
    key: 'admin.permissions',
    nameKo: '권한 관리',
    nameEn: 'Permissions',
    route: Routes.ADMIN_PERMISSIONS,
    description: '사용자 및 역할 권한 관리',
    children: [
      {
        key: 'system.users',
        nameKo: '사용자 관리',
        nameEn: 'Users',
        description: '시스템 사용자 관리',
      },
      {
        key: 'system.roles',
        nameKo: '역할 관리',
        nameEn: 'Roles',
        description: '역할 및 권한 관리',
      },
    ],
  },

  // ============================================
  // ASSET MANAGEMENT (자산 관리)
  // ============================================
  {
    key: 'assets',
    nameKo: '자산 관리',
    nameEn: 'Asset Management',
    route: Routes.ASSETS,
    description: '자산 및 지식재산권 통합 관리',
    children: [
      {
        key: 'assets.physical',
        nameKo: '물리적 자산',
        nameEn: 'Physical Assets',
      },
      {
        key: 'assets.ip',
        nameKo: '지식재산권',
        nameEn: 'Intellectual Property',
      },
      {
        key: 'assets.certifications',
        nameKo: '인증/등록증',
        nameEn: 'Certifications',
      },
      {
        key: 'assets.requests',
        nameKo: '자산 신청',
        nameEn: 'Asset Requests',
      },
      {
        key: 'assets.audit',
        nameKo: '자산 실사',
        nameEn: 'Asset Audit',
      },
    ],
  },

  // ============================================
  // HELP (도움말)
  // ============================================
  {
    key: 'help',
    nameKo: '도움말',
    nameEn: 'Help',
    route: Routes.HELP,
    description: '사용자 매뉴얼 및 도움말',
    children: [
      {
        key: 'help.dashboard',
        nameKo: '대시보드',
        nameEn: 'Dashboard',
      },
      {
        key: 'help.attendance',
        nameKo: '출퇴근 관리',
        nameEn: 'Attendance',
      },
      {
        key: 'help.leave',
        nameKo: '휴가 관리',
        nameEn: 'Leave',
      },
      {
        key: 'help.hr',
        nameKo: '인사 관리',
        nameEn: 'HR',
      },
      {
        key: 'help.salary',
        nameKo: '급여 관리',
        nameEn: 'Salary',
      },
      {
        key: 'help.finance',
        nameKo: '재무 관리',
        nameEn: 'Finance',
      },
      {
        key: 'help.research_development',
        nameKo: '연구개발 사업 관리',
        nameEn: 'Research & Development',
      },
      {
        key: 'help.planner',
        nameKo: '플래너',
        nameEn: 'Planner',
      },
      {
        key: 'help.crm',
        nameKo: 'CRM',
        nameEn: 'CRM',
      },
      {
        key: 'help.assets',
        nameKo: '자산 관리',
        nameEn: 'Asset Management',
      },
      {
        key: 'help.settings',
        nameKo: '시스템 설정',
        nameEn: 'Settings',
      },
    ],
  },
])

// ============================================
// Helper Functions
// ============================================

/**
 * 리소스 키로 리소스 찾기
 */
export function findResourceByKey(key: string): ResourceDefinition | null {
  const find = (resources: readonly ResourceDefinition[]): ResourceDefinition | null => {
    for (const resource of resources) {
      if (resource.key === key) return resource
      if (resource.children) {
        const found = find(resource.children)
        if (found) return found
      }
    }
    return null
  }
  return find(RESOURCE_REGISTRY)
}

/**
 * 라우트로 리소스 찾기
 */
export function findResourceByRoute(route: Routes): ResourceDefinition | null {
  const find = (resources: readonly ResourceDefinition[]): ResourceDefinition | null => {
    for (const resource of resources) {
      if (resource.route === route) return resource
      if (resource.children) {
        const found = find(resource.children)
        if (found) return found
      }
    }
    return null
  }
  return find(RESOURCE_REGISTRY)
}

/**
 * 네비게이션에 표시할 리소스 필터링
 * route가 있는 리소스만 표시 (하위 리소스 제외)
 */
export function getNavResources(): readonly ResourceDefinition[] {
  return RESOURCE_REGISTRY.filter((r) => r.route !== undefined)
}

/**
 * 권한 매트릭스에 표시할 리소스 필터링
 * route가 있는 모든 리소스 표시 (부모 + 하위)
 */
export function getMatrixResources(): readonly ResourceDefinition[] {
  const result: ResourceDefinition[] = []

  const collect = (resources: readonly ResourceDefinition[]) => {
    for (const resource of resources) {
      // route가 있으면 매트릭스에 표시
      if (resource.route) {
        result.push(resource)
      }
      if (resource.children) {
        collect(resource.children)
      }
    }
  }

  collect(RESOURCE_REGISTRY)
  return Object.freeze(result)
}

/**
 * 모든 리소스 키 목록 (DB 쿼리용)
 */
export function getAllResourceKeys(): readonly string[] {
  const keys: string[] = []

  const collect = (resources: readonly ResourceDefinition[]) => {
    for (const resource of resources) {
      keys.push(resource.key)
      if (resource.children) {
        collect(resource.children)
      }
    }
  }

  collect(RESOURCE_REGISTRY)
  return Object.freeze(keys)
}

// ============================================
// 스크립트용 데이터 export (아이콘 제외)
// ============================================

/**
 * 스크립트용 리소스 데이터 (아이콘 제외)
 * Node.js 환경에서 Svelte 컴포넌트 없이 사용 가능
 */
export function getResourceData(): readonly Omit<ResourceDefinition, 'icon'>[] {
  const removeIcons = (
    resources: readonly ResourceDefinition[],
  ): Omit<ResourceDefinition, 'icon'>[] => {
    return resources.map((resource) => {
      const { icon, children, ...rest } = resource
      return {
        ...rest,
        ...(children && { children: removeIcons(children) }),
      }
    })
  }

  return removeIcons(RESOURCE_REGISTRY)
}
