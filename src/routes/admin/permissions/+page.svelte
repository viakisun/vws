<script lang="ts">
  import { onMount } from 'svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import PermissionGate from '$lib/components/auth/PermissionGate.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import DeleteConfirmModal from '$lib/components/ui/DeleteConfirmModal.svelte'
  import UserListTable from '$lib/components/admin/UserListTable.svelte'
  import RoleAssignmentPanel from '$lib/components/admin/RoleAssignmentPanel.svelte'
  import RoleCard from '$lib/components/admin/RoleCard.svelte'
  import PermissionMatrix from '$lib/components/admin/PermissionMatrix.svelte'
  import { usePermissionManagement } from '$lib/hooks/admin/usePermissionManagement.svelte'
  import { RoleCode } from '$lib/stores/permissions'
  import { pushToast } from '$lib/stores/toasts'
  import {
    Shield as ShieldIcon,
    Users as UsersIcon,
    Key as KeyIcon,
    RefreshCw as RefreshCwIcon,
    Search as SearchIcon,
    ShieldCheck as ShieldCheckIcon,
    UserPlus as UserPlusIcon,
  } from 'lucide-svelte'

  const store = usePermissionManagement()

  let showDeleteModal = $state(false)
  let deleteTarget = $state<{ type: 'role' | 'employee_role' | 'user'; data: any } | null>(null)
  let showUserAddModal = $state(false)

  // 역할별 색상 매핑
  function getRoleColor(roleCode: string): string {
    const colors: Record<string, string> = {
      ADMIN: 'badge-error',
      MANAGEMENT: 'badge-warning',
      FINANCE_MANAGER: 'badge-success',
      HR_MANAGER: 'badge-info',
      ADMINISTRATOR: 'badge-primary',
      RESEARCH_DIRECTOR: 'badge-secondary',
      SALES: 'badge-accent',
      RESEARCHER: 'badge-ghost',
      EMPLOYEE: 'badge-ghost',
    }
    return colors[roleCode] || 'badge-ghost'
  }

  onMount(() => {
    store.loadData()
  })

  function confirmDelete(type: 'role' | 'employee_role' | 'user', data: any) {
    deleteTarget = { type, data }
    showDeleteModal = true
  }

  async function handleDelete() {
    if (!deleteTarget) return

    if (deleteTarget.type === 'employee_role') {
      await store.revokeRole(deleteTarget.data.userId, deleteTarget.data.roleCode)
    } else if (deleteTarget.type === 'user') {
      // TODO: 사용자 삭제 API 구현
      pushToast('사용자 삭제 기능은 준비 중입니다.', 'info')
    }

    showDeleteModal = false
    deleteTarget = null
  }

  function handleAddUser() {
    pushToast('사용자 추가 기능은 준비 중입니다.', 'info')
  }

  function handleDeleteUser(user: any) {
    confirmDelete('user', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    })
  }

  function handleViewPermissions(role: any) {
    // 권한 매트릭스 탭으로 이동
    store.activeTab = 'permissions'
    pushToast(`${role.nameKo} 역할의 권한을 확인하세요.`, 'info')
  }

  function handleEditRole(role: any) {
    pushToast('역할 편집 기능은 준비 중입니다.', 'info')
  }
</script>

