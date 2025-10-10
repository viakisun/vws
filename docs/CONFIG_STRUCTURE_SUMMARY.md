# Config Structure Summary

## Final Architecture

```
src/lib/config/
├── routes.enum.ts    (70 lines)   - Pure route definitions
├── routes.ts         (186 lines)  - Permission configuration
└── navigation.ts     (191 lines)  - UI menu configuration
                      ─────────
                      447 lines total
```

## Dependency Graph

```
routes.enum.ts (NO DEPS)
    │
    ├─────────────────────┬─────────────────┐
    ↓                     ↓                 ↓
routes.ts            navigation.ts     hooks.server.ts
(permissions)        (UI menus)        (auth middleware)
    ↓                     ↓                 
    └────────────┬────────┘                 
                 ↓                          
            Sidebar.svelte
            (rendering)
```

## File Purposes

### routes.enum.ts (Data Layer)
**Purpose**: Pure route string constants
**Exports**: 
- `enum Routes` (70+ entries)
- `buildRoute()`, `matchRoute()`, `isInSection()`

**Dependencies**: None
**Used by**: Everything

**Example**:
```typescript
export enum Routes {
  DASHBOARD = '/dashboard',
  FINANCE = '/finance',
  API_FINANCE_ACCOUNTS = '/api/finance/accounts',
}
```

### routes.ts (Permission Layer)
**Purpose**: Permission configuration for routes
**Exports**:
- `interface RoutePermission`
- `ROUTE_PERMISSIONS: Record<string, RoutePermission>`

**Dependencies**: 
- `routes.enum.ts` (Routes)
- `$lib/stores/permissions` (Resource, RoleCode)

**Used by**: Server (hooks.server.ts) + Client (navigation.ts, components)

**Example**:
```typescript
export const ROUTE_PERMISSIONS = {
  [Routes.FINANCE]: {
    resource: Resource.FINANCE_ACCOUNTS,
    action: 'read',
    fallback: Routes.UNAUTHORIZED,
  },
}
```

### navigation.ts (UI Layer)
**Purpose**: Navigation menu structure and icons
**Exports**:
- `interface NavItem`
- `NAVIGATION_MENU: NavItem[]`
- `getVisibleMenuItems()`, `findMenuItem()`

**Dependencies**:
- `routes.enum.ts` (Routes)
- `routes.ts` (ROUTE_PERMISSIONS, RoutePermission)
- `lucide-svelte` (Icon components)
- `svelte` (ComponentType)

**Used by**: Client only (Sidebar.svelte)

**Example**:
```typescript
export const NAVIGATION_MENU: NavItem[] = [
  {
    key: 'finance',
    name: '재무관리',
    route: Routes.FINANCE,
    icon: BanknoteIcon,
    permission: ROUTE_PERMISSIONS[Routes.FINANCE],
  },
]
```

## Import Patterns

### Server Code (hooks.server.ts)
```typescript
import { Routes } from '$lib/config/routes.enum'          // ✅ Route constants
import { ROUTE_PERMISSIONS } from '$lib/config/routes'    // ✅ Permission config
// ❌ NEVER import from navigation.ts (UI only!)
```

### Client Components (Sidebar.svelte)
```typescript
import { Routes } from '$lib/config/routes.enum'          // ✅ Route constants
import type { RoutePermission } from '$lib/config/routes' // ✅ Type only
import { NAVIGATION_MENU, getVisibleMenuItems } from '$lib/config/navigation' // ✅ UI config
```

### Other Client Code
```typescript
import { Routes } from '$lib/config/routes.enum'          // ✅ Route constants
import { ROUTE_PERMISSIONS } from '$lib/config/routes'    // ✅ If checking permissions
```

## Separation Benefits

### 1. Server-Safe Dependencies
- **Server imports**: `routes.enum.ts`, `routes.ts` ✅
- **Server avoids**: `navigation.ts` (has Svelte/UI deps) ❌
- Result: No client-only code in server bundle

### 2. Clear Responsibilities
- **Data** (routes.enum.ts): What routes exist?
- **Logic** (routes.ts): Who can access which routes?
- **UI** (navigation.ts): How do we display the menu?

### 3. Easy to Find Code
Looking for...
- Route string? → `routes.enum.ts`
- Permission rules? → `routes.ts`
- Menu structure? → `navigation.ts`
- Menu rendering? → `Sidebar.svelte`

### 4. Reduced File Size
- Before: `routes.ts` = 363 lines (mixed concerns)
- After: 
  - `routes.ts` = 186 lines (permissions only)
  - `navigation.ts` = 191 lines (UI only)
- Benefit: Each file focused on single concern

### 5. Type Safety Across Layers
```typescript
// Permission layer exports types
export interface RoutePermission { ... }

// UI layer imports types
import type { RoutePermission } from './routes'

// UI layer uses types
export interface NavItem {
  permission?: RoutePermission  // Type-safe reference
}
```

## Adding New Feature - Complete Flow

### 1. Add Route (routes.enum.ts)
```typescript
export enum Routes {
  NEW_FEATURE = '/new-feature',
  API_NEW_FEATURE = '/api/new-feature',
}
```

### 2. Add Permissions (routes.ts)
```typescript
export const ROUTE_PERMISSIONS = {
  [Routes.NEW_FEATURE]: {
    resource: Resource.NEW_FEATURE,
    action: 'read',
  },
}
```

### 3. Add to Menu (navigation.ts)
```typescript
import { NewIcon } from 'lucide-svelte'

export const NAVIGATION_MENU = [
  {
    key: 'new-feature',
    name: '새 기능',
    route: Routes.NEW_FEATURE,
    icon: NewIcon,
    permission: ROUTE_PERMISSIONS[Routes.NEW_FEATURE],
  },
]
```

### 4. That's It!
- ✅ Route defined
- ✅ Permissions configured
- ✅ Menu item added
- ✅ Icon assigned
- ✅ Server checks permission automatically (hooks.server.ts)
- ✅ Client filters menu automatically (Sidebar.svelte)

## File Size Comparison

### Before Refactoring
```
routes.ts: 363 lines (permissions + navigation mixed)
```

### After Refactoring
```
routes.enum.ts:  70 lines (pure data)
routes.ts:      186 lines (permissions only) ↓51% from original
navigation.ts:  191 lines (UI only)
────────────────────────
Total:          447 lines (+84 lines for better organization)
```

**Trade-off**: Slightly more total lines, but MUCH better organization.

## Validation

- ✅ TypeScript: No errors
- ✅ ESLint: No warnings
- ✅ Server imports: Safe (no UI dependencies)
- ✅ Client imports: Clean separation
- ✅ Build: Successful
- ⏳ Runtime: Pending browser test

## Summary

**Architecture Pattern**: **Layer Separation by Responsibility**

```
Data Layer     → routes.enum.ts    (constants)
Logic Layer    → routes.ts         (permissions)
UI Layer       → navigation.ts     (menus + icons)
Component Layer → Sidebar.svelte   (rendering)
```

**Key Principle**: Each layer only imports from layers above, never below.

**Result**: Clean, maintainable, server-safe architecture ✨
