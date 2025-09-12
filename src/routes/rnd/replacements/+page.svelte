<script lang="ts">
	import { onMount } from 'svelte';
	import { persons, projects } from '$lib/stores/rnd/init-dummy-data';
	import { Badge } from '$lib/components/ui/Badge.svelte';
	import { Card } from '$lib/components/ui/Card.svelte';
	import { Modal } from '$lib/components/ui/Modal.svelte';
	import type { Person, Project, ReplacementCandidate } from '$lib/stores/rnd/types';

	// Mock replacement candidates data
	let replacementCandidates = $state<ReplacementCandidate[]>([
		{
			id: 'replacement-1',
			originalPersonId: 'person-1',
			projectId: 'project-1',
			reason: '퇴사',
			effectiveDate: '2024-02-01',
			status: 'pending',
			candidates: [
				{
					personId: 'person-4',
					score: 95,
					reasons: ['동일 기술 스택', '유사 프로젝트 경험', '높은 성과 이력'],
					availability: 80,
					salaryMatch: true,
					skillsMatch: ['AI/ML', 'Python', 'TensorFlow'],
					experience: '5년',
					recommended: true
				},
				{
					personId: 'person-5',
					score: 87,
					reasons: ['강한 학습 능력', '팀워크 우수', '프로젝트 관리 경험'],
					availability: 60,
					salaryMatch: true,
					skillsMatch: ['Python', 'Data Science', 'Machine Learning'],
					experience: '3년',
					recommended: false
				},
				{
					personId: 'person-6',
					score: 82,
					reasons: ['도메인 전문성', '문제 해결 능력', '커뮤니케이션 스킬'],
					availability: 70,
					salaryMatch: false,
					skillsMatch: ['AI/ML', 'Python', 'Research'],
					experience: '4년',
					recommended: false
				}
			],
			createdAt: '2024-01-15T10:00:00Z',
			updatedAt: '2024-01-15T10:00:00Z'
		},
		{
			id: 'replacement-2',
			originalPersonId: 'person-2',
			projectId: 'project-2',
			reason: '프로젝트 변경',
			effectiveDate: '2024-03-01',
			status: 'approved',
			candidates: [
				{
					personId: 'person-7',
					score: 92,
					reasons: ['UI/UX 전문성', 'React 경험', '사용자 중심 설계'],
					availability: 90,
					salaryMatch: true,
					skillsMatch: ['React', 'UI/UX', 'Frontend'],
					experience: '4년',
					recommended: true
				},
				{
					personId: 'person-8',
					score: 85,
					reasons: ['풀스택 개발', '빠른 적응력', '코드 품질'],
					availability: 75,
					salaryMatch: true,
					skillsMatch: ['React', 'Node.js', 'Full Stack'],
					experience: '3년',
					recommended: false
				}
			],
			createdAt: '2024-01-20T14:30:00Z',
			updatedAt: '2024-01-25T09:15:00Z'
		},
		{
			id: 'replacement-3',
			originalPersonId: 'person-3',
			projectId: 'project-1',
			reason: '휴직',
			effectiveDate: '2024-02-15',
			status: 'in_progress',
			candidates: [
				{
					personId: 'person-9',
					score: 88,
					reasons: ['백엔드 전문성', 'API 설계', '데이터베이스 최적화'],
					availability: 85,
					salaryMatch: true,
					skillsMatch: ['Backend', 'API', 'Database'],
					experience: '6년',
					recommended: true
				},
				{
					personId: 'person-10',
					score: 79,
					reasons: ['시스템 아키텍처', '클라우드 경험', 'DevOps'],
					availability: 65,
					salaryMatch: false,
					skillsMatch: ['Backend', 'Cloud', 'DevOps'],
					experience: '5년',
					recommended: false
				}
			],
			createdAt: '2024-01-25T16:45:00Z',
			updatedAt: '2024-01-30T11:20:00Z'
		}
	]);

	let selectedReplacement: ReplacementCandidate | null = null;
	let showDetailModal = $state(false);
	let showCreateModal = $state(false);
	let searchTerm = $state('');
	let selectedProject = $state<string>('all');
	let selectedStatus = $state<string>('all');
	let selectedReason = $state<string>('all');

	// Form data for creating new replacement request
	let formData = $state({
		originalPersonId: '',
		projectId: '',
		reason: '',
		effectiveDate: '',
		priority: 'medium' as 'low' | 'medium' | 'high',
		requiredSkills: [] as string[],
		experienceLevel: '',
		salaryRange: '',
		availability: 100
	});

	// Get filtered replacements
	let filteredReplacements = $derived(() => {
		let filtered = replacementCandidates;
		
		if (searchTerm) {
			filtered = filtered.filter(replacement => {
				const originalPerson = persons.find(p => p.id === replacement.originalPersonId);
				return originalPerson?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					   replacement.reason.toLowerCase().includes(searchTerm.toLowerCase());
			});
		}
		
		if (selectedProject !== 'all') {
			filtered = filtered.filter(replacement => replacement.projectId === selectedProject);
		}
		
		if (selectedStatus !== 'all') {
			filtered = filtered.filter(replacement => replacement.status === selectedStatus);
		}
		
		if (selectedReason !== 'all') {
			filtered = filtered.filter(replacement => replacement.reason === selectedReason);
		}
		
		return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	});

	// Get unique reasons for filter
	let availableReasons = $derived(() => {
		const reasons = [...new Set(replacementCandidates.map(r => r.reason))];
		return reasons;
	});

	// Get person name by ID
	function getPersonName(personId: string): string {
		const person = persons.find(p => p.id === personId);
		return person ? person.name : 'Unknown';
	}

	// Get project name by ID
	function getProjectName(projectId: string): string {
		const project = projects.find(p => p.id === projectId);
		return project ? project.title : 'Unknown Project';
	}

	// Show replacement detail
	function showReplacementDetail(replacement: ReplacementCandidate) {
		selectedReplacement = replacement;
		showDetailModal = true;
	}

	// Create new replacement request
	function createReplacementRequest() {
		if (!formData.originalPersonId || !formData.projectId || !formData.reason || !formData.effectiveDate) {
			alert('모든 필수 필드를 입력해주세요.');
			return;
		}

		// Find matching candidates based on criteria
		const matchingCandidates = findMatchingCandidates(formData);

		const newReplacement: ReplacementCandidate = {
			id: `replacement-${Date.now()}`,
			originalPersonId: formData.originalPersonId,
			projectId: formData.projectId,
			reason: formData.reason,
			effectiveDate: formData.effectiveDate,
			status: 'pending',
			candidates: matchingCandidates,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		replacementCandidates.push(newReplacement);
		
		// Reset form
		formData = {
			originalPersonId: '',
			projectId: '',
			reason: '',
			effectiveDate: '',
			priority: 'medium',
			requiredSkills: [],
			experienceLevel: '',
			salaryRange: '',
			availability: 100
		};
		
		showCreateModal = false;
	}

	// Find matching candidates based on criteria
	function findMatchingCandidates(criteria: any) {
		// Mock algorithm - in real implementation, this would use ML/AI
		const availablePersons = persons.filter(p => p.id !== criteria.originalPersonId);
		
		return availablePersons.slice(0, 3).map((person, index) => ({
			personId: person.id,
			score: 95 - (index * 10),
			reasons: [
				'기술 스택 일치',
				'프로젝트 경험',
				'팀워크 우수'
			],
			availability: Math.floor(Math.random() * 40) + 60,
			salaryMatch: Math.random() > 0.3,
			skillsMatch: ['Python', 'React', 'Database'],
			experience: `${Math.floor(Math.random() * 5) + 2}년`,
			recommended: index === 0
		}));
	}

	// Approve replacement
	function approveReplacement(replacementId: string, candidatePersonId: string) {
		const replacement = replacementCandidates.find(r => r.id === replacementId);
		if (replacement) {
			replacement.status = 'approved';
			replacement.updatedAt = new Date().toISOString();
			
			// In real implementation, this would update project assignments
			console.log(`Approved replacement: ${candidatePersonId} for ${replacement.originalPersonId}`);
		}
	}

	// Reject replacement
	function rejectReplacement(replacementId: string) {
		const replacement = replacementCandidates.find(r => r.id === replacementId);
		if (replacement) {
			replacement.status = 'rejected';
			replacement.updatedAt = new Date().toISOString();
		}
	}

	// Add required skill
	function addRequiredSkill() {
		formData.requiredSkills.push('');
	}

	// Remove required skill
	function removeRequiredSkill(index: number) {
		formData.requiredSkills.splice(index, 1);
	}

	// Format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('ko-KR');
	}

	// Get status badge variant
	function getStatusVariant(status: string): 'success' | 'warning' | 'danger' {
		switch (status) {
			case 'approved': return 'success';
			case 'in_progress': return 'warning';
			case 'rejected': return 'danger';
			default: return 'danger';
		}
	}

	// Get status text
	function getStatusText(status: string): string {
		switch (status) {
			case 'approved': return '승인됨';
			case 'in_progress': return '진행중';
			case 'rejected': return '거부됨';
			default: return '대기';
		}
	}

	// Get priority badge variant
	function getPriorityVariant(priority: string): 'success' | 'warning' | 'danger' {
		switch (priority) {
			case 'low': return 'success';
			case 'medium': return 'warning';
			case 'high': return 'danger';
			default: return 'warning';
		}
	}

	// Get priority text
	function getPriorityText(priority: string): string {
		switch (priority) {
			case 'low': return '낮음';
			case 'medium': return '보통';
			case 'high': return '높음';
			default: return '보통';
		}
	}

	// Calculate match score color
	function getScoreColor(score: number): string {
		if (score >= 90) return 'text-green-600';
		if (score >= 80) return 'text-yellow-600';
		return 'text-red-600';
	}

	onMount(() => {
		// Initialize dummy data if needed
	});
