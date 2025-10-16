<script lang="ts">
  import type { User } from '$lib/auth/user-service'
  import NotificationBell from '$lib/components/notifications/NotificationBell.svelte'
  import ThemeAvatar from '$lib/components/ui/ThemeAvatar.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { logger } from '$lib/utils/logger'
  import { BuildingIcon, LogOutIcon, SettingsIcon, UserIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  const { user = null, onLogout }: { user: User | null; onLogout: () => void } = $props()

  // User menu state
  let showUserMenu = $state(false)
  let userMenuContainer: HTMLElement | undefined
  let userMenuButton: any

  // Company information
  let companyName = $state('(주)비아')
  let companyLoading = $state(false)

  // Toggle user menu
  function toggleUserMenu() {
    logger.info('User menu toggle clicked, current state:', showUserMenu)
    showUserMenu = !showUserMenu
    logger.info('User menu state after toggle:', showUserMenu)
  }

  // Close dropdowns when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (userMenuContainer && !userMenuContainer.contains(event.target as HTMLElement)) {
      showUserMenu = false
    }
  }

  onMount(() => {
    fetchCompanyName()
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  })

  // 회사 정보 가져오기
  async function fetchCompanyName() {
    try {
      companyLoading = true
      const response = await window.fetch('/api/company')
      if (response.ok) {
        const result = await response.json()
        if (result.data && result.data.name) {
          companyName = result.data.name
        }
      }
    } catch (err) {
      logger.error('Error fetching company name:', err)
    } finally {
      companyLoading = false
    }
  }
</script>

<header
  class="h-16 flex items-center justify-between px-6 border-b"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <!-- Left Section: Logo & Brand -->
  <div class="flex items-center space-x-4">
    <!-- Logo -->
    <div class="flex items-center space-x-3">
      <div
        class="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg"
      >
        <BuildingIcon class="h-6 w-6 text-white" />
      </div>
      <div class="flex flex-col">
        <span class="text-lg font-bold" style:color="var(--color-text)"> WorkStream </span>
        <span class="text-xs" style:color="var(--color-text-secondary)">
          {companyLoading ? '로딩 중...' : companyName}
        </span>
      </div>
    </div>
  </div>

  <!-- Right Section: Actions & User -->
  <div class="flex items-center space-x-3">
    <!-- Notifications -->
    <NotificationBell />

    <!-- User Profile -->
    <div class="relative" bind:this={userMenuContainer}>
      <ThemeButton
        variant="ghost"
        size="sm"
        onclick={toggleUserMenu}
        class="flex items-center space-x-3 p-3 rounded-xl hover:shadow-lg transition-all duration-300 text-gray-600 hover:text-gray-800 hover:scale-105 group {showUserMenu
          ? 'bg-blue-50'
          : ''}"
        bind:this={userMenuButton}
      >
        <div class="relative">
          <ThemeAvatar
            src={user?.picture || ''}
            size="md"
            fallback={user?.name?.charAt(0) || 'U'}
            class="ring-2 ring-transparent group-hover:ring-blue-200 transition-all duration-300"
          />
          <div
            class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"
          ></div>
        </div>
        <div class="text-left hidden sm:block">
          <p
            class="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors"
          >
            {user?.name || '사용자'}
          </p>
          <p class="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
            {user?.role || 'EMPLOYEE'} • 온라인
          </p>
        </div>
      </ThemeButton>

      {#if showUserMenu}
        <div
          class="absolute top-full right-0 mt-3 w-72 z-50 bg-white rounded-lg shadow-2xl border border-gray-200"
        >
          <div
            class="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div class="flex items-center space-x-4">
              <div class="relative">
                <ThemeAvatar
                  src={user?.picture || ''}
                  size="lg"
                  fallback={user?.name?.charAt(0) || 'U'}
                  class="ring-4 ring-white shadow-lg"
                />
                <div
                  class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"
                ></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-lg font-semibold text-gray-900">
                  {user?.name || '사용자'}
                </p>
                <p class="text-sm text-gray-500">
                  {user?.role || 'EMPLOYEE'} • {user?.email || ''}
                </p>
                <p class="text-xs text-green-600 font-medium mt-1">● 온라인</p>
              </div>
            </div>
          </div>
          <div class="py-2">
            <a
              href="/profile"
              class="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
            >
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 mr-3 group-hover:bg-blue-200 transition-colors"
              >
                <UserIcon class="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p class="font-medium">프로필</p>
                <p class="text-xs text-gray-500">개인 정보 및 설정</p>
              </div>
            </a>
            <a
              href="/settings"
              class="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 transition-all duration-200 group"
            >
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 mr-3 group-hover:bg-gray-200 transition-colors"
              >
                <SettingsIcon class="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p class="font-medium">설정</p>
                <p class="text-xs text-gray-500">계정 및 시스템 설정</p>
              </div>
            </a>
            <div class="border-t border-gray-100 my-2"></div>
            <button
              type="button"
              onclick={onLogout}
              class="flex items-center w-full px-6 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 group"
            >
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 mr-3 group-hover:bg-red-200 transition-colors"
              >
                <LogOutIcon class="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p class="font-medium">로그아웃</p>
                <p class="text-xs text-red-500">계정에서 로그아웃</p>
              </div>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</header>
