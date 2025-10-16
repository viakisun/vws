<script lang="ts">
  import { goto } from '$app/navigation'
  import Header from '$lib/components/layout/Header.svelte'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import VersionInfo from '$lib/components/ui/VersionInfo.svelte'
  import { clearPermissions, initializePermissions } from '$lib/stores/permissions'
  import { themeManager } from '$lib/stores/theme'
  import { toasts } from '$lib/stores/toasts'
  import { logger } from '$lib/utils/logger'
  import { onMount } from 'svelte'
  import '../app.css'
  import type { LayoutServerData } from './$types'

  const { children, data }: { children: any; data: LayoutServerData } = $props()
  let sidebarCollapsed = $state(true)
  let user = $state(data.user)

  // Initialize theme and permissions on mount
  onMount(() => {
    themeManager.applyTheme()

    // Initialize permissions store if user is logged in
    if (data.permissions) {
      initializePermissions(data.permissions)
    }
  })

  // Handle logout
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      user = null
      clearPermissions() // Clear permissions store
      goto('/login')
    } catch (error) {
      logger.error('Logout error:', error)
    }
  }
</script>

<div class="h-screen flex flex-col overflow-hidden" style:background="var(--color-background)">
  <!-- Header -->
  <Header {user} onLogout={handleLogout} />

  <!-- Main content area with sidebar -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Sidebar -->
    <Sidebar bind:isCollapsed={sidebarCollapsed} {user} />

    <!-- Main content -->
    <main class="flex-1 p-6 overflow-auto" style:background="var(--color-background)">
      <div class="max-w-7xl mx-auto">
        {@render children()}
      </div>
    </main>
  </div>

  <!-- Footer with version info -->
  <footer class="border-t px-6 py-2" style:border-color="var(--color-border)">
    <div class="flex justify-between items-center">
      <VersionInfo />
      <div class="text-xs text-gray-400">© 2025 VWS. Powered by VIASOFT.AI</div>
    </div>
  </footer>
</div>

<!-- Toast notifications -->
{#if $toasts.length}
  <div
    class="fixed top-4 right-4 space-y-2 z-50 pointer-events-none"
    aria-live="polite"
    aria-atomic="true"
  >
    {#each $toasts as t (t.id)}
      <div
        class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm transition-all duration-300 min-w-[320px] max-w-md animate-slide-in"
        class:bg-green-50={t.type === 'success'}
        class:border-green-200={t.type === 'success'}
        class:text-green-800={t.type === 'success'}
        class:bg-red-50={t.type === 'error'}
        class:border-red-200={t.type === 'error'}
        class:text-red-800={t.type === 'error'}
        class:bg-blue-50={t.type === 'info'}
        class:border-blue-200={t.type === 'info'}
        class:text-blue-800={t.type === 'info'}
      >
        {#if t.type === 'success'}
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        {:else if t.type === 'error'}
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        {:else}
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        {/if}
        <p class="flex-1 font-medium">{t.message}</p>
      </div>
    {/each}
  </div>
{/if}

<style>
  /* Layout handled by CSS variables and Tailwind */

  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
</style>
