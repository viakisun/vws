<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import { BuildingIcon } from '@lucide/svelte'
  import { hrDashboardStore } from '$lib/stores/hr/hr-dashboard-store.svelte'
</script>

<ThemeCard class="p-6">
  <div class="mb-6">
    <h3 class="text-lg font-semibold" style:color="var(--color-text)">부서별 직원 현황 (T/O)</h3>
    <p class="text-sm mt-1" style:color="var(--color-text-secondary)">
      현재 인원 / 정원 (T/O) • 색상: 🟢여유 🟡충족 🔴초과 ⚪미설정
    </p>
  </div>
  <ThemeSpacer size={4}>
    {#each hrDashboardStore.departmentData as dept (dept.department)}
      <div
        class="flex items-center justify-between p-3 rounded-lg"
        style:background="var(--color-surface-elevated)"
      >
        <div class="flex items-center gap-3">
          <BuildingIcon size={20} style="color: var(--color-primary);" />
          <div>
            <h4 class="font-medium" style:color="var(--color-text)">
              {dept.department}
            </h4>
            <div class="flex items-center gap-2">
              <p class="text-sm" style:color="var(--color-text-secondary)">
                {dept.count}명
                {#if dept.to > 0}
                  / {dept.to}명
                {:else}
                  / ∞
                {/if}
              </p>
              <!-- T/O 상태 표시 -->
              {#if dept.toStatus === 'over'}
                <div class="w-2 h-2 rounded-full bg-red-500" title="정원 초과"></div>
              {:else if dept.toStatus === 'full'}
                <div class="w-2 h-2 rounded-full bg-yellow-500" title="정원 충족"></div>
              {:else if dept.toStatus === 'available'}
                <div class="w-2 h-2 rounded-full bg-green-500" title="여유 있음"></div>
              {:else}
                <div class="w-2 h-2 rounded-full bg-gray-400" title="T/O 미설정"></div>
              {/if}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- T/O 대비 비율 -->
          {#if dept.to > 0}
            <ThemeBadge
              variant={dept.toStatus === 'over'
                ? 'error'
                : dept.toStatus === 'full'
                  ? 'warning'
                  : 'success'}
              size="sm"
            >
              {dept.toPercentage}%
            </ThemeBadge>
          {/if}
          <!-- 전체 대비 비율 -->
          <ThemeBadge variant="info" size="sm">{dept.percentage}%</ThemeBadge>
        </div>
      </div>
    {/each}
  </ThemeSpacer>
</ThemeCard>
