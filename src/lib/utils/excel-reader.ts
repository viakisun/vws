import * as ExcelJS from 'exceljs'

/**
 * Excel 파일을 읽어서 2D 배열로 변환하는 공통 함수
 * @param fileContent Excel 파일의 바이너리 데이터
 * @returns 2D 배열 (행별 셀 데이터)
 */
export async function readExcelFile(fileContent: string): Promise<any[][]> {
  try {
    // Excel 파일 읽기
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(Buffer.from(fileContent, 'binary') as Buffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      throw new Error('워크시트를 찾을 수 없습니다.')
    }

    // 시트를 2D 배열로 변환
    const rawData: any[][] = []
    worksheet.eachRow((row, rowNumber) => {
      const rowData: any[] = []
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // 셀 값을 원본 형태로 가져오기
        if (cell.value === null || cell.value === undefined) {
          rowData[colNumber - 1] = ''
        } else if (typeof cell.value === 'object' && 'text' in cell.value) {
          // Rich text인 경우
          rowData[colNumber - 1] = cell.value.text
        } else {
          rowData[colNumber - 1] = cell.value
        }
      })
      rawData.push(rowData)
    })

    return rawData
  } catch (error) {
    console.error('Excel 파일 읽기 오류:', error)
    throw new Error(`Excel 파일 읽기 실패: ${error}`)
  }
}
