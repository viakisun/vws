<script lang="ts">
  import type { TodoWithAssignee, ExternalLink } from '../types'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import SectionActionButton from '$lib/components/ui/SectionActionButton.svelte'
  import { PencilIcon, TrashIcon, LinkIcon, XIcon, GripVerticalIcon } from 'lucide-svelte'

  interface Employee {
    id: string
    first_name: string
    last_name: string
  }

  interface Props {
    todos: TodoWithAssignee[]
    showAddForm: boolean
    adding: boolean
    onAddTodo: (input: {
      title: string
      description?: string
      assignee_id?: string
      due_date?: string
      external_links?: ExternalLink[]
    }) => Promise<void>
    onUpdateTodo: (
      todoId: string,
      input: {
        title?: string
        description?: string
        status?: 'todo' | 'in_progress' | 'done'
        assignee_id?: string | null
        external_links?: ExternalLink[]
      },
    ) => Promise<void>
    onDeleteTodo: (todoId: string) => Promise<void>
    onToggleForm: () => void
    onCloseForm: () => void
  }

  let {
    todos,
    showAddForm,
    adding,
    onAddTodo,
    onUpdateTodo,
    onDeleteTodo,
    onToggleForm,
    onCloseForm,
  }: Props = $props()

  let newTitle = $state('')
  let newDescription = $state('')
  let newAssigneeId = $state<string>('')
  let newLinks = $state<ExternalLink[]>([])
  let employees = $state<Employee[]>([])
  let loadingEmployees = $state(false)

  let editingId = $state<string | null>(null)
  let editTitle = $state('')
  let editDescription = $state('')
  let editAssigneeId = $state<string>('')
  let editLinks = $state<ExternalLink[]>([])

  let draggedTodo = $state<TodoWithAssignee | null>(null)

  // Load employees when component mounts
  $effect(() => {
    loadEmployees()
  })

  async function loadEmployees() {
    try {
      loadingEmployees = true
      const res = await fetch('/api/employees')
      if (res.ok) {
        const data = await res.json()
        employees = (data.employees || []).filter((emp: any) => emp.status === 'active')
      }
    } catch (e) {
      console.error('Failed to load employees:', e)
    } finally {
      loadingEmployees = false
    }
  }

  async function handleSubmit() {
    if (!newTitle.trim()) return

    try {
      await onAddTodo({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        assignee_id: newAssigneeId || undefined,
        external_links: newLinks.length > 0 ? newLinks : undefined,
      })
      newTitle = ''
      newDescription = ''
      newAssigneeId = ''
      newLinks = []
    } catch (e) {
      alert(e instanceof Error ? e.message : 'TODO 추가에 실패했습니다')
    }
  }

  function startEdit(todo: TodoWithAssignee) {
    editingId = todo.id
    editTitle = todo.title
    editDescription = todo.description || ''
    editAssigneeId = todo.assignee_id || ''
    editLinks = todo.external_links ? [...todo.external_links] : []
  }

  function cancelEdit() {
    editingId = null
    editTitle = ''
    editDescription = ''
    editAssigneeId = ''
    editLinks = []
  }

  async function saveEdit(todoId: string) {
    if (!editTitle.trim()) return

    try {
      await onUpdateTodo(todoId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        assignee_id: editAssigneeId || null,
        external_links: editLinks.length > 0 ? editLinks : [],
      })
      cancelEdit()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'TODO 수정에 실패했습니다')
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

  function addNewLink() {
    newLinks = [...newLinks, { url: '', title: '', type: 'other' }]
  }

  function removeNewLink(index: number) {
    newLinks = newLinks.filter((_, i) => i !== index)
  }

  function addEditLink() {
    editLinks = [...editLinks, { url: '', title: '', type: 'other' }]
  }

  function removeEditLink(index: number) {
    editLinks = editLinks.filter((_, i) => i !== index)
  }

  // Drag and drop handlers
  function handleDragStart(todo: TodoWithAssignee, e: DragEvent) {
    draggedTodo = todo
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  function handleDrop(status: 'todo' | 'in_progress' | 'done', e: DragEvent) {
    e.preventDefault()
    if (draggedTodo && draggedTodo.status !== status) {
      handleStatusChange(draggedTodo.id, status)
    }
    draggedTodo = null
  }

  const todosByStatus = $derived({
    todo: todos.filter((t) => t.status === 'todo'),
    in_progress: todos.filter((t) => t.status === 'in_progress'),
    done: todos.filter((t) => t.status === 'done'),
  })
</script>

<div
  class="rounded-lg border p-6"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <SectionHeader title="To-do" count={todos.length}>
    <SectionActionButton onclick={onToggleForm}>
      {showAddForm ? 'Cancel' : '+ Add To-do'}
    </SectionActionButton>
  </SectionHeader>

  {#if showAddForm}
    <div
      class="mb-4 p-4 rounded-lg border"
      style:background="var(--color-surface-secondary)"
      style:border-color="var(--color-border)"
    >
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
        class="w-full px-3 py-2 mb-2 rounded border resize-none"
        style:background="var(--color-surface)"
        style:color="var(--color-text-primary)"
        style:border-color="var(--color-border)"
      ></textarea>

      <select
        bind:value={newAssigneeId}
        class="w-full px-3 py-2 mb-2 rounded border text-sm"
        style:background="var(--color-surface)"
        style:color="var(--color-text-primary)"
        style:border-color="var(--color-border)"
        disabled={loadingEmployees}
      >
        <option value="">담당자 없음</option>
        {#each employees as employee}
          <option value={employee.id}>
            {formatKoreanName(employee.last_name, employee.first_name)}
          </option>
        {/each}
      </select>

      {#if newLinks.length > 0}
        <div class="mb-2 space-y-2">
          {#each newLinks as link, index}
            <div class="flex gap-2">
              <input
                type="url"
                bind:value={link.url}
                placeholder="링크 URL"
                class="flex-1 px-2 py-1 rounded border text-sm"
                style:background="var(--color-surface)"
                style:color="var(--color-text-primary)"
                style:border-color="var(--color-border)"
              />
              <input
                type="text"
                bind:value={link.title}
                placeholder="링크 제목"
                class="flex-1 px-2 py-1 rounded border text-sm"
                style:background="var(--color-surface)"
                style:color="var(--color-text-primary)"
                style:border-color="var(--color-border)"
              />
              <button
                onclick={() => removeNewLink(index)}
                class="p-1 hover:opacity-70"
                style:color="var(--color-error)"
              >
                <XIcon size={16} />
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <div class="flex gap-2 mb-3">
        <button
          onclick={addNewLink}
          class="text-xs px-2 py-1 rounded hover:opacity-70"
          style:color="var(--color-primary)"
        >
          + 링크 추가
        </button>
      </div>

      <div class="flex gap-2">
        <ThemeButton
          variant="primary"
          size="sm"
          onclick={handleSubmit}
          disabled={adding || !newTitle.trim()}
        >
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
    <!-- Kanban Board -->
    <div class="grid grid-cols-3 gap-4">
      <!-- INBOX Column -->
      <div class="flex flex-col" ondragover={handleDragOver} ondrop={(e) => handleDrop('todo', e)}>
        <div
          class="mb-3 p-2 rounded-lg text-center font-semibold text-sm"
          style:background="var(--color-gray-100)"
          style:color="var(--color-text-secondary)"
        >
          INBOX ({todosByStatus.todo.length})
        </div>
        <div class="space-y-2 min-h-[200px]">
          {#each todosByStatus.todo as todo}
            {#if editingId === todo.id}
              <!-- Edit Card -->
              <div
                class="p-3 rounded-lg border"
                style:background="var(--color-surface)"
                style:border-color="var(--color-border)"
                style:box-shadow="0 2px 4px rgba(0,0,0,0.1)"
              >
                <input
                  type="text"
                  bind:value={editTitle}
                  class="w-full px-2 py-1 mb-2 rounded border text-sm font-medium"
                  style:background="var(--color-surface)"
                  style:color="var(--color-text-primary)"
                  style:border-color="var(--color-border)"
                />
                <textarea
                  bind:value={editDescription}
                  rows="2"
                  placeholder="설명"
                  class="w-full px-2 py-1 mb-2 rounded border resize-none text-xs"
                  style:background="var(--color-surface)"
                  style:color="var(--color-text-primary)"
                  style:border-color="var(--color-border)"
                ></textarea>

                <select
                  bind:value={editAssigneeId}
                  class="w-full px-2 py-1 mb-2 rounded border text-xs"
                  style:background="var(--color-surface)"
                  style:color="var(--color-text-primary)"
                  style:border-color="var(--color-border)"
                >
                  <option value="">담당자 없음</option>
                  {#each employees as employee}
                    <option value={employee.id}>
                      {formatKoreanName(employee.last_name, employee.first_name)}
                    </option>
                  {/each}
                </select>

                {#if editLinks.length > 0}
                  <div class="mb-2 space-y-1">
                    {#each editLinks as link, index}
                      <div class="flex gap-1">
                        <input
                          type="url"
                          bind:value={link.url}
                          placeholder="URL"
                          class="flex-1 px-2 py-1 rounded border text-xs"
                          style:background="var(--color-surface)"
                          style:color="var(--color-text-primary)"
                          style:border-color="var(--color-border)"
                        />
                        <button
                          onclick={() => removeEditLink(index)}
                          class="p-1 hover:opacity-70"
                          style:color="var(--color-error)"
                        >
                          <XIcon size={12} />
                        </button>
                      </div>
                    {/each}
                  </div>
                {/if}

                <button
                  onclick={addEditLink}
                  class="text-xs px-2 py-1 mb-2 rounded hover:opacity-70"
                  style:color="var(--color-primary)"
                >
                  + 링크
                </button>

                <div class="flex gap-2">
                  <ThemeButton variant="primary" size="sm" onclick={() => saveEdit(todo.id)}>
                    저장
                  </ThemeButton>
                  <ThemeButton variant="ghost" size="sm" onclick={cancelEdit}>취소</ThemeButton>
                </div>
              </div>
            {:else}
              <!-- View Card -->
              <div
                draggable="true"
                ondragstart={(e) => handleDragStart(todo, e)}
                class="p-3 rounded-lg border cursor-move hover:shadow-md transition group"
                style:background="var(--color-surface)"
                style:border-color="var(--color-border)"
                style:box-shadow="0 1px 3px rgba(0,0,0,0.1)"
              >
                <div class="flex items-start gap-2 mb-2">
                  <div
                    class="opacity-40 group-hover:opacity-100 transition"
                    style:color="var(--color-text-tertiary)"
                  >
                    <GripVerticalIcon size={16} />
                  </div>
                  <div class="flex-1">
                    <div class="text-sm font-medium mb-1" style:color="var(--color-text-primary)">
                      {todo.title}
                    </div>
                    {#if todo.description}
                      <div class="text-xs mb-2" style:color="var(--color-text-secondary)">
                        {todo.description}
                      </div>
                    {/if}
                    {#if todo.assignee}
                      <div
                        class="text-xs px-2 py-0.5 rounded inline-block mb-1"
                        style:background="var(--color-primary-light)"
                        style:color="var(--color-primary)"
                      >
                        {formatKoreanName(todo.assignee.last_name, todo.assignee.first_name)}
                      </div>
                    {/if}
                    {#if todo.external_links && todo.external_links.length > 0}
                      <div class="flex gap-1 flex-wrap mt-2">
                        {#each todo.external_links as link}
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-xs px-2 py-0.5 rounded flex items-center gap-1 hover:opacity-70"
                            style:background="var(--color-blue-100)"
                            style:color="var(--color-blue-700)"
                            onclick={(e) => e.stopPropagation()}
                          >
                            <LinkIcon size={10} />
                            {link.title || '링크'}
                          </a>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onclick={() => startEdit(todo)}
                      class="p-1 hover:opacity-70"
                      style:color="var(--color-text-tertiary)"
                      title="편집"
                    >
                      <PencilIcon size={14} />
                    </button>
                    <button
                      onclick={() => handleDelete(todo.id)}
                      class="p-1 hover:opacity-70"
                      style:color="var(--color-error)"
                      title="삭제"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <!-- DOING Column -->
      <div
        class="flex flex-col"
        ondragover={handleDragOver}
        ondrop={(e) => handleDrop('in_progress', e)}
      >
        <div
          class="mb-3 p-2 rounded-lg text-center font-semibold text-sm"
          style:background="var(--color-blue-100)"
          style:color="var(--color-blue-700)"
        >
          DOING ({todosByStatus.in_progress.length})
        </div>
        <div class="space-y-2 min-h-[200px]">
          {#each todosByStatus.in_progress as todo}
            {#if editingId === todo.id}
              <!-- Edit Card -->
              <div
                class="p-3 rounded-lg border"
                style:background="var(--color-surface)"
                style:border-color="var(--color-blue-300)"
                style:box-shadow="0 2px 4px rgba(59, 130, 246, 0.2)"
              >
                <input
                  type="text"
                  bind:value={editTitle}
                  class="w-full px-2 py-1 mb-2 rounded border text-sm font-medium"
                  style:background="var(--color-surface)"
                  style:color="var(--color-text-primary)"
                  style:border-color="var(--color-border)"
                />
                <textarea
                  bind:value={editDescription}
                  rows="2"
                  placeholder="설명"
                  class="w-full px-2 py-1 mb-2 rounded border resize-none text-xs"
                  style:background="var(--color-surface)"
                  style:color="var(--color-text-primary)"
                  style:border-color="var(--color-border)"
                ></textarea>

                <select
                  bind:value={editAssigneeId}
                  class="w-full px-2 py-1 mb-2 rounded border text-xs"
                  style:background="var(--color-surface)"
                  style:color="var(--color-text-primary)"
                  style:border-color="var(--color-border)"
                >
                  <option value="">담당자 없음</option>
                  {#each employees as employee}
                    <option value={employee.id}>
                      {formatKoreanName(employee.last_name, employee.first_name)}
                    </option>
                  {/each}
                </select>

                {#if editLinks.length > 0}
                  <div class="mb-2 space-y-1">
                    {#each editLinks as link, index}
                      <div class="flex gap-1">
                        <input
                          type="url"
                          bind:value={link.url}
                          placeholder="URL"
                          class="flex-1 px-2 py-1 rounded border text-xs"
                          style:background="var(--color-surface)"
                          style:color="var(--color-text-primary)"
                          style:border-color="var(--color-border)"
                        />
                        <button
                          onclick={() => removeEditLink(index)}
                          class="p-1 hover:opacity-70"
                          style:color="var(--color-error)"
                        >
                          <XIcon size={12} />
                        </button>
                      </div>
                    {/each}
                  </div>
                {/if}

                <button
                  onclick={addEditLink}
                  class="text-xs px-2 py-1 mb-2 rounded hover:opacity-70"
                  style:color="var(--color-primary)"
                >
                  + 링크
                </button>

                <div class="flex gap-2">
                  <ThemeButton variant="primary" size="sm" onclick={() => saveEdit(todo.id)}>
                    저장
                  </ThemeButton>
                  <ThemeButton variant="ghost" size="sm" onclick={cancelEdit}>취소</ThemeButton>
                </div>
              </div>
            {:else}
              <!-- View Card -->
              <div
                draggable="true"
                ondragstart={(e) => handleDragStart(todo, e)}
                class="p-3 rounded-lg border cursor-move hover:shadow-md transition group"
                style:background="var(--color-surface)"
                style:border-color="var(--color-blue-300)"
                style:box-shadow="0 1px 3px rgba(59, 130, 246, 0.15)"
              >
                <div class="flex items-start gap-2 mb-2">
                  <div
                    class="opacity-40 group-hover:opacity-100 transition"
                    style:color="var(--color-blue-600)"
                  >
                    <GripVerticalIcon size={16} />
                  </div>
                  <div class="flex-1">
                    <div class="text-sm font-medium mb-1" style:color="var(--color-text-primary)">
                      {todo.title}
                    </div>
                    {#if todo.description}
                      <div class="text-xs mb-2" style:color="var(--color-text-secondary)">
                        {todo.description}
                      </div>
                    {/if}
                    {#if todo.assignee}
                      <div
                        class="text-xs px-2 py-0.5 rounded inline-block mb-1"
                        style:background="var(--color-primary-light)"
                        style:color="var(--color-primary)"
                      >
                        {formatKoreanName(todo.assignee.last_name, todo.assignee.first_name)}
                      </div>
                    {/if}
                    {#if todo.external_links && todo.external_links.length > 0}
                      <div class="flex gap-1 flex-wrap mt-2">
                        {#each todo.external_links as link}
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-xs px-2 py-0.5 rounded flex items-center gap-1 hover:opacity-70"
                            style:background="var(--color-blue-100)"
                            style:color="var(--color-blue-700)"
                            onclick={(e) => e.stopPropagation()}
                          >
                            <LinkIcon size={10} />
                            {link.title || '링크'}
                          </a>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onclick={() => startEdit(todo)}
                      class="p-1 hover:opacity-70"
                      style:color="var(--color-text-tertiary)"
                      title="편집"
                    >
                      <PencilIcon size={14} />
                    </button>
                    <button
                      onclick={() => handleDelete(todo.id)}
                      class="p-1 hover:opacity-70"
                      style:color="var(--color-error)"
                      title="삭제"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <!-- DONE Column -->
      <div class="flex flex-col" ondragover={handleDragOver} ondrop={(e) => handleDrop('done', e)}>
        <div
          class="mb-3 p-2 rounded-lg text-center font-semibold text-sm"
          style:background="var(--color-green-100)"
          style:color="var(--color-green-700)"
        >
          DONE ({todosByStatus.done.length})
        </div>
        <div class="space-y-2 min-h-[200px]">
          {#each todosByStatus.done as todo}
            <div
              draggable="true"
              ondragstart={(e) => handleDragStart(todo, e)}
              class="p-3 rounded-lg border cursor-move hover:shadow-md transition group opacity-75 hover:opacity-100"
              style:background="var(--color-surface)"
              style:border-color="var(--color-green-300)"
              style:box-shadow="0 1px 3px rgba(34, 197, 94, 0.15)"
            >
              <div class="flex items-start gap-2 mb-2">
                <div
                  class="opacity-40 group-hover:opacity-100 transition"
                  style:color="var(--color-green-600)"
                >
                  <GripVerticalIcon size={16} />
                </div>
                <div class="flex-1">
                  <div
                    class="text-sm font-medium mb-1 line-through"
                    style:color="var(--color-text-secondary)"
                  >
                    {todo.title}
                  </div>
                  {#if todo.description}
                    <div class="text-xs mb-2 line-through" style:color="var(--color-text-tertiary)">
                      {todo.description}
                    </div>
                  {/if}
                  {#if todo.assignee}
                    <div
                      class="text-xs px-2 py-0.5 rounded inline-block mb-1"
                      style:background="var(--color-green-100)"
                      style:color="var(--color-green-700)"
                    >
                      {formatKoreanName(todo.assignee.last_name, todo.assignee.first_name)}
                    </div>
                  {/if}
                  {#if todo.external_links && todo.external_links.length > 0}
                    <div class="flex gap-1 flex-wrap mt-2">
                      {#each todo.external_links as link}
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-xs px-2 py-0.5 rounded flex items-center gap-1 hover:opacity-70"
                          style:background="var(--color-green-100)"
                          style:color="var(--color-green-700)"
                          onclick={(e) => e.stopPropagation()}
                        >
                          <LinkIcon size={10} />
                          {link.title || '링크'}
                        </a>
                      {/each}
                    </div>
                  {/if}
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onclick={() => handleDelete(todo.id)}
                    class="p-1 hover:opacity-70"
                    style:color="var(--color-error)"
                    title="삭제"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
