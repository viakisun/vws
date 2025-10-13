<script lang="ts">
  import { onMount } from 'svelte'
  import { logger } from '$lib/utils/logger'

  let version = $state('0.2.2')
  let buildDate = $state('')
  let environment = $state('')
  let currentTime = $state('')

  // 현재 시간 업데이트 함수
  function updateCurrentTime() {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    currentTime = `${hours}:${minutes}:${seconds}`
  }

  onMount(async () => {
    try {
      // package.json에서 버전 정보 가져오기
      const response = await fetch('/api/version')
      if (response.ok) {
        const data = await response.json()
        version = data.version
        buildDate = data.buildDate
        environment = data.environment
      }
    } catch (error) {
      logger.warn('버전 정보를 가져올 수 없습니다:', error)
    }

    // 현재 시간 초기화 및 1초마다 업데이트
    updateCurrentTime()
    const interval = setInterval(updateCurrentTime, 1000)

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(interval)
  })

  // 환경에 따른 색상
  const getEnvironmentColor = (env: string) => {
    switch (env.toLowerCase()) {
      case 'development':
        return 'text-yellow-600 bg-yellow-100'
      case 'staging':
        return 'text-blue-600 bg-blue-100'
      case 'production':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }
</script>

<div class="version-info flex items-center gap-2 text-xs text-gray-500">
  <span class="font-mono">v{version}</span>
  {#if buildDate}
    <span class="text-gray-400">•</span>
    <span class="font-mono">{buildDate}</span>
  {/if}
  {#if environment}
    <span class="text-gray-400">•</span>
    <span class="px-1.5 py-0.5 rounded text-xs font-medium {getEnvironmentColor(environment)}">
      {environment}
    </span>
  {/if}
  {#if currentTime}
    <span class="text-gray-400">•</span>
    <span class="font-mono text-blue-600">{currentTime}</span>
  {/if}
</div>
