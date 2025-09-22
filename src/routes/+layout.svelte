<script lang="ts">
  import '../app.css'
  import Header from '$lib/components/layout/Header.svelte'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import { toasts } from '$lib/stores/toasts'
  import { themeManager, currentTheme, isDark } from '$lib/stores/theme'
  import { onMount } from 'svelte'

  let { children } = $props()
  let sidebarCollapsed = $state(true)

  // Initialize theme on mount
  onMount(() => {
    themeManager.applyTheme()
  })
</script>

<div class="h-screen flex flex-col overflow-hidden" style="background: var(--color-background);">
  <!-- Header -->
  <Header />

  <!-- Main content area with sidebar -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Sidebar -->
    <Sidebar bind:isCollapsed={sidebarCollapsed} />

    <!-- Main content -->
    <main class="flex-1 p-6 overflow-auto" style="background: var(--color-background);">
      <div class="max-w-7xl mx-auto">
        {@render children()}
      </div>
    </main>
  </div>
</div>

<!-- Toast notifications -->
{#if $toasts.length}
  <div class="fixed bottom-4 right-4 space-y-2 z-50" aria-live="polite" aria-atomic="true">
    {#each $toasts as t}
      <div
        class="px-4 py-3 rounded-lg shadow-lg border text-sm transition-all duration-300"
        style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
        class:text-green-600={t.type === 'success'}
        class:text-red-600={t.type === 'error'}
        class:text-blue-600={t.type === 'info'}
      >
        {t.message}
      </div>
    {/each}
  </div>
{/if}

<style>
  /* Layout handled by CSS variables and Tailwind */
</style>
