<script lang="ts">
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import { CpuIcon, TrendingUpIcon } from 'lucide-svelte'

  interface Props {
    project: any
    viaRoles: any[]
    deliverables: any[]
    institutions: any[]
    class?: string
  }

  let { project, viaRoles, deliverables, institutions, class: className = '' }: Props = $props()

  const techStack = $derived.by(() => {
    const techs = new Set<string>()
    viaRoles.forEach((role: any) => {
      if (role.technical_details) {
        Object.values(role.technical_details).forEach((value: any) => {
          if (typeof value === 'string') {
            techs.add(value)
          } else if (Array.isArray(value)) {
            value.forEach((v) => {
              if (typeof v === 'string') techs.add(v)
            })
          }
        })
      }
    })
    return Array.from(techs)
  })

  const keyModules = $derived.by(() => {
    return deliverables.filter((d: any) => d.deliverable_type).slice(0, 6)
  })

  const projectTypeDescription = $derived.by(() => {
    switch (project.project_type) {
      case 'worker_follow_amr':
        return {
          title: '작업자 추종형 AMR 시스템',
          description: '작업자를 자동으로 추종하여 작업을 보조하는 자율 이동 로봇',
          businessValue: '작업 효율성 향상 및 인력 부담 감소',
        }
      case 'smartfarm_multirobot':
        return {
          title: '스마트팜 멀티로봇 시스템',
          description: '농업 환경에서 여러 로봇이 협업하여 자동화된 작업을 수행',
          businessValue: '농업 생산성 증대 및 인건비 절감',
        }
      default:
        return {
          title: 'R&D 프로젝트',
          description: project.description || '',
          businessValue: '기술 혁신 및 산업 발전',
        }
    }
  })

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'green'
      case 'in_progress':
        return 'blue'
      default:
        return 'gray'
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return '완료'
      case 'in_progress':
        return '진행중'
      default:
        return '계획'
    }
  }
</script>

<div
  class="p-6 rounded-lg border {className}"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <SectionHeader title="우리가 만드는 것" />

  <!-- Product Description -->
  <div class="p-4 rounded-lg mb-6" style:background="var(--color-background)">
    <h3 class="text-lg font-medium mb-2" style:color="var(--color-text-primary)">
      {projectTypeDescription.title}
    </h3>
    <p class="text-sm mb-3" style:color="var(--color-text-secondary)">
      {projectTypeDescription.description}
    </p>
    {#if project.description && project.description !== projectTypeDescription.description}
      <p class="text-sm" style:color="var(--color-text-tertiary)">
        {project.description}
      </p>
    {/if}
  </div>

  <!-- Business Value -->
  <div
    class="flex items-center gap-3 p-4 rounded-lg mb-6"
    style:background="var(--color-green-light)"
    style:border="1px solid var(--color-green)"
  >
    <TrendingUpIcon size={20} />
    <div>
      <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
        기대 효과
      </div>
      <div class="text-sm font-medium" style:color="var(--color-text-primary)">
        {projectTypeDescription.businessValue}
      </div>
    </div>
  </div>

  <!-- VIA Contributions -->
  {#if viaRoles.length > 0}
    <div
      class="mb-6 p-4 rounded-lg border"
      style:background="var(--color-primary-light)"
      style:border-color="var(--color-primary)"
    >
      <div class="flex items-center gap-2 mb-3">
        <span
          class="px-2.5 py-1 text-xs font-medium rounded"
          style:background="var(--color-primary)"
          style:color="white"
        >
          VIA
        </span>
        <h4 class="text-base font-medium" style:color="var(--color-text-primary)">VIA 역할</h4>
      </div>
      <div class="grid grid-cols-2 gap-2">
        {#each viaRoles as role}
          <div class="p-3 rounded" style:background="var(--color-surface)">
            <div class="text-sm font-medium mb-1" style:color="var(--color-text-primary)">
              {role.role_title}
            </div>
            <div class="text-xs" style:color="var(--color-text-secondary)">
              {role.role_category}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Tech Stack -->
  {#if techStack.length > 0}
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <CpuIcon size={18} />
        <h4 class="text-base font-medium" style:color="var(--color-text-primary)">
          핵심 기술 스택
        </h4>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each techStack as tech}
          <span
            class="px-2.5 py-1 text-xs font-medium rounded border"
            style:background="var(--color-blue-light)"
            style:color="var(--color-blue-dark)"
            style:border-color="var(--color-blue)"
          >
            {tech}
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Key Modules -->
  {#if keyModules.length > 0}
    <div class="mb-6">
      <h4 class="text-base font-medium mb-3" style:color="var(--color-text-primary)">
        주요 모듈 구성
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each keyModules as module}
          {@const statusColor = getStatusColor(module.status)}
          <div
            class="p-4 rounded-lg border transition hover:border-blue-300 hover:shadow-sm"
            style="background: var(--color-surface); border-color: var(--color-border)"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="text-sm font-medium flex-1" style:color="var(--color-text-primary)">
                {module.title}
              </div>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap"
                style:background="var(--color-{statusColor}-light)"
                style:color="var(--color-{statusColor})"
              >
                {getStatusText(module.status)}
              </span>
            </div>
            {#if module.description}
              <p class="text-xs mb-2" style:color="var(--color-text-secondary)">
                {module.description}
              </p>
            {/if}
            {#if module.institution_id}
              {@const institution = institutions.find((i: any) => i.id === module.institution_id)}
              {#if institution}
                <div class="text-xs font-medium" style:color="var(--color-primary)">
                  {institution.institution_name}
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Participating Institutions -->
  {#if institutions.length > 0}
    <div class="pt-4" style:border-top="1px solid var(--color-border)">
      <div class="text-xs font-semibold mb-2" style:color="var(--color-text-tertiary)">
        협력 기관
      </div>
      <div class="text-sm" style:color="var(--color-text-primary)">
        {institutions.map((i: any) => i.institution_name).join(' · ')}
      </div>
    </div>
  {/if}
</div>
