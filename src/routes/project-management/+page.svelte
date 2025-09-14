<script lang="ts">
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte';
	import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte';
	import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte';
	import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte';
	import ThemeChartPlaceholder from '$lib/components/ui/ThemeChartPlaceholder.svelte';
	import ThemeActivityItem from '$lib/components/ui/ThemeActivityItem.svelte';
	import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte';
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { 
		FlaskConicalIcon,
		UsersIcon,
		DollarSignIcon,
		TrendingUpIcon,
		PlusIcon,
		EyeIcon,
		EditIcon,
		TrashIcon,
		FileTextIcon,
		BarChart3Icon,
		PieChartIcon,
		AlertTriangleIcon,
		CheckCircleIcon,
		ClockIcon,
		TargetIcon,
		CalendarIcon,
		BuildingIcon,
		UserIcon,
		PercentIcon,
		DownloadIcon,
		FileSpreadsheetIcon,
		AlertCircleIcon
	} from 'lucide-svelte';
	import {
		employees,
		getProjectBudgetUtilization
	} from '$lib/stores/rd';

	// 탭 정의
	let tabs = [
		{
			id: 'overview',
			label: '개요',
			icon: BarChart3Icon
		},
		{
			id: 'projects',
			label: '프로젝트',
			icon: FlaskConicalIcon
		}
	];

	let activeTab = $state('overview');
	
	// 데이터베이스 프로젝트 데이터
	let dbProjects = $state<any[]>([]);
	let projectsLoading = $state(true);
	let projectsError = $state<string | null>(null);
	
	// 필터 상태
	let selectedStatus = $state('all');
	let selectedCategory = $state('all');
	
	// 업로드 관련 상태
	let showUploadModal = $state(false);
	let uploadFile = $state<File | null>(null);
	let uploadStatus = $state<'idle' | 'uploading' | 'success' | 'error'>('idle');
	let uploadMessage = $state('');
	let uploadProgress = $state(0);
	let isDragOver = $state(false);

	// 통계 데이터
	let stats = $derived([
		{
			title: '진행중인 프로젝트',
			value: dbProjects.filter((p: any) => p.status === 'active').length,
			change: '+2',
			changeType: 'positive' as const,
			icon: FlaskConicalIcon
		},
		{
			title: '총 예산',
			value: formatCurrency(dbProjects.reduce((sum: any, p: any) => sum + parseFloat(p.budget_total || 0), 0)),
			change: '+5%',
			changeType: 'positive' as const,
			icon: DollarSignIcon
		},
		{
			title: '참여 직원',
			value: $employees.length,
			change: '+1',
			changeType: 'positive' as const,
			icon: UsersIcon
		},
		{
			title: '완료율',
			value: Math.round((dbProjects.filter((p: any) => p.status === 'completed').length / Math.max(dbProjects.length, 1)) * 100) + '%',
			change: '+3%',
			changeType: 'positive' as const,
			icon: TargetIcon
		}
	]);

	// 액션 버튼들 (비활성화)
	let actions: any[] = [];

	// 필터링된 프로젝트
	let filteredProjects = $derived(() => {
		return dbProjects.filter((project: any) => {
			const statusMatch = selectedStatus === 'all' || project.status === selectedStatus;
			const categoryMatch = selectedCategory === 'all' || project.category === selectedCategory;
			return statusMatch && categoryMatch;
		});
	});

	// 상태별 색상
	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			'planning': 'info',
			'active': 'success',
			'completed': 'primary',
			'cancelled': 'error',
			'on-hold': 'warning'
		};
		return colors[status] || 'secondary';
	}

	function getStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			'planning': '기획',
			'active': '진행중',
			'completed': '완료',
			'cancelled': '취소',
			'on-hold': '보류'
		};
		return labels[status] || status;
	}

	function getCategoryColor(category: string): string {
		const colors: Record<string, string> = {
			'basic-research': 'info',
			'applied-research': 'success',
			'development': 'primary',
			'pilot': 'warning'
		};
		return colors[category] || 'secondary';
	}

	function getCategoryLabel(category: string): string {
		const labels: Record<string, string> = {
			'basic-research': '기초연구',
			'applied-research': '응용연구',
			'development': '개발',
			'pilot': '파일럿'
		};
		return labels[category] || category;
	}

	function getPriorityColor(priority: string): string {
		const colors: Record<string, string> = {
			'high': 'error',
			'medium': 'warning',
			'low': 'success'
		};
		return colors[priority] || 'secondary';
	}

	function getPriorityLabel(priority: string): string {
		const labels: Record<string, string> = {
			'high': '높음',
			'medium': '보통',
			'low': '낮음'
		};
		return labels[priority] || priority;
	}

	function viewProject(project: any) {
		console.log('프로젝트 상세보기:', project);
	}

	function submitDocument(project: any) {
		console.log('문서 제출:', project);
	}

	// 데이터베이스에서 프로젝트 데이터 가져오기
	async function fetchProjects() {
		try {
			projectsLoading = true;
			projectsError = null;
			const response = await fetch('/api/database/projects');
			const result = await response.json();
			
			if (result.success) {
				dbProjects = result.data;
			} else {
				projectsError = '프로젝트 데이터를 가져오는데 실패했습니다.';
			}
		} catch (err) {
			projectsError = '프로젝트 데이터를 가져오는데 오류가 발생했습니다.';
			console.error('Error fetching projects:', err);
		} finally {
			projectsLoading = false;
		}
	}
	
	// 컴포넌트 마운트 시 데이터 로드
	onMount(() => {
		fetchProjects();
	});
	
	// 파일 업로드 처리
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			validateAndSetFile(file);
		}
	}

	// 드래그 앤 드롭 핸들러
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		
		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			const file = files[0];
			validateAndSetFile(file);
		}
	}

	// 파일 검증 및 설정
	function validateAndSetFile(file: File) {
		// 파일 크기 검증 (10MB 제한)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			uploadMessage = '파일 크기는 10MB를 초과할 수 없습니다.';
			uploadStatus = 'error';
			return;
		}

		// 파일 형식 검증
		const allowedTypes = [
			'text/csv',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		];
		const allowedExtensions = ['.csv', '.xlsx', '.xls'];
		
		const isValidType = allowedTypes.includes(file.type);
		const isValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
		
		if (!isValidType && !isValidExtension) {
			uploadMessage = 'CSV 또는 Excel 파일만 업로드 가능합니다.';
			uploadStatus = 'error';
			return;
		}

		uploadFile = file;
		uploadStatus = 'idle';
		uploadMessage = '';
	}

	// 엑셀 업로드 실행
	async function uploadExcel() {
		if (!uploadFile) return;

		uploadStatus = 'uploading';
		uploadProgress = 0;
		uploadMessage = '파일을 업로드하는 중...';

		try {
			const formData = new FormData();
			formData.append('file', uploadFile);

			// 업로드 진행률 시뮬레이션
			const progressInterval = setInterval(() => {
				uploadProgress += 10;
				if (uploadProgress >= 90) {
					clearInterval(progressInterval);
				}
			}, 200);

			const response = await fetch('/api/projects/upload', {
				method: 'POST',
				body: formData
			});

			clearInterval(progressInterval);
			uploadProgress = 100;

			if (response.ok) {
				const result = await response.json();
				uploadStatus = 'success';
				uploadMessage = `성공적으로 ${result.count}개의 프로젝트가 업로드되었습니다.`;
				
				// 프로젝트 목록 새로고침
				await fetchProjects();
				
				setTimeout(() => {
					showUploadModal = false;
					uploadStatus = 'idle';
					uploadFile = null;
					uploadProgress = 0;
					uploadMessage = '';
				}, 2000);
			} else {
				throw new Error('업로드 실패');
			}
		} catch (error) {
			uploadStatus = 'error';
			uploadMessage = '업로드 중 오류가 발생했습니다. 파일 형식을 확인해주세요.';
			console.error('Upload error:', error);
		}
	}

	// 업로드 모달 열기
	function openUploadModal() {
		showUploadModal = true;
		uploadStatus = 'idle';
		uploadFile = null;
		uploadProgress = 0;
		uploadMessage = '';
	}

	// 업로드 모달 닫기
	function closeUploadModal() {
		showUploadModal = false;
		uploadStatus = 'idle';
		uploadFile = null;
		uploadProgress = 0;
		uploadMessage = '';
	}

	// 프로젝트 템플릿 다운로드
	async function downloadProjectTemplate() {
		try {
			const response = await fetch('/api/templates/projects');
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'project_template.csv';
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				alert('템플릿 다운로드에 실패했습니다.');
			}
		} catch (error) {
			console.error('템플릿 다운로드 에러:', error);
			alert('템플릿 다운로드 중 오류가 발생했습니다.');
		}
	}

	onMount(() => {
		console.log('연구개발 관리 페이지 로드됨');
	});
