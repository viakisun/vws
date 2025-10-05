<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'

  let isLoading = $state(false)
  let successMessage = $state('')
  let errorMessage = $state('')

  onMount(() => {
    // Check for success/error parameters in URL
    const urlParams = new URLSearchParams($page.url.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success === 'oauth_success') {
      successMessage = 'Google 로그인이 성공했습니다. 대시보드로 이동합니다...'
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        goto('/dashboard')
      }, 2000)
    } else if (error) {
      switch (error) {
        case 'oauth_error':
          errorMessage = 'Google 로그인 중 오류가 발생했습니다.'
          break
        case 'no_code':
          errorMessage = '인증 코드를 받지 못했습니다.'
          break
        case 'unauthorized_domain':
          errorMessage = '허용되지 않은 도메인입니다.'
          break
        case 'oauth_failed':
          errorMessage = 'Google 로그인에 실패했습니다.'
          break
        case 'auth_failed':
          errorMessage = '인증에 실패했습니다.'
          break
        case 'network_error':
          errorMessage = '네트워크 오류가 발생했습니다. 다시 시도해주세요.'
          break
        default:
          errorMessage = '알 수 없는 오류가 발생했습니다.'
      }
    }
  })

  function handleGoogleLogin() {
    isLoading = true
    window.location.href = '/api/auth/google'
  }
</script>

<svelte:head>
  <title>로그인 - VWS</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">VWS에 로그인</h2>
      <p class="mt-2 text-center text-sm text-gray-600">Google 계정으로 로그인하세요</p>
    </div>

    <div class="mt-8 space-y-6">
      {#if successMessage}
        <div class="rounded-md bg-green-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      {/if}

      {#if errorMessage}
        <div class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          </div>
        </div>
      {/if}

      <button
        type="button"
        class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        onclick={handleGoogleLogin}
        disabled={isLoading}
      >
        {#if isLoading}
          <svg
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          로그인 중...
        {:else}
          <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 로그인
        {/if}
      </button>
    </div>

    <div class="text-center text-sm text-gray-600">
      <p>viasofts.com 도메인 계정만 로그인할 수 있습니다.</p>
    </div>
  </div>
</div>
