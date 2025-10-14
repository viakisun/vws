import { vi } from 'vitest'

/**
 * S3 Mock 라이브러리
 * AWS S3 서비스 Mock 구현
 */

// Mock S3 Client
export const mockS3Client = {
  send: vi.fn(),
  getObject: vi.fn(),
  putObject: vi.fn(),
  deleteObject: vi.fn(),
  headObject: vi.fn(),
  listObjectsV2: vi.fn(),
}

// Mock S3 Commands
export const mockS3Commands = {
  GetObjectCommand: vi.fn(),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  HeadObjectCommand: vi.fn(),
  ListObjectsV2Command: vi.fn(),
}

// Mock getSignedUrl 함수
export const mockGetSignedUrl = vi.fn()

/**
 * S3 Mock 설정
 */
export const setupS3Mock = () => {
  // 기본 성공 응답 설정
  mockS3Client.send.mockResolvedValue({
    Body: {
      transformToString: vi.fn().mockResolvedValue('mock file content'),
    },
    ContentType: 'application/pdf',
    ContentLength: 1024,
    LastModified: new Date(),
    ETag: '"mock-etag"',
  })

  mockGetSignedUrl.mockResolvedValue('https://mock-presigned-url.com')

  // Command 생성자 Mock
  mockS3Commands.GetObjectCommand.mockImplementation((params) => ({ params }))
  mockS3Commands.PutObjectCommand.mockImplementation((params) => ({ params }))
  mockS3Commands.DeleteObjectCommand.mockImplementation((params) => ({ params }))
  mockS3Commands.HeadObjectCommand.mockImplementation((params) => ({ params }))
  mockS3Commands.ListObjectsV2Command.mockImplementation((params) => ({ params }))

  return {
    mockS3Client,
    mockS3Commands,
    mockGetSignedUrl,
  }
}

/**
 * 파일 업로드 Mock 설정
 */
export const setupUploadMocks = {
  // 성공적인 업로드
  success: (key: string = 'test-file.pdf') => {
    mockS3Client.send.mockResolvedValueOnce({
      ETag: '"mock-etag"',
      VersionId: 'mock-version-id',
    })
    mockGetSignedUrl.mockResolvedValueOnce(`https://mock-upload-url.com/${key}`)
  },

  // 업로드 실패
  failure: (error: Error = new Error('Upload failed')) => {
    mockS3Client.send.mockRejectedValueOnce(error)
    mockGetSignedUrl.mockRejectedValueOnce(error)
  },

  // 파일 크기 초과
  fileTooLarge: () => {
    const error = new Error('File too large')
    error.name = 'EntityTooLarge'
    mockS3Client.send.mockRejectedValueOnce(error)
  },

  // 권한 오류
  accessDenied: () => {
    const error = new Error('Access denied')
    error.name = 'AccessDenied'
    mockS3Client.send.mockRejectedValueOnce(error)
  },

  // 네트워크 오류
  networkError: () => {
    const error = new Error('Network error')
    error.name = 'NetworkingError'
    mockS3Client.send.mockRejectedValueOnce(error)
  },
}

/**
 * 파일 다운로드 Mock 설정
 */
export const setupDownloadMocks = {
  // 성공적인 다운로드
  success: (content: string = 'mock file content', contentType: string = 'application/pdf') => {
    mockS3Client.send.mockResolvedValueOnce({
      Body: {
        transformToString: vi.fn().mockResolvedValue(content),
      },
      ContentType: contentType,
      ContentLength: content.length,
      LastModified: new Date(),
      ETag: '"mock-etag"',
    })
    mockGetSignedUrl.mockResolvedValueOnce('https://mock-download-url.com')
  },

  // 파일 없음
  notFound: () => {
    const error = new Error('File not found')
    error.name = 'NoSuchKey'
    mockS3Client.send.mockRejectedValueOnce(error)
  },

  // 다운로드 실패
  failure: (error: Error = new Error('Download failed')) => {
    mockS3Client.send.mockRejectedValueOnce(error)
  },

  // 권한 오류
  accessDenied: () => {
    const error = new Error('Access denied')
    error.name = 'AccessDenied'
    mockS3Client.send.mockRejectedValueOnce(error)
  },
}

/**
 * 파일 삭제 Mock 설정
 */
export const setupDeleteMocks = {
  // 성공적인 삭제
  success: () => {
    mockS3Client.send.mockResolvedValueOnce({
      DeleteMarker: false,
      VersionId: 'mock-version-id',
    })
  },

  // 삭제 실패
  failure: (error: Error = new Error('Delete failed')) => {
    mockS3Client.send.mockRejectedValueOnce(error)
  },

  // 파일 없음
  notFound: () => {
    const error = new Error('File not found')
    error.name = 'NoSuchKey'
    mockS3Client.send.mockRejectedValueOnce(error)
  },

  // 권한 오류
  accessDenied: () => {
    const error = new Error('Access denied')
    error.name = 'AccessDenied'
    mockS3Client.send.mockRejectedValueOnce(error)
  },
}

