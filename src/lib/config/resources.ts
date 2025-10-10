/**
 * 리소스 중앙 정의
 * - 모든 시스템 리소스를 한 곳에서 관리
 * - navigation.ts, permission-matrix.ts, routes.ts에서 공통 사용
 * - 페이지 추가/삭제 시 이 파일만 수정하면 모든 곳에 자동 반영
 * - 아이콘은 resource-icons.ts에서 별도 관리 (Node.js 환경 호환성)
 */

import { Routes } from './routes.enum'
import type { ComponentType } from 'svelte'

// ============================================
// Resource Category (리소스 카테고리)
// ============================================

export enum ResourceCategory {
  COMMON = 'common',
  FINANCE = 'finance',
  HR = 'hr',
  PROJECT = 'project',
  PLANNER = 'planner',
  SALES = 'sales',
  SYSTEM = 'system',
}

// ============================================
// Resource Definition (리소스 정의)
// ============================================

export interface ResourceDefinition {
  /** 리소스 키 (DB의 resource 필드와 매칭) */
  readonly key: string
  /** 카테고리 */
  readonly category: ResourceCategory
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
  /** 권한 매트릭스 표시 여부 */
  readonly showInMatrix?: boolean
  /** 네비게이션 표시 여부 */
  readonly showInNav?: boolean
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
    category: ResourceCategory.COMMON,
    nameKo: '대시보드',
    nameEn: 'Dashboard',
    route: Routes.DASHBOARD,
    showInMatrix: true,
    showInNav: true,
    description: '전체 시스템 현황 대시보드',
  },
  {
    key: 'common.calendar',
    category: ResourceCategory.COMMON,
    nameKo: '일정',
    nameEn: 'Calendar',
    route: Routes.CALENDAR,
    showInMatrix: false,
    showInNav: true,
    description: '일정 관리',
  },
  {
    key: 'common.messages',
    category: ResourceCategory.COMMON,
    nameKo: '메시지',
    nameEn: 'Messages',
    route: Routes.MESSAGES,
    showInMatrix: false,
    showInNav: true,
    description: '메시지 및 알림',
  },
  {
    key: 'common.profile',
    category: ResourceCategory.COMMON,
    nameKo: '프로필',
    nameEn: 'Profile',
    showInMatrix: false,
    showInNav: false,
    description: '사용자 프로필 관리',
  },

  // ============================================
  // FINANCE (재무관리)
  // ============================================
  {
    key: 'finance',
    category: ResourceCategory.FINANCE,
    nameKo: '재무 관리',
    nameEn: 'Finance Management',
    route: Routes.FINANCE,
    showInMatrix: true,
    showInNav: true,
    description: '재무 관리 통합',
    children: [
      {
        key: 'finance.accounts',
        category: ResourceCategory.FINANCE,
        nameKo: '계정 과목',
        nameEn: 'Accounts',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'finance.transactions',
        category: ResourceCategory.FINANCE,
        nameKo: '거래 내역',
        nameEn: 'Transactions',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'finance.budgets',
        category: ResourceCategory.FINANCE,
        nameKo: '예산',
        nameEn: 'Budgets',
        showInMatrix: false,
        showInNav: false,
      },
    ],
  },
  {
    key: 'salary.management',
    category: ResourceCategory.FINANCE,
    nameKo: '급여 관리',
    nameEn: 'Salary Management',
    route: Routes.SALARY,
    showInMatrix: false,
    showInNav: true,
    description: '직원 급여 관리 시스템',
  },

  // ============================================
  // HR (인사관리)
  // ============================================
  {
    key: 'hr',
    category: ResourceCategory.HR,
    nameKo: '인사 관리',
    nameEn: 'HR Management',
    route: Routes.HR,
    showInMatrix: true,
    showInNav: true,
    description: '인사 관리 통합',
    children: [
      {
        key: 'hr.employees',
        category: ResourceCategory.HR,
        nameKo: '직원 관리',
        nameEn: 'Employees',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'hr.payslips',
        category: ResourceCategory.HR,
        nameKo: '급여명세서',
        nameEn: 'Payslips',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'hr.attendance',
        category: ResourceCategory.HR,
        nameKo: '출퇴근',
        nameEn: 'Attendance',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'hr.leaves',
        category: ResourceCategory.HR,
        nameKo: '휴가',
        nameEn: 'Leaves',
        showInMatrix: false,
        showInNav: false,
      },
    ],
  },

  // ============================================
  // PROJECT (프로젝트 관리)
  // ============================================
  {
    key: 'project',
    category: ResourceCategory.PROJECT,
    nameKo: '프로젝트 관리',
    nameEn: 'Project Management',
    route: Routes.PROJECT,
    showInMatrix: true,
    showInNav: true,
    description: '프로젝트 관리',
    children: [
      {
        key: 'project.projects',
        category: ResourceCategory.PROJECT,
        nameKo: '프로젝트',
        nameEn: 'Projects',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'project.deliverables',
        category: ResourceCategory.PROJECT,
        nameKo: '산출물',
        nameEn: 'Deliverables',
        showInMatrix: false,
        showInNav: false,
      },
    ],
  },

  // ============================================
  // PLANNER (플래너)
  // ============================================
  {
    key: 'planner',
    category: ResourceCategory.PLANNER,
    nameKo: '플래너',
    nameEn: 'Planner',
    route: Routes.PLANNER,
    showInMatrix: true,
    showInNav: true,
    description: 'VIA 이니셔티브 플래너',
    children: [
      {
        key: 'planner.products',
        category: ResourceCategory.PLANNER,
        nameKo: '제품',
        nameEn: 'Products',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'planner.initiatives',
        category: ResourceCategory.PLANNER,
        nameKo: '이니셔티브',
        nameEn: 'Initiatives',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'planner.threads',
        category: ResourceCategory.PLANNER,
        nameKo: '스레드',
        nameEn: 'Threads',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'planner.formations',
        category: ResourceCategory.PLANNER,
        nameKo: '포메이션',
        nameEn: 'Formations',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'planner.milestones',
        category: ResourceCategory.PLANNER,
        nameKo: '마일스톤',
        nameEn: 'Milestones',
        showInMatrix: false,
        showInNav: false,
      },
    ],
  },

  // ============================================
  // SALES (영업관리)
  // ============================================
  {
    key: 'sales',
    category: ResourceCategory.SALES,
    nameKo: '영업 관리',
    nameEn: 'Sales Management',
    route: Routes.SALES,
    showInMatrix: true,
    showInNav: true,
    description: '영업 및 고객 관리',
    children: [
      {
        key: 'sales.customers',
        category: ResourceCategory.SALES,
        nameKo: '고객',
        nameEn: 'Customers',
        showInMatrix: false,
        showInNav: false,
      },
      {
        key: 'sales.contracts',
        category: ResourceCategory.SALES,
        nameKo: '계약',
        nameEn: 'Contracts',
        showInMatrix: false,
        showInNav: false,
      },
    ],
  },
  {
    key: 'crm',
    category: ResourceCategory.SALES,
    nameKo: '고객관리',
    nameEn: 'CRM',
    route: Routes.CRM,
    showInMatrix: true,
    showInNav: true,
    description: 'CRM 시스템',
  },

  // ============================================
  // SYSTEM (시스템)
  // ============================================
  {
    key: 'reports',
    category: ResourceCategory.SYSTEM,
    nameKo: '보고서',
    nameEn: 'Reports',
    route: Routes.REPORTS,
    showInMatrix: true,
    showInNav: true,
    description: '각종 보고서 생성',
  },
  {
    key: 'analytics',
    category: ResourceCategory.SYSTEM,
    nameKo: '분석',
    nameEn: 'Analytics',
    route: Routes.ANALYTICS,
    showInMatrix: true,
    showInNav: true,
    description: '데이터 분석 및 통계',
  },
  {
    key: 'settings',
    category: ResourceCategory.SYSTEM,
    nameKo: '설정',
    nameEn: 'Settings',
    route: Routes.SETTINGS,
    showInMatrix: false,
    showInNav: true,
    description: '시스템 설정',
  },
  {
    key: 'admin.permissions',
    category: ResourceCategory.SYSTEM,
    nameKo: '권한 관리',
    nameEn: 'Permissions',
    route: Routes.ADMIN_PERMISSIONS,
    showInMatrix: false,
    showInNav: true,
    description: '사용자 및 역할 권한 관리',
    children: [
      {
        key: 'system.users',
        category: ResourceCategory.SYSTEM,
        nameKo: '사용자 관리',
        nameEn: 'Users',
        showInMatrix: false,
        showInNav: false,
        description: '시스템 사용자 관리',
      },
      {
        key: 'system.roles',
        category: ResourceCategory.SYSTEM,
        nameKo: '역할 관리',
        nameEn: 'Roles',
        showInMatrix: false,
        showInNav: false,
        description: '역할 및 권한 관리',
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
 * 카테고리별 리소스 가져오기
 */
export function getResourcesByCategory(category: ResourceCategory): readonly ResourceDefinition[] {
  return RESOURCE_REGISTRY.filter((r) => r.category === category)
}

/**
 * 네비게이션에 표시할 리소스만 필터링
 */
export function getNavResources(): readonly ResourceDefinition[] {
  return RESOURCE_REGISTRY.filter((r) => r.showInNav === true)
}

/**
 * 권한 매트릭스에 표시할 리소스만 필터링
 */
export function getMatrixResources(): readonly ResourceDefinition[] {
  const result: ResourceDefinition[] = []

  const collect = (resources: readonly ResourceDefinition[]) => {
    for (const resource of resources) {
      if (resource.showInMatrix) {
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
/**
 * 카테고리별 한글 이름 매핑
 */
export const CATEGORY_NAMES: Readonly<Record<ResourceCategory, string>> = Object.freeze({
  [ResourceCategory.COMMON]: '공통',
  [ResourceCategory.FINANCE]: '재무',
  [ResourceCategory.HR]: '인사',
  [ResourceCategory.PROJECT]: '프로젝트',
  [ResourceCategory.PLANNER]: '플래너',
  [ResourceCategory.SALES]: '영업',
  [ResourceCategory.SYSTEM]: '시스템',
})
