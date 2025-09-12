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
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte';
	import ThemeInput from '$lib/components/ui/ThemeInput.svelte';
	import ThemeDropdown from '$lib/components/ui/ThemeDropdown.svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { 
		UsersIcon, 
		BuildingIcon, 
		DollarSignIcon, 
		TrendingUpIcon,
		PlusIcon,
		EyeIcon,
		EditIcon,
		TrashIcon,
		PhoneIcon,
		MailIcon,
		CalendarIcon,
		MapPinIcon,
		GlobeIcon,
		StarIcon,
		MessageSquareIcon
	} from 'lucide-svelte';

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
				status: 'active',
				contact: '이지은',
				email: 'lee@defstartup.com',
				phone: '010-5555-1234',
				address: '서울시 서초구 강남대로 789',
				website: 'www.defstartup.com',
				revenue: 200000000,
				employees: 50,
				createdAt: '2023-12-01',
				lastContact: '2024-01-19',
				notes: '핀테크 솔루션 고객, 빠른 성장',
				tags: ['핀테크', '스타트업']
			}
		],
		interactions: [
			{
				id: 'interaction-1',
				customerId: 'customer-1',
				type: 'call',
				subject: 'AI 솔루션 업그레이드 논의',
				description: '기존 AI 솔루션의 성능 개선 및 새로운 기능 추가에 대해 논의',
				date: '2024-01-20',
				duration: 45,
				participants: ['김영희', '김영희'],
				status: 'completed'
			},
			{
				id: 'interaction-2',
				customerId: 'customer-2',
				type: 'email',
				subject: '스마트팩토리 프로젝트 진행 상황',
				description: '현재 진행 중인 스마트팩토리 프로젝트의 진행 상황 공유',
				date: '2024-01-18',
				participants: ['박민수', '김영희'],
				status: 'completed'
			},
			{
				id: 'interaction-3',
				customerId: 'customer-3',
				type: 'meeting',
				subject: '핀테크 솔루션 확장 계획',
				description: '핀테크 솔루션의 기능 확장 및 새로운 시장 진출 계획 논의',
				date: '2024-01-19',
				duration: 60,
				participants: ['이지은', '김영희'],
				status: 'completed'
			}
		],
		opportunities: [
			{
				id: 'opp-1',
				customerId: 'customer-1',
				title: 'AI 솔루션 고도화',
				value: 100000000,
				stage: 'proposal',
				probability: 80,
				expectedClose: '2024-03-15',
				owner: '김영희',
				createdAt: '2024-01-15'
			},
			{
				id: 'opp-2',
				customerId: 'customer-2',
				title: '스마트팩토리 2단계',
				value: 50000000,
				stage: 'negotiation',
				probability: 60,
				expectedClose: '2024-04-30',
				owner: '박민수',
				createdAt: '2024-01-10'
			}
		]
	});

	let selectedCustomer = $state(null);
	let showCustomerModal = $state(false);
	let showCreateModal = $state(false);
	let searchTerm = $state('');
	let selectedType = $state('all');
	let selectedStatus = $state('all');

	// 통계 데이터
	const stats = [
		{
			title: '총 고객 수',
			value: crmData.customers.length,
			change: '+8%',
			changeType: 'positive' as const,
			icon: UsersIcon
		},
		{
			title: '활성 고객',
			value: crmData.customers.filter(c => c.status === 'active').length,
			change: '+3',
			changeType: 'positive' as const,
			icon: BuildingIcon
		},
		{
			title: '총 매출',
			value: formatCurrency(crmData.customers.reduce((sum, c) => sum + c.revenue, 0)),
			change: '+15%',
			changeType: 'positive' as const,
			icon: DollarSignIcon
		},
		{
			title: '고객 만족도',
			value: '92%',
			change: '+2%',
			changeType: 'positive' as const,
			icon: StarIcon
		}
	];

	// 액션 버튼들
	const actions = [
		{
			label: '고객 추가',
			icon: PlusIcon,
			onclick: () => showCreateModal = true,
			variant: 'primary' as const
		},
		{
			label: '상호작용 기록',
			icon: MessageSquareIcon,
			onclick: () => console.log('Add interaction'),
			variant: 'success' as const
		}
	];

	// 필터링된 고객 데이터
	let filteredCustomers = $derived(() => {
		let customers = crmData.customers;
		
		if (searchTerm) {
			customers = customers.filter(customer => 
				customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
				customer.industry.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}
		
		if (selectedType !== 'all') {
			customers = customers.filter(customer => customer.type === selectedType);
		}
		
		if (selectedStatus !== 'all') {
			customers = customers.filter(customer => customer.status === selectedStatus);
		}
		
		return customers;
	});

	// 고객 타입별 색상
	const getTypeColor = (type: string) => {
		const colors = {
			'enterprise': 'primary',
			'startup': 'success',
			'smb': 'warning',
			'individual': 'info'
		};
		return colors[type] || 'default';
	};

	// 고객 타입별 한글 라벨
	const getTypeLabel = (type: string) => {
		const labels = {
			'enterprise': '대기업',
			'startup': '스타트업',
			'smb': '중소기업',
			'individual': '개인'
		};
		return labels[type] || type;
	};

	// 고객 상세 보기
	function viewCustomer(customer: any) {
		selectedCustomer = customer;
		showCustomerModal = true;
	}

	// 고객 삭제
	function deleteCustomer(customerId: string) {
		crmData.customers = crmData.customers.filter(customer => customer.id !== customerId);
	}

	// 고객별 상호작용 가져오기
	function getCustomerInteractions(customerId: string) {
		return crmData.interactions.filter(interaction => interaction.customerId === customerId);
	}

	// 고객별 기회 가져오기
	function getCustomerOpportunities(customerId: string) {
		return crmData.opportunities.filter(opportunity => opportunity.customerId === customerId);
	}

	onMount(() => {
		console.log('CRM 페이지 로드됨');
	});
</script>

<PageLayout
	title="고객관리"
	subtitle="고객 정보, 상호작용, 기회 관리"
	{stats}
	{actions}
	searchPlaceholder="고객명, 담당자, 업종으로 검색..."
>
	<!-- 고객 목록 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold" style="color: var(--color-text);">고객 목록</h3>
			<div class="flex items-center gap-2">
				<ThemeDropdown
					options={[
						{ value: 'all', label: '전체 타입' },
						{ value: 'enterprise', label: '대기업' },
						{ value: 'startup', label: '스타트업' },
						{ value: 'smb', label: '중소기업' }
					]}
					bind:value={selectedType}
					placeholder="타입 필터"
				/>
				<ThemeDropdown
					options={[
						{ value: 'all', label: '전체 상태' },
						{ value: 'active', label: '활성' },
						{ value: 'inactive', label: '비활성' },
						{ value: 'prospect', label: '잠재고객' }
					]}
					bind:value={selectedStatus}
					placeholder="상태 필터"
				/>
			</div>
		</div>
		
		<div class="space-y-4">
			{#each filteredCustomers as customer}
				<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<BuildingIcon size={20} style="color: var(--color-primary);" />
							<h4 class="font-medium" style="color: var(--color-text);">{customer.name}</h4>
							<ThemeBadge variant={getTypeColor(customer.type)}>
								{getTypeLabel(customer.type)}
							</ThemeBadge>
							<ThemeBadge variant={customer.status === 'active' ? 'success' : 'warning'}>
								{customer.status === 'active' ? '활성' : '비활성'}
							</ThemeBadge>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" style="color: var(--color-text-secondary);">
							<div class="flex items-center gap-2">
								<UsersIcon size={16} />
								{customer.contact}
							</div>
							<div class="flex items-center gap-2">
								<DollarSignIcon size={16} />
								{formatCurrency(customer.revenue)}
							</div>
							<div class="flex items-center gap-2">
								<CalendarIcon size={16} />
								{formatDate(customer.lastContact)}
							</div>
						</div>
						<div class="flex items-center gap-2 mt-2">
							{#each customer.tags as tag}
								<ThemeBadge variant="info" size="sm">{tag}</ThemeBadge>
							{/each}
						</div>
					</div>
					<div class="flex items-center gap-2">
						<ThemeButton variant="ghost" size="sm" onclick={() => viewCustomer(customer)}>
							<EyeIcon size={16} />
						</ThemeButton>
						<ThemeButton variant="ghost" size="sm">
							<EditIcon size={16} />
						</ThemeButton>
						<ThemeButton variant="ghost" size="sm" onclick={() => deleteCustomer(customer.id)}>
							<TrashIcon size={16} />
						</ThemeButton>
					</div>
				</div>
			{/each}
		</div>
	</ThemeCard>

	<!-- 고객 분석 -->
	<ThemeGrid cols={1} lgCols={2} gap={6}>
		<!-- 고객 타입별 분포 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="고객 타입별 분포" />
			<ThemeChartPlaceholder
				title="고객 분포"
				description="고객 타입별 분포 현황"
				icon={UsersIcon}
			/>
		</ThemeCard>

		<!-- 업종별 매출 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="업종별 매출" />
			<ThemeChartPlaceholder
				title="업종별 분석"
				description="업종별 매출 비중"
				icon={TrendingUpIcon}
			/>
		</ThemeCard>
	</ThemeGrid>

	<!-- 최근 상호작용 -->
	<ThemeCard class="p-6">
		<ThemeSectionHeader title="최근 상호작용" />
		<ThemeSpacer size={4}>
			{#each crmData.interactions.slice(0, 5) as interaction}
				{@const customer = crmData.customers.find(c => c.id === interaction.customerId)}
				<ThemeActivityItem
					title={interaction.subject}
					description="{customer?.name} - {interaction.description}"
					time={interaction.date}
					icon={interaction.type === 'call' ? PhoneIcon : interaction.type === 'email' ? MailIcon : MessageSquareIcon}
					color="text-blue-600"
				/>
			{/each}
		</ThemeSpacer>
	</ThemeCard>

	<!-- 진행중인 기회 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold" style="color: var(--color-text);">진행중인 기회</h3>
			<ThemeButton variant="primary" size="sm" class="flex items-center gap-2">
				<PlusIcon size={16} />
				새 기회
			</ThemeButton>
		</div>
		
		<div class="space-y-4">
			{#each crmData.opportunities as opportunity}
				{@const customer = crmData.customers.find(c => c.id === opportunity.customerId)}
				<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
					<div class="flex-1">
						<h4 class="font-medium" style="color: var(--color-text);">{opportunity.title}</h4>
						<p class="text-sm" style="color: var(--color-text-secondary);">{customer?.name}</p>
						<div class="flex items-center gap-2 mt-2">
							<span class="text-sm font-medium" style="color: var(--color-primary);">
								{formatCurrency(opportunity.value)}
							</span>
							<ThemeBadge variant="info">{opportunity.probability}%</ThemeBadge>
							<ThemeBadge variant={opportunity.stage === 'proposal' ? 'warning' : 'success'}>
								{opportunity.stage === 'proposal' ? '제안' : '협상'}
							</ThemeBadge>
						</div>
					</div>
					<div class="text-right">
						<p class="text-xs" style="color: var(--color-text-secondary);">
							예상 마감: {formatDate(opportunity.expectedClose)}
						</p>
						<p class="text-xs" style="color: var(--color-text-secondary);">
							담당: {opportunity.owner}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</ThemeCard>
</PageLayout>

<!-- 고객 상세 모달 -->
{#if showCustomerModal && selectedCustomer}
	<ThemeModal
		title="고객 상세 정보"
		onClose={() => { showCustomerModal = false; selectedCustomer = null; }}
	>
		<div class="space-y-6">
			<!-- 기본 정보 -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">회사명</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.name}</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">고객 타입</label>
					<ThemeBadge variant={getTypeColor(selectedCustomer.type)}>
						{getTypeLabel(selectedCustomer.type)}
					</ThemeBadge>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">담당자</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.contact}</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">이메일</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.email}</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">전화번호</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.phone}</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">웹사이트</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.website}</p>
				</div>
			</div>

			<!-- 주소 -->
			<div>
				<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">주소</label>
				<p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.address}</p>
			</div>

			<!-- 비즈니스 정보 -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">업종</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.industry}</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">연매출</label>
					<p class="text-sm font-medium" style="color: var(--color-primary);">{formatCurrency(selectedCustomer.revenue)}</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">직원 수</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.employees}명</p>
				</div>
			</div>

			<!-- 태그 -->
			<div>
				<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">태그</label>
				<div class="flex items-center gap-2">
					{#each selectedCustomer.tags as tag}
						<ThemeBadge variant="info" size="sm">{tag}</ThemeBadge>
					{/each}
				</div>
			</div>

			<!-- 메모 -->
			<div>
				<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">메모</label>
				<p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.notes}</p>
			</div>

			<!-- 상호작용 기록 -->
			<div>
				<label class="block text-sm font-medium mb-2" style="color: var(--color-text);">최근 상호작용</label>
				<div class="space-y-2">
					{#each getCustomerInteractions(selectedCustomer.id) as interaction}
						<div class="p-3 rounded-lg" style="background: var(--color-surface-elevated);">
							<div class="flex items-center justify-between">
								<h5 class="font-medium text-sm" style="color: var(--color-text);">{interaction.subject}</h5>
								<span class="text-xs" style="color: var(--color-text-secondary);">{formatDate(interaction.date)}</span>
							</div>
							<p class="text-xs mt-1" style="color: var(--color-text-secondary);">{interaction.description}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</ThemeModal>
{/if}

<!-- 고객 생성 모달 -->
{#if showCreateModal}
	<ThemeModal
		title="새 고객 추가"
		onClose={() => showCreateModal = false}
	>
		<div class="space-y-4">
			<ThemeInput label="회사명" placeholder="회사명을 입력하세요" />
			<ThemeInput label="담당자명" placeholder="담당자명을 입력하세요" />
			<ThemeInput label="이메일" type="email" placeholder="이메일을 입력하세요" />
			<ThemeInput label="전화번호" placeholder="전화번호를 입력하세요" />
			<ThemeInput label="업종" placeholder="업종을 입력하세요" />
			<ThemeInput label="웹사이트" placeholder="웹사이트를 입력하세요" />
			<ThemeInput label="주소" placeholder="주소를 입력하세요" />
			<ThemeInput label="연매출" type="number" placeholder="연매출을 입력하세요" />
			<ThemeInput label="직원 수" type="number" placeholder="직원 수를 입력하세요" />
			<ThemeInput label="메모" placeholder="메모를 입력하세요" />
		</div>
		<div class="flex justify-end gap-2 mt-6">
			<ThemeButton variant="ghost" onclick={() => showCreateModal = false}>취소</ThemeButton>
			<ThemeButton variant="primary" onclick={() => showCreateModal = false}>저장</ThemeButton>
		</div>
	</ThemeModal>
{/if}