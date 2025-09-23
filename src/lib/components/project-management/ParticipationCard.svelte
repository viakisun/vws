<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { ActivityIcon, UsersIcon } from '@lucide/svelte'

  /**
   * @typedef {Object} EmployeeParticipation
   * @property {string} name
   * @property {string} email
   * @property {string} department
   * @property {number} activeProjects
   * @property {number} totalParticipationRate
   */

  let { employeeParticipationSummary = [] } = $props()
</script>

<div class="space-y-6">
  <!-- 미구현 기능 안내 -->
  <ThemeCard>
    <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <ActivityIcon class="h-5 w-5 text-blue-400" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-blue-800">기능 개발 중</h3>
          <div class="mt-2 text-sm text-blue-700">
            <p>직원별 참여율 관리 기능이 현재 개발 중입니다.</p>
            <p class="mt-1">곧 정확한 참여율 데이터를 확인할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  </ThemeCard>

  <ThemeCard>
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">직원별 참여율 현황</h3>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >직원</th
            >
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >부서</th
            >
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >참여 프로젝트</th
            >
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >총 참여율</th
            >
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >상태</th
            >
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#if employeeParticipationSummary.length > 0}
            {#each employeeParticipationSummary as employee (employee.email)}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{employee.name}</div>
                  <div class="text-sm text-gray-500">{employee.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{employee.department}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{employee.activeProjects}개</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{employee.totalParticipationRate}%</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if employee.totalParticipationRate > 100}
                    <ThemeBadge variant="error">초과 참여</ThemeBadge>
                  {:else if employee.totalParticipationRate === 100}
                    <ThemeBadge variant="success">정상</ThemeBadge>
                  {:else}
                    <ThemeBadge variant="info">여유</ThemeBadge>
                  {/if}
                </td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td
                colspan="5"
                class="px-6 py-12 text-center text-gray-500">
                <UsersIcon class="mx-auto h-12 w-12 text-gray-400" />
                <p class="mt-2">참여율 데이터가 없습니다.</p>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </ThemeCard>
</div>
