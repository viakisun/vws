<script lang="ts">
  import Badge from "$lib/components/ui/Badge.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import { employees, projects } from "$lib/stores/rd";
  import { researchNotes } from "$lib/stores/rnd/mock-data";
  import type { ResearchNote } from "$lib/stores/rnd/types";
  import { keyOf } from "$lib/utils/keyOf";
  import { onMount } from "svelte";

  let selectedNote = $state<ResearchNote | null>(null);
  let showDetailModal = $state(false);
  let showCreateModal = $state(false);
  let searchTerm = $state("");
  let selectedProject = $state<string>("all");
  let selectedAuthor = $state<string>("all");
  let selectedWeek = $state<string>("all");

  // Form data for creating new research note
  let formData = $state({
    projectId: "",
    title: "",
    content: "",
    weekOf: "",
    attachments: [] as string[],
  });

  // Get filtered research notes
  let filteredNotes = $derived(() => {
    let notes = $researchNotes;

    if (searchTerm) {
      notes = notes.filter(
        (note: any) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.contentMd.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedProject !== "all") {
      notes = notes.filter((note: any) => note.projectId === selectedProject);
    }

    if (selectedAuthor !== "all") {
      notes = notes.filter((note: any) => note.authorId === selectedAuthor);
    }

    if (selectedWeek !== "all") {
      notes = notes.filter((note: any) => note.weekOf === selectedWeek);
    }

    return notes.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  // Get unique weeks for filter
  let availableWeeks = $derived(() => {
    const weeks = [...new Set($researchNotes.map((note: any) => note.weekOf))];
    return weeks.sort();
  });

  // Get person name by ID
  function getPersonName(personId: string): string {
    const person = $employees.find((p: any) => p.id === personId);
    return person ? person.name : "Unknown";
  }

  // Get project name by ID
  function getProjectName(projectId: string): string {
    const project = $projects.find((p: any) => p.id === projectId);
    return project ? project.name : "Unknown Project";
  }

  // Show note detail
  function showNoteDetail(note: ResearchNote) {
    selectedNote = note;
    showDetailModal = true;
  }

  // Create new research note
  function createNote() {
    if (
      !formData.projectId ||
      !formData.title ||
      !formData.content ||
      !formData.weekOf
    ) {
      alert("모든 필수 필드를 입력해주세요.");
      return;
    }

    const newNote: ResearchNote = {
      id: `rn-${Date.now()}`,
      projectId: formData.projectId,
      authorId: "emp-001", // Current user ID
      weekOf: formData.weekOf,
      title: formData.title,
      contentMd: formData.content,
      attachments: formData.attachments.map((att: string) => ({
        documentId: att,
        description: "Attachment",
      })),
      createdAt: new Date().toISOString(),
    };

    $researchNotes.push(newNote);

    // Reset form
    formData = {
      projectId: "",
      title: "",
      content: "",
      weekOf: "",
      attachments: [],
    };

    showCreateModal = false;
  }

  // Sign research note
  function signNote(noteId: string) {
    const note = $researchNotes.find((n: any) => n.id === noteId);
    if (note) {
      note.signedAt = new Date().toISOString();
    }
  }

  // Verify research note
  function verifyNote(noteId: string) {
    const note = $researchNotes.find((n: any) => n.id === noteId);
    if (note) {
      note.verifiedBy = "person-2"; // PM ID
    }
  }

  // Format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ko-KR");
  }

  // Get status badge variant
  function getStatusVariant(
    note: ResearchNote,
  ): "success" | "warning" | "danger" {
    if (note.verifiedBy) return "success";
    if (note.signedAt) return "warning";
    return "danger";
  }

  // Get status text
  function getStatusText(note: ResearchNote): string {
    if (note.verifiedBy) return "검인완료";
    if (note.signedAt) return "서명완료";
    return "미서명";
  }

  onMount(() => {
    // Initialize dummy data if needed
    if ($researchNotes.length === 0) {
      // Dummy data will be loaded from init-dummy-data.ts
    }
  });
</script>

<div class="container mx-auto p-6">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">연구노트 관리</h1>
    <p class="text-gray-600">
      연구진의 주간 연구노트 작성, 서명 및 검인을 관리합니다.
    </p>
  </div>

  <!-- Filters -->
  <div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div>
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1"
          >검색</label
        >
        <input
          id="search"
          type="text"
          bind:value={searchTerm}
          placeholder="제목 또는 내용 검색..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label
          for="project-filter"
          class="block text-sm font-medium text-gray-700 mb-1">프로젝트</label
        >
        <select
          id="project-filter"
          bind:value={selectedProject}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체</option>
          {#each $projects as project, i (i)}
            <option value={project.id}>{project.name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label
          for="author-filter"
          class="block text-sm font-medium text-gray-700 mb-1">작성자</label
        >
        <select
          id="author-filter"
          bind:value={selectedAuthor}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체</option>
          {#each $employees as person, i (i)}
            <option value={person.id}>{person.name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label
          for="week-filter"
          class="block text-sm font-medium text-gray-700 mb-1">주차</label
        >
        <select
          id="week-filter"
          bind:value={selectedWeek}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체</option>
          {#each availableWeeks() as week, idx (idx)}
            <!-- TODO: replace index key with a stable id when model provides one -->
            <option value={week}>{week}</option>
          {/each}
        </select>
      </div>
      <div class="flex items-end">
        <button
          type="button"
          onclick={() => (showCreateModal = true)}
          class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          새 연구노트 작성
        </button>
      </div>
    </div>
  </div>

  <!-- Research Notes List -->
  <div class="grid gap-4">
    {#each filteredNotes() as note, i (keyOf(note, i))}
      <Card class="p-4 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{note.title}</h3>
              <Badge variant={getStatusVariant(note)}
                >{getStatusText(note)}</Badge
              >
            </div>
            <div class="text-sm text-gray-600 mb-2">
              <span class="font-medium">프로젝트:</span>
              {getProjectName(note.projectId)} |
              <span class="font-medium">작성자:</span>
              {getPersonName(note.authorId)} |
              <span class="font-medium">주차:</span>
              {note.weekOf} |
              <span class="font-medium">작성일:</span>
              {formatDate(note.createdAt)}
            </div>
            <p class="text-gray-700 text-sm line-clamp-2">{note.contentMd}</p>
            {#if note.attachments.length > 0}
              <div class="mt-2">
                <span class="text-xs text-gray-500"
                  >첨부파일: {note.attachments.length}개</span
                >
              </div>
            {/if}
          </div>
          <div class="flex gap-2 ml-4">
            <button
              type="button"
              onclick={() => showNoteDetail(note)}
              class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="상세보기"
            >
              상세보기
            </button>
            {#if !note.signedAt}
              <button
                type="button"
                onclick={() => signNote(note.id)}
                class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                서명
              </button>
            {/if}
            {#if note.signedAt && !note.verifiedBy}
              <button
                type="button"
                onclick={() => verifyNote(note.id)}
                class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                검인
              </button>
            {/if}
          </div>
        </div>
      </Card>
    {/each}
  </div>

  {#if filteredNotes().length === 0}
    <div class="text-center py-12">
      <div class="text-gray-400 text-6xl mb-4">📝</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        연구노트가 없습니다
      </h3>
      <p class="text-gray-500">새로운 연구노트를 작성해보세요.</p>
    </div>
  {/if}
</div>

<!-- Detail Modal -->
<Modal bind:open={showDetailModal} title="연구노트 상세">
  {#if selectedNote}
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          {selectedNote.title}
        </h3>
        <div class="text-sm text-gray-600 space-y-1">
          <p>
            <span class="font-medium">프로젝트:</span>
            {getProjectName(selectedNote.projectId)}
          </p>
          <p>
            <span class="font-medium">작성자:</span>
            {getPersonName(selectedNote.authorId)}
          </p>
          <p><span class="font-medium">주차:</span> {selectedNote.weekOf}</p>
          <p>
            <span class="font-medium">작성일:</span>
            {formatDate(selectedNote.createdAt)}
          </p>
          {#if selectedNote.signedAt}
            <p>
              <span class="font-medium">서명일:</span>
              {formatDate(selectedNote.signedAt)}
            </p>
          {/if}
          {#if selectedNote.verifiedBy}
            <p>
              <span class="font-medium">검인자:</span>
              {getPersonName(selectedNote.verifiedBy)}
            </p>
          {/if}
        </div>
      </div>
      <div>
        <h4 class="font-medium text-gray-900 mb-2">내용</h4>
        <div class="bg-gray-50 p-4 rounded-md">
          <p class="whitespace-pre-wrap">{selectedNote?.contentMd}</p>
        </div>
      </div>
      {#if selectedNote.attachments.length > 0}
        <div>
          <h4 class="font-medium text-gray-900 mb-2">첨부파일</h4>
          <div class="space-y-2">
            {#each selectedNote.attachments as attachment, i (i)}
              <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span class="text-sm text-gray-600">📎 {attachment}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</Modal>

<!-- Create Modal -->
<Modal bind:open={showCreateModal} title="새 연구노트 작성">
  <div class="space-y-4">
    <div>
      <label
        for="create-project"
        class="block text-sm font-medium text-gray-700 mb-1">프로젝트 *</label
      >
      <select
        id="create-project"
        bind:value={formData.projectId}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">프로젝트 선택</option>
        {#each $projects as project, i (i)}
          <option value={project.id}>{project.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label
        for="create-week"
        class="block text-sm font-medium text-gray-700 mb-1">주차 *</label
      >
      <input
        id="create-week"
        type="text"
        bind:value={formData.weekOf}
        placeholder="예: 2024-W01"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label
        for="create-title"
        class="block text-sm font-medium text-gray-700 mb-1">제목 *</label
      >
      <input
        id="create-title"
        type="text"
        bind:value={formData.title}
        placeholder="연구노트 제목"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label
        for="create-content"
        class="block text-sm font-medium text-gray-700 mb-1">내용 *</label
      >
      <textarea
        id="create-content"
        bind:value={formData.content}
        rows="6"
        placeholder="연구 내용을 상세히 작성해주세요..."
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>
    <div class="flex justify-end gap-2">
      <button
        type="button"
        onclick={() => (showCreateModal = false)}
        class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        취소
      </button>
      <button
        type="button"
        onclick={createNote}
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        작성
      </button>
    </div>
  </div>
</Modal>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
