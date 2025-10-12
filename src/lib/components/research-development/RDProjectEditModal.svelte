<script lang="ts">
  import ThemeButton from '../ui/ThemeButton.svelte'
  import ThemeEmployeeDropdown from '../ui/ThemeEmployeeDropdown.svelte'
  import ThemeModal from '../ui/ThemeModal.svelte'
  import {
    RDProjectPriority,
    RDProjectStatus,
    RDResearchType,
    RDSponsorType,
  } from './types/rd-project.types'
  import {
    getRDPriorityText,
    getRDResearchTypeText,
    getRDSponsorTypeText,
    getRDStatusText,
  } from './utils/rd-status-utils'

  interface ProjectForm {
    title: string // 사업명
    code: string // 과제 코드
    projectTaskName: string // 과제명
    sponsor: string // 주관기관
    managerEmployeeId: string // 과제책임자
    description: string
    status: string
    priority: string
    sponsorType: string
    researchType: string
    // 선택 필드 - 주관기관 담당자 정보
    sponsorContactName?: string // 주관기관 담당자 이름
    sponsorContactPhone?: string // 주관기관 담당자 전화번호
    sponsorContactEmail?: string // 주관기관 담당자 이메일
    // 선택 필드 - 전담기관 정보
    dedicatedAgency?: string // 전담기관
    dedicatedAgencyContactName?: string // 전담기관 담당자 이름
    dedicatedAgencyContactPhone?: string // 전담기관 담당자 전화번호
    dedicatedAgencyContactEmail?: string // 전담기관 담당자 이메일
  }

  interface Props {
    visible: boolean
    projectForm: ProjectForm
    isUpdating: boolean
    onclose: () => void
    onupdate: () => void
  }

  let {
    visible = $bindable(),
    projectForm = $bindable(),
    isUpdating,
    onclose,
    onupdate,
  }: Props = $props()
</script>

