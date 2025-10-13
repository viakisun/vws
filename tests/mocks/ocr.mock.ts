import { vi } from 'vitest'

/**
 * OCR Mock 라이브러리
 * OCR 서비스 Mock 구현
 */

// Mock OCR Strategy
export const mockOCRStrategy = {
  extractBusinessRegistration: vi.fn(),
  extractBankAccount: vi.fn(),
}

// Mock OCR Service
export const mockOCRService = {
  processBusinessRegistration: vi.fn(),
  processBankAccount: vi.fn(),
  getStrategy: vi.fn(),
  setStrategy: vi.fn(),
}

// Mock OpenAI Vision
export const mockOpenAIVision = {
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
}

// Mock Textract Client
export const mockTextractClient = {
  analyzeDocument: vi.fn(),
  detectDocumentText: vi.fn(),
}

/**
 * OCR Mock 설정
 */
export const setupOCRMock = () => {
  // 기본 성공 응답 설정
  mockOCRStrategy.extractBusinessRegistration.mockResolvedValue({
    businessName: '테스트 주식회사',
    businessNumber: '123-45-67890',
    representativeName: '홍길동',
    businessType: 'IT서비스',
    businessCategory: '소프트웨어개발',
    address: '서울시 강남구 테헤란로 123',
    startDate: '2020-01-01',
    status: 'active',
  })

  mockOCRStrategy.extractBankAccount.mockResolvedValue({
    bankName: '국민은행',
    accountNumber: '123456-78-901234',
    accountHolder: '테스트 주식회사',
    branchName: '강남지점',
  })

  mockOCRService.processBusinessRegistration.mockImplementation(
    mockOCRStrategy.extractBusinessRegistration
  )
  mockOCRService.processBankAccount.mockImplementation(
    mockOCRStrategy.extractBankAccount
  )

  // OpenAI Vision Mock 설정
  mockOpenAIVision.chat.completions.create.mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            businessName: '테스트 주식회사',
            businessNumber: '123-45-67890',
            representativeName: '홍길동',
            businessType: 'IT서비스',
            businessCategory: '소프트웨어개발',
            address: '서울시 강남구 테헤란로 123',
            startDate: '2020-01-01',
            status: 'active',
          }),
        },
      },
    ],
  })

  // Textract Mock 설정
  mockTextractClient.analyzeDocument.mockResolvedValue({
    Blocks: [
      {
        BlockType: 'LINE',
        Text: '테스트 주식회사',
        Confidence: 99.5,
      },
      {
        BlockType: 'LINE',
        Text: '123-45-67890',
        Confidence: 98.2,
      },
      {
        BlockType: 'LINE',
        Text: '홍길동',
        Confidence: 97.8,
      },
    ],
  })

  return {
    mockOCRStrategy,
    mockOCRService,
    mockOpenAIVision,
    mockTextractClient,
  }
}

/**
 * 사업자등록증 OCR Mock 설정
 */
export const setupBusinessRegistrationMocks = {
  // 성공적인 추출
  success: (data: any = {}) => {
    const defaultData = {
      businessName: '테스트 주식회사',
      businessNumber: '123-45-67890',
      representativeName: '홍길동',
      businessType: 'IT서비스',
      businessCategory: '소프트웨어개발',
      address: '서울시 강남구 테헤란로 123',
      startDate: '2020-01-01',
      status: 'active',
    }

    const result = { ...defaultData, ...data }
    mockOCRStrategy.extractBusinessRegistration.mockResolvedValueOnce(result)
    mockOCRService.processBusinessRegistration.mockResolvedValueOnce(result)
  },

  // 추출 실패
  failure: (error: Error = new Error('OCR extraction failed')) => {
    mockOCRStrategy.extractBusinessRegistration.mockRejectedValueOnce(error)
    mockOCRService.processBusinessRegistration.mockRejectedValueOnce(error)
  },

  // 품질이 낮은 이미지
  lowQuality: () => {
    const result = {
      businessName: '테스트 주식회사',
      businessNumber: '123-45-6789?', // 일부 텍스트 인식 불가
      representativeName: '홍길동',
      businessType: 'IT서비스',
      businessCategory: '소프트웨어개발',
      address: '서울시 강남구',
      startDate: '2020-01-01',
      status: 'active',
      confidence: 0.6, // 낮은 신뢰도
    }
    mockOCRStrategy.extractBusinessRegistration.mockResolvedValueOnce(result)
    mockOCRService.processBusinessRegistration.mockResolvedValueOnce(result)
  },

  // 빈 결과
  empty: () => {
    const result = {
      businessName: '',
      businessNumber: '',
      representativeName: '',
      businessType: '',
      businessCategory: '',
      address: '',
      startDate: '',
      status: '',
    }
    mockOCRStrategy.extractBusinessRegistration.mockResolvedValueOnce(result)
    mockOCRService.processBusinessRegistration.mockResolvedValueOnce(result)
  },

  // 부분적으로만 추출된 결과
  partial: () => {
    const result = {
      businessName: '테스트 주식회사',
      businessNumber: '123-45-67890',
      representativeName: '홍길동',
      businessType: '', // 누락된 필드
      businessCategory: '', // 누락된 필드
      address: '서울시 강남구 테헤란로 123',
      startDate: '', // 누락된 필드
      status: 'active',
    }
    mockOCRStrategy.extractBusinessRegistration.mockResolvedValueOnce(result)
    mockOCRService.processBusinessRegistration.mockResolvedValueOnce(result)
  },
}

