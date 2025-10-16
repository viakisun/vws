<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type { IntellectualProperty } from '$lib/types/asset'
  import { AlertTriangleIcon, EditIcon, PlusIcon, SearchIcon, TrashIcon } from 'lucide-svelte'

  // Props
  interface Props {
    ipAssets: IntellectualProperty[]
    onEdit?: (asset: IntellectualProperty) => void
    onDelete?: (asset: IntellectualProperty) => void
    onAdd?: () => void
  }

  let { ipAssets = [], onEdit, onDelete, onAdd }: Props = $props()

  // 상태 관리
  let searchTerm = $state('')
  let statusFilter = $state('all')
  let typeFilter = $state('all')
  let sortBy = $state('name')
  let sortOrder = $state<'asc' | 'desc'>('asc')

  // 필터링 및 정렬된 IP 자산 목록
  let filteredAssets = $derived(() => {
    let filtered = ipAssets.filter((asset) => {
      const matchesSearch =
        asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
      const matchesType = typeFilter === 'all' || asset.ip_type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })

    // 정렬
    filtered.sort((a, b) => {
      let aValue = ''
      let bValue = ''

      switch (sortBy) {
        case 'name':
          aValue = a.title
          bValue = b.title
          break
        case 'registrationNumber':
          aValue = a.registration_number || ''
          bValue = b.registration_number || ''
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'expirationDate':
          aValue = a.expiry_date || ''
          bValue = b.expiry_date || ''
          break
      }

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })

    return filtered
  })

  // 상태별 배지 스타일
  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'registered':
        return 'success'
      case 'pending':
        return 'warning'
      case 'expired':
        return 'danger'
      case 'abandoned':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  // 상태 한글명
  function getStatusLabel(status: string) {
    switch (status) {
      case 'registered':
        return '등록됨'
      case 'pending':
        return '등록 대기'
      case 'expired':
        return '만료됨'
      case 'abandoned':
        return '포기됨'
      default:
        return status
    }
  }

  // IP 유형 한글명
  function getTypeLabel(type: string) {
    switch (type) {
      case 'patent':
        return '특허'
      case 'trademark':
        return '상표'
      case 'utility_model':
        return '실용신안'
      case 'design':
        return '디자인'
      case 'domain':
        return '도메인'
      case 'copyright':
        return '저작권'
      default:
        return type
    }
  }

  // 날짜 포맷팅
  function formatDate(dateString?: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // 만료 임박 체크 (3개월 이내)
  function isExpiringSoon(expirationDate?: string) {
    if (!expirationDate) return false
    const expDate = new Date(expirationDate)
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    return expDate <= threeMonthsFromNow && expDate > new Date()
  }

  // 정렬 핸들러
  function handleSort(field: string) {
    if (sortBy === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy = field
      sortOrder = 'asc'
    }
  }
</script>

<div class="space-y-4">
  <!-- 상단 액션 바 -->
  <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
    <div class="flex flex-col sm:flex-row gap-2 flex-1">
      <!-- 검색 -->
      <div class="relative">
        <SearchIcon
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
        />
        <input
          bind:value={searchTerm}
          type="text"
          placeholder="IP명, 등록번호, 설명으로 검색..."
          class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- 상태 필터 -->
      <select
        bind:value={statusFilter}
        class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">모든 상태</option>
        <option value="registered">등록됨</option>
        <option value="pending">등록 대기</option>
        <option value="expired">만료됨</option>
        <option value="abandoned">포기됨</option>
      </select>

      <!-- 유형 필터 -->
      <select
        bind:value={typeFilter}
        class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">모든 유형</option>
        <option value="patent">특허</option>
        <option value="trademark">상표</option>
        <option value="utility_model">실용신안</option>
        <option value="design">디자인</option>
        <option value="domain">도메인</option>
        <option value="copyright">저작권</option>
      </select>
    </div>

    <!-- 새 IP 추가 버튼 -->
    <ThemeButton variant="primary" onclick={onAdd}>
      <PlusIcon class="w-4 h-4 mr-2" />
      새 IP 추가
    </ThemeButton>
  </div>

  <!-- IP 자산 테이블 -->
  <ThemeCard>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onclick={() => handleSort('name')}
            >
              IP명 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              유형
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onclick={() => handleSort('registrationNumber')}
            >
              등록번호 {sortBy === 'registrationNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onclick={() => handleSort('status')}
            >
              상태 {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              등록일
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onclick={() => handleSort('expirationDate')}
            >
              만료일 {sortBy === 'expirationDate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              액션
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {#each filteredAssets() as asset}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {asset.title}
                  </div>
                  {#if isExpiringSoon(asset.expiry_date)}
                    <AlertTriangleIcon class="w-4 h-4 text-yellow-500 ml-2" />
                  {/if}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                  {asset.description || '-'}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge variant="primary">
                  {getTypeLabel(asset.ip_type)}
                </Badge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {asset.registration_number || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusBadgeVariant(asset.status)}>
                  {getStatusLabel(asset.status)}
                </Badge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {formatDate(asset.registration_date)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <div class="flex items-center">
                  {formatDate(asset.expiry_date)}
                  {#if isExpiringSoon(asset.expiry_date)}
                    <span class="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                      만료 임박
                    </span>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <button
                    onclick={() => onEdit?.(asset)}
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <EditIcon class="w-4 h-4" />
                  </button>
                  <button
                    onclick={() => onDelete?.(asset)}
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                지식재산권이 없습니다.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    {#if filteredAssets.length > 0}
      <div
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            총 {filteredAssets.length}개 지식재산권
          </div>
        </div>
      </div>
    {/if}
  </ThemeCard>
</div>
