<script lang="ts">
  import { hrStore } from '$lib/stores/hr/hrStore.svelte'
  import ActionItemsPanel from './ActionItemsPanel.svelte'
  import HeadcountPanel from './HeadcountPanel.svelte'
  import QuickStatsCards from './QuickStatsCards.svelte'

  interface Props {
    onNavigate?: (tab: string) => void
  }

  const { onNavigate = () => {} }: Props = $props()
</script>

<div class="space-y-6">
  <!-- 빠른 통계 카드 -->
  <QuickStatsCards employees={hrStore.data.employees} />

  <!-- 메인 콘텐츠: 처리 필요 항목 + T.O 관리 -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- 처리 필요 항목 -->
    <ActionItemsPanel
      employees={hrStore.data.employees}
      leaveRequests={hrStore.data.leaveRequests}
      {onNavigate}
    />

    <!-- T.O (정원) 관리 -->
    <HeadcountPanel departments={hrStore.data.departments} employees={hrStore.data.employees} />
  </div>
</div>
