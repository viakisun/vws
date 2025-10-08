/**
 * 재직증명서 프린트 유틸리티
 *
 * 별도 윈도우를 열어 재직증명서를 프린트합니다.
 */

interface CertificateData {
  employeeName: string
  employeeId: string
  department: string
  position: string
  hireDate: string
  purpose: string
  companyName: string
}

/**
 * 재직증명서 HTML 생성
 */
function generateCertificateHTML(certificate: CertificateData): string {
  const now = new Date()
  const currentDate = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`
  const issueNumber = `CERT-${now.getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  // 직인 이미지를 절대 URL로 변경 (base64 인코딩 대신 origin 사용)
  const stampUrl = `${window.location.origin}/stamp.png`

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>재직증명서</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
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
          font-size: 13px;
          line-height: 1.5;
          color: #111827;
          background: white;
          padding: 20px;
        }

        @media print {
          body {
            padding: 0 !important;
          }
        }

        .certificate-container {
          background: white;
          page-break-inside: avoid;
        }

        /* 문서 번호 */
        .document-number {
          text-align: right;
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 20px;
        }

        /* 헤더 */
        .header {
          text-align: center;
          margin-bottom: 32px;
        }

        .title {
          font-size: 32px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 6px;
          letter-spacing: 0.1em;
        }

        .title-en {
          font-size: 16px;
          color: #6b7280;
        }

        /* 직원 정보 */
        .employee-info {
          margin-bottom: 28px;
        }

        .info-row {
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 200px;
          align-items: center;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }

        .info-label {
          font-weight: 600;
          color: #374151;
          font-size: 13px;
        }

        .info-value {
          font-size: 15px;
          color: #111827;
          padding-left: 8px;
        }

        /* 증명 내용 */
        .certification-content {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 28px;
        }

        .certification-text {
          font-size: 14px;
          line-height: 1.6;
          color: #111827;
          margin-bottom: 6px;
        }

        .certification-text-en {
          font-size: 12px;
          line-height: 1.5;
          color: #6b7280;
        }

        /* 발급 목적 */
        .purpose-section {
          margin-bottom: 28px;
        }

        .purpose-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
          font-size: 13px;
        }

        .purpose-value {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 12px;
          color: #111827;
          font-size: 13px;
        }

        /* 발급일자 */
        .issue-date {
          text-align: center;
          margin-bottom: 28px;
        }

        .issue-date-kr {
          font-size: 15px;
          color: #111827;
          margin-bottom: 3px;
        }

        .issue-date-en {
          font-size: 12px;
          color: #6b7280;
        }

        /* 회사 정보 및 직인 */
        .company-section {
          text-align: center;
        }

        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 6px;
        }

        .company-title {
          font-size: 15px;
          color: #374151;
          margin-bottom: 20px;
        }

        .stamp-container {
          display: inline-block;
          margin-bottom: 20px;
        }

        .stamp-image {
          width: 100px;
          height: 100px;
          opacity: 0.9;
        }

        /* 하단 정보 */
        .footer {
          margin-top: 28px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .footer-text {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.6;
        }

        @media print {
          .certificate-container {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <!-- 문서 번호 -->
        <div class="document-number">
          문서번호: ${issueNumber}
        </div>

        <!-- 헤더 -->
        <header class="header">
          <h1 class="title">재 직 증 명 서</h1>
          <div class="title-en">CERTIFICATE OF EMPLOYMENT</div>
        </header>

        <!-- 직원 정보 -->
        <section class="employee-info">
          <div class="info-row">
            <div class="info-label">성명 (Name)</div>
            <div class="info-value">${certificate.employeeName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">사번 (ID)</div>
            <div class="info-value">${certificate.employeeId}</div>
          </div>
          <div class="info-row">
            <div class="info-label">부서 (Department)</div>
            <div class="info-value">${certificate.department}</div>
          </div>
          <div class="info-row">
            <div class="info-label">직급 (Position)</div>
            <div class="info-value">${certificate.position}</div>
          </div>
          <div class="info-row">
            <div class="info-label">입사일 (Hire Date)</div>
            <div class="info-value">${certificate.hireDate}</div>
          </div>
        </section>

        <!-- 증명 내용 -->
        <section class="certification-content">
          <p class="certification-text">
            위 사람은 본사에 재직 중임을 증명합니다.
          </p>
          <p class="certification-text-en">
            This is to certify that the above-mentioned person is currently employed by our company.
          </p>
        </section>

        ${
          certificate.purpose
            ? `
        <!-- 발급 목적 -->
        <section class="purpose-section">
          <div class="purpose-label">발급 목적 (Purpose)</div>
          <div class="purpose-value">${certificate.purpose}</div>
        </section>
        `
            : ''
        }

        <!-- 발급일자 -->
        <section class="issue-date">
          <div class="issue-date-kr">발급일자: ${currentDate}</div>
          <div class="issue-date-en">Issue Date: ${currentDate}</div>
        </section>

        <!-- 회사 정보 및 직인 -->
        <section class="company-section">
          <div class="company-name">${certificate.companyName}</div>
          <div class="company-title">대표이사 귀하</div>

          <div class="stamp-container">
            <img src="${stampUrl}" alt="회사 직인" class="stamp-image" />
          </div>
        </section>

        <!-- 하단 정보 -->
        <footer class="footer">
          <div class="footer-text">
            본 증명서는 ${certificate.companyName}에서 발급한 공식 문서입니다.
          </div>
          <div class="footer-text">
            This certificate is an official document issued by ${certificate.companyName}.
          </div>
        </footer>
      </div>
    </body>
    </html>
  `
}

/**
 * 재직증명서 프린트
 */
export function printCertificate(certificate: CertificateData): void {
  const html = generateCertificateHTML(certificate)

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
