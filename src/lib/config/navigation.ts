/**
 * 네비게이션 메뉴 설정
 * - 사이드바 메뉴 구조 및 아이콘 관리
 * - UI 레이어 전용 설정
 * - Builder 패턴 및 헬퍼 함수로 수준 높은 구조 제공
 */

import type { ComponentType } from 'svelte'
import { Routes } from './routes.enum'
import { ROUTE_PERMISSIONS, type RoutePermission } from './routes'
import {
  BanknoteIcon,
  BarChart3Icon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  DollarSignIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HomeIcon,
  MessageSquareIcon,
  SettingsIcon,
  ShieldIcon,
  TargetIcon,
  UsersIcon,
} from 'lucide-svelte'

// ============================================
// Types
// ============================================

export interface NavItem {
  /** 메뉴 고유 키 */
  readonly key: string
  /** 메뉴 이름 */
  readonly name: string
  /** 라우트 경로 */
  readonly route: Routes
  /** 아이콘 (Lucide 아이콘 컴포넌트) */
  readonly icon?: ComponentType
  /** 권한 설정 */
  readonly permission?: RoutePermission
  /** 하위 메뉴 */
  readonly children?: readonly NavItem[]
  /** 배지 표시 (알림 수 등) */
  readonly badge?: () => number | string
  /** 메뉴 표시 여부 */
  readonly visible?: boolean
  /** 메뉴 그룹 (섹션 구분용) */
  readonly group?: NavGroup
}

export enum NavGroup {
  CORE = 'core',
  MANAGEMENT = 'management',
  BUSINESS = 'business',
  TOOLS = 'tools',
  SYSTEM = 'system',
}

// ============================================
// Builder Helpers
// ============================================

/**
 * 네비게이션 아이템 빌더
 * 타입 안전성과 가독성을 높이는 팩토리 함수
 */
function createNavItem(config: {
  key: string
  name: string
  route: Routes
  icon?: ComponentType
  group?: NavGroup
  visible?: boolean
}): NavItem {
  const { key, name, route, icon, group, visible = true } = config

  return {
    key,
    name,
    route,
    icon,
    group,
    visible,
    // 권한이 정의된 경우 자동으로 연결
    permission: ROUTE_PERMISSIONS[route],
  }
}

/**
 * 하위 메뉴가 있는 네비게이션 아이템 생성
 * (향후 하위 메뉴 추가 시 사용)
 */
function _createNavItemWithChildren(
  config: {
    key: string
    name: string
    route: Routes
    icon?: ComponentType
    group?: NavGroup
  },
  children: NavItem[],
): NavItem {
  return {
    ...createNavItem(config),
    children: Object.freeze(children),
  }
}

// ============================================
// Menu Sections
// ============================================

/**
 * 핵심 메뉴 (항상 표시)
 */
const CORE_MENU: readonly NavItem[] = Object.freeze([
  createNavItem({
    key: 'dashboard',
    name: '대시보드',
    route: Routes.DASHBOARD,
    icon: HomeIcon,
    group: NavGroup.CORE,
  }),
  createNavItem({
    key: 'calendar',
    name: '일정관리',
    route: Routes.CALENDAR,
    icon: CalendarIcon,
    group: NavGroup.CORE,
  }),
  createNavItem({
    key: 'messages',
    name: '메시지',
    route: Routes.MESSAGES,
    icon: MessageSquareIcon,
    group: NavGroup.CORE,
  }),
])

/**
 * 관리 메뉴 (재무, 급여, 인사)
 */
const MANAGEMENT_MENU: readonly NavItem[] = Object.freeze([
  createNavItem({
    key: 'finance',
    name: '재무관리',
    route: Routes.FINANCE,
    icon: BanknoteIcon,
    group: NavGroup.MANAGEMENT,
  }),
  createNavItem({
    key: 'salary',
    name: '급여관리',
    route: Routes.SALARY,
    icon: DollarSignIcon,
    group: NavGroup.MANAGEMENT,
  }),
  createNavItem({
    key: 'hr',
    name: '인사관리',
    route: Routes.HR,
    icon: UsersIcon,
    group: NavGroup.MANAGEMENT,
  }),
])

/**
 * 비즈니스 메뉴 (영업, 고객, 프로젝트)
 */
const BUSINESS_MENU: readonly NavItem[] = Object.freeze([
  createNavItem({
    key: 'sales',
    name: '영업관리',
    route: Routes.SALES,
    icon: BriefcaseIcon,
    group: NavGroup.BUSINESS,
  }),
  createNavItem({
    key: 'crm',
    name: '고객관리',
    route: Routes.CRM,
    icon: BuildingIcon,
    group: NavGroup.BUSINESS,
  }),
  createNavItem({
    key: 'project',
    name: '연구개발',
    route: Routes.PROJECT,
    icon: FlaskConicalIcon,
    group: NavGroup.BUSINESS,
  }),
  createNavItem({
    key: 'planner',
    name: 'Planner',
    route: Routes.PLANNER,
    icon: TargetIcon,
    group: NavGroup.BUSINESS,
  }),
])

