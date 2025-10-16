<script lang="ts">
  import { toastStore } from '$lib/stores/toast.svelte'
  import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XCircleIcon, XIcon } from '@lucide/svelte'

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
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
  {#each toastStore.toasts as toast (toast.id)}
    {@const Icon = getIcon(toast.type)}
    <div
      class="pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[320px] max-w-md animate-in slide-in-from-right-full {getColorClasses(
        toast.type,
      )}"
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
