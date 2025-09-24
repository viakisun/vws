export function formatKRW(amount: number): string {
  return amount.toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });
}

export function formatCurrency(
  amount: number | string | undefined | null,
  includeUnit: boolean = true,
): string {
  if (amount === undefined || amount === null) {
    return includeUnit ? "0천원" : "0";
  }

  // 문자열인 경우 숫자로 변환
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return includeUnit ? "0천원" : "0";
  }

  // 천원 단위로 변환 (원 단위를 천원으로 나누기)
  const thousandAmount = Math.floor(numAmount / 1000);

  return thousandAmount.toLocaleString("ko-KR") + (includeUnit ? "천원" : "");
}

export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "0%";
  }
  return value.toFixed(1) + "%";
}

import {
  formatDateForDisplay,
  formatDateForInput as standardFormatDateForInput,
} from "./date-handler";

export function formatDate(dateString: string): string {
  if (!dateString) return "";

  // 통합된 날짜 처리 시스템 사용
  return formatDateForDisplay(dateString, "FULL");
}

// HTML date input용 날짜 형식 변환 (YYYY-MM-DD)
export function formatDateForInput(dateString: string): string {
  if (!dateString) return "";

  // 통합된 날짜 처리 시스템 사용
  return standardFormatDateForInput(dateString);
}

export function getRelativeTime(dateString: string): string {
  if (!dateString) return "";

  // 통합된 날짜 처리 시스템 사용
  return formatDateForDisplay(dateString, "RELATIVE");
}

export function pct(n: number): string {
  return `${Math.floor(n)}%`;
}

export function formatEmployeeId(id: number): string {
  return `V${id.toString().padStart(5, "0")}`;
}

/**
 * 한국 이름을 성+이름 순서로 표시 (띄우지 않고 붙여서)
 * @param lastName 성
 * @param firstName 이름
 * @returns 성+이름 (예: "김철수")
 */
export function formatKoreanName(lastName: string, firstName: string): string {
  if (!lastName || !firstName) {
    return `${lastName || ""}${firstName || ""}`;
  }
  return `${lastName}${firstName}`;
}

/**
 * 직원 객체에서 한국 이름을 성+이름 순서로 표시
 * @param employee 직원 객체 (last_name, first_name 속성 포함)
 * @returns 성+이름 (예: "김철수")
 */
export function formatEmployeeName(employee: {
  last_name?: string;
  first_name?: string;
}): string {
  const lastName = employee.last_name || "";
  const firstName = employee.first_name || "";

  if (!lastName && !firstName) return "";

  // 이미 조합된 이름인 경우 (예: "김철수")
  const combinedName = `${lastName}${firstName}`;
  if (combinedName.length >= 2 && !combinedName.includes(" ")) {
    return combinedName;
  }

  // 분리된 이름인 경우 조합
  if (lastName && firstName) {
    return `${lastName}${firstName}`;
  }

  // 하나만 있는 경우
  return combinedName;
}
