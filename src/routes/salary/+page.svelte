<script lang="ts">
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte';
	import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte';
	import SalaryDashboard from '$lib/components/salary/SalaryDashboard.svelte';
	import SalaryContracts from '$lib/components/salary/SalaryContracts.svelte';
	import SalaryHistory from '$lib/components/salary/SalaryHistory.svelte';
	import PayslipGenerator from '$lib/components/salary/PayslipGenerator.svelte';
	import { 
		loadContracts, 
		loadContractStats,
		isLoading,
		error
	} from '$lib/stores/salary/contract-store';
	import { 
		loadPayrolls,
		loadEmployeePayrolls
	} from '$lib/stores/salary/salary-store';

	// 탭 정의
	const tabs = [
		{
			id: 'overview',
			label: '개요',
			icon: 'chart-bar'
		},
		{
			id: 'contracts',
			label: '급여 계약',
			icon: 'document-text'
		},
		{
			id: 'history',
			label: '급여 이력',
			icon: 'clock'
		},
		{
			id: 'payslips',
			label: '급여명세서',
			icon: 'printer'
		}
	];

	let activeTab = $state('overview');
	let mounted = false;

	onMount(async () => {
		mounted = true;
		// 기본 데이터 로드
		await loadPayrolls();
		await loadEmployeePayrolls();
		await loadContractStats();
	});

	// 탭 변경 시 데이터 로드
	$effect(() => {
		if (!mounted) return;
		
		const currentTab = activeTab;
		console.log('Salary tab changed to:', currentTab);
		
		switch (currentTab) {
			case 'contracts':
				loadContracts();
				break;
			case 'history':
				loadContracts();
				break;
			case 'payslips':
				// 급여명세서 탭은 별도 데이터 로드 불필요
				break;
		}
	});
</script>

<svelte:head>
	<title>급여 관리 - VWS</title>
	<meta name="description" content="전체 직원 급여 관리 및 급여명세서 출력" />
</svelte:head>

<PageLayout>
	<!-- 페이지 헤더 -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">급여 관리</h1>
			<p class="mt-2 text-gray-600">전체 직원 급여 현황 및 계약 관리</p>
		</div>
	</div>

	<!-- 탭 시스템 -->
	<ThemeTabs
		{tabs}
		bind:activeTab
		variant="underline"
		size="md"
		class="mb-6"
	>
		{#snippet children(tab: any)}
			{#if tab.id === 'overview'}
				<!-- 개요 탭 -->
				<ThemeSpacer size={6}>
					<SalaryDashboard />
				</ThemeSpacer>

			{:else if tab.id === 'contracts'}
				<!-- 급여 계약 탭 -->
				<ThemeSpacer size={6}>
					<SalaryContracts />
				</ThemeSpacer>

			{:else if tab.id === 'history'}
				<!-- 급여 이력 탭 -->
				<ThemeSpacer size={6}>
					<SalaryHistory />
				</ThemeSpacer>

			{:else if tab.id === 'payslips'}
				<!-- 급여명세서 탭 -->
				<ThemeSpacer size={6}>
					<PayslipGenerator />
				</ThemeSpacer>
			{/if}
		{/snippet}
	</ThemeTabs>
</PageLayout>
