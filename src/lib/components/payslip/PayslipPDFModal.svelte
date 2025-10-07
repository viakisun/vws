<script lang="ts">
  /**
   * 공용 급여명세서 PDF 모달 컴포넌트
   *
   * 사용처:
   * - 급여 관리 페이지 (관리자용)
   * - 개인 대시보드 (직원 본인용)
   *
   * 기능:
   * - A4 크기 최적화 PDF 출력
   * - 브라우저 인쇄 다이얼로그 연동
   * - 깔끔한 글로벌 기업 스타일
   */

  import { DownloadIcon, PrinterIcon, XIcon } from '@lucide/svelte'
  import type { PayslipPDFData } from '$lib/types/payslip'
  import { printPayslip } from '$lib/utils/payslip-print'

  interface Props {
    payslip: PayslipPDFData
    onClose: () => void
  }

  const { payslip, onClose }: Props = $props()

  /**
   * 금액을 세자리 콤마로 포맷 (원 단위, 정수만)
   */
  function formatAmount(amount: number): string {
    return Math.floor(amount).toLocaleString('ko-KR') + '원'
  }

  /**
   * PDF 출력 (별도 윈도우에서 프린트)
   */
  function handlePrint() {
    printPayslip(payslip)
  }

  /**
   * PDF 다운로드 (프린트 다이얼로그에서 PDF로 저장)
   */
  function handleDownload() {
    printPayslip(payslip)
  }

  // 급여 기간 포맷
  const paymentPeriod = $derived(`${payslip.year}년 ${payslip.month}월`)
  const currentDate = $derived(new Date().toLocaleDateString('ko-KR'))
</script>

<!-- 모달 배경 (화면에서만 표시) -->
<div
  class="payslip-modal-wrapper fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  role="dialog"
  aria-modal="true"
>
  <!-- 모달 컨테이너 -->
  <div
    class="payslip-modal-content bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
  >
    <!-- 상단 액션 바 (화면에서만 표시) -->
    <div
      class="payslip-modal-header sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10"
    >
      <h2 class="text-lg font-semibold text-gray-900">급여명세서 미리보기</h2>
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={handlePrint}
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PrinterIcon size={18} />
          인쇄
        </button>
        <button
          type="button"
          onclick={handleDownload}
          class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <DownloadIcon size={18} />
          PDF 저장
        </button>
        <button
          type="button"
          onclick={onClose}
          class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="닫기"
        >
          <XIcon size={24} />
        </button>
      </div>
    </div>

    <!-- 급여명세서 본문 (A4 크기) -->
    <div class="payslip-print-area p-8 bg-white" style="max-width: 210mm; margin: 0 auto;">
      <!-- 헤더: 회사 정보 & 제목 -->
      <header class="text-center mb-8 border-b-2 border-gray-900 pb-6">
        {#if payslip.companyName}
          <div class="text-sm text-gray-600 mb-1">{payslip.companyName}</div>
        {/if}
        <h1 class="text-2xl font-bold text-gray-900 mb-1">PAYSLIP</h1>
        <div class="text-lg font-medium text-gray-700">급여명세서</div>
        <div class="text-sm text-gray-500 mt-2">{paymentPeriod}</div>
      </header>

      <!-- 직원 정보 -->
      <section class="mb-6 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Employee Name</div>
          <div class="font-semibold text-gray-900">{payslip.employeeName}</div>
        </div>
        <div>
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Employee ID</div>
          <div class="font-semibold text-gray-900">{payslip.employeeId}</div>
        </div>
        {#if payslip.department}
          <div>
            <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Department</div>
            <div class="font-semibold text-gray-900">{payslip.department}</div>
          </div>
        {/if}
        {#if payslip.position}
          <div>
            <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Position</div>
            <div class="font-semibold text-gray-900">{payslip.position}</div>
          </div>
        {/if}
      </section>

      <!-- 급여 상세 내역 -->
      <section class="mb-6">
        <div class="grid grid-cols-2 gap-6">
          <!-- 지급 항목 -->
          <div>
            <h3
              class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b border-gray-300 pb-2"
            >
              Earnings / 지급항목
            </h3>
            <div class="space-y-2">
              <!-- 모든 지급 항목 -->
              {#if payslip.payments && payslip.payments.length > 0}
                {#each payslip.payments as payment}
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-700">{payment.name}</span>
                    <span class="font-medium text-gray-900">{formatAmount(payment.amount)}</span>
                  </div>
                {/each}
              {:else}
                <div class="text-sm text-gray-400">지급 항목 없음</div>
              {/if}

              <!-- 지급 합계 -->
              <div
                class="flex justify-between text-sm font-semibold border-t border-gray-300 pt-2 mt-2"
              >
                <span class="text-gray-900">Total Earnings / 지급 합계</span>
                <span class="text-gray-900">{formatAmount(payslip.totalPayments)}</span>
              </div>
            </div>
          </div>

          <!-- 공제 항목 -->
          <div>
            <h3
              class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b border-gray-300 pb-2"
            >
              Deductions / 공제항목
            </h3>
            <div class="space-y-2">
              {#if payslip.deductions && payslip.deductions.length > 0}
                {#each payslip.deductions as deduction}
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-700">{deduction.name}</span>
                    <span class="font-medium text-red-600">-{formatAmount(deduction.amount)}</span>
                  </div>
                {/each}
              {:else}
                <div class="text-sm text-gray-400">공제 항목 없음</div>
              {/if}

              <!-- 공제 합계 -->
              <div
                class="flex justify-between text-sm font-semibold border-t border-gray-300 pt-2 mt-2"
              >
                <span class="text-gray-900">Total Deductions / 공제 합계</span>
                <span class="text-red-600">-{formatAmount(payslip.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 실지급액 -->
      <section class="mb-6 bg-blue-50 border-2 border-blue-600 rounded-lg p-4">
        <div class="flex justify-between items-center">
          <div>
            <div class="text-xs text-blue-700 uppercase tracking-wide mb-1">Net Pay</div>
            <div class="text-sm font-medium text-blue-900">실지급액</div>
          </div>
          <div class="text-3xl font-bold text-blue-900">
            {formatAmount(payslip.netSalary)}
          </div>
        </div>
      </section>

      <!-- 하단 정보 -->
      <footer class="text-xs text-gray-500 pt-6 border-t border-gray-200 space-y-1">
        <div>발급일자: {currentDate}</div>
        <div class="pt-4 text-gray-400">
          이 급여명세서는 {payslip.companyName || '회사'}에서 발급한 공식 문서입니다.
        </div>
      </footer>
    </div>
  </div>
</div>

<!-- 프린트 스타일은 src/app.css에서 전역으로 관리됨 -->
