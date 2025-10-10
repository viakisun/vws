<script lang="ts">
  import { page } from '$app/stores'
  import type { User } from '$lib/auth/user-service'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { can } from '$lib/stores/permissions'
  import type { RoutePermission } from '$lib/config/routes'
  import { NAVIGATION_MENU, getVisibleMenuItems } from '$lib/config/navigation'
  import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/svelte'

  let { isCollapsed = $bindable(true), user = null } = $props<{
    isCollapsed?: boolean
    user?: User | null
  }>()

  // 권한 체크 함수
  function checkPermission(permission?: RoutePermission): boolean {
    if (!permission) return true

    const conditions: boolean[] = []

    // 리소스 권한 체크
    if (permission.resource) {
      const action = permission.action || 'read'
      let hasResourcePermission = false

      switch (action) {
        case 'read':
          hasResourcePermission = $can.read(permission.resource, permission.scope)
          break
        case 'write':
          hasResourcePermission = $can.write(permission.resource, permission.scope)
          break
        case 'delete':
          hasResourcePermission = $can.delete(permission.resource, permission.scope)
          break
        case 'approve':
          hasResourcePermission = $can.approve(permission.resource, permission.scope)
          break
      }
      conditions.push(hasResourcePermission)
    }

    // 역할 권한 체크
    if (permission.roles && permission.roles.length > 0) {
      conditions.push($can.hasAnyRole(permission.roles))
    }

    // 조건이 없으면 기본적으로 true
    if (conditions.length === 0) return true

    // requireAll이 true면 모든 조건 만족, false면 하나라도 만족
    return permission.requireAll ? conditions.every(Boolean) : conditions.some(Boolean)
  }

  // 사용자 권한에 따른 메뉴 필터링
  const navigationItems = $derived(getVisibleMenuItems(NAVIGATION_MENU, checkPermission))

  function toggleCollapse() {
    isCollapsed = !isCollapsed
  }
</script>

<aside
  class="transition-all duration-300 {isCollapsed
    ? 'w-16'
    : 'w-64'} flex-shrink-0 h-screen sticky top-0"
  style:background="var(--color-surface)"
  style:border-right="1px solid var(--color-border)"
>
  <div class="flex h-full flex-col">
    <!-- Toggle Button -->
    <div
      class="flex h-12 items-center justify-center"
      style:border-bottom="1px solid var(--color-border)"
    >
      <ThemeButton
        variant="ghost"
        size="sm"
        onclick={toggleCollapse}
        class="p-2 transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {#if isCollapsed}
          <ChevronRightIcon size={16} />
        {:else}
          <ChevronLeftIcon size={16} />
        {/if}
      </ThemeButton>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-4 space-y-1">
      {#each navigationItems as item (item.key)}
        {@const currentPath = $page?.url?.pathname || ''}
        {@const routePath = item.route as string}
        {@const isCurrent =
          (routePath === '/' && currentPath === '/') ||
          (routePath !== '/' && currentPath.startsWith(routePath))}
        <a
          href={routePath}
          class="group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative
            {isCurrent ? 'text-white shadow-lg' : 'hover:scale-[1.02] hover:shadow-md'}"
          style="
            {isCurrent
            ? 'background: var(--color-primary);'
            : 'color: var(--color-text-secondary); background: transparent;'}
          "
          title={isCollapsed ? item.name : ''}
        >
          {#if isCurrent}
            <div
              class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
            ></div>
          {/if}
          {#if item.icon}
            <item.icon size={20} class="flex-shrink-0 {isCurrent ? 'text-white' : ''}" />
          {/if}
          {#if !isCollapsed}
            <span class="ml-3 font-medium" class:text-white={isCurrent}>{item.name}</span>
          {/if}
          {#if isCurrent && !isCollapsed}
            <div class="ml-auto">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
          {/if}
        </a>
      {/each}
    </nav>
  </div>
</aside>
