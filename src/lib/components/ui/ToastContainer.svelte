<script lang="ts">
  import { toastStore } from '$lib/stores/toast.svelte'
  import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from '@lucide/svelte'

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircleIcon
      case 'error':
        return XCircleIcon
      case 'warning':
        return AlertTriangleIcon
      case 'info':
        return InfoIcon
      default:
        return InfoIcon
    }
  }

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200'
    }
  }
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
  {#each toastStore.toasts as toast (toast.id)}
    {@const Icon = getIcon(toast.type)}
    <div
      class="pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[320px] max-w-md animate-in slide-in-from-right-full"
      class:animate-out={false}
      class:slide-out-to-right-full={false}
      class={getColorClasses(toast.type)}
    >
      <Icon class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p class="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onclick={() => toastStore.remove(toast.id)}
        class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <XIcon class="w-4 h-4" />
      </button>
    </div>
  {/each}
</div>

<style>
  @keyframes slide-in-from-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-in {
    animation: slide-in-from-right 0.3s ease-out;
  }
</style>
