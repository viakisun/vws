// 이메일 서비스 (개발 환경에서는 콘솔 로그로 대체)
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
}

export interface EmailRecipient {
  id: string
  name: string
  email: string
  role: 'ceo' | 'cfo' | 'accountant' | 'manager' | 'other'
  isActive: boolean
  preferences: {
    dailyReport: boolean
    weeklyReport: boolean
    monthlyReport: boolean
    budgetAlerts: boolean
    urgentAlerts: boolean
  }
}

export interface EmailData {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  htmlContent: string
  textContent: string
  attachments?: Array<{
    filename: string
    content: string
    contentType: string
  }>
}

export class EmailService {
  private templates: Map<string, EmailTemplate> = new Map()
  private recipients: Map<string, EmailRecipient> = new Map()

  constructor() {
    this.initializeTemplates()
    this.initializeRecipients()
  }

  // 이메일 발송 (개발 환경에서는 콘솔 로그)
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // 개발 환경에서는 콘솔에 로그 출력
      console.log('📧 이메일 발송 시뮬레이션:')
      console.log('받는 사람:', emailData.to.join(', '))
      if (emailData.cc) console.log('참조:', emailData.cc.join(', '))
      if (emailData.bcc) console.log('숨은 참조:', emailData.bcc.join(', '))
      console.log('제목:', emailData.subject)
      console.log('내용 미리보기:', emailData.textContent.substring(0, 200) + '...')

      if (emailData.attachments) {
        console.log('첨부파일:', emailData.attachments.map((a) => a.filename).join(', '))
      }

      console.log('---')

      // 실제 환경에서는 여기서 이메일 발송 API 호출
      // await this.sendViaSMTP(emailData)
      // 또는
      // await this.sendViaEmailService(emailData)

