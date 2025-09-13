<script lang="ts">
	interface Props {
		size?: 2 | 3 | 4 | 6 | 8 | 12 | 16 | 20 | 24;
		class?: string;
		children?: any;
	}

	let {
		size = 8,
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	const spacerClass = `space-y-${size}`;
</script>

<div class="{spacerClass} {className}" {...restProps}>
	{@render children?.()}
</div>
