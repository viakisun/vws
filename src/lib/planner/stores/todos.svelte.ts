import type { TodoWithAssignee, CreateTodoInput, UpdateTodoInput } from '../types'

export function createTodosStore(initiativeId: string) {
  let todos = $state<TodoWithAssignee[]>([])
  let loading = $state(false)
  let error = $state<string | null>(null)
  let adding = $state(false)
  let showAddForm = $state(false)

  async function loadTodos() {
    loading = true
    error = null
    try {
      const response = await fetch(`/api/planner/initiatives/${initiativeId}/todos`)
      if (!response.ok) {
        throw new Error('Failed to load todos')
      }
      todos = await response.json()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load todos'
      console.error('Error loading todos:', e)
    } finally {
      loading = false
    }
  }

  async function addTodo(input: Omit<CreateTodoInput, 'initiative_id'>) {
    adding = true
    try {
      const response = await fetch(`/api/planner/initiatives/${initiativeId}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, initiative_id: initiativeId }),
      })
      if (!response.ok) {
        throw new Error('Failed to create todo')
      }
      const newTodo = await response.json()
      todos = [...todos, newTodo]
      showAddForm = false
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to create todo')
    } finally {
      adding = false
    }
  }

  async function updateTodo(todoId: string, input: UpdateTodoInput) {
    try {
      const response = await fetch(`/api/planner/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        throw new Error('Failed to update todo')
      }
      const updatedTodo = await response.json()
      todos = todos.map((t) => (t.id === todoId ? updatedTodo : t))
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to update todo')
    }
  }

  async function deleteTodo(todoId: string) {
    try {
      const response = await fetch(`/api/planner/todos/${todoId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete todo')
      }
      todos = todos.filter((t) => t.id !== todoId)
    } catch (e) {
      throw e instanceof Error ? e : new Error('Failed to delete todo')
    }
  }

  function toggleAddForm() {
    showAddForm = !showAddForm
  }

  function closeAddForm() {
    showAddForm = false
  }

  return {
    get todos() {
      return todos
    },
    get loading() {
      return loading
    },
    get error() {
      return error
    },
    get adding() {
      return adding
    },
    get showAddForm() {
      return showAddForm
    },
    set showAddForm(value: boolean) {
      showAddForm = value
    },
    loadTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleAddForm,
    closeAddForm,
  }
}
