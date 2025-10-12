<script lang="ts">
  import type { EvidenceDocument } from '$lib/types/document.types'
  import { logger } from '$lib/utils/logger'
  import { CalendarIcon, EditIcon, PlusIcon } from '@lucide/svelte'
  import ThemeButton from '../ui/ThemeButton.svelte'
  import ThemeModal from '../ui/ThemeModal.svelte'
  import RDDocumentList from './RDDocumentList.svelte'
  import RDFileUpload from './RDFileUpload.svelte'
  import * as memberUtilsImported from './utils/rd-member-utils'

  interface EvidenceItem {
    id?: string
    name: string
    budget_amount: number
    progress: number
    due_date?: string
    status: string
    category_id?: string
    category_name?: string
    assignee_first_name?: string
    assignee_last_name?: string
    assignee_korean_name?: string
    documents?: Array<{
      document_type: string
      document_name: string
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

  interface EvidenceCategory {
    id: string
    code: string
    name: string
    is_active: boolean
  }

  interface Props {
    visible: boolean
    selectedItem: EvidenceItem | null
    formatRDCurrency: (amount: number) => string
    formatDate: (date: string) => string
    onclose: () => void
    onUpdate?: () => void
  }

  let {
    visible = $bindable(),
    selectedItem,
    formatRDCurrency,
    formatDate,
    onclose,
    onUpdate,
  }: Props = $props()

  let activeTab = $state<'info' | 'documents' | 'schedules'>('info')
  let categories = $state<EvidenceCategory[]>([])
  let documents = $state<EvidenceDocument[]>([])
  let editingCategory = $state(false)
  let selectedCategoryId = $state<string>('')
  let loadingDocuments = $state(false)
  let savingCategory = $state(false)

  // 카테고리 목록 로드
  async function loadCategories() {
    try {
      const response = await fetch('/api/research-development/evidence-categories')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          categories = result.data.filter((c: EvidenceCategory) => c.is_active)
        }
      }
    } catch (error) {
      logger.error('Failed to load categories:', error)
    }
  }

  // 문서 목록 로드
  async function loadDocuments() {
    if (!selectedItem?.id) return

    try {
      loadingDocuments = true
      const response = await fetch(
        `/api/research-development/evidence/${selectedItem.id}/documents`,
      )
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          documents = result.data
        }
      }
    } catch (error) {
      logger.error('Failed to load documents:', error)
    } finally {
      loadingDocuments = false
    }
  }

  // 카테고리 변경 저장
  async function handleCategoryChange() {
    if (!selectedItem?.id || !selectedCategoryId) return

    try {
      savingCategory = true
      const response = await fetch(`/api/research-development/evidence/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selectedCategoryId }),
      })

      if (!response.ok) {
        throw new Error('카테고리 변경 실패')
      }

      logger.log('Category updated', {
        evidenceId: selectedItem.id,
        categoryId: selectedCategoryId,
      })
      editingCategory = false
      onUpdate?.()
    } catch (error) {
      logger.error('Failed to update category:', error)
      alert('카테고리 변경에 실패했습니다.')
    } finally {
      savingCategory = false
    }
  }

  // 모달이 열릴 때 데이터 로드
  $effect(() => {
    if (visible && selectedItem?.id) {
      loadCategories()
      loadDocuments()
      selectedCategoryId = selectedItem.category_id || ''
      activeTab = 'info'
      editingCategory = false
    }
  })
</script>

<!-- 증빙 상세 모달 -->
{#if visible}
  <ThemeModal open={visible} {onclose} size="xl">
    <div class="p-6">
      <div class="mb-6">
        <h3 class="text-xl font-semibold text-gray-900">
          {selectedItem?.name || '증빙 관리'}
        </h3>
      </div>

      {#if selectedItem}
        <!-- 탭 메뉴 -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8">
            <button
              type="button"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm {activeTab ===
              'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
              onclick={() => (activeTab = 'info')}
            >
              기본 정보
            </button>
            <button
              type="button"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm {activeTab ===
              'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
              onclick={() => (activeTab = 'documents')}
            >
              증빙 서류 ({documents.length})
            </button>
            <button
              type="button"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm {activeTab ===
              'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
              onclick={() => (activeTab = 'schedules')}
            >
              일정 ({selectedItem.schedules?.length || 0})
            </button>
          </nav>
        </div>

        <!-- 탭 콘텐츠 -->
        <div class="space-y-6">
          {#if activeTab === 'info'}
            <!-- 기본 정보 탭 -->
            <div class="bg-gray-50 rounded-lg p-6">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">예산액</div>
                  <div class="text-base font-semibold text-gray-900">
                    {formatRDCurrency(selectedItem.budget_amount || 0)}
                  </div>
                </div>

                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">담당자</div>
                  <div class="text-base text-gray-900">
                    {memberUtilsImported.formatAssigneeNameFromFields(selectedItem, '미지정')}
                  </div>
                </div>

                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">진행률</div>
                  <div class="flex items-center space-x-3">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-blue-600 h-2 rounded-full"
                        style:width="{selectedItem.progress || 0}%"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-900"
                      >{selectedItem.progress || 0}%</span
                    >
                  </div>
                </div>

                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">마감일</div>
                  <div class="text-base text-gray-900">
                    {selectedItem.due_date ? formatDate(selectedItem.due_date) : '미설정'}
                  </div>
                </div>

                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">상태</div>
                  <div>
                    {#if selectedItem.status === 'completed'}
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        완료
                      </span>
                    {:else if selectedItem.status === 'in_progress'}
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                      >
                        진행중
                      </span>
                    {:else if selectedItem.status === 'planned'}
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                      >
                        계획
                      </span>
                    {:else}
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {selectedItem.status}
                      </span>
                    {/if}
                  </div>
                </div>

                <div class="col-span-2">
                  <div class="block text-sm font-medium text-gray-700 mb-1">카테고리</div>
                  {#if !editingCategory}
                    <div class="flex items-center space-x-2">
                      <span class="text-base font-medium text-gray-900"
                        >{selectedItem.category_name}</span
                      >
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => (editingCategory = true)}
                      >
                        <EditIcon size={14} class="mr-1" />
                        변경
                      </ThemeButton>
                    </div>
                  {:else}
                    <div class="flex items-center space-x-2">
                      <select
                        bind:value={selectedCategoryId}
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {#each categories as category}
                          <option value={category.id}>{category.name}</option>
                        {/each}
                      </select>
                      <ThemeButton
                        onclick={handleCategoryChange}
                        disabled={savingCategory || !selectedCategoryId}
                        size="sm"
                      >
                        {savingCategory ? '저장 중...' : '저장'}
                      </ThemeButton>
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => {
                          editingCategory = false
                          selectedCategoryId = selectedItem.category_id || ''
                        }}
                      >
                        취소
                      </ThemeButton>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {:else if activeTab === 'documents'}
            <!-- 증빙 서류 탭 -->
            <div class="space-y-6">
              <div>
                <h4 class="text-lg font-medium text-gray-900 mb-4">파일 업로드</h4>
                <RDFileUpload evidenceId={selectedItem.id || ''} onUploadComplete={loadDocuments} />
              </div>

              <div>
                <h4 class="text-lg font-medium text-gray-900 mb-4">업로드된 서류</h4>
                {#if loadingDocuments}
                  <div class="text-center py-8">
                    <div
                      class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                    ></div>
                    <p class="mt-2 text-sm text-gray-500">로딩 중...</p>
                  </div>
                {:else}
                  <RDDocumentList
                    evidenceId={selectedItem.id || ''}
                    bind:documents
                    onRefresh={loadDocuments}
                  />
                {/if}
              </div>
            </div>
          {:else if activeTab === 'schedules'}
            <!-- 일정 탭 -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-lg font-medium text-gray-900">증빙 일정</h4>
                <ThemeButton size="sm">
                  <PlusIcon size={14} class="mr-1" />
                  일정 추가
                </ThemeButton>
              </div>

              <div class="space-y-2">
                {#if selectedItem.schedules && selectedItem.schedules.length > 0}
                  {#each selectedItem.schedules as schedule, i (i)}
                    <div
                      class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div class="flex-1">
                        <div class="font-medium text-sm text-gray-900">
                          {schedule.task_name}
                        </div>
                        {#if schedule.description}
                          <div class="text-xs text-gray-600 mt-1">
                            {schedule.description}
                          </div>
                        {/if}
                        <div class="text-xs text-gray-500 mt-2">
                          마감일: {formatDate(schedule.due_date)}
                          {#if schedule.assignee_name}
                            | 담당자: {memberUtilsImported.formatAssigneeName(
                              schedule.assignee_name,
                              '미할당',
                            )}
                          {/if}
                        </div>
                      </div>
                      <div class="flex items-center space-x-2 ml-4">
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
                            class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                          >
                            높음
                          </span>
                        {:else if schedule.priority === 'urgent'}
                          <span
                            class="px-2 py-1 text-xs font-medium rounded-full bg-red-200 text-red-900"
                          >
                            긴급
                          </span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div class="text-center py-12 text-gray-500">
                    <CalendarIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>등록된 증빙 일정이 없습니다.</p>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>

        <!-- 하단 액션 버튼 -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <ThemeButton variant="ghost" onclick={onclose}>닫기</ThemeButton>
        </div>
      {/if}
    </div>
  </ThemeModal>
{/if}
