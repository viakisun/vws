<script lang="ts">
  import AuditDashboard from '$lib/components/asset/audit/AuditDashboard.svelte'
  import CertificationList from '$lib/components/asset/certifications/CertificationList.svelte'
  import IpAssetList from '$lib/components/asset/ip/IpAssetList.svelte'
  import AssetList from '$lib/components/asset/physical/AssetList.svelte'
  import AssetRequestList from '$lib/components/asset/requests/AssetRequestList.svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import type {
    Asset,
    AssetAudit,
    AssetDashboardStats,
    AssetRequest,
    CompanyCertification,
    IntellectualProperty,
  } from '$lib/types/asset'
  import {
    CalendarIcon,
    CarIcon,
    CheckSquareIcon,
    FileCheckIcon,
    FileTextIcon,
    PackageIcon,
  } from 'lucide-svelte'
  import { onMount } from 'svelte'
  import type { PageData } from './$types'

  const { data }: { data: PageData } = $props()

  // 상태 관리
  let activeTab = $state('overview')
  let showAssetForm = $state(false)
  let editingAsset = $state<Asset | null>(null)

  // 데이터 상태
  let physicalAssets = $state<Asset[]>([])
  let ipAssets = $state<IntellectualProperty[]>([])
  let certifications = $state<CompanyCertification[]>([])
  let requests = $state<AssetRequest[]>([])
  let audits = $state<AssetAudit[]>([])
  let auditSummary = $state<AssetDashboardStats | null>(null)
  let loading = $state(true)

  // 탭 구성
  const tabs = [
    { id: 'overview', label: '개요', icon: PackageIcon },
    { id: 'physical', label: '물리적 자산', icon: CarIcon },
    { id: 'ip', label: '지식재산권', icon: FileCheckIcon },
    { id: 'certifications', label: '인증/등록증', icon: FileTextIcon },
    { id: 'requests', label: '자산 신청', icon: CalendarIcon },
    { id: 'audit', label: '자산 실사', icon: CheckSquareIcon },
  ]

  // 데이터 로딩 함수들
  async function loadPhysicalAssets() {
    try {
      const response = await fetch('/api/assets')
      if (response.ok) {
        const result = await response.json()
        physicalAssets = result.data || []
      }
    } catch (error) {
      console.error('Failed to load physical assets:', error)
    }
  }

  async function loadIpAssets() {
    try {
      const response = await fetch('/api/assets/ip')
      if (response.ok) {
        const result = await response.json()
        ipAssets = result.data || []
      }
    } catch (error) {
      console.error('Failed to load IP assets:', error)
    }
  }

  async function loadCertifications() {
    try {
      const response = await fetch('/api/assets/certifications')
      if (response.ok) {
        const result = await response.json()
        certifications = result.data || []
      }
    } catch (error) {
      console.error('Failed to load certifications:', error)
    }
  }

  async function loadRequests() {
    try {
      const response = await fetch('/api/assets/requests')
      if (response.ok) {
        const result = await response.json()
        requests = result.data || []
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
    }
  }

  async function loadAudits() {
    try {
      const [auditsResponse, statsResponse] = await Promise.all([
        fetch('/api/assets/audit'),
        fetch('/api/assets/audit/stats'),
      ])

      if (auditsResponse.ok) {
        const result = await auditsResponse.json()
        audits = result.data || []
      }

      if (statsResponse.ok) {
        const result = await statsResponse.json()
        auditSummary = result.data || null
      }
    } catch (error) {
      console.error('Failed to load audits:', error)
    }
  }

  onMount(async () => {
    await Promise.all([
      loadPhysicalAssets(),
      loadIpAssets(),
      loadCertifications(),
      loadRequests(),
      loadAudits(),
    ])
    loading = false
  })

  // 탭 변경 핸들러
  function handleNavigate(tab: string) {
    activeTab = tab
  }

  // 통계 데이터
  const stats = $derived({
    totalAssets: data.stats?.assets?.total || 0,
    availableAssets: data.stats?.assets?.available || 0,
    inUseAssets: data.stats?.assets?.in_use || 0,
    maintenanceAssets: data.stats?.assets?.maintenance || 0,
    totalValue: data.stats?.assets?.total_value || 0,
    pendingRequests: data.stats?.requests?.pending || 0,
    overdueReturns: 0, // TODO: add to stats
    expiringIps: data.stats?.ips?.expiring_soon || 0,
    expiringCertifications: data.stats?.certifications?.expiring_soon || 0,
  })
</script>

<svelte:head>
  <title>자산 관리 - VWS</title>
</svelte:head>

<PageLayout title="자산 관리">
  <!-- 탭 네비게이션 -->
  <div class="mb-6">
    <nav class="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      {#each tabs as tab}
        {@const Icon = tab.icon}
        <button
          type="button"
          onclick={() => handleNavigate(tab.id)}
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
            {activeTab === tab.id
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}"
        >
          <Icon size={16} stroke-width={1.5} />
          {tab.label}
        </button>
      {/each}
    </nav>
  </div>

  <!-- 탭 콘텐츠 -->
  {#if activeTab === 'overview'}
    <!-- 개요 탭 -->
    <div class="space-y-6">
      <!-- 통계 카드 -->
      <ThemeGrid cols={1} mdCols={2} lgCols={4} gap={4}>
        <ThemeCard variant="default">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">총 자산</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalAssets}개
              </p>
            </div>
            <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <PackageIcon size={24} class="text-blue-600 dark:text-blue-400" stroke-width={1.5} />
            </div>
          </div>
        </ThemeCard>

        <ThemeCard variant="default">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">사용 가능</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.availableAssets}개
              </p>
            </div>
            <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckSquareIcon
                size={24}
                class="text-green-600 dark:text-green-400"
                stroke-width={1.5}
              />
            </div>
          </div>
        </ThemeCard>

        <ThemeCard variant="default">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">사용 중</p>
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.inUseAssets}개
              </p>
            </div>
            <div class="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <CarIcon size={24} class="text-orange-600 dark:text-orange-400" stroke-width={1.5} />
            </div>
          </div>
        </ThemeCard>

        <ThemeCard variant="default">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">총 자산 가치</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {new Intl.NumberFormat('ko-KR').format(stats.totalValue)}원
              </p>
            </div>
            <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <PackageIcon
                size={24}
                class="text-purple-600 dark:text-purple-400"
                stroke-width={1.5}
              />
            </div>
          </div>
        </ThemeCard>
      </ThemeGrid>

      <!-- 빠른 액션 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ThemeCard variant="outlined">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">빠른 액션</h3>
          <div class="space-y-3">
            <ThemeButton
              variant="secondary"
              class="w-full justify-start"
              onclick={() => handleNavigate('requests')}
            >
              <CalendarIcon size={16} stroke-width={1.5} />
              자산 신청하기
            </ThemeButton>
            <ThemeButton
              variant="secondary"
              class="w-full justify-start"
              onclick={() => handleNavigate('physical')}
            >
              <CarIcon size={16} stroke-width={1.5} />
              자산 목록 보기
            </ThemeButton>
            <ThemeButton
              variant="secondary"
              class="w-full justify-start"
              onclick={() => handleNavigate('ip')}
            >
              <FileCheckIcon size={16} stroke-width={1.5} />
              지식재산권 관리
            </ThemeButton>
          </div>
        </ThemeCard>

        <ThemeCard variant="outlined">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">알림 현황</h3>
          <div class="space-y-3">
            {#if stats.pendingRequests > 0}
              <div
                class="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
              >
                <span class="text-sm text-gray-700 dark:text-gray-300">승인 대기 신청</span>
                <span
                  class="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full"
                >
                  {stats.pendingRequests}건
                </span>
              </div>
            {/if}
            {#if stats.overdueReturns > 0}
              <div
                class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                <span class="text-sm text-gray-700 dark:text-gray-300">연체된 반납</span>
                <span
                  class="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full"
                >
                  {stats.overdueReturns}건
                </span>
              </div>
            {/if}
            {#if stats.expiringIps > 0}
              <div
                class="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
              >
                <span class="text-sm text-gray-700 dark:text-gray-300">만료 임박 IP</span>
                <span
                  class="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full"
                >
                  {stats.expiringIps}건
                </span>
              </div>
            {/if}
            {#if stats.expiringCertifications > 0}
              <div
                class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <span class="text-sm text-gray-700 dark:text-gray-300">만료 임박 인증</span>
                <span
                  class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {stats.expiringCertifications}건
                </span>
              </div>
            {/if}
          </div>
        </ThemeCard>
      </div>
    </div>
  {:else if activeTab === 'physical'}
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">물리적 자산 관리</h3>
        <ThemeButton variant="primary" onclick={() => (showAssetForm = true)}>
          새 자산 추가
        </ThemeButton>
      </div>

      {#if loading}
        <div class="text-center py-8">
          <p class="text-gray-400">로딩 중...</p>
        </div>
      {:else}
        <AssetList
          assets={physicalAssets}
          onEdit={(asset) => {
            editingAsset = asset
            showAssetForm = true
          }}
          onAdd={() => (showAssetForm = true)}
        />
      {/if}
    </div>
  {:else if activeTab === 'ip'}
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">지식재산권 관리</h3>
        <ThemeButton variant="primary">새 IP 등록</ThemeButton>
      </div>

      {#if loading}
        <div class="text-center py-8">
          <p class="text-gray-400">로딩 중...</p>
        </div>
      {:else}
        <IpAssetList {ipAssets} />
      {/if}
    </div>
  {:else if activeTab === 'certifications'}
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">인증/등록증 관리</h3>
        <ThemeButton variant="primary">새 인증 등록</ThemeButton>
      </div>

      {#if loading}
        <div class="text-center py-8">
          <p class="text-gray-400">로딩 중...</p>
        </div>
      {:else}
        <CertificationList {certifications} />
      {/if}
    </div>
  {:else if activeTab === 'requests'}
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">자산 신청</h3>
        <ThemeButton variant="primary">새 신청</ThemeButton>
      </div>

      {#if loading}
        <div class="text-center py-8">
          <p class="text-gray-400">로딩 중...</p>
        </div>
      {:else}
        <AssetRequestList {requests} />
      {/if}
    </div>
  {:else if activeTab === 'audit'}
    {#if loading}
      <div class="text-center py-8">
        <p class="text-gray-400">로딩 중...</p>
      </div>
    {:else if auditSummary}
      <AuditDashboard
        {audits}
        summary={auditSummary}
        onStartAudit={() => {}}
        onViewAudit={() => {}}
        onContinueAudit={() => {}}
      />
    {:else}
      <ThemeCard variant="default">
        <p class="text-center py-8 text-gray-400">실사 데이터를 불러올 수 없습니다</p>
      </ThemeCard>
    {/if}
  {/if}
</PageLayout>
