<script lang="ts">
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import DepartmentOverview from './DepartmentOverview.svelte'
  import RecentActivities from './RecentActivities.svelte'
  import HRCharts from './HRCharts.svelte'
  import JobPostingsList from './JobPostingsList.svelte'
</script>

<ThemeSpacer size={6}>
  <!-- 메인 대시보드 -->
  <ThemeGrid cols={1} lgCols={2} gap={6}>
    <!-- 부서별 직원 현황 -->
    <DepartmentOverview />

    <!-- 최근 활동 -->
    <RecentActivities />
  </ThemeGrid>

  <!-- 차트 섹션 -->
  <HRCharts />

  <!-- 최근 채용 공고 -->
  <JobPostingsList />
</ThemeSpacer>
