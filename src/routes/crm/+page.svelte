<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge } from '$lib/components/ui/Badge.svelte';
	import { Card } from '$lib/components/ui/Card.svelte';
	import { Modal } from '$lib/components/ui/Modal.svelte';

	// Mock CRM data
	let crmData = $state({
		customers: [
			{
				id: 'customer-1',
				name: 'ABC 테크놀로지',
				type: 'enterprise',
				industry: 'IT/소프트웨어',
				status: 'active',
				contact: '김영희',
				email: 'kim@abctech.com',
				phone: '02-1234-5678',
				address: '서울시 강남구 테헤란로 123',
				website: 'www.abctech.com',
				revenue: 1500000000,
				employees: 500,
				createdAt: '2023-06-15',
				lastContact: '2024-01-20',
				notes: 'AI 솔루션 고객, 장기 계약 고객',
				tags: ['AI', '장기계약', 'VIP']
			},
			{
				id: 'customer-2',
				name: 'XYZ 제조',
				type: 'enterprise',
				industry: '제조업',
				status: 'active',
				contact: '박민수',
				email: 'park@xyz.com',
				phone: '031-9876-5432',
				address: '경기도 성남시 분당구 판교로 456',
				website: 'www.xyz.com',
				revenue: 800000000,
				employees: 300,
				createdAt: '2023-08-20',
				lastContact: '2024-01-18',
				notes: '스마트팩토리 솔루션 고객',
				tags: ['제조업', '스마트팩토리']
			},
			{
				id: 'customer-3',
				name: 'DEF 스타트업',
				type: 'startup',
				industry: '핀테크',
				status: 'prospect',
				contact: '이지은',
				email: 'lee@defstartup.com',
				phone: '010-5555-1234',
				address: '서울시 마포구 홍대입구역 789',
				website: 'www.defstartup.com',
				revenue: 50000000,
				employees: 20,
				createdAt: '2024-01-05',
				lastContact: '2024-01-22',
				notes: '핀테크 스타트업, 잠재 고객',
				tags: ['핀테크', '스타트업', '잠재고객']
			}
		],
		interactions: [
			{
				id: 'interaction-1',
				customerId: 'customer-1',
				type: 'meeting',
				subject: 'AI 솔루션 업그레이드 논의',
				date: '2024-01-20',
				time: '14:00',
				duration: 90,
				participants: ['김영희', '박영업', '이기술'],
				notes: '기존 AI 솔루션 성능 개선 및 새로운 기능 추가 논의',
				nextAction: '제안서 작성',
				nextActionDate: '2024-01-25'
			},
			{
				id: 'interaction-2',
				customerId: 'customer-2',
				type: 'call',
				subject: '스마트팩토리 프로젝트 진행상황',
				date: '2024-01-18',
				time: '10:00',
				duration: 45,
				participants: ['박민수', '김영업'],
				notes: '프로젝트 진행상황 점검 및 추가 요구사항 확인',
				nextAction: '추가 요구사항 분석',
				nextActionDate: '2024-01-22'
			},
			{
				id: 'interaction-3',
				customerId: 'customer-3',
				type: 'email',
				subject: '핀테크 솔루션 제안',
				date: '2024-01-22',
				time: '16:30',
				duration: 30,
				participants: ['이지은', '이영업'],
				notes: '핀테크 솔루션 제안서 전송 및 초기 상담',
				nextAction: '데모 일정 조율',
				nextActionDate: '2024-01-26'
			}
		],
		contracts: [
			{
				id: 'contract-1',
				customerId: 'customer-1',
				title: 'AI 플랫폼 라이선스 계약',
				type: 'license',
				value: 500000000,
				startDate: '2023-07-01',
				endDate: '2024-06-30',
				status: 'active',
				renewalDate: '2024-06-30',
				notes: '연간 라이선스 계약, 자동 갱신'
			},
			{
				id: 'contract-2',
				customerId: 'customer-2',
				title: '스마트팩토리 구축 프로젝트',
				type: 'project',
				value: 300000000,
				startDate: '2023-09-01',
				endDate: '2024-03-31',
				status: 'active',
				renewalDate: null,
				notes: '일회성 프로젝트 계약'
			}
		]
	});

	let selectedCustomer: any = null;
	let showCustomerModal = $state(false);
	let showCreateModal = $state(false);
	let showInteractionModal = $state(false);
	let searchTerm = $state('');
	let selectedType = $state<string>('all');
	let selectedStatus = $state<string>('all');
	let selectedIndustry = $state<string>('all');

	// Form data for creating new customer
	let formData = $state({
		name: '',
		type: 'enterprise',
		industry: '',
		status: 'prospect',
		contact: '',
		email: '',
		phone: '',
		address: '',
		website: '',
		revenue: 0,
		employees: 0,
		notes: '',
		tags: [] as string[]
	});

	// Form data for creating new interaction
	let interactionFormData = $state({
		customerId: '',
		type: 'meeting',
		subject: '',
		date: '',
		time: '',
		duration: 60,
		participants: [] as string[],
		notes: '',
		nextAction: '',
		nextActionDate: ''
	});

	// Get filtered customers
	let filteredCustomers = $derived(() => {
		let filtered = crmData.customers;
		
		if (searchTerm) {
			filtered = filtered.filter(customer => 
				customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
				customer.email.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}
		
		if (selectedType !== 'all') {
			filtered = filtered.filter(customer => customer.type === selectedType);
		}
		
		if (selectedStatus !== 'all') {
			filtered = filtered.filter(customer => customer.status === selectedStatus);
		}
		
		if (selectedIndustry !== 'all') {
			filtered = filtered.filter(customer => customer.industry === selectedIndustry);
		}
		
		return filtered.sort((a, b) => new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime());
	});

	// Get unique industries for filter
	let availableIndustries = $derived(() => {
		const industries = [...new Set(crmData.customers.map(customer => customer.industry))];
		return industries;
	});

	// Show customer detail
	function showCustomerDetail(customer: any) {
		selectedCustomer = customer;
		showCustomerModal = true;
	}

	// Create new customer
	function createCustomer() {
		if (!formData.name || !formData.contact || !formData.email) {
			alert('필수 필드를 입력해주세요.');
			return;
		}

		const newCustomer = {
			id: `customer-${Date.now()}`,
			...formData,
			createdAt: new Date().toISOString().split('T')[0],
			lastContact: new Date().toISOString().split('T')[0]
		};

		crmData.customers.push(newCustomer);
		
		// Reset form
		formData = {
			name: '',
			type: 'enterprise',
			industry: '',
			status: 'prospect',
			contact: '',
			email: '',
			phone: '',
			address: '',
			website: '',
			revenue: 0,
			employees: 0,
			notes: '',
			tags: []
		};
		
		showCreateModal = false;
	}

	// Create new interaction
	function createInteraction() {
		if (!interactionFormData.customerId || !interactionFormData.subject || !interactionFormData.date) {
			alert('필수 필드를 입력해주세요.');
			return;
		}

		const newInteraction = {
			id: `interaction-${Date.now()}`,
			...interactionFormData,
			participants: interactionFormData.participants.filter(p => p.trim() !== '')
		};

		crmData.interactions.push(newInteraction);
		
		// Update customer last contact
		const customer = crmData.customers.find(c => c.id === interactionFormData.customerId);
		if (customer) {
			customer.lastContact = interactionFormData.date;
		}
		
		// Reset form
		interactionFormData = {
			customerId: '',
			type: 'meeting',
			subject: '',
			date: '',
			time: '',
			duration: 60,
			participants: [],
			notes: '',
			nextAction: '',
			nextActionDate: ''
		};
		
		showInteractionModal = false;
	}

	// Get customer interactions
	function getCustomerInteractions(customerId: string) {
		return crmData.interactions.filter(interaction => interaction.customerId === customerId);
	}

	// Get customer contracts
	function getCustomerContracts(customerId: string) {
		return crmData.contracts.filter(contract => contract.customerId === customerId);
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
			case 'active': return 'success';
			case 'prospect': return 'warning';
			case 'inactive': return 'danger';
			default: return 'danger';
		}
	}

	// Get status text
	function getStatusText(status: string): string {
		switch (status) {
			case 'active': return '활성';
			case 'prospect': return '잠재';
			case 'inactive': return '비활성';
			default: return '알 수 없음';
		}
	}

	// Get type text
	function getTypeText(type: string): string {
		switch (type) {
			case 'enterprise': return '기업';
			case 'startup': return '스타트업';
			case 'sme': return '중소기업';
			default: return '기타';
		}
	}

	// Get interaction type icon
	function getInteractionIcon(type: string): string {
		switch (type) {
			case 'meeting': return '🤝';
			case 'call': return '📞';
			case 'email': return '📧';
			case 'demo': return '🎯';
			default: return '📝';
		}
	}

	// Calculate total customer value
	let totalCustomerValue = $derived(() => {
		return crmData.contracts.reduce((sum, contract) => sum + contract.value, 0);
	});

	// Calculate active customers
	let activeCustomers = $derived(() => {
		return crmData.customers.filter(customer => customer.status === 'active').length;
	});

	onMount(() => {
		console.log('CRM system initialized');
	});
