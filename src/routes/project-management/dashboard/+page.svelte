<script lang="ts">
  import Badge from "$lib/components/ui/Badge.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import Progress from "$lib/components/ui/Progress.svelte";
  import { personnelStore } from "$lib/stores/personnel";
  import {
    budgetAlerts,
    expenseDocsStore,
    getQuarterSummary,
    overallBudget,
    projectsStore,
    quarterlyPersonnelBudgets,
  } from "$lib/stores/rnd";
  import {
    formatDateForDisplay,
    getCurrentUTC,
    getDateDifference,
  } from "$lib/utils/date-handler";

  const ob = $derived($overallBudget);
  const avgProgress = $derived(
    $projectsStore.length
      ? Math.round(
          $projectsStore.reduce((s, p) => s + p.progressPct, 0) /
            $projectsStore.length,
        )
      : 0,
  );
  const riskCounts = $derived({
    위험: $projectsStore.filter((p) => p.status === "위험").length,
    지연: $projectsStore.filter((p) => p.status === "지연").length,
    진행중: $projectsStore.filter((p) => p.status === "진행중").length,
    정상: $projectsStore.filter(
      (p) => p.status === "정상" || p.status === "완료",
    ).length,
  });
  const overAllocated = $derived(
    $personnelStore.filter(
      (pr) =>
        pr.participations.reduce((s, pp) => s + pp.allocationPct, 0) > 100,
    ).length,
  );
  const avgAlloc = $derived(
    $personnelStore.length
      ? Math.round(
          $personnelStore.reduce(
            (sum, pr) =>
              sum +
              pr.participations.reduce((s, pp) => s + pp.allocationPct, 0),
            0,
          ) / $personnelStore.length,
        )
      : 0,
  );

  // Category breakdown (인건비/재료비/연구활동비/여비)
  const categoryTotals = $derived(
    (function () {
      const res = { 인건비: 0, 재료비: 0, 연구활동비: 0, 여비: 0 } as Record<
        string,
        number
      >;
      for (const d of $expenseDocsStore) {
        const amt = d.amountKRW ?? 0;
        if (res[d.category] !== undefined) res[d.category] += amt;
      }
      return res;
    })(),
  );

  // Burn rate projection: project-level spent/elapsed → projected over total duration, aggregated
  function daysBetween(a: string, b: string): number {
    const ms = new Date(b).getTime() - new Date(a).getTime();
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }
  const portfolioProjection = $derived(
    (function () {
      const todayIso = formatDateForDisplay(getCurrentUTC(), "ISO");
      let totalBudget = 0;
      let totalProjected = 0;
      for (const p of $projectsStore) {
        const start = p.startDate;
        const due = p.dueDate;
        const totalDays = getDateDifference(start, due);
        // 오늘이 시작 이전이면 0일 경과로 간주
        const cappedToday =
          todayIso < start ? start : todayIso > due ? due : todayIso;
        const elapsedDays = Math.max(1, getDateDifference(start, cappedToday));
        const burn = p.spentKRW / Math.max(1, elapsedDays);
        const projected = burn * totalDays;
        totalBudget += p.budgetKRW;
        totalProjected += Math.min(projected, p.budgetKRW * 2); // clamp to avoid runaway
      }
      const utilization = totalBudget > 0 ? totalProjected / totalBudget : 0;
      return { totalBudget, totalProjected, utilization };
    })(),
  );

  // 경보 상세 사유
  const alertDetails = $derived(
    $budgetAlerts.map((a) => {
      const pct = (a.utilization * 100).toFixed(1);
      const reason =
        a.level === "over"
          ? `집행률 ${pct}% ≥ 100%`
          : a.level === "critical"
            ? `집행률 ${pct}% ≥ 95%`
            : `집행률 ${pct}% ≥ 80%`;
      return { ...a, reason };
    }),
  );

  // 소진 속도 편차: 진행률 대비 집행액 편차 상위
  const burnVariance = $derived(
    (function () {
      return $projectsStore
        .map((p) => {
          const expected = (p.progressPct / 100) * p.budgetKRW;
          const delta = p.spentKRW - expected;
          return { id: p.id, name: p.name, spent: p.spentKRW, expected, delta };
        })
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, 5);
    })(),
  );

  // 분기 선택 및 URL 동기화
  function sortQuarterLabels(labels: string[]): string[] {
    return labels
      .map((q) => {
        const [y, qpart] = q.split("-Q");
        return { q, y: Number(y), qn: Number(qpart) };
      })
      .sort((a, b) => (a.y === b.y ? a.qn - b.qn : a.y - b.y))
      .map((x) => x.q);
  }
  function currentQuarterLabel(): string {
    const d = new Date(getCurrentUTC());
    const y = d.getFullYear();
    const qn = Math.floor(d.getMonth() / 3) + 1;
    return `${y}-Q${qn}`;
  }
  const quarters = $derived(
    (function () {
      const set = new Set<string>();
      const qmap = $quarterlyPersonnelBudgets;
      for (const pid in qmap) {
        for (const k in qmap[pid]) set.add(k);
      }
      return sortQuarterLabels(Array.from(set));
    })(),
  );
  let selectedQuarter = $state(currentQuarterLabel());
  let lastQuery = $state("");
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    if (qParam) selectedQuarter = qParam;
    lastQuery = params.toString();
  }
  const quarterSummary = $derived(getQuarterSummary(selectedQuarter));
  const docsInQuarter = $derived(
    (function () {
      const qn = Number(selectedQuarter.split("-Q")[1] || "0");
      return $expenseDocsStore.filter((d) => Number(d.quarter) === qn).length;
    })(),
  );

  // URL sync
  $effect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (selectedQuarter) params.set("q", selectedQuarter);
      else params.delete("q");
      const newQuery = params.toString();
      if (newQuery !== lastQuery) {
        lastQuery = newQuery;
        const url = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}`;
        window.history.replaceState(null, "", url);
      }
    }
  });

  // Headcount churn (최근 4분기)
  function sortQs(labels: string[]): string[] {
    return sortQuarterLabels(labels);
  }
  const allQLabels = $derived(
    (function () {
      const s = new Set<string>();
      for (const p of $personnelStore) {
        for (const part of p.participations) {
          const qb = part.quarterlyBreakdown ?? {};
          for (const k in qb) s.add(k);
        }
      }
      return sortQs(Array.from(s));
    })(),
  );
  const last4 = $derived(allQLabels.slice(-4));
  const activeByQ = $derived(
    (function () {
      const map: Record<string, Set<string>> = {};
      for (const q of last4) map[q] = new Set<string>();
      for (const p of $personnelStore) {
        for (const part of p.participations) {
          const qb = part.quarterlyBreakdown ?? {};
          for (const q of last4) {
            if ((qb[q] ?? 0) > 0) map[q].add(p.id);
          }
        }
      }
      return map;
    })(),
  );
  const churnData = $derived(
    (function () {
      const data: Array<{
        q: string;
        headcount: number;
        join: number;
        leave: number;
      }> = [];
      for (let i = 0; i < last4.length; i++) {
        const q = last4[i];
        const prev = i > 0 ? last4[i - 1] : null;
        const currSet = activeByQ[q] ?? new Set<string>();
        const prevSet = prev
          ? (activeByQ[prev] ?? new Set<string>())
          : new Set<string>();
        let join = 0,
          leave = 0;
        if (prev) {
          for (const id of currSet) if (!prevSet.has(id)) join++;
          for (const id of prevSet) if (!currSet.has(id)) leave++;
        }
        data.push({ q, headcount: currSet.size, join, leave });
      }
      return data;
    })(),
  );

  // simple skeleton
  let loading = $state(true);
  if (typeof window !== "undefined") {
    setTimeout(() => (loading = false), 300);
  }
</script>

<h2 class="text-lg font-semibold mb-4">Project Overview Dashboard</h2>

<div class="mb-3 flex items-center gap-2">
  <label for="qsel" class="text-sm text-gray-600">분기</label>
  <select
    id="qsel"
    class="rounded-md border border-gray-200 px-2 py-1 text-sm"
    bind:value={selectedQuarter}
  >
    {#each quarters as q, i (i)}
      <option value={q}>{q}</option>
    {/each}
  </select>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  {#if loading}
    {#each Array(4) as _, idx (idx)}
      <!-- TODO: replace index key with a stable id when model provides one -->
      <div class="card animate-pulse h-24"></div>
    {/each}
  {:else}
    <Card>
      {#snippet children()}
        <div class="kpi">
          <div>
            <p class="text-caption">총 프로젝트</p>
            <div class="text-2xl font-bold">{$projectsStore.length}</div>
          </div>
        </div>
      {/snippet}
    </Card>
    <Card>
      {#snippet children()}
        <div class="kpi">
          <div>
            <p class="text-caption">예산 집행률</p>
            <div class="text-2xl font-bold">
              {(ob.utilization * 100).toFixed(1)}%
            </div>
            <div class="mt-3"><Progress value={ob.utilization * 100} /></div>
          </div>
        </div>
      {/snippet}
    </Card>
    <Card>
      {#snippet children()}
        <div class="kpi">
          <div>
            <p class="text-caption">평균 진행률</p>
            <div class="text-2xl font-bold">{avgProgress}%</div>
            <div class="mt-3"><Progress value={avgProgress} /></div>
          </div>
        </div>
      {/snippet}
    </Card>
    <Card>
      {#snippet children()}
        <div class="kpi">
          <div>
            <p class="text-caption">경보 프로젝트</p>
            <div class="text-2xl font-bold">{$budgetAlerts.length}</div>
          </div>
        </div>
      {/snippet}
    </Card>
  {/if}
</div>

{#if !loading && $budgetAlerts.length}
  <Card header="예산 경보">
    {#snippet children()}
      <ul class="space-y-2 text-sm">
        {#each alertDetails as a, i (i)}
          <li class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="font-medium">{a.name}</span>
              <span class="text-caption">{a.reason}</span>
            </div>
            <Badge
              color={a.level === "over"
                ? "red"
                : a.level === "critical"
                  ? "yellow"
                  : "yellow"}>{(a.utilization * 100).toFixed(1)}%</Badge
            >
          </li>
        {/each}
      </ul>
    {/snippet}
  </Card>
{/if}

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
  <Card>
    {#snippet children()}
      <div class="kpi">
        <div>
          <p class="text-caption">{selectedQuarter} 분기 인건비 예산</p>
          <div class="text-2xl font-bold">
            {quarterSummary.totalBudgetKRW.toLocaleString()}원
          </div>
        </div>
      </div>
    {/snippet}
  </Card>
  <Card>
    {#snippet children()}
      <div class="kpi">
        <div>
          <p class="text-caption">
            {selectedQuarter.split("-Q")[1]}분기 문서 수
          </p>
          <div class="text-2xl font-bold">{docsInQuarter}</div>
        </div>
      </div>
    {/snippet}
  </Card>
  <Card>
    {#snippet children()}
      <div class="kpi">
        <div>
          <p class="text-caption">분기 키 개수</p>
          <div class="text-2xl font-bold">{quarters.length}</div>
        </div>
      </div>
    {/snippet}
  </Card>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
  <Card header="리스크 매트릭스">
    {#snippet children()}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div>
          <div class="text-caption mb-1">위험</div>
          <Badge color="red">{riskCounts.위험}</Badge>
        </div>
        <div>
          <div class="text-caption mb-1">지연</div>
          <Badge color="yellow">{riskCounts.지연}</Badge>
        </div>
        <div>
          <div class="text-caption mb-1">진행중</div>
          <Badge color="blue">{riskCounts.진행중}</Badge>
        </div>
        <div>
          <div class="text-caption mb-1">정상/완료</div>
          <Badge color="green">{riskCounts.정상}</Badge>
        </div>
      </div>
    {/snippet}
  </Card>

  <Card header="리소스 분석">
    {#snippet children()}
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-caption">평균 참여율</div>
          <div class="text-2xl font-bold">{avgAlloc}%</div>
          <div class="mt-3"><Progress value={Math.min(avgAlloc, 100)} /></div>
        </div>
        <div>
          <div class="text-caption">과할당 인원</div>
          <div class="text-2xl font-bold">{overAllocated}</div>
        </div>
      </div>
    {/snippet}
  </Card>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
  <Card header="예산 카테고리 분해">
    {#snippet children()}
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex items-center justify-between">
          <span>인건비</span><span class="tabular-nums"
            >{categoryTotals["인건비"].toLocaleString()}원</span
          >
        </div>
        <div class="flex items-center justify-between">
          <span>재료비</span><span class="tabular-nums"
            >{categoryTotals["재료비"].toLocaleString()}원</span
          >
        </div>
        <div class="flex items-center justify-between">
          <span>연구활동비</span><span class="tabular-nums"
            >{categoryTotals["연구활동비"].toLocaleString()}원</span
          >
        </div>
        <div class="flex items-center justify-between">
          <span>여비</span><span class="tabular-nums"
            >{categoryTotals["여비"].toLocaleString()}원</span
          >
        </div>
      </div>
    {/snippet}
  </Card>

  <Card header="번레이트 예측(포트폴리오)">
    {#snippet children()}
      <div class="grid grid-cols-1 gap-2 text-sm">
        <div class="flex items-center justify-between">
          <span>총 예산</span><span class="tabular-nums"
            >{portfolioProjection.totalBudget.toLocaleString()}원</span
          >
        </div>
        <div class="flex items-center justify-between">
          <span>예상 집행</span><span class="tabular-nums"
            >{portfolioProjection.totalProjected.toLocaleString()}원</span
          >
        </div>
        <div>
          <div class="text-caption mb-1">예상 집행률</div>
          <Progress
            value={Math.min(100, portfolioProjection.utilization * 100)}
          />
        </div>
      </div>
    {/snippet}
  </Card>
</div>

<Card header="소진 속도 편차 상위">
  {#snippet children()}
    <div class="overflow-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-left text-gray-600">
          <tr>
            <th class="px-3 py-2">프로젝트</th>
            <th class="px-3 py-2">예상</th>
            <th class="px-3 py-2">집행</th>
            <th class="px-3 py-2">편차</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          {#each burnVariance as b, i (i)}
            <tr>
              <td class="px-3 py-2">{b.name}</td>
              <td class="px-3 py-2 tabular-nums"
                >{b.expected.toLocaleString()}원</td
              >
              <td class="px-3 py-2 tabular-nums"
                >{b.spent.toLocaleString()}원</td
              >
              <td class="px-3 py-2 tabular-nums"
                >{b.delta.toLocaleString()}원</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/snippet}
</Card>

<Card header="인력 변동 (최근 4분기)">
  {#snippet children()}
    <div class="overflow-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-left text-gray-600">
          <tr>
            <th class="px-3 py-2">분기</th>
            <th class="px-3 py-2">인원수</th>
            <th class="px-3 py-2">신규</th>
            <th class="px-3 py-2">퇴사</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          {#each churnData as r, i (i)}
            <tr>
              <td class="px-3 py-2">{r.q}</td>
              <td class="px-3 py-2 tabular-nums">{r.headcount}</td>
              <td class="px-3 py-2 tabular-nums text-green-700">+{r.join}</td>
              <td class="px-3 py-2 tabular-nums text-red-700">-{r.leave}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/snippet}
</Card>
