<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import { expenseDocsStore } from '$lib/stores/rnd'
  import type { ExpenseDocument } from '$lib/types'
  import { formatKRW } from '$lib/utils/format'
  import { onMount } from 'svelte'

  const projectId = page.params.projectId as string
  const all = $derived($expenseDocsStore.filter((d) => d.projectId === projectId))

  let status = $state('') as '' | '대기' | '승인' | '반려'
  let query = $state('')

  // read initial from URL
  let lastQuery = $state('')
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search)
    status = (sp.get('status') as typeof status) ?? ''
    query = sp.get('q') ?? ''
    lastQuery = sp.toString()
  }

  // sync to URL
  function updateData() {
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
    all.filter(
      (d) =>
        (status ? d.status === status : true) &&
        (query ? d.title.includes(query) || d.id.includes(query) : true),
    ),
  )

  // 간단한 컴플라이언스 규칙
  const requiredAttachments: Record<string, number> = {
    인건비: 2,
    재료비: 1,
    연구활동비: 1,
    여비: 2,
  }
  const requiredDocNames: Record<string, string[]> = {
    인건비: ['급여명세서', '4대보험 납부확인'],
    재료비: ['세금계산서'],
    연구활동비: ['증빙서류'],
    여비: ['영수증', '출장보고서'],
  }
  function isCompliant(d: ExpenseDocument): boolean {
    const min = requiredAttachments[d.category] ?? 0
    return (d.attachments ?? 0) >= min
  }
  function missingDocs(d: ExpenseDocument): string[] {
    const req = requiredDocNames[d.category] ?? []
    const have = d.attachments ?? 0
    return have >= req.length ? [] : req.slice(have)
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

<h3 class="text-lg font-semibold mb-3">Project Expenses · {projectId}</h3>

<Card>
  <div class="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center">
    <input
      class="w-full sm:w-64 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      placeholder="문서 검색"
      bind:value={query}
    />
    <select
      class="w-full sm:w-48 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
      bind:value={status}
    >
      <option value="">상태: 전체</option>
      <option value="대기">대기</option>
      <option value="승인">승인</option>
      <option value="반려">반려</option>
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
            <th class="px-3 py-2">문서번호</th>
            <th class="px-3 py-2">제목</th>
            <th class="px-3 py-2">분류</th>
            <th class="px-3 py-2">분기</th>
            <th class="px-3 py-2">금액</th>
            <th class="px-3 py-2">첨부</th>
            <th class="px-3 py-2">상태</th>
            <th class="px-3 py-2">컴플라이언스</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          {#each filtered as d, i (i)}
            <tr>
              <td class="px-3 py-2">{d.id}</td>
              <td class="px-3 py-2">{d.title}</td>
              <td class="px-3 py-2">{d.category}</td>
              <td class="px-3 py-2">{d.quarter}Q</td>
              <td class="px-3 py-2">{d.amountKRW ? formatKRW(d.amountKRW) : '-'}</td>
              <td class="px-3 py-2">{d.attachments}</td>
              <td class="px-3 py-2"
                ><Badge
                  color={d.status === '대기' ? 'yellow' : d.status === '반려' ? 'red' : 'green'}
                  >{d.status}</Badge
                ></td
              >
              <td class="px-3 py-2">
                {#if isCompliant(d)}
                  <Badge color="green">충족</Badge>
                {:else}
                  <Badge color="red">미비: {missingDocs(d).join(', ')}</Badge>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>
