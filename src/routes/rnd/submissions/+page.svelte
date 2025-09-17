<script lang="ts">
	import { onMount } from 'svelte';
	import { projects, employees } from '$lib/stores/rd';
	import { submissionBundles, documents, expenseItems } from '$lib/stores/rnd/mock-data';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import type { Project, Person, SubmissionBundle, Document } from '$lib/stores/rnd/types';

	// Extended SubmissionBundle interface for this page
	interface ExtendedSubmissionBundle extends SubmissionBundle {
		documentCount?: number;
		totalSize?: string;
		validationResults?: {
			valid: boolean;
			errors: string[];
			warnings: string[];
			completeness: number;
		};
	}

	// Mock submission bundles data
	let localSubmissionBundles = $state<ExtendedSubmissionBundle[]>([
		{
			id: 'bundle-1',
			projectId: 'project-1',
			period: '2024-Q1',
			fileUrl: '/bundles/project-1-2024-Q1.zip',
			manifestXml: '<?xml version="1.0" encoding="UTF-8"?><manifest>...</manifest>',
			checksum: 'sha256:abc123def456...',
			createdBy: 'person-2',
			createdAt: '2024-04-01T10:00:00Z',
			status: 'uploaded',
			documentCount: 45,
			totalSize: '125.6 MB',
			validationResults: {
				valid: true,
				errors: [],
				warnings: ['일부 문서의 해상도가 낮습니다'],
				completeness: 98
			}
		},
		{
			id: 'bundle-2',
			projectId: 'project-2',
			period: '2024-Q1',
			fileUrl: '/bundles/project-2-2024-Q1.zip',
			manifestXml: '<?xml version="1.0" encoding="UTF-8"?><manifest>...</manifest>',
			checksum: 'sha256:def456ghi789...',
			createdBy: 'person-2',
			createdAt: '2024-04-02T14:30:00Z',
			status: 'ready',
			documentCount: 32,
			totalSize: '89.2 MB',
			validationResults: {
				valid: false,
				errors: ['필수 문서 누락: 연구노트 3주차', '서명 누락: 지출 승인서 2건'],
				warnings: ['일부 영수증 해상도 부족'],
				completeness: 85
			}
		},
		{
			id: 'bundle-3',
			projectId: 'project-1',
			period: '2024-Q2',
			fileUrl: '/bundles/project-1-2024-Q2.zip',
			manifestXml: '<?xml version="1.0" encoding="UTF-8"?><manifest>...</manifest>',
			checksum: 'sha256:ghi789jkl012...',
			createdBy: 'person-2',
			createdAt: '2024-07-01T09:15:00Z',
			status: 'generating',
			documentCount: 0,
			totalSize: '0 MB',
			validationResults: {
				valid: false,
				errors: [],
				warnings: [],
				completeness: 0
			}
		}
	]);

	let selectedBundle = $state<ExtendedSubmissionBundle | null>(null);
	let showDetailModal = $state(false);
	let showCreateModal = $state(false);
	let showValidationModal = $state(false);
	let searchTerm = $state('');
	let selectedProject = $state<string>('all');
	let selectedPeriod = $state<string>('all');
	let selectedStatus = $state<string>('all');

	// Form data for creating new bundle
	let formData = $state({
		projectId: '',
		period: '',
		includeDocuments: true,
		includeExpenses: true,
		includeReports: true,
		includeResearchNotes: true,
		compressionLevel: 'medium' as 'low' | 'medium' | 'high',
		generateManifest: true
	});

	// Get filtered bundles
	let filteredBundles = $derived(() => {
		let filtered = $submissionBundles;
		
		if (searchTerm) {
			filtered = filtered.filter((bundle: any) => 
				bundle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
				bundle.period.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}
		
		if (selectedProject !== 'all') {
			filtered = filtered.filter((bundle: any) => bundle.projectId === selectedProject);
		}
		
		if (selectedPeriod !== 'all') {
			filtered = filtered.filter((bundle: any) => bundle.period === selectedPeriod);
		}
		
		if (selectedStatus !== 'all') {
			filtered = filtered.filter((bundle: any) => bundle.status === selectedStatus);
		}
		
		return filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	});

	// Get unique periods for filter
	let availablePeriods = $derived(() => {
		const periods = [...new Set($submissionBundles.map((b: any) => b.period))];
		return periods.sort().reverse();
	});

	// Get person name by ID
	function getPersonName(personId: string): string {
		const person = $employees.find((p: any) => p.id === personId);
		return person ? person.name : 'Unknown';
	}

	// Get project name by ID
	function getProjectName(projectId: string): string {
		const project = $projects.find((p: any) => p.id === projectId);
		return project ? project.name : 'Unknown Project';
	}

	// Show bundle detail
	function showBundleDetail(bundle: ExtendedSubmissionBundle) {
		selectedBundle = bundle;
		showDetailModal = true;
	}

	// Create new bundle
	function createBundle() {
		if (!formData.projectId || !formData.period) {
			alert('모든 필수 필드를 입력해주세요.');
			return;
		}

		// Check if bundle already exists
		const existingBundle = $submissionBundles.find((b: any) => 
			b.projectId === formData.projectId && b.period === formData.period
		);

		if (existingBundle) {
			alert('해당 기간의 번들이 이미 존재합니다.');
			return;
		}

		const newBundle: ExtendedSubmissionBundle = {
			id: `bundle-${Date.now()}`,
			projectId: formData.projectId,
			period: formData.period,
			fileUrl: `/bundles/${formData.projectId}-${formData.period}.zip`,
			manifestXml: '<?xml version="1.0" encoding="UTF-8"?><manifest>...</manifest>',
			checksum: 'sha256:generating...',
			createdBy: 'emp-001', // Current user
			createdAt: new Date().toISOString(),
			status: 'generating',
			documentCount: 0,
			totalSize: '0 MB',
			validationResults: {
				valid: false,
				errors: [],
				warnings: [],
				completeness: 0
			}
		};

		$submissionBundles.push(newBundle);
		
		// Simulate bundle generation
		setTimeout(() => {
			generateBundleContent(newBundle.id);
		}, 2000);
		
		// Reset form
		formData = {
			projectId: '',
			period: '',
			includeDocuments: true,
			includeExpenses: true,
			includeReports: true,
			includeResearchNotes: true,
			compressionLevel: 'medium',
			generateManifest: true
		};
		
		showCreateModal = false;
	}

	// Generate bundle content (simulation)
	function generateBundleContent(bundleId: string) {
		const bundle = $submissionBundles.find((b: any) => b.id === bundleId);
		if (bundle) {
		// Simulate document collection and validation
		const projectExpenses = $expenseItems.filter((e: any) => e.projectId === bundle.projectId);
		const projectDocuments = $documents.filter((d: any) => d.expenseId && 
			projectExpenses.some((e: any) => e.id === d.expenseId));
			
			(bundle as any).documentCount = projectDocuments.length;
			(bundle as any).totalSize = `${(Math.random() * 100 + 50).toFixed(1)} MB`;
			bundle.checksum = `sha256:${Math.random().toString(36).substring(2, 15)}...`;
			bundle.status = 'ready';
			
			// Simulate validation
			setTimeout(() => {
				validateBundle(bundleId);
			}, 3000);
		}
	}

	// Validate bundle
	function validateBundle(bundleId: string) {
		const bundle = $submissionBundles.find((b: any) => b.id === bundleId);
		if (bundle) {
			// Mock validation results
			const hasErrors = Math.random() > 0.7;
			const completeness = Math.floor(Math.random() * 20) + 80;
			
			(bundle as any).validationResults = {
				valid: !hasErrors,
				errors: hasErrors ? ['일부 필수 문서 누락', '서명 누락 문서 2건'] : [],
				warnings: ['일부 영수증 해상도 부족', '연구노트 서명 누락 1건'],
				completeness
			};
			
			bundle.status = hasErrors ? 'failed' : 'uploaded';
		}
	}

	// Download bundle
	function downloadBundle(bundle: ExtendedSubmissionBundle) {
		if (bundle.status !== 'uploaded') {
			alert('번들이 아직 준비되지 않았습니다.');
			return;
		}
		
		// In real implementation, this would download the actual file
		console.log('Downloading bundle:', bundle.fileUrl);
		alert(`번들 다운로드: ${bundle.fileUrl}`);
	}

	// Re-validate bundle
	function revalidateBundle(bundleId: string) {
		const bundle = $submissionBundles.find((b: any) => b.id === bundleId);
		if (bundle) {
			bundle.status = 'generating';
			
			setTimeout(() => {
				validateBundle(bundleId);
			}, 2000);
		}
	}

	// Show validation details
	function showValidationDetails(bundle: SubmissionBundle) {
		selectedBundle = bundle;
		showValidationModal = true;
	}

	// Format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('ko-KR');
	}

	// Get status badge variant
	function getStatusVariant(status: string): 'success' | 'warning' | 'danger' {
		switch (status) {
			case 'completed': return 'success';
			case 'generating': return 'warning';
			case 'validating': return 'warning';
			case 'pending_validation': return 'warning';
			case 'validation_failed': return 'danger';
			default: return 'danger';
		}
	}

	// Get status text
	function getStatusText(status: string): string {
		switch (status) {
			case 'completed': return '완료';
			case 'generating': return '생성중';
			case 'validating': return '검증중';
			case 'pending_validation': return '검증대기';
			case 'validation_failed': return '검증실패';
			default: return '알 수 없음';
		}
	}

	// Get completeness color
	function getCompletenessColor(completeness: number): string {
		if (completeness >= 95) return 'text-green-600';
		if (completeness >= 85) return 'text-yellow-600';
		return 'text-red-600';
	}

	// Get validation status color
	function getValidationColor(valid: boolean): string {
		return valid ? 'text-green-600' : 'text-red-600';
	}

	onMount(() => {
		// Initialize dummy data if needed
	});
