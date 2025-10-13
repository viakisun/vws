import { vi } from 'vitest'

/**
 * Email Mock 라이브러리
 * 이메일 서비스 Mock 구현
 */

// Mock Email Service
export const mockEmailService = {
  send: vi.fn(),
  sendTemplate: vi.fn(),
  sendBulk: vi.fn(),
  validateEmail: vi.fn(),
}

// Mock SMTP Client
export const mockSMTPClient = {
  send: vi.fn(),
  verify: vi.fn(),
  close: vi.fn(),
}

// Mock Email Templates
export const mockEmailTemplates = {
  welcome: vi.fn(),
  passwordReset: vi.fn(),
  notification: vi.fn(),
  report: vi.fn(),
}

/**
 * Email Mock 설정
 */
export const setupEmailMock = () => {
  // 기본 성공 응답 설정
  mockEmailService.send.mockResolvedValue({
    messageId: 'mock-message-id',
    accepted: ['recipient@example.com'],
    rejected: [],
    response: '250 Message accepted',
  })

  mockEmailService.sendTemplate.mockResolvedValue({
    messageId: 'mock-template-message-id',
    accepted: ['recipient@example.com'],
    rejected: [],
    response: '250 Template message sent',
  })

  mockEmailService.sendBulk.mockResolvedValue({
    messageId: 'mock-bulk-message-id',
    accepted: ['recipient1@example.com', 'recipient2@example.com'],
    rejected: [],
    response: '250 Bulk message sent',
  })

  mockEmailService.validateEmail.mockResolvedValue({
    valid: true,
    reason: 'Valid email address',
  })

  // SMTP Client Mock 설정
  mockSMTPClient.send.mockResolvedValue({
    messageId: 'smtp-message-id',
    response: '250 Message sent successfully',
  })

  mockSMTPClient.verify.mockResolvedValue(true)
  mockSMTPClient.close.mockResolvedValue(undefined)

  // Email Templates Mock 설정
  mockEmailTemplates.welcome.mockReturnValue({
    subject: '환영합니다!',
    html: '<h1>환영합니다!</h1><p>계정이 생성되었습니다.</p>',
    text: '환영합니다!\n계정이 생성되었습니다.',
  })

  mockEmailTemplates.passwordReset.mockReturnValue({
    subject: '비밀번호 재설정',
    html: '<h1>비밀번호 재설정</h1><p>링크를 클릭하여 비밀번호를 재설정하세요.</p>',
    text: '비밀번호 재설정\n링크를 클릭하여 비밀번호를 재설정하세요.',
  })

  mockEmailTemplates.notification.mockReturnValue({
    subject: '알림',
    html: '<h1>알림</h1><p>새로운 알림이 있습니다.</p>',
    text: '알림\n새로운 알림이 있습니다.',
  })

  mockEmailTemplates.report.mockReturnValue({
    subject: '보고서',
    html: '<h1>보고서</h1><p>월간 보고서입니다.</p>',
    text: '보고서\n월간 보고서입니다.',
  })

  return {
    mockEmailService,
    mockSMTPClient,
    mockEmailTemplates,
  }
}

/**
 * 이메일 전송 Mock 설정
 */
export const setupSendEmailMocks = {
  // 성공적인 전송
  success: (messageId: string = 'mock-message-id') => {
    mockEmailService.send.mockResolvedValueOnce({
      messageId,
      accepted: ['recipient@example.com'],
      rejected: [],
      response: '250 Message accepted',
    })
  },

  // 전송 실패
  failure: (error: Error = new Error('Email send failed')) => {
    mockEmailService.send.mockRejectedValueOnce(error)
  },

  // 일부 수신자 거부
  partialRejection: () => {
    mockEmailService.send.mockResolvedValueOnce({
      messageId: 'mock-message-id',
      accepted: ['valid@example.com'],
      rejected: ['invalid@example.com'],
      response: '250 Message partially sent',
    })
  },

  // 모든 수신자 거부
  totalRejection: () => {
    mockEmailService.send.mockResolvedValueOnce({
      messageId: 'mock-message-id',
      accepted: [],
      rejected: ['invalid1@example.com', 'invalid2@example.com'],
      response: '550 All recipients rejected',
    })
  },

  // SMTP 서버 오류
  smtpError: () => {
    const error = new Error('SMTP server error')
    error.name = 'SMTPError'
    mockEmailService.send.mockRejectedValueOnce(error)
  },

  // 네트워크 오류
  networkError: () => {
    const error = new Error('Network error')
    error.name = 'NetworkError'
    mockEmailService.send.mockRejectedValueOnce(error)
  },

  // 인증 오류
  authError: () => {
    const error = new Error('Authentication failed')
    error.name = 'AuthError'
    mockEmailService.send.mockRejectedValueOnce(error)
  },
}