/**
 * 통장사본 OCR Mock 설정
 */
export const setupBankAccountMocks = {
  // 성공적인 추출
  success: (data: any = {}) => {
    const defaultData = {
      bankName: '국민은행',
      accountNumber: '123456-78-901234',
      accountHolder: '테스트 주식회사',
      branchName: '강남지점',
    }

    const result = { ...defaultData, ...data }
    mockOCRStrategy.extractBankAccount.mockResolvedValueOnce(result)
    mockOCRService.processBankAccount.mockResolvedValueOnce(result)
  },

  // 추출 실패
  failure: (error: Error = new Error('Bank account OCR extraction failed')) => {
    mockOCRStrategy.extractBankAccount.mockRejectedValueOnce(error)
    mockOCRService.processBankAccount.mockRejectedValueOnce(error)
  },

  // 품질이 낮은 이미지
  lowQuality: () => {
    const result = {
      bankName: '국민은행',
      accountNumber: '123456-78-90123?', // 일부 텍스트 인식 불가
      accountHolder: '테스트 주식회사',
      branchName: '강남지점',
      confidence: 0.5, // 낮은 신뢰도
    }
    mockOCRStrategy.extractBankAccount.mockResolvedValueOnce(result)
    mockOCRService.processBankAccount.mockResolvedValueOnce(result)
  },

  // 빈 결과
  empty: () => {
    const result = {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      branchName: '',
    }
    mockOCRStrategy.extractBankAccount.mockResolvedValueOnce(result)
    mockOCRService.processBankAccount.mockResolvedValueOnce(result)
  },

  // 부분적으로만 추출된 결과
  partial: () => {
    const result = {
      bankName: '국민은행',
      accountNumber: '123456-78-901234',
      accountHolder: '', // 누락된 필드
      branchName: '강남지점',
    }
    mockOCRStrategy.extractBankAccount.mockResolvedValueOnce(result)
    mockOCRService.processBankAccount.mockResolvedValueOnce(result)
  },
}

/**
 * OpenAI Vision Mock 설정
 */
export const setupOpenAIVisionMocks = {
  // 성공적인 응답
  success: (response: any = {}) => {
    const defaultResponse = {
      businessName: '테스트 주식회사',
      businessNumber: '123-45-67890',
      representativeName: '홍길동',
      businessType: 'IT서비스',
      businessCategory: '소프트웨어개발',
      address: '서울시 강남구 테헤란로 123',
      startDate: '2020-01-01',
      status: 'active',
    }

    const result = { ...defaultResponse, ...response }
    mockOpenAIVision.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(result),
          },
        },
      ],
    })
  },

  // API 오류
  apiError: (error: Error = new Error('OpenAI API error')) => {
    mockOpenAIVision.chat.completions.create.mockRejectedValueOnce(error)
  },

  // 잘못된 응답 형식
  invalidResponse: () => {
    mockOpenAIVision.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'Invalid JSON response',
          },
        },
      ],
    })
  },

  // 빈 응답
  emptyResponse: () => {
    mockOpenAIVision.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: '',
          },
        },
      ],
    })
  },

  // 네트워크 오류
  networkError: () => {
    const error = new Error('Network error')
    error.name = 'NetworkError'
    mockOpenAIVision.chat.completions.create.mockRejectedValueOnce(error)
  },

  // 인증 오류
  authError: () => {
    const error = new Error('Invalid API key')
    error.name = 'AuthenticationError'
    mockOpenAIVision.chat.completions.create.mockRejectedValueOnce(error)
  },

  // 요청 제한
  rateLimit: () => {
    const error = new Error('Rate limit exceeded')
    error.name = 'RateLimitError'
    mockOpenAIVision.chat.completions.create.mockRejectedValueOnce(error)
  },
}

