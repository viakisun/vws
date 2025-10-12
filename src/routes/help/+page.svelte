<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import ThemeMarkdown from '$lib/components/ui/ThemeMarkdown.svelte'
  import { BookOpenIcon } from 'lucide-svelte'

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

  // 매뉴얼 로드
  async function loadManual(manual: (typeof manuals)[0]) {
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

<div class="flex gap-6 h-full">
  <!-- 좌측 네비게이션 -->
  <aside class="w-64 flex-shrink-0">
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sticky top-0"
      style:border="1px solid var(--color-border)"
    >
      <div
        class="flex items-center gap-2 mb-4 pb-3 border-b"
        style:border-color="var(--color-border)"
      >
        <BookOpenIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 class="text-lg font-semibold" style:color="var(--color-text)">사용자 매뉴얼</h2>
      </div>
      <nav>
        <ul class="space-y-1">
          {#each manuals as manual}
            <li>
              <button
                class="w-full text-left px-3 py-2 rounded-lg transition-colors {selectedId ===
                manual.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'}"
                style:color={selectedId === manual.id ? undefined : 'var(--color-text)'}
                onclick={() => selectManual(manual.id)}
              >
                {manual.title}
              </button>
            </li>
          {/each}
        </ul>
      </nav>
    </div>
  </aside>

  <!-- 메인 콘텐츠 -->
  <main class="flex-1 min-w-0">
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
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8"
        style:border="1px solid var(--color-border)"
      >
        <ThemeMarkdown {content} />
      </div>
    {/if}
  </main>
</div>
