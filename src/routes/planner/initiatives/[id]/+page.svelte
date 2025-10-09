<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { createInitiativeStore } from '$lib/planner/stores/initiative.svelte'
  import { createThreadsStore } from '$lib/planner/stores/threads.svelte'
  import { createLinksStore } from '$lib/planner/stores/links.svelte'
  import { createTodosStore } from '$lib/planner/stores/todos.svelte'
  import InitiativeHeader from '$lib/planner/components/InitiativeHeader.svelte'
  import StageStepper from '$lib/planner/components/StageStepper.svelte'
  import LinksSection from '$lib/planner/components/LinksSection.svelte'
  import TodosSection from '$lib/planner/components/TodosSection.svelte'
  import ThreadsSection from '$lib/planner/components/ThreadsSection.svelte'
  import ThreadDetailModal from '$lib/planner/components/ThreadDetailModal.svelte'
  import InitiativeDetailsModal from '$lib/planner/components/InitiativeDetailsModal.svelte'

  // Initialize stores
  const initiativeId = $page.params.id
  const initiativeStore = createInitiativeStore(initiativeId)
  const threadsStore = createThreadsStore(initiativeId)
  const linksStore = createLinksStore((links) => initiativeStore.updateLinks(links))
  const todosStore = createTodosStore(initiativeId)

  let showDetailsModal = $state(false)

  // Load data on mount
  onMount(async () => {
    await Promise.all([
      initiativeStore.load(),
      threadsStore.loadThreads(),
      todosStore.loadTodos(),
    ])

    // Initialize links from initiative
    if (initiativeStore.initiative?.context_links) {
      linksStore.setLinks(initiativeStore.initiative.context_links)
    }
  })

  // Watch for initiative changes to update links
  $effect(() => {
    if (initiativeStore.initiative?.context_links) {
      linksStore.setLinks(initiativeStore.initiative.context_links)
    }
  })
</script>

<svelte:head>
  <title>{initiativeStore.initiative?.title || '이니셔티브'} - 플래너</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-6 space-y-6">
  {#if initiativeStore.loading}
    <div class="text-center py-12">
      <div style:color="var(--color-text-secondary)">로딩 중...</div>
    </div>
  {:else if initiativeStore.error || !initiativeStore.initiative}
    <div class="p-4 rounded-lg border border-red-200 bg-red-50" style:color="var(--color-error)">
      {initiativeStore.error || '이니셔티브를 찾을 수 없습니다'}
    </div>
  {:else}
    <!-- Header Section -->
    <InitiativeHeader
      initiative={initiativeStore.initiative}
      onStatusChange={initiativeStore.updateStatus}
      onEditDetails={() => (showDetailsModal = true)}
    />

    <!-- Stage Progress Stepper -->
    <StageStepper
      currentStage={initiativeStore.initiative.stage}
      currentStatus={initiativeStore.initiative.status}
      isChanging={initiativeStore.changingStage}
      onStageChange={initiativeStore.updateStage}
    />

    <!-- Links Section -->
    <LinksSection
      links={linksStore.links}
      bind:showAddForm={linksStore.showAddForm}
      adding={linksStore.adding}
      onAddLink={linksStore.addLink}
      onRemoveLink={linksStore.removeLink}
      onToggleForm={linksStore.toggleAddForm}
      onCloseForm={linksStore.closeAddForm}
    />

    <!-- Todos Section -->
    <TodosSection
      todos={todosStore.todos}
      showAddForm={todosStore.showAddForm}
      adding={todosStore.adding}
      onAddTodo={todosStore.addTodo}
      onUpdateTodo={todosStore.updateTodo}
      onDeleteTodo={todosStore.deleteTodo}
      onToggleForm={todosStore.toggleAddForm}
      onCloseForm={todosStore.closeAddForm}
    />

    <!-- Threads Section -->
    <ThreadsSection
      threads={threadsStore.activeThreads}
      initiativeId={initiativeStore.initiative.id}
      onSelectThread={threadsStore.selectThread}
    />

    <!-- Thread Detail Modal -->
    <ThreadDetailModal
      thread={threadsStore.selectedThread}
      replies={threadsStore.replies}
      submittingReply={threadsStore.submittingReply}
      onClose={threadsStore.closeThread}
      onSubmitReply={threadsStore.submitReply}
    />

    <!-- Initiative Details Modal -->
    <InitiativeDetailsModal
      initiative={showDetailsModal ? initiativeStore.initiative : null}
      onClose={() => (showDetailsModal = false)}
      onSave={initiativeStore.updateDetails}
    />
  {/if}
</div>
