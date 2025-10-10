<script lang="ts">
  import { goto } from '$app/navigation'
  import { pushToast } from '$lib/stores/toasts'
  import { onMount } from 'svelte'
  import { ArrowLeftIcon, ClockIcon, GlobeIcon, SaveIcon } from 'lucide-svelte'

  interface AttendanceSettings {
    id: number
    company_id: string
    work_start_time: string
    work_end_time: string
    late_threshold_minutes: number
    early_leave_threshold_minutes: number
    allowed_ips: string[]
    require_ip_check: boolean
  }

  let settings = $state<AttendanceSettings | null>(null)
  let loading = $state(false)
  let saving = $state(false)

  // Form fields
  let work_start_time = $state('09:00')
  let work_end_time = $state('18:00')
  let late_threshold_minutes = $state(10)
  let early_leave_threshold_minutes = $state(10)
  let allowed_ips = $state<string[]>([])
  let require_ip_check = $state(false)
  let newIp = $state('')

  async function loadSettings() {
    loading = true
    try {
      const response = await fetch('/api/hr/attendance-settings')
      const result = await response.json()

      if (result.success) {
        settings = result.data

        // TIME 타입은 'HH:MM:SS' 형식으로 오므로 'HH:MM'로 변환
        work_start_time = result.data.work_start_time.substring(0, 5)
        work_end_time = result.data.work_end_time.substring(0, 5)
        late_threshold_minutes = result.data.late_threshold_minutes || 10
        early_leave_threshold_minutes = result.data.early_leave_threshold_minutes || 10
        allowed_ips = result.data.allowed_ips || []
        require_ip_check = result.data.require_ip_check || false
      } else {
        pushToast(result.message, 'error')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      pushToast('설정을 불러오는데 실패했습니다.', 'error')
    } finally {
      loading = false
    }
  }

  async function saveSettings() {
    saving = true
    try {
      const response = await fetch('/api/hr/attendance-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          work_start_time: work_start_time + ':00',
          work_end_time: work_end_time + ':00',
          late_threshold_minutes,
          early_leave_threshold_minutes,
          allowed_ips,
          require_ip_check,
        }),
      })

      const result = await response.json()

      if (result.success) {
        pushToast('출퇴근 설정이 저장되었습니다.', 'success')
        settings = result.data
      } else {
        pushToast(result.message, 'error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      pushToast('설정 저장에 실패했습니다.', 'error')
    } finally {
      saving = false
    }
  }

  function addIp() {
    if (!newIp.trim()) {
      pushToast('IP 주소를 입력하세요.', 'error')
      return
    }

    // 간단한 IP 주소 유효성 검사
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipPattern.test(newIp.trim())) {
      pushToast('올바른 IP 주소 형식이 아닙니다.', 'error')
      return
    }

    if (allowed_ips.includes(newIp.trim())) {
      pushToast('이미 추가된 IP 주소입니다.', 'error')
      return
    }

    allowed_ips = [...allowed_ips, newIp.trim()]
    newIp = ''
  }

  function removeIp(ip: string) {
    allowed_ips = allowed_ips.filter((i) => i !== ip)
  }

  function goBack() {
    goto('/hr')
  }

  onMount(() => {
    loadSettings()
  })
</script>

