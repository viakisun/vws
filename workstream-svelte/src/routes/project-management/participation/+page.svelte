<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { personnelStore } from '$lib/stores/personnel';
  import { projectsStore } from '$lib/stores/rnd';
  import type { Personnel } from '$lib/types';
  import { goto } from '$app/navigation';

  $: people = $personnelStore as Personnel[];
  $: projects = $projectsStore;

  function getAlloc(person: Personnel, projectId: string): number {
    const p = person.participations.find((pp) => pp.projectId === projectId);
    return p ? p.allocationPct : 0;
  }

  function totalAlloc(person: Personnel): number {
    return person.participations.reduce((s, pp) => s + pp.allocationPct, 0);
  }

  function overlaps(aStart?: string, aEnd?: string, bStart?: string, bEnd?: string): boolean {
    if (!aStart || !bStart) return false;
    const as = new Date(aStart).getTime();
    const bs = new Date(bStart).getTime();
    const ae = aEnd ? new Date(aEnd).getTime() : Number.MAX_SAFE_INTEGER;
    const be = bEnd ? new Date(bEnd).getTime() : Number.MAX_SAFE_INTEGER;
    return as <= be && bs <= ae;
  }

  function hasConflict(person: Personnel): boolean {
    const parts = person.participations;
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        if (overlaps(parts[i].startDate, parts[i].endDate, parts[j].startDate, parts[j].endDate)) {
          if (parts[i].allocationPct + parts[j].allocationPct > 100) return true;
        }
      }
    }
    return totalAlloc(person) > 100;
  }

  type Conflict = { person: string; personId: string; projectA: string; projectB: string; 
    period: string; combinedAlloc: number };
  $: conflictList = (function(){
    const list: Conflict[] = [];
    for (const person of people) {
      const parts = person.participations;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          if (overlaps(a.startDate, a.endDate, b.startDate, b.endDate)) {
            const combined = a.allocationPct + b.allocationPct;
            if (combined > 100) {
              const start = a.startDate > b.startDate ? a.startDate : b.startDate;
              const end = (a.endDate && b.endDate) ? (a.endDate < b.endDate ? a.endDate : b.endDate)
                        : (a.endDate || b.endDate || '');
              list.push({ person: person.name, personId: person.id, projectA: a.projectId, projectB: b.projectId,
                period: `${start}${end ? ` ~ ${end}` : ''}`, combinedAlloc: combined });
            }
          }
        }
      }
    }
    return list.sort((x,y)=> y.combinedAlloc - x.combinedAlloc);
  })();

  // 정렬/필터 상태
  let cQuery = '';
  let projQuery = '';
  let minCombined = 0;
  let sortDir: 'desc' | 'asc' = 'desc';
  $: filteredConflicts = conflictList
    .filter((c) => (cQuery ? (c.person.includes(cQuery) || c.personId.includes(cQuery)) : true))
    .filter((c) => (projQuery ? (c.projectA.includes(projQuery) || c.projectB.includes(projQuery)) : true))
    .filter((c) => c.combinedAlloc >= (Number(minCombined) || 0))
    .sort((a, b) => sortDir === 'desc' ? b.combinedAlloc - a.combinedAlloc : a.combinedAlloc - b.combinedAlloc);

  // URL 동기화: 초기값 로드
  let lastQuery = '';
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    cQuery = params.get('q') ?? '';
    projQuery = params.get('p') ?? '';
    minCombined = Number(params.get('min') ?? '0');
    sortDir = (params.get('sort') === 'asc') ? 'asc' : 'desc';
    lastQuery = params.toString();
  }

  // URL 동기화: 값 변경 시 반영
  $: if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (cQuery) params.set('q', cQuery); else params.delete('q');
    if (projQuery) params.set('p', projQuery); else params.delete('p');
    if (minCombined && Number(minCombined) > 0) params.set('min', String(minCombined)); else params.delete('min');
    params.set('sort', sortDir);
    const newQuery = params.toString();
    if (newQuery !== lastQuery) {
      lastQuery = newQuery;
      goto(`${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`,
        { replaceState: true, keepFocus: true, noScroll: true });
    }
  }

  // skeleton loading (initial render)
  let loading = true;
  if (typeof window !== 'undefined') {
    setTimeout(() => (loading = false), 300);
  }
</script>

<h2 class="text-lg font-semibold mb-3">Participation Rate Management</h2>

<Card>
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
            <th class="px-3 py-2">인력</th>
            {#each projects as prj}
              <th class="px-3 py-2 whitespace-nowrap">{prj.id}</th>
            {/each}
            <th class="px-3 py-2">합계</th>
            <th class="px-3 py-2">충돌</th>
            <th class="px-3 py-2">상태</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          {#each people as person}
            <tr>
              <td class="px-3 py-2 whitespace-nowrap">{person.name} <span class="text-caption">({person.id})</span></td>
              {#each projects as prj}
                <td class="px-3 py-2 text-right tabular-nums">{getAlloc(person, prj.id)}%</td>
              {/each}
              <td class="px-3 py-2 text-right font-semibold tabular-nums">{totalAlloc(person)}%</td>
              <td class="px-3 py-2">
                {#if hasConflict(person)}
                  <Badge color="red">충돌</Badge>
                {:else}
                  <Badge color="green">정상</Badge>
                {/if}
              </td>
              <td class="px-3 py-2">
                {#if totalAlloc(person) > 100}
                  <Badge color="red">과할당</Badge>
                {:else if totalAlloc(person) === 100}
                  <Badge color="green">정상</Badge>
                {:else}
                  <Badge color="yellow">여유 {100 - totalAlloc(person)}%</Badge>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>

<Card header="과할당/충돌 상세 리포트" >
  <div class="mb-3 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
    <input class="rounded-md border border-gray-200 px-2 py-1" placeholder="인력 검색(이름/ID)" bind:value={cQuery} />
    <input class="rounded-md border border-gray-200 px-2 py-1" placeholder="프로젝트 검색" bind:value={projQuery} />
    <input class="rounded-md border border-gray-200 px-2 py-1" type="number" min="0" max="200" placeholder="최소 합산%" bind:value={minCombined} />
    <select class="rounded-md border border-gray-200 px-2 py-1" bind:value={sortDir}>
      <option value="desc">합산% 내림차순</option>
      <option value="asc">합산% 오름차순</option>
    </select>
  </div>
  {#if loading}
    <div class="space-y-2">
      {#each Array(6) as _}
        <div class="h-8 bg-gray-100 animate-pulse rounded"></div>
      {/each}
    </div>
  {:else}
    {#if conflictList.length === 0}
      <div class="text-sm text-gray-500">충돌 없음</div>
    {:else}
      <div class="overflow-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 text-left text-gray-600">
            <tr>
              <th class="px-3 py-2">인력</th>
              <th class="px-3 py-2">프로젝트 A</th>
              <th class="px-3 py-2">프로젝트 B</th>
              <th class="px-3 py-2">기간</th>
              <th class="px-3 py-2">합산 참여율</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            {#each filteredConflicts as c}
              <tr>
                <td class="px-3 py-2 whitespace-nowrap">{c.person} <span class="text-caption">({c.personId})</span></td>
                <td class="px-3 py-2">{c.projectA}</td>
                <td class="px-3 py-2">{c.projectB}</td>
                <td class="px-3 py-2">{c.period}</td>
                <td class="px-3 py-2 tabular-nums">{c.combinedAlloc}%</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</Card>