</script>

<div class="container mx-auto p-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">인력 대체 추천</h1>
		<p class="text-gray-600">인력 이탈 시 AI 기반 대체 인력 추천 및 승인 프로세스를 관리합니다.</p>
	</div>

	<!-- Action Buttons -->
	<div class="flex gap-4 mb-6">
		<button
			onclick={() => showCreateModal = true}
			class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			대체 요청 생성
		</button>
		<button
			onclick={() => alert('AI 추천 알고리즘을 실행합니다.')}
			class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
		>
			AI 추천 실행
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
					placeholder="인력명 또는 사유 검색..."
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
					{#each projects as project}
						<option value={project.id}>{project.title}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">상태</label>
				<select
					id="status-filter"
					bind:value={selectedStatus}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">전체</option>
					<option value="pending">대기</option>
					<option value="in_progress">진행중</option>
					<option value="approved">승인됨</option>
					<option value="rejected">거부됨</option>
				</select>
			</div>
			<div>
				<label for="reason-filter" class="block text-sm font-medium text-gray-700 mb-1">사유</label>
				<select
					id="reason-filter"
					bind:value={selectedReason}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">전체</option>
					{#each availableReasons() as reason}
						<option value={reason}>{reason}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Replacements List -->
	<div class="grid gap-6">
		{#each filteredReplacements() as replacement}
			<Card class="p-6 hover:shadow-md transition-shadow">
				<div class="flex justify-between items-start mb-4">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h3 class="text-xl font-semibold text-gray-900">
								{getPersonName(replacement.originalPersonId)} 대체 요청
							</h3>
							<Badge variant={getStatusVariant(replacement.status)}>
								{getStatusText(replacement.status)}
							</Badge>
						</div>
						<div class="text-sm text-gray-600 mb-3">
							<span class="font-medium">프로젝트:</span> {getProjectName(replacement.projectId)} | 
							<span class="font-medium">사유:</span> {replacement.reason} | 
							<span class="font-medium">효력일:</span> {formatDate(replacement.effectiveDate)} | 
							<span class="font-medium">후보:</span> {replacement.candidates.length}명
						</div>
					</div>
					<div class="flex gap-2 ml-4">
						<button
							onclick={() => showReplacementDetail(replacement)}
							class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
							aria-label="상세보기"
						>
							상세보기
						</button>
						{#if replacement.status === 'pending'}
							<button
								onclick={() => rejectReplacement(replacement.id)}
								class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
							>
								거부
							</button>
						{/if}
					</div>
				</div>

				<!-- Top Candidates -->
				<div class="mb-4">
					<h4 class="font-medium text-gray-900 mb-3">추천 후보 (상위 3명)</h4>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						{#each replacement.candidates.slice(0, 3) as candidate}
							<div class="bg-gray-50 p-4 rounded-md">
								<div class="flex justify-between items-start mb-2">
									<h5 class="font-medium text-gray-900">{getPersonName(candidate.personId)}</h5>
									<div class="flex items-center gap-2">
										<span class="text-sm font-bold {getScoreColor(candidate.score)}">
											{candidate.score}점
										</span>
										{#if candidate.recommended}
											<Badge variant="success">추천</Badge>
										{/if}
									</div>
								</div>
								<div class="text-sm text-gray-600 space-y-1">
									<p><span class="font-medium">경력:</span> {candidate.experience}</p>
									<p><span class="font-medium">가용성:</span> {candidate.availability}%</p>
									<p><span class="font-medium">급여 매치:</span> 
										{candidate.salaryMatch ? '✓' : '✗'}
									</p>
								</div>
								<div class="mt-2">
									<div class="text-xs text-gray-500 mb-1">주요 기술:</div>
									<div class="flex flex-wrap gap-1">
										{#each candidate.skillsMatch.slice(0, 3) as skill}
											<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
												{skill}
											</span>
										{/each}
									</div>
								</div>
								{#if replacement.status === 'pending'}
									<button
										onclick={() => approveReplacement(replacement.id, candidate.personId)}
										class="w-full mt-3 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
									>
										승인
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Match Reasons -->
				<div>
					<h4 class="font-medium text-gray-900 mb-2">추천 이유 (1순위)</h4>
					<ul class="text-sm text-gray-600 space-y-1">
						{#each replacement.candidates[0]?.reasons || [] as reason}
							<li class="flex items-center gap-2">
								<span class="text-green-500">✓</span>
								{reason}
							</li>
						{/each}
					</ul>
				</div>
			</Card>
		{/each}
	</div>

	{#if filteredReplacements().length === 0}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">👥</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">대체 요청이 없습니다</h3>
			<p class="text-gray-500">새로운 인력 대체 요청을 생성해보세요.</p>
		</div>
	{/if}
</div>

<!-- Detail Modal -->
<Modal bind:show={showDetailModal} title="대체 요청 상세">
	{#if selectedReplacement}
		<div class="space-y-6">
			<div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">
					{getPersonName(selectedReplacement.originalPersonId)} 대체 요청
				</h3>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="font-medium text-gray-700">프로젝트:</span>
						<span class="ml-2">{getProjectName(selectedReplacement.projectId)}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">사유:</span>
						<span class="ml-2">{selectedReplacement.reason}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">효력일:</span>
						<span class="ml-2">{formatDate(selectedReplacement.effectiveDate)}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">상태:</span>
						<span class="ml-2">
							<Badge variant={getStatusVariant(selectedReplacement.status)}>
								{getStatusText(selectedReplacement.status)}
							</Badge>
						</span>
					</div>
				</div>
			</div>

			<!-- All Candidates -->
			<div>
				<h4 class="font-medium text-gray-900 mb-3">모든 후보자</h4>
				<div class="space-y-4">
					{#each selectedReplacement.candidates as candidate, index}
						<div class="bg-gray-50 p-4 rounded-md">
							<div class="flex justify-between items-start mb-3">
								<div>
									<h5 class="font-medium text-gray-900">
										{index + 1}순위: {getPersonName(candidate.personId)}
									</h5>
									<div class="text-sm text-gray-600 mt-1">
										경력: {candidate.experience} | 가용성: {candidate.availability}% | 
										급여 매치: {candidate.salaryMatch ? '✓' : '✗'}
									</div>
								</div>
								<div class="text-right">
									<div class="text-2xl font-bold {getScoreColor(candidate.score)}">
										{candidate.score}점
									</div>
									{#if candidate.recommended}
										<Badge variant="success">추천</Badge>
									{/if}
								</div>
							</div>
							<div class="mb-3">
								<div class="text-sm font-medium text-gray-700 mb-1">추천 이유:</div>
								<ul class="text-sm text-gray-600 space-y-1">
									{#each candidate.reasons as reason}
										<li class="flex items-center gap-2">
											<span class="text-green-500">✓</span>
											{reason}
										</li>
									{/each}
								</ul>
							</div>
							<div>
								<div class="text-sm font-medium text-gray-700 mb-1">기술 스택:</div>
								<div class="flex flex-wrap gap-1">
									{#each candidate.skillsMatch as skill}
										<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
											{skill}
										</span>
									{/each}
								</div>
							</div>
							{#if selectedReplacement.status === 'pending'}
								<button
									onclick={() => approveReplacement(selectedReplacement.id, candidate.personId)}
									class="w-full mt-3 px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
								>
									이 후보자 승인
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</Modal>

<!-- Create Modal -->
<Modal bind:show={showCreateModal} title="대체 요청 생성">
	<div class="space-y-4">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="create-person" class="block text-sm font-medium text-gray-700 mb-1">대체 대상 *</label>
				<select
					id="create-person"
					bind:value={formData.originalPersonId}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">인력 선택</option>
					{#each persons as person}
						<option value={person.id}>{person.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="create-project" class="block text-sm font-medium text-gray-700 mb-1">프로젝트 *</label>
				<select
					id="create-project"
					bind:value={formData.projectId}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">프로젝트 선택</option>
					{#each projects as project}
						<option value={project.id}>{project.title}</option>
					{/each}
				</select>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="create-reason" class="block text-sm font-medium text-gray-700 mb-1">대체 사유 *</label>
				<select
					id="create-reason"
					bind:value={formData.reason}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">사유 선택</option>
					<option value="퇴사">퇴사</option>
					<option value="프로젝트 변경">프로젝트 변경</option>
					<option value="휴직">휴직</option>
					<option value="성과 부진">성과 부진</option>
					<option value="기타">기타</option>
				</select>
			</div>
			<div>
				<label for="create-date" class="block text-sm font-medium text-gray-700 mb-1">효력일 *</label>
				<input
					id="create-date"
					type="date"
					bind:value={formData.effectiveDate}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="create-priority" class="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
				<select
					id="create-priority"
					bind:value={formData.priority}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="low">낮음</option>
					<option value="medium">보통</option>
					<option value="high">높음</option>
				</select>
			</div>
			<div>
				<label for="create-experience" class="block text-sm font-medium text-gray-700 mb-1">필요 경력</label>
				<select
					id="create-experience"
					bind:value={formData.experienceLevel}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">경력 선택</option>
					<option value="1-2년">1-2년</option>
					<option value="3-5년">3-5년</option>
					<option value="5년 이상">5년 이상</option>
				</select>
			</div>
		</div>
		<div>
			<label for="create-salary" class="block text-sm font-medium text-gray-700 mb-1">급여 범위</label>
			<input
				id="create-salary"
				type="text"
				bind:value={formData.salaryRange}
				placeholder="예: 5000-7000만원"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
		<div>
			<div class="flex justify-between items-center mb-2">
				<label class="block text-sm font-medium text-gray-700">필수 기술</label>
				<button
					type="button"
					onclick={addRequiredSkill}
					class="text-sm text-blue-600 hover:text-blue-700"
				>
					+ 기술 추가
				</button>
			</div>
			<div class="space-y-2">
				{#each formData.requiredSkills as skill, index}
					<div class="flex gap-2 items-center">
						<input
							type="text"
							bind:value={skill}
							placeholder="기술명"
							class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<button
							type="button"
							onclick={() => removeRequiredSkill(index)}
							class="text-red-600 hover:text-red-700"
						>
							삭제
						</button>
					</div>
				{/each}
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
				onclick={createReplacementRequest}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				요청 생성
			</button>
		</div>
	</div>
</Modal>
