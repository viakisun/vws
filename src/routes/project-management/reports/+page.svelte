<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
</script>

<h2 class="text-lg font-semibold mb-4">Management Reports</h2>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Card header="Executive Summary">
    <p class="text-sm text-gray-600 mb-2">포트폴리오 현황 요약(프로젝트/예산/리스크)</p>
    <button type="button" class="px-3 py-1.5 rounded-md bg-primary text-white">PDF 내보내기</button>
  </Card>
  <Card header="Financial Reports">
    <p class="text-sm text-gray-600 mb-2">분기/연간 예산·집행·차이 분석</p>
    <div class="flex gap-2">
      <Badge color="blue">분기별</Badge>
      <Badge color="green">연간</Badge>
    </div>
  </Card>
  <Card header="Performance Reports">
    <p class="text-sm text-gray-600 mb-2">KPI/산출물/마일스톤 성과</p>
    <button type="button" class="px-3 py-1.5 rounded-md border border-gray-200">CSV 다운로드</button
    >
  </Card>
  <Card header="Compliance Reports">
    <p class="text-sm text-gray-600 mb-2">규정 준수 현황 및 점검 이력</p>
    <button type="button" class="px-3 py-1.5 rounded-md border border-gray-200">문서 생성</button>
  </Card>
</div>