</script>

<PageLayout
	title="연구개발 관리"
	subtitle="프로젝트, 인력, 예산, 문서 관리"
	{stats}
	{actions}
	searchPlaceholder="프로젝트명, 담당자, 부서로 검색..."
>
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
					<!-- 프로젝트 현황 -->
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="프로젝트 현황" />
						<ThemeSpacer size={4}>
							{#each dbProjects.slice(0, 5) as project}
								<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--color-surface-elevated);">
									<div class="flex items-center gap-3">
										<FlaskConicalIcon size={20} style="color: var(--color-primary);" />
										<div>
											<h4 class="font-medium" style="color: var(--color-text);">{project.title}</h4>
											<p class="text-sm" style="color: var(--color-text-secondary);">{project.manager}</p>
		</div>
									</div>
									<div class="flex items-center gap-2">
										<ThemeBadge variant={getStatusColor(project.status) as any}>
											{getStatusLabel(project.status)}
										</ThemeBadge>
										<span class="text-sm font-medium" style="color: var(--color-primary);">
											{formatCurrency(project.budget)}
										</span>
									</div>
								</div>
							{/each}
						</ThemeSpacer>
					</ThemeCard>

					<!-- 예산 사용률 -->
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="예산 사용률" />
						<ThemeSpacer size={4}>
							{#each dbProjects.slice(0, 5) as project}
								<div class="mb-4">
									<div class="flex items-center justify-between mb-2">
										<span class="text-sm font-medium" style="color: var(--color-text);">{project.name}</span>
										<span class="text-sm" style="color: var(--color-text-secondary);">
											{getProjectBudgetUtilization(project.id).toFixed(1)}%
										</span>
									</div>
									<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
										<div 
											class="h-2 rounded-full transition-all duration-300" 
											style="width: {Math.min(getProjectBudgetUtilization(project.id), 100)}%; background: {getProjectBudgetUtilization(project.id) > 90 ? 'var(--color-error)' : getProjectBudgetUtilization(project.id) > 70 ? 'var(--color-warning)' : 'var(--color-success)'};"
										></div>
									</div>
								</div>
									{/each}
						</ThemeSpacer>
					</ThemeCard>

					<!-- 최근 활동 -->
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="최근 활동" />
						<ThemeSpacer size={4}>
							<ThemeActivityItem
								icon={PlusIcon}
								title="새 프로젝트 추가됨"
								time="2시간 전"
							/>
							<ThemeActivityItem
								icon={FileTextIcon}
								title="문서 제출 완료"
								time="1일 전"
							/>
							<ThemeActivityItem
								icon={UsersIcon}
								title="인력 배정 완료"
								time="3일 전"
							/>
						</ThemeSpacer>
					</ThemeCard>
				</ThemeSpacer>
			{:else if tab.id === 'projects'}
				<!-- 프로젝트 탭 -->
				<ThemeSpacer size={6}>
					<!-- 필터 -->
					<ThemeCard class="p-4">
						<div class="flex items-center gap-4">
							<select 
								bind:value={selectedStatus}
								class="px-3 py-2 border rounded-md text-sm"
								style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
							>
								<option value="all">전체 상태</option>
								<option value="planning">기획</option>
								<option value="active">진행중</option>
								<option value="completed">완료</option>
								<option value="cancelled">취소</option>
								<option value="on-hold">보류</option>
							</select>
							<select 
								bind:value={selectedCategory}
								class="px-3 py-2 border rounded-md text-sm"
								style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
							>
								<option value="all">전체 카테고리</option>
								<option value="basic-research">기초연구</option>
								<option value="applied-research">응용연구</option>
								<option value="development">개발</option>
								<option value="pilot">파일럿</option>
							</select>
							<ThemeButton variant="primary" size="sm">
								<PlusIcon size={16} class="mr-2" />
								프로젝트 추가
							</ThemeButton>
							<button 
								type="button" 
								onclick={openUploadModal}
								class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
							>
								<FileSpreadsheetIcon size={16} />
								엑셀 업로드
							</button>
						</div>
					</ThemeCard>

					<!-- 프로젝트 목록 -->
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="프로젝트 목록" />
						<ThemeSpacer size={4}>
							{#each filteredProjects() as project}
								<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<FlaskConicalIcon size={20} style="color: var(--color-primary);" />
											<h4 class="font-medium" style="color: var(--color-text);">{project.title}</h4>
											<ThemeBadge variant={getStatusColor(project.status) as any}>
												{getStatusLabel(project.status)}
											</ThemeBadge>
								</div>
										<p class="text-sm mb-2" style="color: var(--color-text-secondary);">{project.description}</p>
										<div class="flex items-center gap-4 text-sm" style="color: var(--color-text-secondary);">
											<div class="flex items-center gap-1">
												<UserIcon size={16} />
												{project.sponsor}
								</div>
											<div class="flex items-center gap-1">
												<BuildingIcon size={16} />
												{project.sponsor_type}
								</div>
											<div class="flex items-center gap-1">
												<CalendarIcon size={16} />
												{formatDate(project.start_date)} ~ {formatDate(project.end_date)}
							</div>
						</div>
									</div>
									<div class="flex items-center gap-2">
										<div class="text-right mr-4">
											<p class="text-sm font-medium" style="color: var(--color-primary);">
												{formatCurrency(project.budget_total)}
											</p>
											<p class="text-xs" style="color: var(--color-text-secondary);">
												사용률: {getProjectBudgetUtilization(project.id).toFixed(1)}%
											</p>
								</div>
										<ThemeButton variant="ghost" size="sm" onclick={() => viewProject(project)}>
											<EyeIcon size={16} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm" onclick={() => submitDocument(project)}>
											<FileTextIcon size={16} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm">
											<EditIcon size={16} />
										</ThemeButton>
									</div>
								</div>
							{/each}
						</ThemeSpacer>
					</ThemeCard>
				</ThemeSpacer>
			{/if}
		{/snippet}
	</ThemeTabs>

	<!-- 엑셀 업로드 모달 -->
	<ThemeModal
		open={showUploadModal}
		onclose={closeUploadModal}
		size="md"
	>
		<div class="space-y-6">
			<h2 class="text-xl font-semibold mb-4" style="color: var(--color-text);">프로젝트 엑셀 업로드</h2>
			<!-- 파일 선택 -->
			<div>
				<label for="project-file-input" class="block text-sm font-medium mb-2" style="color: var(--color-text);">
					엑셀 파일 선택
				</label>
				
				<!-- 드래그 앤 드롭 영역 -->
				<div
					class="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
					class:drag-over={isDragOver}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
					onclick={() => document.getElementById('project-file-input')?.click()}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('project-file-input')?.click(); } }}
					role="button"
					tabindex="0"
					aria-label="파일 업로드 영역 - 클릭하거나 파일을 드래그하여 업로드하세요"
					style="border-color: var(--color-border); background: var(--color-surface);"
				>
					{#if uploadFile}
						<div class="flex items-center justify-center space-x-2">
							<FileSpreadsheetIcon size={24} style="color: var(--color-primary);" />
							<span style="color: var(--color-text);">{uploadFile.name}</span>
						</div>
					{:else}
						<div class="space-y-2">
							<FileSpreadsheetIcon size={48} class="mx-auto" style="color: var(--color-text-secondary);" />
							<p style="color: var(--color-text);">파일을 여기에 드래그하거나 클릭하여 선택하세요</p>
							<p class="text-sm" style="color: var(--color-text-secondary);">CSV, XLSX, XLS 파일 지원</p>
						</div>
					{/if}
				</div>
				
				<!-- 숨겨진 파일 입력 -->
				<input
					id="project-file-input"
					type="file"
					accept=".xlsx,.xls,.csv"
					onchange={handleFileSelect}
					class="hidden"
				/>
			</div>
								
			<!-- 선택된 파일 정보 -->
			{#if uploadFile}
				<div class="p-3 rounded-lg" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border);">
					<div class="flex items-center gap-2">
						<FileSpreadsheetIcon size={16} style="color: var(--color-primary);" />
						<span class="text-sm font-medium" style="color: var(--color-text);">{uploadFile.name}</span>
						<span class="text-xs" style="color: var(--color-text-secondary);">
							({(uploadFile.size / 1024).toFixed(1)} KB)
						</span>
	</div>
			</div>
		{/if}

			<!-- 업로드 진행률 -->
			{#if uploadStatus === 'uploading'}
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span style="color: var(--color-text-secondary);">업로드 진행률</span>
						<span style="color: var(--color-text);">{uploadProgress}%</span>
								</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div 
							class="h-2 rounded-full transition-all duration-300" 
							style="width: {uploadProgress}%; background: var(--color-primary);"
						></div>
				</div>
			</div>
		{/if}

			<!-- 상태 메시지 -->
			{#if uploadMessage}
				<div class="flex items-center gap-2 p-3 rounded-lg" style="background: {uploadStatus === 'success' ? 'var(--color-success-light)' : uploadStatus === 'error' ? 'var(--color-error-light)' : 'var(--color-info-light)'}; border: 1px solid {uploadStatus === 'success' ? 'var(--color-success)' : uploadStatus === 'error' ? 'var(--color-error)' : 'var(--color-info)'};">
					{#if uploadStatus === 'success'}
						<CheckCircleIcon size={16} style="color: var(--color-success);" />
					{:else if uploadStatus === 'error'}
						<AlertCircleIcon size={16} style="color: var(--color-error);" />
					{/if}
					<span class="text-sm" style="color: {uploadStatus === 'success' ? 'var(--color-success)' : uploadStatus === 'error' ? 'var(--color-error)' : 'var(--color-info)'};">
						{uploadMessage}
					</span>
			</div>
		{/if}

			<!-- 엑셀 템플릿 다운로드 -->
			<div class="p-4 rounded-lg" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border);">
				<h4 class="text-sm font-medium mb-2" style="color: var(--color-text);">엑셀 템플릿</h4>
				<p class="text-xs mb-3" style="color: var(--color-text-secondary);">
					프로젝트 데이터를 업로드하기 전에 템플릿을 다운로드하여 올바른 형식으로 데이터를 입력하세요.
				</p>
				<ThemeButton variant="ghost" size="sm" onclick={downloadProjectTemplate}>
					<DownloadIcon size={16} class="mr-2" />
					템플릿 다운로드
				</ThemeButton>
			</div>
	</div>

		<!-- 모달 액션 버튼 -->
		<div class="flex justify-end gap-2 pt-4 border-t" style="border-color: var(--color-border);">
			<ThemeButton variant="ghost" onclick={closeUploadModal}>
				취소
			</ThemeButton>
			<ThemeButton 
				variant="primary" 
				onclick={uploadExcel}
				disabled={!uploadFile || uploadStatus === 'uploading'}
			>
				{uploadStatus === 'uploading' ? '업로드 중...' : '업로드'}
			</ThemeButton>
		</div>
	</ThemeModal>
</PageLayout>

<style>
	.drag-over {
		border-color: var(--color-primary) !important;
		background: var(--color-primary-light) !important;
	}
</style>