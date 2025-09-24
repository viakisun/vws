<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import ThemeModal from './ThemeModal.svelte'
  import ThemeButton from './ThemeButton.svelte'

  interface Department {
    id?: string
    name: string
    description: string
    status: 'active' | 'inactive'
    max_employees?: number // T/O (정원)
  }

  interface Props {
    open?: boolean
    department?: Department | null
    loading?: boolean
  }

  let { open = false, department = null, loading = false }: Props = $props()

  const dispatch = createEventDispatcher()

  let formData = $state({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    to: 0,
  })

  // 부서 데이터가 변경될 때 폼 데이터 업데이트
  $effect(() => {
    if (department) {
      formData.name = department.name || ''
      formData.description = department.description || ''
      formData.status = department.status || 'active'
      formData.to = department.max_employees || 0
    } else {
      // 새 부서 추가 시 기본값으로 리셋
      formData.name = ''
      formData.description = ''
      formData.status = 'active'
      formData.to = 0
    }
  })

  function handleSave() {
    // 필수 필드 검증
    if (!formData.name?.trim()) {
      alert('부서명은 필수 입력 항목입니다.')
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
        {department ? '부서 수정' : '새 부서 추가'}
      </h2>
    </div>

    <form
      onsubmit={(e) => {
        e.preventDefault()
        handleSave()
      }}
      class="space-y-4"
    >
      <!-- 부서명 -->
      <div>
        <label
          for="dept-name"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          부서명 *
        </label>
        <input
          id="dept-name"
          type="text"
          bind:value={formData.name}
          placeholder="예: 개발팀, 마케팅팀, 연구원"
          class="w-full px-3 py-2 border rounded-md text-sm"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
          required
        />
      </div>

      <!-- 부서 설명 -->
      <div>
        <label
          for="dept-description"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          부서 설명
        </label>
        <textarea
          id="dept-description"
          bind:value={formData.description}
          placeholder="부서의 역할과 책임을 설명해주세요"
          rows="3"
          class="w-full px-3 py-2 border rounded-md text-sm resize-none"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
        ></textarea>
      </div>

      <!-- T/O (정원) -->
      <div>
        <label for="dept-to" class="block text-sm font-medium mb-2" style:color="var(--color-text)">
          T/O (정원)
        </label>
        <input
          id="dept-to"
          type="number"
          bind:value={formData.to}
          placeholder="0 (무제한)"
          min="0"
          class="w-full px-3 py-2 border rounded-md text-sm"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text)"
        />
        <p class="text-xs mt-1" style:color="var(--color-text-secondary)">
          0으로 설정하면 현재 인원이 최대 인원으로 간주됩니다.
        </p>
      </div>

      <!-- 상태 -->
      <div>
        <label
          for="dept-status"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          상태
        </label>
        <select
          id="dept-status"
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
      {loading ? '저장 중...' : department ? '수정' : '추가'}
    </ThemeButton>
  </div>
</ThemeModal>
