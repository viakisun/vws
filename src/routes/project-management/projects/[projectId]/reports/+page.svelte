<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Card from '$lib/components/ui/Card.svelte'

  type RStatus = '작성중' | '제출' | '반려'
  interface Report {
    id: string
    title: string
    status: RStatus
    period: string
    submittedAt?: string
  }

  const projectId = page.params.projectId as string
  let items: Report[] = [
    {
      id: `${projectId}-R1`,
      title: '9월 월간 진도보고',
      status: '제출',
      period: '2025-09',
      submittedAt: '2025-10-02'
    },
    { id: `${projectId}-R2`, title: '10월 월간 진도보고', status: '작성중', period: '2025-10' },
    {
      id: `${projectId}-R3`,
      title: '분기 성과보고(Q3)',
      status: '반려',
      period: '2025-Q3',
      submittedAt: '2025-10-05'
    }
  ]

  let status = $state('') as '' | RStatus
  let query = $state('')

  let lastQuery = $state('')
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search)
    status = (sp.get('status') as typeof status) ?? ''
    query = sp.get('q') ?? ''
    lastQuery = sp.toString()
  }
  $effect(() => {
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
          noScroll: true
        })
      }
    }
  })

  const filtered = $derived(
    items.filter(
      r => (status ? r.status === status : true) && (query ? r.title.includes(query) : true)
    )
  )

  function colorOf(s: RStatus): 'green' | 'blue' | 'yellow' | 'red' {
    if (s === '제출') return 'green'
    if (s === '작성중') return 'blue'
    if (s === '반려') return 'red'
    return 'yellow'
  }

  let loading = $state(true)
  if (typeof window !== 'undefined') {
    setTimeout(() => (loading = false), 300)
  }

  function exportCSV() {
    const header = 'id,title,status,period,submittedAt\n'
    const rows = filtered
      .map(r => `${r.id},${r.title},${r.status},${r.period},${r.submittedAt ?? ''}`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectId}-reports.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
</script>

<h3 class="text-lg font-semibold mb-3">Progress Reports · {projectId}</h3>

<Card>
  <div class="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center">
    <input
      class="w-full sm:w-64 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      placeholder="보고서 검색"
      bind:value={query}
    />
    <select
      class="w-full sm:w-48 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
      bind:value={status}
    >
      <option value="">상태: 전체</option>
      <option value="작성중">작성중</option>
      <option value="제출">제출</option>
      <option value="반려">반려</option>
    </select>
    <button
      type="button"
      class="ml-auto px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50"
      onclick={exportCSV}>CSV 내보내기</button
    >
  </div>
  {#if loading}
    <div class="space-y-2">
      {#each Array(8) as _}
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
            <th class="px-3 py-2">기간</th>
            <th class="px-3 py-2">제출일</th>
            <th class="px-3 py-2">상태</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          {#each filtered as r}
            <tr>
              <td class="px-3 py-2">{r.id}</td>
              <td class="px-3 py-2">{r.title}</td>
              <td class="px-3 py-2">{r.period}</td>
              <td class="px-3 py-2">{r.submittedAt ?? '-'}</td>
              <td class="px-3 py-2"><Badge color={colorOf(r.status)}>{r.status}</Badge></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>
