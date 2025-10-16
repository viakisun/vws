<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type { CompanyCertification } from '$lib/types/asset'
  import {
    AlertTriangleIcon,
    EditIcon,
    FileTextIcon,
    PlusIcon,
    SearchIcon,
    TrashIcon,
    UploadIcon,
  } from 'lucide-svelte'

  // Props
  interface Props {
    certifications: CompanyCertification[]
    onEdit?: (certification: CompanyCertification) => void
    onDelete?: (certification: CompanyCertification) => void
    onAdd?: () => void
    onUpload?: (certification: CompanyCertification) => void
  }

  let { certifications = [], onEdit, onDelete, onAdd, onUpload }: Props = $props()

  // 상태 관리
  let searchTerm = $state('')
  let statusFilter = $state('all')
  let sortBy = $state('name')
  let sortOrder = $state<'asc' | 'desc'>('asc')

  // 필터링 및 정렬된 인증서 목록
  let filteredCertifications = $derived(() => {
    let filtered = certifications.filter((cert) => {
      const matchesSearch =
        cert.certification_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.issuing_authority?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certification_number?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || cert.status === statusFilter

      return matchesSearch && matchesStatus
    })

    // 정렬
    filtered.sort((a, b) => {
      let aValue = ''
      let bValue = ''

      switch (sortBy) {
        case 'name':
          aValue = a.certification_name
          bValue = b.certification_name
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
      case 'active':
        return 'success'
      case 'expired':
        return 'danger'
      case 'pending_renewal':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  // 상태 한글명
  function getStatusLabel(status: string) {
    switch (status) {
      case 'active':
        return '유효'
      case 'expired':
        return '만료됨'
      case 'pending_renewal':
        return '갱신 필요'
      default:
        return status
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

  // 만료 임박 체크 (2개월 이내)
  function isExpiringSoon(expirationDate?: string) {
    if (!expirationDate) return false
    const expDate = new Date(expirationDate)
    const twoMonthsFromNow = new Date()
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2)
    return expDate <= twoMonthsFromNow && expDate > new Date()
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
          placeholder="인증명, 발급기관, 인증번호로 검색..."
          class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- 상태 필터 -->
      <select
        bind:value={statusFilter}
        class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">모든 상태</option>
        <option value="active">유효</option>
        <option value="expired">만료됨</option>
        <option value="pending_renewal">갱신 필요</option>
      </select>
    </div>

    <!-- 새 인증서 추가 버튼 -->
    <ThemeButton variant="primary" onclick={onAdd}>
      <PlusIcon class="w-4 h-4 mr-2" />
      새 인증서 추가
    </ThemeButton>
  </div>

  <!-- 인증서 테이블 -->
  <ThemeCard>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onclick={() => handleSort('name')}
            >
              인증명 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              발급기관
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              인증번호
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
              발급일
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
          {#each filteredCertifications() as certification}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {certification.certification_name}
                  </div>
                  {#if isExpiringSoon(certification.expiry_date)}
                    <AlertTriangleIcon class="w-4 h-4 text-yellow-500 ml-2" />
                  {/if}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {certification.certification_type || '타입 없음'}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {certification.issuing_authority || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {certification.certification_number || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusBadgeVariant(certification.status)}>
                  {getStatusLabel(certification.status)}
                </Badge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {formatDate(certification.issue_date)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <div class="flex items-center">
                  {formatDate(certification.expiry_date)}
                  {#if isExpiringSoon(certification.expiry_date)}
                    <span class="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                      만료 임박
                    </span>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  {#if certification.document_s3_key}
                    <button
                      onclick={() => window.open('#', '_blank')}
                      class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      title="문서 보기"
                    >
                      <FileTextIcon class="w-4 h-4" />
                    </button>
                  {:else}
                    <button
                      onclick={() => onUpload?.(certification)}
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="문서 업로드"
                    >
                      <UploadIcon class="w-4 h-4" />
                    </button>
                  {/if}
                  <button
                    onclick={() => onEdit?.(certification)}
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="수정"
                  >
                    <EditIcon class="w-4 h-4" />
                  </button>
                  <button
                    onclick={() => onDelete?.(certification)}
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="삭제"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                인증서가 없습니다.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    {#if filteredCertifications().length > 0}
      <div
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            총 {filteredCertifications().length}개 인증서
          </div>
        </div>
      </div>
    {/if}
  </ThemeCard>
</div>
