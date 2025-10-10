<script lang="ts">
  import { onMount } from 'svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import {
    CircleCheck as CheckCircleIcon,
    CircleX as XCircleIcon,
    Info as InfoIcon,
    RefreshCw as RefreshCwIcon,
  } from 'lucide-svelte'

  interface PermissionRow {
    resource: string
    resourceKo: string
    admin: 'full' | 'read' | 'none'
    management: 'full' | 'read' | 'none'
    finance_manager: 'full' | 'read' | 'none'
    hr_manager: 'full' | 'read' | 'none'
    administrator: 'full' | 'read' | 'none'
    research_director: 'full' | 'read' | 'none'
    sales: 'full' | 'read' | 'none'
    researcher: 'full' | 'read' | 'none'
    employee: 'full' | 'read' | 'none'
  }

  interface RoleInfo {
    code: string
    nameKo: string
    priority: number
  }

  let permissions = $state<PermissionRow[]>([])
  let roles = $state<RoleInfo[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let updating = $state<{ resource: string; role: string } | null>(null)

  async function loadPermissionMatrix() {
    try {
      loading = true
      error = null

      const response = await fetch('/api/admin/permission-matrix')
      if (!response.ok) {
        throw new Error('Failed to load permission matrix')
      }

      const data = await response.json()
      roles = data.roles
      permissions = data.matrix.map((item: any) => {
        const row: any = {
          resource: item.resource,
          resourceKo: item.resourceKo,
        }
        for (const role of roles) {
          const roleKey = role.code.toLowerCase()
          row[roleKey] = item.permissions[roleKey] || 'none'
        }
        return row
      })
    } catch (err) {
      error = err instanceof Error ? err.message : '권한 매트릭스를 불러오는데 실패했습니다'
      console.error('Failed to load permission matrix:', err)
    } finally {
      loading = false
    }
  }

  /**
   * 권한 변경 (순환: none → read → full → none)
   */
  async function togglePermission(resource: string, roleCode: string) {
    const roleKey = roleCode.toLowerCase()
    const row = permissions.find((p) => p.resource === resource)
    if (!row) return

    const currentLevel = row[roleKey as keyof typeof row] as 'full' | 'read' | 'none'

    // 순환: none → read → full → none
    const nextLevel: 'full' | 'read' | 'none' =
      currentLevel === 'none' ? 'read' : currentLevel === 'read' ? 'full' : 'none'

    // ADMIN 역할은 수정 불가
    if (roleCode === 'ADMIN') {
      alert('ADMIN 역할의 권한은 수정할 수 없습니다.')
      return
    }

    // UI 즉시 업데이트 (낙관적 업데이트)
    row[roleKey as keyof typeof row] = nextLevel

    // 업데이트 중 표시
    updating = { resource, role: roleCode }

    try {
      const response = await fetch('/api/admin/permission-matrix', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleCode,
          resource,
          level: nextLevel,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update permission')
      }

      console.log(`✅ 권한 업데이트: ${resource} - ${roleCode} → ${nextLevel}`)
    } catch (err) {
      // 실패 시 원래대로 되돌림
      row[roleKey as keyof typeof row] = currentLevel
      error = '권한 업데이트에 실패했습니다'
      console.error('Failed to update permission:', err)
    } finally {
      updating = null
    }
  }

  onMount(() => {
    loadPermissionMatrix()
  })

  function getPermissionIcon(permission: 'full' | 'read' | 'none') {
    switch (permission) {
      case 'full':
        return { icon: CheckCircleIcon, class: 'text-green-600' }
      case 'read':
        return { icon: CheckCircleIcon, class: 'text-yellow-600' }
      case 'none':
        return { icon: XCircleIcon, class: 'text-gray-300' }
    }
  }
</script>

<ThemeCard class="p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900">권한 매트릭스</h3>
    <button
      onclick={loadPermissionMatrix}
      class="btn btn-sm btn-ghost"
      disabled={loading}
      aria-label="새로고침"
    >
      <RefreshCwIcon size={16} class={loading ? 'animate-spin' : ''} />
    </button>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="loading loading-spinner loading-lg"></div>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <p>{error}</p>
      <button onclick={loadPermissionMatrix} class="btn btn-sm">다시 시도</button>
    </div>
  {:else}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
      <InfoIcon size={20} class="text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <h4 class="font-semibold text-blue-900 mb-1">권한 편집 가능</h4>
        <p class="text-sm text-blue-700">
          아이콘을 클릭하여 권한을 변경할 수 있습니다. 클릭 순서: 권한 없음 → 읽기 권한 → 전체 권한
          → 권한 없음
          <br />
          <span class="font-semibold">ADMIN 역할은 시스템 보호를 위해 수정할 수 없습니다.</span>
        </p>
      </div>
    </div>

    {#if error}
      <div class="alert alert-error mb-4">
        <p>{error}</p>
        <button
          onclick={() => {
            error = null
          }}
          class="btn btn-sm"
        >
          닫기
        </button>
      </div>
    {/if}

    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50 border-b-2 border-gray-200">
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">리소스</th>
            {#each roles as role}
              <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                {role.nameKo}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each permissions as row}
            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 font-medium text-gray-900">{row.resourceKo}</td>
              {#each roles as role}
                {@const roleKey = role.code.toLowerCase()}
                {@const permission = row[roleKey as keyof typeof row] as 'full' | 'read' | 'none'}
                {@const { icon: Icon, class: iconClass } = getPermissionIcon(permission)}
                {@const isUpdating =
                  updating?.resource === row.resource && updating?.role === role.code}
                {@const isAdmin = role.code === 'ADMIN'}
                <td class="px-4 py-3 text-center">
                  <button
                    onclick={() => togglePermission(row.resource, role.code)}
                    disabled={isUpdating || isAdmin}
                    class="relative inline-flex items-center justify-center w-8 h-8 rounded-full transition-all
                           {isAdmin
                      ? 'cursor-not-allowed opacity-70'
                      : 'hover:bg-gray-100 active:scale-95 cursor-pointer'}
                           {isUpdating ? 'animate-pulse' : ''}"
                    title={isAdmin
                      ? 'ADMIN 권한은 수정 불가'
                      : `클릭하여 변경 (현재: ${permission === 'none' ? '권한 없음' : permission === 'read' ? '읽기' : '전체'})`}
                  >
                    {#if isUpdating}
                      <div class="loading loading-spinner loading-sm"></div>
                    {:else}
                      <Icon size={20} class={iconClass} />
                    {/if}
                  </button>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex items-center gap-6 mt-6 text-sm">
      <div class="flex items-center gap-2">
        <CheckCircleIcon size={18} class="text-green-600" />
        <span class="text-gray-700">전체 권한 (read/write/delete/approve)</span>
      </div>
      <div class="flex items-center gap-2">
        <CheckCircleIcon size={18} class="text-yellow-600" />
        <span class="text-gray-700">읽기 권한 (read only)</span>
      </div>
      <div class="flex items-center gap-2">
        <XCircleIcon size={18} class="text-gray-300" />
        <span class="text-gray-700">권한 없음</span>
      </div>
    </div>
  {/if}
</ThemeCard>