/**
 * 파일 존재 확인 Mock 설정
 */
export const setupHeadObjectMocks = {
  // 파일 존재
  exists: (contentType: string = 'application/pdf', contentLength: number = 1024) => {
    mockS3Client.send.mockResolvedValueOnce({
      ContentType: contentType,
      ContentLength: contentLength,
      LastModified: new Date(),
      ETag: '"mock-etag"',
    })
  },

  // 파일 없음
  notExists: () => {
    const error = new Error('File not found')
    error.name = 'NotFound'
    mockS3Client.send.mockRejectedValueOnce(error)
  },

  // 권한 오류
  accessDenied: () => {
    const error = new Error('Access denied')
    error.name = 'AccessDenied'
    mockS3Client.send.mockRejectedValueOnce(error)
  },
}

/**
 * 파일 목록 조회 Mock 설정
 */
export const setupListObjectsMocks = {
  // 파일 목록 조회 성공
  success: (objects: any[] = []) => {
    mockS3Client.send.mockResolvedValueOnce({
      Contents: objects,
      IsTruncated: false,
      KeyCount: objects.length,
    })
  },

  // 빈 목록
  empty: () => {
    mockS3Client.send.mockResolvedValueOnce({
      Contents: [],
      IsTruncated: false,
      KeyCount: 0,
    })
  },

  // 페이지네이션 (첫 번째 페이지)
  paginatedFirst: (objects: any[], hasMore: boolean = true) => {
    mockS3Client.send.mockResolvedValueOnce({
      Contents: objects,
      IsTruncated: hasMore,
      NextContinuationToken: hasMore ? 'next-token' : undefined,
      KeyCount: objects.length,
    })
  },

  // 페이지네이션 (마지막 페이지)
  paginatedLast: (objects: any[]) => {
    mockS3Client.send.mockResolvedValueOnce({
      Contents: objects,
      IsTruncated: false,
      NextContinuationToken: undefined,
      KeyCount: objects.length,
    })
  },

  // 조회 실패
  failure: (error: Error = new Error('List objects failed')) => {
    mockS3Client.send.mockRejectedValueOnce(error)
  },
}

/**
 * Presigned URL Mock 설정
 */
export const setupPresignedUrlMocks = {
  // 업로드 URL 생성 성공
  uploadSuccess: (url: string = 'https://mock-upload-url.com') => {
    mockGetSignedUrl.mockResolvedValueOnce(url)
  },

  // 다운로드 URL 생성 성공
  downloadSuccess: (url: string = 'https://mock-download-url.com') => {
    mockGetSignedUrl.mockResolvedValueOnce(url)
  },

  // URL 생성 실패
  failure: (error: Error = new Error('URL generation failed')) => {
    mockGetSignedUrl.mockRejectedValueOnce(error)
  },

  // 만료된 URL
  expired: (url: string = 'https://mock-expired-url.com') => {
    mockGetSignedUrl.mockResolvedValueOnce(url)
  },
}

/**
 * CRM 문서 관련 Mock 설정
 */
export const setupCrmDocumentMocks = {
  // 사업자등록증 업로드 성공
  businessRegistrationUpload: () => {
    setupUploadMocks.success('crm/customer-123/business_registration.pdf')
    setupPresignedUrlMocks.uploadSuccess()
  },

  // 통장사본 업로드 성공
  bankAccountUpload: () => {
    setupUploadMocks.success('crm/customer-123/bank_account.pdf')
    setupPresignedUrlMocks.uploadSuccess()
  },

  // 문서 다운로드 성공
  documentDownload: (content: string = 'PDF content') => {
    setupDownloadMocks.success(content, 'application/pdf')
    setupPresignedUrlMocks.downloadSuccess()
  },

  // 문서 삭제 성공
  documentDelete: () => {
    setupDeleteMocks.success()
  },

  // 문서 존재 확인
  documentExists: (contentType: string = 'application/pdf') => {
    setupHeadObjectMocks.exists(contentType)
  },

  // 문서 없음
  documentNotExists: () => {
    setupHeadObjectMocks.notExists()
  },
}

/**
 * R&D 증빙 자료 관련 Mock 설정
 */
