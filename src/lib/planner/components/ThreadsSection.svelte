<script lang="ts">
  import { goto } from '$app/navigation'
  import type { ThreadWithDetails } from '../types'
  import { getShapeText, getShapeColor } from '../utils/initiative-helpers'
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import SectionActionButton from '$lib/components/ui/SectionActionButton.svelte'

  interface Props {
    threads: ThreadWithDetails[]
    initiativeId: string
    onSelectThread: (thread: ThreadWithDetails) => void
  }

  let { threads, initiativeId, onSelectThread }: Props = $props()
</script>

<div
  class="rounded-lg border p-6"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <SectionHeader title="Active Threads" count={threads.length}>
    <SectionActionButton onclick={() => goto(`/planner/threads/new?initiative_id=${initiativeId}`)}>
      + New Thread
    </SectionActionButton>
  </SectionHeader>

  {#if threads.length > 0}
    <div class="space-y-2">
      {#each threads as thread}
        {@const shapeColor = getShapeColor(thread.shape)}
        <button
          type="button"
          onclick={() => onSelectThread(thread)}
          class="w-full text-left p-3 rounded-lg border transition hover:border-gray-300"
          style:background="var(--color-surface-base)"
          style:border-color="var(--color-border)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded"
                  style:background="var(--color-{shapeColor}-light)"
                  style:color="var(--color-{shapeColor}-dark)"
                >
                  {getShapeText(thread.shape)}
                </span>
                <h3 class="text-sm font-medium" style:color="var(--color-text-primary)">
                  {thread.title}
                </h3>
              </div>
              <p class="text-xs line-clamp-1" style:color="var(--color-text-secondary)">
                {thread.body}
              </p>
            </div>
            <span class="text-xs flex-shrink-0" style:color="var(--color-text-tertiary)">
              {thread.reply_count || 0}개 댓글
            </span>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8">
      <p class="text-sm" style:color="var(--color-text-tertiary)">아직 활성 스레드가 없습니다.</p>
    </div>
  {/if}
</div>

<style>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