/**
 * 템플릿 이메일 Mock 설정
 */
export const setupTemplateEmailMocks = {
  // 환영 이메일
  welcome: (userName: string = '사용자') => {
    const template = mockEmailTemplates.welcome()
    mockEmailService.sendTemplate.mockResolvedValueOnce({
      messageId: 'welcome-message-id',
      accepted: ['user@example.com'],
      rejected: [],
      response: '250 Welcome email sent',
    })
    return template
  },

  // 비밀번호 재설정 이메일
  passwordReset: (resetLink: string = 'https://example.com/reset') => {
    const template = mockEmailTemplates.passwordReset()
    mockEmailService.sendTemplate.mockResolvedValueOnce({
      messageId: 'reset-message-id',
      accepted: ['user@example.com'],
      rejected: [],
      response: '250 Password reset email sent',
    })
    return template
  },

  // 알림 이메일
  notification: (message: string = '새로운 알림') => {
    const template = mockEmailTemplates.notification()
    mockEmailService.sendTemplate.mockResolvedValueOnce({
      messageId: 'notification-message-id',
      accepted: ['user@example.com'],
      rejected: [],
      response: '250 Notification sent',
    })
    return template
  },

  // 보고서 이메일
  report: (reportData: any = {}) => {
    const template = mockEmailTemplates.report()
    mockEmailService.sendTemplate.mockResolvedValueOnce({
      messageId: 'report-message-id',
      accepted: ['manager@example.com'],
      rejected: [],
      response: '250 Report sent',
    })
    return template
  },

  // 템플릿 오류
  templateError: (error: Error = new Error('Template rendering failed')) => {
    mockEmailService.sendTemplate.mockRejectedValueOnce(error)
  },
}

/**
 * 대량 이메일 Mock 설정
 */
export const setupBulkEmailMocks = {
  // 성공적인 대량 전송
  success: (recipients: string[] = ['user1@example.com', 'user2@example.com']) => {
    mockEmailService.sendBulk.mockResolvedValueOnce({
      messageId: 'bulk-message-id',
      accepted: recipients,
      rejected: [],
      response: '250 Bulk email sent',
    })
  },

  // 일부 실패
  partialFailure: () => {
    mockEmailService.sendBulk.mockResolvedValueOnce({
      messageId: 'bulk-message-id',
      accepted: ['user1@example.com'],
      rejected: ['invalid@example.com', 'bounced@example.com'],
      response: '250 Bulk email partially sent',
    })
  },

  // 대량 전송 실패
  failure: (error: Error = new Error('Bulk email send failed')) => {
    mockEmailService.sendBulk.mockRejectedValueOnce(error)
  },

  // 수신자 제한 초과
  recipientLimitExceeded: () => {
    const error = new Error('Recipient limit exceeded')
    error.name = 'RecipientLimitError'
    mockEmailService.sendBulk.mockRejectedValueOnce(error)
  },
}

/**
 * 이메일 검증 Mock 설정
 */
export const setupEmailValidationMocks = {
  // 유효한 이메일
  valid: (email: string = 'user@example.com') => {
    mockEmailService.validateEmail.mockResolvedValueOnce({
      valid: true,
      reason: 'Valid email address',
      email,
    })
  },

  // 잘못된 형식
  invalidFormat: (email: string = 'invalid-email') => {
    mockEmailService.validateEmail.mockResolvedValueOnce({
      valid: false,
      reason: 'Invalid email format',
      email,
    })
  },

  // 도메인 오류
  invalidDomain: (email: string = 'user@invalid-domain.com') => {
    mockEmailService.validateEmail.mockResolvedValueOnce({
      valid: false,
      reason: 'Invalid domain',
      email,
    })
  },

  // MX 레코드 없음
  noMXRecord: (email: string = 'user@nomx.com') => {
    mockEmailService.validateEmail.mockResolvedValueOnce({
      valid: false,
      reason: 'No MX record found',
      email,
    })
  },

  // 검증 서비스 오류
  serviceError: (error: Error = new Error('Validation service error')) => {
    mockEmailService.validateEmail.mockRejectedValueOnce(error)
  },
}

