<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type { Asset } from '$lib/types/asset'
  import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from 'lucide-svelte'

  // Props
  interface Props {
    assets: Asset[]
    onEdit?: (asset: Asset) => void
    onDelete?: (asset: Asset) => void
    onAdd?: () => void
  }

  let { assets = [], onEdit, onDelete, onAdd }: Props = $props()

  // 상태 관리
  let searchTerm = $state('')
  let statusFilter = $state('all')
  let categoryFilter = $state('all')
  let sortBy = $state('name')
  let sortOrder = $state<'asc' | 'desc'>('asc')

  // 필터링 및 정렬된 자산 목록
  let filteredAssets = $derived(() => {
    let filtered = assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || asset.category_id === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })

    // 정렬
    filtered.sort((a, b) => {
      let aValue = ''
      let bValue = ''

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'serialNumber':
          aValue = a.serial_number || ''
          bValue = b.serial_number || ''
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'location':
          aValue = a.location || ''
          bValue = b.location || ''
          break
        case 'purchaseDate':
          aValue = a.purchase_date || ''
          bValue = b.purchase_date || ''
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
      case 'available':
        return 'success'
      case 'assigned':
        return 'primary'
      case 'in_repair':
        return 'warning'
      case 'disposed':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  // 상태 한글명
  function getStatusLabel(status: string) {
    switch (status) {
      case 'available':
        return '사용 가능'
      case 'assigned':
        return '사용 중'
      case 'in_repair':
        return '수리 중'
      case 'disposed':
        return '폐기'
      default:
        return status
    }
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

  // 가격 포맷팅
  function formatPrice(price?: number) {
    if (!price) return '-'
    return new Intl.NumberFormat('ko-KR').format(price) + '원'
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
          placeholder="자산명, 시리얼번호, 위치로 검색..."
          class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- 상태 필터 -->
      <select
        bind:value={statusFilter}
        class="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">모든 상태</option>
        <option value="available">사용 가능</option>
        <option value="assigned">사용 중</option>
        <option value="in_repair">수리 중</option>
        <option value="disposed">폐기</option>
      </select>
    </div>

    <!-- 새 자산 추가 버튼 -->
    <ThemeButton variant="primary" onclick={onAdd}>
      <PlusIcon class="w-4 h-4 mr-2" />
      새 자산 추가
    </ThemeButton>
  </div>

  <!-- 자산 테이블 -->
  <ThemeCard>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 :bg-gray-700"
              onclick={() => handleSort('name')}
            >
              자산명 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 :bg-gray-700"
              onclick={() => handleSort('serialNumber')}
            >
              시리얼번호 {sortBy === 'serialNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 :bg-gray-700"
              onclick={() => handleSort('status')}
            >
              상태 {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 :bg-gray-700"
              onclick={() => handleSort('location')}
            >
              위치 {sortBy === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              할당자
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              구매가격
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              액션
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each filteredAssets() as asset}
            <tr class="hover:bg-gray-50 :bg-gray-800">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {asset.name}
                </div>
                <div class="text-sm text-gray-500">
                  {asset.category?.name || '카테고리 없음'}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {asset.serial_number || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusBadgeVariant(asset.status)}>
                  {getStatusLabel(asset.status)}
                </Badge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {asset.location || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {asset.current_assignment?.employee?.first_name || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatPrice(asset.purchase_price)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <button
                    onclick={() => onEdit?.(asset)}
                    class="text-blue-600 hover:text-blue-900 :text-blue-300"
                  >
                    <EditIcon class="w-4 h-4" />
                  </button>
                  <button
                    onclick={() => onDelete?.(asset)}
                    class="text-red-600 hover:text-red-900 :text-red-300"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-gray-500"> 자산이 없습니다. </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 (필요시 추가) -->
    {#if filteredAssets.length > 0}
      <div class="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            총 {filteredAssets.length}개 자산
          </div>
        </div>
      </div>
    {/if}
  </ThemeCard>
</div>
