<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type { RdDevInstitution } from '$lib/types/rd-development'
  import {
    BuildingIcon,
    ExternalLinkIcon,
    FileTextIcon,
    MailIcon,
    MapPinIcon,
    PhoneIcon,
    UserIcon,
    UsersIcon,
  } from 'lucide-svelte'

  interface Props {
    institutions: RdDevInstitution[]
    loading?: boolean
  }

  let { institutions = [], loading = false }: Props = $props()

  // 기관 타입에 따른 색상
  function getInstitutionTypeColor(type: string): string {
    switch (type?.toLowerCase()) {
      case 'university':
      case '대학':
        return 'primary'
      case 'research_institute':
      case '연구소':
        return 'success'
      case 'company':
      case '기업':
        return 'warning'
      case 'government':
      case '정부기관':
        return 'info'
      default:
        return 'secondary'
    }
  }

  // 기관 타입 한국어 변환
  function getInstitutionTypeText(type: string): string {
    switch (type?.toLowerCase()) {
      case 'university':
        return '대학'
      case 'research_institute':
        return '연구소'
      case 'company':
        return '기업'
      case 'government':
        return '정부기관'
      default:
        return type || '기타'
    }
  }

  // 통계 계산
  const stats = $derived.by(() => {
    const total = institutions.length
    const byType = institutions.reduce(
      (acc, inst) => {
        const type = getInstitutionTypeText(inst.institution_type || '기타')
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total,
      byType,
    }
  })

  // 연락처 정보 파싱
  function getContactInfo(institution: RdDevInstitution) {
    try {
      if (typeof institution.contact_info === 'string') {
        return JSON.parse(institution.contact_info)
      }
      return institution.contact_info || {}
    } catch {
      return {}
    }
  }
</script>

<div class="rd-dev-institutions-panel">
  <!-- 통계 카드 -->
  <div class="stats-section mb-6">
    <ThemeCard class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">참여기관 현황</h3>
        <BuildingIcon size={24} class="text-primary" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="stat-item">
          <div class="stat-value">{stats.total}</div>
          <div class="stat-label">총 참여기관</div>
        </div>

        {#each Object.entries(stats.byType) as [type, count]}
          <div class="stat-item">
            <div class="stat-value">{count}</div>
            <div class="stat-label">{type}</div>
          </div>
        {/each}
      </div>
    </ThemeCard>
  </div>

  <!-- 기관 목록 -->
  <div class="institutions-container">
    {#if loading}
      <div class="loading-state">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p class="text-muted-foreground mt-2">참여기관을 불러오는 중...</p>
      </div>
    {:else if institutions.length === 0}
      <ThemeCard class="p-8 text-center">
        <BuildingIcon size={48} class="mx-auto text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold mb-2">참여기관이 없습니다</h3>
        <p class="text-muted-foreground">등록된 참여기관이 없습니다.</p>
      </ThemeCard>
    {:else}
      <div class="institutions-grid">
        {#each institutions as institution (institution.id)}
          {@const contactInfo = getContactInfo(institution)}

          <ThemeCard class="institution-card">
            <!-- 기관 헤더 -->
            <div class="institution-header">
              <div class="institution-title-section">
                <div class="flex items-start gap-3">
                  <BuildingIcon size={24} class="text-primary mt-1 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-lg mb-1">{institution.institution_name}</h4>
                    {#if institution.institution_type}
                      <ThemeBadge variant="default" size="sm">
                        {getInstitutionTypeText(institution.institution_type)}
                      </ThemeBadge>
                    {/if}
                  </div>
                </div>
              </div>

              <div class="institution-actions">
                <ThemeButton variant="secondary" size="sm">
                  <ExternalLinkIcon size={14} class="mr-1" />
                  상세보기
                </ThemeButton>
              </div>
            </div>

            <!-- 주요 연구자 -->
            {#if institution.primary_researcher_name}
              <div class="institution-researcher mt-4">
                <div class="flex items-center gap-2 text-sm">
                  <UserIcon size={16} class="text-muted-foreground" />
                  <span class="text-muted-foreground">주요 연구자:</span>
                  <span class="font-medium">{institution.primary_researcher_name}</span>
                </div>
              </div>
            {/if}

            <!-- 역할 설명 -->
            {#if institution.role_description}
              <div class="institution-role mt-4">
                <h5 class="font-medium text-sm mb-2 flex items-center gap-1">
                  <FileTextIcon size={14} />
                  역할 및 기여
                </h5>
                <p class="text-sm text-muted-foreground leading-relaxed">
                  {institution.role_description}
                </p>
              </div>
            {/if}

            <!-- 연락처 정보 -->
            {#if Object.keys(contactInfo).length > 0}
              <div class="institution-contact mt-4 pt-4 border-t border-border">
                <h5 class="font-medium text-sm mb-3 flex items-center gap-1">
                  <UsersIcon size={14} />
                  연락처 정보
                </h5>

                <div class="contact-grid">
                  {#if contactInfo.email}
                    <div class="contact-item">
                      <MailIcon size={14} class="text-muted-foreground" />
                      <a
                        href="mailto:{contactInfo.email}"
                        class="text-sm text-primary hover:underline"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  {/if}

                  {#if contactInfo.phone}
                    <div class="contact-item">
                      <PhoneIcon size={14} class="text-muted-foreground" />
                      <a
                        href="tel:{contactInfo.phone}"
                        class="text-sm text-primary hover:underline"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  {/if}

                  {#if contactInfo.address}
                    <div class="contact-item">
                      <MapPinIcon size={14} class="text-muted-foreground" />
                      <span class="text-sm text-muted-foreground">{contactInfo.address}</span>
                    </div>
                  {/if}

                  {#if contactInfo.website}
                    <div class="contact-item">
                      <ExternalLinkIcon size={14} class="text-muted-foreground" />
                      <a
                        href={contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm text-primary hover:underline"
                      >
                        웹사이트
                      </a>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}

            <!-- 액션 버튼 -->
            <div class="institution-actions-footer mt-4 pt-4 border-t border-border">
              <div class="flex gap-2">
                <ThemeButton variant="secondary" size="sm" class="flex-1">연구진 보기</ThemeButton>
                <ThemeButton variant="primary" size="sm">연락하기</ThemeButton>
              </div>
            </div>
          </ThemeCard>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .rd-dev-institutions-panel {
    @apply flex flex-col;
  }

  .rd-dev-institutions-panel > * + * {
    @apply mt-6;
  }

  .stats-section {
    @apply bg-surface border border-border rounded-lg;
  }

  .stat-item {
    @apply text-center;
  }

  .stat-value {
    @apply text-2xl font-bold text-primary mb-1;
  }

  .stat-label {
    @apply text-sm text-muted-foreground;
  }

  .institutions-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
    gap: 1.5rem;
  }

  .institution-card {
    @apply border border-border hover:border-primary/50 transition-colors duration-200;
  }

  .institution-header {
    @apply flex justify-between items-start gap-4;
  }

  .institution-title-section {
    @apply flex-1 min-w-0;
  }

  .institution-actions {
    @apply flex-shrink-0;
  }

  .institution-researcher {
    @apply bg-muted/50 rounded-lg p-3;
  }

  .institution-role {
    @apply bg-surface/50 rounded-lg p-3;
  }

  .institution-contact {
    @apply bg-muted/30 rounded-lg p-3;
  }

  .contact-grid {
    @apply grid grid-cols-1 gap-2;
  }

  .contact-item {
    @apply flex items-center gap-2;
  }

  .institution-actions-footer {
    @apply border-t border-border;
  }

  .loading-state {
    @apply flex flex-col items-center justify-center py-12;
  }
</style>
