<script lang="ts">
  /**
   * 재직증명서 PDF 모달 컴포넌트
   *
   * 기능:
   * - A4 크기 최적화 PDF 출력
   * - 브라우저 인쇄 다이얼로그 연동
   * - 한/영 병기 형식
   */

  import { DownloadIcon, PrinterIcon, XIcon } from '@lucide/svelte'
  import { printCertificate } from '$lib/utils/certificate-print'

  interface CertificateData {
    employeeName: string
    employeeId: string
    department: string
    position: string
    hireDate: string
    purpose: string
    companyName: string
  }

  interface Props {
    certificate: CertificateData
    onClose: () => void
  }

  const { certificate, onClose }: Props = $props()

  /**
   * PDF 출력
   */
  function handlePrint() {
    printCertificate(certificate)
  }

  /**
   * PDF 다운로드 (프린트 다이얼로그에서 PDF로 저장)
   */
  function handleDownload() {
    printCertificate(certificate)
  }

  const currentDate = $derived(new Date().toLocaleDateString('ko-KR'))
  const issueNumber = $derived(
    `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  )
</script>

<!-- 모달 배경 (화면에서만 표시) -->
<div
  class="certificate-modal-wrapper fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  role="dialog"
  aria-modal="true"
>
  <!-- 모달 컨테이너 -->
  <div
    class="certificate-modal-content bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
  >
    <!-- 상단 액션 바 (화면에서만 표시) -->
    <div
      class="certificate-modal-header sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10"
    >
      <h2 class="text-lg font-semibold text-gray-900">재직증명서 미리보기</h2>
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

    <!-- 재직증명서 본문 (A4 크기) -->
    <div class="certificate-print-area p-12 bg-white" style="max-width: 210mm; margin: 0 auto;">
      <!-- 문서 번호 -->
      <div class="text-right text-sm text-gray-600 mb-8">
        문서번호: {issueNumber}
      </div>

      <!-- 헤더: 제목 -->
      <header class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">재 직 증 명 서</h1>
        <div class="text-lg text-gray-600">CERTIFICATE OF EMPLOYMENT</div>
      </header>

      <!-- 직원 정보 -->
      <section class="mb-12 space-y-4">
        <div
          class="grid grid-cols-[130px_1fr] gap-[130px] items-center border-b border-gray-300 pb-3"
        >
          <div class="font-semibold text-gray-700">성명 (Name)</div>
          <div class="text-lg">{certificate.employeeName}</div>
        </div>

        <div
          class="grid grid-cols-[130px_1fr] gap-[130px] items-center border-b border-gray-300 pb-3"
        >
          <div class="font-semibold text-gray-700">사번 (ID)</div>
          <div class="text-lg">{certificate.employeeId}</div>
        </div>

        <div
          class="grid grid-cols-[130px_1fr] gap-[130px] items-center border-b border-gray-300 pb-3"
        >
          <div class="font-semibold text-gray-700">부서 (Department)</div>
          <div class="text-lg">{certificate.department}</div>
        </div>

        <div
          class="grid grid-cols-[130px_1fr] gap-[130px] items-center border-b border-gray-300 pb-3"
        >
          <div class="font-semibold text-gray-700">직급 (Position)</div>
          <div class="text-lg">{certificate.position}</div>
        </div>

        <div
          class="grid grid-cols-[130px_1fr] gap-[130px] items-center border-b border-gray-300 pb-3"
        >
          <div class="font-semibold text-gray-700">입사일 (Hire Date)</div>
          <div class="text-lg">{certificate.hireDate}</div>
        </div>
      </section>

      <!-- 증명 내용 -->
      <section class="mb-12 bg-gray-50 p-6 rounded-lg">
        <p class="text-base leading-relaxed text-gray-800">
          위 사람은 본사에 재직 중임을 증명합니다.
        </p>
        <p class="text-sm leading-relaxed text-gray-600 mt-2">
          This is to certify that the above-mentioned person is currently employed by our company.
        </p>
      </section>

      <!-- 발급 목적 -->
      {#if certificate.purpose}
        <section class="mb-12">
          <div class="font-semibold text-gray-700 mb-2">발급 목적 (Purpose)</div>
          <div class="bg-white border border-gray-300 rounded-lg p-4 text-gray-800">
            {certificate.purpose}
          </div>
        </section>
      {/if}

      <!-- 발급일자 -->
      <section class="mb-12 text-center">
        <div class="text-lg text-gray-800">발급일자: {currentDate}</div>
        <div class="text-sm text-gray-600 mt-1">Issue Date: {currentDate}</div>
      </section>

      <!-- 회사 정보 및 직인 -->
      <section class="text-center space-y-4">
        <div class="text-2xl font-bold text-gray-900">{certificate.companyName}</div>
        <div class="text-lg text-gray-700">대표이사 귀하</div>

        <!-- 직인 이미지 -->
        <div class="inline-block mt-8">
          <img src="/stamp.png" alt="회사 직인" class="w-32 h-32 object-contain" />
        </div>
      </section>

      <!-- 하단 정보 -->
      <footer class="text-xs text-gray-500 pt-8 border-t border-gray-200 mt-12 text-center">
        <div>본 증명서는 {certificate.companyName}에서 발급한 공식 문서입니다.</div>
        <div class="mt-1">
          This certificate is an official document issued by {certificate.companyName}.
        </div>
      </footer>
    </div>
  </div>
</div>

<!-- 프린트 스타일은 src/app.css에서 전역으로 관리됨 -->
