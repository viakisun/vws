<script lang="ts">
  import ThemeModal from '../ui/ThemeModal.svelte'
  import ThemeButton from '../ui/ThemeButton.svelte'

  interface ProjectForm {
    title: string
    code: string
    description: string
    status: string
    priority: string
    sponsorType: string
    researchType: string
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
    <div class="p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">프로젝트 수정</h3>

      <div class="space-y-4">
        <!-- 프로젝트 제목 -->
        <div>
          <label for="edit-project-title" class="block text-sm font-medium text-gray-700 mb-1">
            프로젝트 제목 *
          </label>
          <input
            id="edit-project-title"
            type="text"
            bind:value={projectForm.title}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="프로젝트 제목을 입력하세요"
            required
          />
        </div>

        <!-- 프로젝트 코드 -->
        <div>
          <label for="edit-project-code" class="block text-sm font-medium text-gray-700 mb-1">
            프로젝트 코드 *
          </label>
          <input
            id="edit-project-code"
            type="text"
            bind:value={projectForm.code}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="프로젝트 코드를 입력하세요"
            required
          />
        </div>

        <!-- 프로젝트 설명 -->
        <div>
          <label
            for="edit-project-description"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            프로젝트 설명
          </label>
          <textarea
            id="edit-project-description"
            bind:value={projectForm.description}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="프로젝트 설명을 입력하세요"
          ></textarea>
        </div>

        <!-- 프로젝트 상태 및 우선순위 -->
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
              <option value="planning">계획</option>
              <option value="active">진행중</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
              <option value="suspended">중단</option>
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
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="critical">긴급</option>
            </select>
          </div>
        </div>

        <!-- 후원기관 및 연구유형 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="edit-project-sponsor" class="block text-sm font-medium text-gray-700 mb-1">
              후원기관 *
            </label>
            <select
              id="edit-project-sponsor"
              bind:value={projectForm.sponsorType}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="internal">내부</option>
              <option value="government">정부</option>
              <option value="private">민간</option>
              <option value="international">국제</option>
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
              <option value="basic">기초연구</option>
              <option value="applied">응용연구</option>
              <option value="development">개발연구</option>
            </select>
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
