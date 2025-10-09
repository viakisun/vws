<script lang="ts">
  import type { ThreadWithDetails } from '../types'

  interface Props {
    thread: ThreadWithDetails
    href?: string
  }

  let { thread, href = `/planner/threads/${thread.id}` }: Props = $props()

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

  function getShapeColor(shape: string): string {
    switch (shape) {
      case 'block':
        return 'bg-red-50 border-red-200 hover:border-red-300'
      case 'question':
        return 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
      case 'decision':
        return 'bg-purple-50 border-purple-200 hover:border-purple-300'
      case 'build':
        return 'bg-blue-50 border-blue-200 hover:border-blue-300'
      case 'research':
        return 'bg-green-50 border-green-200 hover:border-green-300'
      default:
        return 'bg-white border-gray-200 hover:border-gray-300'
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`

    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }
</script>

<a {href} class="block p-3 rounded border transition {getShapeColor(thread.shape)}">
  <div class="flex items-start gap-3">
    <span class="text-lg">{getShapeIcon(thread.shape)}</span>
    <div class="flex-1 min-w-0">
      <h3 class="text-sm font-medium text-gray-900 mb-1">{thread.title}</h3>
      {#if thread.body}
        <p class="text-xs text-gray-600 line-clamp-2 mb-2">{thread.body}</p>
      {/if}
      <div class="flex items-center gap-3 text-xs text-gray-500">
        <span>{thread.owner.first_name} {thread.owner.last_name}</span>
        {#if thread.reply_count > 0}
          <span>💬 {thread.reply_count}</span>
        {/if}
        {#if thread.contributors && thread.contributors.length > 0}
          <span>👥 {thread.contributors.length}</span>
        {/if}
        <span>{formatDate(thread.updated_at)}</span>
      </div>
    </div>
  </div>
</a>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
