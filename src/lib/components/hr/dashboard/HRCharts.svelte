<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeChartPlaceholder from '$lib/components/ui/ThemeChartPlaceholder.svelte'
</script>

<ThemeGrid cols={1} lgCols={2} gap={6}>
  <!-- 부서별 분포 차트 -->
  <ThemeCard class="p-6">
    <div class="mb-6">
      <h3 class="text-lg font-semibold" style:color="var(--color-text)">부서별 직원 분포</h3>
    </div>
    <ThemeChartPlaceholder title="부서별 직원 수" icon="📈" />
  </ThemeCard>

  <!-- 채용 현황 차트 -->
  <ThemeCard class="p-6">
    <div class="mb-6">
      <h3 class="text-lg font-semibold" style:color="var(--color-text)">채용 현황</h3>
    </div>
    <ThemeChartPlaceholder title="월별 채용 현황" icon="👤" />
  </ThemeCard>
</ThemeGrid>
