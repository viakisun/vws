<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import {
    MessageSquareIcon,
    UserIcon,
    CalendarIcon,
    ArrowLeftIcon,
    AtSignIcon,
  } from 'lucide-svelte'
  import type { ThreadWithDetails } from '$lib/planner/types'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import MentionInput from '$lib/planner/components/MentionInput.svelte'

  // =============================================
  // State
  // =============================================

  let thread = $state<ThreadWithDetails | null>(null)
  let threadMentionedUsers = $state<any[]>([])
  let replies = $state<any[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let replyText = $state('')
  let replyMentions = $state<string[]>([])
  let submitting = $state(false)

  // =============================================
  // Data Fetching
  // =============================================

  async function loadThread() {
    try {
      loading = true
      error = null

      const id = $page.params.id

      const res = await fetch(`/api/planner/threads/${id}`)
      if (!res.ok) throw new Error('Failed to load thread')

      const data = await res.json()
      thread = data.data

      // Load mentioned users
      if (thread?.mentions && thread.mentions.length > 0) {
        await loadMentionedUsers(thread.mentions)
      }

      // Load replies
      await loadReplies()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load thread'
      console.error('Error loading thread:', e)
    } finally {
      loading = false
    }
  }

  async function loadMentionedUsers(mentionIds: string[]) {
    try {
      const res = await fetch(`/api/employees?ids=${mentionIds.join(',')}`)
      if (res.ok) {
        const data = await res.json()
        threadMentionedUsers = data.data || []
      }
    } catch (e) {
      console.error('Failed to load mentioned users:', e)
    }
  }

  async function loadReplies() {
    const id = $page.params.id
    const res = await fetch(`/api/planner/threads/${id}/replies`)
    if (res.ok) {
      const data = await res.json()
      replies = data.data || []
    }
  }

  onMount(() => {
    loadThread()
  })

  // =============================================
  // Actions
  // =============================================

  async function handleReplySubmit() {
    if (!replyText.trim()) return

    try {
      submitting = true
      const res = await fetch(`/api/planner/threads/${$page.params.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText,
          mentions: replyMentions.length > 0 ? replyMentions : undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to create reply')

      replyText = ''
      replyMentions = []
      await loadReplies()
    } catch (e) {
      console.error('Error creating reply:', e)
      alert('댓글 작성에 실패했습니다')
    } finally {
      submitting = false
    }
  }

  // =============================================
  // Helpers
  // =============================================

  function getShapeIcon(shape: string): string {
    switch (shape) {
      case 'block':
        return '🔴'
      case 'question':
        return '🟡'
      case 'decision':
        return '🟣'
      case 'build':
        return '🔵'
      case 'research':
        return '🟢'
      default:
        return '⚪'
    }
  }

  function getShapeText(shape: string): string {
    switch (shape) {
      case 'block':
        return '차단'
      case 'question':
        return '질문'
      case 'decision':
        return '결정'
      case 'build':
        return '구현'
      case 'research':
        return '조사'
      default:
        return shape
    }
  }

  function getStateColor(state: string): 'blue' | 'green' | 'yellow' | 'indigo' | 'purple' | 'red' | 'orange' | 'pink' {
    switch (state) {
      case 'active':
        return 'blue'
      case 'resolved':
        return 'green'
      case 'archived':
        return 'indigo'
      default:
        return 'blue'
    }
  }

  function getStateText(state: string): string {
    switch (state) {
      case 'active':
        return '진행 중'
      case 'resolved':
        return '해결됨'
      case 'archived':
        return '보관됨'
      default:
        return state
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // =============================================
  // Computed Values
  // =============================================

  const stats = $derived(
    thread
      ? [
          {
            title: '유형',
            value: getShapeText(thread.shape),
            icon: MessageSquareIcon,
            color: 'purple' as const,
          },
          {
            title: '상태',
            value: getStateText(thread.state),
            color: getStateColor(thread.state),
          },
          { title: '댓글', value: replies.length, icon: MessageSquareIcon, color: 'blue' as const },
          {
            title: '작성일',
            value: formatDate(thread.created_at).split(' ')[0],
            icon: CalendarIcon,
            color: 'green' as const,
          },
        ]
      : [],
  )
</script>

<svelte:head>
  <title>{thread?.title || 'Thread'} - 플래너</title>
</svelte:head>

{#if loading}
  <div class="text-center py-12">
    <div style:color="var(--color-text-secondary)">로딩 중...</div>
  </div>
{:else if error || !thread}
  <ThemeCard variant="outlined" class="border-red-200 bg-red-50">
    <p style:color="var(--color-error)">{error || 'Thread를 찾을 수 없습니다'}</p>
  </ThemeCard>
{:else}
  <PageLayout
    title={thread.title}
    subtitle={`${thread.initiative_title} 이니셔티브`}
    {stats}
    backLink="/planner/initiatives/{thread.initiative_id}"
  >
    <!-- Thread Body -->
    <ThemeCard variant="default" class="mb-6">
      <div class="flex items-start gap-4">
        <span class="text-3xl">{getShapeIcon(thread.shape)}</span>
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-4">
            <p class="text-sm font-semibold" style:color="var(--color-text-primary)">
              {formatKoreanName(thread.owner.last_name, thread.owner.first_name)}
            </p>
            <span style:color="var(--color-text-tertiary)">·</span>
            <p class="text-sm" style:color="var(--color-text-tertiary)">
              {formatDate(thread.created_at)}
            </p>
          </div>
          <div class="prose prose-sm max-w-none" style:color="var(--color-text-secondary)">
            {thread.body}
          </div>

          <!-- Mentioned Users -->
          {#if threadMentionedUsers.length > 0}
            <div class="mt-4 pt-4" style:border-top="1px solid var(--color-border-light)">
              <div class="flex items-center gap-2 mb-2">
                <AtSignIcon size={14} style="color: var(--color-text-tertiary);" />
                <p class="text-xs font-medium" style:color="var(--color-text-tertiary)">
                  응답 요청
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                {#each threadMentionedUsers as user}
                  <div
                    class="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style:background="var(--color-primary-light)"
                    style:color="var(--color-primary)"
                  >
                    @{formatKoreanName(user.last_name, user.first_name)}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if thread.external_links && thread.external_links.length > 0}
            <div class="mt-4 pt-4" style:border-top="1px solid var(--color-border-light)">
              <p class="text-xs font-medium mb-2" style:color="var(--color-text-tertiary)">
                관련 링크
              </p>
              <div class="space-y-1">
                {#each thread.external_links as link}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm hover:opacity-70 transition block"
                    style:color="var(--color-primary)"
                  >
                    {link.title || link.url}
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </ThemeCard>

    <!-- Replies Section -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text-primary)">
        댓글 ({replies.length})
      </h3>

      {#if replies.length > 0}
        <div class="space-y-3 mb-6">
          {#each replies as reply}
            <ThemeCard variant="default">
              <div class="mb-2 flex items-center gap-2">
                <p class="text-sm font-semibold" style:color="var(--color-text-primary)">
                  {formatKoreanName(reply.author.last_name, reply.author.first_name)}
                </p>
                <span style:color="var(--color-text-tertiary)">·</span>
                <p class="text-sm" style:color="var(--color-text-tertiary)">
                  {formatDate(reply.created_at)}
                </p>
              </div>
              <p class="text-sm leading-relaxed" style:color="var(--color-text-secondary)">
                {reply.content}
              </p>
              {#if reply.mentioned_users && reply.mentioned_users.length > 0}
                <div class="mt-3 pt-3" style:border-top="1px solid var(--color-border-light)">
                  <div class="flex items-center gap-2 mb-2">
                    <AtSignIcon size={12} style="color: var(--color-text-tertiary);" />
                    <p class="text-xs font-medium" style:color="var(--color-text-tertiary)">
                      응답 요청
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-1">
                    {#each reply.mentioned_users as user}
                      <div
                        class="px-2 py-1 rounded text-xs font-medium"
                        style:background="var(--color-primary-light)"
                        style:color="var(--color-primary)"
                      >
                        @{formatKoreanName(user.last_name, user.first_name)}
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </ThemeCard>
          {/each}
        </div>
      {:else}
        <ThemeCard variant="default" class="mb-6">
          <p class="text-center py-4 text-sm" style:color="var(--color-text-tertiary)">
            아직 댓글이 없습니다
          </p>
        </ThemeCard>
      {/if}

      <!-- Reply Form -->
      <ThemeCard variant="default">
        <form
          onsubmit={(e) => {
            e.preventDefault()
            handleReplySubmit()
          }}
          class="space-y-3"
        >
          <MentionInput
            bind:value={replyText}
            bind:mentions={replyMentions}
            placeholder="댓글을 입력하세요... (@이름 으로 멘션)"
            rows={3}
          />
          <div class="flex justify-end">
            <ThemeButton type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? '작성 중...' : '댓글 작성'}
            </ThemeButton>
          </div>
        </form>
      </ThemeCard>
    </div>
  </PageLayout>
{/if}
