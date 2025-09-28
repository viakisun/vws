<script lang="ts">
  import { logger } from '$lib/utils/logger'
  import { onMount } from 'svelte'

  import { XIcon } from '@lucide/svelte'

  interface Company {
    id?: string
    name: string
    establishment_date?: string
    ceo_name?: string
    business_type?: string
    address?: string
    phone?: string
    fax?: string
    email?: string
    website?: string
    registration_number?: string
  }

  interface Props {
    open: boolean
    company?: Company | null
    loading?: boolean
    onclose?: () => void
    onsave?: (event: CustomEvent) => void
  }

  let { open, company = null, loading = false, onclose, onsave }: Props = $props()

  let formData = $state<Company>({
    name: '',
    establishment_date: '',
    ceo_name: '',
    business_type: '',
    address: '',
    phone: '',
    fax: '',
    email: '',
    website: '',
    registration_number: '',
  })

  // 회사 정보가 변경될 때 폼 데이터 업데이트
  function updateData() {

    if (company) {
      formData = {
        name: company.name || '',
        establishment_date: company.establishment_date || '',
        ceo_name: company.ceo_name || '',
        business_type: company.business_type || '',
        address: company.address || '',
        phone: company.phone || '',
        fax: company.fax || '',
        email: company.email || '',
        website: company.website || '',
        registration_number: company.registration_number || '',
      }
    } else {
      formData = {
        name: '',
        establishment_date: '',
        ceo_name: '',
        business_type: '',
        address: '',
        phone: '',
        fax: '',
        email: '',
        website: '',
        registration_number: '',
      }
    }
  
}

  // 저장 함수
  async function handleSave() {
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        // 성공 이벤트 발생
        if (onsave) {
          onsave(new CustomEvent('save', { detail: { company: result.data } }))
        }
        if (onclose) {
          onclose()
        }
      } else {
        alert('오류: ' + result.error)
      }
    } catch (error) {
      logger.error('Error saving company:', error)
      alert('회사 정보 저장 중 오류가 발생했습니다.')
    }
  }

  // 모달 닫기
  function handleClose() {
    if (onclose) {
      onclose()
    }
  }


  // 컴포넌트 마운트 시 초기화
  onMount(() => {
    // 초기화 함수들 호출
  })
</script>

{#if open}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- 헤더 -->
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-xl font-semibold text-gray-900">
          {company ? '회사 정보 수정' : '회사 정보 등록'}
        </h2>
        <button
          type="button"
          onclick={handleClose}
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- 폼 -->
      <div class="p-6 space-y-4">
        <!-- 회사명 -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">회사명 *</label>
          <input
            type="text"
            id="name"
            bind:value={formData.name}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="회사명을 입력하세요"
          />
        </div>

        <!-- 설립일 -->
        <div>
          <label for="establishment_date" class="block text-sm font-medium text-gray-700 mb-1"
            >설립일</label
          >
          <input
            type="date"
            id="establishment_date"
            bind:value={formData.establishment_date}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- 대표이사 -->
        <div>
          <label for="ceo_name" class="block text-sm font-medium text-gray-700 mb-1">대표이사</label
          >
          <input
            type="text"
            id="ceo_name"
            bind:value={formData.ceo_name}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="대표이사명을 입력하세요"
          />
        </div>

        <!-- 업종 -->
        <div>
          <label for="business_type" class="block text-sm font-medium text-gray-700 mb-1"
            >업종</label
          >
          <input
            type="text"
            id="business_type"
            bind:value={formData.business_type}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="업종을 입력하세요"
          />
        </div>

        <!-- 주소 -->
        <div>
          <label for="address" class="block text-sm font-medium text-gray-700 mb-1">주소</label>
          <textarea
            id="address"
            bind:value={formData.address}
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="주소를 입력하세요"
          ></textarea>
        </div>

        <!-- 전화번호 -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
          <input
            type="tel"
            id="phone"
            bind:value={formData.phone}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="전화번호를 입력하세요"
          />
        </div>

        <!-- 팩스번호 -->
        <div>
          <label for="fax" class="block text-sm font-medium text-gray-700 mb-1">팩스번호</label>
          <input
            type="tel"
            id="fax"
            bind:value={formData.fax}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="팩스번호를 입력하세요"
          />
        </div>

        <!-- 이메일 -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            id="email"
            bind:value={formData.email}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="이메일을 입력하세요"
          />
        </div>

        <!-- 웹사이트 -->
        <div>
          <label for="website" class="block text-sm font-medium text-gray-700 mb-1">웹사이트</label>
          <input
            type="url"
            id="website"
            bind:value={formData.website}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="웹사이트 URL을 입력하세요"
          />
        </div>

        <!-- 사업자등록번호 -->
        <div>
          <label for="registration_number" class="block text-sm font-medium text-gray-700 mb-1"
            >사업자등록번호</label
          >
          <input
            type="text"
            id="registration_number"
            bind:value={formData.registration_number}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="사업자등록번호를 입력하세요"
          />
        </div>
      </div>

      <!-- 푸터 -->
      <div class="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
        <button
          type="button"
          onclick={handleClose}
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onclick={handleSave}
          disabled={loading || !formData.name}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '저장 중...' : company ? '수정' : '등록'}
        </button>
      </div>
    </div>
  </div>
{/if}