<svelte:head>
  <title>출퇴근 설정 - VWS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          type="button"
          onclick={goBack}
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon size={20} />
          <span>HR 관리</span>
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        <h1 class="text-2xl font-bold text-gray-900">출퇴근 설정</h1>
      </div>
      <button
        type="button"
        onclick={saveSettings}
        disabled={saving}
        class="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <SaveIcon size={20} />
        <span>{saving ? '저장 중...' : '설정 저장'}</span>
      </button>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else}
      <!-- 근무 시간 설정 -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center gap-2 mb-6">
          <ClockIcon size={24} class="text-blue-600" />
          <h2 class="text-lg font-semibold text-gray-900">근무 시간 설정</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="work-start-time" class="block text-sm font-medium text-gray-700 mb-2">
              출근 시간 <span class="text-red-500">*</span>
            </label>
            <input
              id="work-start-time"
              type="time"
              bind:value={work_start_time}
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label for="work-end-time" class="block text-sm font-medium text-gray-700 mb-2">
              퇴근 시간 <span class="text-red-500">*</span>
            </label>
            <input
              id="work-end-time"
              type="time"
              bind:value={work_end_time}
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label for="late-threshold" class="block text-sm font-medium text-gray-700 mb-2">
              지각 기준 (분) <span class="text-red-500">*</span>
            </label>
            <input
              id="late-threshold"
              type="number"
              bind:value={late_threshold_minutes}
              min="0"
              max="60"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="mt-1 text-xs text-gray-500">
              출근 시간 이후 {late_threshold_minutes}분 초과 시 지각으로 처리됩니다.
            </p>
          </div>

          <div>
            <label for="early-leave-threshold" class="block text-sm font-medium text-gray-700 mb-2">
              조기퇴근 기준 (분) <span class="text-red-500">*</span>
            </label>
            <input
              id="early-leave-threshold"
              type="number"
              bind:value={early_leave_threshold_minutes}
              min="0"
              max="60"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="mt-1 text-xs text-gray-500">
              퇴근 시간 이전 {early_leave_threshold_minutes}분 초과 시 조기퇴근으로 처리됩니다.
            </p>
          </div>
        </div>

        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex gap-2">
            <div class="text-blue-600 mt-0.5">ℹ️</div>
            <div class="text-sm text-blue-800">
              <p class="font-medium mb-1">근무 시간 안내</p>
              <p class="text-blue-700">
                설정된 근무 시간을 기준으로 지각, 조기퇴근 등이 자동으로 판정됩니다. 출퇴근 시간은
                24시간 형식으로 입력해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- IP 주소 제한 설정 -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center gap-2 mb-6">
          <GlobeIcon size={24} class="text-green-600" />
          <h2 class="text-lg font-semibold text-gray-900">IP 주소 제한</h2>
        </div>

        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              id="require_ip_check"
              bind:checked={require_ip_check}
              class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label for="require_ip_check" class="text-sm font-medium text-gray-700">
              IP 주소 검증 활성화
            </label>
          </div>

          {#if require_ip_check}
            <div class="mt-4 space-y-4">
              <div>
                <label for="new-ip" class="block text-sm font-medium text-gray-700 mb-2">
                  허용 IP 주소 추가
                </label>
                <div class="flex gap-2">
                  <input
                    id="new-ip"
                    type="text"
                    bind:value={newIp}
                    placeholder="예: 192.168.1.1"
                    class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onkeydown={(e) => e.key === 'Enter' && addIp()}
                  />
                  <button
                    type="button"
                    onclick={addIp}
                    class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    추가
                  </button>
                </div>
              </div>

              {#if allowed_ips.length > 0}
                <div>
                  <div
                    aria-label="허용된 IP 주소 목록"
                    class="block text-sm font-medium text-gray-700 mb-2"
                  >
                    허용된 IP 주소 목록 ({allowed_ips.length}개)
                  </div>
                  <div class="space-y-2">
                    {#each allowed_ips as ip}
                      <div
                        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span class="font-mono text-sm text-gray-900">{ip}</span>
                        <button
                          type="button"
                          onclick={() => removeIp(ip)}
                          class="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          삭제
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              {:else}
                <div
                  class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg"
                >
                  허용된 IP 주소가 없습니다. IP 주소를 추가해주세요.
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex gap-2">
            <div class="text-yellow-600 mt-0.5">⚠️</div>
            <div class="text-sm text-yellow-800">
              <p class="font-medium mb-1">IP 주소 제한 주의사항</p>
              <ul class="list-disc list-inside space-y-1 text-yellow-700">
                <li>IP 주소 검증을 활성화하면 등록된 IP에서만 출퇴근이 가능합니다.</li>
                <li>사무실 공용 IP, VPN IP 등을 정확히 등록해주세요.</li>
                <li>잘못된 설정 시 직원들이 출퇴근을 기록할 수 없으니 주의하세요.</li>
                <li>재택근무 등의 경우를 고려하여 설정해주세요.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 현재 설정 미리보기 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">설정 요약</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-blue-50 rounded-lg">
            <div class="text-sm text-blue-600 mb-1">근무 시간</div>
            <div class="text-lg font-semibold text-blue-900">
              {work_start_time} ~ {work_end_time}
            </div>
          </div>
          <div class="p-4 bg-yellow-50 rounded-lg">
            <div class="text-sm text-yellow-600 mb-1">지각/조기퇴근 기준</div>
            <div class="text-lg font-semibold text-yellow-900">
              {late_threshold_minutes}분 / {early_leave_threshold_minutes}분
            </div>
          </div>
          <div class="p-4 bg-green-50 rounded-lg">
            <div class="text-sm text-green-600 mb-1">IP 주소 검증</div>
            <div class="text-lg font-semibold text-green-900">
              {require_ip_check ? '활성화' : '비활성화'}
            </div>
          </div>
          <div class="p-4 bg-purple-50 rounded-lg">
            <div class="text-sm text-purple-600 mb-1">허용 IP 개수</div>
            <div class="text-lg font-semibold text-purple-900">{allowed_ips.length}개</div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
