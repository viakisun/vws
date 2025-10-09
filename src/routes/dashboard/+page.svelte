<script lang="ts">
  import type { User } from '$lib/auth/user-service'
  import type { PageData } from './$types'
  import type {
    ProductWithOwner,
    ProductStatus,
    InitiativeWithOwner,
  } from '$lib/planner/types'
  import { formatKoreanName } from '$lib/utils/format'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import {
    ClockIcon,
    CalendarIcon,
    CreditCardIcon,
    FileTextIcon,
    DollarSignIcon,
    UsersIcon,
    FlaskConicalIcon,
    TrendingUpIcon,
    SettingsIcon,
    AlertCircleIcon,
    BanknoteIcon,
    TargetIcon,
    PackageIcon,
    ListTodoIcon,
    FlagIcon,
  } from 'lucide-svelte'

  const { data }: { data: PageData } = $props()

  // =============================================
  // Types
  // =============================================

  interface AttendanceStatus {
    today: string
    attendance: {
      id: string
      check_in_time: string | null
      check_out_time: string | null
      status: string
    } | null
    hasLeave: boolean
    leaveInfo: {
      id: string
      leave_type_id: string
      leave_type_name: string
      start_date: string
      end_date: string
    } | null
    isHoliday: boolean
    workStartTime: string
  }

  interface EmployeeInfo {
    id: string
    employee_id: string
    first_name: string
    last_name: string
    department: string
    position: string
    hire_date: string
    status: string
    employment_type: string
    phone: string
    birth_date: string
  }

  interface ExtendedUser extends User {
    employee?: EmployeeInfo
  }

  interface DashboardCard {
    title: string
    description: string
    href: string
    icon: any
    roles?: string[]
  }

  // =============================================
  // State
  // =============================================

  const user: ExtendedUser | null = $state(data.user as ExtendedUser | null)
  const products: ProductWithOwner[] = $state(data.products || [])
  const upcomingInitiatives: InitiativeWithOwner[] = $state(data.upcomingInitiatives || [])
  const attendanceStatus: AttendanceStatus | null = $state(data.attendanceStatus || null)

  // =============================================
  // Constants - Dashboard Cards
  // =============================================

  const PERSONAL_CARDS: DashboardCard[] = [
    {
      title: '출퇴근 현황',
      description: '오늘의 출퇴근 기록 및 근무시간',
      href: '/dashboard/attendance',
      icon: ClockIcon,
    },
    {
      title: '연차 현황',
      description: '잔여 연차 및 휴가 신청',
      href: '/dashboard/leave',
      icon: CalendarIcon,
    },
    {
      title: '급여명세서',
      description: '월별 급여명세서 조회',
      href: '/dashboard/payslip',
      icon: CreditCardIcon,
    },
    {
      title: '재직증명서',
      description: '재직증명서 발급 신청',
      href: '/dashboard/certificate',
      icon: FileTextIcon,
    },
  ]

  const WORK_CARDS: DashboardCard[] = [
    {
      title: '연구개발',
      description: '프로젝트 및 연구개발 관리',
      href: '/project-management',
      icon: FlaskConicalIcon,
      roles: ['ADMIN', 'RESEARCH_DIRECTOR', 'RESEARCHER'],
    },
    {
      title: 'Planner',
      description: '제품 및 이니셔티브 관리',
      href: '/planner/me',
      icon: TargetIcon,
      roles: ['ADMIN', 'RESEARCH_DIRECTOR', 'RESEARCHER'],
    },
  ]

  const ADMIN_CARDS: DashboardCard[] = [
    {
      title: '재무관리',
      description: '거래내역 및 재무 데이터 관리',
      href: '/finance',
      icon: BanknoteIcon,
      roles: ['ADMIN', 'FINANCE_MANAGER'],
    },
    {
      title: '급여관리',
      description: '급여 및 급여명세서 관리',
      href: '/salary',
      icon: DollarSignIcon,
      roles: ['ADMIN', 'FINANCE_MANAGER'],
    },
    {
      title: '인사관리',
      description: '직원 정보 및 인사 데이터 관리',
      href: '/hr',
      icon: UsersIcon,
      roles: ['ADMIN', 'MANAGEMENT'],
    },
    {
      title: '영업관리',
      description: '고객 및 영업 기회 관리',
      href: '/sales',
      icon: TrendingUpIcon,
      roles: ['ADMIN', 'SALES', 'MANAGEMENT'],
    },
    {
      title: '설정',
      description: '시스템 설정 및 구성',
      href: '/settings',
      icon: SettingsIcon,
      roles: ['ADMIN'],
    },
  ]

  // =============================================
  // Computed Values
  // =============================================

  const filteredWorkCards = $derived.by(() => {
    const userRole = user?.role || ''
    return WORK_CARDS.filter((card) => card.roles?.includes(userRole) || false)
  })

  const filteredAdminCards = $derived.by(() => {
    const userRole = user?.role || ''
    return ADMIN_CARDS.filter((card) => card.roles?.includes(userRole) || false)
  })

  const hasEmployeeInfo = $derived(!!user?.employee)

  const displayName = $derived.by(() => {
    if (user?.employee?.last_name && user?.employee?.first_name) {
      return formatKoreanName(user.employee.last_name, user.employee.first_name)
    }
    return user?.name || '사용자'
  })

  // =============================================
  // Helper Functions
  // =============================================

  function getAttendanceCardStyle(): {
    bgGradient: string
    borderColor: string
    iconBg: string
    iconColor: string
    isLate: boolean
  } {
    if (!attendanceStatus || !hasEmployeeInfo) {
      return {
        bgGradient: '',
        borderColor: '',
        iconBg: 'var(--color-primary-light)',
        iconColor: 'var(--color-primary)',
        isLate: false,
      }
    }

    const { attendance, hasLeave, isHoliday, workStartTime } = attendanceStatus
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    // Parse work start time (HH:MM:SS format)
    const [startHour, startMinute] = workStartTime.split(':').map(Number)
    const workStartMinutes = startHour * 60 + startMinute

    // Holiday or Leave - no color (normal)
    if (isHoliday || hasLeave) {
      return {
        bgGradient: '',
        borderColor: '',
        iconBg: 'var(--color-primary-light)',
        iconColor: 'var(--color-primary)',
        isLate: false,
      }
    }

    // Already checked in - green
    if (attendance?.check_in_time) {
      return {
        bgGradient:
          'linear-gradient(to bottom right, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.04))',
        borderColor: 'var(--color-green)',
        iconBg: 'var(--color-green-light)',
        iconColor: 'var(--color-green)',
        isLate: false,
      }
    }

    // Not checked in and past work start time - red (same as overdue initiatives)
    if (currentTime > workStartMinutes) {
      return {
        bgGradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        borderColor: '',
        iconBg: 'rgba(255, 255, 255, 0.2)',
        iconColor: '#ffffff',
        isLate: true,
      }
    }

    // Not checked in but before work start time - green (ready to check in)
    return {
      bgGradient:
        'linear-gradient(to bottom right, rgba(34, 197, 94, 0.06), rgba(34, 197, 94, 0.03))',
      borderColor: '',
      iconBg: 'var(--color-green-light)',
      iconColor: 'var(--color-green)',
      isLate: false,
    }
  }

  const attendanceCardStyle = $derived(getAttendanceCardStyle())

  function getProductStatusText(status: ProductStatus): string {
    switch (status) {
      case 'planning':
        return '기획'
      case 'development':
        return '개발'
      case 'beta':
        return '베타'
      case 'active':
        return '운영'
      case 'maintenance':
        return '유지보수'
      case 'sunset':
        return '종료예정'
      case 'archived':
        return '종료'
      default:
        return status
    }
  }

  function getProductStatusColor(status: ProductStatus): string {
    switch (status) {
      case 'planning':
        return 'var(--color-text-tertiary)'
      case 'development':
        return 'var(--color-blue)'
      case 'beta':
        return 'var(--color-purple)'
      case 'active':
        return 'var(--color-green)'
      case 'maintenance':
        return 'var(--color-orange)'
      case 'sunset':
        return 'var(--color-red)'
      case 'archived':
        return 'var(--color-text-tertiary)'
      default:
        return 'var(--color-text-secondary)'
    }
  }

  function getInitiativeStatusText(status: string): string {
    switch (status) {
      case 'inbox':
        return '대기'
      case 'active':
        return '진행중'
      case 'paused':
        return '보류'
      case 'shipped':
        return '완료'
      case 'abandoned':
        return '중단'
      default:
        return status
    }
  }

  function getInitiativeStatusColor(status: string): string {
    switch (status) {
      case 'inbox':
        return 'var(--color-text-tertiary)'
      case 'active':
        return 'var(--color-blue)'
      case 'paused':
        return 'var(--color-orange)'
      case 'shipped':
        return 'var(--color-green)'
      case 'abandoned':
        return 'var(--color-red)'
      default:
        return 'var(--color-text-secondary)'
    }
  }

  function getDDay(targetDate: string): {
    text: string
    isOverdue: boolean
    daysRemaining: number
    colorLevel: 'normal' | 'warning' | 'urgent' | 'overdue'
  } {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let text: string
    let isOverdue = false
    let colorLevel: 'normal' | 'warning' | 'urgent' | 'overdue' = 'normal'

    if (diffDays === 0) {
      text = 'D-Day'
      colorLevel = 'urgent'
    } else if (diffDays > 0) {
      text = `D-${diffDays}`
      if (diffDays <= 3) {
        colorLevel = 'urgent'
      } else if (diffDays <= 14) {
        colorLevel = 'warning'
      }
    } else {
      text = `D+${Math.abs(diffDays)}`
      isOverdue = true
      colorLevel = 'overdue'
    }

    return { text, isOverdue, daysRemaining: diffDays, colorLevel }
  }
