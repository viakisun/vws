<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
  import { Users as UsersIcon, Lock as LockIcon, Edit as EditIcon } from 'lucide-svelte';
  import { ROLE_DESCRIPTIONS, type RoleCode } from '$lib/stores/permissions';
  import type { Role } from '$lib/hooks/admin/usePermissionManagement.svelte';

  interface Props {
    role: Role;
    getRoleColor: (roleCode: string) => string;
  }

  let { role, getRoleColor }: Props = $props();

  // 역할별 색상 매핑 (theme-color)
  function getRoleBgColor(roleCode: string): string {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-50 border-red-200',
      MANAGEMENT: 'bg-orange-50 border-orange-200',
      FINANCE_MANAGER: 'bg-green-50 border-green-200',
      HR_MANAGER: 'bg-blue-50 border-blue-200',
      ADMINISTRATOR: 'bg-purple-50 border-purple-200',
      RESEARCH_DIRECTOR: 'bg-indigo-50 border-indigo-200',
      SALES: 'bg-pink-50 border-pink-200',
      RESEARCHER: 'bg-gray-50 border-gray-200',
      EMPLOYEE: 'bg-gray-50 border-gray-200'
    };
    return colors[roleCode] || 'bg-gray-50 border-gray-200';
  }

  function getRoleTextColor(roleCode: string): string {
    const colors: Record<string, string> = {
      ADMIN: 'text-red-700',
      MANAGEMENT: 'text-orange-700',
      FINANCE_MANAGER: 'text-green-700',
      HR_MANAGER: 'text-blue-700',
      ADMINISTRATOR: 'text-purple-700',
      RESEARCH_DIRECTOR: 'text-indigo-700',
      SALES: 'text-pink-700',
      RESEARCHER: 'text-gray-700',
      EMPLOYEE: 'text-gray-700'
    };
    return colors[roleCode] || 'text-gray-700';
  }
</script>

<ThemeCard class="hover:shadow-lg transition-all duration-200">
  <div class="p-6">
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          {role.nameKo}
        </h3>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getRoleBgColor(role.code)} {getRoleTextColor(role.code)} border">
          {role.code}
        </span>
      </div>
      <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
        우선순위 {role.priority}
      </div>
    </div>

    <p class="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
      {role.description || ROLE_DESCRIPTIONS[role.code as RoleCode]}
    </p>

    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-gray-600 mb-1">할당된 사용자</div>
          <div class="text-2xl font-bold text-gray-900">{role.userCount || 0}<span class="text-sm font-normal text-gray-600 ml-1">명</span></div>
        </div>
        <UsersIcon size={32} class="text-blue-600 opacity-50" />
      </div>
    </div>

    <div class="flex gap-2">
      <ThemeButton
        variant="ghost"
        size="sm"
        class="flex-1 justify-center"
      >
        <LockIcon size={14} />
        <span class="ml-1">권한 보기</span>
      </ThemeButton>
      <ThemeButton
        size="sm"
        class="flex-1 justify-center"
      >
        <EditIcon size={14} />
        <span class="ml-1">편집</span>
      </ThemeButton>
    </div>
  </div>
</ThemeCard>
