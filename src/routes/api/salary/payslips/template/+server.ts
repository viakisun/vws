import { query } from "$lib/database/connection";
import { json } from "@sveltejs/kit";
import ExcelJS from "exceljs";

export async function GET({ url }) {
  try {
    const year =
      url.searchParams.get("year") || new Date().getFullYear().toString();
    const month =
      url.searchParams.get("month") || (new Date().getMonth() + 1).toString();

    // 모든 직원 정보 조회
    const { rows: employees } = await query(
      `
			SELECT 
				e.id,
				e.employee_id,
				e.first_name,
				e.last_name,
				e.department,
				e.position,
				e.hire_date,
				sc.annual_salary
			FROM employees e
			LEFT JOIN salary_contracts sc ON e.id = sc.employee_id AND sc.status = 'active'
			WHERE e.status = 'active'
			ORDER BY e.department, e.employee_id
			`,
    );

    // 엑셀 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("급여명세서");

    // 헤더 설정
    const headers = [
      "사번",
      "성명",
      "부서",
      "직위",
      "입사일",
      "기본급",
      "직책수당",
      "상여금",
      "식대",
      "차량유지",
      "연차수당",
      "연말정산",
      "건강보험",
      "장기요양보험",
      "국민연금",
      "고용보험",
      "갑근세",
      "주민세",
      "기타",
      "지급총액",
      "공제총액",
      "실지급액",
    ];

    // 헤더 행 추가
    worksheet.addRow(headers);

    // 헤더 스타일링
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "366092" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    // 열 너비 설정
    const columnWidths = [
      10, 12, 15, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
      12, 12, 12, 12,
    ];
    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });

    // 데이터 행 추가
    employees.forEach((employee: any) => {
      const baseSalary = employee.annual_salary
        ? Math.round(employee.annual_salary / 12)
        : 3000000;
      const hireDate = employee.hire_date
        ? new Date(employee.hire_date).toISOString().split("T")[0]
        : "";

      const row = [
        employee.employee_id,
        `${employee.last_name}${employee.first_name}`,
        employee.department || "부서없음",
        employee.position || "연구원",
        hireDate,
        baseSalary, // 기본급
        0, // 직책수당
        0, // 상여금
        300000, // 식대
        200000, // 차량유지
        0, // 연차수당
        0, // 연말정산
        0, // 건강보험
        0, // 장기요양보험
        0, // 국민연금
        0, // 고용보험
        0, // 갑근세
        0, // 주민세
        0, // 기타
        `=SUM(F${worksheet.rowCount}:L${worksheet.rowCount})`, // 지급총액
        `=SUM(M${worksheet.rowCount}:S${worksheet.rowCount})`, // 공제총액
        `=T${worksheet.rowCount}-U${worksheet.rowCount}`, // 실지급액
      ];

      worksheet.addRow(row);
    });

    // 숫자 형식 설정
    const numberColumns = [
      6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
    ]; // F~V열
    numberColumns.forEach((colIndex) => {
      worksheet.getColumn(colIndex).numFmt = "#,##0";
    });

    // 테두리 설정
    worksheet.eachRow((row, _rowNumber) => {
      row.eachCell((cell, _colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // 설명 시트 추가
    const instructionSheet = workbook.addWorksheet("작성 가이드");
    instructionSheet.addRow(["급여명세서 엑셀 업로드 가이드"]);
    instructionSheet.addRow([""]);
    instructionSheet.addRow(["1. 기본 정보"]);
    instructionSheet.addRow([
      "- 사번, 성명, 부서, 직위, 입사일은 수정하지 마세요",
    ]);
    instructionSheet.addRow(["- 기본급은 연봉/12로 자동 계산됩니다"]);
    instructionSheet.addRow([""]);
    instructionSheet.addRow(["2. 지급사항 (F~L열)"]);
    instructionSheet.addRow(["- 기본급: 기본 급여 (자동 계산)"]);
    instructionSheet.addRow(["- 직책수당: 직책에 따른 수당"]);
    instructionSheet.addRow(["- 상여금: 성과급, 보너스 등"]);
    instructionSheet.addRow(["- 식대: 식비 지원 (비과세)"]);
    instructionSheet.addRow(["- 차량유지: 차량 관련 비용 (비과세)"]);
    instructionSheet.addRow(["- 연차수당: 연차 사용 시 지급"]);
    instructionSheet.addRow(["- 연말정산: 연말정산 관련 지급"]);
    instructionSheet.addRow([""]);
    instructionSheet.addRow(["3. 공제사항 (M~S열)"]);
    instructionSheet.addRow(["- 건강보험: 건강보험료 (3.4%)"]);
    instructionSheet.addRow(["- 장기요양보험: 장기요양보험료 (0.34%)"]);
    instructionSheet.addRow(["- 국민연금: 국민연금 (4.5%)"]);
    instructionSheet.addRow(["- 고용보험: 고용보험료 (0.8%)"]);
    instructionSheet.addRow(["- 갑근세: 소득세 (13%)"]);
    instructionSheet.addRow(["- 주민세: 지방소득세 (1.3%)"]);
    instructionSheet.addRow(["- 기타: 기타 공제사항"]);
    instructionSheet.addRow([""]);
    instructionSheet.addRow(["4. 자동 계산"]);
    instructionSheet.addRow(["- 지급총액: 지급사항 합계 (자동 계산)"]);
    instructionSheet.addRow(["- 공제총액: 공제사항 합계 (자동 계산)"]);
    instructionSheet.addRow(["- 실지급액: 지급총액 - 공제총액 (자동 계산)"]);
    instructionSheet.addRow([""]);
    instructionSheet.addRow(["5. 주의사항"]);
    instructionSheet.addRow(["- 숫자만 입력하세요 (콤마, 원화 표시 제외)"]);
    instructionSheet.addRow(["- 빈 셀은 0으로 처리됩니다"]);
    instructionSheet.addRow(["- 파일을 저장한 후 업로드하세요"]);

    // 엑셀 파일 생성
    const buffer = await workbook.xlsx.writeBuffer();

    // 한글 파일명을 URL 인코딩
    const fileName = `급여명세서_${year}년${month}월_템플릿.xlsx`;
    const encodedFileName = encodeURIComponent(fileName);

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFileName}`,
      },
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: "엑셀 템플릿 생성에 실패했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
