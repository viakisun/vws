<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import ThemeMarkdown from '$lib/components/ui/ThemeMarkdown.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { BookOpenIcon, MenuIcon } from 'lucide-svelte'

  // 매뉴얼 목록
  const manuals = [
    { id: 'dashboard', title: '대시보드', file: 'HELP-dashboard.md' },
    { id: 'attendance', title: '출퇴근 관리', file: 'HELP-attendance.md' },
    { id: 'leave', title: '휴가 관리', file: 'HELP-leave.md' },
    { id: 'hr', title: '인사 관리', file: 'HELP-hr.md' },
    { id: 'salary', title: '급여 관리', file: 'HELP-salary.md' },
    { id: 'finance', title: '재무 관리', file: 'HELP-finance.md' },
    {
      id: 'research-development',
      title: '연구개발 사업 관리',
      file: 'HELP-research-development.md',
    },
    { id: 'planner', title: '플래너', file: 'HELP-planner.md' },
    { id: 'sales', title: '영업 관리', file: 'HELP-sales.md' },
    { id: 'settings', title: '시스템 설정', file: 'HELP-settings.md' },
  ]

  // URL 파라미터에서 선택된 매뉴얼 가져오기
  let selectedId = $derived($page.url.searchParams.get('section') || 'dashboard')
  let selectedManual = $derived(manuals.find((m) => m.id === selectedId) || manuals[0])

  // 매뉴얼 내용 상태
  let content = $state('')
  let loading = $state(true)
  let error = $state('')
  let sidebarOpen = $state(false)

  // 매뉴얼 로드
  async function loadManual(manual: typeof manuals[0]) {
    loading = true
    error = ''
    try {
      const response = await fetch(`/docs/manual/${manual.file}`)
      if (!response.ok) {
        throw new Error('매뉴얼을 찾을 수 없습니다.')
      }
      content = await response.text()
    } catch (e) {
      error = e instanceof Error ? e.message : '매뉴얼을 로드할 수 없습니다.'
      content = ''
    } finally {
      loading = false
    }
  }

  // 매뉴얼 선택
  function selectManual(id: string) {
    goto(`/help?section=${id}`, { replaceState: true })
    sidebarOpen = false
  }

  // 매뉴얼이 변경될 때마다 로드
  $effect(() => {
    if (selectedManual) {
      loadManual(selectedManual)
    }
  })
</script>

<svelte:head>
  <title>도움말 - VWS</title>
</svelte:head>

<div class="h-full flex bg-gray-50 dark:bg-gray-900">
  <!-- 사이드바 (데스크톱) -->
  <aside
    class="hidden lg:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col"
  >
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <BookOpenIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">사용자 매뉴얼</h2>
      </div>
    </div>
    <nav class="flex-1 overflow-y-auto p-4">
      <ul class="space-y-1">
        {#each manuals as manual}
          <li>
            <button
              class="w-full text-left px-3 py-2 rounded-lg transition-colors {selectedId ===
              manual.id
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
              onclick={() => selectManual(manual.id)}
            >
              {manual.title}
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  </aside>

  <!-- 모바일 사이드바 오버레이 -->
  {#if sidebarOpen}
    <div
      class="lg:hidden fixed inset-0 bg-black/50 z-40"
      onclick={() => (sidebarOpen = false)}
      role="button"
      tabindex="-1"
      aria-label="Close sidebar"
    ></div>
  {/if}

  <!-- 모바일 사이드바 -->
  <aside
    class="lg:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col z-50 transform transition-transform {sidebarOpen
      ? 'translate-x-0'
      : '-translate-x-full'}"
  >
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <BookOpenIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">사용자 매뉴얼</h2>
      </div>
      <button
        class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        onclick={() => (sidebarOpen = false)}
        aria-label="Close"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
    <nav class="flex-1 overflow-y-auto p-4">
      <ul class="space-y-1">
        {#each manuals as manual}
          <li>
            <button
              class="w-full text-left px-3 py-2 rounded-lg transition-colors {selectedId ===
              manual.id
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
              onclick={() => selectManual(manual.id)}
            >
              {manual.title}
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  </aside>

  <!-- 메인 콘텐츠 -->
  <main class="flex-1 overflow-y-auto">
    <div class="max-w-4xl mx-auto p-6">
      <!-- 모바일 메뉴 버튼 -->
      <div class="lg:hidden mb-4">
        <ThemeButton variant="secondary" onclick={() => (sidebarOpen = true)}>
          <MenuIcon class="w-4 h-4 mr-2" />
          매뉴얼 목록
        </ThemeButton>
      </div>

      <!-- 매뉴얼 제목 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {selectedManual.title}
        </h1>
        <div class="h-1 w-20 bg-blue-600 rounded"></div>
      </div>

      <!-- 매뉴얼 내용 -->
      {#if loading}
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      {:else if error}
        <div
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <p class="text-red-800 dark:text-red-200">{error}</p>
        </div>
      {:else}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <ThemeMarkdown {content} />
        </div>
      {/if}
    </div>
  </main>
</div>

