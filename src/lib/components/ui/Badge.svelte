<script lang="ts">
  let {
    color = 'gray',
    variant = 'secondary',
    class: className = '',
    children,
  } = $props<{
    color?: 'gray' | 'green' | 'red' | 'yellow' | 'blue'
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
    class?: string
    children?: import('svelte').Snippet
  }>()

  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  const variantClasses: Record<string, string> = {
    primary: 'bg-blue-100 text-blue-700 border-blue-200',
    secondary: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
  }

  let finalClasses = $derived(variantClasses[variant] || colorClasses[color])
</script>

<span
  class={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${finalClasses} ${className}`}
>
  {@render children?.()}
</span>
