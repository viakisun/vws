<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import type { Employee, EmployeeLevel, EmployeeStatus, EmploymentType } from '$lib/types/hr'
  import { CalendarIcon, MailIcon, PhoneIcon, SaveIcon, UserIcon, XIcon } from '@lucide/svelte'
  import { createEventDispatcher } from 'svelte'

  interface Props {
    open: boolean
    employee?: Employee | null
    loading?: boolean
    departments?: string[]
    positions?: string[]
  }

  let { open, employee = null, loading = false, departments = [], positions = [] }: Props = $props()

  const dispatch = createEventDispatcher<{
    close: void
    save: Employee
  }>()

  // 폼 데이터
  let formData = $state<Partial<Employee>>({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    level: 'mid',
    employmentType: 'full-time',
    hireDate: '',
    birthDate: '',
    status: 'active',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    personalInfo: {
      birthDate: '',
      gender: 'other',
      nationality: '',
      maritalStatus: 'single'
    }
  })

  // 직원 레벨 옵션
  const levelOptions: { value: EmployeeLevel; label: string }[] = [
    { value: 'intern', label: '인턴' },
    { value: 'junior', label: '주니어' },
    { value: 'mid', label: '미드레벨' },
    { value: 'senior', label: '시니어' },
    { value: 'lead', label: '리드' },
    { value: 'manager', label: '매니저' },
    { value: 'director', label: '디렉터' }
  ]

  // 고용 형태 옵션
  const employmentTypeOptions: { value: EmploymentType; label: string }[] = [
    { value: 'full-time', label: '정규직' },
    { value: 'part-time', label: '파트타임' },
    { value: 'contract', label: '계약직' },
    { value: 'intern', label: '인턴' }
  ]

  // 직원 상태 옵션
  const statusOptions: { value: EmployeeStatus; label: string }[] = [
    { value: 'active', label: '재직중' },
    { value: 'inactive', label: '비활성' },
    { value: 'on-leave', label: '휴직중' },
    { value: 'terminated', label: '퇴사' }
  ]

  // 성별 옵션
  const genderOptions = [
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' },
    { value: 'other', label: '기타' }
  ]

  // 결혼 상태 옵션
  const maritalStatusOptions = [
    { value: 'single', label: '미혼' },
    { value: 'married', label: '기혼' },
    { value: 'divorced', label: '이혼' },
    { value: 'widowed', label: '사별' }
  ]

  // 비상 연락처 관계 옵션
  const relationshipOptions = [
    { value: 'spouse', label: '배우자' },
    { value: 'parent', label: '부모' },
    { value: 'child', label: '자녀' },
    { value: 'sibling', label: '형제자매' },
    { value: 'other', label: '기타' }
  ]

  // 직원 데이터가 변경될 때 폼 데이터 초기화
  $effect(() => {
    if (employee) {
      formData = {
        ...employee,
        emergencyContact: employee.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        personalInfo: employee.personalInfo || {
          birthDate: '',
          gender: 'other',
          nationality: '',
          maritalStatus: 'single'
        }
      }
    } else {
      // 새 직원 추가 시 기본값 설정
      formData = {
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        level: 'mid',
        employmentType: 'full-time',
        hireDate: new Date().toISOString().split('T')[0],
        birthDate: '',
        status: 'active',
        emergencyContact: {
          name: '',
          relationship: 'spouse',
          phone: ''
        },
        personalInfo: {
          birthDate: '',
          gender: 'other',
          nationality: '한국',
          maritalStatus: 'single'
        }
      }
    }
  })

  // 폼 유효성 검사
  function validateForm(): boolean {
    const requiredFields = [
      'employeeId',
      'name',
      'email',
      'phone',
      'department',
      'position',
      'hireDate'
    ]

    for (const field of requiredFields) {
      if (!formData[field as keyof Employee]) {
        // alert(`${getFieldLabel(field)}은(는) 필수 입력 항목입니다.`)
        return false
      }
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email!)) {
      // alert('올바른 이메일 형식을 입력해주세요.')
      return false
    }

    // 전화번호 형식 검사
    const phoneRegex = /^[0-9-+\s()]+$/
    if (!phoneRegex.test(formData.phone!)) {
      // alert('올바른 전화번호 형식을 입력해주세요.')
      return false
    }

    return true
  }

  // 필드 라벨 가져오기
  // function getFieldLabel(field: string): string {
  //   const labels: Record<string, string> = {
  //     employeeId: '사번',
  //     name: '이름',
  //     email: '이메일',
  //     phone: '전화번호',
  //     department: '부서',
  //     position: '직위',
  //     hireDate: '입사일'
  //   }
  //   return labels[field] || field
  // }

  // 저장 버튼 클릭
  function handleSave() {
    if (!validateForm()) return

    const employeeData: Employee = {
      ...formData,
      id: employee?.id || `emp_${Date.now()}`,
      createdAt: employee?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Employee

    dispatch('save', employeeData)
  }

  // 닫기 버튼 클릭
  function handleClose() {
    dispatch('close')
  }
</script>

<ThemeModal {open}>
  <div>
    <div>
      <h2>
        {employee ? '직원 정보 수정' : '새 직원 추가'}
      </h2>
      <button
        type="button"
        onclick={handleClose}>
        <XIcon size={20} />
      </button>
    </div>

    <form
      onsubmit={e => {
        e.preventDefault()
        handleSave()
      }}
    >
      <!-- 기본 정보 섹션 -->
      <div>
        <h3>
          <UserIcon size={20} />
          기본 정보
        </h3>
        <div>
          <div>
            <label for="employeeId">사번 *</label>
            <input
              id="employeeId"
              type="text"
              bind:value={formData.employeeId}
              placeholder="예: EMP001"
              required
            />
          </div>
          <div>
            <label for="name">이름 *</label>
            <input
              id="name"
              type="text"
              bind:value={formData.name}
              placeholder="홍길동"
              required />
          </div>
          <div>
            <label for="email">이메일 *</label>
            <input
              id="email"
              type="email"
              bind:value={formData.email}
              placeholder="hong@company.com"
              required
            />
          </div>
          <div>
            <label for="phone">전화번호 *</label>
            <input
              id="phone"
              type="tel"
              bind:value={formData.phone}
              placeholder="010-1234-5678"
              required
            />
          </div>
        </div>
      </div>

      <!-- 직무 정보 섹션 -->
      <div>
        <h3>
          <CalendarIcon size={20} />
          직무 정보
        </h3>
        <div>
          <div>
            <label for="department">부서 *</label>
            <select
              id="department"
              bind:value={formData.department}
              required>
              <option value="">부서 선택</option>
              {#each departments as dept (dept)}
                <option value={dept}>{dept}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="position">직위 *</label>
            <select
              id="position"
              bind:value={formData.position}
              required>
              <option value="">직위 선택</option>
              {#each positions as pos (pos)}
                <option value={pos}>{pos}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="level">레벨</label>
            <select
              id="level"
              bind:value={formData.level}>
              <option value="">레벨 선택</option>
              {#each levelOptions as option (option.value)}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="employmentType">고용 형태</label>
            <select
              id="employmentType"
              bind:value={formData.employmentType}>
              <option value="">고용 형태 선택</option>
              {#each employmentTypeOptions as option (option.value)}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="hireDate">입사일 *</label>
            <input
              id="hireDate"
              type="date"
              bind:value={formData.hireDate}
              required />
          </div>
          <div>
            <label for="birthDate">생년월일</label>
            <input
              id="birthDate"
              type="date"
              bind:value={formData.personalInfo.birthDate} />
          </div>
        </div>
      </div>

      <!-- 비상 연락처 섹션 -->
      <div>
        <h3>
          <PhoneIcon size={20} />
          비상 연락처
        </h3>
        <div>
          <div>
            <label for="emergencyName">이름</label>
            <input
              id="emergencyName"
              type="text"
              bind:value={formData.emergencyContact.name}
              placeholder="홍길순"
            />
          </div>
          <div>
            <label for="relationship">관계</label>
            <select
              id="relationship"
              bind:value={formData.emergencyContact.relationship}>
              <option value="">관계 선택</option>
              {#each relationshipOptions as option (option.value)}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="emergencyPhone">전화번호</label>
            <input
              id="emergencyPhone"
              type="tel"
              bind:value={formData.emergencyContact.phone}
              placeholder="010-9876-5432"
            />
          </div>
        </div>
      </div>

      <!-- 개인 정보 섹션 -->
      <div>
        <h3>
          <UserIcon size={20} />
          개인 정보
        </h3>
        <div>
          <div>
            <label for="gender">성별</label>
            <select
              id="gender"
              bind:value={formData.personalInfo.gender}>
              <option value="">성별 선택</option>
              {#each genderOptions as option (option.value)}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="nationality">국적</label>
            <input
              id="nationality"
              type="text"
              bind:value={formData.personalInfo.nationality}
              placeholder="한국"
            />
          </div>
          <div>
            <label for="maritalStatus">결혼 상태</label>
            <select
              id="maritalStatus"
              bind:value={formData.personalInfo.maritalStatus}>
              <option value="">결혼 상태 선택</option>
              {#each maritalStatusOptions as option (option.value)}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="address">주소</label>
            <input
              id="address"
              type="text"
              bind:value={formData.address}
              placeholder="서울시 강남구..."
            />
          </div>
        </div>
      </div>

      <!-- 상태 정보 섹션 -->
      {#if employee}
        <div>
          <h3>
            <MailIcon size={20} />
            상태 정보
          </h3>
          <div>
            <div>
              <label for="status">상태</label>
              <select
                id="status"
                bind:value={formData.status}>
                <option value="">상태 선택</option>
                {#each statusOptions as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
            {#if formData.status === 'terminated'}
              <div>
                <label for="terminationDate">퇴사일</label>
                <input
                  id="terminationDate"
                  type="date"
                  bind:value={formData.terminationDate} />
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- 버튼 영역 -->
      <div>
        <ThemeButton
          variant="ghost"
          onclick={handleClose}
          disabled={loading}>취소</ThemeButton>
        <ThemeButton
          variant="primary"
          disabled={loading}>
          {#if loading}
            <div></div>
          {:else}
            <SaveIcon size={16} />
          {/if}
          {employee ? '수정' : '추가'}
        </ThemeButton>
      </div>
    </form>
  </div>
</ThemeModal>
