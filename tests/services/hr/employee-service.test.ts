import type { CreateEmployeeDto, EmployeeFilters } from '$lib/services/employee/employee-service'
import { EmployeeService } from '$lib/services/employee/employee-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DBHelper } from '../../helpers/db-helper'
import { mockLogger } from '../../helpers/mock-helper'

describe('Employee Service', () => {
  let employeeService: EmployeeService

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger()
    DBHelper.reset()
    employeeService = new EmployeeService()
  })

  describe('create', () => {
    it('새 직원을 성공적으로 생성해야 함', async () => {
      const employeeData: CreateEmployeeDto = {
        employee_id: 'EMP001',
        user_id: 'user-123',
        first_name: '홍길동',
        last_name: '홍',
        email: 'hong.gd@example.com',
        phone: '010-1234-5678',
        department: '개발팀',
        position: '시니어 개발자',
        employment_type: 'full-time',
        hire_date: new Date('2025-01-15'),
        salary: 5000000,
        status: 'active',
        address: '서울시 강남구',
        emergency_contact: {
          name: '홍부인',
          phone: '010-9876-5432',
          relationship: '배우자',
        },
        manager_id: 'manager-123',
      }

      const mockCreatedEmployee = {
        id: 'employee-123',
        employee_id: 'EMP001',
        user_id: 'user-123',
        first_name: '홍길동',
        last_name: '홍',
        email: 'hong.gd@example.com',
        phone: '010-1234-5678',
        department: '개발팀',
        position: '시니어 개발자',
        employment_type: 'full-time',
        hire_date: '2025-01-15',
        salary: 5000000,
        status: 'active',
        address: '서울시 강남구',
        emergency_contact: JSON.stringify({
          name: '홍부인',
          phone: '010-9876-5432',
          relationship: '배우자',
        }),
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      DBHelper.mockQueryResponse('INSERT INTO employees', {
        rows: [mockCreatedEmployee],
      })

      DBHelper.mockQueryResponse('INSERT INTO reporting_relationships', {
        rows: [],
      })

      const result = await employeeService.create(employeeData)

      expect(result).toEqual(mockCreatedEmployee)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO employees'),
        expect.arrayContaining([
          'EMP001',
          'user-123',
          '홍길동',
          '홍',
          'hong.gd@example.com',
          '010-1234-5678',
          '개발팀',
          '시니어 개발자',
          'full-time',
          new Date('2025-01-15'),
          5000000,
          'active',
          '서울시 강남구',
          JSON.stringify({
            name: '홍부인',
            phone: '010-9876-5432',
            relationship: '배우자',
          }),
        ]),
      )
    })

    it('최소 필수 정보로 직원을 생성해야 함', async () => {
      const employeeData: CreateEmployeeDto = {
        employee_id: 'EMP002',
        first_name: '김철수',
        last_name: '김',
        email: 'kim.cs@example.com',
      }

      const mockCreatedEmployee = {
        id: 'employee-124',
        employee_id: 'EMP002',
        user_id: null,
        first_name: '김철수',
        last_name: '김',
        email: 'kim.cs@example.com',
        phone: null,
        department: null,
        position: null,
        employment_type: 'full-time',
        hire_date: null,
        salary: null,
        status: 'active',
        address: null,
        emergency_contact: '{}',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      DBHelper.mockQueryResponse('INSERT INTO employees', {
        rows: [mockCreatedEmployee],
      })

      const result = await employeeService.create(employeeData)

      expect(result).toEqual(mockCreatedEmployee)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO employees'),
        expect.arrayContaining([
          'EMP002',
          null,
          '김철수',
          '김',
          'kim.cs@example.com',
          null,
          null,
          null,
          'full-time',
          null,
          null,
          'active',
          null,
          '{}',
        ]),
      )
    })

    it('매니저 없이 직원을 생성해야 함', async () => {
      const employeeData: CreateEmployeeDto = {
        employee_id: 'EMP003',
        first_name: '이영희',
        last_name: '이',
        email: 'lee.yh@example.com',
        department: '마케팅팀',
        position: '마케팅 매니저',
      }

      const mockCreatedEmployee = {
        id: 'employee-125',
        employee_id: 'EMP003',
        user_id: null,
        first_name: '이영희',
        last_name: '이',
        email: 'lee.yh@example.com',
        phone: null,
        department: '마케팅팀',
        position: '마케팅 매니저',
        employment_type: 'full-time',
        hire_date: null,
        salary: null,
        status: 'active',
        address: null,
        emergency_contact: '{}',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      DBHelper.mockQueryResponse('INSERT INTO employees', {
        rows: [mockCreatedEmployee],
      })

      const result = await employeeService.create(employeeData)

      expect(result).toEqual(mockCreatedEmployee)
      expect(DBHelper.getMockQuery()).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO reporting_relationships'),
        expect.anything(),
      )
    })

    it('직원 생성 실패 시 에러를 던져야 함', async () => {
      const employeeData: CreateEmployeeDto = {
        employee_id: 'EMP004',
        first_name: '박민수',
        last_name: '박',
        email: 'park.ms@example.com',
      }

      DBHelper.mockQueryResponse('INSERT INTO employees', {
        rows: [],
      })

      await expect(employeeService.create(employeeData)).rejects.toThrow(
        '직원 생성에 실패했습니다.',
      )
    })

    it('데이터베이스 오류 시 에러를 던져야 함', async () => {
      const employeeData: CreateEmployeeDto = {
        employee_id: 'EMP005',
        first_name: '최지영',
        last_name: '최',
        email: 'choi.jy@example.com',
      }

      DBHelper.mockError(new Error('Database connection failed'))

      await expect(employeeService.create(employeeData)).rejects.toThrow(
        'Database connection failed',
      )
    })
  })

  describe('getById', () => {
    it('ID로 직원을 성공적으로 조회해야 함', async () => {
      const mockEmployee = {
        id: 'employee-123',
        employee_id: 'EMP001',
        user_id: 'user-123',
        first_name: '홍길동',
        last_name: '홍',
        email: 'hong.gd@example.com',
        phone: '010-1234-5678',
        department: '개발팀',
        position: '시니어 개발자',
        employment_type: 'full-time',
        hire_date: '2025-01-15',
        salary: 5000000,
        status: 'active',
        address: '서울시 강남구',
        emergency_contact: JSON.stringify({
          name: '홍부인',
          phone: '010-9876-5432',
          relationship: '배우자',
        }),
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE id = $1',
        {
          rows: [mockEmployee],
        },
      )

      const result = await employeeService.getById('employee-123')

      expect(result).toEqual(mockEmployee)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        ['employee-123'],
      )
    })

    it('존재하지 않는 직원 조회 시 null을 반환해야 함', async () => {
      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE id = $1',
        {
          rows: [],
        },
      )

      const result = await employeeService.getById('non-existent')

      expect(result).toBeNull()
    })

    it('데이터베이스 오류 시 에러를 던져야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      await expect(employeeService.getById('employee-123')).rejects.toThrow(
        'Database connection failed',
      )
    })
  })

  describe('getByEmployeeId', () => {
    it('사번으로 직원을 성공적으로 조회해야 함', async () => {
      const mockEmployee = {
        id: 'employee-123',
        employee_id: 'EMP001',
        user_id: 'user-123',
        first_name: '홍길동',
        last_name: '홍',
        email: 'hong.gd@example.com',
        phone: '010-1234-5678',
        department: '개발팀',
        position: '시니어 개발자',
        employment_type: 'full-time',
        hire_date: '2025-01-15',
        salary: 5000000,
        status: 'active',
        address: '서울시 강남구',
        emergency_contact: JSON.stringify({
          name: '홍부인',
          phone: '010-9876-5432',
          relationship: '배우자',
        }),
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE employee_id = $1',
        {
          rows: [mockEmployee],
        },
      )

      const result = await employeeService.getByEmployeeId('EMP001')

      expect(result).toEqual(mockEmployee)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining('WHERE employee_id = $1'),
        ['EMP001'],
      )
    })

    it('존재하지 않는 사번 조회 시 null을 반환해야 함', async () => {
      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE employee_id = $1',
        {
          rows: [],
        },
      )

      const result = await employeeService.getByEmployeeId('NON_EXISTENT')

      expect(result).toBeNull()
    })

    it('데이터베이스 오류 시 에러를 던져야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      await expect(employeeService.getByEmployeeId('EMP001')).rejects.toThrow(
        'Database connection failed',
      )
    })
  })

  describe('list', () => {
    it('모든 직원을 성공적으로 조회해야 함', async () => {
      const mockEmployees = [
        {
          id: 'employee-123',
          employee_id: 'EMP001',
          user_id: 'user-123',
          first_name: '홍길동',
          last_name: '홍',
          email: 'hong.gd@example.com',
          phone: '010-1234-5678',
          department: '개발팀',
          position: '시니어 개발자',
          employment_type: 'full-time',
          hire_date: '2025-01-15',
          salary: 5000000,
          status: 'active',
          address: '서울시 강남구',
          emergency_contact: '{}',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
        {
          id: 'employee-124',
          employee_id: 'EMP002',
          user_id: 'user-124',
          first_name: '김철수',
          last_name: '김',
          email: 'kim.cs@example.com',
          phone: '010-9876-5432',
          department: '마케팅팀',
          position: '마케팅 매니저',
          employment_type: 'full-time',
          hire_date: '2025-01-10',
          salary: 4500000,
          status: 'active',
          address: '서울시 서초구',
          emergency_contact: '{}',
          created_at: '2025-01-10T09:00:00Z',
          updated_at: '2025-01-10T09:00:00Z',
        },
      ]

      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE 1=1 ORDER BY created_at DESC',
        {
          rows: mockEmployees,
        },
      )

      const result = await employeeService.list()

      expect(result).toEqual(mockEmployees)
      expect(result).toHaveLength(2)
    })

    it('부서별 필터로 직원을 조회해야 함', async () => {
      const mockEmployees = [
        {
          id: 'employee-123',
          employee_id: 'EMP001',
          user_id: 'user-123',
          first_name: '홍길동',
          last_name: '홍',
          email: 'hong.gd@example.com',
          phone: '010-1234-5678',
          department: '개발팀',
          position: '시니어 개발자',
          employment_type: 'full-time',
          hire_date: '2025-01-15',
          salary: 5000000,
          status: 'active',
          address: '서울시 강남구',
          emergency_contact: '{}',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ]

      const filters: EmployeeFilters = { department: '개발팀' }

      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE 1=1 AND department = $1 ORDER BY created_at DESC',
        {
          rows: mockEmployees,
        },
      )

      const result = await employeeService.list(filters)

      expect(result).toEqual(mockEmployees)
      expect(result).toHaveLength(1)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining('AND department = $1'),
        ['개발팀'],
      )
    })

    it('상태별 필터로 직원을 조회해야 함', async () => {
      const mockEmployees = [
        {
          id: 'employee-125',
          employee_id: 'EMP003',
          user_id: 'user-125',
          first_name: '이영희',
          last_name: '이',
          email: 'lee.yh@example.com',
          phone: '010-5555-1234',
          department: 'HR팀',
          position: 'HR 매니저',
          employment_type: 'full-time',
          hire_date: '2024-12-01',
          salary: 4000000,
          status: 'terminated',
          address: '서울시 송파구',
          emergency_contact: '{}',
          created_at: '2024-12-01T08:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
        },
      ]

      const filters: EmployeeFilters = { status: 'terminated' }

      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE 1=1 AND status = $1 ORDER BY created_at DESC',
        {
          rows: mockEmployees,
        },
      )

      const result = await employeeService.list(filters)

      expect(result).toEqual(mockEmployees)
      expect(result).toHaveLength(1)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining('AND status = $1'),
        ['terminated'],
      )
    })

    it('페이지네이션으로 직원을 조회해야 함', async () => {
      const mockEmployees = [
        {
          id: 'employee-126',
          employee_id: 'EMP004',
          user_id: 'user-126',
          first_name: '박민수',
          last_name: '박',
          email: 'park.ms@example.com',
          phone: '010-7777-8888',
          department: '영업팀',
          position: '영업 대표',
          employment_type: 'full-time',
          hire_date: '2025-01-05',
          salary: 6000000,
          status: 'active',
          address: '서울시 종로구',
          emergency_contact: '{}',
          created_at: '2025-01-05T11:00:00Z',
          updated_at: '2025-01-05T11:00:00Z',
        },
      ]

      const filters: EmployeeFilters = { limit: 10, offset: 20 }

      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE 1=1 ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        {
          rows: mockEmployees,
        },
      )

      const result = await employeeService.list(filters)

      expect(result).toEqual(mockEmployees)
      expect(result).toHaveLength(1)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        [10, 20],
      )
    })

    it('복합 필터로 직원을 조회해야 함', async () => {
      const mockEmployees = [
        {
          id: 'employee-127',
          employee_id: 'EMP005',
          user_id: 'user-127',
          first_name: '최지영',
          last_name: '최',
          email: 'choi.jy@example.com',
          phone: '010-9999-0000',
          department: '개발팀',
          position: '주니어 개발자',
          employment_type: 'full-time',
          hire_date: '2025-01-20',
          salary: 3500000,
          status: 'active',
          address: '서울시 마포구',
          emergency_contact: '{}',
          created_at: '2025-01-20T14:00:00Z',
          updated_at: '2025-01-20T14:00:00Z',
        },
      ]

      const filters: EmployeeFilters = {
        department: '개발팀',
        status: 'active',
        limit: 5,
        offset: 0,
      }

      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE 1=1 AND department = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
        {
          rows: mockEmployees,
        },
      )

      const result = await employeeService.list(filters)

      expect(result).toEqual(mockEmployees)
      expect(result).toHaveLength(1)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining(
          'AND department = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
        ),
        ['개발팀', 'active', 5, 0],
      )
    })

    it('빈 직원 목록을 올바르게 처리해야 함', async () => {
      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE 1=1 ORDER BY created_at DESC',
        {
          rows: [],
        },
      )

      const result = await employeeService.list()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('데이터베이스 오류 시 에러를 던져야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      await expect(employeeService.list()).rejects.toThrow('Database connection failed')
    })
  })

  describe('update', () => {
    it('직원 정보를 성공적으로 수정해야 함', async () => {
      const updateData = {
        first_name: '홍길동',
        last_name: '홍',
        email: 'hong.gd@example.com',
        phone: '010-1234-5678',
        department: '개발팀',
        position: '시니어 개발자',
        salary: 5500000,
        status: 'active',
        address: '서울시 강남구',
        emergency_contact: {
          name: '홍부인',
          phone: '010-9876-5432',
          relationship: '배우자',
        },
      }

      const mockUpdatedEmployee = {
        id: 'employee-123',
        employee_id: 'EMP001',
        user_id: 'user-123',
        first_name: '홍길동',
        last_name: '홍',
        email: 'hong.gd@example.com',
        phone: '010-1234-5678',
        department: '개발팀',
        position: '시니어 개발자',
        employment_type: 'full-time',
        hire_date: '2025-01-15',
        salary: 5500000,
        status: 'active',
        address: '서울시 강남구',
        emergency_contact: JSON.stringify({
          name: '홍부인',
          phone: '010-9876-5432',
          relationship: '배우자',
        }),
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T11:00:00Z',
      }

      DBHelper.mockQueryResponse(
        'UPDATE employees SET first_name = $2, last_name = $3, email = $4, phone = $5, department = $6, position = $7, salary = $8, status = $9, address = $10, emergency_contact = $11, updated_at = now() WHERE id = $1',
        {
          rows: [mockUpdatedEmployee],
        },
      )

      const result = await employeeService.update('employee-123', updateData)

      expect(result).toEqual(mockUpdatedEmployee)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE employees SET'),
        expect.arrayContaining([
          'employee-123',
          '홍길동',
          '홍',
          'hong.gd@example.com',
          '010-1234-5678',
          '개발팀',
          '시니어 개발자',
          5500000,
          'active',
          '서울시 강남구',
          JSON.stringify({
            name: '홍부인',
            phone: '010-9876-5432',
            relationship: '배우자',
          }),
        ]),
      )
    })

    it('일부 필드만 수정해야 함', async () => {
      const updateData = {
        salary: 6000000,
        position: '팀장',
      }

      const mockUpdatedEmployee = {
        id: 'employee-123',
        employee_id: 'EMP001',
        user_id: 'user-123',
        first_name: '홍길동',
        last_name: '홍',
        email: 'hong.gd@example.com',
        phone: '010-1234-5678',
        department: '개발팀',
        position: '팀장',
        employment_type: 'full-time',
        hire_date: '2025-01-15',
        salary: 6000000,
        status: 'active',
        address: '서울시 강남구',
        emergency_contact: '{}',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T12:00:00Z',
      }

      DBHelper.mockQueryResponse(
        'UPDATE employees SET salary = $2, position = $3, updated_at = now() WHERE id = $1',
        {
          rows: [mockUpdatedEmployee],
        },
      )

      const result = await employeeService.update('employee-123', updateData)

      expect(result).toEqual(mockUpdatedEmployee)
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining(
          'UPDATE employees SET salary = $2, position = $3, updated_at = now() WHERE id = $1',
        ),
        ['employee-123', 6000000, '팀장'],
      )
    })

    it('업데이트할 데이터가 없을 시 에러를 던져야 함', async () => {
      const updateData = {}

      await expect(employeeService.update('employee-123', updateData)).rejects.toThrow(
        '업데이트할 데이터가 없습니다.',
      )
    })

    it('존재하지 않는 직원 수정 시 에러를 던져야 함', async () => {
      const updateData = { salary: 6000000 }

      DBHelper.mockQueryResponse(
        'UPDATE employees SET salary = $2, updated_at = now() WHERE id = $1',
        {
          rows: [],
        },
      )

      await expect(employeeService.update('non-existent', updateData)).rejects.toThrow(
        '직원을 찾을 수 없습니다.',
      )
    })

    it('데이터베이스 오류 시 에러를 던져야 함', async () => {
      const updateData = { salary: 6000000 }

      DBHelper.mockError(new Error('Database connection failed'))

      await expect(employeeService.update('employee-123', updateData)).rejects.toThrow(
        'Database connection failed',
      )
    })
  })

  describe('delete', () => {
    it('직원을 성공적으로 삭제해야 함', async () => {
      DBHelper.mockQueryResponse('DELETE FROM employees WHERE id = $1', {
        rows: [],
      })

      await employeeService.delete('employee-123')

      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith('DELETE FROM employees WHERE id = $1', [
        'employee-123',
      ])
    })

    it('데이터베이스 오류 시 에러를 던져야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      await expect(employeeService.delete('employee-123')).rejects.toThrow(
        'Database connection failed',
      )
    })
  })

  describe('terminate', () => {
    it('직원을 성공적으로 퇴사 처리해야 함', async () => {
      const mockTerminatedEmployee = {
        id: 'employee-123',
        employee_id: 'EMP001',
        user_id: 'user-123',
        first_name: '홍길동',
        last_name: '홍',
        email: 'hong.gd@example.com',
        phone: '010-1234-5678',
        department: '개발팀',
        position: '시니어 개발자',
        employment_type: 'full-time',
        hire_date: '2025-01-15',
        salary: 5000000,
        status: 'terminated',
        address: '서울시 강남구',
        emergency_contact: '{}',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T15:00:00Z',
      }

      DBHelper.mockQueryResponse(
        'UPDATE employees SET status = $2, updated_at = now() WHERE id = $1',
        {
          rows: [mockTerminatedEmployee],
        },
      )

      const result = await employeeService.terminate('employee-123')

      expect(result).toEqual(mockTerminatedEmployee)
      expect(result.status).toBe('terminated')
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith(
        expect.stringContaining(
          'UPDATE employees SET status = $2, updated_at = now() WHERE id = $1',
        ),
        ['employee-123', 'terminated'],
      )
    })

    it('존재하지 않는 직원 퇴사 처리 시 에러를 던져야 함', async () => {
      DBHelper.mockQueryResponse(
        'UPDATE employees SET status = $2, updated_at = now() WHERE id = $1',
        {
          rows: [],
        },
      )

      await expect(employeeService.terminate('non-existent')).rejects.toThrow(
        '직원을 찾을 수 없습니다.',
      )
    })

    it('데이터베이스 오류 시 에러를 던져야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      await expect(employeeService.terminate('employee-123')).rejects.toThrow(
        'Database connection failed',
      )
    })
  })

  describe('Integration tests', () => {
    it('전체 직원 관리 워크플로우가 올바르게 작동해야 함', async () => {
      // 1. 직원 생성
      const employeeData: CreateEmployeeDto = {
        employee_id: 'EMP001',
        first_name: '홍길동',
        last_name: '홍',
        email: 'hong.gd@example.com',
        department: '개발팀',
        position: '시니어 개발자',
        salary: 5000000,
        status: 'active',
      }

      const mockCreatedEmployee = {
        id: 'employee-123',
        employee_id: 'EMP001',
        user_id: null,
        first_name: '홍길동',
        last_name: '홍',
        email: 'hong.gd@example.com',
        phone: null,
        department: '개발팀',
        position: '시니어 개발자',
        employment_type: 'full-time',
        hire_date: null,
        salary: 5000000,
        status: 'active',
        address: null,
        emergency_contact: '{}',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      // 2. 직원 조회
      DBHelper.mockQueryResponse('INSERT INTO employees', {
        rows: [mockCreatedEmployee],
      })

      DBHelper.mockQueryResponse(
        'SELECT id, employee_id, user_id, first_name, last_name, email, phone, department, position, employment_type, hire_date::text as hire_date, salary, status, address, emergency_contact, created_at::text as created_at, updated_at::text as updated_at FROM employees WHERE id = $1',
        {
          rows: [mockCreatedEmployee],
        },
      )

      // 3. 직원 수정
      const mockUpdatedEmployee = {
        ...mockCreatedEmployee,
        salary: 5500000,
        position: '팀장',
        updated_at: '2025-01-15T11:00:00Z',
      }

      DBHelper.mockQueryResponse(
        'UPDATE employees SET salary = $2, position = $3, updated_at = now() WHERE id = $1',
        {
          rows: [mockUpdatedEmployee],
        },
      )

      // 4. 직원 퇴사 처리
      const mockTerminatedEmployee = {
        ...mockUpdatedEmployee,
        status: 'terminated',
        updated_at: '2025-01-15T15:00:00Z',
      }

      DBHelper.mockQueryResponse(
        'UPDATE employees SET status = $2, updated_at = now() WHERE id = $1',
        {
          rows: [mockTerminatedEmployee],
        },
      )

      // 5. 직원 삭제
      DBHelper.mockQueryResponse('DELETE FROM employees WHERE id = $1', {
        rows: [],
      })

      // 직원 생성
      const createResult = await employeeService.create(employeeData)
      expect(createResult.employee_id).toBe('EMP001')
      expect(createResult.status).toBe('active')

      // 직원 조회
      const getResult = await employeeService.getById('employee-123')
      expect(getResult?.employee_id).toBe('EMP001')
      expect(getResult?.first_name).toBe('홍길동')

      // 직원 수정
      const updateResult = await employeeService.update('employee-123', {
        salary: 5500000,
        position: '팀장',
      })
      expect(updateResult.salary).toBe(5500000)
      expect(updateResult.position).toBe('팀장')

      // 직원 퇴사 처리
      const terminateResult = await employeeService.terminate('employee-123')
      expect(terminateResult.status).toBe('terminated')

      // 직원 삭제
      await employeeService.delete('employee-123')
      expect(DBHelper.getMockQuery()).toHaveBeenCalledWith('DELETE FROM employees WHERE id = $1', [
        'employee-123',
      ])
    })

    it('다양한 직원 타입과 상태를 올바르게 처리해야 함', async () => {
      const testCases = [
        {
          data: {
            employee_id: 'EMP001',
            first_name: '홍길동',
            last_name: '홍',
            email: 'hong.gd@example.com',
            department: '개발팀',
            position: '시니어 개발자',
            employment_type: 'full-time' as const,
            salary: 5000000,
            status: 'active' as const,
          },
          expectedType: 'full-time',
          expectedStatus: 'active',
        },
        {
          data: {
            employee_id: 'EMP002',
            first_name: '김철수',
            last_name: '김',
            email: 'kim.cs@example.com',
            department: '마케팅팀',
            position: '마케팅 매니저',
            employment_type: 'part-time' as const,
            salary: 3000000,
            status: 'active' as const,
          },
          expectedType: 'part-time',
          expectedStatus: 'active',
        },
        {
          data: {
            employee_id: 'EMP003',
            first_name: '이영희',
            last_name: '이',
            email: 'lee.yh@example.com',
            department: 'HR팀',
            position: 'HR 매니저',
            employment_type: 'contract' as const,
            salary: 4000000,
            status: 'inactive' as const,
          },
          expectedType: 'contract',
          expectedStatus: 'inactive',
        },
      ]

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]
        const mockEmployee = {
          id: `employee-test-${i}`,
          ...testCase.data,
          user_id: null,
          phone: null,
          hire_date: null,
          address: null,
          emergency_contact: '{}',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        }

        DBHelper.reset()

        DBHelper.mockQueryResponse('INSERT INTO employees', {
          rows: [mockEmployee],
        })

        const result = await employeeService.create(testCase.data)

        expect(result.employment_type).toBe(testCase.expectedType)
        expect(result.status).toBe(testCase.expectedStatus)
      }
    })
  })
})
