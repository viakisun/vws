// 대한민국 공휴일 데이터
// 음력 공휴일은 매년 변경되므로 주요 양력 공휴일만 포함

export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
  isRecurring?: boolean // 매년 반복되는 공휴일인지
}

// 고정 공휴일 (매년 동일한 날짜)
const recurringHolidays: Omit<Holiday, 'date'>[] = [
  { name: '신정', isRecurring: true },
  { name: '삼일절', isRecurring: true },
  { name: '어린이날', isRecurring: true },
  { name: '현충일', isRecurring: true },
  { name: '광복절', isRecurring: true },
  { name: '개천절', isRecurring: true },
  { name: '한글날', isRecurring: true },
  { name: '크리스마스', isRecurring: true },
]

// 2025년 공휴일 (음력 공휴일 포함)
const holidays2025: Holiday[] = [
  { date: '2025-01-01', name: '신정' },
  { date: '2025-01-28', name: '설날 연휴' },
  { date: '2025-01-29', name: '설날' },
  { date: '2025-01-30', name: '설날 연휴' },
  { date: '2025-03-01', name: '삼일절' },
  { date: '2025-03-03', name: '삼일절 대체공휴일' },
  { date: '2025-05-05', name: '어린이날' },
  { date: '2025-05-06', name: '부처님오신날' },
  { date: '2025-06-06', name: '현충일' },
  { date: '2025-08-15', name: '광복절' },
  { date: '2025-10-03', name: '개천절' },
  { date: '2025-10-05', name: '추석 연휴' },
  { date: '2025-10-06', name: '추석' },
  { date: '2025-10-07', name: '추석 연휴' },
  { date: '2025-10-08', name: '추석 대체공휴일' },
  { date: '2025-10-09', name: '한글날' },
  { date: '2025-12-25', name: '크리스마스' },
]

// 2024년 공휴일
const holidays2024: Holiday[] = [
  { date: '2024-01-01', name: '신정' },
  { date: '2024-02-09', name: '설날 연휴' },
  { date: '2024-02-10', name: '설날' },
  { date: '2024-02-11', name: '설날 연휴' },
  { date: '2024-02-12', name: '설날 대체공휴일' },
  { date: '2024-03-01', name: '삼일절' },
  { date: '2024-04-10', name: '제22대 국회의원 선거일' },
  { date: '2024-05-05', name: '어린이날' },
  { date: '2024-05-06', name: '어린이날 대체공휴일' },
  { date: '2024-05-15', name: '부처님오신날' },
  { date: '2024-06-06', name: '현충일' },
  { date: '2024-08-15', name: '광복절' },
  { date: '2024-09-16', name: '추석 연휴' },
  { date: '2024-09-17', name: '추석' },
  { date: '2024-09-18', name: '추석 연휴' },
  { date: '2024-10-03', name: '개천절' },
  { date: '2024-10-09', name: '한글날' },
  { date: '2024-12-25', name: '크리스마스' },
]

// 2026년 공휴일 (추가 예정)
const holidays2026: Holiday[] = [
  { date: '2026-01-01', name: '신정' },
  { date: '2026-02-16', name: '설날 연휴' },
  { date: '2026-02-17', name: '설날' },
  { date: '2026-02-18', name: '설날 연휴' },
  { date: '2026-03-01', name: '삼일절' },
  { date: '2026-05-05', name: '어린이날' },
  { date: '2026-05-24', name: '부처님오신날' },
  { date: '2026-05-25', name: '부처님오신날 대체공휴일' },
  { date: '2026-06-06', name: '현충일' },
  { date: '2026-08-15', name: '광복절' },
  { date: '2026-09-24', name: '추석 연휴' },
  { date: '2026-09-25', name: '추석' },
  { date: '2026-09-26', name: '추석 연휴' },
  { date: '2026-10-03', name: '개천절' },
  { date: '2026-10-05', name: '개천절 대체공휴일' },
  { date: '2026-10-09', name: '한글날' },
  { date: '2026-12-25', name: '크리스마스' },
]

// 모든 공휴일 데이터를 Map으로 관리
const holidayMap = new Map<string, Holiday>()

// 초기화
;[...holidays2024, ...holidays2025, ...holidays2026].forEach((holiday) => {
  holidayMap.set(holiday.date, holiday)
})

/**
 * 특정 날짜가 공휴일인지 확인
 * @param date YYYY-MM-DD 형식의 날짜 문자열 또는 Date 객체
 * @returns 공휴일 정보 또는 null
 */
export function getHoliday(date: string | Date): Holiday | null {
  const dateStr =
    typeof date === 'string'
      ? date
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return holidayMap.get(dateStr) || null
}

/**
 * 특정 날짜가 공휴일인지 확인 (boolean)
 * @param date YYYY-MM-DD 형식의 날짜 문자열 또는 Date 객체
 */
export function isHoliday(date: string | Date): boolean {
  return getHoliday(date) !== null
}

/**
 * 특정 연도/월의 모든 공휴일 가져오기
 * @param year 연도
 * @param month 월 (1-12)
 */
export function getHolidaysInMonth(year: number, month: number): Holiday[] {
  const monthStr = String(month).padStart(2, '0')
  const prefix = `${year}-${monthStr}`

  const holidays: Holiday[] = []
  holidayMap.forEach((holiday) => {
    if (holiday.date.startsWith(prefix)) {
      holidays.push(holiday)
    }
  })

  return holidays
}

/**
 * 특정 연도의 모든 공휴일 가져오기
 * @param year 연도
 */
export function getHolidaysInYear(year: number): Holiday[] {
  const prefix = `${year}-`

  const holidays: Holiday[] = []
  holidayMap.forEach((holiday) => {
    if (holiday.date.startsWith(prefix)) {
      holidays.push(holiday)
    }
  })

  return holidays.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * 특정 날짜가 주말인지 확인
 * @param date Date 객체 또는 YYYY-MM-DD 형식의 날짜 문자열
 */
export function isWeekend(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dayOfWeek = dateObj.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // 일요일(0) 또는 토요일(6)
}

/**
 * 특정 날짜가 휴일(주말 또는 공휴일)인지 확인
 * @param date Date 객체 또는 YYYY-MM-DD 형식의 날짜 문자열
 */
export function isNonWorkingDay(date: string | Date): boolean {
  return isWeekend(date) || isHoliday(date)
}

/**
 * 두 날짜 사이의 실제 근무일 수 계산 (주말 및 공휴일 제외)
 * @param startDate 시작 날짜 (포함)
 * @param endDate 종료 날짜 (포함)
 * @returns 근무일 수
 */
export function getWorkingDays(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  let workingDays = 0
  const current = new Date(start)

  while (current <= end) {
    if (!isNonWorkingDay(current)) {
      workingDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return workingDays
}

/**
 * 기간 내에 휴일이 포함되어 있는지 확인
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 휴일 포함 여부
 */
export function hasNonWorkingDayInRange(startDate: string | Date, endDate: string | Date): boolean {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  const current = new Date(start)
  while (current <= end) {
    if (isNonWorkingDay(current)) {
      return true
    }
    current.setDate(current.getDate() + 1)
  }

  return false
}
