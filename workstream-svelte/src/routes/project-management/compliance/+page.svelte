<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Progress from '$lib/components/ui/Progress.svelte';

  type Rule = {
    id: string;
    title: string;
    required: boolean;
    status: 'pass' | 'warn' | 'fail';
    lastChecked: string;
  };

  const rules: Rule[] = [
    { id: 'R-001', title: '국가연구개발혁신법 고지 필수항목 준수', required: true, status: 'pass', lastChecked: '2025-09-10' },
    { id: 'R-002', title: '인건비 증빙(급여명세/4대보험) 구비', required: true, status: 'warn', lastChecked: '2025-09-09' },
    { id: 'R-003', title: '여비·재료비 세금계산서/영수증 첨부', required: true, status: 'pass', lastChecked: '2025-09-11' },
    { id: 'R-004', title: '과제보고서 분기 제출 기한 준수', required: true, status: 'fail', lastChecked: '2025-09-08' },
    { id: 'R-005', title: 'NTIS 과제정보 최신화', required: false, status: 'warn', lastChecked: '2025-09-07' }
  ];

  const total = rules.length;
  const passCnt = rules.filter(r => r.status === 'pass').length;
  const warnCnt = rules.filter(r => r.status === 'warn').length;
  const failCnt = rules.filter(r => r.status === 'fail').length;
  const score = Math.round((passCnt / total) * 100);

  function color(status: Rule['status']): 'green' | 'yellow' | 'red' {
    return status === 'pass' ? 'green' : status === 'warn' ? 'yellow' : 'red';
  }
</script>

<h2 class="text-lg font-semibold mb-4">Regulatory Compliance Dashboard</h2>

<div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
  <Card>
    <div class="kpi">
      <div>
        <p class="text-caption">준수 점수</p>
        <div class="text-2xl font-bold">{score}%</div>
        <div class="mt-3"><Progress value={score} /></div>
      </div>
    </div>
  </Card>
  <Card>
    <div class="kpi"><div><p class="text-caption">PASS</p><div class="text-2xl font-bold">{passCnt}</div></div></div>
  </Card>
  <Card>
    <div class="kpi"><div><p class="text-caption">WARN</p><div class="text-2xl font-bold">{warnCnt}</div></div></div>
  </Card>
  <Card>
    <div class="kpi"><div><p class="text-caption">FAIL</p><div class="text-2xl font-bold">{failCnt}</div></div></div>
  </Card>
</div>

<Card header="준수 체크리스트">
  <div class="overflow-auto">
    <table class="min-w-full text-sm">
      <thead class="bg-gray-50 text-left text-gray-600">
        <tr>
          <th class="px-3 py-2">규정</th>
          <th class="px-3 py-2">필수</th>
          <th class="px-3 py-2">상태</th>
          <th class="px-3 py-2">점검일</th>
        </tr>
      </thead>
      <tbody class="divide-y">
        {#each rules as r}
          <tr>
            <td class="px-3 py-2">{r.title}</td>
            <td class="px-3 py-2">{r.required ? '예' : '권장'}</td>
            <td class="px-3 py-2"><Badge color={color(r.status)}>{r.status.toUpperCase()}</Badge></td>
            <td class="px-3 py-2">{r.lastChecked}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</Card>

