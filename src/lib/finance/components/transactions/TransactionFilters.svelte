<script lang="ts">
  import { SearchIcon } from 'lucide-svelte'
  import type { Account } from '$lib/finance/types'
  import type { DateRangePreset } from '$lib/finance/utils/date-range'

  interface Props {
    dateFrom: string
    dateTo: string
    selectedDateRange: DateRangePreset
    searchTerm: string
    selectedAccount: string
    accounts: Account[]
    onDateRangeChange: (range: DateRangePreset) => void
    onDateFromChange: (value: string) => void
    onDateToChange: (value: string) => void
    onSearchTermChange: (value: string) => void
    onSelectedAccountChange: (value: string) => void
    onFilterChange: () => void
  }

  const {
    dateFrom,
    dateTo,
    selectedDateRange,
    searchTerm,
    selectedAccount,
    accounts,
    onDateRangeChange,
    onDateFromChange,
    onDateToChange,
    onSearchTermChange,
    onSelectedAccountChange,
    onFilterChange,
  }: Props = $props()

  const activeAccounts = $derived(accounts.filter((acc) => acc.status === 'active'))

  function handleDateRangeClick(range: DateRangePreset) {
    onDateRangeChange(range)
    onFilterChange()
  }

  const dateRanges: { value: DateRangePreset; label: string }[] = [
    { value: '1D', label: '최근 1일' },
    { value: '1W', label: '최근 1주' },
    { value: '1M', label: '최근 1개월' },
    { value: '3M', label: '최근 3개월' },
    { value: 'ALL', label: '전체' },
  ]
</script>

<div class="space-y-4">
  <!-- 날짜 범위 필터 -->
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-gray-700">날짜 범위</h4>
      <span class="text-xs text-gray-500">
        {dateFrom && dateTo ? `${dateFrom} ~ ${dateTo}` : '전체 기간'}
      </span>
    </div>
    <div class="flex flex-wrap gap-2">
      {#each dateRanges as range}
        <button
          type="button"
          onclick={() => handleDateRangeClick(range.value)}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          range.value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          {range.label}
        </button>
      {/each}
    </div>

    <!-- 수동 날짜 입력 -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="date-from" class="block text-sm font-medium text-gray-700 mb-1">
            시작 날짜
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onchange={(e) => {
              onDateFromChange((e.target as HTMLInputElement).value)
              onFilterChange()
            }}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label for="date-to" class="block text-sm font-medium text-gray-700 mb-1">
            종료 날짜
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onchange={(e) => {
              onDateToChange((e.target as HTMLInputElement).value)
              onFilterChange()
            }}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- 검색 및 필터 -->
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <div class="space-y-4">
      <!-- 검색창 -->
      <div class="relative">
        <SearchIcon
          size={20}
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchTerm}
          oninput={(e) => {
            onSearchTermChange((e.target as HTMLInputElement).value)
            onFilterChange()
          }}
          placeholder="거래 설명으로 검색하세요..."
          class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
        />
      </div>

      <!-- 계좌 필터 -->
      <div>
        <label for="account-filter" class="block text-sm font-medium text-gray-700 mb-1">
          계좌
        </label>
        <select
          id="account-filter"
          value={selectedAccount}
          onchange={(e) => {
            onSelectedAccountChange((e.target as HTMLSelectElement).value)
            onFilterChange()
          }}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">전체 계좌</option>
          {#each activeAccounts as account}
            <option value={account.id}>
              {account.bank?.name || '알 수 없음'} - {account.name} ({account.accountNumber})
            </option>
          {/each}
        </select>
      </div>
    </div>
  </div>
</div>
