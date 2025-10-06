<script lang="ts">
  import type { User } from '$lib/auth/user-service'
  import ThemeAvatar from '$lib/components/ui/ThemeAvatar.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeDropdown from '$lib/components/ui/ThemeDropdown.svelte'
  import { isDark, themeManager } from '$lib/stores/theme'
  import { logger } from '$lib/utils/logger'
  import {
    BellIcon,
    BuildingIcon,
    LogOutIcon,
    MoonIcon,
    SettingsIcon,
    SunIcon,
    UserIcon,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'

  let { user = null, onLogout }: { user: User | null; onLogout: () => void } = $props()

  // Notification state
  let showNotifications = $state(false)
  let showUserMenu = $state(false)
  let notificationsContainer: HTMLElement | undefined
  let userMenuContainer: HTMLElement | undefined
  let userMenuButton: any
  let unreadCount = $state(3)

  // Company information
  let companyName = $state('(주)비아')
  let companyLoading = $state(false)

  // Toggle notifications
  function toggleNotifications() {
    showNotifications = !showNotifications
    showUserMenu = false
  }

  // Toggle user menu
  function toggleUserMenu() {
    console.log('User menu toggle clicked, current state:', showUserMenu)
    showUserMenu = !showUserMenu
    showNotifications = false
    console.log('User menu state after toggle:', showUserMenu)
  }

  // Close dropdowns when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (notificationsContainer && !notificationsContainer.contains(event.target as HTMLElement)) {
      showNotifications = false
    }
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
    <!-- Theme Toggle -->
    <ThemeButton
      variant="ghost"
      size="sm"
      onclick={() => themeManager.toggleTheme()}
      class="p-3 rounded-xl hover:shadow-lg transition-all duration-300 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 hover:scale-105 group"
    >
      <div class="relative">
        {#if $isDark}
          <SunIcon
            size={22}
            class="transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12"
          />
        {:else}
          <MoonIcon
            size={22}
            class="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12"
          />
        {/if}
      </div>
    </ThemeButton>

    <!-- Notifications -->
    <div class="relative" bind:this={notificationsContainer}>
      <ThemeButton
        variant="ghost"
        size="sm"
        onclick={toggleNotifications}
        class="relative p-3 rounded-xl hover:shadow-lg transition-all duration-300 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 hover:scale-105 group {showNotifications
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : ''}"
      >
        <div class="relative">
          <BellIcon
            size={22}
            class="transition-transform duration-200 {showNotifications
              ? 'animate-pulse'
              : 'group-hover:scale-110'}"
          />
          {#if unreadCount > 0}
            <span
              class="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          {/if}
        </div>
      </ThemeButton>

      {#if showNotifications}
        <ThemeDropdown
          class="absolute top-full right-0 mt-3 w-96 z-50 shadow-2xl border-0"
          position="top-right"
          open={showNotifications}
          onchange={(open) => (showNotifications = open)}
        >
          <div
            class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">알림</h3>
              <span class="text-sm text-gray-500 dark:text-gray-400">{unreadCount}개 읽지 않음</span
              >
            </div>
          </div>
          <div class="max-h-80 overflow-y-auto">
            <div
              class="px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-700 border-b border-gray-100 transition-all duration-200 cursor-pointer group"
            >
              <div class="flex items-start space-x-3">
                <div
                  class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"
                ></div>
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                  >
                    새로운 프로젝트 승인 요청
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PSR팀에서 새로운 연구 프로젝트 승인을 요청했습니다.
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">2분 전</p>
                </div>
              </div>
            </div>
            <div
              class="px-6 py-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-gray-800 dark:hover:to-gray-700 border-b border-gray-100 transition-all duration-200 cursor-pointer group"
            >
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"
                  >
                    월간 보고서 제출 마감
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    이번 달 연구 보고서 제출 마감이 3일 남았습니다.
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">1시간 전</p>
                </div>
              </div>
            </div>
            <div
              class="px-6 py-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200 cursor-pointer group"
            >
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"
                  >
                    팀 회의 일정 변경
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    내일 오전 10시 팀 회의가 오후 2시로 변경되었습니다.
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">3시간 전</p>
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 py-3 border-t border-gray-100 bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              class="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              모든 알림 보기
            </button>
          </div>
        </ThemeDropdown>
      {/if}
    </div>

    <!-- User Profile -->
    <div class="relative" bind:this={userMenuContainer}>
      <ThemeButton
        variant="ghost"
        size="sm"
        onclick={toggleUserMenu}
        class="flex items-center space-x-3 p-3 rounded-xl hover:shadow-lg transition-all duration-300 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 hover:scale-105 group {showUserMenu
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : ''}"
        bind:this={userMenuButton}
      >
        <div class="relative">
          <ThemeAvatar
            src={user?.picture || ''}
            size="md"
            fallback={user?.name?.charAt(0) || 'U'}
            class="ring-2 ring-transparent group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all duration-300"
          />
          <div
            class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"
          ></div>
        </div>
        <div class="text-left hidden sm:block">
          <p
            class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            {user?.name || '사용자'}
          </p>
          <p
            class="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
          >
            {user?.role || 'EMPLOYEE'} • 온라인
          </p>
        </div>
      </ThemeButton>

      {#if showUserMenu}
        <div
          class="absolute top-full right-0 mt-3 w-72 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700"
        >
          <div
            class="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700"
          >
            <div class="flex items-center space-x-4">
              <div class="relative">
                <ThemeAvatar
                  src={user?.picture || ''}
                  size="lg"
                  fallback={user?.name?.charAt(0) || 'U'}
                  class="ring-4 ring-white dark:ring-gray-700 shadow-lg"
                />
                <div
                  class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full"
                ></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.name || '사용자'}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {user?.role || 'EMPLOYEE'} • {user?.email || ''}
                </p>
                <p class="text-xs text-green-600 dark:text-green-400 font-medium mt-1">● 온라인</p>
              </div>
            </div>
          </div>
          <div class="py-2">
            <a
              href="/profile"
              class="flex items-center px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200 group"
            >
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors"
              >
                <UserIcon class="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="font-medium">프로필</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">개인 정보 및 설정</p>
              </div>
            </a>
            <a
              href="/settings"
              class="flex items-center px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200 group"
            >
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 mr-3 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors"
              >
                <SettingsIcon class="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p class="font-medium">설정</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">계정 및 시스템 설정</p>
              </div>
            </a>
            <div class="border-t border-gray-100 dark:border-gray-700 my-2"></div>
            <button
              onclick={onLogout}
              class="flex items-center w-full px-6 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-200 group"
            >
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 mr-3 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors"
              >
                <LogOutIcon class="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p class="font-medium">로그아웃</p>
                <p class="text-xs text-red-500 dark:text-red-400">계정에서 로그아웃</p>
              </div>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</header>
