<script lang="ts">
	import SalaryDashboard from '$lib/components/salary/SalaryDashboard.svelte';
</script>

<svelte:head>
	<title>급여 관리 - VWS</title>
	<meta name="description" content="전체 직원 급여 관리 및 급여명세서 출력" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		<SalaryDashboard />
	</div>
</div>
