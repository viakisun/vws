<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import { onMount } from 'svelte'

  type DStatus = '준비' | '진행' | '완료' | '지연'
  interface Deliverable {
    id: string
    title: string
    status: DStatus
    due: string
    owner: string
  }

  const projectId = page.params.projectId as string
  // mock per-project deliverables
  let items: Deliverable[] = [
    {
      id: `${projectId}-D1`,
      title: '중간보고서',
      status: '진행',
      due: '2025-11-15',
      owner: '김철수',
    },
    {
      id: `${projectId}-D2`,
      title: '프로토타입 v1',
      status: '지연',
      due: '2025-12-01',
      owner: '이영희',
    },
    {
      id: `${projectId}-D3`,
      title: '최종보고서',
      status: '준비',
      due: '2026-05-31',
      owner: '박민수',
    },
  ]

  let status = $state('') as '' | DStatus
  let query = $state('')

  // initial read
  let lastQuery = $state('')
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search)
    status = (sp.get('status') as typeof status) ?? ''
    query = sp.get('q') ?? ''
    lastQuery = sp.toString()
  }
  // sync to URL
  function _updateData() {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      if (status) sp.set('status', status)
      else sp.delete('status')
      if (query) sp.set('q', query)
      else sp.delete('q')
      const newQuery = sp.toString()
      if (newQuery !== lastQuery) {
        lastQuery = newQuery
        goto(`${window.location.pathname}?${newQuery}`, {
          replaceState: true,
          keepFocus: true,
          noScroll: true,
        })
      }
    }
  }

  const filtered = $derived(
    items.filter(
      (d) => (status ? d.status === status : true) && (query ? d.title.includes(query) : true),
    ),
  )

  function colorOf(s: DStatus): 'green' | 'blue' | 'yellow' | 'red' {
    if (s === '완료') return 'green'
    if (s === '진행') return 'blue'
    if (s === '지연') return 'red'
    return 'yellow'
  }

  let loading = $state(true)
  if (typeof window !== 'undefined') {
    setTimeout(() => (loading = false), 300)
  }

  // 컴포넌트 마운트 시 초기화
  onMount(() => {
    // 초기화 함수들 호출
  })
</script>

<h3 class="text-lg font-semibold mb-3">Deliverables · {projectId}</h3>

<Card>
  <div class="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center">
    <input
      class="w-full sm:w-64 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      placeholder="항목 검색"
      bind:value={query}
    />
    <select
      class="w-full sm:w-48 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
      bind:value={status}
    >
      <option value="">상태: 전체</option>
      <option value="준비">준비</option>
      <option value="진행">진행</option>
      <option value="완료">완료</option>
      <option value="지연">지연</option>
    </select>
  </div>
  {#if loading}
    <div class="space-y-2">
      {#each Array(8) as _, idx (idx)}
        <!-- TODO: replace index key with a stable id when model provides one -->
        <div class="h-8 bg-gray-100 animate-pulse rounded"></div>
      {/each}
    </div>
  {:else}
    <div class="overflow-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-left text-gray-600">
          <tr>
            <th class="px-3 py-2">ID</th>
            <th class="px-3 py-2">제목</th>
            <th class="px-3 py-2">담당</th>
            <th class="px-3 py-2">마감</th>
            <th class="px-3 py-2">상태</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          {#each filtered as d, i (i)}
            <tr>
              <td class="px-3 py-2">{d.id}</td>
              <td class="px-3 py-2">{d.title}</td>
              <td class="px-3 py-2">{d.owner}</td>
              <td class="px-3 py-2">{d.due}</td>
              <td class="px-3 py-2"><Badge color={colorOf(d.status)}>{d.status}</Badge></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>
