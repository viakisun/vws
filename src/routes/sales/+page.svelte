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
		TrendingUpIcon, 
		UsersIcon, 
		DollarSignIcon, 
		TargetIcon,
		PlusIcon,
		EyeIcon,
		EditIcon,
		TrashIcon,
		PhoneIcon,
		MailIcon,
		CalendarIcon,
		BuildingIcon,
		SearchIcon,
		FilterIcon
	} from 'lucide-svelte';

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
			},
			{
				id: 'lead-3',
				company: 'DEF 스타트업',
				contact: '이지은',
				position: 'CEO',
				email: 'lee@defstartup.com',
				phone: '010-5555-1234',
				industry: '핀테크',
				status: 'negotiation',
				value: 15000000,
				probability: 80,
				source: '이벤트',
				createdAt: '2024-01-08',
				lastContact: '2024-01-19',
				notes: '가격 협상 중, 빠른 결정 예상'
			}
		],
		opportunities: [
			{
				id: 'opp-1',
				title: 'ABC 테크놀로지 AI 솔루션',
				company: 'ABC 테크놀로지',
				value: 50000000,
				stage: 'proposal',
				probability: 70,
				expectedClose: '2024-02-15',
				owner: '김영희',
				createdAt: '2024-01-15'
			},
			{
				id: 'opp-2',
				title: 'XYZ 제조 스마트팩토리',
				company: 'XYZ 제조',
				value: 30000000,
				stage: 'negotiation',
				probability: 50,
				expectedClose: '2024-02-28',
				owner: '박민수',
				createdAt: '2024-01-10'
			}
		],
		deals: [
			{
				id: 'deal-1',
				title: 'DEF 스타트업 핀테크 솔루션',
				company: 'DEF 스타트업',
				value: 15000000,
				stage: 'closed-won',
				closedDate: '2024-01-20',
				owner: '이지은'
			}
		]
	});

	let selectedLead = $state(null);
	let showLeadModal = $state(false);
	let showCreateModal = $state(false);
	let searchTerm = $state('');
	let selectedStatus = $state('all');

	// 통계 데이터
	const stats = [
		{
			title: '총 리드 수',
			value: salesData.leads.length,
			change: '+12%',
			changeType: 'positive' as const,
			icon: UsersIcon
		},
		{
			title: '진행중인 기회',
			value: salesData.opportunities.length,
			change: '+3',
			changeType: 'positive' as const,
			icon: TargetIcon
		},
		{
			title: '예상 매출',
			value: formatCurrency(salesData.opportunities.reduce((sum, opp) => sum + opp.value, 0)),
			change: '+25%',
			changeType: 'positive' as const,
			icon: DollarSignIcon
		},
		{
			title: '성공률',
			value: '68%',
			change: '+5%',
			changeType: 'positive' as const,
			icon: TrendingUpIcon
		}
	];

	// 액션 버튼들
	const actions = [
		{
			label: '리드 추가',
			icon: PlusIcon,
			onclick: () => showCreateModal = true,
			variant: 'primary' as const
		},
		{
			label: '기회 생성',
			icon: TargetIcon,
			onclick: () => console.log('Create opportunity'),
			variant: 'success' as const
		}
	];

	// 필터링된 리드 데이터
	let filteredLeads = $derived(() => {
		let leads = salesData.leads;
		
		if (searchTerm) {
			leads = leads.filter(lead => 
				lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
				lead.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
				lead.industry.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}
		
		if (selectedStatus !== 'all') {
			leads = leads.filter(lead => lead.status === selectedStatus);
		}
		
		return leads;
	});

	// 상태별 색상 매핑
	const getStatusColor = (status: string) => {
		const colors = {
			'new': 'info',
			'qualified': 'primary',
			'proposal': 'warning',
			'negotiation': 'success',
			'closed-won': 'success',
			'closed-lost': 'error'
		};
		return colors[status] || 'default';
	};

	// 상태별 한글 라벨
	const getStatusLabel = (status: string) => {
		const labels = {
			'new': '신규',
			'qualified': '검증됨',
			'proposal': '제안',
			'negotiation': '협상',
			'closed-won': '성공',
			'closed-lost': '실패'
		};
		return labels[status] || status;
	};

	// 리드 상세 보기
	function viewLead(lead: any) {
		selectedLead = lead;
		showLeadModal = true;
	}

	// 리드 삭제
	function deleteLead(leadId: string) {
		salesData.leads = salesData.leads.filter(lead => lead.id !== leadId);
	}

	onMount(() => {
		console.log('Sales 페이지 로드됨');
	});
</script>

<PageLayout
	title="영업관리"
	subtitle="리드 관리, 기회 추적, 매출 분석"
	{stats}
	{actions}
	searchPlaceholder="회사명, 담당자, 업종으로 검색..."
>
	<!-- 리드 목록 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold" style="color: var(--color-text);">리드 목록</h3>
			<div class="flex items-center gap-2">
				<ThemeDropdown
					options={[
						{ value: 'all', label: '전체' },
						{ value: 'new', label: '신규' },
						{ value: 'qualified', label: '검증됨' },
						{ value: 'proposal', label: '제안' },
						{ value: 'negotiation', label: '협상' }
					]}
					bind:value={selectedStatus}
					placeholder="상태 필터"
				/>
			</div>
		</div>
		
		<div class="space-y-4">
			{#each filteredLeads as lead}
				<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<BuildingIcon size={20} style="color: var(--color-primary);" />
							<h4 class="font-medium" style="color: var(--color-text);">{lead.company}</h4>
							<ThemeBadge variant={getStatusColor(lead.status)}>
								{getStatusLabel(lead.status)}
							</ThemeBadge>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" style="color: var(--color-text-secondary);">
							<div class="flex items-center gap-2">
								<UsersIcon size={16} />
								{lead.contact} ({lead.position})
							</div>
							<div class="flex items-center gap-2">
								<DollarSignIcon size={16} />
								{formatCurrency(lead.value)} ({lead.probability}%)
							</div>
							<div class="flex items-center gap-2">
								<CalendarIcon size={16} />
								{formatDate(lead.lastContact)}
							</div>
						</div>
						{#if lead.notes}
							<p class="text-sm mt-2" style="color: var(--color-text-secondary);">{lead.notes}</p>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<ThemeButton variant="ghost" size="sm" onclick={() => viewLead(lead)}>
							<EyeIcon size={16} />
						</ThemeButton>
						<ThemeButton variant="ghost" size="sm">
							<EditIcon size={16} />
						</ThemeButton>
						<ThemeButton variant="ghost" size="sm" onclick={() => deleteLead(lead.id)}>
							<TrashIcon size={16} />
						</ThemeButton>
					</div>
				</div>
			{/each}
		</div>
	</ThemeCard>

	<!-- 기회 현황 -->
	<ThemeGrid cols={1} lgCols={2} gap={6}>
		<!-- 진행중인 기회 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="진행중인 기회" />
			<ThemeSpacer size={4}>
				{#each salesData.opportunities as opportunity}
					<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--color-surface-elevated);">
						<div class="flex-1">
							<h4 class="font-medium" style="color: var(--color-text);">{opportunity.title}</h4>
							<p class="text-sm" style="color: var(--color-text-secondary);">{opportunity.company}</p>
							<div class="flex items-center gap-2 mt-1">
								<span class="text-sm font-medium" style="color: var(--color-primary);">
									{formatCurrency(opportunity.value)}
								</span>
								<ThemeBadge variant="info">{opportunity.probability}%</ThemeBadge>
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
			</ThemeSpacer>
		</ThemeCard>

		<!-- 최근 성사된 거래 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="최근 성사된 거래" />
			<ThemeSpacer size={4}>
				{#each salesData.deals as deal}
					<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--color-surface-elevated);">
						<div class="flex-1">
							<h4 class="font-medium" style="color: var(--color-text);">{deal.title}</h4>
							<p class="text-sm" style="color: var(--color-text-secondary);">{deal.company}</p>
							<div class="flex items-center gap-2 mt-1">
								<span class="text-sm font-medium" style="color: var(--color-success);">
									{formatCurrency(deal.value)}
								</span>
								<ThemeBadge variant="success">성사</ThemeBadge>
							</div>
						</div>
						<div class="text-right">
							<p class="text-xs" style="color: var(--color-text-secondary);">
								성사일: {formatDate(deal.closedDate)}
							</p>
							<p class="text-xs" style="color: var(--color-text-secondary);">
								담당: {deal.owner}
							</p>
						</div>
					</div>
				{/each}
			</ThemeSpacer>
		</ThemeCard>
	</ThemeGrid>

	<!-- 매출 분석 차트 -->
	<ThemeGrid cols={1} lgCols={2} gap={6}>
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="월별 매출 추이" />
			<ThemeChartPlaceholder
				title="매출 분석"
				description="최근 12개월간 매출 현황"
				icon={TrendingUpIcon}
			/>
		</ThemeCard>

		<ThemeCard class="p-6">
			<ThemeSectionHeader title="업종별 매출 분포" />
			<ThemeChartPlaceholder
				title="업종별 분석"
				description="업종별 매출 비중"
				icon={TargetIcon}
			/>
		</ThemeCard>
	</ThemeGrid>
</PageLayout>

<!-- 리드 상세 모달 -->
{#if showLeadModal && selectedLead}
	<ThemeModal
		title="리드 상세 정보"
		onClose={() => { showLeadModal = false; selectedLead = null; }}
	>
		<div class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">회사명</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedLead.company}</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">담당자</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedLead.contact} ({selectedLead.position})</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">이메일</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedLead.email}</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">전화번호</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedLead.phone}</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">업종</label>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedLead.industry}</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">예상 매출</label>
					<p class="text-sm font-medium" style="color: var(--color-primary);">{formatCurrency(selectedLead.value)}</p>
				</div>
			</div>
			<div>
				<label class="block text-sm font-medium mb-1" style="color: var(--color-text);">메모</label>
				<p class="text-sm" style="color: var(--color-text-secondary);">{selectedLead.notes}</p>
			</div>
		</div>
	</ThemeModal>
{/if}

<!-- 리드 생성 모달 -->
{#if showCreateModal}
	<ThemeModal
		title="새 리드 추가"
		onClose={() => showCreateModal = false}
	>
		<div class="space-y-4">
			<ThemeInput label="회사명" placeholder="회사명을 입력하세요" />
			<ThemeInput label="담당자명" placeholder="담당자명을 입력하세요" />
			<ThemeInput label="직책" placeholder="직책을 입력하세요" />
			<ThemeInput label="이메일" type="email" placeholder="이메일을 입력하세요" />
			<ThemeInput label="전화번호" placeholder="전화번호를 입력하세요" />
			<ThemeInput label="업종" placeholder="업종을 입력하세요" />
			<ThemeInput label="예상 매출" type="number" placeholder="예상 매출을 입력하세요" />
			<ThemeInput label="메모" placeholder="메모를 입력하세요" />
		</div>
		<div class="flex justify-end gap-2 mt-6">
			<ThemeButton variant="ghost" onclick={() => showCreateModal = false}>취소</ThemeButton>
			<ThemeButton variant="primary" onclick={() => showCreateModal = false}>저장</ThemeButton>
		</div>
	</ThemeModal>
{/if}