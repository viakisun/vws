<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import { Edit as EditIcon, RefreshCw as RefreshCwIcon, Trash as TrashIcon } from 'lucide-svelte'
  import { formatKoreanNameStandard } from '$lib/utils/korean-name'
  import type { User } from '$lib/hooks/admin/usePermissionManagement.svelte'

  interface Props {
    users: User[]
    onSelectUser: (user: User) => void
    onRefreshCache: (userId: string) => void
    onDeleteUser?: (user: User) => void
    getRoleColor: (roleCode: string) => string
  }

  let { users, onSelectUser, onRefreshCache, onDeleteUser, getRoleColor }: Props = $props()
</script>

<ThemeCard class="overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >이름</th
          >
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >역할</th
          >
          <th
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >작업</th
          >
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each users as user (user.id)}
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex flex-col">
                <div class="flex items-center gap-2 mb-0.5">
                  <div class="text-sm font-medium text-gray-900">
                    {formatKoreanNameStandard(user.name)}
                  </div>
                  {#if user.account_type && user.account_type !== 'employee'}
                    <ThemeBadge variant="warning" size="sm">시스템</ThemeBadge>
                  {:else if user.employee_id}
                    <ThemeBadge variant="info" size="sm">{user.employee_id}</ThemeBadge>
                  {/if}
                </div>
                <div class="text-xs text-gray-500">
                  {#if user.account_type && user.account_type !== 'employee'}
                    시스템 계정 • {user.email}
                  {:else if user.department && user.position}
                    {user.department} / {user.position}
                  {:else}
                    {user.email}
                  {/if}
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                {#if user.roles.length === 0}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    권한 없음
                  </span>
                {:else}
                  {#each user.roles as role}
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role.nameKo}
                    </span>
                  {/each}
                {/if}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <div class="flex justify-center gap-1">
                <button
                  type="button"
                  class="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  onclick={() => onSelectUser(user)}
                  title="역할 편집"
                >
                  <EditIcon size={16} />
                </button>
                <button
                  type="button"
                  class="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  onclick={() => onRefreshCache(user.id)}
                  title="캐시 새로고침"
                >
                  <RefreshCwIcon size={16} />
                </button>
                {#if onDeleteUser}
                  <button
                    type="button"
                    class="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    onclick={() => onDeleteUser?.(user)}
                    title="사용자 삭제"
                  >
                    <TrashIcon size={16} />
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="3" class="px-6 py-12 text-center text-gray-500"> 사용자가 없습니다. </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</ThemeCard>
