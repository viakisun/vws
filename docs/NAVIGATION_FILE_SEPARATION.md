# Navigation File Separation

## Overview
네비게이션 메뉴 설정을 `routes.ts`에서 `navigation.ts`로 분리하여 책임을 명확히 분리

## File Structure

```
src/lib/config/
├── routes.enum.ts    # 순수 라우트 정의 (의존성 없음)
├── routes.ts         # 권한 설정 (서버/클라이언트 공통)
└── navigation.ts     # UI 메뉴 설정 (클라이언트 전용) ✨ NEW
```

## Dependency Flow

```
┌─────────────────────────────────────────┐
│ routes.enum.ts (Data Layer)            │
│ - Routes enum (70+ entries)             │
│ - Helper functions                      │
│ - Zero dependencies                     │
└────────────────┬────────────────────────┘
                 │
                 ├───────────────────┬─────────────────┐
                 ↓                   ↓                 ↓
┌────────────────────────┐  ┌──────────────────────────┐
│ routes.ts              │  │ navigation.ts            │
│ (Permission Layer)     │  │ (UI Layer)              │
│                        │  │                          │
│ - RoutePermission      │←─│ - NavItem interface      │
│ - ROUTE_PERMISSIONS    │  │ - NAVIGATION_MENU        │
│ - Resource mappings    │  │ - Icon imports           │
│ - Role mappings        │  │ - getVisibleMenuItems()  │
│                        │  │ - findMenuItem()         │
│ Used by: Server + UI   │  │ Used by: UI only         │
└────────────────────────┘  └──────────┬───────────────┘
                                       │
                                       ↓
                            ┌─────────────────────┐
                            │ Sidebar.svelte      │
                            │ (Presentation)      │
                            └─────────────────────┘
```

## Changes Made

### 1. Created: navigation.ts

**Purpose**: UI-only navigation configuration
- Icon imports (lucide-svelte)
- NavItem interface and type definitions
- NAVIGATION_MENU array (14 menu items)
- Helper functions for menu filtering

**Key Code**:
```typescript
import { ROUTE_PERMISSIONS, type RoutePermission } from './routes'
import { Routes } from './routes.enum'
import { HomeIcon, BanknoteIcon, ... } from 'lucide-svelte'

export interface NavItem {
  key: string
  name: string
  route: Routes
  icon?: ComponentType
  permission?: RoutePermission
  children?: NavItem[]
  badge?: () => number | string
  visible?: boolean
}

export const NAVIGATION_MENU: NavItem[] = [
  { key: 'dashboard', name: '대시보드', route: Routes.DASHBOARD, icon: HomeIcon },
  { key: 'finance', name: '재무관리', route: Routes.FINANCE, icon: BanknoteIcon, 
    permission: ROUTE_PERMISSIONS[Routes.FINANCE] },
  // ... 12 more items
]

export function getVisibleMenuItems(items, checkPermission) { ... }
export function findMenuItem(key, items) { ... }
```

### 2. Modified: routes.ts

**Before** (363 lines):
- Permission configuration
- Navigation types (NavItem)
- Navigation menu (NAVIGATION_MENU)
- Navigation helpers
- Icon imports

**After** (186 lines):
- ✅ Permission configuration only
- ❌ Navigation removed (moved to navigation.ts)

**Removed**:
```typescript
// ❌ Removed 14 icon imports
import { HomeIcon, BanknoteIcon, ... } from 'lucide-svelte'

// ❌ Removed NavItem interface
export interface NavItem { ... }

// ❌ Removed NAVIGATION_MENU (100+ lines)
export const NAVIGATION_MENU: NavItem[] = [ ... ]

// ❌ Removed navigation helpers
export function getVisibleMenuItems() { ... }
export function findMenuItem() { ... }
```

**Updated header**:
```typescript
/**
 * 라우트 권한 설정
 * - 페이지 및 API 엔드포인트의 권한 관리
 * - 서버/클라이언트 공통 사용
 *
 * Note: Routes enum은 './routes.enum'에서 직접 import하세요
 * Note: 네비게이션 메뉴는 './navigation'에서 관리합니다  ✨ NEW
 */
```