/**
 * 도구 메뉴 (보고서, 분석)
 */
const TOOLS_MENU: readonly NavItem[] = Object.freeze([
  createNavItem({
    key: 'reports',
    name: '보고서',
    route: Routes.REPORTS,
    icon: FileTextIcon,
    group: NavGroup.TOOLS,
  }),
  createNavItem({
    key: 'analytics',
    name: '분석',
    route: Routes.ANALYTICS,
    icon: BarChart3Icon,
    group: NavGroup.TOOLS,
  }),
])

/**
 * 시스템 메뉴 (설정, 권한)
 */
const SYSTEM_MENU: readonly NavItem[] = Object.freeze([
  createNavItem({
    key: 'settings',
    name: '설정',
    route: Routes.SETTINGS,
    icon: SettingsIcon,
    group: NavGroup.SYSTEM,
  }),
  createNavItem({
    key: 'admin',
    name: '권한관리',
    route: Routes.ADMIN_PERMISSIONS,
    icon: ShieldIcon,
    group: NavGroup.SYSTEM,
  }),
])

// ============================================
// Navigation Menu Configuration
// ============================================

/**
 * 전체 네비게이션 메뉴
 * 섹션별로 구조화되어 있으며, 순서와 그룹핑이 명확함
 */
export const NAVIGATION_MENU: readonly NavItem[] = Object.freeze([
  ...CORE_MENU,
  ...MANAGEMENT_MENU,
  ...BUSINESS_MENU,
  ...TOOLS_MENU,
  ...SYSTEM_MENU,
])

/**
 * 그룹별 메뉴 접근을 위한 맵
 */
export const MENU_BY_GROUP = Object.freeze({
  [NavGroup.CORE]: CORE_MENU,
  [NavGroup.MANAGEMENT]: MANAGEMENT_MENU,
  [NavGroup.BUSINESS]: BUSINESS_MENU,
  [NavGroup.TOOLS]: TOOLS_MENU,
  [NavGroup.SYSTEM]: SYSTEM_MENU,
} as const)

// ============================================
// Type Guards
// ============================================

/**
 * NavItem 타입 가드
 */
export function isNavItem(value: unknown): value is NavItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'key' in value &&
    'name' in value &&
    'route' in value
  )
}

/**
 * 하위 메뉴가 있는지 확인
 */
export function hasChildren(item: NavItem): item is NavItem & { children: readonly NavItem[] } {
  return Array.isArray(item.children) && item.children.length > 0
}

// ============================================
// Filter & Search Functions
// ============================================

/**
 * 권한에 따라 필터링된 메뉴 항목을 반환
 * 불변성을 유지하며 새로운 배열 반환
 */
export function getVisibleMenuItems(
  items: readonly NavItem[],
  checkPermission: (permission?: RoutePermission) => boolean,
): NavItem[] {
  return items
    .filter((item) => {
      // visible이 명시적으로 false면 숨김
      if (item.visible === false) return false
      // 권한이 없으면 항상 표시
      if (!item.permission) return true
      // 권한 체크
      return checkPermission(item.permission)
    })
    .map((item) => ({
      ...item,
      children: hasChildren(item) ? getVisibleMenuItems(item.children, checkPermission) : undefined,
    }))
}

/**
 * 키로 메뉴 항목 찾기 (DFS)
 */
export function findMenuItem(
  key: string,
  items: readonly NavItem[] = NAVIGATION_MENU,
): NavItem | null {
  for (const item of items) {
    if (item.key === key) return item

    if (hasChildren(item)) {
      const found = findMenuItem(key, item.children)
      if (found) return found
    }
  }
  return null
}

/**
 * 라우트로 메뉴 항목 찾기
 */
export function findMenuItemByRoute(
  route: Routes,
  items: readonly NavItem[] = NAVIGATION_MENU,
): NavItem | null {
  for (const item of items) {
    if (item.route === route) return item

    if (hasChildren(item)) {
      const found = findMenuItemByRoute(route, item.children)
      if (found) return found
    }
  }
  return null
}

/**
 * 그룹으로 메뉴 항목 필터링
 */
export function getMenuItemsByGroup(group: NavGroup): readonly NavItem[] {
  return MENU_BY_GROUP[group] ?? []
}

/**
 * 메뉴 계층 구조를 평탄화 (breadcrumb 생성 등에 유용)
 */
export function flattenMenuItems(items: readonly NavItem[] = NAVIGATION_MENU): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    acc.push(item)
    if (hasChildren(item)) {
      acc.push(...flattenMenuItems(item.children))
    }
    return acc
  }, [])
}

/**
 * 특정 메뉴 항목까지의 경로(breadcrumb) 찾기
 */
export function getMenuItemPath(
  key: string,
  items: readonly NavItem[] = NAVIGATION_MENU,
  currentPath: NavItem[] = [],
): NavItem[] | null {
  for (const item of items) {
    const path = [...currentPath, item]

    if (item.key === key) return path

    if (hasChildren(item)) {
      const found = getMenuItemPath(key, item.children, path)
      if (found) return found
    }
  }
  return null
}
