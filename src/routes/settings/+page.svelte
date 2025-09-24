<script lang="ts">
  import { logger } from "$lib/utils/logger";

  import PageLayout from "$lib/components/layout/PageLayout.svelte";
  import CompanyModal from "$lib/components/ui/CompanyModal.svelte";
  import ThemeButton from "$lib/components/ui/ThemeButton.svelte";
  import ThemeCard from "$lib/components/ui/ThemeCard.svelte";
  import ThemeSectionHeader from "$lib/components/ui/ThemeSectionHeader.svelte";
  import ThemeSpacer from "$lib/components/ui/ThemeSpacer.svelte";
  import ThemeTabs from "$lib/components/ui/ThemeTabs.svelte";
  import {
    availableTimezones,
    currentTimezone,
    setUserTimezone,
    userTimezone,
  } from "$lib/stores/timezone";
  import {
    BellIcon,
    BuildingIcon,
    ClockIcon,
    DatabaseIcon,
    FileTextIcon,
    PaletteIcon,
    PlusIcon,
    ShieldIcon,
    UserIcon,
  } from "@lucide/svelte";
  import { onMount } from "svelte";

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
      id: "company",
      label: "회사 정보",
      icon: BuildingIcon,
    },
    {
      id: "profile",
      label: "프로필",
      icon: UserIcon,
    },
    {
      id: "timezone",
      label: "시간 설정",
      icon: ClockIcon,
    },
    {
      id: "security",
      label: "보안",
      icon: ShieldIcon,
    },
    {
      id: "notifications",
      label: "알림",
      icon: BellIcon,
    },
    {
      id: "appearance",
      label: "외관",
      icon: PaletteIcon,
    },
    {
      id: "data",
      label: "데이터",
      icon: DatabaseIcon,
    },
  ];

  let activeTab = $state("company");

  // 회사 정보 가져오기
  async function fetchCompany() {
    try {
      companyLoading = true;
      const response = await window.fetch("/api/company");
      if (response.ok) {
        const result = await response.json();
        company = result.data;
      }
    } catch (err) {
      logger.error("Error fetching company:", err);
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
  <ThemeSectionHeader title="설정" />

  <div class="mb-6">
    <p class="text-sm" style:color="var(--color-text-secondary)">
      시스템 및 계정 설정을 관리합니다
    </p>
  </div>

  <ThemeTabs {tabs} bind:activeTab>
    {#snippet children(tab: { id: string; label: string })}
      {#if tab.id === "company"}
        <!-- 회사 정보 탭 -->
        <ThemeSpacer size={6}>
          <div class="space-y-6">
            <!-- 헤더 -->
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold" style:color="var(--color-text)">
                  회사 정보
                </h2>
                <p
                  class="text-sm mt-1"
                  style:color="var(--color-text-secondary)"
                >
                  회사의 기본 정보를 관리합니다.
                </p>
              </div>
              <ThemeButton
                onclick={() => (showCompanyModal = true)}
                variant="primary"
                size="md"
              >
                <PlusIcon class="w-4 h-4 mr-2" />
                {company ? "회사 정보 수정" : "회사 정보 등록"}
              </ThemeButton>
            </div>

            <!-- 회사 정보 카드 -->
            {#if companyLoading}
              <ThemeCard>
                <div class="flex items-center justify-center py-12">
                  <div class="text-center">
                    <div
                      class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"
                    ></div>
                    <p
                      class="text-sm"
                      style:color="var(--color-text-secondary)"
                    >
                      회사 정보를 불러오는 중...
                    </p>
                  </div>
                </div>
              </ThemeCard>
            {:else if company}
              <ThemeCard>
                <div class="space-y-6">
                  <!-- 기본 정보 -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3
                        class="text-lg font-semibold mb-4"
                        style:color="var(--color-text)"
                      >
                        기본 정보
                      </h3>
                      <div class="space-y-3">
                        <div>
                          <div
                            class="text-sm font-medium"
                            style:color="var(--color-text-secondary)"
                          >
                            회사명
                          </div>
                          <p
                            class="text-lg font-semibold"
                            style:color="var(--color-text)"
                          >
                            {company.name}
                          </p>
                        </div>
                        <div>
                          <div
                            class="text-sm font-medium"
                            style:color="var(--color-text-secondary)"
                          >
                            대표이사
                          </div>
                          <p class="text-base" style:color="var(--color-text)">
                            {company.ceo_name || "-"}
                          </p>
                        </div>
                        <div>
                          <div
                            class="text-sm font-medium"
                            style:color="var(--color-text-secondary)"
                          >
                            설립일
                          </div>
                          <p class="text-base" style:color="var(--color-text)">
                            {company.establishment_date
                              ? new Date(
                                  company.establishment_date,
                                ).toLocaleDateString("ko-KR")
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <div
                            class="text-sm font-medium"
                            style:color="var(--color-text-secondary)"
                          >
                            업종
                          </div>
                          <p class="text-base" style:color="var(--color-text)">
                            {company.business_type || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3
                        class="text-lg font-semibold mb-4"
                        style:color="var(--color-text)"
                      >
                        연락처 정보
                      </h3>
                      <div class="space-y-3">
                        <div>
                          <div
                            class="text-sm font-medium"
                            style:color="var(--color-text-secondary)"
                          >
                            전화번호
                          </div>
                          <p class="text-base" style:color="var(--color-text)">
                            {company.phone || "-"}
                          </p>
                        </div>
                        <div>
                          <div
                            class="text-sm font-medium"
                            style:color="var(--color-text-secondary)"
                          >
                            팩스번호
                          </div>
                          <p class="text-base" style:color="var(--color-text)">
                            {company.fax || "-"}
                          </p>
                        </div>
                        <div>
                          <div
                            class="text-sm font-medium"
                            style:color="var(--color-text-secondary)"
                          >
                            이메일
                          </div>
                          <p class="text-base" style:color="var(--color-text)">
                            {company.email || "-"}
                          </p>
                        </div>
                        <div>
                          <div
                            class="text-sm font-medium"
                            style:color="var(--color-text-secondary)"
                          >
                            웹사이트
                          </div>
                          <p class="text-base" style:color="var(--color-text)">
                            {company.website || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 주소 정보 -->
                  <div>
                    <h3
                      class="text-lg font-semibold mb-4"
                      style:color="var(--color-text)"
                    >
                      주소 정보
                    </h3>
                    <div>
                      <div
                        class="text-sm font-medium"
                        style:color="var(--color-text-secondary)"
                      >
                        주소
                      </div>
                      <p class="text-base" style:color="var(--color-text)">
                        {company.address || "-"}
                      </p>
                    </div>
                  </div>

                  <!-- 사업자 정보 -->
                  {#if company.registration_number}
                    <div>
                      <h3
                        class="text-lg font-semibold mb-4"
                        style:color="var(--color-text)"
                      >
                        사업자 정보
                      </h3>
                      <div>
                        <div
                          class="text-sm font-medium"
                          style:color="var(--color-text-secondary)"
                        >
                          사업자등록번호
                        </div>
                        <p class="text-base" style:color="var(--color-text)">
                          {company.registration_number}
                        </p>
                      </div>
                    </div>
                  {/if}
                </div>
              </ThemeCard>
            {:else}
              <ThemeCard>
                <div class="text-center py-12">
                  <FileTextIcon
                    class="w-16 h-16 mx-auto mb-4"
                    style="color: var(--color-text-secondary);"
                  />
                  <h3
                    class="text-lg font-semibold mb-2"
                    style:color="var(--color-text)"
                  >
                    등록된 회사 정보가 없습니다
                  </h3>
                  <p
                    class="text-sm mb-6"
                    style:color="var(--color-text-secondary)"
                  >
                    회사 정보를 등록하여 조직 관리를 시작하세요.
                  </p>
                  <ThemeButton
                    onclick={() => (showCompanyModal = true)}
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
      {:else if tab.id === "profile"}
        <!-- 프로필 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard>
            <div class="text-center py-12">
              <UserIcon
                class="w-16 h-16 mx-auto mb-4"
                style="color: var(--color-text-secondary);"
              />
              <h3
                class="text-lg font-semibold mb-2"
                style:color="var(--color-text)"
              >
                프로필 설정
              </h3>
              <p class="text-sm" style:color="var(--color-text-secondary)">
                개인 프로필 설정 기능이 곧 추가될 예정입니다.
              </p>
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === "timezone"}
        <!-- 시간 설정 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard>
            <ThemeSectionHeader title="시간대 설정" />

            <div class="space-y-6">
              <!-- 현재 시간 표시 -->
              <div
                class="p-4 rounded-lg"
                style:background-color="var(--color-surface-secondary)"
              >
                <h4 class="font-medium mb-2" style:color="var(--color-text)">
                  현재 시간
                </h4>
                <div
                  class="text-2xl font-mono"
                  style:color="var(--color-text-accent)"
                >
                  {$currentTimezone.displayName}
                </div>
                <div
                  class="text-sm mt-1"
                  style:color="var(--color-text-secondary)"
                >
                  현재 시간: {new Date().toLocaleString("ko-KR", {
                    timeZone: $currentTimezone.timezoneString,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZoneName: "short",
                  })}
                </div>
              </div>

              <!-- 타임존 선택 -->
              <div>
                <label
                  for="timezone-select"
                  class="block text-sm font-medium mb-2"
                  style:color="var(--color-text)"
                >
                  시간대 선택
                </label>
                <select
                  id="timezone-select"
                  bind:value={$userTimezone}
                  onchange={(e: Event & { currentTarget: HTMLSelectElement }) =>
                    setUserTimezone(e.currentTarget.value)}
                  class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style:background-color="var(--color-surface)"
                  style:color="var(--color-text)"
                  style:border-color="var(--color-border)"
                >
                  {#each availableTimezones as tz, i (i)}
                    <option value={tz.key}>{tz.displayName}</option>
                  {/each}
                </select>
                <p
                  class="text-xs mt-1"
                  style:color="var(--color-text-secondary)"
                >
                  시간대를 변경하면 모든 날짜와 시간이 새로운 시간대에 맞게
                  표시됩니다.
                </p>
              </div>

              <!-- 지원되는 타임존 목록 -->
              <div>
                <h4 class="font-medium mb-3" style:color="var(--color-text)">
                  지원되는 시간대
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {#each availableTimezones as tz, i (i)}
                    <button
                      type="button"
                      class="p-3 rounded-lg border cursor-pointer transition-colors text-left w-full"
                      class:bg-blue-50={$userTimezone === tz.key}
                      class:border-blue-300={$userTimezone === tz.key}
                      class:bg-gray-50={$userTimezone !== tz.key}
                      class:border-gray-200={$userTimezone !== tz.key}
                      onclick={() => setUserTimezone(tz.key)}
                    >
                      <div
                        class="font-medium text-sm"
                        style:color="var(--color-text)"
                      >
                        {tz.displayName}
                      </div>
                      <div
                        class="text-xs mt-1"
                        style:color="var(--color-text-secondary)"
                      >
                        {tz.value}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>

              <!-- 시간대 정보 -->
              <div
                class="p-4 rounded-lg"
                style:background-color="var(--color-surface-secondary)"
              >
                <h4 class="font-medium mb-2" style:color="var(--color-text)">
                  시간대 정보
                </h4>
                <div
                  class="text-sm space-y-1"
                  style:color="var(--color-text-secondary)"
                >
                  <p>• 모든 데이터는 UTC 기준으로 저장됩니다</p>
                  <p>• 선택한 시간대에 따라 날짜와 시간이 표시됩니다</p>
                  <p>• 프로젝트 생성 및 수정 시 선택한 시간대가 적용됩니다</p>
                  <p>
                    • 설정은 브라우저에 저장되며 다른 기기와 동기화되지 않습니다
                  </p>
                </div>
              </div>
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === "security"}
        <!-- 보안 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard>
            <div class="text-center py-12">
              <ShieldIcon
                class="w-16 h-16 mx-auto mb-4"
                style="color: var(--color-text-secondary);"
              />
              <h3
                class="text-lg font-semibold mb-2"
                style:color="var(--color-text)"
              >
                보안 설정
              </h3>
              <p class="text-sm" style:color="var(--color-text-secondary)">
                보안 설정 기능이 곧 추가될 예정입니다.
              </p>
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === "notifications"}
        <!-- 알림 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard>
            <div class="text-center py-12">
              <BellIcon
                class="w-16 h-16 mx-auto mb-4"
                style="color: var(--color-text-secondary);"
              />
              <h3
                class="text-lg font-semibold mb-2"
                style:color="var(--color-text)"
              >
                알림 설정
              </h3>
              <p class="text-sm" style:color="var(--color-text-secondary)">
                알림 설정 기능이 곧 추가될 예정입니다.
              </p>
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === "appearance"}
        <!-- 외관 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard>
            <div class="text-center py-12">
              <PaletteIcon
                class="w-16 h-16 mx-auto mb-4"
                style="color: var(--color-text-secondary);"
              />
              <h3
                class="text-lg font-semibold mb-2"
                style:color="var(--color-text)"
              >
                외관 설정
              </h3>
              <p class="text-sm" style:color="var(--color-text-secondary)">
                외관 설정 기능이 곧 추가될 예정입니다.
              </p>
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === "data"}
        <!-- 데이터 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard>
            <div class="text-center py-12">
              <DatabaseIcon
                class="w-16 h-16 mx-auto mb-4"
                style="color: var(--color-text-secondary);"
              />
              <h3
                class="text-lg font-semibold mb-2"
                style:color="var(--color-text)"
              >
                데이터 관리
              </h3>
              <p class="text-sm" style:color="var(--color-text-secondary)">
                데이터 관리 기능이 곧 추가될 예정입니다.
              </p>
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {/if}
    {/snippet}
  </ThemeTabs>

  <!-- 회사 정보 모달 -->
  <CompanyModal
    open={showCompanyModal}
    {company}
    loading={companyLoading}
    onclose={() => {
      showCompanyModal = false;
    }}
    onsave={handleCompanySave}
  />
</PageLayout>
