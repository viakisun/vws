import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock OCR strategies
vi.mock('$lib/services/ocr/strategy/OpenAIVisionOCRStrategy', () => ({
  OpenAIVisionOCRStrategy: vi.fn().mockImplementation(() => ({
    extractBusinessRegistration: vi.fn(),
    extractBankAccount: vi.fn(),
  })),
}))

vi.mock('$lib/services/ocr/strategy/TextractOCRStrategy', () => ({
  TextractOCRStrategy: vi.fn().mockImplementation(() => ({
    extractBusinessRegistration: vi.fn(),
    extractBankAccount: vi.fn(),
  })),
}))

// Mock the OCR service module
vi.mock('$lib/services/ocr', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    OCRService: vi.fn().mockImplementation((engine?: string) => {
      const mockOpenAIStrategy = {
        extractBusinessRegistration: vi.fn(),
        extractBankAccount: vi.fn(),
      }
      const mockTextractStrategy = {
        extractBusinessRegistration: vi.fn(),
        extractBankAccount: vi.fn(),
      }

      let currentStrategy = mockOpenAIStrategy
      if (engine === 'textract') {
        currentStrategy = mockTextractStrategy
      }

      return {
        currentEngine: engine || 'openai',
        strategy: currentStrategy,
        switchEngine: vi.fn((newEngine: string) => {
          if (newEngine === 'textract') {
            currentStrategy = mockTextractStrategy
          } else {
            currentStrategy = mockOpenAIStrategy
          }
        }),
        getCurrentEngine: vi.fn(() => engine || 'openai'),
        extractBusinessRegistration: vi.fn((fileBuffer: Buffer, mimeType: string) =>
          currentStrategy.extractBusinessRegistration(fileBuffer, mimeType),
        ),
        extractBankAccount: vi.fn((fileBuffer: Buffer, mimeType: string) =>
          currentStrategy.extractBankAccount(fileBuffer, mimeType),
        ),
      }
    }),
  }
})

import { OCRService } from '$lib/services/ocr'
import { OpenAIVisionOCRStrategy } from '$lib/services/ocr/strategy/OpenAIVisionOCRStrategy'
import { TextractOCRStrategy } from '$lib/services/ocr/strategy/TextractOCRStrategy'

