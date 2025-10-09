<script lang="ts">
  import { onMount } from 'svelte'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import { XIcon } from 'lucide-svelte'

  interface Employee {
    id: string
    first_name: string
    last_name: string
    email: string
  }

  interface Props {
    value?: string
    mentions?: string[]
    placeholder?: string
    rows?: number
    required?: boolean
    onchange?: (value: string, mentions: string[]) => void
  }

  let {
    value = $bindable(''),
    mentions = $bindable<string[]>([]),
    placeholder = '',
    rows = 4,
    required = false,
    onchange,
  }: Props = $props()

  let showSuggestions = $state(false)
  let suggestionFilter = $state('')
  let cursorPosition = $state(0)
  let employees = $state<Employee[]>([])
  let selectedEmployees = $state<Employee[]>([])
  let textareaRef: HTMLTextAreaElement

  // Load employees on mount
  async function loadEmployees() {
    try {
      const res = await fetch('/api/employees?status=active')
      if (res.ok) {
        const data = await res.json()
        // API returns 'employees' not 'data'
        employees = data.employees || data.data || []
        console.log('Loaded employees:', employees.length, employees)
      }
    } catch (e) {
      console.error('Failed to load employees:', e)
    }
  }

  // Load employee details for existing mentions
  async function loadMentionedEmployees() {
    if (!mentions || mentions.length === 0) return

    try {
      const res = await fetch(`/api/employees?ids=${mentions.join(',')}`)
      if (res.ok) {
        const data = await res.json()
        selectedEmployees = data.employees || data.data || []
      }
    } catch (e) {
      console.error('Failed to load mentioned employees:', e)
    }
  }

  onMount(() => {
    loadEmployees()
    if (mentions && mentions.length > 0) {
      loadMentionedEmployees()
    }
  })

  // Filter employees based on search
  const filteredEmployees = $derived(
    suggestionFilter
      ? employees.filter(
          (e) =>
            formatKoreanName(e.last_name, e.first_name)
              .toLowerCase()
              .includes(suggestionFilter.toLowerCase()) ||
            e.email.toLowerCase().includes(suggestionFilter.toLowerCase()),
        )
      : employees,
  )

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement
    value = target.value
    cursorPosition = target.selectionStart || 0

    // Check if @ was typed
    const textBeforeCursor = value.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // Show suggestions if @ is recent and no space after it
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 20) {
        suggestionFilter = textAfterAt
        showSuggestions = true
        console.log('Showing suggestions for:', suggestionFilter, 'Employees:', employees.length)
      } else {
        showSuggestions = false
      }
    } else {
      showSuggestions = false
    }

    if (onchange) {
      onchange(value, mentions)
    }
  }

  function selectEmployee(employee: Employee) {
    // Add to mentions if not already there
    if (!mentions.includes(employee.id)) {
      mentions = [...mentions, employee.id]
      selectedEmployees = [...selectedEmployees, employee]
    }

    // Replace @filter with @name in text
    const textBeforeCursor = value.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    const textAfterCursor = value.substring(cursorPosition)

    const employeeName = formatKoreanName(employee.last_name, employee.first_name)
    const newValue = value.substring(0, lastAtIndex) + `@${employeeName} ` + textAfterCursor

    value = newValue
    showSuggestions = false

    // Update cursor position
    setTimeout(() => {
      const newCursorPos = lastAtIndex + employeeName.length + 2
      if (textareaRef) {
        textareaRef.focus()
        textareaRef.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)

    if (onchange) {
      onchange(value, mentions)
    }
  }

  function removeMention(employeeId: string) {
    mentions = mentions.filter((id) => id !== employeeId)
    selectedEmployees = selectedEmployees.filter((e) => e.id !== employeeId)

    if (onchange) {
      onchange(value, mentions)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && showSuggestions) {
      showSuggestions = false
      e.preventDefault()
    }
  }
</script>

<div class="relative">
  <!-- Mentioned users -->
  {#if selectedEmployees.length > 0}
    <div class="flex flex-wrap gap-2 mb-2">
      {#each selectedEmployees as employee}
        <div
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          style:background="var(--color-primary-light)"
          style:color="var(--color-primary)"
        >
          <span class="font-medium">
            @{formatKoreanName(employee.last_name, employee.first_name)}
          </span>
          <button
            type="button"
            onclick={() => removeMention(employee.id)}
            class="hover:opacity-70 transition"
          >
            <XIcon size={14} />
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Textarea -->
  <textarea
    bind:this={textareaRef}
    {value}
    oninput={handleInput}
    onkeydown={handleKeyDown}
    {placeholder}
    {rows}
    {required}
    class="w-full px-3 py-2 rounded-lg border transition"
    style:border-color="var(--color-border)"
    style:background="var(--color-surface)"
    style:color="var(--color-text-primary)"
  ></textarea>

  <!-- Suggestions dropdown -->
  {#if showSuggestions}
    <div
      class="absolute z-50 mt-1 w-full rounded-lg border-2 shadow-xl overflow-hidden"
      style:background="var(--color-surface)"
      style:border-color="var(--color-primary)"
    >
      {#if filteredEmployees.length > 0}
        <div class="max-h-60 overflow-y-auto">
          {#each filteredEmployees.slice(0, 10) as employee, i}
            <button
              type="button"
              onclick={() => selectEmployee(employee)}
              class="w-full px-4 py-3 text-left transition border-b"
              style:background={i % 2 === 0
                ? 'var(--color-surface)'
                : 'var(--color-surface-secondary)'}
              style:border-color="var(--color-border-light)"
              onmouseenter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary-light)'
              }}
              onmouseleave={(e) => {
                e.currentTarget.style.background =
                  i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-secondary)'
              }}
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style:background="var(--color-primary-light)"
                  style:color="var(--color-primary)"
                >
                  {formatKoreanName(employee.last_name, employee.first_name).charAt(0)}
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold" style:color="var(--color-text-primary)">
                    {formatKoreanName(employee.last_name, employee.first_name)}
                  </p>
                  <p class="text-xs" style:color="var(--color-text-tertiary)">
                    {employee.email}
                  </p>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <div class="px-4 py-6 text-center">
          <p class="text-sm" style:color="var(--color-text-secondary)">검색 결과가 없습니다</p>
        </div>
      {/if}
      <div
        class="px-4 py-2 text-xs border-t"
        style:background="var(--color-surface-secondary)"
        style:color="var(--color-text-tertiary)"
        style:border-color="var(--color-border)"
      >
        ↑↓ 방향키로 선택, Enter로 확정, Esc로 닫기
      </div>
    </div>
  {/if}
</div>
