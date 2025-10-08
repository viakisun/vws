<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import {
    CircleCheck as CheckCircleIcon,
    CircleX as XCircleIcon,
    Info as InfoIcon,
  } from 'lucide-svelte'

  interface PermissionRow {
    resource: string
    admin: 'full' | 'read' | 'none'
    management: 'full' | 'read' | 'none'
    finance: 'full' | 'read' | 'none'
    hr: 'full' | 'read' | 'none'
    sales: 'full' | 'read' | 'none'
    researcher: 'full' | 'read' | 'none'
    employee: 'full' | 'read' | 'none'
  }

  const permissions: PermissionRow[] = [
    {
      resource: '재무 관리',
      admin: 'full',
      management: 'read',
      finance: 'full',
      hr: 'none',
      sales: 'none',
      researcher: 'none',
      employee: 'none',
    },
    {
      resource: '인사 관리',
      admin: 'full',
      management: 'read',
      finance: 'none',
      hr: 'full',
      sales: 'none',
      researcher: 'none',
      employee: 'read',
    },
    {
      resource: '프로젝트 관리',
      admin: 'full',
      management: 'read',
      finance: 'none',
      hr: 'none',
      sales: 'none',
      researcher: 'full',
      employee: 'read',
    },
    {
      resource: '영업 관리',
      admin: 'full',
      management: 'read',
      finance: 'none',
      hr: 'none',
      sales: 'full',
      researcher: 'none',
      employee: 'none',
    },
    {
      resource: '대시보드',
      admin: 'full',
      management: 'full',
      finance: 'full',
      hr: 'full',
      sales: 'full',
      researcher: 'full',
      employee: 'full',
    },
  ]

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
  <h3 class="text-lg font-semibold text-gray-900 mb-4">권한 매트릭스</h3>

  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
    <InfoIcon size={20} class="text-blue-600 flex-shrink-0 mt-0.5" />
    <div>
      <h4 class="font-semibold text-blue-900 mb-1">권한 상속 구조</h4>
      <p class="text-sm text-blue-700">상위 역할은 하위 역할의 모든 권한을 상속받습니다.</p>
    </div>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-50 border-b-2 border-gray-200">
          <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">리소스</th>
          <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">관리자</th>
          <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">경영관리자</th>
          <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">재무관리자</th>
          <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">인사관리자</th>
          <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">영업</th>
          <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">연구원</th>
          <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">직원</th>
        </tr>
      </thead>
      <tbody>
        {#each permissions as row}
          <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-medium text-gray-900">{row.resource}</td>
            {#each ['admin', 'management', 'finance', 'hr', 'sales', 'researcher', 'employee'] as role}
              {@const permission = row[role as keyof typeof row] as 'full' | 'read' | 'none'}
              {@const { icon: Icon, class: iconClass } = getPermissionIcon(permission)}
              <td class="px-4 py-3 text-center">
                <Icon size={20} class="{iconClass} inline" />
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
      <span class="text-gray-700">전체 권한</span>
    </div>
    <div class="flex items-center gap-2">
      <CheckCircleIcon size={18} class="text-yellow-600" />
      <span class="text-gray-700">읽기 권한</span>
    </div>
    <div class="flex items-center gap-2">
      <XCircleIcon size={18} class="text-gray-300" />
      <span class="text-gray-700">권한 없음</span>
    </div>
  </div>
</ThemeCard>
