<script lang="ts">
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte';
	import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte';
	import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte';
	import CompanyModal from '$lib/components/ui/CompanyModal.svelte';
	import { 
		SettingsIcon,
		BuildingIcon,
		UserIcon,
		ShieldIcon,
		BellIcon,
		PaletteIcon,
		DatabaseIcon,
		GlobeIcon,
		PlusIcon,
		EditIcon,
		FileTextIcon
	} from 'lucide-svelte';

	// 회사 정보 관련 상태
	interface Company {
		id?: string;
		name: string;
		establishment_date?: string;
		ceo_name?: string;
		business_type?: string;
		address?: string;
		phone?: string;
		fax?: string;
		email?: string;
		website?: string;
		registration_number?: string;
		created_at?: string;
		updated_at?: string;
	}
	
	let company = $state<Company | null>(null);
	let companyLoading = $state(false);
	let showCompanyModal = $state(false);

	// 탭 설정
	const tabs = [
		{
			id: 'company',
			label: '회사 정보',
			icon: BuildingIcon
		},
		{
			id: 'profile',
			label: '프로필',
			icon: UserIcon
		},
		{
			id: 'security',
			label: '보안',
			icon: ShieldIcon
		},
		{
			id: 'notifications',
			label: '알림',
			icon: BellIcon
		},
		{
			id: 'appearance',
			label: '외관',
			icon: PaletteIcon
		},
		{
			id: 'data',
			label: '데이터',
			icon: DatabaseIcon
		}
	];

	let activeTab = $state('company');

	// 회사 정보 가져오기
	async function fetchCompany() {
		try {
			companyLoading = true;
			const response = await fetch('/api/company');
			if (response.ok) {
				const result = await response.json();
				company = result.data;
			}
		} catch (err) {
			console.error('Error fetching company:', err);
		} finally {
			companyLoading = false;
		}
	}

	// 회사 정보 저장 핸들러
	async function handleCompanySave(event: CustomEvent) {
		await fetchCompany();
	}

	onMount(() => {
		fetchCompany();
	});
</script>

