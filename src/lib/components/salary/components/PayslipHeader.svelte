<script lang="ts">
  import ThemeEmployeeDropdown from '$lib/components/ui/ThemeEmployeeDropdown.svelte'
  import type { Employee } from '../types'

  type Props = {
    employeeList: Employee[]
    selectedEmployeeId: string
    selectedYear: number
    showOnlyActive: boolean
    onEmployeeChange: (employeeId: string) => void
    onYearChange: (year: number) => void
    onToggleActiveFilter: () => void
  }

  let {
    employeeList,
    selectedEmployeeId = $bindable(),
    selectedYear = $bindable(),
    showOnlyActive = $bindable(),
    onEmployeeChange,
    onYearChange,
    onToggleActiveFilter,
  }: Props = $props()

  function handleEmployeeChange(employeeId: string) {
    selectedEmployeeId = employeeId
    onEmployeeChange(employeeId)
  }

  function handleYearChange(e: Event) {
    const target = e.currentTarget as HTMLSelectElement
    selectedYear = parseInt(target.value)
    onYearChange(parseInt(target.value))
  }
</script>

<div class="flex items-center space-x-4">
  <div class="flex-1">
    <label for="employee-select" class="block text-sm font-medium text-gray-700 mb-2"
      >직원 선택</label
    >
    <ThemeEmployeeDropdown
      id="employee-select"
      value={selectedEmployeeId}
      employees={employeeList}
      placeholder="직원을 선택하세요"
      showDepartment={false}
      showPosition={true}
      onchange={handleEmployeeChange}
    />
  </div>
  <div class="w-32">
    <label for="year-select" class="block text-sm font-medium text-gray-700 mb-2">연도</label>
    <select
      id="year-select"
      value={selectedYear}
      onchange={handleYearChange}
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i) as year (year)}
        <option value={year}>{year}년</option>
      {/each}
    </select>
  </div>
  <div class="flex items-center">
    <label class="flex items-center space-x-2 text-sm text-gray-700">
      <input
        type="checkbox"
        bind:checked={showOnlyActive}
        onchange={onToggleActiveFilter}
        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span>재직중인 직원만</span>
    </label>
  </div>
</div>
