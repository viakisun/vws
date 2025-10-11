<script lang="ts">
  /**
   * ThemeEmployeeDropdown
   * 표준화된 직원 선택 드롭다운 컴포넌트
   *
   * 특징:
   * - 자동으로 현직 직원(status='active')만 표시
   * - 이름 자동 포맷팅 (한국: 성이름, 영문: 이름 성)
   * - 부서/직급 정보 표시
   * - 로딩/에러 상태 UI
   *
   * 사용법 (자동 로드):
   * <ThemeEmployeeDropdown
   *   bind:value={form.employeeId}
   *   required
   *   placeholder="직원을 선택하세요"
   * />
   *
   * 사용법 (외부 제공):
   * <ThemeEmployeeDropdown
   *   bind:value={form.employeeId}
   *   employees={filteredEmployees}
   *   required
   * />
   */

  import { useActiveEmployees } from '$lib/hooks/employee/useActiveEmployees.svelte'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import { onMount } from 'svelte'

  interface Employee {
    id: string
    name?: string
    first_name?: string
    last_name?: string
    formatted_name?: string
    department?: string
    position?: string
  }

  interface Props {
    value?: string
    employees?: Employee[] // 외부에서 제공된 직원 리스트 (선택 사항)
    required?: boolean
    disabled?: boolean
    placeholder?: string
    showDepartment?: boolean
    showPosition?: boolean
    allowNone?: boolean // "선택 안함" 옵션 허용
    noneLabel?: string // "선택 안함" 옵션 텍스트 (기본: "선택 안함")
    id?: string
    class?: string
    onchange?: ((value: string) => void) | undefined
  }

  let {
    value = $bindable(''),
    employees: externalEmployees = undefined,
    required = false,
    disabled = false,
    placeholder = '직원을 선택하세요',
    showDepartment = true,
    showPosition = true,
    allowNone = false,
    noneLabel = '선택 안함',
    id = 'employee-dropdown',
    class: className = '',
    onchange = undefined,
  }: Props = $props()

  const employeeHook = useActiveEmployees()

  // 외부 직원 리스트가 없을 때만 자동 로드
  onMount(() => {
    if (!externalEmployees) {
      employeeHook.load()
    }
  })

  // 사용할 직원 리스트 결정 (외부 제공 또는 자동 로드)
  const employeeList = $derived.by(() => {
    if (externalEmployees) {
      // 외부에서 제공된 리스트 사용 (이름 포맷팅 적용)
      return externalEmployees.map((emp) => ({
        ...emp,
        formatted_name:
          emp.formatted_name ||
          formatKoreanName(
            emp.last_name || emp.name?.split(' ')[0] || '',
            emp.first_name || emp.name?.split(' ')[1] || '',
          ),
      }))
    }
    // 자동 로드된 리스트 사용
    return employeeHook.employees
  })

  const isLoading = $derived(!externalEmployees && employeeHook.loading)
  const error = $derived(!externalEmployees ? employeeHook.error : null)

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement
    value = target.value
    onchange?.(value)
  }

  function getEmployeeLabel(employee: {
    formatted_name?: string
    first_name?: string
    last_name?: string
    name?: string
    department?: string
    position?: string
  }): string {
    // formatted_name이 없으면 직접 포맷팅 (성+이름 순서)
    let label =
      employee.formatted_name ||
      formatKoreanName(
        employee.last_name || employee.name?.split(' ')[0] || '',
        employee.first_name || employee.name?.split(' ')[1] || '',
      )

    const details: string[] = []
    if (showDepartment && employee.department) {
      details.push(employee.department)
    }
    if (showPosition && employee.position) {
      details.push(employee.position)
    }

    if (details.length > 0) {
      label += ` (${details.join(', ')})`
    }

    return label
  }
</script>

{#if isLoading}
  <select
    {id}
    {disabled}
    class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 {className}"
  >
    <option value="">로딩 중...</option>
  </select>
{:else if error}
  <div class="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600 text-sm">
    {error}
  </div>
{:else}
  <select
    {id}
    {required}
    {disabled}
    bind:value
    onchange={handleChange}
    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {className}"
  >
    {#if !allowNone}
      <option value="">{placeholder}</option>
    {:else}
      <option value="">{noneLabel}</option>
    {/if}
    {#each employeeList as employee}
      <option value={employee.id}>
        {getEmployeeLabel(employee)}
      </option>
    {/each}
  </select>
{/if}
