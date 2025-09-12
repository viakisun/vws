<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge } from '$lib/components/ui/Badge.svelte';
	import { Card } from '$lib/components/ui/Card.svelte';
	import { Modal } from '$lib/components/ui/Modal.svelte';

	// Mock sales data
	let salesData = $state({
		leads: [
			{
				id: 'lead-1',
				company: 'ABC 테크놀로지',
				contact: '김영희',
				position: 'CTO',
				email: 'kim@abctech.com',
				phone: '02-1234-5678',
				industry: 'IT/소프트웨어',
				status: 'qualified',
				value: 50000000,
				probability: 70,
				source: '웹사이트',
				createdAt: '2024-01-15',
				lastContact: '2024-01-20',
				notes: 'AI 솔루션에 관심, 데모 요청'
			},
			{
				id: 'lead-2',
				company: 'XYZ 제조',
				contact: '박민수',
				position: 'R&D 부장',
				email: 'park@xyz.com',
				phone: '031-9876-5432',
				industry: '제조업',
				status: 'proposal',
				value: 30000000,
				probability: 50,
				source: '추천',
				createdAt: '2024-01-10',
				lastContact: '2024-01-18',
				notes: '제안서 검토 중, 추가 미팅 예정'
			}
		]
	});

	let selectedLead: any = null;
	let showLeadModal = $state(false);
	let showCreateModal = $state(false);
	let searchTerm = $state('');
	let selectedStatus = $state<string>('all');

	// Form data for creating new lead
	let formData = $state({
		company: '',
		contact: '',
		position: '',
		email: '',
		phone: '',
		industry: '',
		status: 'new',
		value: 0,
		probability: 0,
		source: '',
		notes: ''
	});

	// Get filtered leads
	let filteredLeads = $derived(() => {
		let filtered = salesData.leads;
		
		if (searchTerm) {
			filtered = filtered.filter(lead => 
				lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
				lead.contact.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}
		
		if (selectedStatus !== 'all') {
			filtered = filtered.filter(lead => lead.status === selectedStatus);
		}
		
		return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	});

	// Show lead detail
	function showLeadDetail(lead: any) {
		selectedLead = lead;
		showLeadModal = true;
	}

	// Create new lead
	function createLead() {
		if (!formData.company || !formData.contact || !formData.email) {
			alert('필수 필드를 입력해주세요.');
			return;
		}

		const newLead = {
			id: `lead-${Date.now()}`,
			...formData,
			createdAt: new Date().toISOString().split('T')[0],
			lastContact: new Date().toISOString().split('T')[0]
		};

		salesData.leads.push(newLead);
		
		// Reset form
		formData = {
			company: '',
			contact: '',
			position: '',
			email: '',
			phone: '',
			industry: '',
			status: 'new',
			value: 0,
			probability: 0,
			source: '',
			notes: ''
		};
		
		showCreateModal = false;
	}

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ko-KR', {
			style: 'currency',
			currency: 'KRW',
			minimumFractionDigits: 0
		}).format(amount);
	}

	// Format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('ko-KR');
	}

	// Get status badge variant
	function getStatusVariant(status: string): 'success' | 'warning' | 'danger' {
		switch (status) {
			case 'qualified': return 'success';
			case 'proposal': return 'warning';
			case 'negotiation': return 'warning';
			case 'closed_won': return 'success';
			case 'closed_lost': return 'danger';
			default: return 'danger';
		}
	}

	// Get status text
	function getStatusText(status: string): string {
		switch (status) {
			case 'new': return '신규';
			case 'qualified': return '자격확보';
			case 'proposal': return '제안';
			case 'negotiation': return '협상';
			case 'closed_won': return '성사';
			case 'closed_lost': return '실패';
			default: return '알 수 없음';
		}
	}

	onMount(() => {
		console.log('Sales system initialized');
	});
</script>

