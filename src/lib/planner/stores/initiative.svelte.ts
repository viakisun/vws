import type { InitiativeWithOwner, InitiativeStage, InitiativeStatus } from '../types'

export function createInitiativeStore(initiativeId: string) {
  let initiative = $state<InitiativeWithOwner | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)
  let changingStage = $state(false)
  let changingStatus = $state(false)

  async function load() {
    try {
      loading = true
      error = null

      const res = await fetch(`/api/planner/initiatives/${initiativeId}`)
      if (!res.ok) throw new Error('Failed to load initiative')

      const data = await res.json()
      initiative = data.data
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load initiative'
      console.error('Error loading initiative:', e)
    } finally {
      loading = false
    }
  }

  async function updateStage(newStage: InitiativeStage) {
    if (!initiative) return

    try {
      changingStage = true

      const res = await fetch(`/api/planner/initiatives/${initiative.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (res.ok) {
        const data = await res.json()
        initiative = { ...initiative, ...data.data }
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || '단계 변경에 실패했습니다')
      }
    } catch (e) {
      console.error('Error changing stage:', e)
      throw e
    } finally {
      changingStage = false
    }
  }

  async function updateStatus(newStatus: InitiativeStatus) {
    if (!initiative) return

    try {
      changingStatus = true

      const res = await fetch(`/api/planner/initiatives/${initiative.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        const data = await res.json()
        initiative = { ...initiative, ...data.data }
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || '상태 변경에 실패했습니다')
      }
    } catch (e) {
      console.error('Error changing status:', e)
      throw e
    } finally {
      changingStatus = false
    }
  }

  async function updateLinks(links: any[]) {
    if (!initiative) return

    try {
      const res = await fetch(`/api/planner/initiatives/${initiative.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context_links: links }),
      })

      if (res.ok) {
        const data = await res.json()
        initiative = { ...initiative, ...data.data }
      } else {
        throw new Error('링크 업데이트에 실패했습니다')
      }
    } catch (e) {
      console.error('Error updating links:', e)
      throw e
    }
  }

  async function updateDetails(details: {
    success_criteria?: string[]
    horizon?: string
    owner_id?: string
    formation_id?: string | null
    milestone_id?: string | null
  }) {
    if (!initiative) return

    try {
      console.log('Updating initiative details:', details)
      const res = await fetch(`/api/planner/initiatives/${initiative.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      })

      if (res.ok) {
        const data = await res.json()
        console.log('Update response:', data)
        initiative = data.data
        console.log('Initiative after update:', initiative)
      } else {
        const errorData = await res.json()
        console.error('Update failed:', errorData)
        throw new Error(errorData.error || 'Failed to update details')
      }
    } catch (e) {
      console.error('Error updating details:', e)
      throw e
    }
  }

  return {
    get initiative() {
      return initiative
    },
    get loading() {
      return loading
    },
    get error() {
      return error
    },
    get changingStage() {
      return changingStage
    },
    get changingStatus() {
      return changingStatus
    },
    load,
    updateStage,
    updateStatus,
    updateLinks,
    updateDetails,
  }
}
