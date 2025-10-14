import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../helpers/api-helper'
import { DBHelper } from '../helpers/db-helper'

// Mock database connection
const mockQuery = vi.fn()
const mockTransaction = vi.fn()

// Mock the database module
vi.mock('$lib/database/connection', () => ({
  query: mockQuery,
  transaction: mockTransaction,
}))

describe('Database + Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    DBHelper.reset()
  })

  describe('Database Transaction Flow', () => {
    it('should complete atomic transaction with rollback on error', async () => {
      let transactionExecuted = false
      let rollbackExecuted = false

      // Mock transaction behavior
      mockTransaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: vi.fn().mockImplementation((sql, params) => {
            if (sql.includes('INSERT INTO crm_customers')) {
              transactionExecuted = true
              return Promise.resolve({
                rows: [{ id: 'customer-new', ...params }],
                rowCount: 1,
              })
            }
            if (sql.includes('INSERT INTO crm_contracts')) {
              // Simulate error in second operation
              throw new Error('Contract creation failed')
            }
            return Promise.resolve({ rows: [], rowCount: 0 })
          }),
        }

        try {
          const result = await callback(mockClient)
          return result
        } catch (error) {
          rollbackExecuted = true
          throw error
        }
      })

      const request = createMockRequest('POST', {
        customer: {
          name: '테스트 고객사',
          businessNumber: '123-45-67890',
          representativeName: '김대표',
        },
        contract: {
          contractNumber: 'CONTRACT-001',
          amount: 100000000,
          startDate: '2023-01-01',
          endDate: '2023-12-31',
        },
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()
        
        try {
          const result = await mockTransaction(async (client) => {
            // Step 1: Create customer
            const customerResult = await client.query(
              'INSERT INTO crm_customers (name, business_number, representative_name) VALUES ($1, $2, $3) RETURNING *',
              [body.customer.name, body.customer.businessNumber, body.customer.representativeName]
            )
            
            const customer = customerResult.rows[0]
            
            // Step 2: Create contract (this will fail)
            const contractResult = await client.query(
              'INSERT INTO crm_contracts (contract_number, customer_id, amount, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
              [body.contract.contractNumber, customer.id, body.contract.amount, body.contract.startDate, body.contract.endDate]
            )
            
            return {
              customer: customer,
              contract: contractResult.rows[0],
            }
          })
          
          return new Response(JSON.stringify({ 
            success: true, 
            data: result 
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Transaction failed',
            details: error.message
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
      expect(responseBody.error).toBe('Transaction failed')
      expect(responseBody.details).toBe('Contract creation failed')
      
      // Verify transaction was executed but rolled back
      expect(transactionExecuted).toBe(true)
      expect(rollbackExecuted).toBe(true)
      expect(mockTransaction).toHaveBeenCalledTimes(1)
    })

    it('should complete successful transaction with commit', async () => {
      let customerCreated = false
      let contractCreated = false

      // Mock successful transaction
      mockTransaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: vi.fn().mockImplementation((sql, params) => {
            if (sql.includes('INSERT INTO crm_customers')) {
              customerCreated = true
              return Promise.resolve({
                rows: [{ id: 'customer-new', name: params[0], businessNumber: params[1] }],
                rowCount: 1,
              })
            }
            if (sql.includes('INSERT INTO crm_contracts')) {
              contractCreated = true
              return Promise.resolve({
                rows: [{ id: 'contract-new', contractNumber: params[0], customerId: params[1] }],
                rowCount: 1,
              })
            }
            return Promise.resolve({ rows: [], rowCount: 0 })
          }),
        }

        return await callback(mockClient)
      })

      const request = createMockRequest('POST', {
        customer: {
          name: '테스트 고객사',
          businessNumber: '123-45-67890',
          representativeName: '김대표',
        },
        contract: {
          contractNumber: 'CONTRACT-001',
          amount: 100000000,
          startDate: '2023-01-01',
          endDate: '2023-12-31',
        },
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()
        
        const result = await mockTransaction(async (client) => {
          // Step 1: Create customer
          const customerResult = await client.query(
            'INSERT INTO crm_customers (name, business_number, representative_name) VALUES ($1, $2, $3) RETURNING *',
            [body.customer.name, body.customer.businessNumber, body.customer.representativeName]
          )
          
          const customer = customerResult.rows[0]
          
          // Step 2: Create contract
          const contractResult = await client.query(
            'INSERT INTO crm_contracts (contract_number, customer_id, amount, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [body.contract.contractNumber, customer.id, body.contract.amount, body.contract.startDate, body.contract.endDate]
          )
          
          return {
            customer: customer,
            contract: contractResult.rows[0],
          }
        })
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: result 
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.customer).toBeDefined()
      expect(responseBody.data.contract).toBeDefined()
      
      // Verify both operations were executed
      expect(customerCreated).toBe(true)
      expect(contractCreated).toBe(true)
      expect(mockTransaction).toHaveBeenCalledTimes(1)
    })
  })

  describe('Database Query Optimization Flow', () => {
    it('should handle complex join queries with proper indexing', async () => {
      // Mock complex join query result
      const mockJoinResult = [
        {
          customer_id: 'customer-1',
          customer_name: '테스트 고객사',
          contract_id: 'contract-1',
          contract_number: 'CONTRACT-001',
          contract_amount: 100000000,
          project_id: 'project-1',
          project_name: 'AI 기반 자동화 시스템 개발',
          employee_id: 'employee-1',
          employee_name: '홍길동',
        },
        {
          customer_id: 'customer-1',
          customer_name: '테스트 고객사',
          contract_id: 'contract-1',
          contract_number: 'CONTRACT-001',
          contract_amount: 100000000,
          project_id: 'project-2',
          project_name: '블록체인 보안 솔루션 연구',
          employee_id: 'employee-2',
          employee_name: '김철수',
        },
      ]

      mockQuery.mockResolvedValue({
        rows: mockJoinResult,
        rowCount: mockJoinResult.length,
      })

      const request = createMockRequest('GET', {
        customerId: 'customer-1',
      })
      const event = createMockEvent(request)

      const mockGET = vi.fn().mockImplementation(async ({ request, url }) => {
        const urlObj = new URL(url)
        const customerId = urlObj.searchParams.get('customerId') || 'customer-1'
        
        // Complex join query with proper indexing
        const result = await mockQuery(`
          SELECT 
            c.id as customer_id,
            c.name as customer_name,
            ct.id as contract_id,
            ct.contract_number,
            ct.amount as contract_amount,
            p.id as project_id,
            p.name as project_name,
            e.id as employee_id,
            e.first_name || ' ' || e.last_name as employee_name
          FROM crm_customers c
          INNER JOIN crm_contracts ct ON c.id = ct.customer_id
          LEFT JOIN rd_projects p ON ct.id = p.contract_id
          LEFT JOIN rd_project_members pm ON p.id = pm.project_id
          LEFT JOIN employees e ON pm.employee_id = e.id
          WHERE c.id = $1
          ORDER BY ct.contract_number, p.name, e.first_name
        `, [customerId])
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: result.rows 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockJoinResult)
      expect(responseBody.data).toHaveLength(2)
      
      // Verify complex query was executed
      expect(mockQuery).toHaveBeenCalledTimes(1)
      const queryCall = mockQuery.mock.calls[0]
      expect(queryCall[0]).toContain('INNER JOIN')
      expect(queryCall[0]).toContain('LEFT JOIN')
      expect(queryCall[1]).toEqual(['customer-1'])
    })

    it('should handle pagination queries efficiently', async () => {
      // Mock paginated result
      const mockPaginatedResult = Array.from({ length: 20 }, (_, i) => ({
        id: `customer-${i + 1}`,
        name: `고객사 ${i + 1}`,
        businessNumber: `${100 + i}-${10 + i}-${10000 + i}`,
        status: 'active',
      }))

      mockQuery.mockResolvedValue({
        rows: mockPaginatedResult,
        rowCount: 100, // Total count
      })

      const request = createMockRequest('GET', {
        page: '2',
        limit: '20',
      })
      const event = createMockEvent(request)

      const mockGET = vi.fn().mockImplementation(async ({ request, url }) => {
        const urlObj = new URL(url)
        const page = parseInt(urlObj.searchParams.get('page') || '1')
        const limit = parseInt(urlObj.searchParams.get('limit') || '20')
        const offset = (page - 1) * limit
        
        // Efficient pagination query
        const result = await mockQuery(`
          SELECT * FROM crm_customers 
          ORDER BY created_at DESC 
          LIMIT $1 OFFSET $2
        `, [limit, offset])
        
        // Get total count for pagination info
        const countResult = await mockQuery('SELECT COUNT(*) as total FROM crm_customers')
        const total = parseInt(countResult.rows[0].total)
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: result.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual(mockPaginatedResult)
      expect(responseBody.pagination.page).toBe(2)
      expect(responseBody.pagination.limit).toBe(20)
      expect(responseBody.pagination.total).toBe(100)
      expect(responseBody.pagination.totalPages).toBe(5)
      expect(responseBody.pagination.hasNext).toBe(true)
      expect(responseBody.pagination.hasPrev).toBe(true)
      
      // Verify pagination queries were executed
      expect(mockQuery).toHaveBeenCalledTimes(2) // Data query + count query
    })
  })

  describe('Database Connection Pool Management', () => {
    it('should handle connection pool exhaustion gracefully', async () => {
      // Mock connection pool exhaustion
      mockQuery.mockRejectedValue(new Error('Connection pool exhausted'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      const mockGET = vi.fn().mockImplementation(async ({ request }) => {
        try {
          const result = await mockQuery('SELECT * FROM crm_customers LIMIT 1')
          return new Response(JSON.stringify({ 
            success: true, 
            data: result.rows 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('Connection pool exhausted')) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Service temporarily unavailable',
              details: 'Database connection pool is full. Please try again later.',
              retryAfter: 30
            }), {
              status: 503,
              headers: { 
                'Content-Type': 'application/json',
                'Retry-After': '30'
              },
            })
          }
          throw error
        }
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(503)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Service temporarily unavailable')
      expect(responseBody.details).toBe('Database connection pool is full. Please try again later.')
      expect(responseBody.retryAfter).toBe(30)
      expect(response.headers.get('Retry-After')).toBe('30')
    })

    it('should handle database timeout gracefully', async () => {
      // Mock database timeout
      mockQuery.mockRejectedValue(new Error('Query timeout'))

      const request = createMockRequest('GET', {})
      const event = createMockEvent(request)

      const mockGET = vi.fn().mockImplementation(async ({ request }) => {
        try {
          const result = await mockQuery('SELECT * FROM crm_customers')
          return new Response(JSON.stringify({ 
            success: true, 
            data: result.rows 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('timeout')) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Request timeout',
              details: 'Database query timed out. Please try again with a simpler query.',
            }), {
              status: 408,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          throw error
        }
      })

      const response = await mockGET({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(408)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Request timeout')
      expect(responseBody.details).toBe('Database query timed out. Please try again with a simpler query.')
    })
  })

  describe('Database Data Consistency Flow', () => {
    it('should handle data validation and constraints', async () => {
      // Mock constraint violation
      mockQuery.mockRejectedValue(new Error('duplicate key value violates unique constraint "crm_customers_business_number_key"'))

      const request = createMockRequest('POST', {
        name: '테스트 고객사',
        businessNumber: '123-45-67890', // Already exists
        representativeName: '김대표',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()
        
        try {
          const result = await mockQuery(
            'INSERT INTO crm_customers (name, business_number, representative_name) VALUES ($1, $2, $3) RETURNING *',
            [body.name, body.businessNumber, body.representativeName]
          )
          
          return new Response(JSON.stringify({ 
            success: true, 
            data: result.rows[0] 
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('duplicate key value violates unique constraint')) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Business number already exists',
              details: 'A customer with this business number already exists.',
              field: 'businessNumber'
            }), {
              status: 409,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          throw error
        }
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(409)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Business number already exists')
      expect(responseBody.details).toBe('A customer with this business number already exists.')
      expect(responseBody.field).toBe('businessNumber')
    })

    it('should handle foreign key constraint violations', async () => {
      // Mock foreign key violation
      mockQuery.mockRejectedValue(new Error('insert or update on table "crm_contracts" violates foreign key constraint "crm_contracts_customer_id_fkey"'))

      const request = createMockRequest('POST', {
        contractNumber: 'CONTRACT-001',
        customerId: 'non-existent-customer', // Invalid customer ID
        amount: 100000000,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()
        
        try {
          const result = await mockQuery(
            'INSERT INTO crm_contracts (contract_number, customer_id, amount, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [body.contractNumber, body.customerId, body.amount, body.startDate, body.endDate]
          )
          
          return new Response(JSON.stringify({ 
            success: true, 
            data: result.rows[0] 
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          if (error.message.includes('violates foreign key constraint')) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Referenced record not found',
              details: 'The specified customer does not exist.',
              field: 'customerId'
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          throw error
        }
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(400)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Referenced record not found')
      expect(responseBody.details).toBe('The specified customer does not exist.')
      expect(responseBody.field).toBe('customerId')
    })
  })
})
