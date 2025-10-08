<script lang="ts">
  import { AlertCircleIcon } from '@lucide/svelte'
  import type { MissingPeriod } from '../utils'

  type Props = {
    employeeName: string
    year: number
    missingCount: number
    contractMissingPeriods: MissingPeriod[]
  }

  let { employeeName, year, missingCount, contractMissingPeriods }: Props = $props()
</script>

{#if missingCount > 0 || contractMissingPeriods.length > 0}
  <div class="bg-amber-50 border border-amber-200 rounded-lg p-6">
    <div class="flex items-start">
      <AlertCircleIcon size={24} class="text-amber-600 mr-3 mt-0.5" />
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-amber-800 mb-2">급여명세서 작성 필요</h3>
        <p class="text-amber-700 mb-4">
          {employeeName}님의 {year}년 급여명세서 중
          <strong>{missingCount}개월</strong>이 누락되었습니다.
          {#if contractMissingPeriods.length > 0}
            <br />계약 기간 내 누락된 급여명세서:
            <strong>{contractMissingPeriods.length}개월</strong>
          {/if}
        </p>
        <p class="text-amber-600 text-sm">
          아래 표에서 빨간색으로 표시된 월을 클릭하여 급여명세서를 작성해주세요.
          <br />회색으로 표시된 월은 입사일 이전이거나 미래 월로 잠금되어 있습니다.
        </p>
      </div>
    </div>
  </div>
{/if}
