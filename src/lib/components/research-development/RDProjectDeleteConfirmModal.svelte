<script lang="ts">
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { AlertTriangleIcon } from '@lucide/svelte'

  interface Project {
    title: string
    code: string
  }

  interface Props {
    open: boolean
    onclose: () => void
    project: Project | null
    projectCode: string
    deleteConfirmationCode: string
    membersCount: number
    budgetsCount: number
    isDeleting: boolean
    onConfirm: () => void | Promise<void>
  }

  let {
    open = $bindable(false),
    onclose,
    project,
    projectCode,
    deleteConfirmationCode = $bindable(''),
    membersCount,
    budgetsCount,
    isDeleting,
    onConfirm,
  }: Props = $props()

  /**
   * 삭제 확인 코드 검증
   * 입력한 코드가 프로젝트 코드와 정확히 일치하는지 확인
   */
  function isDeleteCodeValid(): boolean {
    return deleteConfirmationCode.trim() === projectCode.trim()
  }

  /**
   * 모달 닫기
   * 확인 코드를 초기화하고 모달을 닫음
   */
  function handleClose(): void {
    deleteConfirmationCode = ''
    onclose()
  }
</script>

<ThemeModal {open} onclose={handleClose}>
  <div class="p-6">
    <div class="flex items-center mb-4">
      <AlertTriangleIcon class="h-6 w-6 text-red-500 mr-3" />
      <h3 class="text-lg font-medium text-gray-900">프로젝트 삭제 확인</h3>
    </div>

    <div class="mb-6">
      <p class="text-sm text-gray-600 mb-4">다음 프로젝트를 완전히 삭제하시겠습니까?</p>
      <div class="bg-gray-50 p-4 rounded-lg">
        <p class="font-medium text-gray-900">{project?.title}</p>
        <p class="text-sm text-gray-600">코드: {project?.code}</p>
      </div>
      <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-sm text-red-800 font-medium mb-2">⚠️ 삭제될 데이터:</p>
        <ul class="text-sm text-red-700 space-y-1">
          <li>• 참여연구원 정보 ({membersCount}명)</li>
          <li>• 프로젝트 사업비 정보 ({budgetsCount}개 연차)</li>
          <li>• 참여율 이력 데이터</li>
          <li>• 프로젝트 마일스톤</li>
          <li>• 프로젝트 위험 요소</li>
        </ul>
        <p class="text-sm text-red-800 font-medium mt-3">이 작업은 되돌릴 수 없습니다.</p>
      </div>

      <!-- 프로젝트 코드 입력 확인 -->
      <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-sm text-yellow-800 font-medium mb-3">
          🔒 삭제를 확인하려면 프로젝트 코드를 입력하세요
        </p>
        <div>
          <label
            for="delete-confirmation-code"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            프로젝트 코드 입력
          </label>
          <input
            id="delete-confirmation-code"
            type="text"
            bind:value={deleteConfirmationCode}
            placeholder="프로젝트 코드를 정확히 입력하세요"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            autocomplete="off"
          />
          {#if deleteConfirmationCode && !isDeleteCodeValid()}
            <p class="text-sm text-red-600 mt-1">❌ 코드가 일치하지 않습니다</p>
          {:else if isDeleteCodeValid()}
            <p class="text-sm text-green-600 mt-1">✅ 코드가 일치합니다</p>
          {/if}
        </div>
      </div>
    </div>

    <div class="flex justify-end space-x-3">
      <ThemeButton variant="ghost" onclick={handleClose} disabled={isDeleting}>취소</ThemeButton>
      <ThemeButton
        variant="error"
        onclick={onConfirm}
        disabled={isDeleting || !isDeleteCodeValid()}
      >
        {#if isDeleting}
          삭제 중...
        {:else}
          삭제
        {/if}
      </ThemeButton>
    </div>
  </div>
</ThemeModal>
