import { env } from '$env/dynamic/private'
import {
  AnalyzeDocumentCommand,
  DetectDocumentTextCommand,
  TextractClient,
  type AnalyzeDocumentCommandOutput,
  type Block,
  type DetectDocumentTextCommandOutput,
} from '@aws-sdk/client-textract'

// Textract 클라이언트 초기화
const textractClient = new TextractClient({
  region: env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export interface TextractResult {
  text: string
  lines: string[]
  words: Array<{ text: string; confidence: number }>
  averageConfidence: number
  blocks: Block[]
}

/**
 * 바이너리 데이터에서 텍스트 추출
 */
export async function detectDocumentText(documentBytes: Buffer): Promise<TextractResult> {
  try {
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: documentBytes,
      },
    })

    const response: DetectDocumentTextCommandOutput = await textractClient.send(command)

    return parseTextractResponse(response)
  } catch (error) {
    console.error('Textract detectDocumentText error:', error)
    throw new Error(
      `Textract OCR 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    )
  }
}

/**
 * S3 객체에서 직접 텍스트 추출
 */
export async function detectDocumentTextFromS3(
  bucket: string,
  key: string,
): Promise<TextractResult> {
  try {
    const command = new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: key,
        },
      },
    })

    const response: DetectDocumentTextCommandOutput = await textractClient.send(command)

    return parseTextractResponse(response)
  } catch (error) {
    console.error('Textract detectDocumentTextFromS3 error:', error)
    throw new Error(
      `Textract S3 OCR 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    )
  }
}

/**
 * 표 구조 분석이 필요한 경우 (사업자등록증 등)
 */
export async function analyzeDocument(
  documentBytes: Buffer,
): Promise<AnalyzeDocumentCommandOutput> {
  try {
    const command = new AnalyzeDocumentCommand({
      Document: {
        Bytes: documentBytes,
      },
      FeatureTypes: ['TABLES', 'FORMS'],
    })

    return await textractClient.send(command)
  } catch (error) {
    console.error('Textract analyzeDocument error:', error)
    throw new Error(
      `Textract 문서 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    )
  }
}

/**
 * Textract 응답을 파싱하여 구조화된 데이터로 변환
 */
function parseTextractResponse(response: DetectDocumentTextCommandOutput): TextractResult {
  const blocks = response.Blocks || []
  const lines: string[] = []
  const words: Array<{ text: string; confidence: number }> = []
  let totalConfidence = 0
  let confidenceCount = 0

  for (const block of blocks) {
    if (block.BlockType === 'LINE' && block.Text) {
      lines.push(block.Text)
    } else if (block.BlockType === 'WORD' && block.Text && block.Confidence) {
      words.push({
        text: block.Text,
        confidence: block.Confidence,
      })
      totalConfidence += block.Confidence
      confidenceCount++
    }
  }

  const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0
  const text = lines.join('\n')

  return {
    text,
    lines,
    words,
    averageConfidence,
    blocks,
  }
}

/**
 * 키워드 근처의 텍스트 찾기 (라인 단위)
 */
export function findTextNearKeyword(
  lines: string[],
  keyword: string,
  maxDistance: number = 1,
): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes(keyword)) {
      // 같은 라인에서 키워드 뒤의 텍스트 찾기
      const parts = line.split(keyword)
      if (parts.length > 1 && parts[1].trim()) {
        return parts[1].trim()
      }

      // 다음 라인들에서 찾기
      for (let j = 1; j <= maxDistance && i + j < lines.length; j++) {
        const nextLine = lines[i + j].trim()
        if (nextLine) {
          return nextLine
        }
      }
    }
  }
  return null
}

/**
 * 정규식으로 패턴 매칭
 */
export function extractPattern(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern)
  return match ? match[0] : null
}

/**
 * 모든 라인에서 정규식 패턴 찾기
 */
export function extractPatternsFromLines(lines: string[], pattern: RegExp): string[] {
  const results: string[] = []
  for (const line of lines) {
    const matches = line.match(new RegExp(pattern.source, 'g'))
    if (matches) {
      results.push(...matches)
    }
  }
  return results
}
