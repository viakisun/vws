<script lang="ts">
  import type { TodoWithAssignee } from '../types'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import SectionActionButton from '$lib/components/ui/SectionActionButton.svelte'

  interface Props {
    todos: TodoWithAssignee[]
    showAddForm: boolean
    adding: boolean
    onAddTodo: (input: { title: string; description?: string; assignee_id?: string; due_date?: string }) => Promise<void>
    onUpdateTodo: (todoId: string, input: { status?: 'todo' | 'in_progress' | 'done' }) => Promise<void>
    onDeleteTodo: (todoId: string) => Promise<void>
    onToggleForm: () => void
    onCloseForm: () => void
  }

  let { todos, showAddForm, adding, onAddTodo, onUpdateTodo, onDeleteTodo, onToggleForm, onCloseForm }: Props = $props()

  let newTitle = $state('')
  let newDescription = $state('')

  async function handleSubmit() {
    if (!newTitle.trim()) return

    try {
      await onAddTodo({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      })
      newTitle = ''
      newDescription = ''
    } catch (e) {
      alert(e instanceof Error ? e.message : 'TODO 추가에 실패했습니다')
    }
  }

  async function handleStatusChange(todoId: string, status: 'todo' | 'in_progress' | 'done') {
    try {
      await onUpdateTodo(todoId, { status })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'TODO 상태 변경에 실패했습니다')
    }
  }

  async function handleDelete(todoId: string) {
    if (!confirm('이 TODO를 삭제하시겠습니까?')) return

    try {
      await onDeleteTodo(todoId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'TODO 삭제에 실패했습니다')
    }
  }

  const todosByStatus = $derived({
    todo: todos.filter((t) => t.status === 'todo'),
    in_progress: todos.filter((t) => t.status === 'in_progress'),
    done: todos.filter((t) => t.status === 'done'),
  })
</script>

<div class="rounded-lg border p-6" style:background="var(--color-surface)" style:border-color="var(--color-border)">
  <SectionHeader title="To-do" count={todos.length}>
    <SectionActionButton onclick={onToggleForm}>
      {showAddForm ? 'Cancel' : '+ Add To-do'}
    </SectionActionButton>
  </SectionHeader>

  {#if showAddForm}
    <div class="mb-4 p-4 rounded-lg border" style:background="var(--color-surface-secondary)" style:border-color="var(--color-border)">
      <input
        type="text"
        bind:value={newTitle}
        placeholder="TODO 제목"
        class="w-full px-3 py-2 mb-2 rounded border"
        style:background="var(--color-surface)"
        style:color="var(--color-text-primary)"
        style:border-color="var(--color-border)"
      />
      <textarea
        bind:value={newDescription}
        placeholder="설명 (선택사항)"
        rows="2"
        class="w-full px-3 py-2 mb-3 rounded border resize-none"
        style:background="var(--color-surface)"
        style:color="var(--color-text-primary)"
        style:border-color="var(--color-border)"
      ></textarea>
      <div class="flex gap-2">
        <ThemeButton variant="primary" size="sm" onclick={handleSubmit} disabled={adding || !newTitle.trim()}>
          {adding ? '추가 중...' : '추가'}
        </ThemeButton>
        <ThemeButton variant="ghost" size="sm" onclick={onCloseForm} disabled={adding}>
          취소
        </ThemeButton>
      </div>
    </div>
  {/if}

  {#if todos.length === 0}
    <p class="text-center py-8 text-sm" style:color="var(--color-text-tertiary)">
      등록된 TODO가 없습니다
    </p>
  {:else}
    <div class="space-y-4">
      {#if todosByStatus.todo.length > 0}
        <div>
          <h4 class="text-sm font-semibold mb-2 text-gray-600">할 일</h4>
          <div class="space-y-2">
            {#each todosByStatus.todo as todo}
              <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition" style:border="1px solid var(--color-border)">
                <input
                  type="checkbox"
                  checked={false}
                  onchange={() => handleStatusChange(todo.id, 'in_progress')}
                  class="mt-1 cursor-pointer"
                />
                <div class="flex-1">
                  <div class="font-medium" style:color="var(--color-text-primary)">{todo.title}</div>
                  {#if todo.description}
                    <div class="text-sm mt-1" style:color="var(--color-text-secondary)">{todo.description}</div>
                  {/if}
                  {#if todo.assignee}
                    <div class="text-xs mt-1" style:color="var(--color-text-tertiary)">
                      담당: {formatKoreanName(todo.assignee.last_name, todo.assignee.first_name)}
                    </div>
                  {/if}
                </div>
                <button
                  onclick={() => handleDelete(todo.id)}
                  class="text-red-500 hover:text-red-700 text-sm"
                >
                  삭제
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if todosByStatus.in_progress.length > 0}
        <div>
          <h4 class="text-sm font-semibold mb-2 text-blue-600">진행 중</h4>
          <div class="space-y-2">
            {#each todosByStatus.in_progress as todo}
              <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition bg-blue-50" style:border="1px solid var(--color-border)">
                <input
                  type="checkbox"
                  checked={false}
                  onchange={() => handleStatusChange(todo.id, 'done')}
                  class="mt-1 cursor-pointer"
                />
                <div class="flex-1">
                  <div class="font-medium" style:color="var(--color-text-primary)">{todo.title}</div>
                  {#if todo.description}
                    <div class="text-sm mt-1" style:color="var(--color-text-secondary)">{todo.description}</div>
                  {/if}
                  {#if todo.assignee}
                    <div class="text-xs mt-1" style:color="var(--color-text-tertiary)">
                      담당: {formatKoreanName(todo.assignee.last_name, todo.assignee.first_name)}
                    </div>
                  {/if}
                </div>
                <button
                  onclick={() => handleStatusChange(todo.id, 'todo')}
                  class="text-gray-500 hover:text-gray-700 text-sm"
                >
                  되돌리기
                </button>
                <button
                  onclick={() => handleDelete(todo.id)}
                  class="text-red-500 hover:text-red-700 text-sm"
                >
                  삭제
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if todosByStatus.done.length > 0}
        <div>
          <h4 class="text-sm font-semibold mb-2 text-green-600">완료</h4>
          <div class="space-y-2">
            {#each todosByStatus.done as todo}
              <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition bg-green-50 opacity-75" style:border="1px solid var(--color-border)">
                <input
                  type="checkbox"
                  checked={true}
                  onchange={() => handleStatusChange(todo.id, 'todo')}
                  class="mt-1 cursor-pointer"
                />
                <div class="flex-1">
                  <div class="font-medium line-through" style:color="var(--color-text-secondary)">{todo.title}</div>
                  {#if todo.description}
                    <div class="text-sm mt-1 line-through" style:color="var(--color-text-tertiary)">{todo.description}</div>
                  {/if}
                  {#if todo.assignee}
                    <div class="text-xs mt-1" style:color="var(--color-text-tertiary)">
                      담당: {formatKoreanName(todo.assignee.last_name, todo.assignee.first_name)}
                    </div>
                  {/if}
                </div>
                <button
                  onclick={() => handleDelete(todo.id)}
                  class="text-red-500 hover:text-red-700 text-sm"
                >
                  삭제
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
