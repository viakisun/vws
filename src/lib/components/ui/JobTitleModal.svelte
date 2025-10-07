<script lang="ts">
  import { pushToast } from '$lib/stores/toasts'
  import { createEventDispatcher, onMount } from 'svelte'
  import ThemeButton from './ThemeButton.svelte'
  import ThemeModal from './ThemeModal.svelte'

  interface JobTitle {
    id?: string
    name: string
    description: string
    level: number
    allowance: number
    status: 'active' | 'inactive'
  }

  interface Props {
    open?: boolean
    jobTitle?: JobTitle | null
    loading?: boolean
  }

  let { open = false, jobTitle = null, loading = false }: Props = $props()

  const dispatch = createEventDispatcher()

  let formData = $state({
    name: '',
    description: '',
    level: 1,
    allowance: 0,
    status: 'active' as 'active' | 'inactive',
  })

  // 직책 데이터가 변경될 때 폼 데이터 업데이트
  function _updateData() {
    if (jobTitle) {
      formData.name = jobTitle.name || ''
      formData.description = jobTitle.description || ''
      formData.level = jobTitle.level || 1
      formData.allowance = jobTitle.allowance || 0
      formData.status = jobTitle.status || 'active'
    } else {
      // 새 직책 추가 시 기본값으로 리셋
      formData.name = ''
      formData.description = ''
      formData.level = 1
      formData.allowance = 0
      formData.status = 'active'
    }
  }

  function handleSave() {
    // 필수 필드 검증
    if (!formData.name?.trim()) {
      pushToast('직책명은 필수 입력 항목입니다.', 'info')
      return
    }

    dispatch('save', formData)
  }

  function handleClose() {
    dispatch('close')
  }

  // 컴포넌트 마운트 시 초기화
  onMount(() => {
    // 초기화 함수들 호출
  })
</script>

<ThemeModal {open} onclose={handleClose} size="md">
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold" style:color="var(--color-text)">
        {jobTitle ? '직책 수정' : '새 직책 추가'}
      </h2>
    </div>

    <form
      onsubmit={(e) => {
        e.preventDefault()
        handleSave()
      }}
      class="space-y-4"
    >
      <!-- 직책명 -->
      <div>
        <label
          for="job-title-name"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          직책명 *
        </label>
        <input
          id="job-title-name"
          type="text"
          bind:value={formData.name}
          placeholder="예: 팀장, 파트장, 실장, 본부장"
          class="w-full px-3 py-2 border rounded-md text-sm"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
          required
        />
      </div>

      <!-- 직책 설명 -->
      <div>
        <label
          for="job-title-description"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          직책 설명
        </label>
        <textarea
          id="job-title-description"
          bind:value={formData.description}
          placeholder="직책의 역할과 책임을 설명해주세요"
          rows="3"
          class="w-full px-3 py-2 border rounded-md text-sm resize-none"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
        ></textarea>
      </div>

      <!-- 직책 레벨 -->
      <div>
        <label
          for="job-title-level"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          직책 레벨
        </label>
        <input
          id="job-title-level"
          type="number"
          bind:value={formData.level}
          min="1"
          max="10"
          class="w-full px-3 py-2 border rounded-md text-sm"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
        />
        <p class="text-xs mt-1" style:color="var(--color-text-secondary)">
          숫자가 높을수록 상위 직책입니다 (1-10)
        </p>
      </div>

      <!-- 직책 수당 -->
      <div>
        <label
          for="job-title-allowance"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          직책 수당 (원)
        </label>
        <input
          id="job-title-allowance"
          type="number"
          bind:value={formData.allowance}
          min="0"
          step="10000"
          class="w-full px-3 py-2 border rounded-md text-sm"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
        />
        <p class="text-xs mt-1" style:color="var(--color-text-secondary)">
          이 직책에 대한 월 수당 금액
        </p>
      </div>

      <!-- 상태 -->
      <div>
        <label
          for="job-title-status"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          상태
        </label>
        <select
          id="job-title-status"
          bind:value={formData.status}
          class="w-full px-3 py-2 border rounded-md text-sm"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
        >
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
    </form>
  </div>

  <!-- 모달 액션 버튼 -->
  <div class="flex justify-end gap-2 pt-4 border-t" style:border-color="var(--color-border)">
    <ThemeButton variant="ghost" onclick={handleClose} disabled={loading}>취소</ThemeButton>
    <ThemeButton variant="primary" onclick={handleSave} disabled={loading}>
      {loading ? '저장 중...' : jobTitle ? '수정' : '추가'}
    </ThemeButton>
  </div>
</ThemeModal>
