<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import { onMount } from 'svelte'

  type CStatus = '충족' | '미비' | '검토중'
  interface Rule {
    id: string
    category: '인건비' | '재료비' | '연구활동비' | '여비' | '보고'
    title: string
    status: CStatus
    note?: string
  }

  const projectId = page.params.projectId as string
  let rules: Rule[] = [
    {
      id: `${projectId}-C1`,
      category: '인건비',
      title: '급여명세서 보관',
      status: '충족',
    },
    {
      id: `${projectId}-C2`,
      category: '여비',
      title: '출장보고서 첨부',
      status: '미비',
      note: '보고서 누락',
    },
    {
      id: `${projectId}-C3`,
      category: '보고',
      title: '월간 진도보고 제출',
      status: '검토중',
    },
  ]

  let cat = $state('') as '' | Rule['category']
  let status = $state('') as '' | CStatus
  let query = $state('')

  let lastQuery = $state('')
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search)
    cat = (sp.get('cat') as typeof cat) ?? ''
    status = (sp.get('status') as typeof status) ?? ''
    query = sp.get('q') ?? ''
    lastQuery = sp.toString()
  }
  function _updateData() {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      if (cat) sp.set('cat', cat)
      else sp.delete('cat')
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
    rules.filter(
      (r) =>
        (cat ? r.category === cat : true) &&
        (status ? r.status === status : true) &&
        (query ? r.title.includes(query) : true),
    ),
  )

  function colorOf(s: CStatus): 'green' | 'yellow' | 'red' {
    if (s === '충족') return 'green'
    if (s === '검토중') return 'yellow'
    return 'red'
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

<h3 class="text-lg font-semibold mb-3">Compliance Monitoring · {projectId}</h3>

<Card>
  <div class="mb-3 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
    <input
      class="rounded-md border border-gray-200 px-2 py-1"
      placeholder="규정 검색"
      bind:value={query}
    />
    <select class="rounded-md border border-gray-200 px-2 py-1" bind:value={cat}>
      <option value="">카테고리: 전체</option>
      <option value="인건비">인건비</option>
      <option value="재료비">재료비</option>
      <option value="연구활동비">연구활동비</option>
      <option value="여비">여비</option>
      <option value="보고">보고</option>
    </select>
    <select class="rounded-md border border-gray-200 px-2 py-1" bind:value={status}>
      <option value="">상태: 전체</option>
      <option value="충족">충족</option>
      <option value="검토중">검토중</option>
      <option value="미비">미비</option>
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
            <th class="px-3 py-2">카테고리</th>
            <th class="px-3 py-2">규정</th>
            <th class="px-3 py-2">상태</th>
            <th class="px-3 py-2">비고</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          {#each filtered as r, i (i)}
            <tr>
              <td class="px-3 py-2">{r.id}</td>
              <td class="px-3 py-2">{r.category}</td>
              <td class="px-3 py-2">{r.title}</td>
              <td class="px-3 py-2"><Badge color={colorOf(r.status)}>{r.status}</Badge></td>
              <td class="px-3 py-2 text-gray-500">{r.note ?? '-'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>
