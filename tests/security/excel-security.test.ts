/**
 * Excel 보안 검증 테스트
 */

import {
    EXCEL_SECURITY_CONFIG,
    detectMacros,
    sanitizeExcelData,
    validateExcelDataSize,
    validateExcelMagicBytes,
    validateExcelSecurity,
    validateFileSize,
    validateZipStructure,
    withTimeout
} from '$lib/utils/security/excel-security'
import { describe, expect, it } from 'vitest'

describe('Excel Security Tests', () => {
  describe('매직바이트 검증', () => {
    it('유효한 .xls 파일 시그니처를 인식해야 함', () => {
      // .xls 파일 시그니처
      const xlsSignature = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])
      expect(validateExcelMagicBytes(xlsSignature)).toBe(true)
    })

    it('유효한 .xlsx 파일 시그니처를 인식해야 함', () => {
      // .xlsx 파일 시그니처 (ZIP 기반)
      const xlsxSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04])
      expect(validateExcelMagicBytes(xlsxSignature)).toBe(true)
    })

    it('유효하지 않은 파일 시그니처를 거부해야 함', () => {
      const invalidSignature = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF])
      expect(validateExcelMagicBytes(invalidSignature)).toBe(false)
    })

    it('너무 작은 버퍼를 거부해야 함', () => {
      const smallBuffer = Buffer.from([0x50, 0x4B])
      expect(validateExcelMagicBytes(smallBuffer)).toBe(false)
    })
  })

  describe('파일 크기 검증', () => {
    it('허용된 크기 이하의 파일을 허용해야 함', () => {
      const smallBuffer = Buffer.alloc(1024) // 1KB
      expect(validateFileSize(smallBuffer)).toBe(true)
    })

    it('허용된 크기를 초과하는 파일을 거부해야 함', () => {
      const largeBuffer = Buffer.alloc(EXCEL_SECURITY_CONFIG.MAX_FILE_SIZE + 1)
      expect(validateFileSize(largeBuffer)).toBe(false)
    })
  })

  describe('데이터 크기 검증', () => {
    it('허용된 행/컬럼 수 이하의 데이터를 허용해야 함', () => {
      const smallData = Array(100).fill(Array(10).fill('test'))
      expect(validateExcelDataSize(smallData)).toBe(true)
    })

    it('허용된 행 수를 초과하는 데이터를 거부해야 함', () => {
      const largeData = Array(EXCEL_SECURITY_CONFIG.MAX_ROWS + 1).fill(Array(10).fill('test'))
      expect(validateExcelDataSize(largeData)).toBe(false)
    })

    it('허용된 컬럼 수를 초과하는 데이터를 거부해야 함', () => {
      const wideData = Array(100).fill(Array(EXCEL_SECURITY_CONFIG.MAX_COLS + 1).fill('test'))
      expect(validateExcelDataSize(wideData)).toBe(false)
    })

    it('빈 데이터를 허용해야 함', () => {
      expect(validateExcelDataSize([])).toBe(true)
    })
  })

  describe('수식 무력화', () => {
    it('수식으로 시작하는 셀을 빈 문자열로 변환해야 함', () => {
      const data = [
        ['=SUM(A1:A10)', 'normal text', '=CONCAT("hello", "world")'],
        ['=IF(A1>0, "positive", "negative")', 'another text', '']
      ]
      
      const sanitized = sanitizeExcelData(data)
      
      expect(sanitized[0][0]).toBe('')
      expect(sanitized[0][1]).toBe('normal text')
      expect(sanitized[0][2]).toBe('')
      expect(sanitized[1][0]).toBe('')
      expect(sanitized[1][1]).toBe('another text')
    })

    it('위험한 함수명이 포함된 셀을 빈 문자열로 변환해야 함', () => {
      const data = [
        ['EXEC("cmd")', 'SHELL("ls")', 'EVAL("code")'],
        ['normal text', 'FUNCTION test()', 'safe content']
      ]
      
      const sanitized = sanitizeExcelData(data)
      
      expect(sanitized[0][0]).toBe('')
      expect(sanitized[0][1]).toBe('')
      expect(sanitized[0][2]).toBe('')
      expect(sanitized[1][0]).toBe('normal text')
      expect(sanitized[1][1]).toBe('')
      expect(sanitized[1][2]).toBe('safe content')
    })

    it('null/undefined 값을 빈 문자열로 변환해야 함', () => {
      const data = [
        [null, undefined, 'normal text'],
        ['', 'another text', null]
      ]
      
      const sanitized = sanitizeExcelData(data)
      
      expect(sanitized[0][0]).toBe('')
      expect(sanitized[0][1]).toBe('')
      expect(sanitized[0][2]).toBe('normal text')
      expect(sanitized[1][0]).toBe('')
      expect(sanitized[1][1]).toBe('another text')
      expect(sanitized[1][2]).toBe('')
    })
  })

  describe('매크로 탐지', () => {
    it('매크로 패턴을 감지해야 함', () => {
      const dataWithMacros = [
        ['normal data', 'AUTO_OPEN function', 'other data'],
        ['WORKBOOK_OPEN event', 'regular text', 'WORKSHEET_ACTIVATE']
      ]
      
      expect(detectMacros(dataWithMacros)).toBe(true)
    })

    it('VBA 관련 패턴을 감지해야 함', () => {
      const dataWithVBA = [
        ['normal data', 'SUB MyMacro()', 'other data'],
        ['FUNCTION TestFunction()', 'regular text', 'VB Script']
      ]
      
      expect(detectMacros(dataWithVBA)).toBe(true)
    })

    it('매크로가 없는 데이터는 false를 반환해야 함', () => {
      const normalData = [
        ['normal data', 'regular text', 'safe content'],
        ['another row', 'more data', 'normal text']
      ]
      
      expect(detectMacros(normalData)).toBe(false)
    })
  })

  describe('ZIP 구조 검증', () => {
    it('유효한 ZIP 구조를 허용해야 함', () => {
      // 간단한 ZIP 헤더
      const zipBuffer = Buffer.concat([
        Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP 로컬 헤더
        Buffer.alloc(100) // 나머지 데이터
      ])
      
      expect(validateZipStructure(zipBuffer)).toBe(true)
    })

    it('ZIP이 아닌 파일을 허용해야 함 (다른 검증에서 처리)', () => {
      const nonZipBuffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF])
      expect(validateZipStructure(nonZipBuffer)).toBe(true)
    })
  })

  describe('종합 보안 검증', () => {
    it('모든 검증을 통과하는 파일을 허용해야 함', () => {
      const validBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])
      const validData = Array(100).fill(Array(10).fill('test'))
      
      const result = validateExcelSecurity(validBuffer, validData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('파일 크기 초과 시 오류를 반환해야 함', () => {
      const largeBuffer = Buffer.alloc(EXCEL_SECURITY_CONFIG.MAX_FILE_SIZE + 1)
      
      const result = validateExcelSecurity(largeBuffer)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('파일 크기가 너무 큽니다'))).toBe(true)
    })

    it('매크로 감지 시 경고를 반환해야 함', () => {
      const validBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])
      const dataWithMacros = [['AUTO_OPEN function']]
      
      const result = validateExcelSecurity(validBuffer, dataWithMacros)
      
      if (EXCEL_SECURITY_CONFIG.SECURITY_LEVEL === 'strict') {
        expect(result.isValid).toBe(false)
        expect(result.errors.some(error => error.includes('매크로가 포함된 파일은 허용되지 않습니다'))).toBe(true)
      } else {
        expect(result.warnings.some(warning => warning.includes('매크로가 포함된 파일이 감지되었습니다'))).toBe(true)
      }
    })
  })

  describe('타임아웃 래퍼', () => {
    it('정상적인 Promise를 반환해야 함', async () => {
      const fastPromise = Promise.resolve('success')
      const result = await withTimeout(fastPromise, 1000)
      
      expect(result).toBe('success')
    })

    it('타임아웃 시 오류를 던져야 함', async () => {
      const slowPromise = new Promise(resolve => setTimeout(() => resolve('too slow'), 2000))
      
      await expect(withTimeout(slowPromise, 100)).rejects.toThrow('파싱 타임아웃')
    })
  })
})