{#if visible}
  <ThemeModal open={visible} {onclose}>
    <div class="p-6 max-h-[80vh] overflow-y-auto">
      <h3 class="text-lg font-medium text-gray-900 mb-4">연구개발사업 수정</h3>

      <div class="space-y-4">
        <!-- 사업명 -->
        <div>
          <label for="edit-project-title" class="block text-sm font-medium text-gray-700 mb-1">
            사업명 *
          </label>
          <input
            id="edit-project-title"
            type="text"
            bind:value={projectForm.title}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="사업명을 입력하세요"
            required
          />
        </div>

        <!-- 과제명 -->
        <div>
          <label for="edit-project-task-name" class="block text-sm font-medium text-gray-700 mb-1">
            과제명 *
          </label>
          <input
            id="edit-project-task-name"
            type="text"
            bind:value={projectForm.projectTaskName}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="과제명을 입력하세요"
            required
          />
        </div>

        <!-- 과제 코드 -->
        <div>
          <label for="edit-project-code" class="block text-sm font-medium text-gray-700 mb-1">
            과제 코드 *
          </label>
          <input
            id="edit-project-code"
            type="text"
            bind:value={projectForm.code}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="과제 코드를 입력하세요"
            required
          />
        </div>

        <!-- 주관기관 -->
        <div>
          <label for="edit-project-sponsor" class="block text-sm font-medium text-gray-700 mb-1">
            주관기관 *
          </label>
          <input
            id="edit-project-sponsor"
            type="text"
            bind:value={projectForm.sponsor}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="주관기관을 입력하세요 (예: (주)하다)"
            required
          />
        </div>

        <!-- 주관기관 담당자 정보 (선택) -->
        <div class="grid grid-cols-1 gap-4 pl-4 border-l-2 border-gray-200">
          <div>
            <label
              for="edit-sponsor-contact-name"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              주관기관 담당자
            </label>
            <input
              id="edit-sponsor-contact-name"
              type="text"
              bind:value={projectForm.sponsorContactName}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="담당자 이름"
            />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="edit-sponsor-contact-phone"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                전화번호
              </label>
              <input
                id="edit-sponsor-contact-phone"
                type="tel"
                bind:value={projectForm.sponsorContactPhone}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="010-0000-0000"
              />
            </div>
            <div>
              <label
                for="edit-sponsor-contact-email"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                이메일
              </label>
              <input
                id="edit-sponsor-contact-email"
                type="email"
                bind:value={projectForm.sponsorContactEmail}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@company.com"
              />
            </div>
          </div>
        </div>

        <!-- 과제책임자 -->
        <div>
          <label for="edit-project-manager" class="block text-sm font-medium text-gray-700 mb-1">
            과제책임자 *
          </label>
          <ThemeEmployeeDropdown
            id="edit-project-manager"
            bind:value={projectForm.managerEmployeeId}
            required
            placeholder="과제책임자를 선택하세요"
            showDepartment={true}
            showPosition={true}
          />
        </div>

        <!-- 사업 개요 -->
        <div>
          <label
            for="edit-project-description"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            사업 개요
            <span class="text-xs text-gray-500 font-normal ml-2">(마크다운 지원)</span>
          </label>
          <textarea
            id="edit-project-description"
            bind:value={projectForm.description}
            rows="8"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            placeholder="마크다운 형식으로 입력 가능합니다.

예시:
## 제목
- 리스트 항목
- **굵게**, *기울임*
* 표, 코드블록 등도 지원됩니다

줄바꿈은 Enter 한 번으로 반영됩니다."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            💡 마크다운 문법 지원 | 줄바꿈은 Enter 한 번으로 반영됩니다.
          </p>
        </div>

        <!-- 상태 및 우선순위 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="edit-project-status" class="block text-sm font-medium text-gray-700 mb-1">
              상태 *
            </label>
            <select
              id="edit-project-status"
              bind:value={projectForm.status}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={RDProjectStatus.PLANNING}>{getRDStatusText(RDProjectStatus.PLANNING)}</option>
              <option value={RDProjectStatus.ACTIVE}>{getRDStatusText(RDProjectStatus.ACTIVE)}</option>
              <option value={RDProjectStatus.COMPLETED}>{getRDStatusText(RDProjectStatus.COMPLETED)}</option>
              <option value={RDProjectStatus.CANCELLED}>{getRDStatusText(RDProjectStatus.CANCELLED)}</option>
              <option value={RDProjectStatus.SUSPENDED}>{getRDStatusText(RDProjectStatus.SUSPENDED)}</option>
            </select>
          </div>
          <div>
            <label for="edit-project-priority" class="block text-sm font-medium text-gray-700 mb-1">
              우선순위 *
            </label>
            <select
              id="edit-project-priority"
              bind:value={projectForm.priority}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={RDProjectPriority.LOW}>{getRDPriorityText(RDProjectPriority.LOW)}</option>
              <option value={RDProjectPriority.MEDIUM}>{getRDPriorityText(RDProjectPriority.MEDIUM)}</option>
              <option value={RDProjectPriority.HIGH}>{getRDPriorityText(RDProjectPriority.HIGH)}</option>
              <option value={RDProjectPriority.CRITICAL}>{getRDPriorityText(RDProjectPriority.CRITICAL)}</option>
            </select>
          </div>
        </div>

        <!-- 후원기관 유형 및 연구유형 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              for="edit-project-sponsor-type"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              후원기관 유형 *
            </label>
            <select
              id="edit-project-sponsor-type"
              bind:value={projectForm.sponsorType}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={RDSponsorType.GOVERNMENT_RND}>{getRDSponsorTypeText(RDSponsorType.GOVERNMENT_RND)}</option>
              <option value={RDSponsorType.LOCAL_GOV_RND}>{getRDSponsorTypeText(RDSponsorType.LOCAL_GOV_RND)}</option>
              <option value={RDSponsorType.NON_RND}>{getRDSponsorTypeText(RDSponsorType.NON_RND)}</option>
            </select>
          </div>
          <div>
            <label
              for="edit-project-research-type"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              연구유형 *
            </label>
            <select
              id="edit-project-research-type"
              bind:value={projectForm.researchType}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={RDResearchType.BASIC}>{getRDResearchTypeText(RDResearchType.BASIC)}</option>
              <option value={RDResearchType.APPLIED}>{getRDResearchTypeText(RDResearchType.APPLIED)}</option>
              <option value={RDResearchType.DEVELOPMENT}>{getRDResearchTypeText(RDResearchType.DEVELOPMENT)}</option>
            </select>
          </div>
        </div>

        <!-- 전담기관 정보 섹션 -->
        <div class="pt-4 mt-4 border-t border-gray-200">
          <h4 class="text-sm font-medium text-gray-900 mb-3">전담기관 정보 (선택)</h4>

          <!-- 전담기관 -->
          <div class="mb-4">
            <label for="edit-dedicated-agency" class="block text-sm font-medium text-gray-700 mb-1">
              전담기관
            </label>
            <input
              id="edit-dedicated-agency"
              type="text"
              bind:value={projectForm.dedicatedAgency}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="전담기관을 입력하세요"
            />
          </div>

          <!-- 전담기관 담당자 이름 -->
          <div class="mb-4">
            <label
              for="edit-dedicated-contact-name"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              전담기관 담당자 이름
            </label>
            <input
              id="edit-dedicated-contact-name"
              type="text"
              bind:value={projectForm.dedicatedAgencyContactName}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="담당자 이름을 입력하세요"
            />
          </div>

          <!-- 전담기관 담당자 연락처 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="edit-dedicated-contact-phone"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                전화번호
              </label>
              <input
                id="edit-dedicated-contact-phone"
                type="tel"
                bind:value={projectForm.dedicatedAgencyContactPhone}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="010-1234-5678"
              />
            </div>
            <div>
              <label
                for="edit-dedicated-contact-email"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                이메일
              </label>
              <input
                id="edit-dedicated-contact-email"
                type="email"
                bind:value={projectForm.dedicatedAgencyContactEmail}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@example.com"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-3 mt-6">
        <ThemeButton variant="ghost" onclick={onclose} disabled={isUpdating}>취소</ThemeButton>
        <ThemeButton onclick={onupdate} disabled={isUpdating}>
          {#if isUpdating}
            수정 중...
          {:else}
            수정
          {/if}
        </ThemeButton>
      </div>
    </div>
  </ThemeModal>
{/if}
