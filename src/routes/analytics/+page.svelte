<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import { BarChart3Icon } from '@lucide/svelte'
</script>

<ThemeSectionHeader
  title="데이터 분석"
  description="비즈니스 데이터를 분석하고 인사이트를 제공합니다"
/>

<div class="space-y-6">
  <ThemeCard class="p-6">
    <h3 class="text-lg font-semibold mb-4">데이터 분석</h3>
    <div class="text-center py-12 text-gray-500">
      <BarChart3Icon class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-lg">데이터 분석 기능이 곧 추가될 예정입니다.</p>
    </div>
  </ThemeCard>
</div>
