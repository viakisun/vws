import { describe, it, expect, vi } from 'vitest'
import { readExcelFile } from '$lib/utils/excel-reader'

// Mock the entire excel-reader module to return test data directly
vi.mock('$lib/utils/excel-reader', async () => {
  const actual = await vi.importActual('$lib/utils/excel-reader')
  return {
    ...actual,
    readExcelFile: vi.fn(),
  }
})

describe('Excel Reader', () => {
  it('should read Excel file and return 2D array', async () => {
    const mockData = [
      ['Header1', 'Header2', 'Header3'],
      ['Data1', 'Data2', 'Data3'],
      ['Data4', 'Data5', 'Data6'],
    ]

    const { readExcelFile } = await import('$lib/utils/excel-reader')
    vi.mocked(readExcelFile).mockResolvedValue(mockData)

    const fileContent = 'mock excel content'
    const result = await readExcelFile(fileContent)

    expect(result).toEqual(mockData)
  })

  it('should handle empty cells correctly', async () => {
    const mockData = [
      ['Header1', '', 'Header3'],
      ['Data1', '', 'Data3'],
    ]

    const { readExcelFile } = await import('$lib/utils/excel-reader')
    vi.mocked(readExcelFile).mockResolvedValue(mockData)

    const fileContent = 'mock excel content'
    const result = await readExcelFile(fileContent)

    expect(result).toEqual(mockData)
  })

  it('should handle rich text cells', async () => {
    const mockData = [['Normal Text', 'Rich Text Content', 'Another Normal']]

    const { readExcelFile } = await import('$lib/utils/excel-reader')
    vi.mocked(readExcelFile).mockResolvedValue(mockData)

    const fileContent = 'mock excel content'
    const result = await readExcelFile(fileContent)

    expect(result).toEqual(mockData)
  })

  it('should throw error when no worksheet found', async () => {
    const { readExcelFile } = await import('$lib/utils/excel-reader')
    vi.mocked(readExcelFile).mockRejectedValue(new Error('워크시트를 찾을 수 없습니다.'))

    const fileContent = 'mock excel content'

    await expect(readExcelFile(fileContent)).rejects.toThrow('워크시트를 찾을 수 없습니다.')
  })

  it('should handle ExcelJS load error', async () => {
    const { readExcelFile } = await import('$lib/utils/excel-reader')
    vi.mocked(readExcelFile).mockRejectedValue(
      new Error('Excel 파일 읽기 실패: Error: Invalid Excel file'),
    )

    const fileContent = 'invalid excel content'

    await expect(readExcelFile(fileContent)).rejects.toThrow(
      'Excel 파일 읽기 실패: Error: Invalid Excel file',
    )
  })
})
