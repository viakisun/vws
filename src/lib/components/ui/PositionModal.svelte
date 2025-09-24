<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import ThemeModal from './ThemeModal.svelte'
  import ThemeButton from './ThemeButton.svelte'

  interface Position {
    id?: string
    name: string
    description: string
    department: string
    level: number
    status: 'active' | 'inactive'
  }

  interface Props {
    open?: boolean
    position?: Position | null
    departments?: Array<{ id: string; name: string }>
    loading?: boolean
  }

  let { open = false, position = null, departments = [], loading = false }: Props = $props()

  const dispatch = createEventDispatcher()

  let formData = $state({
    name: '',
    description: '',
    department: '',
    level: 1,
    status: 'active' as 'active' | 'inactive',
  })

  // 직급 데이터가 변경될 때 폼 데이터 업데이트
  $effect(() => {
    if (position) {
      formData.name = position.name || ''
      formData.description = position.description || ''
      formData.department = position.department || ''
      formData.level = position.level || 1
      formData.status = position.status || 'active'
    } else {
      // 새 직급 추가 시 기본값으로 리셋
      formData.name = ''
      formData.description = ''
      formData.department = departments.length > 0 ? departments[0].name : ''
      formData.level = 1
      formData.status = 'active'
    }
  })

  function handleSave() {
    // 필수 필드 검증
    if (!formData.name?.trim()) {
      alert('직급명은 필수 입력 항목입니다.')
      return
    }

    if (!formData.department?.trim()) {
      alert('부서는 필수 선택 항목입니다.')
      return
    }

    dispatch('save', formData)
  }

  function handleClose() {
    dispatch('close')
  }
</script>

<ThemeModal {open} onclose={handleClose} size="md">
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold" style:color="var(--color-text)">
        {position ? '직급 수정' : '새 직급 추가'}
      </h2>
    </div>

    <form
      onsubmit={(e) => {
        e.preventDefault()
        handleSave()
      }}
      class="space-y-4"
    >
      <!-- 부서 선택 -->
      <div>
        <label
          for="pos-department"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          부서 *
        </label>
        <select
          id="pos-department"
          bind:value={formData.department}
          class="w-full px-3 py-2 border rounded-md text-sm"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
          required
        >
          <option value="">부서를 선택하세요</option>
          {#each departments as dept, i (i)}
            <option value={dept.name}>{dept.name}</option>
          {/each}
        </select>
      </div>

      <!-- 직급명 -->
      <div>
        <label
          for="pos-name"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          직급명 *
        </label>
        <input
          id="pos-name"
          type="text"
          bind:value={formData.name}
          placeholder="예: 연구원, 선임연구원, 책임연구원, 행정원"
          class="w-full px-3 py-2 border rounded-md text-sm"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
          required
        />
      </div>

      <!-- 직급 설명 -->
      <div>
        <label
          for="pos-description"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          직급 설명
        </label>
        <textarea
          id="pos-description"
          bind:value={formData.description}
          placeholder="직급의 역할과 책임을 설명해주세요"
          rows="3"
          class="w-full px-3 py-2 border rounded-md text-sm resize-none"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
        ></textarea>
      </div>

      <!-- 직급 레벨 -->
      <div>
        <label
          for="pos-level"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          직급 레벨
        </label>
        <input
          id="pos-level"
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
          숫자가 높을수록 상위 직급입니다 (1-10)
        </p>
      </div>

      <!-- 상태 -->
      <div>
        <label
          for="pos-status"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          상태
        </label>
        <select
          id="pos-status"
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
      {loading ? '저장 중...' : position ? '수정' : '추가'}
    </ThemeButton>
  </div>
</ThemeModal>
