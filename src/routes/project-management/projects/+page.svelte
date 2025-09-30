<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Progress from '$lib/components/ui/Progress.svelte'
  import { formatKRW } from '$lib/utils/format'
  import { getProjectStatusColor } from '$lib/utils/project-status'
  import { logger } from '$lib/utils/logger'
  import { onMount } from 'svelte'

  let query = $state('')
  let allProjects = $state<any[]>([])
  let loading = $state(true)

  const projects = $derived.by(() => {
    return allProjects.filter((p) =>
      query ? (p.title || '').includes(query) || (p.code || '').includes(query) : true,
    )
  })

  async function loadProjects() {
    try {
      loading = true
      const response = await fetch('/api/project-management/projects')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          allProjects = data.data || []
          logger.log(`${allProjects.length}개 프로젝트 로드 완료`)
        }
      }
    } catch (error) {
      logger.error('프로젝트 로드 실패:', error)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadProjects()
  })
</script>

<h2 class="text-lg font-semibold mb-3">Projects</h2>

<div class="mb-3">
  <input
    class="w-full sm:w-72 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    placeholder="프로젝트 검색 (이름/ID)"
    bind:value={query}
  />
  <div class="text-caption mt-1">{projects.length}개 표시</div>
</div>

{#if loading}
  <div class="text-center py-8" style:color="var(--color-text-secondary)">
    프로젝트를 불러오는 중...
  </div>
{:else if projects.length === 0}
  <div class="text-center py-8" style:color="var(--color-text-secondary)">
    {query ? '검색 결과가 없습니다.' : '프로젝트가 없습니다.'}
  </div>
{:else}
  <div class="space-y-3">
    {#each projects as p, i (i)}
      <Card>
        <a
          class="flex items-center justify-between gap-4 hover:bg-gray-50 rounded-md px-2 py-2 transition-colors"
          href={`/project-management/projects/${p.id}`}
        >
          <div>
            <div class="text-sm font-semibold">{p.title || p.name}</div>
            <div class="text-caption">{p.code || p.id}</div>
          </div>
          <div class="hidden sm:block text-sm text-right">
            <div>예산 {formatKRW(p.budgetTotal || p.budgetKRW || 0)}</div>
            <div class="text-caption">상태: {p.status}</div>
          </div>
          <Badge color={getProjectStatusColor(p.status)}>{p.status}</Badge>
        </a>
      </Card>
    {/each}
  </div>
{/if}
