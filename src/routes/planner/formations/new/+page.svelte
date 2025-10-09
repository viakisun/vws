<script lang="ts">
  import { goto } from '$app/navigation'
  import type { CadenceType, EnergyState } from '$lib/planner/types'

  // =============================================
  // State
  // =============================================

  let name = $state('')
  let description = $state('')
  let cadenceType = $state<CadenceType>('weekly')
  let cadenceAnchorTime = $state('')
  let energyState = $state<EnergyState>('healthy')

  let loading = $state(false)
  let error = $state<string | null>(null)

  // =============================================
  // Actions
  // =============================================

  async function handleSubmit() {
    try {
      loading = true
      error = null

      if (!name) {
        error = '이름은 필수입니다'
        return
      }

      const response = await fetch('/api/planner/formations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          cadence_type: cadenceType,
          cadence_anchor_time: cadenceAnchorTime || undefined,
          energy_state: energyState,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '포메이션 생성 실패')
      }

      goto(`/planner/formations/${data.data.id}`)
    } catch (e) {
      error = e instanceof Error ? e.message : '포메이션 생성 실패'
      console.error('Error creating formation:', e)
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>새 포메이션 - 플래너</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white border-b border-gray-200">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center gap-3">
        <a href="/planner/formations" class="text-gray-500 hover:text-gray-700 transition text-sm">
          ← 뒤로
        </a>
        <h1 class="text-2xl font-light text-gray-900">새 포메이션</h1>
      </div>
    </div>
  </div>

  <!-- Form -->
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if error}
      <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    {/if}

    <form
      onsubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      class="space-y-6"
    >
      <!-- Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
          이름 <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          bind:value={name}
          required
          placeholder="예: VWS-CORE-TF"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2"> 설명 </label>
        <textarea
          id="description"
          bind:value={description}
          rows="3"
          placeholder="이 포메이션의 목적에 대한 간단한 설명"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        ></textarea>
      </div>

      <!-- Cadence Type -->
      <div>
        <label for="cadence" class="block text-sm font-medium text-gray-700 mb-2"> 주기 </label>
        <select
          id="cadence"
          bind:value={cadenceType}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="daily">매일</option>
          <option value="weekly">매주</option>
          <option value="biweekly">격주</option>
          <option value="async">비동기</option>
        </select>
        <p class="text-xs text-gray-500 mt-1">이 포메이션의 싱크 주기는 얼마나 되나요?</p>
      </div>

      <!-- Cadence Anchor Time -->
      {#if cadenceType !== 'async'}
        <div>
          <label for="anchor-time" class="block text-sm font-medium text-gray-700 mb-2">
            싱크 시간 (선택)
          </label>
          <input
            type="datetime-local"
            id="anchor-time"
            bind:value={cadenceAnchorTime}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p class="text-xs text-gray-500 mt-1">싱크가 일반적으로 언제 이루어지나요?</p>
        </div>
      {/if}

      <!-- Energy State -->
      <div>
        <label for="energy" class="block text-sm font-medium text-gray-700 mb-2">
          초기 에너지 상태
        </label>
        <select
          id="energy"
          bind:value={energyState}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="aligned">🟢 정렬됨 - 모든 것이 순조롭게 진행 중</option>
          <option value="healthy">🔵 양호 - 정상적인 작업 상태</option>
          <option value="strained">🟠 부담 - 용량 우려 있음</option>
          <option value="blocked">🔴 차단 - 진행 불가</option>
        </select>
      </div>

      <!-- Info Box -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-sm text-blue-900 font-medium mb-2">다음 단계</p>
        <p class="text-xs text-blue-700">포메이션을 생성한 후 다음을 수행할 수 있습니다:</p>
        <ul class="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-disc">
          <li>특정 역할(드라이버, 기여자, 자문)로 멤버 추가</li>
          <li>기존 이니셔티브 연결</li>
          <li>사전 싱크 다이제스트 생성</li>
        </ul>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '생성 중...' : '포메이션 만들기'}
        </button>
        <a
          href="/planner/formations"
          class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          취소
        </a>
      </div>
    </form>
  </div>
</div>
