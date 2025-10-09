<script lang="ts">
  import { onMount } from 'svelte'
  import { UsersIcon, CalendarIcon, TargetIcon } from 'lucide-svelte'
  import type { FormationWithMembers } from '$lib/planner/types'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'

  // =============================================
  // State
  // =============================================

  let formations = $state<FormationWithMembers[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)

  // =============================================
  // Data Fetching
  // =============================================

  async function loadData() {
    try {
      loading = true
      error = null

      const res = await fetch('/api/planner/formations')
      if (!res.ok) throw new Error('팀 로드 실패')

      const data = await res.json()
      formations = data.data || []
    } catch (e) {
      error = e instanceof Error ? e.message : '데이터 로드 실패'
      console.error('Error loading formations:', e)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadData()
  })

  // =============================================
  // Helpers
  // =============================================

  function getEnergyStateColor(state: string): string {
    switch (state) {
      case 'aligned':
        return 'green'
      case 'healthy':
        return 'blue'
      case 'strained':
        return 'orange'
      case 'blocked':
        return 'red'
      default:
        return 'gray'
    }
  }

  function getEnergyStateText(state: string): string {
    switch (state) {
      case 'aligned':
        return '정렬됨'
      case 'healthy':
        return '양호'
      case 'strained':
        return '부담'
      case 'blocked':
        return '차단됨'
      default:
        return state
    }
  }

  function getCadenceText(cadence: string): string {
    switch (cadence) {
      case 'daily':
        return '매일'
      case 'weekly':
        return '매주'
      case 'biweekly':
        return '격주'
      case 'async':
        return '비동기'
      default:
        return cadence
    }
  }

  // =============================================
  // Computed Values
  // =============================================

  const stats = $derived([
    {
      title: '전체 포메이션',
      value: formations.length,
      icon: UsersIcon,
      color: 'purple' as const,
    },
    {
      title: '총 멤버',
      value: formations.reduce((sum, f) => sum + (f.member_count || 0), 0),
      icon: UsersIcon,
      color: 'blue' as const,
    },
    {
      title: '진행 이니셔티브',
      value: formations.reduce((sum, f) => sum + (f.initiatives?.length || 0), 0),
      icon: TargetIcon,
      color: 'green' as const,
    },
  ])
</script>

<svelte:head>
  <title>포메이션 - 플래너</title>
</svelte:head>

{#if loading}
  <div class="text-center py-12">
    <div style:color="var(--color-text-secondary)">로딩 중...</div>
  </div>
{:else if error}
  <ThemeCard variant="outlined" class="border-red-200 bg-red-50">
    <p style:color="var(--color-error)">{error}</p>
  </ThemeCard>
{:else}
  <PageLayout
    title="포메이션"
    subtitle="프로젝트 실행을 위한 크로스펑셔널 포메이션 구성"
    {stats}
    actions={[
      { label: '새 포메이션 구성', variant: 'primary', icon: UsersIcon, href: '/planner/formations/new' },
    ]}
  >
    {#if formations.length === 0}
      <ThemeCard variant="default">
        <div class="text-center py-12">
          <UsersIcon
            size={48}
            class="mx-auto mb-4 opacity-30"
            style="color: var(--color-text-tertiary);"
          />
          <p class="text-sm mb-4" style:color="var(--color-text-secondary)">아직 포메이션이 없습니다</p>
          <a href="/planner/formations/new">
            <ThemeButton variant="primary" size="md">
              <UsersIcon size={18} />
              첫 포메이션 만들기
            </ThemeButton>
          </a>
        </div>
      </ThemeCard>
    {:else}
      <div class="grid gap-4">
        {#each formations as formation}
          {@const energyColor = getEnergyStateColor(formation.energy_state)}
          <a href="/planner/formations/{formation.id}" class="block">
            <ThemeCard variant="default" hover clickable>
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-semibold" style:color="var(--color-text-primary)">
                      {formation.name}
                    </h3>
                    <span
                      class="px-3 py-1 text-xs font-semibold rounded-lg"
                      style:background="var(--color-{energyColor}-light)"
                      style:color="var(--color-{energyColor})"
                    >
                      {getEnergyStateText(formation.energy_state)}
                    </span>
                  </div>
                  {#if formation.description}
                    <p class="text-sm line-clamp-2" style:color="var(--color-text-secondary)">
                      {formation.description}
                    </p>
                  {/if}
                </div>
              </div>

              <div
                class="flex items-center gap-6 text-sm"
                style:color="var(--color-text-secondary)"
              >
                <div class="flex items-center gap-2">
                  <UsersIcon size={14} />
                  <span>{formation.member_count || 0}명</span>
                </div>
                <div class="flex items-center gap-2">
                  <TargetIcon size={14} />
                  <span>{formation.initiatives?.length || 0}개 이니셔티브</span>
                </div>
                <div class="flex items-center gap-2">
                  <CalendarIcon size={14} />
                  <span>{getCadenceText(formation.cadence_type)}</span>
                </div>
                {#if formation.members && formation.members.length > 0}
                  <div class="ml-auto flex items-center gap-1 text-xs">
                    <span style:color="var(--color-text-tertiary)">멤버:</span>
                    <span class="font-medium" style:color="var(--color-text-primary)">
                      {formation.members
                        .slice(0, 3)
                        .map((m) => formatKoreanName(m.employee.last_name, m.employee.first_name))
                        .join(', ')}
                      {#if formation.members.length > 3}
                        <span style:color="var(--color-text-tertiary)"
                          >외 {formation.members.length - 3}명</span
                        >
                      {/if}
                    </span>
                  </div>
                {/if}
              </div>
            </ThemeCard>
          </a>
        {/each}
      </div>
    {/if}
  </PageLayout>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