</script>

<div class="container mx-auto p-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">고객관리(CRM) 시스템</h1>
		<p class="text-gray-600">고객 정보, 상호작용, 계약을 통합 관리하여 고객 관계를 최적화합니다.</p>
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
					<p class="text-sm font-medium text-gray-500">총 고객</p>
					<p class="text-2xl font-semibold text-gray-900">{crmData.customers.length}</p>
				</div>
			</div>
		</Card>
		<Card class="p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
						<span class="text-green-600 text-lg">✅</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">활성 고객</p>
					<p class="text-2xl font-semibold text-gray-900">{activeCustomers}</p>
				</div>
			</div>
		</Card>
		<Card class="p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
						<span class="text-yellow-600 text-lg">💰</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">총 계약 가치</p>
					<p class="text-2xl font-semibold text-gray-900">{formatCurrency(totalCustomerValue)}</p>
				</div>
			</div>
		</Card>
		<Card class="p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
						<span class="text-purple-600 text-lg">📞</span>
					</div>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">총 상호작용</p>
					<p class="text-2xl font-semibold text-gray-900">{crmData.interactions.length}</p>
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
			새 고객 추가
		</button>
		<button
			onclick={() => showInteractionModal = true}
			class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
		>
			상호작용 기록
		</button>
		<button
			onclick={() => alert('고객 가져오기 기능')}
			class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
		>
			고객 가져오기
		</button>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div>
				<label for="search" class="block text-sm font-medium text-gray-700 mb-1">검색</label>
				<input
					id="search"
					type="text"
					bind:value={searchTerm}
					placeholder="고객명, 담당자, 이메일 검색..."
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="type-filter" class="block text-sm font-medium text-gray-700 mb-1">고객 유형</label>
				<select
					id="type-filter"
					bind:value={selectedType}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">전체</option>
					<option value="enterprise">기업</option>
					<option value="startup">스타트업</option>
					<option value="sme">중소기업</option>
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
					<option value="active">활성</option>
					<option value="prospect">잠재</option>
					<option value="inactive">비활성</option>
				</select>
			</div>
			<div>
				<label for="industry-filter" class="block text-sm font-medium text-gray-700 mb-1">업종</label>
				<select
					id="industry-filter"
					bind:value={selectedIndustry}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">전체</option>
					{#each availableIndustries() as industry}
						<option value={industry}>{industry}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Customers List -->
	<div class="grid gap-6">
		{#each filteredCustomers() as customer}
			<Card class="p-6 hover:shadow-md transition-shadow">
				<div class="flex justify-between items-start mb-4">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h3 class="text-xl font-semibold text-gray-900">{customer.name}</h3>
							<Badge variant={getStatusVariant(customer.status)}>
								{getStatusText(customer.status)}
							</Badge>
							<Badge variant="warning">
								{getTypeText(customer.type)}
							</Badge>
						</div>
						<div class="text-sm text-gray-600 mb-3">
							<span class="font-medium">담당자:</span> {customer.contact} | 
							<span class="font-medium">업종:</span> {customer.industry} | 
							<span class="font-medium">매출:</span> {formatCurrency(customer.revenue)} | 
							<span class="font-medium">직원수:</span> {customer.employees}명
						</div>
						<div class="text-sm text-gray-500 mb-3">
							<span class="font-medium">연락처:</span> {customer.email} | {customer.phone} | 
							<span class="font-medium">최근 연락:</span> {formatDate(customer.lastContact)}
						</div>
						{#if customer.tags.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each customer.tags as tag}
									<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
										{tag}
									</span>
								{/each}
							</div>
						{/if}
					</div>
					<div class="flex gap-2 ml-4">
						<button
							onclick={() => showCustomerDetail(customer)}
							class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
							aria-label="상세보기"
						>
							상세보기
						</button>
					</div>
				</div>
				{#if customer.notes}
					<div class="bg-gray-50 p-3 rounded-md">
						<p class="text-sm text-gray-700">{customer.notes}</p>
					</div>
				{/if}
			</Card>
		{/each}
	</div>

	{#if filteredCustomers().length === 0}
		<div class="text-center py-12">
			<div class="text-gray-400 text-6xl mb-4">👥</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">고객이 없습니다</h3>
			<p class="text-gray-500">새로운 고객을 추가해보세요.</p>
		</div>
	{/if}

	<!-- Recent Interactions -->
	<div class="mt-12">
		<h2 class="text-2xl font-bold text-gray-900 mb-6">최근 상호작용</h2>
		<div class="grid gap-4">
			{#each crmData.interactions.slice(0, 5) as interaction}
				<Card class="p-4">
					<div class="flex items-center gap-4">
						<div class="text-2xl">{getInteractionIcon(interaction.type)}</div>
						<div class="flex-1">
							<h4 class="font-medium text-gray-900">{interaction.subject}</h4>
							<p class="text-sm text-gray-600">
								{interaction.participants.join(', ')} | {formatDate(interaction.date)} {interaction.time} | 
								{interaction.duration}분
							</p>
						</div>
					</div>
					{#if interaction.notes}
						<div class="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
							{interaction.notes}
						</div>
					{/if}
				</Card>
			{/each}
		</div>
	</div>
</div>

<!-- Customer Detail Modal -->
<Modal bind:show={showCustomerModal} title="고객 상세">
	{#if selectedCustomer}
		<div class="space-y-6">
			<div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">{selectedCustomer.name}</h3>
				<div class="flex gap-2 mb-4">
					<Badge variant={getStatusVariant(selectedCustomer.status)}>
						{getStatusText(selectedCustomer.status)}
					</Badge>
					<Badge variant="warning">
						{getTypeText(selectedCustomer.type)}
					</Badge>
				</div>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="font-medium text-gray-700">담당자:</span>
						<span class="ml-2">{selectedCustomer.contact}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">업종:</span>
						<span class="ml-2">{selectedCustomer.industry}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">이메일:</span>
						<span class="ml-2">{selectedCustomer.email}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">전화:</span>
						<span class="ml-2">{selectedCustomer.phone}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">매출:</span>
						<span class="ml-2">{formatCurrency(selectedCustomer.revenue)}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">직원수:</span>
						<span class="ml-2">{selectedCustomer.employees}명</span>
					</div>
				</div>
			</div>

			<!-- Customer Interactions -->
			<div>
				<h4 class="font-medium text-gray-900 mb-3">상호작용 이력</h4>
				<div class="space-y-3">
					{#each getCustomerInteractions(selectedCustomer.id) as interaction}
						<div class="bg-gray-50 p-3 rounded-md">
							<div class="flex items-center gap-2 mb-1">
								<span class="text-lg">{getInteractionIcon(interaction.type)}</span>
								<span class="font-medium text-gray-900">{interaction.subject}</span>
								<span class="text-sm text-gray-500">{formatDate(interaction.date)}</span>
							</div>
							<p class="text-sm text-gray-600">{interaction.notes}</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Customer Contracts -->
			<div>
				<h4 class="font-medium text-gray-900 mb-3">계약 정보</h4>
				<div class="space-y-3">
					{#each getCustomerContracts(selectedCustomer.id) as contract}
						<div class="bg-gray-50 p-3 rounded-md">
							<div class="flex justify-between items-start mb-1">
								<span class="font-medium text-gray-900">{contract.title}</span>
								<span class="text-sm font-bold text-gray-900">{formatCurrency(contract.value)}</span>
							</div>
							<div class="text-sm text-gray-600">
								{formatDate(contract.startDate)} ~ {formatDate(contract.endDate)} | 
								<Badge variant={getStatusVariant(contract.status)}>
									{getStatusText(contract.status)}
								</Badge>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="flex justify-end gap-2">
				<button
					onclick={() => showCustomerModal = false}
					class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					닫기
				</button>
			</div>
		</div>
	{/if}
</Modal>

<!-- Create Customer Modal -->
<Modal bind:show={showCreateModal} title="새 고객 추가">
	<div class="space-y-4">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="create-name" class="block text-sm font-medium text-gray-700 mb-1">고객명 *</label>
				<input
					id="create-name"
					type="text"
					bind:value={formData.name}
					placeholder="고객명"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="create-type" class="block text-sm font-medium text-gray-700 mb-1">고객 유형</label>
				<select
					id="create-type"
					bind:value={formData.type}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="enterprise">기업</option>
					<option value="startup">스타트업</option>
					<option value="sme">중소기업</option>
				</select>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
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
		</div>
		<div class="grid grid-cols-2 gap-4">
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
			<div>
				<label for="create-industry" class="block text-sm font-medium text-gray-700 mb-1">업종</label>
				<select
					id="create-industry"
					bind:value={formData.industry}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">업종 선택</option>
					<option value="IT/소프트웨어">IT/소프트웨어</option>
					<option value="제조업">제조업</option>
					<option value="핀테크">핀테크</option>
					<option value="헬스케어">헬스케어</option>
					<option value="교육">교육</option>
					<option value="기타">기타</option>
				</select>
			</div>
		</div>
		<div>
			<label for="create-notes" class="block text-sm font-medium text-gray-700 mb-1">메모</label>
			<textarea
				id="create-notes"
				bind:value={formData.notes}
				rows="3"
				placeholder="고객에 대한 추가 정보나 메모..."
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
				onclick={createCustomer}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				생성
			</button>
		</div>
	</div>
</Modal>

<!-- Create Interaction Modal -->
<Modal bind:show={showInteractionModal} title="상호작용 기록">
	<div class="space-y-4">
		<div>
			<label for="interaction-customer" class="block text-sm font-medium text-gray-700 mb-1">고객 *</label>
			<select
				id="interaction-customer"
				bind:value={interactionFormData.customerId}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="">고객 선택</option>
				{#each crmData.customers as customer}
					<option value={customer.id}>{customer.name}</option>
				{/each}
			</select>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="interaction-type" class="block text-sm font-medium text-gray-700 mb-1">상호작용 유형</label>
				<select
					id="interaction-type"
					bind:value={interactionFormData.type}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="meeting">미팅</option>
					<option value="call">전화</option>
					<option value="email">이메일</option>
					<option value="demo">데모</option>
				</select>
			</div>
			<div>
				<label for="interaction-subject" class="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
				<input
					id="interaction-subject"
					type="text"
					bind:value={interactionFormData.subject}
					placeholder="상호작용 제목"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>
		<div class="grid grid-cols-3 gap-4">
			<div>
				<label for="interaction-date" class="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
				<input
					id="interaction-date"
					type="date"
					bind:value={interactionFormData.date}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="interaction-time" class="block text-sm font-medium text-gray-700 mb-1">시간</label>
				<input
					id="interaction-time"
					type="time"
					bind:value={interactionFormData.time}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="interaction-duration" class="block text-sm font-medium text-gray-700 mb-1">소요시간 (분)</label>
				<input
					id="interaction-duration"
					type="number"
					bind:value={interactionFormData.duration}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>
		<div>
			<label for="interaction-notes" class="block text-sm font-medium text-gray-700 mb-1">내용</label>
			<textarea
				id="interaction-notes"
				bind:value={interactionFormData.notes}
				rows="3"
				placeholder="상호작용 내용..."
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			></textarea>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="interaction-next-action" class="block text-sm font-medium text-gray-700 mb-1">다음 액션</label>
				<input
					id="interaction-next-action"
					type="text"
					bind:value={interactionFormData.nextAction}
					placeholder="다음 액션"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="interaction-next-date" class="block text-sm font-medium text-gray-700 mb-1">다음 액션 날짜</label>
				<input
					id="interaction-next-date"
					type="date"
					bind:value={interactionFormData.nextActionDate}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>
		<div class="flex justify-end gap-2 pt-4">
			<button
				onclick={() => showInteractionModal = false}
				class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
			>
				취소
			</button>
			<button
				onclick={createInteraction}
				class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
			>
				기록
			</button>
		</div>
	</div>
</Modal>