export const setupRdEvidenceMocks = {
  // 증빙 자료 업로드 성공
  evidenceUpload: (projectId: string, evidenceId: string) => {
    const key = `rd/projects/${projectId}/evidence/${evidenceId}/document.pdf`
    setupUploadMocks.success(key)
    setupPresignedUrlMocks.uploadSuccess()
  },

  // 증빙 자료 다운로드 성공
  evidenceDownload: (projectId: string, evidenceId: string) => {
    const key = `rd/projects/${projectId}/evidence/${evidenceId}/document.pdf`
    setupDownloadMocks.success('Evidence document content', 'application/pdf')
    setupPresignedUrlMocks.downloadSuccess()
  },

  // 증빙 자료 삭제 성공
  evidenceDelete: () => {
    setupDeleteMocks.success()
  },

  // 증빙 자료 목록 조회
  evidenceList: (projectId: string, documents: any[] = []) => {
    const objects = documents.map((doc) => ({
      Key: `rd/projects/${projectId}/evidence/${doc.id}/${doc.filename}`,
      Size: doc.size,
      LastModified: new Date(doc.uploadedAt),
      ETag: `"${doc.etag}"`,
    }))
    setupListObjectsMocks.success(objects)
  },
}

/**
 * 에러 시나리오 Mock 설정
 */
export const setupS3ErrorMocks = {
  // AWS 자격 증명 오류
  credentialsError: () => {
    const error = new Error('Invalid credentials')
    error.name = 'CredentialsError'
    mockS3Client.send.mockRejectedValueOnce(error)
    mockGetSignedUrl.mockRejectedValueOnce(error)
  },

  // 버킷 없음
  bucketNotFound: () => {
    const error = new Error('Bucket not found')
    error.name = 'NoSuchBucket'
    mockS3Client.send.mockRejectedValueOnce(error)
  },

  // 지역 오류
  regionError: () => {
    const error = new Error('Invalid region')
    error.name = 'InvalidRegion'
    mockS3Client.send.mockRejectedValueOnce(error)
  },

  // 서비스 오류
  serviceError: () => {
    const error = new Error('S3 service error')
    error.name = 'ServiceError'
    mockS3Client.send.mockRejectedValueOnce(error)
  },

  // 요청 제한
  rateLimit: () => {
    const error = new Error('Rate limit exceeded')
    error.name = 'SlowDown'
    mockS3Client.send.mockRejectedValueOnce(error)
  },
}

/**
 * S3 모듈 Mock
 */
export const mockS3Module = () => {
  const mockS3ClientInstance = {
    send: vi.fn(),
  }

  const mockGetSignedUrlInstance = vi.fn()

  return {
    S3Client: vi.fn(() => mockS3ClientInstance),
    GetObjectCommand: vi.fn(),
    PutObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    HeadObjectCommand: vi.fn(),
    ListObjectsV2Command: vi.fn(),
    getSignedUrl: mockGetSignedUrlInstance,
    mockS3Client: mockS3ClientInstance,
    mockGetSignedUrl: mockGetSignedUrlInstance,
  }
}

/**
 * 모든 Mock 초기화
 */
export const resetS3Mocks = () => {
  mockS3Client.send.mockClear()
  mockS3Client.getObject.mockClear()
  mockS3Client.putObject.mockClear()
  mockS3Client.deleteObject.mockClear()
  mockS3Client.headObject.mockClear()
  mockS3Client.listObjectsV2.mockClear()

  Object.values(mockS3Commands).forEach((command) => {
    command.mockClear()
  })

  mockGetSignedUrl.mockClear()

  // 기본 설정으로 리셋
  setupS3Mock()
}

/**
 * Mock 호출 검증 헬퍼
 */
export const verifyS3Mocks = {
  // 특정 명령이 호출되었는지 확인
  wasCommandCalled: (commandType: string) => {
    const command = mockS3Commands[commandType as keyof typeof mockS3Commands]
    return command && command.mock.calls.length > 0
  },

  // S3 클라이언트가 호출되었는지 확인
  wasS3ClientCalled: () => {
    return mockS3Client.send.mock.calls.length > 0
  },

  // Presigned URL이 생성되었는지 확인
  wasPresignedUrlGenerated: () => {
    return mockGetSignedUrl.mock.calls.length > 0
  },

  // 특정 버킷에 대한 작업이 수행되었는지 확인
  wasBucketAccessed: (bucketName: string) => {
    const calls = mockS3Client.send.mock.calls
    return calls.some((call) => {
      const command = call[0]
      return command.params && command.params.Bucket === bucketName
    })
  },

  // 특정 키에 대한 작업이 수행되었는지 확인
  wasKeyAccessed: (key: string) => {
    const calls = mockS3Client.send.mock.calls
    return calls.some((call) => {
      const command = call[0]
      return command.params && command.params.Key === key
    })
  },

  // 호출 횟수 확인
  getCallCount: () => {
    return mockS3Client.send.mock.calls.length
  },

  // 마지막 호출된 명령 확인
  getLastCommand: () => {
    const calls = mockS3Client.send.mock.calls
    return calls.length > 0 ? calls[calls.length - 1][0] : null
  },
}

// 기본 설정 적용
setupS3Mock()
