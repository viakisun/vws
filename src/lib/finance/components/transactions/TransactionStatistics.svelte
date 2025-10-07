<script lang="ts">
  import { formatCurrency } from '$lib/finance/utils'

  interface Props {
    totalIncome: number
    totalExpense: number
    netAmount: number
    count: number
  }

  const { totalIncome, totalExpense, netAmount, count }: Props = $props()
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <div class="bg-white p-4 rounded-lg shadow">
    <div class="text-sm text-gray-500 mb-1">총 수입</div>
    <div class="text-2xl font-bold text-blue-600">
      {formatCurrency(totalIncome)}
    </div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow">
    <div class="text-sm text-gray-500 mb-1">총 지출</div>
    <div class="text-2xl font-bold text-red-600">
      {formatCurrency(totalExpense)}
    </div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow">
    <div class="text-sm text-gray-500 mb-1">순 현금흐름</div>
    <div class="text-2xl font-bold {netAmount >= 0 ? 'text-green-600' : 'text-red-600'}">
      {formatCurrency(netAmount)}
    </div>
  </div>
  <div class="bg-white p-4 rounded-lg shadow">
    <div class="text-sm text-gray-500 mb-1">거래 건수</div>
    <div class="text-2xl font-bold text-gray-700">
      {count.toLocaleString()}건
    </div>
  </div>
</div>
