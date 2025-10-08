<script lang="ts">
  import type { EmployeeContract } from '../types'
  import { formatCurrency } from '$lib/utils/format'

  type Props = {
    contract: EmployeeContract | null
    isLoading: boolean
  }

  let { contract, isLoading }: Props = $props()
</script>

{#if isLoading}
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <div class="flex items-center">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
      <span class="text-gray-600">계약 정보를 불러오는 중...</span>
    </div>
  </div>
{:else if contract}
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div class="flex items-start">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-blue-800 mb-2">현재 급여 계약 정보</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-blue-700">월급:</span>
            <span class="ml-2 font-semibold text-blue-900"
              >{formatCurrency(contract.monthlySalary || 0)}</span
            >
          </div>
          <div>
            <span class="font-medium text-blue-700">연봉:</span>
            <span class="ml-2 font-semibold text-blue-900"
              >{formatCurrency(contract.annualSalary || 0)}</span
            >
          </div>
          <div>
            <span class="font-medium text-blue-700">계약 시작:</span>
            <span class="ml-2 text-blue-900">{contract.startDate}</span>
          </div>
          <div>
            <span class="font-medium text-blue-700">계약 종료:</span>
            <span class="ml-2 text-blue-900">{contract.contractEndDisplay}</span>
          </div>
        </div>
        <p class="text-blue-600 text-sm mt-2">
          💡 급여 수정 시 기본급은 계약된 월급으로 자동 설정됩니다.
        </p>
      </div>
    </div>
  </div>
{:else}
  <div class="bg-red-50 border border-red-200 rounded-lg p-4">
    <div class="flex items-start">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-red-800 mb-2">❌ 급여 계약 정보 로드 실패</h3>
        <p class="text-red-700 text-sm">해당 직원의 급여 계약 정보를 불러올 수 없습니다.</p>
        <p class="text-red-600 text-xs mt-1">
          데이터베이스 연결을 확인하거나 서버 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  </div>
{/if}
