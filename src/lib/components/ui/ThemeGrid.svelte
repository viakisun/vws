<script lang="ts">
	interface Props {
		cols?: 1 | 2 | 3 | 4 | 5 | 6;
		mdCols?: 1 | 2 | 3 | 4 | 5 | 6;
		lgCols?: 1 | 2 | 3 | 4 | 5 | 6;
		gap?: 2 | 3 | 4 | 6 | 8;
		class?: string;
		children?: any;
	}

	let {
		cols = 1,
		mdCols = 2,
		lgCols = 3,
		gap = 6,
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	const gridClass = `grid grid-cols-${cols} md:grid-cols-${mdCols} lg:grid-cols-${lgCols} gap-${gap}`;
</script>

<div class="{gridClass} {className}" {...restProps}>
	{@render children()}
</div>
