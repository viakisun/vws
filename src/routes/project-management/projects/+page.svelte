<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Progress from '$lib/components/ui/Progress.svelte'
  import { projectsStore } from '$lib/stores/rnd'
  import { formatKRW } from '$lib/utils/format'
  let query = $state('')
  const projects = $derived(
    $projectsStore.filter(p => (query ? p.name.includes(query) || p.id.includes(query) : true))
  )
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

<div class="space-y-3">
  {#each projects as p}
    <Card>
      <a
        class="flex items-center justify-between gap-4 hover:bg-gray-50 rounded-md px-2 py-2 transition-colors"
        href={`/project-management/projects/${p.id}`}
      >
        <div>
          <div class="text-sm font-semibold">{p.name}</div>
          <div class="text-caption">{p.id}</div>
        </div>
        <div class="hidden sm:block text-sm text-right">
          <div>예산 {formatKRW(p.budgetKRW)}</div>
          <div class="text-caption">집행 {formatKRW(p.spentKRW)}</div>
        </div>
        <div class="w-48"><Progress value={p.progressPct} /></div>
        <Badge
          color={p.status === '지연'
            ? 'yellow'
            : p.status === '위험'
            ? 'red'
            : p.status === '진행중'
            ? 'blue'
            : 'green'}>{p.status}</Badge
        >
      </a>
    </Card>
  {/each}
</div>