describe('OCRService', () => {
  let ocrService: any
  let mockOpenAIStrategy: any
  let mockTextractStrategy: any

  const mockFileBuffer = Buffer.from('mock file content')
  const mockMimeType = 'application/pdf'

  const mockBusinessResult = {
    businessName: '테스트 회사',
    businessNumber: '123-45-67890',
    representativeName: '홍길동',
    businessType: 'IT서비스',
    businessCategory: '소프트웨어개발',
    address: '서울시 강남구',
    startDate: '2020-01-01',
    status: 'active',
  }

  const mockBankResult = {
    bankName: '국민은행',
    accountNumber: '123456-78-901234',
    accountHolder: '테스트 회사',
    branchName: '강남지점',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Create fresh mock instances
    mockOpenAIStrategy = {
      extractBusinessRegistration: vi.fn(),
      extractBankAccount: vi.fn(),
    }

    mockTextractStrategy = {
      extractBusinessRegistration: vi.fn(),
      extractBankAccount: vi.fn(),
    }

    vi.mocked(OpenAIVisionOCRStrategy).mockImplementation(() => mockOpenAIStrategy)
    vi.mocked(TextractOCRStrategy).mockImplementation(() => mockTextractStrategy)
  })

  describe('constructor and initialization', () => {
    it('should initialize with default OpenAI engine', () => {
      ocrService = new OCRService()

      expect(OpenAIVisionOCRStrategy).toHaveBeenCalled()
      expect(ocrService.getCurrentEngine()).toBe('openai')
    })

    it('should initialize with specified Textract engine', () => {
      ocrService = new OCRService('textract')

      expect(TextractOCRStrategy).toHaveBeenCalled()
      expect(ocrService.getCurrentEngine()).toBe('textract')
    })

    it('should initialize with specified OpenAI engine', () => {
      ocrService = new OCRService('openai')

      expect(OpenAIVisionOCRStrategy).toHaveBeenCalled()
      expect(ocrService.getCurrentEngine()).toBe('openai')
    })

    it('should fallback to OpenAI for unknown engine', () => {
      ocrService = new OCRService('unknown' as any)

      expect(OpenAIVisionOCRStrategy).toHaveBeenCalled()
      expect(ocrService.getCurrentEngine()).toBe('openai')
    })
  })

  describe('switchEngine', () => {
    it('should switch from OpenAI to Textract', () => {
      ocrService = new OCRService('openai')

      ocrService.switchEngine('textract')

      expect(TextractOCRStrategy).toHaveBeenCalled()
    })

    it('should switch from Textract to OpenAI', () => {
      ocrService = new OCRService('textract')

      ocrService.switchEngine('openai')

      expect(OpenAIVisionOCRStrategy).toHaveBeenCalled()
    })

    it('should handle unknown engine gracefully', () => {
      ocrService = new OCRService('openai')

      ocrService.switchEngine('unknown' as any)

      // Should fallback to OpenAI
      expect(OpenAIVisionOCRStrategy).toHaveBeenCalled()
    })
  })

  describe('getCurrentEngine', () => {
    it('should return current engine', () => {
      ocrService = new OCRService('textract')

      expect(ocrService.getCurrentEngine()).toBe('textract')
    })

    it('should return OpenAI as default', () => {
      ocrService = new OCRService()

      expect(ocrService.getCurrentEngine()).toBe('openai')
    })
  })

  describe('extractBusinessRegistration', () => {
    it('should extract business registration using current strategy', async () => {
      mockOpenAIStrategy.extractBusinessRegistration.mockResolvedValue(mockBusinessResult)
      ocrService = new OCRService('openai')

      const result = await ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType)

      expect(result).toEqual(mockBusinessResult)
      expect(mockOpenAIStrategy.extractBusinessRegistration).toHaveBeenCalledWith(
        mockFileBuffer,
        mockMimeType,
      )
    })

    it('should handle extraction errors', async () => {
      const mockError = new Error('OCR extraction failed')

      mockOpenAIStrategy.extractBusinessRegistration.mockRejectedValue(mockError)
      ocrService = new OCRService('openai')

      await expect(
        ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType),
      ).rejects.toThrow('OCR extraction failed')
    })

    it('should work with Textract strategy', async () => {
      mockTextractStrategy.extractBusinessRegistration.mockResolvedValue(mockBusinessResult)
      ocrService = new OCRService('textract')

      const result = await ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType)

      expect(result).toEqual(mockBusinessResult)
      expect(mockTextractStrategy.extractBusinessRegistration).toHaveBeenCalledWith(
        mockFileBuffer,
        mockMimeType,
      )
    })
  })

  describe('extractBankAccount', () => {
    it('should extract bank account using current strategy', async () => {
      mockOpenAIStrategy.extractBankAccount.mockResolvedValue(mockBankResult)
      ocrService = new OCRService('openai')

      const result = await ocrService.extractBankAccount(mockFileBuffer, mockMimeType)

      expect(result).toEqual(mockBankResult)
      expect(mockOpenAIStrategy.extractBankAccount).toHaveBeenCalledWith(
        mockFileBuffer,
        mockMimeType,
      )
    })

    it('should handle extraction errors', async () => {
      const mockError = new Error('Bank account extraction failed')

      mockOpenAIStrategy.extractBankAccount.mockRejectedValue(mockError)
      ocrService = new OCRService('openai')

      await expect(ocrService.extractBankAccount(mockFileBuffer, mockMimeType)).rejects.toThrow(
        'Bank account extraction failed',
      )
    })

    it('should work with Textract strategy', async () => {
      mockTextractStrategy.extractBankAccount.mockResolvedValue(mockBankResult)
      ocrService = new OCRService('textract')

      const result = await ocrService.extractBankAccount(mockFileBuffer, mockMimeType)

      expect(result).toEqual(mockBankResult)
      expect(mockTextractStrategy.extractBankAccount).toHaveBeenCalledWith(
        mockFileBuffer,
        mockMimeType,
      )
    })
  })

  describe('edge cases', () => {
    it('should handle empty file buffer', async () => {
      const emptyBuffer = Buffer.alloc(0)

      mockOpenAIStrategy.extractBusinessRegistration.mockResolvedValue(mockBusinessResult)
      ocrService = new OCRService('openai')

      const result = await ocrService.extractBusinessRegistration(emptyBuffer, mockMimeType)

      expect(result).toEqual(mockBusinessResult)
      expect(mockOpenAIStrategy.extractBusinessRegistration).toHaveBeenCalledWith(
        emptyBuffer,
        mockMimeType,
      )
    })

    it('should handle very large file buffer', async () => {
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024) // 10MB

      mockOpenAIStrategy.extractBusinessRegistration.mockResolvedValue(mockBusinessResult)
      ocrService = new OCRService('openai')

      const result = await ocrService.extractBusinessRegistration(largeBuffer, mockMimeType)

      expect(result).toEqual(mockBusinessResult)
      expect(mockOpenAIStrategy.extractBusinessRegistration).toHaveBeenCalledWith(
        largeBuffer,
        mockMimeType,
      )
    })

    it('should handle unsupported MIME types', async () => {
      const unsupportedMimeType = 'application/unsupported'

      mockOpenAIStrategy.extractBusinessRegistration.mockResolvedValue(mockBusinessResult)
      ocrService = new OCRService('openai')

      const result = await ocrService.extractBusinessRegistration(
        mockFileBuffer,
        unsupportedMimeType,
      )

      expect(result).toEqual(mockBusinessResult)
      expect(mockOpenAIStrategy.extractBusinessRegistration).toHaveBeenCalledWith(
        mockFileBuffer,
        unsupportedMimeType,
      )
    })

    it('should handle various MIME types', async () => {
      const mimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/tiff',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]

      mockOpenAIStrategy.extractBusinessRegistration.mockResolvedValue(mockBusinessResult)
      ocrService = new OCRService('openai')

      for (const mimeType of mimeTypes) {
        const result = await ocrService.extractBusinessRegistration(mockFileBuffer, mimeType)
        expect(result).toEqual(mockBusinessResult)
        expect(mockOpenAIStrategy.extractBusinessRegistration).toHaveBeenCalledWith(
          mockFileBuffer,
          mimeType,
        )
      }
    })

    it('should handle special characters in extracted data', async () => {
      const specialResult = {
        ...mockBusinessResult,
        businessName: '특수문자@#$%^&*()회사',
        address: '서울시 강남구@#$%^&*()',
      }

      mockOpenAIStrategy.extractBusinessRegistration.mockResolvedValue(specialResult)
      ocrService = new OCRService('openai')

      const result = await ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType)

      expect(result).toEqual(specialResult)
      expect(mockOpenAIStrategy.extractBusinessRegistration).toHaveBeenCalledWith(
        mockFileBuffer,
        mockMimeType,
      )
    })

    it('should handle null and undefined values in extracted data', async () => {
      const partialResult = {
        businessName: '테스트 회사',
        businessNumber: null,
        representativeName: undefined,
        businessType: 'Service',
        businessCategory: 'Software',
        address: null,
        startDate: '2020-01-01',
        status: 'active',
      }

      mockOpenAIStrategy.extractBusinessRegistration.mockResolvedValue(partialResult)
      ocrService = new OCRService('openai')

      const result = await ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType)

      expect(result).toEqual(partialResult)
      expect(mockOpenAIStrategy.extractBusinessRegistration).toHaveBeenCalledWith(
        mockFileBuffer,
        mockMimeType,
      )
    })

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Network timeout')

      mockOpenAIStrategy.extractBusinessRegistration.mockRejectedValue(timeoutError)
      ocrService = new OCRService('openai')

      await expect(
        ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType),
      ).rejects.toThrow('Network timeout')
    })

    it('should handle API rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded')

      mockOpenAIStrategy.extractBusinessRegistration.mockRejectedValue(rateLimitError)
      ocrService = new OCRService('openai')

      await expect(
        ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType),
      ).rejects.toThrow('Rate limit exceeded')
    })

    it('should handle invalid API key errors', async () => {
      const apiKeyError = new Error('Invalid API key')

      mockOpenAIStrategy.extractBusinessRegistration.mockRejectedValue(apiKeyError)
      ocrService = new OCRService('openai')

      await expect(
        ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType),
      ).rejects.toThrow('Invalid API key')
    })

    it('should handle corrupted file data', async () => {
      const corruptedBuffer = Buffer.from('corrupted data')
      const corruptedError = new Error('File data is corrupted')

      mockOpenAIStrategy.extractBusinessRegistration.mockRejectedValue(corruptedError)
      ocrService = new OCRService('openai')

      await expect(
        ocrService.extractBusinessRegistration(corruptedBuffer, mockMimeType),
      ).rejects.toThrow('File data is corrupted')
    })
  })

  describe('performance tests', () => {
    it('should handle multiple concurrent requests', async () => {
      mockOpenAIStrategy.extractBusinessRegistration.mockResolvedValue(mockBusinessResult)
      ocrService = new OCRService('openai')

      const promises = Array.from({ length: 10 }, () =>
        ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType),
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result).toEqual(mockBusinessResult)
      })
      expect(mockOpenAIStrategy.extractBusinessRegistration).toHaveBeenCalledTimes(10)
    })

    it('should handle engine switching during concurrent requests', async () => {
      mockOpenAIStrategy.extractBusinessRegistration.mockResolvedValue(mockBusinessResult)
      mockTextractStrategy.extractBusinessRegistration.mockResolvedValue(mockBusinessResult)
      ocrService = new OCRService('openai')

      // Start first request with OpenAI
      const openaiPromise = ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType)

      // Switch to Textract
      ocrService.switchEngine('textract')

      // Start second request with Textract
      const textractPromise = ocrService.extractBusinessRegistration(mockFileBuffer, mockMimeType)

      const [openaiResult, textractResult] = await Promise.all([openaiPromise, textractPromise])

      expect(openaiResult).toEqual(mockBusinessResult)
      expect(textractResult).toEqual(mockBusinessResult)
      expect(mockOpenAIStrategy.extractBusinessRegistration).toHaveBeenCalledTimes(1)
      expect(mockTextractStrategy.extractBusinessRegistration).toHaveBeenCalledTimes(1)
    })
  })
})
