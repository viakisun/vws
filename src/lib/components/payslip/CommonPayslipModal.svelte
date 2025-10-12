<script lang="ts">
  import type { PayslipPDFData } from '$lib/types/payslip'
  import PayslipPDFModal from './PayslipPDFModal.svelte'

  interface Props {
    payslipId: string
    onClose: () => void
  }

  const { payslipId, onClose }: Props = $props()

  let payslipData = $state<PayslipPDFData | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)

  async function loadPayslip() {
    loading = true
    error = null
    try {
      const response = await fetch(`/api/salary/payslips/${payslipId}`)
      const result = await response.json()

      if (result.success && result.data) {
        payslipData = result.data
      } else {
        error = '급여명세서를 불러올 수 없습니다.'
      }
    } catch (err) {
      console.error('급여명세서 로드 실패:', err)
      error = '급여명세서를 불러오는 중 오류가 발생했습니다.'
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if (payslipId) {
      loadPayslip()
    }
  })
</script>

{#if loading}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    style="z-index: 1001;"
  >
    <div class="bg-white rounded-lg p-8">
      <div class="flex items-center gap-3">
        <div
          class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"
        ></div>
        <span class="text-gray-700">급여명세서를 불러오는 중...</span>
      </div>
    </div>
  </div>
{:else if error}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    style="z-index: 1001;"
  >
    <div class="bg-white rounded-lg p-8 max-w-md">
      <h3 class="text-lg font-semibold text-red-600 mb-2">오류</h3>
      <p class="text-gray-700 mb-4">{error}</p>
      <button
        type="button"
        onclick={onClose}
        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        닫기
      </button>
    </div>
  </div>
{:else if payslipData}
  <PayslipPDFModal payslip={payslipData} {onClose} />
{/if}