<PageLayout title="설정">
	<ThemeSectionHeader
		title="설정"
	/>

	<div class="mb-6">
		<p class="text-sm" style="color: var(--color-text-secondary);">
			시스템 및 계정 설정을 관리합니다
		</p>
	</div>

	<ThemeTabs {tabs} bind:activeTab>
		{#snippet children(tab: any)}
			{#if tab.id === 'company'}
				<!-- 회사 정보 탭 -->
				<ThemeSpacer size={6}>
					<div class="space-y-6">
						<!-- 헤더 -->
						<div class="flex items-center justify-between">
							<div>
								<h2 class="text-2xl font-bold" style="color: var(--color-text);">회사 정보</h2>
								<p class="text-sm mt-1" style="color: var(--color-text-secondary);">
									회사의 기본 정보를 관리합니다.
								</p>
							</div>
							<ThemeButton
								onclick={() => showCompanyModal = true}
								variant="primary"
								size="md"
							>
								<PlusIcon class="w-4 h-4 mr-2" />
								{company ? '회사 정보 수정' : '회사 정보 등록'}
							</ThemeButton>
						</div>

						<!-- 회사 정보 카드 -->
						{#if companyLoading}
							<ThemeCard>
								<div class="flex items-center justify-center py-12">
									<div class="text-center">
										<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
										<p class="text-sm" style="color: var(--color-text-secondary);">회사 정보를 불러오는 중...</p>
									</div>
								</div>
							</ThemeCard>
						{:else if company}
							<ThemeCard>
								<div class="space-y-6">
									<!-- 기본 정보 -->
									<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<h3 class="text-lg font-semibold mb-4" style="color: var(--color-text);">기본 정보</h3>
											<div class="space-y-3">
												<div>
													<div class="text-sm font-medium" style="color: var(--color-text-secondary);">회사명</div>
													<p class="text-lg font-semibold" style="color: var(--color-text);">{company.name}</p>
												</div>
												<div>
													<div class="text-sm font-medium" style="color: var(--color-text-secondary);">대표이사</div>
													<p class="text-base" style="color: var(--color-text);">{company.ceo_name || '-'}</p>
												</div>
												<div>
													<div class="text-sm font-medium" style="color: var(--color-text-secondary);">설립일</div>
													<p class="text-base" style="color: var(--color-text);">
														{company.establishment_date ? new Date(company.establishment_date).toLocaleDateString('ko-KR') : '-'}
													</p>
												</div>
												<div>
													<div class="text-sm font-medium" style="color: var(--color-text-secondary);">업종</div>
													<p class="text-base" style="color: var(--color-text);">{company.business_type || '-'}</p>
												</div>
											</div>
										</div>

										<div>
											<h3 class="text-lg font-semibold mb-4" style="color: var(--color-text);">연락처 정보</h3>
											<div class="space-y-3">
												<div>
													<div class="text-sm font-medium" style="color: var(--color-text-secondary);">전화번호</div>
													<p class="text-base" style="color: var(--color-text);">{company.phone || '-'}</p>
												</div>
												<div>
													<div class="text-sm font-medium" style="color: var(--color-text-secondary);">팩스번호</div>
													<p class="text-base" style="color: var(--color-text);">{company.fax || '-'}</p>
												</div>
												<div>
													<div class="text-sm font-medium" style="color: var(--color-text-secondary);">이메일</div>
													<p class="text-base" style="color: var(--color-text);">{company.email || '-'}</p>
												</div>
												<div>
													<div class="text-sm font-medium" style="color: var(--color-text-secondary);">웹사이트</div>
													<p class="text-base" style="color: var(--color-text);">{company.website || '-'}</p>
												</div>
											</div>
										</div>
									</div>

									<!-- 주소 정보 -->
									<div>
										<h3 class="text-lg font-semibold mb-4" style="color: var(--color-text);">주소 정보</h3>
										<div>
											<div class="text-sm font-medium" style="color: var(--color-text-secondary);">주소</div>
											<p class="text-base" style="color: var(--color-text);">{company.address || '-'}</p>
										</div>
									</div>

									<!-- 사업자 정보 -->
									{#if company.registration_number}
									<div>
										<h3 class="text-lg font-semibold mb-4" style="color: var(--color-text);">사업자 정보</h3>
										<div>
											<div class="text-sm font-medium" style="color: var(--color-text-secondary);">사업자등록번호</div>
											<p class="text-base" style="color: var(--color-text);">{company.registration_number}</p>
										</div>
									</div>
									{/if}
								</div>
							</ThemeCard>
						{:else}
							<ThemeCard>
								<div class="text-center py-12">
									<FileTextIcon class="w-16 h-16 mx-auto mb-4" style="color: var(--color-text-secondary);" />
									<h3 class="text-lg font-semibold mb-2" style="color: var(--color-text);">등록된 회사 정보가 없습니다</h3>
									<p class="text-sm mb-6" style="color: var(--color-text-secondary);">
										회사 정보를 등록하여 조직 관리를 시작하세요.
									</p>
									<ThemeButton
										onclick={() => showCompanyModal = true}
										variant="primary"
										size="md"
									>
										<PlusIcon class="w-4 h-4 mr-2" />
										회사 정보 등록
									</ThemeButton>
								</div>
							</ThemeCard>
						{/if}
					</div>
				</ThemeSpacer>
			{:else if tab.id === 'profile'}
				<!-- 프로필 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard>
						<div class="text-center py-12">
							<UserIcon class="w-16 h-16 mx-auto mb-4" style="color: var(--color-text-secondary);" />
							<h3 class="text-lg font-semibold mb-2" style="color: var(--color-text);">프로필 설정</h3>
							<p class="text-sm" style="color: var(--color-text-secondary);">개인 프로필 설정 기능이 곧 추가될 예정입니다.</p>
						</div>
					</ThemeCard>
				</ThemeSpacer>
			{:else if tab.id === 'security'}
				<!-- 보안 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard>
						<div class="text-center py-12">
							<ShieldIcon class="w-16 h-16 mx-auto mb-4" style="color: var(--color-text-secondary);" />
							<h3 class="text-lg font-semibold mb-2" style="color: var(--color-text);">보안 설정</h3>
							<p class="text-sm" style="color: var(--color-text-secondary);">보안 설정 기능이 곧 추가될 예정입니다.</p>
						</div>
					</ThemeCard>
				</ThemeSpacer>
			{:else if tab.id === 'notifications'}
				<!-- 알림 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard>
						<div class="text-center py-12">
							<BellIcon class="w-16 h-16 mx-auto mb-4" style="color: var(--color-text-secondary);" />
							<h3 class="text-lg font-semibold mb-2" style="color: var(--color-text);">알림 설정</h3>
							<p class="text-sm" style="color: var(--color-text-secondary);">알림 설정 기능이 곧 추가될 예정입니다.</p>
						</div>
					</ThemeCard>
				</ThemeSpacer>
			{:else if tab.id === 'appearance'}
				<!-- 외관 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard>
						<div class="text-center py-12">
							<PaletteIcon class="w-16 h-16 mx-auto mb-4" style="color: var(--color-text-secondary);" />
							<h3 class="text-lg font-semibold mb-2" style="color: var(--color-text);">외관 설정</h3>
							<p class="text-sm" style="color: var(--color-text-secondary);">외관 설정 기능이 곧 추가될 예정입니다.</p>
						</div>
					</ThemeCard>
				</ThemeSpacer>
			{:else if tab.id === 'data'}
				<!-- 데이터 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard>
						<div class="text-center py-12">
							<DatabaseIcon class="w-16 h-16 mx-auto mb-4" style="color: var(--color-text-secondary);" />
							<h3 class="text-lg font-semibold mb-2" style="color: var(--color-text);">데이터 관리</h3>
							<p class="text-sm" style="color: var(--color-text-secondary);">데이터 관리 기능이 곧 추가될 예정입니다.</p>
						</div>
					</ThemeCard>
				</ThemeSpacer>
			{/if}
		{/snippet}
	</ThemeTabs>

	<!-- 회사 정보 모달 -->
	<CompanyModal
		open={showCompanyModal}
		company={company}
		loading={companyLoading}
		onclose={() => {
			showCompanyModal = false;
		}}
		onsave={handleCompanySave}
	/>
</PageLayout>
