<script lang="ts">
  import type { ThreadWithDetails } from '../types'
  import { getShapeText, getShapeColor } from '../utils/initiative-helpers'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import MentionInput from './MentionInput.svelte'

  interface Props {
    thread: ThreadWithDetails | null
    replies: any[]
    submittingReply: boolean
    onClose: () => void
    onSubmitReply: (content: string, mentions: string[]) => Promise<boolean>
  }

  let { thread, replies, submittingReply, onClose, onSubmitReply }: Props = $props()

  let replyText = $state('')
  let replyMentions = $state<string[]>([])

  async function handleSubmitReply() {
    const success = await onSubmitReply(replyText, replyMentions)
    if (success) {
      replyText = ''
      replyMentions = []
    }
  }
</script>

{#if thread}
  {@const shapeColor = getShapeColor(thread.shape)}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="thread-modal-title"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style:background="rgba(0, 0, 0, 0.5)"
    onclick={onClose}
    onkeydown={(e) => {
      if (e.key === 'Escape') onClose()
    }}
  >
    <div
      class="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg"
      style:background="var(--color-surface-base)"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="p-6 space-y-4">
        <!-- Thread Header -->
        <div>
          <span
            class="inline-block px-2 py-1 text-xs font-medium rounded mb-2"
            style:background="var(--color-{shapeColor}-light)"
            style:color="var(--color-{shapeColor}-dark)"
          >
            {getShapeText(thread.shape)}
          </span>
          <h2
            id="thread-modal-title"
            class="text-xl font-bold mb-2"
            style:color="var(--color-text-primary)"
          >
            {thread.title}
          </h2>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {thread.body}
          </p>
        </div>

        <!-- Replies -->
        {#if replies.length > 0}
          <div class="space-y-3 pt-4 border-t" style:border-color="var(--color-border)">
            {#each replies as reply}
              <div class="p-3 rounded-lg" style:background="var(--color-surface-elevated)">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium" style:color="var(--color-text-primary)">
                    {formatKoreanName(reply.author.last_name, reply.author.first_name)}
                  </span>
                  <span class="text-xs" style:color="var(--color-text-tertiary)">
                    {new Date(reply.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p class="text-sm" style:color="var(--color-text-secondary)">
                  {reply.content}
                </p>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Reply Form -->
        <div class="pt-4 border-t" style:border-color="var(--color-border)">
          <MentionInput bind:value={replyText} bind:mentions={replyMentions} />
          <div class="flex justify-end gap-2 mt-3">
            <ThemeButton variant="outline" size="sm" onclick={onClose}>닫기</ThemeButton>
            <ThemeButton
              variant="primary"
              size="sm"
              onclick={handleSubmitReply}
              disabled={submittingReply || !replyText.trim()}
            >
              {submittingReply ? '전송 중...' : '댓글 달기'}
            </ThemeButton>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
