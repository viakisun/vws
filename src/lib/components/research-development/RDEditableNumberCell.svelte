<script lang="ts">
  /**
   * 노션 스타일 인라인 편집 가능한 숫자 셀 컴포넌트
   * 
   * - 클릭하여 편집 모드로 전환
   * - 자동 콤마 포맷팅
   * - Enter 키 또는 blur 시 저장
   */

  interface Props {
    value: number | string | null | undefined
    isEditing: boolean
    onStartEdit: () => void
    onStopEdit: () => void
    onChange: (value: string) => void
    className?: string
    textColor?: string
  }

  const {
    value = 0,
    isEditing = false,
    onStartEdit,
    onStopEdit,
    onChange,
    className = '',
    textColor = 'text-blue-600',
  }: Props = $props()

  // 로컬 편집 상태
  let editingValue = $state('')
  let inputElement = $state<HTMLInputElement | null>(null)

  // 편집 모드로 전환 시 초기값 설정
  $effect(() => {
    if (isEditing) {
      editingValue = formatNumberWithComma(value)
      // 다음 틱에 포커스
      setTimeout(() => {
        inputElement?.focus()
        inputElement?.select()
      }, 0)
    }
  })

  // 숫자 포맷팅 함수 (콤마 추가)
  function formatNumberWithComma(val: number | string | null | undefined): string {
    if (val === null || val === undefined || val === '') return '0'
    const numStr = String(val).replace(/,/g, '')
    const num = parseFloat(numStr)
    if (isNaN(num)) return '0'
    return Math.floor(num).toLocaleString('ko-KR')
  }

  // 값 저장
  function saveValue() {
    onChange(editingValue)
    onStopEdit()
  }

  // 키보드 이벤트 처리
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveValue()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onStopEdit()
    }
  }
</script>

{#if isEditing}
  <input
    bind:this={inputElement}
    type="text"
    bind:value={editingValue}
    oninput={(e) => {
      const formatted = formatNumberWithComma(e.currentTarget.value)
      editingValue = formatted
    }}
    onblur={saveValue}
    onkeydown={handleKeyDown}
    class="w-full px-2 py-1 text-sm text-right border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none {className}"
  />
{:else}
  <button
    onclick={onStartEdit}
    class="w-full text-sm {textColor} font-medium text-right hover:bg-gray-100 rounded px-2 py-1 transition-colors {className}"
  >
    {formatNumberWithComma(value)}
  </button>
{/if}