</script>

<svelte:head>
  <title>대시보드 - VWS</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 space-y-8">
  <!-- Welcome Section -->
  <div>
    <h1 class="text-3xl font-bold mb-2" style:color="var(--color-text-primary)">
      안녕하세요, {displayName}님
    </h1>
    <p class="text-lg" style:color="var(--color-text-secondary)">오늘도 좋은 하루 되세요!</p>
  </div>

  {#if !hasEmployeeInfo}
    <ThemeCard
      variant="outlined"
      style="border-color: var(--color-orange); background: var(--color-orange-light);"
    >
      <div class="flex items-start gap-3">
        <AlertCircleIcon size={20} style="color: var(--color-orange);" />
        <div>
          <h3 class="font-semibold mb-1" style:color="var(--color-orange)">직원 정보 미등록</h3>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            관리자에게 문의하여 직원 정보를 등록해주세요. 등록 후 개인 업무 기능을 사용할 수
            있습니다.
          </p>
        </div>
      </div>
    </ThemeCard>
  {/if}

  <!-- Personal Features Section -->
  <section class="space-y-4">
    <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">개인 업무</h2>

    {#if hasEmployeeInfo}
      <ThemeGrid cols={1} mdCols={2} lgCols={4} gap={4}>
        {#each PERSONAL_CARDS as card, index (card.title)}
          {@const isAttendanceCard = index === 0}
          {@const cardStyle = isAttendanceCard ? attendanceCardStyle : null}
          {@const isLate = cardStyle?.isLate || false}
          {@const titleColor = isLate ? '#ffffff' : 'var(--color-text-primary)'}
          {@const descColor = isLate ? 'rgba(255, 255, 255, 0.9)' : 'var(--color-text-secondary)'}
          <a href={card.href} class="block">
            <ThemeCard
              variant="default"
              hover
              clickable
              style="background: {cardStyle?.bgGradient || ''}; {cardStyle?.borderColor
                ? `border: 1px solid ${cardStyle.borderColor};`
                : ''}"
            >
              <div class="flex items-start gap-3 mb-3">
                <div
                  class="p-2 rounded-lg"
                  style:background={cardStyle?.iconBg || 'var(--color-primary-light)'}
                  style:color={cardStyle?.iconColor || 'var(--color-primary)'}
                >
                  {#if card.icon}
                    <card.icon size={20} />
                  {/if}
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold mb-1" style:color={titleColor}>
                    {card.title}
                  </h3>
                </div>
              </div>
              <p class="text-sm" style:color={descColor}>
                {card.description}
              </p>
            </ThemeCard>
          </a>
        {/each}
      </ThemeGrid>
    {:else}
      <ThemeCard variant="default">
        <div class="text-center py-8">
          <AlertCircleIcon
            size={40}
            class="mx-auto mb-3"
            style="color: var(--color-text-tertiary);"
          />
          <p class="text-sm" style:color="var(--color-text-tertiary)">
            직원 정보가 등록되지 않아 개인 업무 기능을 사용할 수 없습니다.
          </p>
        </div>
      </ThemeCard>
    {/if}
  </section>

  <!-- My Products Section -->
  {#if products.length > 0}
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">내 제품</h2>
        <a
          href="/planner/products"
          class="text-sm hover:underline"
          style:color="var(--color-primary)"
        >
          전체 보기
        </a>
      </div>
      <ThemeGrid cols={1} mdCols={2} lgCols={3} gap={4}>
        {#each products as product (product.id)}
          {@const isDevelopment = product.status === 'development'}
          {@const isBeta = product.status === 'beta'}
          {@const isActive = product.status === 'active'}
          {@const isHighlighted = isDevelopment || isBeta || isActive}
          {@const statusColor = getProductStatusColor(product.status)}
          {@const bgStyle = isDevelopment
            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            : isBeta
              ? 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
              : isActive
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : ''}
          {@const textColor = isHighlighted ? '#ffffff' : 'var(--color-text-primary)'}
          {@const secondaryTextColor = isHighlighted
            ? 'rgba(255, 255, 255, 0.9)'
            : 'var(--color-text-secondary)'}
          {@const iconBg = isHighlighted
            ? 'rgba(255, 255, 255, 0.2)'
            : 'var(--color-primary-light)'}
          {@const iconColor = isHighlighted ? '#ffffff' : 'var(--color-primary)'}
          {@const borderColor = isHighlighted ? 'rgba(255, 255, 255, 0.3)' : 'var(--color-border)'}
          {@const badgeColor = isHighlighted ? '#ffffff' : statusColor}
          {@const badgeBorder = isHighlighted ? 'rgba(255, 255, 255, 0.5)' : statusColor}
          <a href="/planner/products/{product.id}" class="block">
            <ThemeCard variant="default" hover clickable style="background: {bgStyle}">
              <div class="flex items-start gap-3 mb-3">
                <div class="p-2 rounded-lg" style:background={iconBg} style:color={iconColor}>
                  <PackageIcon size={20} />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold" style:color={textColor}>
                      {product.name}
                    </h3>
                    <span
                      class="px-2.5 py-1 text-xs font-medium rounded border"
                      style:color={badgeColor}
                      style:border-color={badgeBorder}
                      style:opacity="0.9"
                    >
                      {getProductStatusText(product.status)}
                    </span>
                  </div>
                  <p class="text-sm line-clamp-2" style:color={secondaryTextColor}>
                    {product.description || '설명 없음'}
                  </p>
                </div>
              </div>
              <div
                class="pt-3 flex items-center gap-4 text-sm"
                style:border-top="1px solid {borderColor}"
                style:color={secondaryTextColor}
              >
                <div class="flex items-center gap-1">
                  <ListTodoIcon size={14} />
                  <span>{product.initiative_count || 0}개 이니셔티브</span>
                </div>
                <div class="flex items-center gap-1">
                  <FlagIcon size={14} />
                  <span>{product.milestone_count || 0}개 마일스톤</span>
                </div>
              </div>
            </ThemeCard>
          </a>
        {/each}
      </ThemeGrid>
    </section>
  {/if}

  <!-- Upcoming Initiatives Section -->
  {#if upcomingInitiatives.length > 0}
    <section class="space-y-4">
      <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">
        목표일 임박 이니셔티브
      </h2>
      <ThemeGrid cols={1} mdCols={2} lgCols={3} gap={4}>
        {#each upcomingInitiatives as initiative (initiative.id)}
          {@const dday = initiative.horizon ? getDDay(initiative.horizon) : null}
          {@const isOverdue = dday?.colorLevel === 'overdue' && initiative.status !== 'shipped'}
          {@const statusColor = getInitiativeStatusColor(initiative.status)}
          {@const bgStyle = isOverdue
            ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
            : dday?.colorLevel === 'urgent' && initiative.status !== 'shipped'
              ? 'linear-gradient(to bottom right, rgba(251, 146, 60, 0.15), rgba(251, 146, 60, 0.08))'
              : dday?.colorLevel === 'warning' && initiative.status !== 'shipped'
                ? 'linear-gradient(to bottom right, rgba(234, 179, 8, 0.08), rgba(234, 179, 8, 0.04))'
                : ''}
          {@const textColor = isOverdue ? '#ffffff' : 'var(--color-text-primary)'}
          {@const secondaryTextColor = isOverdue
            ? 'rgba(255, 255, 255, 0.9)'
            : 'var(--color-text-secondary)'}
          {@const iconColor = isOverdue ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-tertiary)'}
          {@const borderColor = isOverdue ? 'rgba(255, 255, 255, 0.3)' : 'var(--color-border)'}
          {@const ddayColor = isOverdue
            ? '#ffffff'
            : dday?.colorLevel === 'urgent'
              ? 'var(--color-orange)'
              : dday?.colorLevel === 'warning'
                ? 'var(--color-yellow)'
                : 'var(--color-text-secondary)'}
          {@const ddayBorderColor = isOverdue ? 'rgba(255, 255, 255, 0.5)' : ddayColor}
          {@const statusBadgeColor = isOverdue ? '#ffffff' : statusColor}
          {@const statusBadgeBorder = isOverdue ? 'rgba(255, 255, 255, 0.5)' : statusColor}
          <a href="/planner/initiatives/{initiative.id}" class="block">
            <ThemeCard variant="default" hover clickable style="background: {bgStyle}">
              <div class="space-y-3">
                <!-- D-Day Badge -->
                {#if dday}
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2.5 py-1 text-xs font-medium rounded border"
                      style:color={ddayColor}
                      style:border-color={ddayBorderColor}
                      style:opacity="0.9"
                    >
                      {dday.text}
                    </span>
                    <span
                      class="px-2.5 py-1 text-xs font-medium rounded border"
                      style:color={statusBadgeColor}
                      style:border-color={statusBadgeBorder}
                      style:opacity="0.9"
                    >
                      {getInitiativeStatusText(initiative.status)}
                    </span>
                  </div>
                {/if}

                <!-- Initiative Info -->
                <div>
                  <h3 class="font-semibold mb-1" style:color={textColor}>
                    {initiative.title}
                  </h3>
                  <p class="text-sm line-clamp-2" style:color={secondaryTextColor}>
                    {initiative.intent || '설명 없음'}
                  </p>
                </div>

                <!-- Details Info -->
                <div class="pt-3 space-y-1" style:border-top="1px solid {borderColor}">
                  {#if initiative.product}
                    <div class="flex items-center gap-2 text-sm">
                      <PackageIcon size={14} style="color: {iconColor};" />
                      <span style:color={secondaryTextColor}>
                        {initiative.product.name}
                      </span>
                    </div>
                  {/if}
                  {#if initiative.horizon}
                    <div class="flex items-center gap-2 text-sm">
                      <FlagIcon size={14} style="color: {iconColor};" />
                      <span style:color={secondaryTextColor}>
                        목표일: {new Date(initiative.horizon).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  {/if}
                </div>
              </div>
            </ThemeCard>
          </a>
        {/each}
      </ThemeGrid>
    </section>
  {/if}

  <!-- Work Features Section -->
  {#if filteredWorkCards.length > 0}
    <section class="space-y-4">
      <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">내 작업</h2>
      <ThemeGrid cols={1} mdCols={2} lgCols={4} gap={4}>
        {#each filteredWorkCards as card (card.title)}
          <a href={card.href} class="block">
            <ThemeCard variant="default" hover clickable>
              <div class="flex items-start gap-3 mb-3">
                <div
                  class="p-2 rounded-lg"
                  style:background="var(--color-blue-light)"
                  style:color="var(--color-blue)"
                >
                  {#if card.icon}
                    <card.icon size={20} />
                  {/if}
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold mb-1" style:color="var(--color-text-primary)">
                    {card.title}
                  </h3>
                </div>
              </div>
              <p class="text-sm" style:color="var(--color-text-secondary)">
                {card.description}
              </p>
            </ThemeCard>
          </a>
        {/each}
      </ThemeGrid>
    </section>
  {/if}

  <!-- Admin Features Section -->
  {#if filteredAdminCards.length > 0}
    <section class="space-y-4">
      <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">관리 기능</h2>
      <ThemeGrid cols={1} mdCols={2} lgCols={4} gap={4}>
        {#each filteredAdminCards as card (card.title)}
          <a href={card.href} class="block">
            <ThemeCard variant="default" hover clickable>
              <div class="flex items-start gap-3 mb-3">
                <div
                  class="p-2 rounded-lg"
                  style:background="var(--color-purple-light)"
                  style:color="var(--color-purple)"
                >
                  {#if card.icon}
                    <card.icon size={20} />
                  {/if}
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold mb-1" style:color="var(--color-text-primary)">
                    {card.title}
                  </h3>
                </div>
              </div>
              <p class="text-sm" style:color="var(--color-text-secondary)">
                {card.description}
              </p>
            </ThemeCard>
          </a>
        {/each}
      </ThemeGrid>
    </section>
  {/if}
</div>