</script>

<div class="container mx-auto p-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">국가R&D 업로드 번들</h1>
		<p class="text-gray-600">프로젝트별 문서를 국가R&D 시스템 업로드용 번들로 생성하고 검증합니다.</p>
	</div>

	<!-- Action Buttons -->
	<div class="flex gap-4 mb-6">
		<button
			onclick={() => showCreateModal = true}
			class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			번들 생성
		</button>
		<button
			onclick={() => alert('모든 프로젝트의 분기별 번들을 자동 생성합니다.')}
			class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
		>
			자동 생성
		</button>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
		<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
			<div>
				<label for="search" class="block text-sm font-medium text-gray-700 mb-1">검색</label>
				<input
					id="search"
					type="text"
					bind:value={searchTerm}
					placeholder="번들 ID 또는 기간 검색..."
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="project-filter" class="block text-sm font-medium text-gray-700 mb-1">프로젝트</label>
				<select
					id="project-filter"
					bind:value={selectedProject}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">전체</option>
					{#each $projects as project}
						<option value={project.id}>{project.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="period-filter" class="block text-sm font-medium text-gray-700 mb-1">기간</label>
				<select
					id="period-filter"
					bind:value={selectedPeriod}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">전체</option>
					{#each availablePeriods() as period}
						<option value={period}>{period}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="rnd-sub-status-filter" class="block text-sm font-medium text-gray-700 mb-1">상태</label>
				<select
					id="rnd-sub-status-filter"
					bind:value={selectedStatus}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">전체</option>
					<option value="generating">생성중</option>
					<option value="validating">검증중</option>
					<option value="pending_validation">검증대기</option>
					<option value="completed">완료</option>
					<option value="validation_failed">검증실패</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Bundles List -->
	<div class="grid gap-6">
		{#each filteredBundles() as bundle}
			<Card class="p-6 hover:shadow-md transition-shadow">
				<div class="flex justify-between items-start mb-4">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h3 class="text-xl font-semibold text-gray-900">
								{getProjectName(bundle.projectId)} - {bundle.period}
							</h3>
							<Badge variant={getStatusVariant(bundle.status)}>
								{getStatusText(bundle.status)}
							</Badge>
						</div>
						<div class="text-sm text-gray-600 mb-3">
							<span class="font-medium">생성자:</span> {getPersonName(bundle.createdBy)} | 
							<span class="font-medium">생성일:</span> {formatDate(bundle.createdAt)} | 
							<span class="font-medium">문서수:</span> {(bundle as any).documentCount}개 | 
							<span class="font-medium">크기:</span> {(bundle as any).totalSize}
						</div>
					</div>
					<div class="flex gap-2 ml-4">
						<button
							onclick={() => showBundleDetail(bundle)}
							class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
							aria-label="상세보기"
						>
							상세보기
						</button>
						{#if bundle.status === 'uploaded'}
							<button
								onclick={() => downloadBundle(bundle)}
								class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								다운로드
							</button>
						{/if}
						{#if bundle.status === 'failed' || bundle.status === 'ready'}
							<button
								onclick={() => revalidateBundle(bundle.id)}
								class="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
							>
								재검증
							</button>
						{/if}
						<button
							onclick={() => showValidationDetails(bundle)}
							class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
						>
							검증상세
						</button>
					</div>
				</div>

				<!-- Bundle Info -->
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
					<div class="bg-gray-50 p-4 rounded-md">
						<div class="text-sm text-gray-600 mb-1">문서 수</div>
						<div class="text-2xl font-bold text-gray-900">{(bundle as any).documentCount}</div>
					</div>
					<div class="bg-gray-50 p-4 rounded-md">
						<div class="text-sm text-gray-600 mb-1">총 크기</div>
						<div class="text-2xl font-bold text-gray-900">{(bundle as any).totalSize}</div>
					</div>
					<div class="bg-gray-50 p-4 rounded-md">
						<div class="text-sm text-gray-600 mb-1">완성도</div>
						<div class="text-2xl font-bold {getCompletenessColor((bundle as any).validationResults.completeness)}">
							{(bundle as any).validationResults.completeness}%
						</div>
					</div>
					<div class="bg-gray-50 p-4 rounded-md">
						<div class="text-sm text-gray-600 mb-1">검증 상태</div>
						<div class="text-2xl font-bold {getValidationColor((bundle as any).validationResults.valid)}">
							{(bundle as any).validationResults.valid ? '✓' : '✗'}
						</div>
					</div>
				</div>

				<!-- Validation Summary -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<h4 class="font-medium text-gray-900 mb-2">에러</h4>
						<div class="text-sm text-red-600">
							{(bundle as any).validationResults.errors.length}개
						</div>
					</div>
					<div>
						<h4 class="font-medium text-gray-900 mb-2">경고</h4>
						<div class="text-sm text-yellow-600">
							{(bundle as any).validationResults.warnings.length}개
						</div>
					</div>
					<div>
						<h4 class="font-medium text-gray-900 mb-2">체크섬</h4>
						<div class="text-xs text-gray-500 font-mono">
							{bundle.checksum}
						</div>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	{#if filteredBundles().length === 0}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">📦</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">번들이 없습니다</h3>
			<p class="text-gray-500">새로운 업로드 번들을 생성해보세요.</p>
		</div>
	{/if}
</div>

<!-- Detail Modal -->
<Modal bind:open={showDetailModal} title="번들 상세">
	{#if selectedBundle}
		<div class="space-y-6">
			<div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">
					{getProjectName(selectedBundle.projectId)} - {selectedBundle.period}
				</h3>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="font-medium text-gray-700">생성자:</span>
						<span class="ml-2">{getPersonName(selectedBundle.createdBy)}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">생성일:</span>
						<span class="ml-2">{formatDate(selectedBundle.createdAt)}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">문서 수:</span>
						<span class="ml-2">{selectedBundle.documentCount}개</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">총 크기:</span>
						<span class="ml-2">{selectedBundle.totalSize}</span>
					</div>
				</div>
			</div>

			<!-- Bundle Status -->
			<div>
				<h4 class="font-medium text-gray-900 mb-3">번들 상태</h4>
				<div class="bg-gray-50 p-4 rounded-md">
					<div class="flex items-center gap-3 mb-2">
						<Badge variant={getStatusVariant(selectedBundle.status)}>
							{getStatusText(selectedBundle.status)}
						</Badge>
						<span class="text-sm text-gray-600">
							완성도: {(selectedBundle as any).validationResults.completeness}%
						</span>
					</div>
					<div class="text-xs text-gray-500 font-mono">
						체크섬: {selectedBundle.checksum}
					</div>
				</div>
			</div>

			<!-- File Info -->
			<div>
				<h4 class="font-medium text-gray-900 mb-3">파일 정보</h4>
				<div class="bg-gray-50 p-4 rounded-md">
					<div class="text-sm text-gray-600">
						<div class="mb-1"><span class="font-medium">파일 경로:</span> {selectedBundle.fileUrl}</div>
						<div class="mb-1"><span class="font-medium">문서 수:</span> {selectedBundle.documentCount}개</div>
						<div><span class="font-medium">총 크기:</span> {selectedBundle.totalSize}</div>
					</div>
				</div>
			</div>

			<div class="flex justify-end">
						{#if selectedBundle.status === 'uploaded'}
					<button
						onclick={() => selectedBundle && downloadBundle(selectedBundle)}
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						번들 다운로드
					</button>
				{/if}
			</div>
		</div>
	{/if}
</Modal>

<!-- Validation Modal -->
<Modal bind:open={showValidationModal} title="검증 상세">
	{#if selectedBundle}
		<div class="space-y-6">
			<div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">
					{getProjectName(selectedBundle.projectId)} - {selectedBundle.period}
				</h3>
				<div class="flex items-center gap-3 mb-4">
					<Badge variant={getStatusVariant(selectedBundle.status)}>
						{getStatusText(selectedBundle.status)}
					</Badge>
					<span class="text-sm text-gray-600">
						완성도: {(selectedBundle as any).validationResults.completeness}%
					</span>
				</div>
			</div>

			<!-- Errors -->
			{#if (selectedBundle as any).validationResults.errors.length > 0}
				<div>
					<h4 class="font-medium text-red-700 mb-3">에러 ({(selectedBundle as any).validationResults.errors.length}개)</h4>
					<div class="space-y-2">
						{#each (selectedBundle as any).validationResults.errors as error}
							<div class="flex items-center gap-2 p-3 bg-red-50 rounded-md">
								<span class="text-red-500">✗</span>
								<span class="text-red-700">{error}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Warnings -->
			{#if (selectedBundle as any).validationResults.warnings.length > 0}
				<div>
					<h4 class="font-medium text-yellow-700 mb-3">경고 ({(selectedBundle as any).validationResults.warnings.length}개)</h4>
					<div class="space-y-2">
						{#each (selectedBundle as any).validationResults.warnings as warning}
							<div class="flex items-center gap-2 p-3 bg-yellow-50 rounded-md">
								<span class="text-yellow-500">⚠</span>
								<span class="text-yellow-700">{warning}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Validation Summary -->
			<div class="bg-gray-50 p-4 rounded-md">
				<h4 class="font-medium text-gray-900 mb-3">검증 요약</h4>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="font-medium text-gray-700">검증 상태:</span>
						<span class="ml-2 {getValidationColor((selectedBundle as any).validationResults.valid)}">
							{(selectedBundle as any).validationResults.valid ? '통과' : '실패'}
						</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">완성도:</span>
						<span class="ml-2 {getCompletenessColor((selectedBundle as any).validationResults.completeness)}">
							{(selectedBundle as any).validationResults.completeness}%
						</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">에러 수:</span>
						<span class="ml-2 text-red-600">{(selectedBundle as any).validationResults.errors.length}개</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">경고 수:</span>
						<span class="ml-2 text-yellow-600">{(selectedBundle as any).validationResults.warnings.length}개</span>
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2">
						{#if selectedBundle.status === 'failed' || selectedBundle.status === 'ready'}
					<button
						onclick={() => selectedBundle && revalidateBundle(selectedBundle.id)}
						class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
					>
						재검증
					</button>
				{/if}
						{#if selectedBundle.status === 'uploaded'}
					<button
						onclick={() => selectedBundle && downloadBundle(selectedBundle)}
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						다운로드
					</button>
				{/if}
			</div>
		</div>
	{/if}
</Modal>

<!-- Create Modal -->
<Modal bind:open={showCreateModal} title="번들 생성">
	<div class="space-y-4">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="create-project" class="block text-sm font-medium text-gray-700 mb-1">프로젝트 *</label>
				<select
					id="create-project"
					bind:value={formData.projectId}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">프로젝트 선택</option>
					{#each $projects as project}
						<option value={project.id}>{project.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="create-period" class="block text-sm font-medium text-gray-700 mb-1">기간 *</label>
				<input
					id="create-period"
					type="text"
					bind:value={formData.period}
					placeholder="예: 2024-Q1"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>
		<div>
			<div class="block text-sm font-medium text-gray-700 mb-2">포함할 내용</div>
			<div class="space-y-2">
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={formData.includeDocuments}
						class="mr-2"
					/>
					<span class="text-sm text-gray-700">문서 (계약서, 견적서 등)</span>
				</label>
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={formData.includeExpenses}
						class="mr-2"
					/>
					<span class="text-sm text-gray-700">지출 내역</span>
				</label>
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={formData.includeReports}
						class="mr-2"
					/>
					<span class="text-sm text-gray-700">진도보고서</span>
				</label>
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={formData.includeResearchNotes}
						class="mr-2"
					/>
					<span class="text-sm text-gray-700">연구노트</span>
				</label>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="create-compression" class="block text-sm font-medium text-gray-700 mb-1">압축 수준</label>
				<select
					id="create-compression"
					bind:value={formData.compressionLevel}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="low">낮음 (빠른 생성)</option>
					<option value="medium">보통 (균형)</option>
					<option value="high">높음 (작은 크기)</option>
				</select>
			</div>
			<div class="flex items-end">
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={formData.generateManifest}
						class="mr-2"
					/>
					<span class="text-sm text-gray-700">매니페스트 생성</span>
				</label>
			</div>
		</div>
		<div class="flex justify-end gap-2 pt-4">
			<button
				onclick={() => showCreateModal = false}
				class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
			>
				취소
			</button>
			<button
				onclick={createBundle}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				생성
			</button>
		</div>
	</div>
</Modal>
