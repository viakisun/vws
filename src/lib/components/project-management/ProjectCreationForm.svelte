<script lang="ts">
  import { CheckIcon, XIcon } from '@lucide/svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  // 간소화된 폼 데이터 상태
  let projectData = $state({
    title: '',
    code: '',
    description: '',
    status: 'planning' // 기본값을 '기획'으로 설정
  })

  // 예산 입력 단계 관리
  let showBudgetStep = $state(false)
  let createdProjectId = $state<string | null>(null)

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
      console.log('🚀 [UI] 프로젝트 생성 요청 시작')
      console.log('📋 [UI] 전송 데이터:', JSON.stringify(projectData, null, 2))

      const response = await fetch('/api/project-management/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ [UI] 프로젝트 생성 성공:', result)
        createdProjectId = result.data?.id

        if (createdProjectId) {
          // 예산 입력 단계로 이동
          showBudgetStep = true
        } else {
          // 예산 입력 없이 완료
          dispatch('projectCreated', result)
          resetForm()
        }
      } else {
        console.log('❌ [UI] 프로젝트 생성 실패:', result.error)
        validationErrors = [result.error || '프로젝트 생성 중 오류가 발생했습니다.']
      }
    } catch (error) {
      console.error('💥 [UI] 프로젝트 생성 중 오류:', error)
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
    showBudgetStep = false
    createdProjectId = null
  }

  // 예산 저장 완료 핸들러
  function handleBudgetSaved(event: CustomEvent) {
    dispatch('projectCreated', {
      success: true,
      data: { id: createdProjectId },
      message: '프로젝트와 예산이 성공적으로 생성되었습니다.'
    })
    resetForm()
  }

  // 예산 입력 건너뛰기
  function skipBudgetStep() {
    dispatch('projectCreated', {
      success: true,
      data: { id: createdProjectId },
      message: '프로젝트가 성공적으로 생성되었습니다. 예산은 나중에 설정할 수 있습니다.'
    })
    resetForm()
  }
</script>

<div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
  <h2 class="text-2xl font-bold text-gray-900 mb-6">새 프로젝트 생성</h2>

  <!-- 검증 오류 표시 -->
  {#if validationErrors.length > 0}
    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center">
        <XIcon class="w-5 h-5 text-red-500 mr-2" />
        <h3 class="text-sm font-medium text-red-800">검증 오류</h3>
      </div>
      <ul class="mt-2 text-sm text-red-700">
        {#each validationErrors as error}
          <li>• {error}</li>
        {/each}
      </ul>
    </div>
  {/if}
  {#if !showBudgetStep}
    <!-- 1단계: 기본 프로젝트 정보 입력 -->
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
  {:else}
    <!-- 2단계: 연차별 예산 입력 -->
    <div class="mb-6">
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <CheckIcon class="w-5 h-5 text-green-500 mr-2" />
          <div>
            <h3 class="text-sm font-medium text-green-800">프로젝트가 생성되었습니다!</h3>
            <p class="text-sm text-green-700 mt-1">이제 연차별 예산을 설정해주세요.</p>
          </div>
        </div>
      </div>
    </div>

    {#await import('$lib/components/project-management/AnnualBudgetForm.svelte')}
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">예산 입력 폼을 로딩 중...</p>
      </div>
    {:then { default: AnnualBudgetForm }}
      <AnnualBudgetForm
        projectId={createdProjectId || ''}
        existingBudgets={[]}
        readonly={false}
        onbudgetSaved={handleBudgetSaved}
      />
    {:catch error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center">
          <XIcon class="w-5 h-5 text-red-500 mr-2" />
          <div>
            <h3 class="text-sm font-medium text-red-800">예산 폼 로딩 실패</h3>
            <p class="text-sm text-red-700 mt-1">예산 입력 폼을 로딩할 수 없습니다.</p>
          </div>
        </div>
      </div>
    {/await}
  {/if}

  <!-- 하단 버튼 -->
  <div class="flex justify-between mt-8 pt-6 border-t border-gray-200">
    {#if showBudgetStep}
      <button
        type="button"
        onclick={skipBudgetStep}
        class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        나중에 설정
      </button>
    {:else}
      <div></div>
    {/if}

    {#if !showBudgetStep}
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
    {/if}
  </div>
</div>
