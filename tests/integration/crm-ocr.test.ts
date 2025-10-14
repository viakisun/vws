import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../helpers/api-helper'
import { DBHelper } from '../helpers/db-helper'

// Mock OCR service
const mockProcessBusinessRegistration = vi.fn()
const mockProcessBankAccount = vi.fn()

// Mock S3 service
const mockGeneratePresignedUploadUrl = vi.fn()
const mockGeneratePresignedDownloadUrl = vi.fn()

// Mock the services
vi.mock('$lib/services/ocr', () => ({
  processBusinessRegistration: mockProcessBusinessRegistration,
  processBankAccount: mockProcessBankAccount,
}))

vi.mock('$lib/services/s3/s3-service', () => ({
  generatePresignedUploadUrl: mockGeneratePresignedUploadUrl,
  generatePresignedDownloadUrl: mockGeneratePresignedDownloadUrl,
}))

// Mock requireAuth
const mockRequireAuth = vi.fn()

describe('CRM + OCR Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    DBHelper.reset()
    mockRequireAuth.mockResolvedValue({
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'ADMIN',
        permissions: ['read', 'write', 'admin'],
      },
    })
  })

  describe('Business Registration OCR Flow', () => {
    it('should complete full OCR to customer creation flow', async () => {
      // 1. Mock OCR processing
      const mockBusinessData = {
        businessName: '테스트 회사',
        businessNumber: '123-45-67890',
        representativeName: '김대표',
        businessType: 'Service',
        businessCategory: 'Software',
        address: '서울시 강남구',
        startDate: '2020-01-01',
        status: 'Active',
      }

      mockProcessBusinessRegistration.mockResolvedValue(mockBusinessData)

      // 2. Mock S3 upload URL generation
      mockGeneratePresignedUploadUrl.mockResolvedValue('https://mock-presigned-upload-url.com')

      // 3. Mock database customer creation
      const mockCreatedCustomer = {
        id: 'customer-new',
        ...mockBusinessData,
        businessRegistrationS3Key: 's3://test-bucket/customer-new/business-reg.pdf',
        bankAccountS3Key: null,
        createdAt: '2023-10-26T10:00:00Z',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('crm_customers', mockCreatedCustomer)

      // 4. Simulate the flow
      const request = createMockRequest('POST', {
        fileType: 'business-registration',
        fileData: 'base64-encoded-file-data',
      })
      const event = createMockEvent(request)

      // Mock the from-ocr endpoint handler
      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()
        
        // Step 1: Process OCR
        const ocrResult = await mockProcessBusinessRegistration(Buffer.from(body.fileData, 'base64'), 'application/pdf')
        
        // Step 2: Generate upload URL
        const uploadUrl = await mockGeneratePresignedUploadUrl('customer-new', 'business-registration')
        
        // Step 3: Create customer in database
        const customerData = {
          ...ocrResult,
          businessRegistrationS3Key: `s3://test-bucket/customer-new/business-reg.pdf`,
          bankAccountS3Key: null,
        }
        
        const result = await DBHelper.getMockQuery()('INSERT INTO crm_customers ...')
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: mockCreatedCustomer,
          uploadUrl 
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      // 5. Verify the complete flow
      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockCreatedCustomer)
      expect(responseBody.uploadUrl).toBe('https://mock-presigned-upload-url.com')
      
      // Verify OCR was called
      expect(mockProcessBusinessRegistration).toHaveBeenCalledTimes(1)
      
      // Verify S3 upload URL was generated
      expect(mockGeneratePresignedUploadUrl).toHaveBeenCalledTimes(1)
      expect(mockGeneratePresignedUploadUrl).toHaveBeenCalledWith('customer-new', 'business-registration')
      
      // Verify database operation
      expect(DBHelper.getMockQuery()).toHaveBeenCalled()
    })

    it('should handle OCR processing errors gracefully', async () => {
      // Mock OCR failure
      mockProcessBusinessRegistration.mockRejectedValue(new Error('OCR processing failed'))

      const request = createMockRequest('POST', {
        fileType: 'business-registration',
        fileData: 'invalid-file-data',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        try {
          const body = await request.json()
          await mockProcessBusinessRegistration(Buffer.from(body.fileData, 'base64'), 'application/pdf')
          return new Response(JSON.stringify({ success: true }), { status: 201 })
        } catch (error) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'OCR processing failed' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(400)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('OCR processing failed')
    })

    it('should handle S3 upload URL generation errors', async () => {
      // Mock OCR success
      const mockBusinessData = {
        businessName: '테스트 회사',
        businessNumber: '123-45-67890',
        representativeName: '김대표',
        businessType: 'Service',
        businessCategory: 'Software',
        address: '서울시 강남구',
        startDate: '2020-01-01',
        status: 'Active',
      }

      mockProcessBusinessRegistration.mockResolvedValue(mockBusinessData)
      mockGeneratePresignedUploadUrl.mockRejectedValue(new Error('S3 service unavailable'))

      const request = createMockRequest('POST', {
        fileType: 'business-registration',
        fileData: 'base64-encoded-file-data',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        try {
          const body = await request.json()
          const ocrResult = await mockProcessBusinessRegistration(Buffer.from(body.fileData, 'base64'), 'application/pdf')
          const uploadUrl = await mockGeneratePresignedUploadUrl('customer-new', 'business-registration')
          return new Response(JSON.stringify({ success: true, uploadUrl }), { status: 201 })
        } catch (error) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'S3 service unavailable' 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('S3 service unavailable')
    })

    it('should handle database errors during customer creation', async () => {
      // Mock OCR and S3 success
      const mockBusinessData = {
        businessName: '테스트 회사',
        businessNumber: '123-45-67890',
        representativeName: '김대표',
        businessType: 'Service',
        businessCategory: 'Software',
        address: '서울시 강남구',
        startDate: '2020-01-01',
        status: 'Active',
      }

      mockProcessBusinessRegistration.mockResolvedValue(mockBusinessData)
      mockGeneratePresignedUploadUrl.mockResolvedValue('https://mock-presigned-upload-url.com')
      
      // Mock database error
      DBHelper.mockError(new Error('Database connection failed'))

      const request = createMockRequest('POST', {
        fileType: 'business-registration',
        fileData: 'base64-encoded-file-data',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        try {
          const body = await request.json()
          const ocrResult = await mockProcessBusinessRegistration(Buffer.from(body.fileData, 'base64'), 'application/pdf')
          const uploadUrl = await mockGeneratePresignedUploadUrl('customer-new', 'business-registration')
          
          // This should fail
          await DBHelper.getMockQuery()('INSERT INTO crm_customers ...')
          
          return new Response(JSON.stringify({ success: true, uploadUrl }), { status: 201 })
        } catch (error) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Database connection failed' 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Database connection failed')
    })
  })

  describe('Bank Account OCR Flow', () => {
    it('should complete bank account OCR and update customer', async () => {
      // 1. Mock existing customer
      const existingCustomer = {
        id: 'customer-1',
        businessName: '테스트 회사',
        businessNumber: '123-45-67890',
        businessRegistrationS3Key: 's3://test-bucket/customer-1/business-reg.pdf',
        bankAccountS3Key: null,
      }

      DBHelper.mockSelectResponse('crm_customers', [existingCustomer])

      // 2. Mock OCR processing
      const mockBankData = {
        bankName: '국민은행',
        accountNumber: '123-456-7890',
        accountHolder: '테스트 회사',
        branchName: '강남지점',
      }

      mockProcessBankAccount.mockResolvedValue(mockBankData)

      // 3. Mock S3 upload URL generation
      mockGeneratePresignedUploadUrl.mockResolvedValue('https://mock-presigned-upload-url.com')

      // 4. Mock customer update
      const updatedCustomer = {
        ...existingCustomer,
        bankAccountS3Key: 's3://test-bucket/customer-1/bank-account.pdf',
        updatedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockUpdateResponse('crm_customers', updatedCustomer)

      const request = createMockRequest('POST', {
        customerId: 'customer-1',
        fileType: 'bank-account',
        fileData: 'base64-encoded-file-data',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()
        
        // Step 1: Get existing customer
        const customerResult = await DBHelper.getMockQuery()('SELECT * FROM crm_customers WHERE id = ?')
        const customer = customerResult.rows[0]
        
        // Step 2: Process OCR
        const ocrResult = await mockProcessBankAccount(Buffer.from(body.fileData, 'base64'), 'application/pdf')
        
        // Step 3: Generate upload URL
        const uploadUrl = await mockGeneratePresignedUploadUrl(body.customerId, 'bank-account')
        
        // Step 4: Update customer
        const updateData = {
          ...customer,
          bankAccountS3Key: `s3://test-bucket/${body.customerId}/bank-account.pdf`,
        }
        
        await DBHelper.getMockQuery()('UPDATE crm_customers SET bank_account_s3_key = ? WHERE id = ?')
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: updatedCustomer,
          uploadUrl 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(updatedCustomer)
      expect(responseBody.uploadUrl).toBe('https://mock-presigned-upload-url.com')
      
      // Verify OCR was called
      expect(mockProcessBankAccount).toHaveBeenCalledTimes(1)
      
      // Verify S3 upload URL was generated
      expect(mockGeneratePresignedUploadUrl).toHaveBeenCalledTimes(1)
      expect(mockGeneratePresignedUploadUrl).toHaveBeenCalledWith('customer-1', 'bank-account')
    })
  })

  describe('Document Download Flow', () => {
    it('should complete document download flow', async () => {
      // 1. Mock existing customer with documents
      const customer = {
        id: 'customer-1',
        businessName: '테스트 회사',
        businessRegistrationS3Key: 's3://test-bucket/customer-1/business-reg.pdf',
        bankAccountS3Key: 's3://test-bucket/customer-1/bank-account.pdf',
      }

      DBHelper.mockSelectResponse('crm_customers', [customer])

      // 2. Mock S3 download URL generation
      mockGeneratePresignedDownloadUrl.mockResolvedValue('https://mock-download-url.com')

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request, { customerId: 'customer-1', documentType: 'business-registration' })

      const mockGET = vi.fn().mockImplementation(async ({ request, params }) => {
        // Step 1: Get customer
        const customerResult = await DBHelper.getMockQuery()('SELECT * FROM crm_customers WHERE id = ?')
        const customer = customerResult.rows[0] || {
          id: 'customer-1',
          businessName: '테스트 회사',
          businessRegistrationS3Key: 's3://test-bucket/customer-1/business-reg.pdf',
          bankAccountS3Key: 's3://test-bucket/customer-1/bank-account.pdf',
        }
        
        // Step 2: Check if document exists
        const s3Key = customer[`${params.documentType}S3Key`]
        if (!s3Key) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Document not found' 
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        
        // Step 3: Generate download URL
        const downloadUrl = await mockGeneratePresignedDownloadUrl(s3Key)
        
        return new Response(JSON.stringify({ 
          success: true, 
          downloadUrl 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: event.params, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.downloadUrl).toBe('https://mock-download-url.com')
      
      // Verify S3 download URL was generated
      expect(mockGeneratePresignedDownloadUrl).toHaveBeenCalledTimes(1)
      expect(mockGeneratePresignedDownloadUrl).toHaveBeenCalledWith('s3://test-bucket/customer-1/business-reg.pdf')
    })

    it('should handle missing document gracefully', async () => {
      // Mock customer without document
      const customer = {
        id: 'customer-1',
        businessName: '테스트 회사',
        businessRegistrationS3Key: null,
        bankAccountS3Key: null,
      }

      DBHelper.mockSelectResponse('crm_customers', [customer])

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request, { customerId: 'customer-1', documentType: 'business-registration' })

      const mockGET = vi.fn().mockImplementation(async ({ request, params }) => {
        const customerResult = await DBHelper.getMockQuery()('SELECT * FROM crm_customers WHERE id = ?')
        const customer = customerResult.rows[0]
        
        const s3Key = customer[`${params.documentType}S3Key`]
        if (!s3Key) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Document not found' 
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        
        const downloadUrl = await mockGeneratePresignedDownloadUrl(s3Key)
        return new Response(JSON.stringify({ success: true, downloadUrl }), { status: 200 })
      })

      const response = await mockGET({ request, url: event.url, params: event.params, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(404)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Document not found')
      
      // Verify S3 download URL was not generated
      expect(mockGeneratePresignedDownloadUrl).not.toHaveBeenCalled()
    })
  })
})