/**
 * SMTP 연결 Mock 설정
 */
export const setupSMTPMocks = {
  // 성공적인 연결
  connectionSuccess: () => {
    mockSMTPClient.verify.mockResolvedValueOnce(true)
  },

  // 연결 실패
  connectionFailure: () => {
    mockSMTPClient.verify.mockRejectedValueOnce(new Error('SMTP connection failed'))
  },

  // 인증 실패
  authFailure: () => {
    const error = new Error('SMTP authentication failed')
    error.name = 'AuthError'
    mockSMTPClient.verify.mockRejectedValueOnce(error)
  },

  // 서버 응답 없음
  noResponse: () => {
    const error = new Error('SMTP server not responding')
    error.name = 'TimeoutError'
    mockSMTPClient.verify.mockRejectedValueOnce(error)
  },

  // 연결 종료
  close: () => {
    mockSMTPClient.close.mockResolvedValueOnce(undefined)
  },
}

/**
 * 이메일 템플릿 Mock 설정
 */
export const setupTemplateMocks = {
  // 환영 템플릿
  welcomeTemplate: (data: any = {}) => {
    const template = {
      subject: '환영합니다!',
      html: `<h1>환영합니다!</h1><p>안녕하세요 ${data.name || '사용자'}님, 계정이 생성되었습니다.</p>`,
      text: `환영합니다!\n안녕하세요 ${data.name || '사용자'}님, 계정이 생성되었습니다.`,
    }
    mockEmailTemplates.welcome.mockReturnValueOnce(template)
    return template
  },

  // 비밀번호 재설정 템플릿
  passwordResetTemplate: (data: any = {}) => {
    const template = {
      subject: '비밀번호 재설정',
      html: `<h1>비밀번호 재설정</h1><p>다음 링크를 클릭하여 비밀번호를 재설정하세요: <a href="${data.resetLink || '#'}">재설정</a></p>`,
      text: `비밀번호 재설정\n다음 링크를 클릭하여 비밀번호를 재설정하세요: ${data.resetLink || '#'}`,
    }
    mockEmailTemplates.passwordReset.mockReturnValueOnce(template)
    return template
  },

  // 알림 템플릿
  notificationTemplate: (data: any = {}) => {
    const template = {
      subject: data.subject || '알림',
      html: `<h1>${data.title || '알림'}</h1><p>${data.message || '새로운 알림이 있습니다.'}</p>`,
      text: `${data.title || '알림'}\n${data.message || '새로운 알림이 있습니다.'}`,
    }
    mockEmailTemplates.notification.mockReturnValueOnce(template)
    return template
  },

  // 보고서 템플릿
  reportTemplate: (data: any = {}) => {
    const template = {
      subject: `${data.period || '월간'} 보고서`,
      html: `<h1>${data.period || '월간'} 보고서</h1><p>${data.summary || '보고서 요약'}</p>`,
      text: `${data.period || '월간'} 보고서\n${data.summary || '보고서 요약'}`,
    }
    mockEmailTemplates.report.mockReturnValueOnce(template)
    return template
  },
}

/**
 * 에러 시나리오 Mock 설정
 */
export const setupEmailErrorMocks = {
  // 스팸 필터 차단
  spamFilter: () => {
    const error = new Error('Message blocked by spam filter')
    error.name = 'SpamFilterError'
    return error
  },

  // 첨부파일 크기 초과
  attachmentTooLarge: () => {
    const error = new Error('Attachment too large')
    error.name = 'AttachmentSizeError'
    return error
  },

  // 이메일 서버 과부하
  serverOverload: () => {
    const error = new Error('Email server overloaded')
    error.name = 'ServerOverloadError'
    return error
  },

  // 할당량 초과
  quotaExceeded: () => {
    const error = new Error('Email quota exceeded')
    error.name = 'QuotaExceededError'
    return error
  },

  // 템플릿 렌더링 오류
  templateRenderError: () => {
    const error = new Error('Template rendering failed')
    error.name = 'TemplateRenderError'
    return error
  },
}

