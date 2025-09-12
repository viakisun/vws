<script lang="ts">
	import ThemePageHeader from '$lib/components/ui/ThemePageHeader.svelte';
	import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte';
	import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte';
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte';
	import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte';
	import ThemeInput from '$lib/components/ui/ThemeInput.svelte';
	import ThemeDropdown from '$lib/components/ui/ThemeDropdown.svelte';
	import { 
		SearchIcon, 
		FilterIcon, 
		PlusIcon, 
		DownloadIcon, 
		UploadIcon,
		RefreshCwIcon,
		SettingsIcon
	} from 'lucide-svelte';

	interface Props {
		title: string;
		subtitle?: string;
		children?: any;
		showSearch?: boolean;
		showFilters?: boolean;
		showActions?: boolean;
		searchPlaceholder?: string;
		actions?: any[];
		stats?: Array<{
			title: string;
			value: string | number;
			change?: string;
			changeType?: 'positive' | 'negative' | 'neutral';
			icon?: any;
			href?: string;
		}>;
	}

	let {
		title,
		subtitle = '',
		children,
		showSearch = true,
		showFilters = true,
		showActions = true,
		searchPlaceholder = '검색...',
		actions = [],
		stats = [],
		...restProps
	}: Props = $props();

	let searchTerm = $state('');
	let selectedFilter = $state('all');
	let showFiltersDropdown = $state(false);

	const defaultActions = [
		{
			label: '새로고침',
			icon: RefreshCwIcon,
			onclick: () => window.location.reload(),
			variant: 'ghost' as const
		},
		{
			label: '설정',
			icon: SettingsIcon,
			onclick: () => console.log('Settings clicked'),
			variant: 'ghost' as const
		}
	];

	const allActions = [...defaultActions, ...actions];
</script>

<div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
	<!-- 페이지 헤더 -->
	<ThemePageHeader {title} {subtitle} />

	<!-- 통계 카드들 -->
	{#if stats.length > 0}
		<ThemeGrid cols={1} mdCols={2} lgCols={4} gap={6}>
			{#each stats as stat}
				<ThemeStatCard
					title={stat.title}
					value={stat.value}
					change={stat.change}
					changeType={stat.changeType}
					icon={stat.icon}
					href={stat.href}
				/>
			{/each}
		</ThemeGrid>
	{/if}

	<!-- 검색 및 필터 섹션 -->
	{#if showSearch || showFilters || showActions}
		<ThemeCard class="p-4">
			<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
				<!-- 검색 및 필터 -->
				<div class="flex flex-col sm:flex-row gap-4 flex-1">
					{#if showSearch}
						<div class="relative flex-1 max-w-md">
							<SearchIcon size={20} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<ThemeInput
								type="text"
								placeholder={searchPlaceholder}
								bind:value={searchTerm}
								class="pl-10"
							/>
						</div>
					{/if}

					{#if showFilters}
						<div class="relative">
							<ThemeButton
								variant="outline"
								size="sm"
								onclick={() => showFiltersDropdown = !showFiltersDropdown}
								class="flex items-center gap-2"
							>
								<FilterIcon size={16} />
								필터
							</ThemeButton>
							
							{#if showFiltersDropdown}
								<div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg border z-10" style="background: var(--color-surface); border-color: var(--color-border);">
									<div class="py-1">
										<button
											onclick={() => { selectedFilter = 'all'; showFiltersDropdown = false; }}
											class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
											class:bg-blue-50={selectedFilter === 'all'}
											class:dark:bg-blue-900={selectedFilter === 'all'}
											style="color: var(--color-text);"
										>
											전체
										</button>
										<button
											onclick={() => { selectedFilter = 'active'; showFiltersDropdown = false; }}
											class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
											class:bg-blue-50={selectedFilter === 'active'}
											class:dark:bg-blue-900={selectedFilter === 'active'}
											style="color: var(--color-text);"
										>
											활성
										</button>
										<button
											onclick={() => { selectedFilter = 'inactive'; showFiltersDropdown = false; }}
											class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
											class:bg-blue-50={selectedFilter === 'inactive'}
											class:dark:bg-blue-900={selectedFilter === 'inactive'}
											style="color: var(--color-text);"
										>
											비활성
										</button>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- 액션 버튼들 -->
				{#if showActions && allActions.length > 0}
					<div class="flex gap-2">
						{#each allActions as action}
							<ThemeButton
								variant={action.variant || 'primary'}
								size="sm"
								onclick={action.onclick}
								class="flex items-center gap-2"
							>
								{#if action.icon}
									<action.icon size={16} />
								{/if}
								{action.label}
							</ThemeButton>
						{/each}
					</div>
				{/if}
			</div>
		</ThemeCard>
	{/if}

	<!-- 메인 콘텐츠 -->
	<ThemeSpacer size={6}>
		{@render children()}
	</ThemeSpacer>
</div>

<style>
	/* 추가 스타일이 필요한 경우 여기에 작성 */
</style>
