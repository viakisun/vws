<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import { CalendarIcon } from '@lucide/svelte'
</script>

<ThemeSectionHeader title="일정 관리" description="회사 일정과 이벤트를 관리합니다" />

<div class="space-y-6">
  <ThemeCard class="p-6">
    <h3 class="text-lg font-semibold mb-4">일정 관리</h3>
    <div class="text-center py-12 text-gray-500">
      <CalendarIcon class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-lg">일정 관리 기능이 곧 추가될 예정입니다.</p>
    </div>
  </ThemeCard>
</div>
