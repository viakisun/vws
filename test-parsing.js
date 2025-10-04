// 파싱 테스트 스크립트
const fs = require('fs')

// CSV 파싱 함수
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// 숫자 파싱 함수
function parseNumberField(field) {
  if (!field || field.trim() === '') return 0
  const cleaned = field.replace(/,/g, '')
  return parseFloat(cleaned) || 0
}

// 테스트 라인
const testLine =
  '166,2025-10-01 10:22:03,(유)이티컴파니,(유)이티컴파니,,780,000,5,566,808,타행송금,Hana CBS,'

console.log('=== 파싱 테스트 ===')
console.log('원본 라인:', testLine)

const parts = parseCSVLine(testLine)
console.log('파싱된 parts:', parts)
console.log('parts 길이:', parts.length)

console.log('\n=== 각 필드 분석 ===')
console.log('parts[0] (No):', parts[0])
console.log('parts[1] (거래일시):', parts[1])
console.log('parts[2] (적요):', parts[2])
console.log('parts[3] (의뢰인/수취인):', parts[3])
console.log('parts[4] (입금):', parts[4], '->', parseNumberField(parts[4]))
console.log('parts[5] (출금):', parts[5], '->', parseNumberField(parts[5]))
console.log('parts[6] (잔액):', parts[6], '->', parseNumberField(parts[6]))
console.log('parts[7] (구분):', parts[7])
console.log('parts[8] (거래점):', parts[8])
console.log('parts[9] (거래특이사항):', parts[9])
