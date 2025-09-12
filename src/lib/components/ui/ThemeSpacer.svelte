<script lang="ts">
	interface Props {
		size?: 2 | 3 | 4 | 6 | 8 | 12 | 16 | 20 | 24;
		class?: string;
	}

	let {
		size = 8,
		class: className = '',
		...restProps
	}: Props = $props();

	const spacerClass = `space-y-${size}`;
</script>

<div class="{spacerClass} {className}" {...restProps}>
	{@render children()}
</div>
