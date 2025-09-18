<script lang="ts">
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
	import { formatCurrency, formatDate } from '$lib/utils/format'
	import {
		DollarSignIcon,
		EditIcon,
		FileTextIcon,
		PlusIcon,
		SaveIcon,
		UsersIcon,
		XIcon
	} from '@lucide/svelte'
	import { onMount } from 'svelte'

	// 프로젝트 데이터
	let project = $state<any>(null);
	let projectBudgets = $state<any[]>([]);
	let projectMembers = $state<any[]>([]);
	let evidenceItems = $state<any[]>([]);
	let isLoading = $state(true);
	let isEditing = $state(false);
	let showEditModal = $state(false);
	let showBudgetModal = $state(false);
	let showMemberModal = $state(false);

	// 편집 폼 데이터
	let editForm = $state({
		code: '',
		title: '',
		description: '',
		sponsor_type: 'government',
		sponsor_name: '',
		start_date: '',
		end_date: '',
		manager_id: '',
		status: 'active',
		budget_total: 0,
		research_type: 'applied',
		technology_area: '',
		priority: 'high'
	});

	// 예산 폼 데이터
	let budgetForm = $state({
		period_number: 1,
		fiscal_year: new Date().getFullYear(),
		start_date: '',
		end_date: '',
		personnel_cost_cash: 0,
		personnel_cost_in_kind: 0,
		research_material_cost_cash: 0,
		research_material_cost_in_kind: 0,
		research_activity_cost_cash: 0,
		research_activity_cost_in_kind: 0,
		indirect_cost_cash: 0,
		indirect_cost_in_kind: 0
	});

	// 멤버 폼 데이터
	let memberForm = $state({
		employee_id: '',
		role: 'researcher',
		participation_rate: 100,
		monthly_amount: 0,
		contribution_type: 'cash'
	});

	let availableEmployees = $state<any[]>([]);

	// 데이터 로드
	async function loadProjectData() {
		try {
			isLoading = true;
			
		// RND-ASW 프로젝트 정보 로드
		const projectResponse = await fetch('/api/project-management/projects?code=RND-ASW');
		if (projectResponse.ok) {
			const projectResult = await projectResponse.json();
			
			if (projectResult.success && projectResult.data.length > 0) {
				project = projectResult.data[0];
				initEditForm();
				
				// 예산 정보 로드
				await loadBudgets();
				
				// 멤버 정보 로드
				await loadMembers();
				
				// 증빙 정보 로드
				await loadEvidenceItems();
			} else {
				console.log('RND-ASW 프로젝트를 찾을 수 없습니다.');
			}
		} else {
			console.error('프로젝트 정보 로드 실패:', projectResponse.status);
		}
			
			// 직원 목록 로드
			await loadEmployees();
			
		} catch (error) {
			console.error('프로젝트 데이터 로드 실패:', error);
		} finally {
			isLoading = false;
		}
	}

	async function loadBudgets() {
		if (!project) return;
		
		try {
			const response = await fetch(`/api/project-management/project-budgets?projectId=${project.id}`);
			const result = await response.json();
			
			if (result.success) {
				projectBudgets = result.data;
			}
		} catch (error) {
			console.error('예산 데이터 로드 실패:', error);
		}
	}

	async function loadMembers() {
		if (!project) return;
		
		try {
			const response = await fetch(`/api/project-management/project-members?projectId=${project.id}`);
			const result = await response.json();
			
			if (result.success) {
				projectMembers = result.data;
			}
		} catch (error) {
			console.error('멤버 데이터 로드 실패:', error);
		}
	}

	async function loadEvidenceItems() {
		if (!project || projectBudgets.length === 0) return;
		
		try {
			const currentBudget = projectBudgets[0];
			const response = await fetch(`/api/project-management/evidence?projectBudgetId=${currentBudget.id}`);
			const result = await response.json();
			
			if (result.success) {
				evidenceItems = result.data;
			}
		} catch (error) {
			console.error('증빙 데이터 로드 실패:', error);
		}
	}

	async function loadEmployees() {
		try {
			const response = await fetch('/api/project-management/employees');
			const result = await response.json();
			
			if (result.success) {
				availableEmployees = result.data;
			}
		} catch (error) {
			console.error('직원 데이터 로드 실패:', error);
		}
	}

	// 편집 폼 초기화
	function initEditForm() {
		if (!project) return;
		
		editForm = {
			code: project.code || '',
			title: project.title || '',
			description: project.description || '',
			sponsor_type: project.sponsor_type || 'government',
			sponsor_name: project.sponsor_name || '',
			start_date: project.start_date || '',
			end_date: project.end_date || '',
			manager_id: project.manager_id || '',
			status: project.status || 'active',
			budget_total: project.budget_total || 0,
			research_type: project.research_type || 'applied',
			technology_area: project.technology_area || '',
			priority: project.priority || 'high'
		};
	}

	// 프로젝트 정보 저장
	async function saveProject() {
		if (!project) return;
		
		try {
			const response = await fetch(`/api/project-management/projects/${project.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(editForm)
			});
			
			const result = await response.json();
			
			if (result.success) {
				project = { ...project, ...editForm };
				showEditModal = false;
				alert('프로젝트 정보가 저장되었습니다.');
			} else {
				alert('저장에 실패했습니다: ' + result.message);
			}
		} catch (error) {
			console.error('프로젝트 저장 실패:', error);
			alert('저장 중 오류가 발생했습니다.');
		}
	}

	// 예산 추가
	async function addBudget() {
		if (!project) return;
		
		try {
			const response = await fetch('/api/project-management/project-budgets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					projectId: project.id,
					...budgetForm
				})
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadBudgets();
				showBudgetModal = false;
				alert('예산이 추가되었습니다.');
			} else {
				alert('예산 추가에 실패했습니다: ' + result.message);
			}
		} catch (error) {
			console.error('예산 추가 실패:', error);
			alert('예산 추가 중 오류가 발생했습니다.');
		}
	}

	// 멤버 추가
	async function addMember() {
		if (!project) return;
		
		try {
			const response = await fetch('/api/project-management/project-members', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					projectId: project.id,
					...memberForm
				})
			});
			
			const result = await response.json();
			
			if (result.success) {
				await loadMembers();
				showMemberModal = false;
				alert('멤버가 추가되었습니다.');
			} else {
				alert('멤버 추가에 실패했습니다: ' + result.message);
			}
		} catch (error) {
			console.error('멤버 추가 실패:', error);
			alert('멤버 추가 중 오류가 발생했습니다.');
		}
	}

	onMount(() => {
		loadProjectData();
	});
</script>

<div class="space-y-6">
	<!-- 페이지 헤더 -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">RND-ASW 프로젝트 관리</h1>
			<p class="text-gray-600">A-SW 플랫폼 기술 개발 프로젝트</p>
		</div>
		<ThemeButton onclick={() => showEditModal = true}>
			<EditIcon size={16} class="mr-2" />
			프로젝트 편집
		</ThemeButton>
	</div>

	{#if isLoading}
		<div class="text-center py-8">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<p class="mt-2 text-sm text-gray-500">데이터를 로드하는 중...</p>
		</div>
	{:else if project}
		<!-- 프로젝트 기본 정보 -->
		<ThemeCard>
			<div class="p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">프로젝트 기본 정보</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">프로젝트 코드</div>
						<p class="text-sm text-gray-900">{project.code}</p>
					</div>
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">프로젝트 제목</div>
						<p class="text-sm text-gray-900">{project.title}</p>
					</div>
					<div class="md:col-span-2">
						<div class="block text-sm font-medium text-gray-700 mb-1">설명</div>
						<p class="text-sm text-gray-900">{project.description}</p>
					</div>
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">스폰서 유형</div>
						<p class="text-sm text-gray-900">{project.sponsor_type}</p>
					</div>
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">상태</div>
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
							{project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
							{project.status || 'active'}
						</span>
					</div>
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">총 예산</div>
						<p class="text-sm text-gray-900">{formatCurrency(project.budget_total)}</p>
					</div>
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">연구 유형</div>
						<p class="text-sm text-gray-900">{project.research_type || 'applied'}</p>
					</div>
				</div>
			</div>
		</ThemeCard>

		<!-- 예산 정보 -->
		<ThemeCard>
			<div class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-gray-900">예산 정보</h2>
					<ThemeButton size="sm" onclick={() => showBudgetModal = true}>
						<PlusIcon size={14} class="mr-1" />
						예산 추가
					</ThemeButton>
				</div>
				
				{#if projectBudgets.length > 0}
					<div class="space-y-4">
						{#each projectBudgets as budget}
							<div class="border border-gray-200 rounded-lg p-4">
								<div class="flex items-center justify-between mb-3">
									<h3 class="font-medium text-gray-900">{budget.period_number}연차 ({budget.fiscal_year}년)</h3>
									<span class="text-sm text-gray-500">
										{formatDate(budget.start_date)} ~ {formatDate(budget.end_date)}
									</span>
								</div>
								<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
									<div>
										<span class="text-gray-600">인건비:</span>
										<span class="ml-2 font-medium">{formatCurrency(budget.personnel_cost_cash + budget.personnel_cost_in_kind)}</span>
									</div>
									<div>
										<span class="text-gray-600">연구재료비:</span>
										<span class="ml-2 font-medium">{formatCurrency(budget.research_material_cost_cash + budget.research_material_cost_in_kind)}</span>
									</div>
									<div>
										<span class="text-gray-600">연구활동비:</span>
										<span class="ml-2 font-medium">{formatCurrency(budget.research_activity_cost_cash + budget.research_activity_cost_in_kind)}</span>
									</div>
									<div>
										<span class="text-gray-600">간접비:</span>
										<span class="ml-2 font-medium">{formatCurrency(budget.indirect_cost_cash + budget.indirect_cost_in_kind)}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-gray-500">
						<DollarSignIcon size={48} class="mx-auto mb-2 text-gray-300" />
						<p>등록된 예산이 없습니다.</p>
					</div>
				{/if}
			</div>
		</ThemeCard>

		<!-- 프로젝트 멤버 -->
		<ThemeCard>
			<div class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-gray-900">프로젝트 멤버</h2>
					<ThemeButton size="sm" onclick={() => showMemberModal = true}>
						<PlusIcon size={14} class="mr-1" />
						멤버 추가
					</ThemeButton>
				</div>
				
				{#if projectMembers.length > 0}
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">참여율</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">월간 금액</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기여 유형</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each projectMembers as member}
									<tr>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{member.first_name} {member.last_name}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.participation_rate}%</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(member.monthly_amount)}</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.contribution_type}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="text-center py-8 text-gray-500">
						<UsersIcon size={48} class="mx-auto mb-2 text-gray-300" />
						<p>등록된 멤버가 없습니다.</p>
					</div>
				{/if}
			</div>
		</ThemeCard>

		<!-- 증빙 관리 -->
		<ThemeCard>
			<div class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-gray-900">증빙 관리</h2>
					<ThemeButton size="sm">
						<PlusIcon size={14} class="mr-1" />
						증빙 추가
					</ThemeButton>
				</div>
				
				{#if evidenceItems.length > 0}
					<div class="space-y-3">
						{#each evidenceItems as item}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<div>
									<h4 class="font-medium text-gray-900">{item.name}</h4>
									<p class="text-sm text-gray-500">{item.category_name} | {formatCurrency(item.budget_amount)}</p>
								</div>
								<div class="flex items-center space-x-2">
									<span class="px-2 py-1 text-xs font-medium rounded-full
										{item.status === 'completed' ? 'bg-green-100 text-green-800' :
										 item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
										 'bg-gray-100 text-gray-800'}">
										{item.status}
									</span>
									<span class="text-sm text-gray-500">{item.progress}%</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-gray-500">
						<FileTextIcon size={48} class="mx-auto mb-2 text-gray-300" />
						<p>등록된 증빙이 없습니다.</p>
					</div>
				{/if}
			</div>
		</ThemeCard>
	{:else}
		<div class="text-center py-8 text-gray-500">
			<p>RND-ASW 프로젝트를 찾을 수 없습니다.</p>
		</div>
	{/if}
</div>

<!-- 프로젝트 편집 모달 -->
{#if showEditModal}
<ThemeModal open={showEditModal} onclose={() => showEditModal = false}>
	<div class="p-6 max-w-2xl">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-medium text-gray-900">프로젝트 편집</h3>
			<button onclick={() => showEditModal = false} class="text-gray-400 hover:text-gray-600">
				<XIcon size={20} />
			</button>
		</div>
		
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="edit-code" class="block text-sm font-medium text-gray-700 mb-1">프로젝트 코드</label>
					<input id="edit-code" type="text" bind:value={editForm.code} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<label for="edit-status" class="block text-sm font-medium text-gray-700 mb-1">상태</label>
					<select id="edit-status" bind:value={editForm.status} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
						<option value="active">활성</option>
						<option value="completed">완료</option>
						<option value="paused">일시정지</option>
						<option value="cancelled">취소</option>
					</select>
				</div>
			</div>
			
			<div>
				<label for="edit-title" class="block text-sm font-medium text-gray-700 mb-1">프로젝트 제목</label>
				<input id="edit-title" type="text" bind:value={editForm.title} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
			</div>
			
			<div>
				<label for="edit-description" class="block text-sm font-medium text-gray-700 mb-1">설명</label>
				<textarea id="edit-description" bind:value={editForm.description} rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
			</div>
			
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="edit-start-date" class="block text-sm font-medium text-gray-700 mb-1">시작일</label>
					<input id="edit-start-date" type="date" bind:value={editForm.start_date} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<label for="edit-end-date" class="block text-sm font-medium text-gray-700 mb-1">종료일</label>
					<input id="edit-end-date" type="date" bind:value={editForm.end_date} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
			</div>
			
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="edit-sponsor-type" class="block text-sm font-medium text-gray-700 mb-1">스폰서 유형</label>
					<select id="edit-sponsor-type" bind:value={editForm.sponsor_type} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
						<option value="government">정부</option>
						<option value="private">민간</option>
						<option value="internal">내부</option>
					</select>
				</div>
				<div>
					<label for="edit-budget-total" class="block text-sm font-medium text-gray-700 mb-1">총 예산</label>
					<input id="edit-budget-total" type="number" bind:value={editForm.budget_total} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
			</div>
		</div>
		
		<div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
			<ThemeButton variant="ghost" onclick={() => showEditModal = false}>취소</ThemeButton>
			<ThemeButton onclick={saveProject}>
				<SaveIcon size={16} class="mr-2" />
				저장
			</ThemeButton>
		</div>
	</div>
</ThemeModal>
{/if}

<!-- 예산 추가 모달 -->
{#if showBudgetModal}
<ThemeModal open={showBudgetModal} onclose={() => showBudgetModal = false}>
	<div class="p-6 max-w-2xl">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-medium text-gray-900">예산 추가</h3>
			<button onclick={() => showBudgetModal = false} class="text-gray-400 hover:text-gray-600">
				<XIcon size={20} />
			</button>
		</div>
		
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="budget-period" class="block text-sm font-medium text-gray-700 mb-1">연차</label>
					<input id="budget-period" type="number" bind:value={budgetForm.period_number} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<label for="budget-fiscal-year" class="block text-sm font-medium text-gray-700 mb-1">회계연도</label>
					<input id="budget-fiscal-year" type="number" bind:value={budgetForm.fiscal_year} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
			</div>
			
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="budget-start-date" class="block text-sm font-medium text-gray-700 mb-1">시작일</label>
					<input id="budget-start-date" type="date" bind:value={budgetForm.start_date} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<label for="budget-end-date" class="block text-sm font-medium text-gray-700 mb-1">종료일</label>
					<input id="budget-end-date" type="date" bind:value={budgetForm.end_date} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
			</div>
			
			<div class="space-y-3">
				<h4 class="font-medium text-gray-900">인건비</h4>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="personnel-cash" class="block text-sm font-medium text-gray-700 mb-1">현금</label>
						<input id="personnel-cash" type="number" bind:value={budgetForm.personnel_cost_cash} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
					<div>
						<label for="personnel-kind" class="block text-sm font-medium text-gray-700 mb-1">현물</label>
						<input id="personnel-kind" type="number" bind:value={budgetForm.personnel_cost_in_kind} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
				</div>
			</div>
			
			<div class="space-y-3">
				<h4 class="font-medium text-gray-900">연구재료비</h4>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="material-cash" class="block text-sm font-medium text-gray-700 mb-1">현금</label>
						<input id="material-cash" type="number" bind:value={budgetForm.research_material_cost_cash} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
					<div>
						<label for="material-kind" class="block text-sm font-medium text-gray-700 mb-1">현물</label>
						<input id="material-kind" type="number" bind:value={budgetForm.research_material_cost_in_kind} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
				</div>
			</div>
			
			<div class="space-y-3">
				<h4 class="font-medium text-gray-900">연구활동비</h4>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="activity-cash" class="block text-sm font-medium text-gray-700 mb-1">현금</label>
						<input id="activity-cash" type="number" bind:value={budgetForm.research_activity_cost_cash} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
					<div>
						<label for="activity-kind" class="block text-sm font-medium text-gray-700 mb-1">현물</label>
						<input id="activity-kind" type="number" bind:value={budgetForm.research_activity_cost_in_kind} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
				</div>
			</div>
			
			<div class="space-y-3">
				<h4 class="font-medium text-gray-900">간접비</h4>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="indirect-cash" class="block text-sm font-medium text-gray-700 mb-1">현금</label>
						<input id="indirect-cash" type="number" bind:value={budgetForm.indirect_cost_cash} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
					<div>
						<label for="indirect-kind" class="block text-sm font-medium text-gray-700 mb-1">현물</label>
						<input id="indirect-kind" type="number" bind:value={budgetForm.indirect_cost_in_kind} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
				</div>
			</div>
		</div>
		
		<div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
			<ThemeButton variant="ghost" onclick={() => showBudgetModal = false}>취소</ThemeButton>
			<ThemeButton onclick={addBudget}>
				<SaveIcon size={16} class="mr-2" />
				추가
			</ThemeButton>
		</div>
	</div>
</ThemeModal>
{/if}

<!-- 멤버 추가 모달 -->
{#if showMemberModal}
<ThemeModal open={showMemberModal} onclose={() => showMemberModal = false}>
	<div class="p-6 max-w-lg">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-medium text-gray-900">멤버 추가</h3>
			<button onclick={() => showMemberModal = false} class="text-gray-400 hover:text-gray-600">
				<XIcon size={20} />
			</button>
		</div>
		
		<div class="space-y-4">
			<div>
				<label for="member-employee" class="block text-sm font-medium text-gray-700 mb-1">직원</label>
				<select id="member-employee" bind:value={memberForm.employee_id} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
					<option value="">직원을 선택하세요</option>
					{#each availableEmployees as employee}
						<option value={employee.id}>{employee.first_name} {employee.last_name}</option>
					{/each}
				</select>
			</div>
			
			<div>
				<label for="member-role" class="block text-sm font-medium text-gray-700 mb-1">역할</label>
				<select id="member-role" bind:value={memberForm.role} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
					<option value="researcher">연구원</option>
					<option value="manager">관리자</option>
					<option value="coordinator">코디네이터</option>
				</select>
			</div>
			
			<div>
				<label for="member-participation" class="block text-sm font-medium text-gray-700 mb-1">참여율 (%)</label>
				<input id="member-participation" type="number" bind:value={memberForm.participation_rate} min="0" max="100" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
			</div>
			
			<div>
				<label for="member-monthly-amount" class="block text-sm font-medium text-gray-700 mb-1">월간 금액</label>
				<input id="member-monthly-amount" type="number" bind:value={memberForm.monthly_amount} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
			</div>
			
			<div>
				<label for="member-contribution-type" class="block text-sm font-medium text-gray-700 mb-1">기여 유형</label>
				<select id="member-contribution-type" bind:value={memberForm.contribution_type} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
					<option value="cash">현금</option>
					<option value="in_kind">현물</option>
				</select>
			</div>
		</div>
		
		<div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
			<ThemeButton variant="ghost" onclick={() => showMemberModal = false}>취소</ThemeButton>
			<ThemeButton onclick={addMember}>
				<SaveIcon size={16} class="mr-2" />
				추가
			</ThemeButton>
		</div>
	</div>
</ThemeModal>
{/if}
