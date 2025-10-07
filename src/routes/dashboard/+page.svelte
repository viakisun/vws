<script lang="ts">
  import type { User } from '$lib/auth/user-service'
  import type { PageData } from './$types'

  const { data }: { data: PageData } = $props()

  // Extended user type with optional employee info
  interface EmployeeInfo {
    employee_id: string
    department: string
    position: string
    hire_date: string
  }

  interface ExtendedUser extends User {
    employee?: EmployeeInfo
  }

  const user: ExtendedUser | null = $state(data.user as ExtendedUser | null)

  // =============================================
  // Types
  // =============================================

  interface DashboardCard {
    title: string
    description: string
    href: string
    icon: string
    color: string
    iconColor: string
    roles?: string[]
  }

  interface StatCard {
    label: string
    value: string | number
    unit: string
    icon: string
  }

  // =============================================
  // Constants - Dashboard Cards
  // =============================================

  /**
   * Personal feature cards (available to all employees)
   */
  const PERSONAL_CARDS: DashboardCard[] = [
    {
      title: '출퇴근 현황',
      description: '오늘의 출퇴근 기록 및 근무시간',
      href: '/dashboard/attendance',
      icon: '🕐',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      title: '연차 현황',
      description: '잔여 연차 및 휴가 신청',
      href: '/dashboard/leave',
      icon: '📅',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
    },
    {
      title: '급여명세서',
      description: '월별 급여명세서 조회',
      href: '/dashboard/payslip',
      icon: '💳',
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
    },
    {
      title: '재직증명서',
      description: '재직증명서 발급 신청',
      href: '/dashboard/certificate',
      icon: '📄',
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-600',
    },
  ]

  /**
   * Admin feature cards (role-based access)
   */
  const ADMIN_CARDS: DashboardCard[] = [
    {
      title: '재무관리',
      description: '거래내역 및 재무 데이터 관리',
      href: '/finance',
      icon: '💰',
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: '인사관리',
      description: '직원 정보 및 인사 데이터 관리',
      href: '/hr',
      icon: '👥',
      color: 'bg-indigo-50 border-indigo-200',
      iconColor: 'text-indigo-600',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: '연구개발',
      description: '프로젝트 및 연구개발 관리',
      href: '/project-management',
      icon: '🔬',
      color: 'bg-teal-50 border-teal-200',
      iconColor: 'text-teal-600',
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: '영업관리',
      description: '고객 및 영업 기회 관리',
      href: '/sales',
      icon: '📈',
      color: 'bg-pink-50 border-pink-200',
      iconColor: 'text-pink-600',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: '급여관리',
      description: '급여 및 급여명세서 관리',
      href: '/salary',
      icon: '💳',
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: '설정',
      description: '시스템 설정 및 구성',
      href: '/settings',
      icon: '⚙️',
      color: 'bg-gray-50 border-gray-200',
      iconColor: 'text-gray-600',
      roles: ['ADMIN'],
    },
  ]

  /**
   * Mock statistics (TODO: Replace with real API data)
   */
  const MOCK_STATS: StatCard[] = [
    {
      label: '출근일수',
      value: 22,
      unit: '이번 달',
      icon: '🕐',
    },
    {
      label: '잔여 연차',
      value: 12,
      unit: '일',
      icon: '📅',
    },
    {
      label: '미확인 알림',
      value: 3,
      unit: '개',
      icon: '🔔',
    },
  ]

  // =============================================
  // Computed Values
  // =============================================

  /**
   * Filter admin cards based on user role
   */
  const filteredAdminCards = $derived.by(() => {
    const userRole = user?.role || ''
    return ADMIN_CARDS.filter((card) => card.roles?.includes(userRole) || false)
  })

  /**
   * Check if user has employee info
   */
  const hasEmployeeInfo = $derived(!!user?.employee)

  /**
   * Get user's display name
   */
  const displayName = $derived(user?.name || '사용자')

  /**
   * Get user's first initial for avatar
   */
  const userInitial = $derived(user?.name?.charAt(0) || 'U')

  /**
   * Format last login date
   */
  const lastLoginDisplay = $derived(() => {
    if (!user?.last_login) return '방금 전'
    return new Date(user.last_login).toLocaleString('ko-KR')
  })

  /**
   * Format hire date
   */
  const hireDateDisplay = $derived(() => {
    if (!user?.employee?.hire_date) return ''
    return new Date(user.employee.hire_date).toLocaleDateString('ko-KR')
  })
</script>

<svelte:head>
  <title>대시보드 - VWS</title>
</svelte:head>