/**
 * 이메일 모듈 Mock
 */
export const mockEmailModule = () => {
  const mockService = {
    send: vi.fn(),
    sendTemplate: vi.fn(),
    sendBulk: vi.fn(),
    validateEmail: vi.fn(),
  }

  const mockClient = {
    send: vi.fn(),
    verify: vi.fn(),
    close: vi.fn(),
  }

  const mockTemplates = {
    welcome: vi.fn(),
    passwordReset: vi.fn(),
    notification: vi.fn(),
    report: vi.fn(),
  }

  return {
    EmailService: vi.fn(() => mockService),
    SMTPClient: vi.fn(() => mockClient),
    EmailTemplates: mockTemplates,
    mockService,
    mockClient,
    mockTemplates,
  }
}

/**
 * 모든 Mock 초기화
 */
export const resetEmailMocks = () => {
  mockEmailService.send.mockClear()
  mockEmailService.sendTemplate.mockClear()
  mockEmailService.sendBulk.mockClear()
  mockEmailService.validateEmail.mockClear()
  mockSMTPClient.send.mockClear()
  mockSMTPClient.verify.mockClear()
  mockSMTPClient.close.mockClear()
  mockEmailTemplates.welcome.mockClear()
  mockEmailTemplates.passwordReset.mockClear()
  mockEmailTemplates.notification.mockClear()
  mockEmailTemplates.report.mockClear()

  // 기본 설정으로 리셋
  setupEmailMock()
}

/**
 * Mock 호출 검증 헬퍼
 */
export const verifyEmailMocks = {
  // 이메일 전송이 호출되었는지 확인
  wasEmailSent: () => {
    return mockEmailService.send.mock.calls.length > 0
  },

  // 템플릿 이메일이 전송되었는지 확인
  wasTemplateEmailSent: () => {
    return mockEmailService.sendTemplate.mock.calls.length > 0
  },

  // 대량 이메일이 전송되었는지 확인
  wasBulkEmailSent: () => {
    return mockEmailService.sendBulk.mock.calls.length > 0
  },

  // 이메일 검증이 호출되었는지 확인
  wasEmailValidated: () => {
    return mockEmailService.validateEmail.mock.calls.length > 0
  },

  // SMTP 연결이 확인되었는지 확인
  wasSMTPVerified: () => {
    return mockSMTPClient.verify.mock.calls.length > 0
  },

  // 특정 수신자에게 전송되었는지 확인
  wasSentToRecipient: (recipient: string) => {
    const sendCalls = mockEmailService.send.mock.calls
    const templateCalls = mockEmailService.sendTemplate.mock.calls
    const bulkCalls = mockEmailService.sendBulk.mock.calls

    return [...sendCalls, ...templateCalls, ...bulkCalls].some(call => {
      const options = call[0]
      return options.to && options.to.includes(recipient)
    })
  },

  // 특정 템플릿이 사용되었는지 확인
  wasTemplateUsed: (templateName: string) => {
    const calls = mockEmailService.sendTemplate.mock.calls
    return calls.some(call => {
      const options = call[0]
      return options.template === templateName
    })
  },

  // 호출 횟수 확인
  getCallCount: () => {
    return {
      send: mockEmailService.send.mock.calls.length,
      sendTemplate: mockEmailService.sendTemplate.mock.calls.length,
      sendBulk: mockEmailService.sendBulk.mock.calls.length,
      validate: mockEmailService.validateEmail.mock.calls.length,
      smtpVerify: mockSMTPClient.verify.mock.calls.length,
    }
  },

  // 마지막 전송된 이메일 확인
  getLastSentEmail: () => {
    const sendCalls = mockEmailService.send.mock.calls
    const templateCalls = mockEmailService.sendTemplate.mock.calls
    const allCalls = [...sendCalls, ...templateCalls]
    
    return allCalls.length > 0 ? allCalls[allCalls.length - 1][0] : null
  },
}

// 기본 설정 적용
setupEmailMock()
