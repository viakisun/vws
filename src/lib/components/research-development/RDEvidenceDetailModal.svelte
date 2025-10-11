<script lang="ts">
  import { CalendarIcon, FileTextIcon, PlusIcon } from '@lucide/svelte'
  import ThemeButton from '../ui/ThemeButton.svelte'
  import ThemeModal from '../ui/ThemeModal.svelte'
  import * as memberUtilsImported from './utils/rd-member-utils'

  interface EvidenceItem {
    id?: number
    name: string
    budget_amount: number
    progress: number
    due_date?: string
    status: string
    category_name?: string
    assignee_first_name?: string
    assignee_last_name?: string
    assignee_korean_name?: string
    documents?: Array<{
      document_type: string
      document_name: string
      uploader_name?: string
      file_size?: number
      status: string
    }>
    schedules?: Array<{
      task_name: string
      description?: string
      due_date: string
      assignee_name?: string
      status: string
      priority?: string
    }>
  }

  interface Props {
    visible: boolean
    selectedItem: EvidenceItem | null
    formatRDCurrency: (amount: number) => string
    formatDate: (date: string) => string
    onclose: () => void
  }

  let {
    visible = $bindable(),
    selectedItem,
    formatRDCurrency,
    formatDate,
    onclose,
  }: Props = $props()
</script>

<!-- 증빙 상세 모달 -->
{#if visible}
  <ThemeModal open={visible} {onclose}>
    <div class="p-6 max-w-4xl">
      <div class="mb-4">
        <h3 class="text-lg font-medium text-gray-900">
          {selectedItem?.name} 증빙 관리
        </h3>
      </div>

      {#if selectedItem}
        <div class="space-y-6">
          <!-- 기본 정보 -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-md font-medium text-gray-900 mb-3">기본 정보</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">예산액:</span>
                <span class="ml-2 font-medium">
                  {formatRDCurrency(selectedItem.budget_amount || 0)}
                </span>
              </div>
              <div>
                <span class="text-gray-600">담당자:</span>
                <span class="ml-2"
                  >{memberUtilsImported.formatAssigneeNameFromFields(selectedItem, '미지정')}</span
                >
              </div>
              <div>
                <span class="text-gray-600">진행률:</span>
                <span class="ml-2">{selectedItem.progress || 0}%</span>
              </div>
              <div>
                <span class="text-gray-600">마감일:</span>
                <span class="ml-2"
                  >{selectedItem.due_date ? formatDate(selectedItem.due_date) : '미설정'}</span
                >
              </div>
              <div>
                <span class="text-gray-600">상태:</span>
                <span class="ml-2">
                  {#if selectedItem.status === 'completed'}
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
                      >완료</span
                    >
                  {:else if selectedItem.status === 'in_progress'}
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800"
                      >진행중</span
                    >
                  {:else if selectedItem.status === 'planned'}
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                      >계획</span
                    >
                  {:else}
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                      >{selectedItem.status}</span
                    >
                  {/if}
                </span>
              </div>
              <div>
                <span class="text-gray-600">카테고리:</span>
                <span class="ml-2">{selectedItem.category_name}</span>
              </div>
            </div>
          </div>

          <!-- 증빙 서류 관리 -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h5 class="text-md font-medium text-gray-900">증빙 서류</h5>
              <ThemeButton size="sm">
                <PlusIcon size={14} class="mr-1" />
                서류 추가
              </ThemeButton>
            </div>

            <div class="space-y-2">
              {#if selectedItem.documents && selectedItem.documents.length > 0}
                {#each selectedItem.documents as document, i (i)}
                  <div
                    class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div class="flex items-center space-x-3">
                      <div>
                        <div class="font-medium text-sm">
                          {document.document_type}
                        </div>
                        <div class="text-xs text-gray-500">
                          {document.document_name}
                        </div>
                        {#if document.uploader_name}
                          <div class="text-xs text-gray-400">
                            업로더: {document.uploader_name}
                          </div>
                        {/if}
                      </div>
                      {#if document.file_size}
                        <div class="text-xs text-gray-500">
                          크기: {Math.floor(document.file_size / 1024)}KB
                        </div>
                      {/if}
                    </div>
                    <div class="flex items-center space-x-2">
                      {#if document.status === 'approved'}
                        <span
                          class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
                        >
                          승인됨
                        </span>
                      {:else if document.status === 'reviewed'}
                        <span
                          class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                        >
                          검토됨
                        </span>
                      {:else if document.status === 'rejected'}
                        <span
                          class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                        >
                          거부됨
                        </span>
                      {:else}
                        <span
                          class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                        >
                          업로드됨
                        </span>
                      {/if}
                      <ThemeButton variant="ghost" size="sm">
                        <FileTextIcon size={12} class="mr-1" />
                        보기
                      </ThemeButton>
                    </div>
                  </div>
                {/each}
              {:else}
                <div class="text-center py-8 text-gray-500">
                  <FileTextIcon size={48} class="mx-auto mb-2 text-gray-300" />
                  <p>등록된 증빙 서류가 없습니다.</p>
                </div>
              {/if}
            </div>
          </div>

          <!-- 증빙 일정 관리 -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h5 class="text-md font-medium text-gray-900">증빙 일정</h5>
              <ThemeButton size="sm">
                <PlusIcon size={14} class="mr-1" />
                일정 추가
              </ThemeButton>
            </div>

            <div class="space-y-2">
              {#if selectedItem.schedules && selectedItem.schedules.length > 0}
                {#each selectedItem.schedules as schedule, i (i)}
                  <div
                    class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div class="flex items-center space-x-3">
                      <div>
                        <div class="font-medium text-sm">
                          {schedule.task_name}
                        </div>
                        {#if schedule.description}
                          <div class="text-xs text-gray-500">
                            {schedule.description}
                          </div>
                        {/if}
                        <div class="text-xs text-gray-400">
                          마감일: {formatDate(schedule.due_date)}
                          {#if schedule.assignee_name}
                            | 담당자: {memberUtilsImported.formatAssigneeName(
                              schedule.assignee_name,
                              '미할당',
                            )}
                          {/if}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      {#if schedule.status === 'completed'}
                        <span
                          class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
                        >
                          완료
                        </span>
                      {:else if schedule.status === 'in_progress'}
                        <span
                          class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800"
                        >
                          진행중
                        </span>
                      {:else if schedule.status === 'overdue'}
                        <span
                          class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                        >
                          지연
                        </span>
                      {:else}
                        <span
                          class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                        >
                          대기
                        </span>
                      {/if}
                      {#if schedule.priority === 'high'}
                        <span
                          class="px-1 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                        >
                          높음
                        </span>
                      {:else if schedule.priority === 'urgent'}
                        <span
                          class="px-1 py-1 text-xs font-medium rounded-full bg-red-200 text-red-900"
                        >
                          긴급
                        </span>
                      {/if}
                    </div>
                  </div>
                {/each}
              {:else}
                <div class="text-center py-8 text-gray-500">
                  <CalendarIcon size={48} class="mx-auto mb-2 text-gray-300" />
                  <p>등록된 증빙 일정이 없습니다.</p>
                </div>
              {/if}
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <ThemeButton variant="ghost" onclick={onclose}>닫기</ThemeButton>
            <ThemeButton>저장</ThemeButton>
          </div>
        </div>
      {/if}
    </div>
  </ThemeModal>
{/if}
