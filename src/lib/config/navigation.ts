/**
 * 네비게이션 메뉴 설정
 * - resources.ts의 리소스 정의를 기반으로 자동 생성
 * - 사이드바 메뉴 구조 및 아이콘 관리
 * - UI 레이어 전용 설정
 */

import type { ComponentType } from 'svelte'
import { Routes } from './routes.enum'
import { ROUTE_PERMISSIONS, type RoutePermission } from './routes'
import { getNavResources, type ResourceDefinition, ResourceCategory } from './resources'
import { getResourceIcon } from './resource-icons'

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
// 카테고리 → 그룹 매핑
// ============================================

const CATEGORY_TO_GROUP: Record<ResourceCategory, NavGroup> = {
  [ResourceCategory.COMMON]: NavGroup.CORE,
  [ResourceCategory.FINANCE]: NavGroup.MANAGEMENT,
  [ResourceCategory.HR]: NavGroup.MANAGEMENT,
  [ResourceCategory.PROJECT]: NavGroup.BUSINESS,
  [ResourceCategory.PLANNER]: NavGroup.BUSINESS,
  [ResourceCategory.SALES]: NavGroup.BUSINESS,
  [ResourceCategory.SYSTEM]: NavGroup.SYSTEM,
}

// ============================================
// Builder Helpers
// ============================================

/**
 * ResourceDefinition을 NavItem으로 변환
 */
function resourceToNavItem(resource: ResourceDefinition): NavItem {
  if (!resource.route) {
    throw new Error(`Resource ${resource.key} has no route defined`)
  }

  return {
    key: resource.key,
    name: resource.nameKo,
    route: resource.route,
    icon: getResourceIcon(resource.key),
    group: CATEGORY_TO_GROUP[resource.category],
    visible: resource.showInNav,
    // 권한이 정의된 경우 자동으로 연결
    permission: ROUTE_PERMISSIONS[resource.route],
  }
}

// ============================================
// Navigation Menu (자동 생성)
// ============================================

/**
 * 전체 네비게이션 메뉴
 * resources.ts에서 showInNav=true인 리소스를 기반으로 자동 생성
 */
export const NAVIGATION_MENU: readonly NavItem[] = Object.freeze(
  getNavResources().map(resourceToNavItem),
)

/**
 * 그룹별 메뉴 접근
 */
export const MENU_BY_GROUP: Readonly<Record<NavGroup, readonly NavItem[]>> = Object.freeze({
  [NavGroup.CORE]: NAVIGATION_MENU.filter((item) => item.group === NavGroup.CORE),
  [NavGroup.MANAGEMENT]: NAVIGATION_MENU.filter((item) => item.group === NavGroup.MANAGEMENT),
  [NavGroup.BUSINESS]: NAVIGATION_MENU.filter((item) => item.group === NavGroup.BUSINESS),
  [NavGroup.TOOLS]: NAVIGATION_MENU.filter((item) => item.group === NavGroup.TOOLS),
  [NavGroup.SYSTEM]: NAVIGATION_MENU.filter((item) => item.group === NavGroup.SYSTEM),
})

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