/**
 * AWS Textract Mock 설정
 */
export const setupTextractMocks = {
  // 성공적인 분석
  success: (blocks: any[] = []) => {
    const defaultBlocks = [
      {
        BlockType: 'LINE',
        Text: '테스트 주식회사',
        Confidence: 99.5,
      },
      {
        BlockType: 'LINE',
        Text: '123-45-67890',
        Confidence: 98.2,
      },
      {
        BlockType: 'LINE',
        Text: '홍길동',
        Confidence: 97.8,
      },
    ]

    const result = blocks.length > 0 ? blocks : defaultBlocks
    mockTextractClient.analyzeDocument.mockResolvedValueOnce({
      Blocks: result,
    })
    mockTextractClient.detectDocumentText.mockResolvedValueOnce({
      Blocks: result,
    })
  },

  // 분석 실패
  failure: (error: Error = new Error('Textract analysis failed')) => {
    mockTextractClient.analyzeDocument.mockRejectedValueOnce(error)
    mockTextractClient.detectDocumentText.mockRejectedValueOnce(error)
  },

  // 빈 결과
  empty: () => {
    mockTextractClient.analyzeDocument.mockResolvedValueOnce({
      Blocks: [],
    })
    mockTextractClient.detectDocumentText.mockResolvedValueOnce({
      Blocks: [],
    })
  },

  // 낮은 신뢰도 결과
  lowConfidence: () => {
    const blocks = [
      {
        BlockType: 'LINE',
        Text: '테스트 주식회사',
        Confidence: 45.2, // 낮은 신뢰도
      },
      {
        BlockType: 'LINE',
        Text: '123-45-67890',
        Confidence: 38.7, // 낮은 신뢰도
      },
    ]
    mockTextractClient.analyzeDocument.mockResolvedValueOnce({
      Blocks: blocks,
    })
  },

  // 권한 오류
  accessDenied: () => {
    const error = new Error('Access denied')
    error.name = 'AccessDenied'
    mockTextractClient.analyzeDocument.mockRejectedValueOnce(error)
  },

  // 파일 형식 오류
  invalidFormat: () => {
    const error = new Error('Invalid document format')
    error.name = 'InvalidDocumentFormat'
    mockTextractClient.analyzeDocument.mockRejectedValueOnce(error)
  },
}

/**
 * OCR 전략 Mock 설정
 */
export const setupOCRStrategyMocks = {
  // OpenAI 전략
  openAI: () => {
    setupOpenAIVisionMocks.success()
  },

  // Textract 전략
  textract: () => {
    setupTextractMocks.success()
  },

  // 전략 변경
  switchStrategy: (strategyName: string) => {
    mockOCRService.setStrategy.mockImplementationOnce((strategy: any) => {
      if (strategyName === 'openai') {
        mockOCRService.getStrategy.mockReturnValueOnce('OpenAI')
      } else if (strategyName === 'textract') {
        mockOCRService.getStrategy.mockReturnValueOnce('Textract')
      }
    })
  },
}

/**
 * 파일 처리 Mock 설정
 */
export const setupFileProcessingMocks = {
  // 유효한 PDF 파일
  validPdf: () => {
    const mockBuffer = Buffer.from('PDF content')
    return {
      buffer: mockBuffer,
      mimeType: 'application/pdf',
      size: mockBuffer.length,
    }
  },

  // 유효한 이미지 파일
  validImage: () => {
    const mockBuffer = Buffer.from('Image content')
    return {
      buffer: mockBuffer,
      mimeType: 'image/jpeg',
      size: mockBuffer.length,
    }
  },

  // 잘못된 파일 형식
  invalidFormat: () => {
    const mockBuffer = Buffer.from('Invalid content')
    return {
      buffer: mockBuffer,
      mimeType: 'text/plain',
      size: mockBuffer.length,
    }
  },

  // 빈 파일
  emptyFile: () => {
    const mockBuffer = Buffer.from('')
    return {
      buffer: mockBuffer,
      mimeType: 'application/pdf',
      size: 0,
    }
  },

  // 너무 큰 파일
  largeFile: () => {
    const mockBuffer = Buffer.alloc(10 * 1024 * 1024) // 10MB
    return {
      buffer: mockBuffer,
      mimeType: 'application/pdf',
      size: mockBuffer.length,
    }
  },
}

