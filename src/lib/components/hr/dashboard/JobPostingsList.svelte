<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import { PlusIcon, EyeIcon, EditIcon, TrashIcon } from '@lucide/svelte'
  import { jobPostings } from '$lib/stores/recruitment'
  import { formatDate } from '$lib/utils/format'

  // 최근 채용 공고
  let recentJobPostings = $derived(() => {
    return $jobPostings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  })

  // 채용관리 탭으로 이동하는 함수
  function goToRecruitment() {
    // activeTab을 'recruitment'로 설정하는 이벤트 발생
    // 부모 컴포넌트에서 처리하도록 함
    const event = new CustomEvent('hr-tab-change', {
      detail: { tab: 'recruitment' },
    })
    window.dispatchEvent(event)
  }
</script>

<ThemeCard class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-lg font-semibold" style:color="var(--color-text)">최근 채용 공고</h3>
    <ThemeButton
      variant="primary"
      size="sm"
      class="flex items-center gap-2"
      onclick={goToRecruitment}
    >
      <PlusIcon size={16} />
      새 공고
    </ThemeButton>
  </div>

  <div class="space-y-4">
    {#each recentJobPostings as job (job.id ?? `${job.createdAt}:${job.title}`)}
      <div
        class="flex items-center justify-between p-4 rounded-lg border"
        style:border-color="var(--color-border)"
        style:background="var(--color-surface-elevated)"
      >
        <div class="flex-1">
          <h4 class="font-medium" style:color="var(--color-text)">
            {job.title}
          </h4>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {job.department} • {job.employmentType}
          </p>
          <div class="flex items-center gap-2 mt-2">
            <ThemeBadge variant={job.status === 'published' ? 'success' : 'warning'}>
              {job.status === 'published' ? '모집중' : '마감'}
            </ThemeBadge>
            <span class="text-xs" style:color="var(--color-text-secondary)">
              {formatDate(job.createdAt)}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <ThemeButton
            variant="ghost"
            size="sm"
            onclick={() => {
              // TODO: 채용 공고 상세 보기
              alert('채용 공고 상세 보기 기능은 준비 중입니다.')
            }}
          >
            <EyeIcon size={16} />
          </ThemeButton>
          <ThemeButton
            variant="ghost"
            size="sm"
            onclick={() => {
              // TODO: 채용 공고 수정
              alert('채용 공고 수정 기능은 준비 중입니다.')
            }}
          >
            <EditIcon size={16} />
          </ThemeButton>
          <ThemeButton
            variant="ghost"
            size="sm"
            onclick={() => {
              // TODO: 채용 공고 삭제
              alert('채용 공고 삭제 기능은 준비 중입니다.')
            }}
          >
            <TrashIcon size={16} />
          </ThemeButton>
        </div>
      </div>
    {/each}
  </div>
</ThemeCard>
