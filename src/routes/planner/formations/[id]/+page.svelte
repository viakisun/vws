<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { UsersIcon, ZapIcon, TrashIcon, SettingsIcon, PencilIcon } from 'lucide-svelte'
  import type { FormationWithMembers, InitiativeWithOwner } from '$lib/planner/types'
  import AddMemberModal from '$lib/planner/components/AddMemberModal.svelte'
  import EditMemberModal from '$lib/planner/components/EditMemberModal.svelte'
  import LinkInitiativeModal from '$lib/planner/components/LinkInitiativeModal.svelte'
  import AllocationModal from '$lib/planner/components/AllocationModal.svelte'
  import FormationEditModal from '$lib/planner/components/FormationEditModal.svelte'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'

  // =============================================
  // State
  // =============================================

  let formation = $state<FormationWithMembers | null>(null)
  let formationInitiatives = $state<any[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let showAddMemberModal = $state(false)
  let showEditMemberModal = $state(false)
  let selectedMember = $state<any>(null)
  let showLinkInitiativeModal = $state(false)
  let showAllocationModal = $state(false)
  let selectedInitiative = $state<any>(null)
  let showFormationEditModal = $state(false)

  // =============================================
  // Data Fetching
  // =============================================

  async function loadData() {
    try {
      loading = true
      error = null

      const id = $page.params.id
      console.log('Loading formation data for:', id)

      const res = await fetch(`/api/planner/formations/${id}`)
      if (!res.ok) throw new Error('Failed to load formation')

      const data = await res.json()
      formation = data.data
      console.log('Formation loaded:', formation)

      // Load formation initiatives with allocation data
      await loadFormationInitiatives()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load data'
      console.error('Error loading formation:', e)
    } finally {
      loading = false
    }
  }

  async function loadFormationInitiatives() {
    const id = $page.params.id
    const res = await fetch(`/api/planner/formations/${id}/initiatives`)
    if (res.ok) {
      const data = await res.json()
      formationInitiatives = data.data || []
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
        return '차단'
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

  function getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'driver':
        return 'purple'
      case 'contributor':
        return 'blue'
      case 'advisor':
        return 'yellow'
      case 'observer':
        return 'gray'
      default:
        return 'gray'
    }
  }

  function getRoleText(role: string): string {
    switch (role) {
      case 'driver':
        return '드라이버'
      case 'contributor':
        return '기여자'
      case 'advisor':
        return '자문'
      case 'observer':
        return '참관자'
      default:
        return role
    }
  }

  function getBandwidthText(bandwidth: string): string {
    switch (bandwidth) {
      case 'full':
        return '100%'
      case 'partial':
        return '50%'
      case 'support':
        return '10%'
      default:
        return bandwidth
    }
  }

  function getInitiativeStateColor(state: string): string {
    switch (state) {
      case 'shaping':
        return 'purple'
      case 'active':
        return 'blue'
      case 'shipped':
        return 'green'
      case 'paused':
        return 'orange'
      case 'abandoned':
        return 'red'
      default:
        return 'gray'
    }
  }

  function getInitiativeStateText(state: string): string {
    switch (state) {
      case 'shaping':
        return '구체화'
      case 'active':
        return '진행 중'
      case 'shipped':
        return '완료'
      case 'paused':
        return '일시중지'
      case 'abandoned':
        return '중단'
      default:
        return state
    }
  }

  // =============================================
  // Actions
  // =============================================

  async function unlinkInitiative(initiativeId: string) {
    if (!confirm('이 이니셔티브 연결을 해제하시겠습니까?')) return

    try {
      const res = await fetch(
        `/api/planner/formations/${formation?.id}/initiatives?initiative_id=${initiativeId}`,
        {
          method: 'DELETE',
        },
      )

      if (res.ok) {
        await loadFormationInitiatives()
      }
    } catch (e) {
      console.error('Failed to unlink initiative:', e)
    }
  }

  async function deleteFormation() {
    if (
      !confirm('이 포메이션을 삭제하시겠습니까?\n연결된 이니셔티브와 멤버 정보도 모두 삭제됩니다.')
    )
      return

    try {
      const res = await fetch(`/api/planner/formations/${formation?.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        window.location.href = '/planner/formations'
      } else {
        const data = await res.json()
        alert(data.error || '포메이션 삭제 실패')
      }
    } catch (e) {
      console.error('Failed to delete formation:', e)
      alert('포메이션 삭제 실패')
    }
  }
</script>

<svelte:head>
  <title>{formation?.name || '포메이션'} - 플래너</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-6 space-y-6">
  {#if loading}
    <div class="text-center py-12">
      <div style:color="var(--color-text-secondary)">로딩 중...</div>
    </div>
  {:else if error || !formation}
    <ThemeCard variant="outlined" class="border-red-200 bg-red-50">
      <p style:color="var(--color-error)">{error || '포메이션을 찾을 수 없습니다'}</p>
    </ThemeCard>
  {:else}
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm" style:color="var(--color-text-secondary)">
      <a href="/planner" class="hover:opacity-70 transition">플래너</a>
      <span>/</span>
      <a href="/planner/formations" class="hover:opacity-70 transition">포메이션</a>
      <span>/</span>
      <span style:color="var(--color-text-primary)">{formation.name}</span>
    </div>

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold mb-2" style:color="var(--color-text-primary)">
          {formation.name}
        </h1>
        {#if formation.description}
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {formation.description}
          </p>
        {/if}
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          onclick={() => (showFormationEditModal = true)}
          class="p-2 rounded-lg transition hover:opacity-70"
          style:background="var(--color-surface-elevated)"
          style:color="var(--color-text-secondary)"
          title="포메이션 편집"
        >
          <PencilIcon size={16} />
        </button>
        <button
          type="button"
          onclick={() => deleteFormation()}
          class="p-2 rounded-lg transition hover:opacity-70"
          style:background="var(--color-surface-elevated)"
          style:color="var(--color-error)"
          title="포메이션 삭제"
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>

    <!-- Members Section -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold flex items-center" style:color="var(--color-text-primary)">
          <span class="mr-2" style:color="var(--color-blue-base)">
            <UsersIcon class="w-5 h-5" />
          </span>
          멤버 ({formation.member_count}명)
        </h2>
        <ThemeButton variant="secondary" size="sm" onclick={() => (showAddMemberModal = true)}>
          + 멤버 추가
        </ThemeButton>
      </div>

      <div class="space-y-2">
        {#each formation.members as member}
          {@const roleColor = getRoleBadgeColor(member.role)}
          <div
            class="flex items-center justify-between p-3 rounded-lg border"
            style:background="var(--color-surface-base)"
            style:border-color="var(--color-border)"
          >
            <div class="flex items-center gap-3 flex-1">
              <div>
                <p class="text-sm font-medium" style:color="var(--color-text-primary)">
                  {formatKoreanName(member.employee.last_name, member.employee.first_name)}
                </p>
                <p class="text-xs" style:color="var(--color-text-secondary)">
                  {member.employee.position || member.employee.department}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                style:background="var(--color-{roleColor}-light)"
                style:color="var(--color-{roleColor}-dark)"
              >
                {getRoleText(member.role)}
              </span>
              <span class="text-xs" style:color="var(--color-text-tertiary)">
                {getBandwidthText(member.bandwidth)}
              </span>
              <button
                type="button"
                onclick={() => {
                  selectedMember = member
                  showEditMemberModal = true
                }}
                class="p-1.5 rounded-lg transition hover:opacity-70"
                style:background="var(--color-surface-elevated)"
                style:color="var(--color-text-secondary)"
                title="멤버 편집"
              >
                <PencilIcon size={14} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Initiatives Section -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold flex items-center" style:color="var(--color-text-primary)">
          <span class="mr-2" style:color="var(--color-purple-base)">
            <ZapIcon class="w-5 h-5" />
          </span>
          이니셔티브 ({formationInitiatives.length}개)
        </h2>
        <ThemeButton variant="secondary" size="sm" onclick={() => (showLinkInitiativeModal = true)}>
          + 이니셔티브 연결
        </ThemeButton>
      </div>

      {#if formationInitiatives.length > 0}
        <div class="space-y-2">
          {#each formationInitiatives as item}
            {@const stateColor = getInitiativeStateColor(item.state)}
            <div
              class="p-3 rounded-lg border"
              style:background="var(--color-surface-base)"
              style:border-color="var(--color-border)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    {#if item.product_name}
                      <span class="text-sm font-light" style:color="var(--color-gray-500)">
                        {item.product_name}
                      </span>
                      <span class="text-sm font-light" style:color="var(--color-gray-400)">
                        /
                      </span>
                    {/if}
                    <a
                      href="/planner/initiatives/{item.initiative_id}"
                      class="text-sm font-medium hover:opacity-70 transition"
                      style:color="var(--color-text-primary)"
                    >
                      {item.title}
                    </a>
                    <span
                      class="px-2 py-0.5 text-xs font-medium rounded flex-shrink-0"
                      style:background="var(--color-{stateColor}-light)"
                      style:color="var(--color-{stateColor}-dark)"
                    >
                      {getInitiativeStateText(item.state)}
                    </span>
                  </div>
                  <p class="text-xs line-clamp-1 mb-2" style:color="var(--color-text-secondary)">
                    {item.intent}
                  </p>
                  <div class="flex items-center gap-3 text-xs">
                    <span style:color="var(--color-text-tertiary)">
                      담당: {formatKoreanName(item.owner.last_name, item.owner.first_name)}
                    </span>
                    <button
                      onclick={() => {
                        selectedInitiative = item
                        showAllocationModal = true
                      }}
                      class="font-medium hover:opacity-70 transition"
                      style:color="var(--color-primary)"
                    >
                      할당: {item.allocation_percentage || 100}%
                    </button>
                  </div>
                </div>
                <button
                  onclick={() => unlinkInitiative(item.initiative_id)}
                  class="flex-shrink-0 p-1 rounded hover:bg-red-50 transition"
                  title="연결 해제"
                >
                  <span style:color="var(--color-error)">
                    <TrashIcon class="w-4 h-4" />
                  </span>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8 rounded-lg border" style:border-color="var(--color-border)">
          <p class="text-sm" style:color="var(--color-text-tertiary)">
            아직 연결된 이니셔티브가 없습니다.
          </p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Modals -->
{#if formation}
  <AddMemberModal
    formationId={formation.id}
    isOpen={showAddMemberModal}
    onClose={() => {
      showAddMemberModal = false
    }}
    onSuccess={() => {
      loadData()
    }}
  />

  <EditMemberModal
    formationId={formation.id}
    member={selectedMember}
    isOpen={showEditMemberModal}
    onClose={() => {
      showEditMemberModal = false
      selectedMember = null
    }}
    onSuccess={() => {
      loadData()
    }}
    onDelete={() => {
      loadData()
    }}
  />

  <LinkInitiativeModal
    formationId={formation.id}
    isOpen={showLinkInitiativeModal}
    onClose={() => {
      showLinkInitiativeModal = false
    }}
    onSuccess={() => {
      loadData()
    }}
  />

  <FormationEditModal
    bind:open={showFormationEditModal}
    {formation}
    onclose={() => {
      showFormationEditModal = false
    }}
    onsave={async () => {
      showFormationEditModal = false
      await loadData()
    }}
  />

  {#if selectedInitiative}
    <AllocationModal
      bind:open={showAllocationModal}
      formationId={formation.id}
      initiativeId={selectedInitiative.initiative_id}
      initiativeTitle={selectedInitiative.title}
      currentAllocation={selectedInitiative.allocation_percentage || 100}
      onclose={() => {
        showAllocationModal = false
        selectedInitiative = null
      }}
      onsave={() => {
        showAllocationModal = false
        selectedInitiative = null
        loadFormationInitiatives()
      }}
    />
  {/if}
{/if}

<style>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
