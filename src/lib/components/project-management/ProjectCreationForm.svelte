<script lang="ts">
  import { logger } from '$lib/utils/logger'

  import { CheckIcon, XIcon } from '@lucide/svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  // 간소화된 폼 데이터 상태
  const projectData = $state({
    title: '',
    code: '',
    description: '',
    status: 'planning', // 기본값을 '기획'으로 설정
  })

  // 예산 입력 단계 제거됨

  // UI 상태
  let isSubmitting = $state(false)
  let validationErrors = $state<string[]>([])

  // 간소화된 폼 검증
  function validateForm(): boolean {
    const errors: string[] = []

    if (!projectData.title.trim()) {
      errors.push('프로젝트명을 입력해주세요.')
    }

    if (!projectData.code.trim()) {
      errors.push('프로젝트 코드를 입력해주세요.')
    }

    validationErrors = errors
    return errors.length === 0
  }

  // 간소화된 프로젝트 생성
  async function createProject() {
    if (!validateForm()) return

    isSubmitting = true
    validationErrors = []

    try {
      logger.log('🚀 [UI] 프로젝트 생성 요청 시작')
      logger.log('📋 [UI] 전송 데이터:', JSON.stringify(projectData, null, 2))

      const response = await fetch('/api/project-management/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      const result = await response.json()

      if (result.success) {
        logger.log('✅ [UI] 프로젝트 생성 성공:', result)
        // 프로젝트 생성 후 바로 완료
        dispatch('projectCreated', result)
        resetForm()
      } else {
        logger.log('❌ [UI] 프로젝트 생성 실패:', result.error)
        validationErrors = [result.error || '프로젝트 생성 중 오류가 발생했습니다.']
      }
    } catch (error) {
      logger.error('💥 [UI] 프로젝트 생성 중 오류:', error)
      validationErrors = ['프로젝트 생성 중 오류가 발생했습니다.']
    } finally {
      isSubmitting = false
    }
  }

  // 폼 초기화
  function resetForm() {
    projectData.title = ''
    projectData.code = ''
    projectData.description = ''
    projectData.status = 'planning'
  }
</script>

<div class="p-6">
  <h2 class="text-2xl font-bold text-gray-900 mb-6">새 프로젝트 생성</h2>

  <!-- 검증 오류 표시 -->
  {#if validationErrors.length > 0}
    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center">
        <XIcon class="w-5 h-5 text-red-500 mr-2" />
        <h3 class="text-sm font-medium text-red-800">검증 오류</h3>
      </div>
      <ul class="mt-2 text-sm text-red-700">
        {#each validationErrors as error, i (i)}
          <li>• {error}</li>
        {/each}
      </ul>
    </div>
  {/if}
  <!-- 프로젝트 정보 입력 -->
  <div class="space-y-6">
    <div>
      <label for="projectTitle" class="block text-sm font-medium text-gray-700 mb-2">
        프로젝트명 *
      </label>
      <input
        id="projectTitle"
        type="text"
        bind:value={projectData.title}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="프로젝트명을 입력하세요"
      />
    </div>

    <div>
      <label for="projectCode" class="block text-sm font-medium text-gray-700 mb-2">
        프로젝트 코드 *
      </label>
      <input
        id="projectCode"
        type="text"
        bind:value={projectData.code}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="예: PROJ-2024-001"
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
        프로젝트 설명 (선택사항)
      </label>
      <textarea
        id="description"
        bind:value={projectData.description}
        rows="4"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="프로젝트에 대한 설명을 입력하세요"
      ></textarea>
    </div>

    <div>
      <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
        프로젝트 상태
      </label>
      <select
        id="status"
        bind:value={projectData.status}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="planning">기획</option>
        <option value="active">진행</option>
        <option value="completed">완료</option>
      </select>
    </div>
  </div>

  <!-- 하단 버튼 -->
  <div class="flex justify-end mt-8 pt-6 border-t border-gray-200">
    <button
      type="button"
      onclick={createProject}
      disabled={isSubmitting}
      class="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      {#if isSubmitting}
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        생성 중...
      {:else}
        <CheckIcon class="w-4 h-4 mr-2" />
        프로젝트 생성
      {/if}
    </button>
  </div>
</div>
