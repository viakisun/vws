<script lang="ts">
  import EmployeeSalaryHistory from "$lib/components/salary/EmployeeSalaryHistory.svelte";
</script>

<svelte:head>
  <title>급여 이력 - VWS</title>
  <meta name="description" content="직원별 급여 이력 조회 및 관리" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <EmployeeSalaryHistory />
  </div>
</div>
