<script lang="ts">
  import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import { hrDashboardStore } from '$lib/stores/hr/hr-dashboard-store.svelte'
  import { jobPostings } from '$lib/stores/recruitment'

  // 통계 데이터 - $derived로 반응형 배열 생성
  let stats = $derived([
    {
      title: '직원 수',
      value: `${hrDashboardStore.totalEmployees}`,
      change: '+5%',
      changeType: 'positive' as const,
      icon: '👥',
    },
    {
      title: '진행중인 채용',
      value: `${$jobPostings.filter((job) => job.status === 'published').length}`,
      change: '+2',
      changeType: 'positive' as const,
      icon: '👤',
    },
  ])
</script>

<ThemeGrid cols={1} mdCols={2} gap={6} class="mb-6">
  {#each stats as stat (stat.title)}
    <ThemeStatCard
      title={stat.title}
      value={stat.value}
      badge={stat.change}
      icon={stat.icon}
      color="blue"
    />
  {/each}
</ThemeGrid>