<PermissionGate role={RoleCode.ADMIN} fallback="message" message="관리자 권한이 필요합니다.">
  {#snippet children()}
    <PageLayout
      title="권한 관리"
      subtitle="시스템 사용자의 역할과 권한을 관리합니다"
      stats={store.stats}
    >
      {#snippet children()}
        <div class="space-y-6">
          <!-- 검색 및 액션 버튼 -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="relative flex-1 max-w-md w-full">
              <div
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              >
                <SearchIcon size={20} />
              </div>
              <ThemeInput
                type="text"
                placeholder="이름, 이메일로 검색..."
                class="pl-10"
                value={store.searchQuery}
                oninput={(e) =>
                  (store.searchQuery = (e.currentTarget as HTMLInputElement)?.value || '')}
              />
            </div>

            <div class="flex gap-2">
              <ThemeButton onclick={handleAddUser}>
                <UserPlusIcon size={18} />
                <span class="ml-2">사용자 추가</span>
              </ThemeButton>
              <ThemeButton
                variant="ghost"
                onclick={() => store.loadData()}
                disabled={store.loading}
              >
                <RefreshCwIcon size={18} class={store.loading ? 'animate-spin' : ''} />
                <span class="ml-2">새로고침</span>
              </ThemeButton>
            </div>
          </div>

          <!-- 탭 네비게이션 -->
          <ThemeTabs tabs={store.tabs} bind:activeTab={store.activeTab} />

          <!-- 로딩 상태 -->
          {#if store.loading}
            <div class="flex justify-center items-center h-64">
              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
                ></div>
                <p class="text-sm text-gray-600">데이터를 불러오는 중...</p>
              </div>
            </div>
          {:else if store.activeTab === 'users'}
            <!-- 사용자 관리 탭 -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- 사용자 목록 -->
              <div class="lg:col-span-2">
                <div class="mb-4">
                  <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UsersIcon size={20} class="text-blue-600" />
                    사용자 목록
                    <span class="theme-badge theme-badge-blue ml-2"
                      >{store.filteredUsers.length}명</span
                    >
                  </h2>
                </div>
                <UserListTable
                  users={store.filteredUsers}
                  onSelectUser={(user) => store.selectUser(user)}
                  onRefreshCache={(userId) => store.refreshPermissionCache(userId)}
                  onDeleteUser={handleDeleteUser}
                  {getRoleColor}
                />
              </div>

              <!-- 역할 할당 패널 -->
              <div>
                <div class="mb-4">
                  <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldCheckIcon size={20} class="text-blue-600" />
                    역할 관리
                  </h2>
                </div>
                <RoleAssignmentPanel
                  selectedUser={store.selectedUser}
                  selectedRole={store.selectedRole}
                  onRoleChange={(role) => store.setSelectedRole(role)}
                  onAssignRole={(userId, roleCode) => store.assignRole(userId, roleCode)}
                  onRevokeRole={confirmDelete}
                />
              </div>
            </div>
          {:else if store.activeTab === 'roles'}
            <!-- 역할 관리 탭 -->
            <div>
              <div class="mb-4">
                <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <KeyIcon size={20} class="text-blue-600" />
                  역할 목록
                  <span class="theme-badge theme-badge-blue ml-2">{store.roles.length}개</span>
                </h2>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each store.roles as role (role.id)}
                  <RoleCard
                    {role}
                    {getRoleColor}
                    onViewPermissions={handleViewPermissions}
                    onEdit={handleEditRole}
                  />
                {/each}
              </div>
            </div>
          {:else if store.activeTab === 'permissions'}
            <!-- 권한 매트릭스 탭 -->
            <div>
              <PermissionMatrix />
            </div>
          {/if}
        </div>
      {/snippet}
    </PageLayout>

    <!-- 삭제 확인 모달 -->
    {#if showDeleteModal && deleteTarget}
      <DeleteConfirmModal
        open={showDeleteModal}
        title={deleteTarget.type === 'user' ? '사용자 삭제' : '역할 제거'}
        message={deleteTarget.type === 'user'
          ? `${deleteTarget.data.userName}(${deleteTarget.data.userEmail}) 사용자를 삭제하시겠습니까?`
          : `${deleteTarget.data.userName}님의 ${deleteTarget.data.roleName} 역할을 제거하시겠습니까?`}
        showArchive={false}
        on:confirm={handleDelete}
        on:close={() => {
          showDeleteModal = false
          deleteTarget = null
        }}
      />
    {/if}
  {/snippet}
</PermissionGate>