### 3. Modified: Sidebar.svelte

**Import changes**:
```typescript
// Before
import { 
  NAVIGATION_MENU, 
  getVisibleMenuItems, 
  type RoutePermission 
} from '$lib/config/routes'

// After
import type { RoutePermission } from '$lib/config/routes'
import { NAVIGATION_MENU, getVisibleMenuItems } from '$lib/config/navigation'
```

## Benefits

### 1. Clear Separation of Concerns

| File | Purpose | Used By | Dependencies |
|------|---------|---------|--------------|
| `routes.enum.ts` | Route definitions | Everywhere | None |
| `routes.ts` | Permission logic | Server + Client | routes.enum, stores |
| `navigation.ts` | UI menu config | Client only | routes.enum, routes, lucide-svelte |

### 2. Reduced File Size
- `routes.ts`: **363 → 186 lines** (48% reduction)
- Easier to find permission-related code
- Navigation config isolated in dedicated file

### 3. Better Import Semantics
```typescript
// Permission checks
import { ROUTE_PERMISSIONS } from '$lib/config/routes'

// UI menu rendering
import { NAVIGATION_MENU } from '$lib/config/navigation'

// Route constants
import { Routes } from '$lib/config/routes.enum'
```

### 4. Server-Safe
- `hooks.server.ts` can import `routes.ts` without pulling in Svelte component types
- Icon imports stay in client-only `navigation.ts`
- No unnecessary dependencies in server code

### 5. Single Responsibility Principle

**routes.ts** → Answers: "Does this user have permission?"
```typescript
const canAccess = ROUTE_PERMISSIONS[Routes.FINANCE]
```

**navigation.ts** → Answers: "What menu items should we show?"
```typescript
const menuItems = getVisibleMenuItems(NAVIGATION_MENU, checkPermission)
```

## Usage Patterns

### Adding New Menu Item

**1. Define route** (routes.enum.ts):
```typescript
export enum Routes {
  NEW_FEATURE = '/new-feature',
}
```

**2. Define permissions** (routes.ts):
```typescript
export const ROUTE_PERMISSIONS = {
  [Routes.NEW_FEATURE]: {
    resource: Resource.NEW_FEATURE,
    action: 'read',
  },
}
```

**3. Add to menu** (navigation.ts):
```typescript
import { NewIcon } from 'lucide-svelte'

export const NAVIGATION_MENU = [
  // ... existing items
  {
    key: 'new-feature',
    name: '새 기능',
    route: Routes.NEW_FEATURE,
    icon: NewIcon,
    permission: ROUTE_PERMISSIONS[Routes.NEW_FEATURE],
  },
]
```

### Checking Permissions (Server)
```typescript
// hooks.server.ts
import { ROUTE_PERMISSIONS } from '$lib/config/routes'  // ✅ No UI imports

const permission = ROUTE_PERMISSIONS[pathname]
// ... check logic
```

### Rendering Menu (Client)
```typescript
// Sidebar.svelte
import { NAVIGATION_MENU, getVisibleMenuItems } from '$lib/config/navigation'

const items = getVisibleMenuItems(NAVIGATION_MENU, checkPermission)
```

## Migration Checklist

- ✅ Created `navigation.ts` with NavItem, NAVIGATION_MENU, helpers
- ✅ Removed navigation code from `routes.ts` (177 lines)
- ✅ Updated `Sidebar.svelte` imports
- ✅ Verified TypeScript compilation (no errors)
- ✅ Verified ESLint (no warnings)
- ✅ Updated file headers with cross-references
- ⏳ Update ROUTES_USAGE.md with new structure
- ⏳ Browser test to verify menu rendering
- ⏳ Verify server code doesn't import navigation.ts

## Summary

**Problem**: `routes.ts` mixing permission logic with UI menu configuration  
**Solution**: Split into dedicated files by responsibility  
**Result**: Cleaner imports, better separation, server-safe dependencies  

**Files**:
- `routes.enum.ts` (70 lines) - Pure data
- `routes.ts` (186 lines) - Permission logic ↓48%
- `navigation.ts` (177 lines) - UI config ✨ NEW

**Total LOC unchanged, but organization dramatically improved** 🎯
