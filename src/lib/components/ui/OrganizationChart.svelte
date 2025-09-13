<script lang="ts">
	import { onMount } from 'svelte';
	import { BuildingIcon, UsersIcon, DownloadIcon } from 'lucide-svelte';

	interface Employee {
		name: string;
		position: string;
		email: string;
		salary?: number;
	}

	interface Department {
		name: string;
		position: string;
		type?: string;
		children: Employee[];
	}

	interface Executive {
		name: string;
		position: string;
		email: string;
		children: Department[];
	}

	interface OrgStructure {
		[key: string]: Executive;
	}

	let orgData: OrgStructure = {};
	let loading = $state(true);
	let error = $state('');

	// 조직도 데이터 로드
	async function loadOrgData() {
		try {
			loading = true;
			const response = await fetch('/api/organization/chart');
			const result = await response.json();
			
			if (result.success) {
				orgData = result.data;
			} else {
				error = result.error || '조직도 데이터를 불러올 수 없습니다.';
			}
		} catch (err) {
			error = '조직도 데이터를 불러오는 중 오류가 발생했습니다.';
			console.error('Error loading org data:', err);
		} finally {
			loading = false;
		}
	}

	// CSV 다운로드
	async function downloadCSV() {
		try {
			const response = await fetch('/api/organization/chart/download');
			const blob = await response.blob();
			
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'organization_chart.csv';
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err) {
			console.error('Error downloading CSV:', err);
			alert('다운로드 중 오류가 발생했습니다.');
		}
	}

	onMount(() => {
		loadOrgData();
	});
</script>

<div class="space-y-6">
	<!-- 헤더 -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold" style="color: var(--color-text);">조직도</h2>
			<p class="text-sm mt-1" style="color: var(--color-text-secondary);">
				회사의 조직 구조와 직원 정보를 확인할 수 있습니다.
			</p>
		</div>
		<button 
			onclick={downloadCSV}
			class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
		>
			<DownloadIcon class="w-4 h-4" />
			CSV 다운로드
		</button>
	</div>

	<!-- 로딩 상태 -->
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<p class="text-sm" style="color: var(--color-text-secondary);">조직도 데이터를 불러오는 중...</p>
			</div>
		</div>
	{:else if error}
		<div class="text-center py-12">
			<p class="text-red-600 mb-4">{error}</p>
			<button 
				onclick={loadOrgData}
				class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
			>
				다시 시도
			</button>
		</div>
	{:else}
		<!-- 조직도 표시 -->
		<div class="space-y-8">
			{#each Object.entries(orgData) as [executiveName, executive]}
				<div class="bg-white rounded-lg border p-6" style="border-color: var(--color-border);">
					<!-- 임원 정보 -->
					<div class="flex items-center gap-4 mb-6">
						<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
							<BuildingIcon class="w-6 h-6 text-white" />
						</div>
						<div>
							<h3 class="text-lg font-semibold" style="color: var(--color-text);">{executive.name}</h3>
							<p class="text-sm" style="color: var(--color-text-secondary);">{executive.position}</p>
							<p class="text-xs" style="color: var(--color-text-secondary);">{executive.email}</p>
						</div>
					</div>

					<!-- 부서별 직원 -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each executive.children as department}
							<div class="border rounded-lg p-4" style="border-color: var(--color-border);">
								<div class="flex items-center gap-3 mb-4">
									<UsersIcon class="w-5 h-5" style="color: var(--color-primary);" />
									<div>
										<h4 class="font-medium" style="color: var(--color-text);">{department.name}</h4>
										<p class="text-xs" style="color: var(--color-text-secondary);">{department.position}</p>
									</div>
								</div>
								
								<div class="space-y-2">
									{#each department.children as employee}
										<div class="flex items-center justify-between p-2 rounded" style="background: var(--color-surface);">
											<div>
												<p class="text-sm font-medium" style="color: var(--color-text);">{employee.name}</p>
												<p class="text-xs" style="color: var(--color-text-secondary);">{employee.position}</p>
											</div>
											<div class="text-right">
												<p class="text-xs" style="color: var(--color-text-secondary);">{employee.email}</p>
												{#if employee.salary}
													<p class="text-xs font-medium" style="color: var(--color-primary);">
														{Math.round(employee.salary / 10000)}만원
													</p>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

