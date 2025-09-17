<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/svelte';

	interface Tab {
		id: string;
		label: string;
		icon?: any;
		badge?: string | number;
		disabled?: boolean;
	}

	interface Props {
		tabs: Tab[];
		activeTab?: string;
		children?: any;
		class?: string;
		orientation?: 'horizontal' | 'vertical';
		size?: 'sm' | 'md' | 'lg';
		variant?: 'default' | 'pills' | 'underline' | 'cards';
		scrollable?: boolean;
		onTabChange?: (tabId: string) => void;
	}

	let {
		tabs,
		activeTab = $bindable(tabs[0]?.id || ''),
		children,
		class: className = '',
		orientation = 'horizontal',
		size = 'md',
		variant = 'default',
		scrollable = false,
		onTabChange,
		...restProps
	}: Props = $props();

	let currentTab = $state(activeTab);
	let tabContainer: HTMLDivElement;
	let scrollPosition = $state(0);
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	// 탭 변경 핸들러
	function handleTabChange(tabId: string) {
		if (tabs.find(tab => tab.id === tabId)?.disabled) return;
		
		currentTab = tabId;
		onTabChange?.(tabId);
	}

	// 스크롤 핸들러
	function handleScroll() {
		if (!tabContainer) return;
		
		scrollPosition = tabContainer.scrollLeft;
		canScrollLeft = scrollPosition > 0;
		canScrollRight = scrollPosition < tabContainer.scrollWidth - tabContainer.clientWidth;
	}

	// 스크롤 버튼 핸들러
	function scrollTabs(direction: 'left' | 'right') {
		if (!tabContainer) return;
		
		const scrollAmount = 200;
		const newPosition = direction === 'left' 
			? Math.max(0, scrollPosition - scrollAmount)
			: Math.min(tabContainer.scrollWidth - tabContainer.clientWidth, scrollPosition + scrollAmount);
		
		tabContainer.scrollTo({ left: newPosition, behavior: 'smooth' });
	}

	// 반응형 탭 크기 클래스
	const getTabSizeClass = () => {
		const sizeClasses = {
			sm: 'px-3 py-1.5 text-sm',
			md: 'px-4 py-2 text-sm',
			lg: 'px-6 py-3 text-base'
		};
		return sizeClasses[size];
	};

	// 탭 스타일 클래스
	const getTabClass = (tab: Tab) => {
		const isActive = currentTab === tab.id;
		const baseClass = `flex items-center gap-2 transition-all duration-200 ${getTabSizeClass()}`;
		
		if (variant === 'pills') {
			return `${baseClass} rounded-full ${
				isActive 
					? 'text-white shadow-sm' 
					: 'hover:opacity-80'
			}`;
		}
		
		if (variant === 'underline') {
			return `${baseClass} border-b-2 ${
				isActive 
					? 'border-blue-500 text-blue-600' 
					: 'border-transparent hover:border-gray-300'
			}`;
		}
		
		if (variant === 'cards') {
			return `${baseClass} rounded-lg border ${
				isActive 
					? 'border-blue-500 shadow-sm' 
					: 'border-gray-200 hover:border-gray-300'
			}`;
		}
		
		// default variant
		return `${baseClass} ${
			isActive 
				? 'text-white' 
				: 'hover:opacity-80'
		}`;
	};

	// 탭 스타일
	const getTabStyle = (tab: Tab) => {
		const isActive = currentTab === tab.id;
		
		if (variant === 'pills') {
			return isActive 
				? 'background: var(--color-primary);' 
				: 'color: var(--color-text-secondary); background: transparent;';
		}
		
		if (variant === 'underline') {
			return isActive 
				? 'color: var(--color-primary);' 
				: 'color: var(--color-text-secondary);';
		}
		
		if (variant === 'cards') {
			return isActive 
				? 'background: var(--color-surface-elevated); border-color: var(--color-primary);' 
				: 'background: var(--color-surface); border-color: var(--color-border); color: var(--color-text-secondary);';
		}
		
		// default variant
		return isActive 
			? 'background: var(--color-primary);' 
			: 'color: var(--color-text-secondary); background: transparent;';
	};

	onMount(() => {
		if (scrollable && tabContainer) {
			handleScroll();
			tabContainer.addEventListener('scroll', handleScroll);
		}
	});
</script>

<div class="theme-tabs {orientation === 'vertical' ? 'flex' : 'block'} {className}" {...restProps}>
	<!-- 탭 헤더 -->
	<div class="relative {orientation === 'vertical' ? 'flex-shrink-0 w-48' : 'w-full'}">
		{#if scrollable && orientation === 'horizontal'}
			<!-- 스크롤 버튼들 -->
			{#if canScrollLeft}
				<button
					onclick={() => scrollTabs('left')}
					class="absolute left-0 top-0 z-10 flex items-center justify-center w-8 h-full bg-white/80 hover:bg-white/90 transition-colors"
					style="background: var(--color-surface);"
				>
					<ChevronLeftIcon size={16} style="color: var(--color-text-secondary);" />
				</button>
			{/if}
			
			{#if canScrollRight}
				<button
					onclick={() => scrollTabs('right')}
					class="absolute right-0 top-0 z-10 flex items-center justify-center w-8 h-full bg-white/80 hover:bg-white/90 transition-colors"
					style="background: var(--color-surface);"
				>
					<ChevronRightIcon size={16} style="color: var(--color-text-secondary);" />
				</button>
			{/if}
		{/if}

		<!-- 탭 리스트 -->
		<div 
			bind:this={tabContainer}
			class="flex {orientation === 'vertical' ? 'flex-col' : 'flex-row'} {scrollable ? 'overflow-x-auto scrollbar-hide' : ''} {variant === 'default' ? 'border-b' : ''}"
			style="border-color: var(--color-border);"
			role="tablist"
		>
			{#each tabs as tab}
				<button
					role="tab"
					aria-selected={currentTab === tab.id}
					aria-controls="tabpanel-{tab.id}"
					disabled={tab.disabled}
					onclick={() => handleTabChange(tab.id)}
					class="{getTabClass(tab)} {tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
					style="{getTabStyle(tab)} {tab.disabled ? 'opacity: 0.5;' : ''}"
				>
					{#if tab.icon}
						<tab.icon size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
					{/if}
					<span>{tab.label}</span>
					{#if tab.badge}
						<span class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full" 
							style="background: var(--color-primary); color: white;">
							{tab.badge}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- 탭 콘텐츠 -->
	<div class="flex-1 {orientation === 'vertical' ? 'ml-6' : 'mt-4'}">
		{#each tabs as tab}
			<div
				role="tabpanel"
				id="tabpanel-{tab.id}"
				aria-labelledby="tab-{tab.id}"
				class="{currentTab === tab.id ? 'block' : 'hidden'}"
			>
			{#if children && typeof children === 'function'}
				{@render children(tab)}
			{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	
	.theme-tabs button[role="tab"]:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>