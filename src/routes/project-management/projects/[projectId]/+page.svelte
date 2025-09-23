<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Progress from '$lib/components/ui/Progress.svelte'
  import { projectsStore } from '$lib/stores/rnd'
  import { page } from '$app/state'
  import { formatKRW } from '$lib/utils/format'

  const projectId = page.params.projectId
  const project = $derived($projectsStore.find(p => p.id === projectId))
</script>

<h2 class="text-lg font-semibold mb-3">Project {projectId}</h2>

{#if project}
  <Card>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <div class="text-caption">이름</div>
        <div class="font-semibold">{project.name}</div>
      </div>
      <div>
        <div class="text-caption">상태</div>
        <Badge
          color={project.status === '지연'
            ? 'yellow'
            : project.status === '위험'
            ? 'red'
            : project.status === '진행중'
            ? 'blue'
            : 'green'}>{project.status}</Badge
        >
      </div>
      <div>
        <div class="text-caption">진행률</div>
        <div class="w-48"><Progress value={project.progressPct} /></div>
      </div>
      <div>
        <div class="text-caption">예산</div>
        <div class="font-semibold">{formatKRW(project.budgetKRW)}</div>
      </div>
      <div>
        <div class="text-caption">집행</div>
        <div class="font-semibold">{formatKRW(project.spentKRW)}</div>
      </div>
      <div>
        <div class="text-caption">기간</div>
        <div class="font-semibold">{project.startDate} ~ {project.dueDate}</div>
      </div>
    </div>
  </Card>
{/if}
<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
  <a
    class="card hover:bg-gray-50"
    href="budget">Budget</a>
  <a
    class="card hover:bg-gray-50"
    href="personnel">Personnel</a>
  <a
    class="card hover:bg-gray-50"
    href="expenses">Expenses</a>
  <a
    class="card hover:bg-gray-50"
    href="deliverables">Deliverables</a>
  <a
    class="card hover:bg-gray-50"
    href="reports">Reports</a>
  <a
    class="card hover:bg-gray-50"
    href="compliance">Compliance</a>
</div>
