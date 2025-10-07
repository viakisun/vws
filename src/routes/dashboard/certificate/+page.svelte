<script lang="ts">
  import { pushToast } from '$lib/stores/toasts'
  import { onMount } from 'svelte'
  import type { PageData } from './$types'
  import { logger } from '$lib/utils/logger'

  let { data: _data }: { data: PageData } = $props()

  // Types
  interface CertificateRequest {
    id: string
    certificate_type: string
    purpose: string
    status: string
    request_date: string
    created_at: string // alias for request_date
    approval_date?: string
    approver_name?: string
    issue_date?: string
    issued_at?: string // alias for issue_date
  }

  interface CertificateData {
    userInfo: {
      name: string
      employeeId: string
      department: string
      position: string
      hireDate: string
      email: string
    }
    stats: {
      totalRequests: number
      pendingRequests: number
      approvedRequests: number
      issuedRequests: number
    }
    requests: CertificateRequest[]
  }

  // 상태 관리
  let certificateData = $state<CertificateData | null>(null)
  let loading = $state(false)
  let showRequestModal = $state(false)

  // 재직증명서 신청 폼
  let certificateType = $state('employment')
  let purpose = $state('')

  // 재직증명서 데이터 로드
  async function loadCertificateData() {
    loading = true
    try {
      const response = await fetch('/api/dashboard/certificate')
      const result = await response.json()

      if (result.success) {
        certificateData = result.data
      }
    } catch (error) {
      logger.error('Error loading certificate data:', error)
    } finally {
      loading = false
    }
  }

  // 재직증명서 신청
  async function submitCertificateRequest() {
    if (!purpose) {
      pushToast('발급 목적을 입력해주세요.', 'success')
      return
    }

    try {
      const response = await fetch('/api/dashboard/certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateType,
          purpose,
        }),
      })

      const result = await response.json()

      if (result.success) {
        showRequestModal = false
        resetForm()
        await loadCertificateData()
        pushToast('재직증명서 발급 요청이 완료되었습니다.', 'success')
      } else {
        pushToast(result.message, 'info')
      }
    } catch (error) {
      logger.error('Error submitting certificate request:', error)
      pushToast('재직증명서 발급 요청에 실패했습니다.', 'success')
    }
  }

  // 폼 초기화
  function resetForm() {
    certificateType = 'employment'
    purpose = ''
  }

  // 증명서 타입 라벨
  function getCertificateTypeLabel(type: string) {
    const labels = {
      employment: '재직증명서',
      income: '소득증명서',
      career: '경력증명서',
      other: '기타',
    }
    return labels[type] || type
  }

  // 상태 라벨
  function getStatusLabel(status: string) {
    const labels = {
      pending: '대기중',
      approved: '승인',
      rejected: '반려',
      issued: '발급완료',
    }
    return labels[status] || status
  }

  // 상태 색상
  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      issued: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // 날짜 포맷팅
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  // 초기 로드
  onMount(() => {
    loadCertificateData()
  })
</script>

<svelte:head>
  <title>재직증명서 - VWS</title>
</svelte:head>

<div class="space-y-6">
  <!-- 페이지 헤더 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">재직증명서</h1>
        <p class="text-gray-600">재직증명서 발급 요청 및 내역을 확인할 수 있습니다.</p>
      </div>
      <button
        type="button"
        onclick={() => (showRequestModal = true)}
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        발급 요청
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else if certificateData}
    <!-- 개인 정보 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">개인 정보</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">성명</label>
            <div class="text-lg font-semibold text-gray-900">{certificateData.userInfo.name}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">사번</label>
            <div class="text-lg text-gray-900">{certificateData.userInfo.employeeId}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">부서</label>
            <div class="text-lg text-gray-900">{certificateData.userInfo.department}</div>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">직급</label>
            <div class="text-lg text-gray-900">{certificateData.userInfo.position}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">입사일</label>
            <div class="text-lg text-gray-900">
              {new Date(certificateData.userInfo.hireDate).toLocaleDateString('ko-KR')}
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">이메일</label>
            <div class="text-lg text-gray-900">{certificateData.userInfo.email}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 발급 통계 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">이번 해 발급 통계</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="text-sm text-blue-600">총 요청</div>
          <div class="text-2xl font-bold text-blue-900">
            {certificateData.stats.totalRequests}건
          </div>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="text-sm text-yellow-600">대기중</div>
          <div class="text-2xl font-bold text-yellow-900">
            {certificateData.stats.pendingRequests}건
          </div>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <div class="text-sm text-green-600">승인</div>
          <div class="text-2xl font-bold text-green-900">
            {certificateData.stats.approvedRequests}건
          </div>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
          <div class="text-sm text-purple-600">발급완료</div>
          <div class="text-2xl font-bold text-purple-900">
            {certificateData.stats.issuedRequests}건
          </div>
        </div>
      </div>
    </div>

    <!-- 발급 요청 내역 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">발급 요청 내역</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >증명서 유형</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >발급 목적</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >상태</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >요청일</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >승인자</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >발급일</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each certificateData.requests as request}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getCertificateTypeLabel(request.certificate_type)}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {request.purpose}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(
                      request.status,
                    )}"
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(request.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.approver_name || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.issued_at ? formatDate(request.issued_at) : '-'}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- 발급 요청 모달 -->
{#if showRequestModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">재직증명서 발급 요청</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">증명서 유형</label>
            <select
              bind:value={certificateType}
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="employment">재직증명서</option>
              <option value="income">소득증명서</option>
              <option value="career">경력증명서</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">발급 목적</label>
            <textarea
              bind:value={purpose}
              placeholder="재직증명서 발급 목적을 입력해주세요 (예: 대출 신청, 주택 구입 등)"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onclick={() => {
              showRequestModal = false
              resetForm()
            }}
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            취소
          </button>
          <button
            type="button"
            onclick={submitCertificateRequest}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            요청
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
