<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte';
  import {
    ShieldCheck as ShieldCheckIcon,
    Key as KeyIcon,
    XCircle as XCircleIcon,
    Plus as PlusIcon,
    Shield as ShieldIcon
  } from 'lucide-svelte';
  import { ROLE_NAMES_KO, ROLE_DESCRIPTIONS, type RoleCode } from '$lib/stores/permissions';
  import type { User } from '$lib/hooks/admin/usePermissionManagement.svelte';

  interface Props {
    selectedUser: User | null;
    selectedRole: RoleCode | null;
    onAssignRole: (userId: string, roleCode: string) => void;
    onRevokeRole: (type: 'user_role', data: any) => void;
    onRoleChange: (roleCode: RoleCode | null) => void;
  }

  let {
    selectedUser,
    selectedRole,
    onAssignRole,
    onRevokeRole,
    onRoleChange
  }: Props = $props();
</script>

<ThemeCard class="p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
    <ShieldCheckIcon size={20} class="text-blue-600" />
    역할 할당
  </h3>

  {#if selectedUser}
    <div class="space-y-6">
      <!-- 선택된 사용자 정보 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="text-sm text-gray-600 mb-1">선택된 사용자</div>
        <div class="font-semibold text-gray-900">{selectedUser.name}</div>
        <div class="text-sm text-gray-600">{selectedUser.email}</div>
      </div>

      <!-- 현재 역할 -->
      <div>
        <div class="text-sm font-medium text-gray-700 mb-3">현재 역할</div>
        <div class="space-y-2">
          {#if selectedUser.roles.length === 0}
            <div class="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded-lg">
              할당된 역할이 없습니다.
            </div>
          {:else}
            {#each selectedUser.roles as role}
              <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center gap-2">
                  <KeyIcon size={16} class="text-blue-600" />
                  <span class="font-medium text-gray-900">{role.nameKo}</span>
                  <span class="text-xs text-gray-500">({role.code})</span>
                </div>
                <button
                  type="button"
                  class="text-red-600 hover:text-red-700 transition-colors"
                  onclick={() => onRevokeRole('user_role', {
                    userId: selectedUser.id,
                    roleCode: role.code,
                    userName: selectedUser.name,
                    roleName: role.nameKo
                  })}
                  title="역할 제거"
                >
                  <XCircleIcon size={18} />
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- 역할 추가 -->
      <div>
        <div class="text-sm font-medium text-gray-700 mb-3">역할 추가</div>
        <div class="space-y-3">
          <select
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={selectedRole || ''}
            onchange={(e) => onRoleChange((e.currentTarget.value || null) as RoleCode | null)}
          >
            <option value="">역할 선택...</option>
            {#each Object.entries(ROLE_NAMES_KO) as [code, name]}
              {#if !selectedUser.roles.some((r) => r.code === code)}
                <option value={code}>
                  {name}
                </option>
              {/if}
            {/each}
          </select>

          {#if selectedRole}
            <div class="text-sm text-gray-600 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              {ROLE_DESCRIPTIONS[selectedRole]}
            </div>

            <ThemeButton
              class="w-full flex items-center justify-center gap-2"
              onclick={() => {
                if (selectedRole && selectedUser) {
                  onAssignRole(selectedUser.id, selectedRole);
                }
              }}
            >
              <PlusIcon size={18} />
              역할 추가
            </ThemeButton>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="text-center py-12 text-gray-400">
      <ShieldIcon size={48} class="mx-auto mb-3 opacity-30" />
      <p class="text-sm">사용자를 선택하여</p>
      <p class="text-sm">역할을 관리하세요</p>
    </div>
  {/if}
</ThemeCard>