<div class="space-y-6">
  <!-- Welcome Section -->
  <div class="bg-white rounded-lg shadow p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">안녕하세요, {displayName}님! 👋</h1>
    <p class="text-gray-600">
      VWS(VIA Work System)에 오신 것을 환영합니다. 오늘도 좋은 하루 되세요!
    </p>
  </div>

  <!-- User Info Card -->
  <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow text-white p-6">
    <div class="flex items-center space-x-4">
      <!-- User Avatar -->
      {#if user?.picture}
        <img
          src={user.picture}
          alt={user.name}
          class="w-16 h-16 rounded-full border-4 border-white/20"
        />
      {:else}
        <div
          class="w-16 h-16 rounded-full border-4 border-white/20 bg-white/20 flex items-center justify-center text-2xl font-bold"
        >
          {userInitial}
        </div>
      {/if}

      <!-- User Details -->
      <div class="flex-1">
        <h2 class="text-xl font-semibold">{displayName}</h2>
        <p class="text-blue-100">{user?.role || 'EMPLOYEE'} • {user?.email || ''}</p>
        <p class="text-sm text-blue-100">마지막 로그인: {lastLoginDisplay}</p>

        <!-- Employee Info -->
        {#if user?.employee}
          <div class="mt-2 p-2 bg-white/10 rounded-lg">
            <p class="text-sm font-medium">직원 정보</p>
            <p class="text-xs text-blue-100">
              사번: {user.employee.employee_id} • {user.employee.department} •
              {user.employee.position}
            </p>
            <p class="text-xs text-blue-100">입사일: {hireDateDisplay}</p>
          </div>
        {:else}
          <div class="mt-2 p-2 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
            <p class="text-sm font-medium text-yellow-100">⚠️ 직원 정보 없음</p>
            <p class="text-xs text-yellow-200">직원명부에서 해당 이메일을 찾을 수 없습니다.</p>
            <p class="text-xs text-yellow-200">관리자에게 문의하여 직원 정보를 등록해주세요.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Personal Features Section -->
  <section class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-900">개인 업무</h2>

    {#if hasEmployeeInfo}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each PERSONAL_CARDS as card (card.title)}
          <a
            href={card.href}
            class="block {card.color} rounded-lg shadow p-6 hover:shadow-lg transition-all duration-200 border hover:scale-105"
          >
            <div class="text-4xl mb-4 {card.iconColor}">{card.icon}</div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
            <p class="text-gray-600 text-sm">{card.description}</p>
          </a>
        {/each}
      </div>
    {:else}
      <!-- Employee Info Required Notice -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div class="flex items-center space-x-3">
          <div class="text-4xl">⚠️</div>
          <div>
            <h3 class="text-lg font-semibold text-yellow-800 mb-2">
              개인 업무 기능을 사용할 수 없습니다
            </h3>
            <p class="text-yellow-700 mb-3">
              직원 정보가 등록되지 않아 출퇴근, 연차, 급여명세서 등의 개인 업무 기능을 사용할 수
              없습니다.
            </p>
            <div class="text-sm text-yellow-600">
              <p>• 관리자에게 문의하여 직원 정보를 등록해주세요</p>
              <p>• 등록 후에는 출퇴근, 연차관리, 급여명세서 조회가 가능합니다</p>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </section>

  <!-- Admin Features Section -->
  {#if filteredAdminCards.length > 0}
    <section class="space-y-6">
      <h2 class="text-xl font-semibold text-gray-900">관리 기능</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each filteredAdminCards as card (card.title)}
          <a
            href={card.href}
            class="block {card.color} rounded-lg shadow p-6 hover:shadow-lg transition-all duration-200 border hover:scale-105"
          >
            <div class="text-4xl mb-4 {card.iconColor}">{card.icon}</div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
            <p class="text-gray-600 text-sm">{card.description}</p>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Statistics Section -->
  <section class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-900">이번 달 현황</h2>

    {#if hasEmployeeInfo}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each MOCK_STATS as stat (stat.label)}
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">{stat.label}</p>
                <p class="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p class="text-xs text-gray-500">{stat.unit}</p>
              </div>
              <div class="text-3xl">{stat.icon}</div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <!-- Statistics Not Available Notice -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div class="flex items-center space-x-3">
          <div class="text-4xl">📊</div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">개인 통계를 불러올 수 없습니다</h3>
            <p class="text-gray-600">
              직원 정보가 등록되지 않아 출퇴근, 연차, 알림 등의 개인 통계를 표시할 수 없습니다.
            </p>
          </div>
        </div>
      </div>
    {/if}
  </section>
</div>
