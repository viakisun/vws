<script lang="ts">
  import { page } from '$app/stores'
  import type { User } from '$lib/auth/user-service'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { menuAccess, can, RoleCode, Resource } from '$lib/stores/permissions'
  import {
    BanknoteIcon,
    BarChart3Icon,
    BriefcaseIcon,
    BuildingIcon,
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DollarSignIcon,
    FileTextIcon,
    FlaskConicalIcon,
    HomeIcon,
    MessageSquareIcon,
    SettingsIcon,
    UsersIcon,
    ShieldIcon,
    TargetIcon,
  } from '@lucide/svelte'

  let { isCollapsed = $bindable(true), user = null } = $props<{
    isCollapsed?: boolean
    user?: User | null
  }>()

  interface NavItem {
    name: string
    href: string
    icon: any
    permission?: {
      resource?: string
      roles?: RoleCode[]
    }
  }

  const navigationItems: NavItem[] = [
    {
      name: '대시보드',
      href: '/dashboard',
      icon: HomeIcon,
    },
    {
      name: '재무관리',
      href: '/finance',
      icon: BanknoteIcon,
      permission: { resource: Resource.FINANCE_ACCOUNTS },
    },
    {
      name: '급여관리',
      href: '/salary',
      icon: DollarSignIcon,
      permission: { resource: Resource.HR_PAYSLIPS },
    },
    {
      name: '인사관리',
      href: '/hr',
      icon: UsersIcon,
      permission: { resource: Resource.HR_EMPLOYEES },
    },
    {
      name: '연구개발',
      href: '/project-management',
      icon: FlaskConicalIcon,
      permission: {
        roles: [RoleCode.RESEARCH_DIRECTOR, RoleCode.RESEARCHER, RoleCode.ADMIN],
      },
    },
    {
      name: 'Planner',
      href: '/planner',
      icon: TargetIcon,
      permission: {
        roles: [RoleCode.RESEARCH_DIRECTOR, RoleCode.RESEARCHER, RoleCode.ADMIN],
      },
    },
    {
      name: '영업관리',
      href: '/sales',
      icon: BriefcaseIcon,
      permission: {
        roles: [RoleCode.SALES, RoleCode.MANAGEMENT, RoleCode.ADMIN],
      },
    },
    {
      name: '고객관리',
      href: '/crm',
      icon: BuildingIcon,
      permission: {
        roles: [RoleCode.SALES, RoleCode.MANAGEMENT, RoleCode.ADMIN],
      },
    },
    { name: '일정관리', href: '/calendar', icon: CalendarIcon },
    {
      name: '보고서',
      href: '/reports',
      icon: FileTextIcon,
      permission: {
        roles: [RoleCode.MANAGEMENT, RoleCode.RESEARCH_DIRECTOR, RoleCode.ADMIN],
      },
    },
    {
      name: '분석',
      href: '/analytics',
      icon: BarChart3Icon,
      permission: {
        roles: [RoleCode.MANAGEMENT, RoleCode.FINANCE_MANAGER, RoleCode.ADMIN],
      },
    },
    { name: '메시지', href: '/messages', icon: MessageSquareIcon },
    { name: '설정', href: '/settings', icon: SettingsIcon },
    {
      name: '권한관리',
      href: '/admin/permissions',
      icon: ShieldIcon,
      permission: {
        roles: [RoleCode.ADMIN],
      },
    },
  ]

  // 사용자 권한에 따른 메뉴 필터링
  const filteredNavigationItems = $derived(
    navigationItems.filter((item) => {
      // 권한 설정이 없는 경우 모두에게 표시
      if (!item.permission) {
        return true
      }

      // 리소스 권한 체크
      if (item.permission.resource) {
        if (!$can.read(item.permission.resource)) {
          return false
        }
      }

      // 역할 권한 체크
      if (item.permission.roles && item.permission.roles.length > 0) {
        if (!$can.hasAnyRole(item.permission.roles)) {
          return false
        }
      }

      return true
    }),
  )

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
      {#each filteredNavigationItems as item (item.name)}
        {@const currentPath = $page?.url?.pathname || ''}
        {@const isCurrent =
          (item.href === '/' && currentPath === '/') ||
          (item.href !== '/' && currentPath.startsWith(item.href))}
        <a
          href={item.href}
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
