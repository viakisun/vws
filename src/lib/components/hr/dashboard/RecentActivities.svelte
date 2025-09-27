<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeActivityItem from '$lib/components/ui/ThemeActivityItem.svelte'
  import { UserPlusIcon, CalendarIcon, UserMinusIcon, BuildingIcon } from '@lucide/svelte'
  import { hrDashboardStore } from '$lib/stores/hr/hr-dashboard-store.svelte'

  // 아이콘 매핑 함수
  function getActivityIcon(type: string) {
    switch (type) {
      case 'hire':
        return UserPlusIcon
      case 'termination_pending':
        return CalendarIcon
      case 'termination':
        return UserMinusIcon
      case 'department_change':
        return BuildingIcon
      default:
        return UserPlusIcon
    }
  }
</script>

<ThemeCard class="p-6">
  <div class="mb-6">
    <h3 class="text-lg font-semibold" style:color="var(--color-text)">최근 활동</h3>
  </div>
  <ThemeSpacer size={4}>
    {#each hrDashboardStore.recentActivities as activity, i (`${activity.time}:${activity.title}:${i}`)}
      <ThemeActivityItem
        title={activity.title}
        time={activity.time}
        description={activity.description}
        icon={getActivityIcon(activity.type)}
      />
    {/each}
  </ThemeSpacer>
</ThemeCard>
