import { verifyToken } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// CRM 시스템 초기화 스키마 SQL (이미 마이그레이션으로 생성됨 - 샘플 데이터만 생성)
async function createSampleData() {
  try {
    // 샘플 고객 생성
    const sampleCustomers = [
      {
        name: 'ABC 테크놀로지',
        type: 'customer',
        contact_person: '김영희',
        contact_phone: '02-1234-5678',
        contact_email: 'kim@abctech.com',
        industry: 'IT/소프트웨어',
        payment_terms: 30,
        status: 'active',
      },
      {
        name: 'XYZ 제조',
        type: 'supplier',
        contact_person: '박민수',
        contact_phone: '02-9876-5432',
        contact_email: 'park@xyz.com',
        industry: '제조업',
        payment_terms: 15,
        status: 'active',
      },
      {
        name: 'DEF 스타트업',
        type: 'both',
        contact_person: '이지은',
        contact_phone: '02-5555-1234',
        contact_email: 'lee@defstartup.com',
        industry: '핀테크',
        payment_terms: 30,
        status: 'active',
      },
    ]

    const customerIds: string[] = []
    for (const customer of sampleCustomers) {
      const result = await query(
        `
        INSERT INTO crm_customers (name, type, contact_person, contact_phone, contact_email, industry, payment_terms, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
        `,
        [
          customer.name,
          customer.type,
          customer.contact_person,
          customer.contact_phone,
          customer.contact_email,
          customer.industry,
          customer.payment_terms,
          customer.status,
        ],
      )
      customerIds.push(result.rows[0].id)
    }

    // 샘플 영업 기회 생성
    const sampleOpportunities = [
      {
        title: 'ABC 테크놀로지 스마트팩토리 솔루션',
        customer_id: customerIds[0],
        type: 'sales',
        stage: 'proposal',
        value: 50000000,
        probability: 70,
        expected_close_date: '2025-02-15',
        owner_id: 'user-1',
        status: 'active',
      },
      {
        title: 'XYZ 제조 자동화 시스템',
        customer_id: customerIds[1],
        type: 'purchase',
        stage: 'negotiation',
        value: 30000000,
        probability: 50,
        expected_close_date: '2025-02-28',
        owner_id: 'user-1',
        status: 'active',
      },
    ]

    for (const opportunity of sampleOpportunities) {
      await query(
        `
        INSERT INTO crm_opportunities (title, customer_id, type, stage, value, probability, expected_close_date, owner_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          opportunity.title,
          opportunity.customer_id,
          opportunity.type,
          opportunity.stage,
          opportunity.value,
          opportunity.probability,
          opportunity.expected_close_date,
          opportunity.owner_id,
          opportunity.status,
        ],
      )
    }

    // 샘플 계약 생성
    const sampleContracts = [
      {
        contract_number: 'CON-2025-001',
        title: 'DEF 스타트업 핀테크 솔루션',
        customer_id: customerIds[2],
        type: 'sales',
        status: 'active',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        total_amount: 15000000,
        paid_amount: 5000000,
        payment_terms: 30,
        owner_id: 'user-1',
      },
    ]

    const contractIds: string[] = []
    for (const contract of sampleContracts) {
      const result = await query(
        `
        INSERT INTO crm_contracts (contract_number, title, customer_id, type, status, start_date, end_date, total_amount, paid_amount, payment_terms, owner_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
        `,
        [
          contract.contract_number,
          contract.title,
          contract.customer_id,
          contract.type,
          contract.status,
          contract.start_date,
          contract.end_date,
          contract.total_amount,
          contract.paid_amount,
          contract.payment_terms,
          contract.owner_id,
        ],
      )
      contractIds.push(result.rows[0].id)
    }

    // 샘플 거래 내역 생성
    const sampleTransactions = [
      {
        transaction_number: 'TXN-2025-001',
        contract_id: contractIds[0],
        customer_id: customerIds[2],
        type: 'sales',
        amount: 5000000,
        transaction_date: '2025-01-20',
        due_date: '2025-02-20',
        payment_date: '2025-01-25',
        payment_status: 'paid',
        description: '1차 계약금',
        created_by: 'user-1',
      },
      {
        transaction_number: 'TXN-2025-002',
        contract_id: contractIds[0],
        customer_id: customerIds[2],
        type: 'sales',
        amount: 10000000,
        transaction_date: '2025-02-01',
        due_date: '2025-03-01',
        payment_status: 'pending',
        description: '2차 계약금',
        created_by: 'user-1',
      },
    ]

    for (const transaction of sampleTransactions) {
      await query(
        `
        INSERT INTO crm_transactions (transaction_number, contract_id, customer_id, type, amount, transaction_date, due_date, payment_date, payment_status, description, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          transaction.transaction_number,
          transaction.contract_id,
          transaction.customer_id,
          transaction.type,
          transaction.amount,
          transaction.transaction_date,
          transaction.due_date,
          transaction.payment_date,
          transaction.payment_status,
          transaction.description,
          transaction.created_by,
        ],
      )
    }

    logger.info('CRM 시스템 샘플 데이터 생성 완료')
  } catch (error) {
    logger.error('샘플 데이터 생성 실패:', error)
    throw error
  }
}

// CRM 시스템 초기화 (샘플 데이터만)
export const POST: RequestHandler = async () => {
  try {
    // 샘플 데이터 생성
    await createSampleData()

    return json({
      success: true,
      message: 'CRM 시스템이 성공적으로 초기화되었습니다.',
    })
  } catch (error) {
    logger.error('CRM 시스템 초기화 실패:', error)
    return json(
      {
        success: false,
        error: `CRM 시스템 초기화에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}
