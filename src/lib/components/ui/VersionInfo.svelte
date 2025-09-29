<script lang="ts">
  import { onMount } from 'svelte'

  let version = $state('0.2.1')
  let buildDate = $state('')
  let environment = $state('')

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
      console.warn('버전 정보를 가져올 수 없습니다:', error)
    }
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
</div>
