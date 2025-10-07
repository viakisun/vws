/**
 * 급여명세서 프린트 유틸리티
 *
 * 별도 윈도우를 열어 급여명세서를 프린트합니다.
 * CSS 스코핑 문제를 완전히 회피하는 방법입니다.
 */

import type { PayslipPDFData } from '$lib/types/payslip'

/**
 * 금액을 세자리 콤마로 포맷 (원 단위, 정수만)
 */
function formatAmount(amount: number): string {
  return Math.floor(amount).toLocaleString('ko-KR') + '원'
}

/**
 * 급여명세서 HTML 생성
 */
function generatePayslipHTML(payslip: PayslipPDFData): string {
  const paymentPeriod = `${payslip.year}년 ${payslip.month}월`
  const currentDate = new Date().toLocaleDateString('ko-KR')

  // 지급 항목 HTML
  const paymentsHTML =
    payslip.payments && payslip.payments.length > 0
      ? payslip.payments
          .map(
            (payment) => `
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
          <span style="color: #374151;">${payment.name}</span>
          <span style="font-weight: 500; color: #111827;">${formatAmount(payment.amount)}</span>
        </div>
      `,
          )
          .join('')
      : '<div style="font-size: 14px; color: #9ca3af;">지급 항목 없음</div>'

  // 공제 항목 HTML
  const deductionsHTML =
    payslip.deductions && payslip.deductions.length > 0
      ? payslip.deductions
          .map(
            (deduction) => `
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
          <span style="color: #374151;">${deduction.name}</span>
          <span style="font-weight: 500; color: #dc2626;">-${formatAmount(deduction.amount)}</span>
        </div>
      `,
          )
          .join('')
      : '<div style="font-size: 14px; color: #9ca3af;">공제 항목 없음</div>'

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>급여명세서</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 15mm;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #111827;
          background: white;
          padding: 0;
          margin: 0;
        }

        @media print {
          body {
            padding: 0 !important;
            margin: 0 !important;
          }
        }

        .payslip-container {
          background: white;
          page-break-inside: avoid;
        }

        /* 헤더 */
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #111827;
          padding-bottom: 24px;
        }

        .company-name {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .title {
          font-size: 28px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 4px;
        }

        .title-kr {
          font-size: 18px;
          font-weight: 500;
          color: #374151;
        }

        .period {
          font-size: 14px;
          color: #6b7280;
          margin-top: 8px;
        }

        /* 직원 정보 */
        .employee-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .info-item {
          margin-bottom: 8px;
        }

        .info-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .info-value {
          font-weight: 600;
          color: #111827;
        }

        /* 급여 상세 */
        .salary-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #d1d5db;
        }

        .section-content {
          margin-bottom: 16px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 600;
          border-top: 1px solid #d1d5db;
          padding-top: 8px;
          margin-top: 8px;
        }

        /* 실지급액 */
        .net-pay {
          background: #eff6ff;
          border: 2px solid #2563eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .net-pay-label {
          font-size: 12px;
          color: #1e40af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .net-pay-label-kr {
          font-size: 14px;
          font-weight: 500;
          color: #1e3a8a;
        }

        .net-pay-amount {
          font-size: 36px;
          font-weight: bold;
          color: #1e3a8a;
        }

        /* 하단 정보 */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .footer-item {
          font-size: 12px;
          color: #6b7280;
        }

        .footer-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }

        .footer-value {
          color: #111827;
        }

        .footer-notice {
          margin-top: 16px;
          padding: 12px;
          background: #f9fafb;
          border-left: 3px solid #2563eb;
          font-size: 11px;
          color: #6b7280;
          line-height: 1.5;
        }

        .footer-signature {
          margin-top: 20px;
          text-align: right;
          font-size: 12px;
          color: #374151;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
        }

        .signature-text {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .signature-label {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .signature-name {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .stamp-image {
          width: 60px;
          height: 60px;
          opacity: 0.9;
        }

        @media print {
          body {
            padding: 0;
          }

          .footer {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="payslip-container">
        <!-- 헤더 -->
        <header class="header">
          ${payslip.companyName ? `<div class="company-name">${payslip.companyName}</div>` : ''}
          <h1 class="title">PAYSLIP</h1>
          <div class="title-kr">급여명세서</div>
          <div class="period">${paymentPeriod}</div>
        </header>

        <!-- 직원 정보 -->
        <section class="employee-info">
          <div class="info-item">
            <div class="info-label">Employee Name</div>
            <div class="info-value">${payslip.employeeName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Employee ID</div>
            <div class="info-value">${payslip.employeeId}</div>
          </div>
          ${
            payslip.department
              ? `
            <div class="info-item">
              <div class="info-label">Department</div>
              <div class="info-value">${payslip.department}</div>
            </div>
          `
              : ''
          }
          ${
            payslip.position
              ? `
            <div class="info-item">
              <div class="info-label">Position</div>
              <div class="info-value">${payslip.position}</div>
            </div>
          `
              : ''
          }
        </section>

        <!-- 급여 상세 -->
        <section class="salary-details">
          <!-- 지급 항목 -->
          <div>
            <h3 class="section-title">Earnings / 지급항목</h3>
            <div class="section-content">
              ${paymentsHTML}
              <div class="total-row">
                <span style="color: #111827;">Total Earnings / 지급 합계</span>
                <span style="color: #111827;">${formatAmount(payslip.totalPayments)}</span>
              </div>
            </div>
          </div>

          <!-- 공제 항목 -->
          <div>
            <h3 class="section-title">Deductions / 공제항목</h3>
            <div class="section-content">
              ${deductionsHTML}
              <div class="total-row">
                <span style="color: #111827;">Total Deductions / 공제 합계</span>
                <span style="color: #dc2626;">-${formatAmount(payslip.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 실지급액 -->
        <section class="net-pay">
          <div>
            <div class="net-pay-label">Net Pay</div>
            <div class="net-pay-label-kr">실지급액</div>
          </div>
          <div class="net-pay-amount">
            ${formatAmount(payslip.netSalary)}
          </div>
        </section>

        <!-- 하단 정보 -->
        <footer class="footer">
          <div class="footer-grid">
            <div class="footer-item">
              <div class="footer-label">발급일자 / Issue Date</div>
              <div class="footer-value">${currentDate}</div>
            </div>
            <div class="footer-item">
              <div class="footer-label">지급일 / Payment Date</div>
              <div class="footer-value">${payslip.paymentDate || paymentPeriod}</div>
            </div>
          </div>

          <div class="footer-notice">
            본 급여명세서는 ${payslip.companyName || '회사'}에서 발급한 공식 문서입니다.
            문의사항이 있으시면 인사팀으로 연락 주시기 바랍니다.
          </div>

          <div class="footer-signature">
            <div class="signature-text">
              <div class="signature-label">발급자 / Issued by</div>
              <div class="signature-name">${payslip.companyName || '회사'} 대표이사 ${payslip.ceoName || ''}</div>
            </div>
            <img src="/stamp.png" alt="직인" class="stamp-image" />
          </div>
        </footer>
      </div>
    </body>
    </html>
  `
}

/**
 * 급여명세서 프린트
 */
export function printPayslip(payslip: PayslipPDFData): void {
  const html = generatePayslipHTML(payslip)

  // 새 윈도우 열기
  const printWindow = window.open('', '_blank', 'width=800,height=600')

  if (!printWindow) {
    alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
    return
  }

  // HTML 작성
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  // 로드 완료 후 프린트
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
    // 프린트 다이얼로그가 닫히면 윈도우도 닫기
    printWindow.onafterprint = () => {
      printWindow.close()
    }
  }
}
