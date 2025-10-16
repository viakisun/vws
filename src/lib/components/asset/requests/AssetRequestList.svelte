<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type { AssetRequest } from '$lib/types/asset'
  import { CheckIcon, EyeIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-svelte'

  // Props
  interface Props {
    requests: AssetRequest[]
    onEdit?: (request: AssetRequest) => void
    onView?: (request: AssetRequest) => void
    onApprove?: (request: AssetRequest) => void
    onReject?: (request: AssetRequest) => void
    onAdd?: () => void
    canApprove?: boolean
  }

  let {
    requests = [],
    onEdit,
    onView,
    onApprove,
    onReject,
    onAdd,
    canApprove = false,
  }: Props = $props()

  // 상태 관리
  let searchTerm = $state('')
  let statusFilter = $state('all')
  let typeFilter = $state('all')
  let sortBy = $state('createdAt')
  let sortOrder = $state<'asc' | 'desc'>('desc')

  // 필터링 및 정렬된 신청 목록
  let filteredRequests = $derived(() => {
    let filtered = requests.filter((request) => {
      const matchesSearch =
        request.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || request.status === statusFilter
      const matchesType = typeFilter === 'all' || request.request_type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })

    // 정렬
    filtered.sort((a, b) => {
      let aValue = ''
      let bValue = ''

      switch (sortBy) {
        case 'createdAt':
          aValue = a.created_at
          bValue = b.created_at
          break
        case 'requesterName':
          aValue = a.requester?.first_name || ''
          bValue = b.requester?.first_name || ''
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'requestType':
          aValue = a.request_type
          bValue = b.request_type
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
      case 'pending':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'danger'
      case 'completed':
        return 'primary'
      default:
        return 'secondary'
    }
  }

  // 상태 한글명
  function getStatusLabel(status: string) {
    switch (status) {
      case 'pending':
        return '대기 중'
      case 'approved':
        return '승인됨'
      case 'rejected':
        return '거부됨'
      case 'completed':
        return '완료됨'
      default:
        return status
    }
  }

  // 요청 유형 한글명
  function getRequestTypeLabel(type: string) {
    switch (type) {
      case 'issue':
        return '자산 사용'
      case 'return':
        return '자산 반납'
      case 'vehicle_reservation':
        return '차량 예약'
      case 'new_purchase':
        return '신규 구매'
      case 'repair':
        return '수리 신청'
      default:
        return type
    }
  }

  // 날짜 포맷팅
  function formatDate(dateString: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
          placeholder="자산명, 신청자, 사유로 검색..."
          class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- 상태 필터 -->
      <select
        bind:value={statusFilter}
        class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">모든 상태</option>
        <option value="pending">대기 중</option>
        <option value="approved">승인됨</option>
        <option value="rejected">거부됨</option>
        <option value="completed">완료됨</option>
      </select>

      <!-- 유형 필터 -->
      <select
        bind:value={typeFilter}
        class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">모든 유형</option>
        <option value="issue">자산 사용</option>
        <option value="return">자산 반납</option>
        <option value="vehicle_reservation">차량 예약</option>
        <option value="new_purchase">신규 구매</option>
        <option value="repair">수리 신청</option>
      </select>
    </div>

    <!-- 새 신청 버튼 -->
    <ThemeButton variant="primary" onclick={onAdd}>
      <PlusIcon class="w-4 h-4 mr-2" />
      새 신청
    </ThemeButton>
  </div>

  <!-- 신청 테이블 -->
  <ThemeCard>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onclick={() => handleSort('createdAt')}
            >
              신청일 {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onclick={() => handleSort('requesterName')}
            >
              신청자 {sortBy === 'requesterName' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onclick={() => handleSort('requestType')}
            >
              신청 유형 {sortBy === 'requestType' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              자산/목적
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
              액션
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {#each filteredRequests() as request}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {formatDate(request.created_at)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {request.requester?.first_name || '알 수 없음'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {getRequestTypeLabel(request.request_type)}
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {request.asset?.name || '-'}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                  {request.purpose || '-'}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusBadgeVariant(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <button
                    onclick={() => onView?.(request)}
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="상세보기"
                  >
                    <EyeIcon class="w-4 h-4" />
                  </button>

                  {#if canApprove && request.status === 'pending'}
                    <button
                      onclick={() => onApprove?.(request)}
                      class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      title="승인"
                    >
                      <CheckIcon class="w-4 h-4" />
                    </button>
                    <button
                      onclick={() => onReject?.(request)}
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="거부"
                    >
                      <XIcon class="w-4 h-4" />
                    </button>
                  {/if}

                  {#if !canApprove && request.status === 'pending'}
                    <button
                      onclick={() => onEdit?.(request)}
                      class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      title="수정"
                    >
                      <EyeIcon class="w-4 h-4" />
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                신청이 없습니다.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    {#if filteredRequests.length > 0}
      <div
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            총 {filteredRequests.length}개 신청
          </div>
        </div>
      </div>
    {/if}
  </ThemeCard>
</div>
