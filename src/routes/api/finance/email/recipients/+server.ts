import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { emailService } from '$lib/finance/services/email/email-service'
import type { EmailRecipient } from '$lib/finance/services/email/email-service'

// 수신자 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const role = url.searchParams.get('role')
    const isActive = url.searchParams.get('isActive')

    let recipients = emailService.getRecipients()

    // 필터링
    if (role) {
      recipients = recipients.filter((r) => r.role === role)
    }

    if (isActive !== null) {
      recipients = recipients.filter((r) => r.isActive === (isActive === 'true'))
    }

    return json({
      success: true,
      data: recipients,
      message: `${recipients.length}명의 수신자를 조회했습니다.`,
    })
  } catch (error) {
    console.error('수신자 목록 조회 실패:', error)
    return json(
      {
        success: false,
        data: [],
        error: '수신자 목록을 조회할 수 없습니다.',
      },
      { status: 500 },
    )
  }
}

// 새 수신자 추가
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: Omit<EmailRecipient, 'id'> = await request.json()

    // 필수 필드 검증
    if (!body.name || !body.email || !body.role) {
      return json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 },
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return json(
        {
          success: false,
          error: '유효하지 않은 이메일 형식입니다.',
        },
        { status: 400 },
      )
    }

    // 새 수신자 생성
    const newRecipient: EmailRecipient = {
      id: `recipient_${Date.now()}`,
      name: body.name,
      email: body.email,
      role: body.role,
      isActive: body.isActive ?? true,
      preferences: body.preferences ?? {
        dailyReport: true,
        weeklyReport: true,
        monthlyReport: true,
        budgetAlerts: true,
        urgentAlerts: true,
      },
    }

    emailService.addRecipient(newRecipient)

    return json({
      success: true,
      data: newRecipient,
      message: '수신자가 성공적으로 추가되었습니다.',
    })
  } catch (error) {
    console.error('수신자 추가 실패:', error)
    return json(
      {
        success: false,
        error: '수신자 추가에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
