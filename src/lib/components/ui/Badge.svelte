<script lang="ts">
	let { color = 'gray', class: className = '', children } = $props<{ color?: 'gray' | 'green' | 'red' | 'yellow' | 'blue'; class?: string; children?: unknown }>();
	const colorClasses: Record<string, string> = {
		gray: 'bg-gray-100 text-gray-700 border-gray-200',
		green: 'bg-green-50 text-green-700 border-green-200',
		red: 'bg-red-50 text-red-700 border-red-200',
		yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
		blue: 'bg-blue-50 text-blue-700 border-blue-200'
	};
</script>

<span class={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colorClasses[color]} ${className}`}>
	{@render children?.()}
</span>

