<script lang="ts">
  import { page } from '$app/state'
  import { onMount } from 'svelte'

  let mounted = $state(false)
  let testData = $state('로딩 중...')

  onMount(async () => {
    mounted = true
    try {
      const response = await fetch('/api/hr/employees')
      const result = await response.json()
      testData = `성공: ${result.data?.length || 0}명의 직원 조회됨`
    } catch (error) {
      testData = `오류: ${error}`
    }
  })
</script>

<svelte:head>
  <title>HR 테스트 - VWS</title>
</svelte:head>

<div class="container mx-auto p-6">
  <h1 class="text-2xl font-bold mb-4">HR 시스템 테스트</h1>
  
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-lg font-semibold mb-2">API 테스트 결과</h2>
    <p class="text-gray-700">{testData}</p>
    
    <div class="mt-4">
      <p class="text-sm text-gray-500">
        마운트 상태: {mounted ? '완료' : '대기 중'}
      </p>
      <p class="text-sm text-gray-500">
        현재 URL: {page.url.pathname}
      </p>
    </div>
  </div>
</div>
