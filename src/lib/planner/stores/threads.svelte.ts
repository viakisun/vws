import type { ThreadWithDetails } from '../types'

export function createThreadsStore(initiativeId: string) {
  let threads = $state<ThreadWithDetails[]>([])
  let selectedThread = $state<ThreadWithDetails | null>(null)
  let replies = $state<any[]>([])
  let loading = $state(false)
  let submittingReply = $state(false)

  async function loadThreads() {
    try {
      loading = true
      const res = await fetch(`/api/planner/threads?initiative_id=${initiativeId}`)

      if (res.ok) {
        const data = await res.json()
        threads = data.data || []
      }
    } catch (e) {
      console.error('Error loading threads:', e)
    } finally {
      loading = false
    }
  }

  async function selectThread(thread: ThreadWithDetails) {
    selectedThread = thread
    await loadReplies(thread.id)
  }

  function closeThread() {
    selectedThread = null
    replies = []
  }

  async function loadReplies(threadId: string) {
    try {
      const res = await fetch(`/api/planner/threads/${threadId}/replies`)
      if (res.ok) {
        const data = await res.json()
        replies = data.data || []
      }
    } catch (e) {
      console.error('Error loading thread replies:', e)
    }
  }

  async function submitReply(content: string, mentions: string[]) {
    if (!content.trim() || !selectedThread) return false

    try {
      submittingReply = true

      const res = await fetch(`/api/planner/threads/${selectedThread.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mentions }),
      })

      if (res.ok) {
        await loadReplies(selectedThread.id)
        return true
      }
      return false
    } catch (e) {
      console.error('Error submitting reply:', e)
      return false
    } finally {
      submittingReply = false
    }
  }

  return {
    get threads() {
      return threads
    },
    get activeThreads() {
      return threads.filter((t) => t.state === 'active')
    },
    get selectedThread() {
      return selectedThread
    },
    get replies() {
      return replies
    },
    get loading() {
      return loading
    },
    get submittingReply() {
      return submittingReply
    },
    loadThreads,
    selectThread,
    closeThread,
    submitReply,
  }
}