      return true
    } catch (error) {
      console.error('이메일 발송 실패:', error)
      return false
    }
  }

  // 템플릿으로 이메일 발송
  async sendTemplateEmail(
    templateId: string,
    recipients: string[],
    variables: Record<string, any>,
    attachments?: Array<{ filename: string; content: string; contentType: string }>,
  ): Promise<boolean> {
    const template = this.templates.get(templateId)
    if (!template) {
      console.error(`템플릿을 찾을 수 없습니다: ${templateId}`)
      return false
    }

    // 변수 치환
    const subject = this.replaceVariables(template.subject, variables)
    const htmlContent = this.replaceVariables(template.htmlContent, variables)
    const textContent = this.replaceVariables(template.textContent, variables)

    const emailData: EmailData = {
      to: recipients,
      subject,
      htmlContent,
      textContent,
      attachments,
    }

    return await this.sendEmail(emailData)
  }

  // 자동 리포트 발송
  async sendDailyReport(date: string, reportData: any): Promise<boolean> {
    const recipients = this.getActiveRecipients('dailyReport')
    if (recipients.length === 0) {
      console.log('일일 리포트 수신자가 없습니다.')
      return true
    }

    const variables = {
      date,
      currentBalance: reportData.currentBalance,
      todayIncome: reportData.todayIncome,
      todayExpense: reportData.todayExpense,
      netCashFlow: reportData.netCashFlow,
      accountCount: reportData.accountCount,
      transactionCount: reportData.transactionCount,
      alerts: reportData.alerts || [],
    }

    return await this.sendTemplateEmail('daily-report', recipients, variables)
  }

  // 예산 초과 알림 발송
  async sendBudgetAlert(budgetData: any): Promise<boolean> {
    const recipients = this.getActiveRecipients('budgetAlerts')
    if (recipients.length === 0) {
      console.log('예산 알림 수신자가 없습니다.')
      return true
    }

    const variables = {
      budgetName: budgetData.name,
      plannedAmount: budgetData.plannedAmount,
      actualAmount: budgetData.actualAmount,
      overAmount: budgetData.actualAmount - budgetData.plannedAmount,
      overPercentage: ((budgetData.actualAmount / budgetData.plannedAmount) * 100 - 100).toFixed(1),
      category: budgetData.category || '기타',
    }

    return await this.sendTemplateEmail('budget-alert', recipients, variables)
  }

  // 긴급 알림 발송
  async sendUrgentAlert(alertData: any): Promise<boolean> {
    const recipients = this.getActiveRecipients('urgentAlerts')
    if (recipients.length === 0) {
      console.log('긴급 알림 수신자가 없습니다.')
      return true
    }

    const variables = {
      alertType: alertData.type,
      severity: alertData.severity,
      title: alertData.title,
      message: alertData.message,
      timestamp: new Date().toLocaleString('ko-KR'),
    }

    return await this.sendTemplateEmail('urgent-alert', recipients, variables)
  }

  // 월간 종합 리포트 발송
  async sendMonthlyReport(month: string, reportData: any): Promise<boolean> {
    const recipients = this.getActiveRecipients('monthlyReport')
    if (recipients.length === 0) {
      console.log('월간 리포트 수신자가 없습니다.')
      return true
    }

    const variables = {
      month,
      totalIncome: reportData.totalIncome,
      totalExpense: reportData.totalExpense,
      netCashFlow: reportData.netCashFlow,
      accountSummaries: reportData.accountSummaries || [],
      budgetAnalyses: reportData.budgetAnalyses || [],
      forecasts: reportData.forecasts || [],
      healthScore: reportData.healthScore || 0,
    }

    return await this.sendTemplateEmail('monthly-report', recipients, variables)
  }

  // 수신자 관리
  addRecipient(recipient: EmailRecipient): void {
    this.recipients.set(recipient.id, recipient)
  }

  removeRecipient(recipientId: string): void {
    this.recipients.delete(recipientId)
  }

  getRecipients(): EmailRecipient[] {
    return Array.from(this.recipients.values())
  }

  getActiveRecipients(preference: keyof EmailRecipient['preferences']): string[] {
    return Array.from(this.recipients.values())
      .filter((recipient) => recipient.isActive && recipient.preferences[preference])
      .map((recipient) => recipient.email)
  }

  // 템플릿 관리
  addTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template)
  }

  getTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values())
  }

  // 변수 치환
  private replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      result = result.replace(new RegExp(placeholder, 'g'), String(value))
    }
    return result
  }

  // 템플릿 초기화
  private initializeTemplates(): void {
    // 일일 리포트 템플릿
    this.templates.set('daily-report', {
      id: 'daily-report',
      name: '일일 자금일보',
      subject: '[자금일보] {{date}} 일일 현금흐름 보고서',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📊 {{date}} 일일 자금일보</h2>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">💰 오늘의 현금흐름</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #059669;">₩{{todayIncome}}</div>
                <div style="color: #6b7280;">오늘 수입</div>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #dc2626;">₩{{todayExpense}}</div>
                <div style="color: #6b7280;">오늘 지출</div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 15px;">
              <div style="font-size: 28px; font-weight: bold; color: {{netCashFlow >= 0 ? '#059669' : '#dc2626'}};">
                ₩{{netCashFlow}}
              </div>
              <div style="color: #6b7280;">순 현금흐름</div>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">🏦 계좌 현황</h3>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #2563eb;">₩{{currentBalance}}</div>
              <div style="color: #6b7280;">총 잔액</div>
            </div>
            <div style="margin-top: 15px; color: #6b7280;">
              활성 계좌: {{accountCount}}개 | 오늘 거래: {{transactionCount}}건
            </div>
          </div>

          {{#if alerts.length}}
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0;">⚠️ 주의사항</h3>
            <ul style="color: #374151;">
              {{#each alerts}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
          </div>
          {{/if}}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            이 리포트는 자금일보 시스템에서 자동으로 생성되었습니다.
          </div>
        </div>
      `,
      textContent: `
        {{date}} 일일 자금일보

        💰 오늘의 현금흐름
        - 수입: ₩{{todayIncome}}
        - 지출: ₩{{todayExpense}}
        - 순 현금흐름: ₩{{netCashFlow}}

        🏦 계좌 현황
        - 총 잔액: ₩{{currentBalance}}
        - 활성 계좌: {{accountCount}}개
        - 오늘 거래: {{transactionCount}}건

        {{#if alerts.length}}
        ⚠️ 주의사항
        {{#each alerts}}
        - {{this}}
        {{/each}}
        {{/if}}

        이 리포트는 자금일보 시스템에서 자동으로 생성되었습니다.
      `,
      variables: [
        'date',
        'currentBalance',
        'todayIncome',
        'todayExpense',
        'netCashFlow',
        'accountCount',
        'transactionCount',
        'alerts',
      ],
    })

    // 예산 초과 알림 템플릿
    this.templates.set('budget-alert', {
      id: 'budget-alert',
      name: '예산 초과 알림',
      subject: '⚠️ [예산 초과] {{budgetName}} 예산이 {{overPercentage}}% 초과되었습니다',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">⚠️ 예산 초과 알림</h2>

          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0;">{{budgetName}}</h3>
            <div style="margin: 15px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>계획 금액:</span>
                <span style="font-weight: bold;">₩{{plannedAmount}}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>실제 사용:</span>
                <span style="font-weight: bold; color: #dc2626;">₩{{actualAmount}}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>초과 금액:</span>
                <span style="font-weight: bold; color: #dc2626;">₩{{overAmount}}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>초과 비율:</span>
                <span style="font-weight: bold; color: #dc2626;">{{overPercentage}}%</span>
              </div>
            </div>
            <div style="color: #6b7280; font-size: 14px;">
              카테고리: {{category}}
            </div>
          </div>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">💡 권장사항</h3>
            <ul style="color: #374151;">
              <li>해당 카테고리의 지출을 재검토하세요</li>
              <li>불필요한 지출을 줄이는 방안을 고려하세요</li>
              <li>예산을 조정하거나 다른 카테고리에서 절약을 고려하세요</li>
            </ul>
          </div>
        </div>
      `,
      textContent: `
        ⚠️ 예산 초과 알림

        {{budgetName}}
        - 계획 금액: ₩{{plannedAmount}}
        - 실제 사용: ₩{{actualAmount}}
        - 초과 금액: ₩{{overAmount}}
        - 초과 비율: {{overPercentage}}%
        - 카테고리: {{category}}

        💡 권장사항
        - 해당 카테고리의 지출을 재검토하세요
        - 불필요한 지출을 줄이는 방안을 고려하세요
        - 예산을 조정하거나 다른 카테고리에서 절약을 고려하세요
      `,
      variables: [
        'budgetName',
        'plannedAmount',
        'actualAmount',
        'overAmount',
        'overPercentage',
        'category',
      ],
    })

    // 긴급 알림 템플릿
    this.templates.set('urgent-alert', {
      id: 'urgent-alert',
      name: '긴급 알림',
      subject: '🚨 [긴급] {{title}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🚨 긴급 알림</h2>

          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0;">{{title}}</h3>
            <div style="margin: 15px 0; color: #374151;">
              {{message}}
            </div>
            <div style="color: #6b7280; font-size: 14px;">
              알림 유형: {{alertType}} | 심각도: {{severity}} | 시간: {{timestamp}}
            </div>
          </div>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">📞 즉시 조치 필요</h3>
            <p style="color: #374151;">
              이 알림은 즉시 조치가 필요한 상황입니다. 자금일보 시스템에 로그인하여 자세한 내용을 확인하세요.
            </p>
          </div>
        </div>
      `,
      textContent: `
        🚨 긴급 알림

        {{title}}

        {{message}}

        알림 유형: {{alertType}}
        심각도: {{severity}}
        시간: {{timestamp}}

        📞 즉시 조치 필요
        이 알림은 즉시 조치가 필요한 상황입니다. 자금일보 시스템에 로그인하여 자세한 내용을 확인하세요.
      `,
      variables: ['title', 'message', 'alertType', 'severity', 'timestamp'],
    })

    // 월간 리포트 템플릿
    this.templates.set('monthly-report', {
      id: 'monthly-report',
      name: '월간 종합 리포트',
      subject: '[월간 리포트] {{month}} 자금 현황 종합 보고서',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📈 {{month}} 월간 종합 리포트</h2>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">💰 월간 현금흐름</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #059669;">₩{{totalIncome}}</div>
                <div style="color: #6b7280;">총 수입</div>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                <div style="font-size: 24px; font-weight: bold; color: #dc2626;">₩{{totalExpense}}</div>
                <div style="color: #6b7280;">총 지출</div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 15px;">
              <div style="font-size: 28px; font-weight: bold; color: {{netCashFlow >= 0 ? '#059669' : '#dc2626'}};">
                ₩{{netCashFlow}}
              </div>
              <div style="color: #6b7280;">순 현금흐름</div>
            </div>
          </div>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">🏥 재무 건강도</h3>
            <div style="text-align: center;">
              <div style="font-size: 48px; font-weight: bold; color: {{healthScore >= 80 ? '#059669' : healthScore >= 60 ? '#f59e0b' : '#dc2626'}};">
                {{healthScore}}점
              </div>
              <div style="color: #6b7280;">종합 점수</div>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">📊 계좌별 요약</h3>
            {{#each accountSummaries}}
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              <span>{{name}}</span>
              <span style="font-weight: bold;">₩{{balance}}</span>
            </div>
            {{/each}}
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            이 리포트는 자금일보 시스템에서 자동으로 생성되었습니다.
          </div>
        </div>
      `,
      textContent: `
        {{month}} 월간 종합 리포트

        💰 월간 현금흐름
        - 총 수입: ₩{{totalIncome}}
        - 총 지출: ₩{{totalExpense}}
        - 순 현금흐름: ₩{{netCashFlow}}

        🏥 재무 건강도
        - 종합 점수: {{healthScore}}점

        📊 계좌별 요약
        {{#each accountSummaries}}
        - {{name}}: ₩{{balance}}
        {{/each}}

        이 리포트는 자금일보 시스템에서 자동으로 생성되었습니다.
      `,
      variables: [
        'month',
        'totalIncome',
        'totalExpense',
        'netCashFlow',
        'accountSummaries',
        'healthScore',
      ],
    })
  }

  // 수신자 초기화
  private initializeRecipients(): void {
    // 기본 수신자 설정 (개발 환경용)
    this.recipients.set('ceo', {
      id: 'ceo',
      name: '대표이사',
      email: 'ceo@company.com',
      role: 'ceo',
      isActive: true,
      preferences: {
        dailyReport: true,
        weeklyReport: true,
        monthlyReport: true,
        budgetAlerts: true,
        urgentAlerts: true,
      },
    })

    this.recipients.set('cfo', {
      id: 'cfo',
      name: 'CFO',
      email: 'cfo@company.com',
      role: 'cfo',
      isActive: true,
      preferences: {
        dailyReport: true,
        weeklyReport: true,
        monthlyReport: true,
        budgetAlerts: true,
        urgentAlerts: true,
      },
    })

    this.recipients.set('accountant', {
      id: 'accountant',
      name: '회계 담당자',
      email: 'accountant@company.com',
      role: 'accountant',
      isActive: true,
      preferences: {
        dailyReport: false,
        weeklyReport: true,
        monthlyReport: true,
        budgetAlerts: true,
        urgentAlerts: true,
      },
    })
  }
}

// 싱글톤 인스턴스
export const emailService = new EmailService()
