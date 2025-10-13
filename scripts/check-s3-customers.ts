import { query } from '../src/lib/database/connection'
import { config } from 'dotenv'

// 환경 변수 로드
config()

async function checkS3Customers() {
  const s3CustomerIds = [
    '03728132-cfed-416a-9a84-b2196f75e3b7',
    '2c9751e3-ee49-4382-8d02-e1d7eb9a65a5',
    '76ab6209-5516-4af5-860c-6cb76bde02be',
    '8fd577b7-7db7-4964-aea5-5699e08db3ea',
    'f60aca80-2368-4cf9-8b4e-a4d83e257bec',
  ]

  try {
    console.log('🔍 S3 버킷에 있는 고객 ID들 조사 중...\n')

    // S3에 있는 고객들이 DB에 존재하는지 확인
    const result = await query(
      `
      SELECT 
        id,
        name,
        business_number,
        type,
        business_registration_s3_key,
        bank_account_s3_key,
        created_at::text as created_at
      FROM crm_customers
      WHERE id = ANY($1)
      ORDER BY created_at DESC
    `,
      [s3CustomerIds],
    )

    console.log(`📊 조사 결과: ${result.rows.length}명의 고객이 DB에 존재합니다.\n`)

    if (result.rows.length > 0) {
      console.log('✅ DB에 존재하는 고객들:')
      console.log('='.repeat(80))

      result.rows.forEach((customer, index) => {
        console.log(`${index + 1}. ${customer.name}`)
        console.log(`   ID: ${customer.id}`)
        console.log(`   사업자번호: ${customer.business_number || '없음'}`)
        console.log(`   유형: ${customer.type}`)
        console.log(
          `   사업자등록증: ${customer.business_registration_s3_key ? '✅ 있음' : '❌ 없음'}`,
        )
        console.log(`   통장사본: ${customer.bank_account_s3_key ? '✅ 있음' : '❌ 없음'}`)
        console.log(`   생성일: ${customer.created_at}`)
        console.log('')
      })
    }

    // DB에 없는 고객 ID들 확인
    const existingIds = result.rows.map((row) => row.id)
    const missingIds = s3CustomerIds.filter((id) => !existingIds.includes(id))

    if (missingIds.length > 0) {
      console.log('❌ DB에 존재하지 않는 고객 ID들:')
      console.log('='.repeat(80))
      missingIds.forEach((id, index) => {
        console.log(`${index + 1}. ${id}`)
      })
      console.log('')
    }

    // 전체 고객 수 확인
    const totalResult = await query('SELECT COUNT(*) as total FROM crm_customers')
    console.log(`📈 전체 고객 수: ${totalResult.rows[0].total}명`)
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

checkS3Customers()