<div class="container mx-auto p-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">영업관리 시스템</h1>
		<p class="text-gray-600">리드 관리, 기회 추적, 영업 활동을 통합 관리합니다.</p>
	</div>

	<!-- Key Metrics -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
		<Card class="p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
						<span class="text-blue-600 text-lg">👥</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">총 리드</p>
					<p class="text-2xl font-semibold text-gray-900">{salesData.leads.length}</p>
				</div>
			</div>
		</Card>
		<Card class="p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
						<span class="text-green-600 text-lg">💰</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">총 가치</p>
					<p class="text-2xl font-semibold text-gray-900">
						{formatCurrency(salesData.leads.reduce((sum, lead) => sum + lead.value, 0))}
					</p>
				</div>
			</div>
		</Card>
		<Card class="p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
						<span class="text-yellow-600 text-lg">📈</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">평균 확률</p>
					<p class="text-2xl font-semibold text-gray-900">
						{Math.round(salesData.leads.reduce((sum, lead) => sum + lead.probability, 0) / salesData.leads.length)}%
					</p>
				</div>
			</div>
		</Card>
		<Card class="p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
						<span class="text-purple-600 text-lg">🎯</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">활성 리드</p>
					<p class="text-2xl font-semibold text-gray-900">
						{salesData.leads.filter(lead => lead.status !== 'closed_won' && lead.status !== 'closed_lost').length}
					</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Action Buttons -->
	<div class="flex gap-4 mb-6">
		<button
			onclick={() => showCreateModal = true}
			class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			새 리드 추가
		</button>
		<button
			onclick={() => alert('리드 가져오기 기능')}
			class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
		>
			리드 가져오기
		</button>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label for="search" class="block text-sm font-medium text-gray-700 mb-1">검색</label>
				<input
					id="search"
					type="text"
					bind:value={searchTerm}
					placeholder="회사명, 담당자 검색..."
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">상태</label>
				<select
					id="status-filter"
					bind:value={selectedStatus}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">전체</option>
					<option value="new">신규</option>
					<option value="qualified">자격확보</option>
					<option value="proposal">제안</option>
					<option value="negotiation">협상</option>
					<option value="closed_won">성사</option>
					<option value="closed_lost">실패</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Leads List -->
	<div class="grid gap-6">
		{#each filteredLeads() as lead}
			<Card class="p-6 hover:shadow-md transition-shadow">
				<div class="flex justify-between items-start mb-4">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h3 class="text-xl font-semibold text-gray-900">{lead.company}</h3>
							<Badge variant={getStatusVariant(lead.status)}>
								{getStatusText(lead.status)}
							</Badge>
						</div>
						<div class="text-sm text-gray-600 mb-3">
							<span class="font-medium">담당자:</span> {lead.contact} ({lead.position}) | 
							<span class="font-medium">업종:</span> {lead.industry} | 
							<span class="font-medium">가치:</span> {formatCurrency(lead.value)} | 
							<span class="font-medium">확률:</span> {lead.probability}%
						</div>
						<div class="text-sm text-gray-500">
							<span class="font-medium">연락처:</span> {lead.email} | {lead.phone} | 
							<span class="font-medium">최근 연락:</span> {formatDate(lead.lastContact)}
						</div>
					</div>
					<div class="flex gap-2 ml-4">
						<button
							onclick={() => showLeadDetail(lead)}
							class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
							aria-label="상세보기"
						>
							상세보기
						</button>
					</div>
				</div>
				{#if lead.notes}
					<div class="bg-gray-50 p-3 rounded-md">
						<p class="text-sm text-gray-700">{lead.notes}</p>
					</div>
				{/if}
			</Card>
		{/each}
	</div>

	{#if filteredLeads().length === 0}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">🎯</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">리드가 없습니다</h3>
			<p class="text-gray-500">새로운 리드를 추가해보세요.</p>
		</div>
	{/if}
</div>

<!-- Lead Detail Modal -->
<Modal bind:show={showLeadModal} title="리드 상세">
	{#if selectedLead}
		<div class="space-y-6">
			<div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">{selectedLead.company}</h3>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="font-medium text-gray-700">담당자:</span>
						<span class="ml-2">{selectedLead.contact} ({selectedLead.position})</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">업종:</span>
						<span class="ml-2">{selectedLead.industry}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">이메일:</span>
						<span class="ml-2">{selectedLead.email}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">전화:</span>
						<span class="ml-2">{selectedLead.phone}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">상태:</span>
						<span class="ml-2">
							<Badge variant={getStatusVariant(selectedLead.status)}>
								{getStatusText(selectedLead.status)}
							</Badge>
						</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">가치:</span>
						<span class="ml-2">{formatCurrency(selectedLead.value)}</span>
					</div>
				</div>
			</div>

			{#if selectedLead.notes}
				<div>
					<h4 class="font-medium text-gray-900 mb-2">메모</h4>
					<div class="bg-gray-50 p-4 rounded-md">
						<p class="text-gray-700">{selectedLead.notes}</p>
					</div>
				</div>
			{/if}

			<div class="flex justify-end gap-2">
				<button
					onclick={() => showLeadModal = false}
					class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					닫기
				</button>
			</div>
		</div>
	{/if}
</Modal>

<!-- Create Lead Modal -->
<Modal bind:show={showCreateModal} title="새 리드 추가">
	<div class="space-y-4">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="create-company" class="block text-sm font-medium text-gray-700 mb-1">회사명 *</label>
				<input
					id="create-company"
					type="text"
					bind:value={formData.company}
					placeholder="회사명"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="create-contact" class="block text-sm font-medium text-gray-700 mb-1">담당자 *</label>
				<input
					id="create-contact"
					type="text"
					bind:value={formData.contact}
					placeholder="담당자명"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="create-email" class="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
				<input
					id="create-email"
					type="email"
					bind:value={formData.email}
					placeholder="이메일"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="create-phone" class="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
				<input
					id="create-phone"
					type="tel"
					bind:value={formData.phone}
					placeholder="전화번호"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>
		<div>
			<label for="create-notes" class="block text-sm font-medium text-gray-700 mb-1">메모</label>
			<textarea
				id="create-notes"
				bind:value={formData.notes}
				rows="3"
				placeholder="리드에 대한 추가 정보나 메모..."
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			></textarea>
		</div>
		<div class="flex justify-end gap-2 pt-4">
			<button
				onclick={() => showCreateModal = false}
				class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
			>
				취소
			</button>
			<button
				onclick={createLead}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				생성
			</button>
		</div>
	</div>
</Modal>