/**
 * 에러 시나리오 Mock 설정
 */
export const setupOCRErrorMocks = {
  // 파일 읽기 오류
  fileReadError: () => {
    const error = new Error('File read error')
    error.name = 'FileReadError'
    return error
  },

  // 메모리 부족
  outOfMemory: () => {
    const error = new Error('Out of memory')
    error.name = 'OutOfMemoryError'
    return error
  },

  // 타임아웃
  timeout: () => {
    const error = new Error('OCR processing timeout')
    error.name = 'TimeoutError'
    return error
  },

  // 서비스 사용 불가
  serviceUnavailable: () => {
    const error = new Error('OCR service unavailable')
    error.name = 'ServiceUnavailable'
    return error
  },

  // 비용 초과
  quotaExceeded: () => {
    const error = new Error('OCR quota exceeded')
    error.name = 'QuotaExceeded'
    return error
  },
}

/**
 * OCR 모듈 Mock
 */
export const mockOCRModule = () => {
  const mockStrategy = {
    extractBusinessRegistration: vi.fn(),
    extractBankAccount: vi.fn(),
  }

  const mockService = {
    processBusinessRegistration: vi.fn(),
    processBankAccount: vi.fn(),
    getStrategy: vi.fn(),
    setStrategy: vi.fn(),
  }

  return {
    OCRService: vi.fn(() => mockService),
    OpenAIVisionOCRStrategy: vi.fn(() => mockStrategy),
    TextractOCRStrategy: vi.fn(() => mockStrategy),
    mockStrategy,
    mockService,
  }
}

/**
 * 모든 Mock 초기화
 */
export const resetOCRMocks = () => {
  mockOCRStrategy.extractBusinessRegistration.mockClear()
  mockOCRStrategy.extractBankAccount.mockClear()
  mockOCRService.processBusinessRegistration.mockClear()
  mockOCRService.processBankAccount.mockClear()
  mockOCRService.getStrategy.mockClear()
  mockOCRService.setStrategy.mockClear()
  mockOpenAIVision.chat.completions.create.mockClear()
  mockTextractClient.analyzeDocument.mockClear()
  mockTextractClient.detectDocumentText.mockClear()

  // 기본 설정으로 리셋
  setupOCRMock()
}

/**
 * Mock 호출 검증 헬퍼
 */
export const verifyOCRMocks = {
  // 사업자등록증 OCR이 호출되었는지 확인
  wasBusinessRegistrationCalled: () => {
    return (
      mockOCRStrategy.extractBusinessRegistration.mock.calls.length > 0 ||
      mockOCRService.processBusinessRegistration.mock.calls.length > 0
    )
  },

  // 통장사본 OCR이 호출되었는지 확인
  wasBankAccountCalled: () => {
    return (
      mockOCRStrategy.extractBankAccount.mock.calls.length > 0 ||
      mockOCRService.processBankAccount.mock.calls.length > 0
    )
  },

  // OpenAI Vision이 호출되었는지 확인
  wasOpenAIVisionCalled: () => {
    return mockOpenAIVision.chat.completions.create.mock.calls.length > 0
  },

  // Textract가 호출되었는지 확인
  wasTextractCalled: () => {
    return (
      mockTextractClient.analyzeDocument.mock.calls.length > 0 ||
      mockTextractClient.detectDocumentText.mock.calls.length > 0
    )
  },

  // 전략이 변경되었는지 확인
  wasStrategyChanged: () => {
    return mockOCRService.setStrategy.mock.calls.length > 0
  },

  // 호출 횟수 확인
  getCallCount: () => {
    return {
      businessRegistration: mockOCRStrategy.extractBusinessRegistration.mock.calls.length,
      bankAccount: mockOCRStrategy.extractBankAccount.mock.calls.length,
      openAI: mockOpenAIVision.chat.completions.create.mock.calls.length,
      textract: mockTextractClient.analyzeDocument.mock.calls.length,
    }
  },

  // 마지막 호출된 전략 확인
  getLastStrategy: () => {
    const calls = mockOCRService.setStrategy.mock.calls
    return calls.length > 0 ? calls[calls.length - 1][0] : null
  },
}

// 기본 설정 적용
setupOCRMock()
