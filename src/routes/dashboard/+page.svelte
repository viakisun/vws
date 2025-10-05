<script lang="ts">
  import type { User } from '$lib/auth/user-service'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  let user: User | null = $state(data.user)

  // Quick actions based on user role
  const quickActions = [
    {
      title: '재무관리',
      description: '거래내역 및 재무 데이터 관리',
      href: '/finance',
      icon: '💰',
      roles: ['ADMIN', 'MANAGER']
    },
    {
      title: '인사관리',
      description: '직원 정보 및 인사 데이터 관리',
      href: '/hr',
      icon: '👥',
      roles: ['ADMIN', 'MANAGER']
    },
    {
      title: '연구개발',
      description: '프로젝트 및 연구개발 관리',
      href: '/project-management',
      icon: '🔬',
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE']
    },
    {
      title: '급여관리',
      description: '급여 및 급여명세서 관리',
      href: '/salary',
      icon: '💳',
      roles: ['ADMIN', 'MANAGER']
    }
  ]

  // Filter actions based on user role
  const availableActions = quickActions.filter(action => 
    action.roles.includes(user?.role || '')
  )
</script>

<svelte:head>
  <title>대시보드 - VWS</title>
</svelte:head>

<div class="space-y-6">
  <!-- Welcome Section -->
  <div class="bg-white rounded-lg shadow p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">
      안녕하세요, {user?.name || '사용자'}님! 👋
    </h1>
    <p class="text-gray-600">
      VWS(VIA Work System)에 오신 것을 환영합니다. 오늘도 좋은 하루 되세요!
    </p>
  </div>

  <!-- User Info Card -->
  <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow text-white p-6">
    <div class="flex items-center space-x-4">
      {#if user?.picture}
        <img 
          src={user.picture} 
          alt={user.name}
          class="w-16 h-16 rounded-full border-4 border-white/20"
        />
      {:else}
        <div class="w-16 h-16 rounded-full border-4 border-white/20 bg-white/20 flex items-center justify-center text-2xl font-bold">
          {user?.name?.charAt(0) || 'U'}
        </div>
      {/if}
      <div>
        <h2 class="text-xl font-semibold">{user?.name || '사용자'}</h2>
        <p class="text-blue-100">{user?.role || 'EMPLOYEE'} • {user?.email || ''}</p>
        <p class="text-sm text-blue-100">마지막 로그인: {user?.last_login ? new Date(user.last_login).toLocaleString('ko-KR') : '방금 전'}</p>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each availableActions as action (action.title)}
      <a 
        href={action.href}
        class="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200 border border-gray-200 hover:border-blue-300"
      >
        <div class="text-4xl mb-4">{action.icon}</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
        <p class="text-gray-600 text-sm">{action.description}</p>
      </a>
    {/each}
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">총 프로젝트</p>
          <p class="text-2xl font-bold text-gray-900">12</p>
        </div>
        <div class="text-3xl">📊</div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">진행중인 작업</p>
          <p class="text-2xl font-bold text-gray-900">5</p>
        </div>
        <div class="text-3xl">⚡</div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">이번 달 완료</p>
          <p class="text-2xl font-bold text-gray-900">8</p>
        </div>
        <div class="text-3xl">✅</div>
      </div>
    </div>
  </div>
</div>