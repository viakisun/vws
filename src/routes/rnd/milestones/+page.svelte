<script lang="ts">
  import Badge from "$lib/components/ui/Badge.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import { employees, projects } from "$lib/stores/rd";
  import { onMount } from "svelte";

  interface Milestone {
    id: string;
    title: string;
    description: string;
    projectId: string;
    ownerId: string;
    dueDate: string;
    status: "pending" | "in_progress" | "completed" | "overdue";
    priority: "low" | "medium" | "high" | "critical";
    progress: number;
    dependencies: string[];
    quarter: string;
    deliverables: Array<{
      name: string;
      status: string;
      dueDate: string;
    }>;
    kpis: Array<{
      name: string;
      target: string;
      unit: string;
      current: number;
    }>;
    createdAt: string;
    updatedAt: string;
  }

  // Mock milestones data
  let milestones = $state<any[]>([
    {
      id: "milestone-1",
      projectId: "project-1",
      quarter: "2024-Q1",
      title: "AI 모델 프로토타입 개발",
      description: "기본 AI 모델 아키텍처 설계 및 프로토타입 구현",
      kpis: [
        { name: "모델 정확도", target: "85%", current: 82, unit: "%" },
        { name: "처리 속도", target: "100ms", current: 120, unit: "ms" },
        { name: "메모리 사용량", target: "2GB", current: 2.1, unit: "GB" },
      ],
      deliverables: [
        { name: "AI 모델 설계서", status: "completed", dueDate: "2024-01-15" },
        {
          name: "프로토타입 코드",
          status: "in_progress",
          dueDate: "2024-02-28",
        },
        {
          name: "성능 테스트 보고서",
          status: "pending",
          dueDate: "2024-03-15",
        },
      ],
      ownerId: "person-1",
      dueDate: "2024-03-31",
      status: "in_progress",
      priority: "high",
      progress: 75,
      dependencies: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "milestone-2",
      projectId: "project-1",
      quarter: "2024-Q2",
      title: "데이터 파이프라인 구축",
      description: "대용량 데이터 처리 및 전처리 파이프라인 개발",
      kpis: [
        {
          name: "데이터 처리량",
          target: "1TB/day",
          current: 800,
          unit: "GB/day",
        },
        { name: "처리 시간", target: "2시간", current: 2.5, unit: "시간" },
        { name: "에러율", target: "0.1%", current: 0.2, unit: "%" },
      ],
      deliverables: [
        { name: "파이프라인 설계서", status: "pending", dueDate: "2024-04-15" },
        { name: "ETL 코드", status: "pending", dueDate: "2024-05-30" },
        { name: "모니터링 대시보드", status: "pending", dueDate: "2024-06-15" },
      ],
      ownerId: "person-2",
      dueDate: "2024-06-30",
      status: "pending",
      priority: "medium",
      progress: 0,
      dependencies: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "milestone-3",
      projectId: "project-2",
      quarter: "2024-Q1",
      title: "사용자 인터페이스 설계",
      description: "웹 기반 사용자 인터페이스 설계 및 프로토타입 개발",
      kpis: [
        { name: "사용자 만족도", target: "4.5/5", current: 4.2, unit: "/5" },
        { name: "페이지 로딩 시간", target: "2초", current: 2.3, unit: "초" },
        { name: "접근성 점수", target: "95점", current: 92, unit: "점" },
      ],
      deliverables: [
        { name: "UI/UX 설계서", status: "completed", dueDate: "2024-01-30" },
        { name: "프로토타입", status: "completed", dueDate: "2024-02-15" },
        {
          name: "사용성 테스트 보고서",
          status: "in_progress",
          dueDate: "2024-03-31",
        },
      ],
      ownerId: "person-3",
      dueDate: "2024-03-31",
      status: "in_progress",
      priority: "high",
      progress: 80,
      dependencies: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-02-20T14:15:00Z",
    },
  ]);

  let selectedMilestone = $state<Milestone | null>(null);
  let showDetailModal = $state(false);
  let showCreateModal = $state(false);
  let searchTerm = $state("");
  let selectedProject = $state<string>("all");
  let selectedQuarter = $state<string>("all");
  let selectedStatus = $state<string>("all");

  // Form data for creating new milestone
  let formData = $state({
    projectId: "",
    quarter: "",
    title: "",
    description: "",
    ownerId: "",
    dueDate: "",
    kpis: [] as Array<{ name: string; target: string; unit: string }>,
    deliverables: [] as Array<{ name: string; dueDate: string }>,
  });

  // Get filtered milestones
  let filteredMilestones = $derived(() => {
    let filtered = milestones;

    if (searchTerm) {
      filtered = filtered.filter(
        (milestone) =>
          milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          milestone.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedProject !== "all") {
      filtered = filtered.filter(
        (milestone) => milestone.projectId === selectedProject,
      );
    }

    if (selectedQuarter !== "all") {
      filtered = filtered.filter(
        (milestone) => milestone.quarter === selectedQuarter,
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (milestone) => milestone.status === selectedStatus,
      );
    }

    return filtered.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  });

  // Get unique quarters for filter
  let availableQuarters = $derived(() => {
    const quarters = [...new Set(milestones.map((m) => m.quarter))];
    return quarters.sort();
  });

  // Get person name by ID
  function getPersonName(personId: string): string {
    const person = $employees.find((p) => p.id === personId);
    return person ? person.name : "Unknown";
  }

  // Get project name by ID
  function getProjectName(projectId: string): string {
    const project = $projects.find((p: any) => p.id === projectId);
    return project ? project.name : "Unknown Project";
  }

  // Show milestone detail
  function showMilestoneDetail(milestone: Milestone) {
    selectedMilestone = milestone;
    showDetailModal = true;
  }

  // Create new milestone
  function createMilestone() {
    if (
      !formData.projectId ||
      !formData.quarter ||
      !formData.title ||
      !formData.ownerId ||
      !formData.dueDate
    ) {
      alert("모든 필수 필드를 입력해주세요.");
      return;
    }

    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      projectId: formData.projectId,
      quarter: formData.quarter,
      title: formData.title,
      description: formData.description,
      kpis: formData.kpis.map((kpi) => ({
        ...kpi,
        current: 0,
        unit: kpi.unit,
      })),
      deliverables: formData.deliverables.map((deliverable) => ({
        ...deliverable,
        status: "pending" as const,
      })),
      ownerId: formData.ownerId,
      dueDate: formData.dueDate,
      status: "pending",
      priority: "medium",
      progress: 0,
      dependencies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    milestones.push(newMilestone);

    // Reset form
    formData = {
      projectId: "",
      quarter: "",
      title: "",
      description: "",
      ownerId: "",
      dueDate: "",
      kpis: [],
      deliverables: [],
    };

    showCreateModal = false;
  }

  // Update milestone status
  function updateMilestoneStatus(
    milestoneId: string,
    status: "pending" | "in_progress" | "completed",
  ) {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (milestone) {
      milestone.status = status;
      milestone.updatedAt = new Date().toISOString();
    }
  }

  // Add KPI
  function addKPI() {
    formData.kpis.push({ name: "", target: "", unit: "" });
  }

  // Remove KPI
  function removeKPI(index: number) {
    formData.kpis.splice(index, 1);
  }

  // Add deliverable
  function addDeliverable() {
    formData.deliverables.push({ name: "", dueDate: "" });
  }

  // Remove deliverable
  function removeDeliverable(index: number) {
    formData.deliverables.splice(index, 1);
  }

  // Format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ko-KR");
  }

  // Get status badge variant
  function getStatusVariant(status: string): "success" | "warning" | "danger" {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      default:
        return "danger";
    }
  }

  // Get status text
  function getStatusText(status: string): string {
    switch (status) {
      case "completed":
        return "완료";
      case "in_progress":
        return "진행중";
      default:
        return "대기";
    }
  }

  // Calculate progress percentage
  function calculateProgress(milestone: Milestone): number {
    const completed = milestone.deliverables.filter(
      (d) => d.status === "completed",
    ).length;
    return Math.round((completed / milestone.deliverables.length) * 100) || 0;
  }

  onMount(() => {
    // Initialize dummy data if needed
  });
</script>

<div class="container mx-auto p-6">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">분기 목표/산출물 관리</h1>
    <p class="text-gray-600">
      프로젝트별 분기 목표, KPI, 산출물을 관리하고 진행상황을 추적합니다.
    </p>
  </div>

  <!-- Filters -->
  <div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
      <div>
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1"
          >검색</label
        >
        <input
          id="search"
          type="text"
          bind:value={searchTerm}
          placeholder="제목 또는 설명 검색..."
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
          for="quarter-filter"
          class="block text-sm font-medium text-gray-700 mb-1">분기</label
        >
        <select
          id="quarter-filter"
          bind:value={selectedQuarter}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체</option>
          {#each availableQuarters() as quarter, idx (idx)}
            <!-- TODO: replace index key with a stable id when model provides one -->
            <option value={quarter}>{quarter}</option>
          {/each}
        </select>
      </div>
      <div>
        <label
          for="rnd-mil-status-filter"
          class="block text-sm font-medium text-gray-700 mb-1">상태</label
        >
        <select
          id="rnd-mil-status-filter"
          bind:value={selectedStatus}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체</option>
          <option value="pending">대기</option>
          <option value="in_progress">진행중</option>
          <option value="completed">완료</option>
        </select>
      </div>
      <div class="flex items-end">
        <button
          type="button"
          onclick={() => (showCreateModal = true)}
          class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          새 마일스톤 추가
        </button>
      </div>
    </div>
  </div>

  <!-- Milestones List -->
  <div class="grid gap-6">
    {#each filteredMilestones() as milestone}
      <Card class="p-6 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-xl font-semibold text-gray-900">
                {milestone.title}
              </h3>
              <Badge variant={getStatusVariant(milestone.status)}
                >{getStatusText(milestone.status)}</Badge
              >
            </div>
            <p class="text-gray-600 mb-3">{milestone.description}</p>
            <div class="text-sm text-gray-500 space-y-1">
              <p>
                <span class="font-medium">프로젝트:</span>
                {getProjectName(milestone.projectId)}
              </p>
              <p><span class="font-medium">분기:</span> {milestone.quarter}</p>
              <p>
                <span class="font-medium">담당자:</span>
                {getPersonName(milestone.ownerId)}
              </p>
              <p>
                <span class="font-medium">마감일:</span>
                {formatDate(milestone.dueDate)}
              </p>
            </div>
          </div>
          <div class="flex gap-2 ml-4">
            <button
              type="button"
              onclick={() => showMilestoneDetail(milestone)}
              class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="상세보기"
            >
              상세보기
            </button>
            {#if milestone.status === "pending"}
              <button
                type="button"
                onclick={() =>
                  updateMilestoneStatus(milestone.id, "in_progress")}
                class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                시작
              </button>
            {/if}
            {#if milestone.status === "in_progress"}
              <button
                type="button"
                onclick={() => updateMilestoneStatus(milestone.id, "completed")}
                class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                완료
              </button>
            {/if}
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>진행률</span>
            <span>{calculateProgress(milestone)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style:width="{calculateProgress(milestone)}%"
            ></div>
          </div>
        </div>

        <!-- KPIs -->
        {#if milestone.kpis.length > 0}
          <div class="mb-4">
            <h4 class="font-medium text-gray-900 mb-2">KPI 현황</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              {#each milestone.kpis as kpi, i (i)}
                <div class="bg-gray-50 p-3 rounded-md">
                  <div class="text-sm font-medium text-gray-900">
                    {kpi.name}
                  </div>
                  <div class="text-sm text-gray-600">
                    목표: {kpi.target} | 현재: {kpi.current}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Deliverables -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">산출물 현황</h4>
          <div class="space-y-2">
            {#each milestone.deliverables as deliverable, i (i)}
              <div
                class="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span class="text-sm text-gray-900">{deliverable.name}</span>
                <div class="flex items-center gap-2">
                  <Badge variant={getStatusVariant(deliverable.status)}>
                    {getStatusText(deliverable.status)}
                  </Badge>
                  <span class="text-xs text-gray-500"
                    >{formatDate(deliverable.dueDate)}</span
                  >
                </div>
              </div>
            {/each}
          </div>
        </div>
      </Card>
    {/each}
  </div>

  {#if filteredMilestones().length === 0}
    <div class="text-center py-12">
      <div class="text-gray-400 text-6xl mb-4">🎯</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        마일스톤이 없습니다
      </h3>
      <p class="text-gray-500">새로운 분기 목표를 설정해보세요.</p>
    </div>
  {/if}
</div>

<!-- Detail Modal -->
<Modal bind:open={showDetailModal} title="마일스톤 상세">
  {#if selectedMilestone}
    <div class="space-y-6">
      <div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">
          {selectedMilestone.title}
        </h3>
        <p class="text-gray-600 mb-4">{selectedMilestone.description}</p>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700">프로젝트:</span>
            <span class="ml-2"
              >{getProjectName(selectedMilestone.projectId)}</span
            >
          </div>
          <div>
            <span class="font-medium text-gray-700">분기:</span>
            <span class="ml-2">{selectedMilestone.quarter}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">담당자:</span>
            <span class="ml-2">{getPersonName(selectedMilestone.ownerId)}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">마감일:</span>
            <span class="ml-2">{formatDate(selectedMilestone.dueDate)}</span>
          </div>
        </div>
      </div>

      <!-- KPIs -->
      {#if selectedMilestone.kpis.length > 0}
        <div>
          <h4 class="font-medium text-gray-900 mb-3">KPI 현황</h4>
          <div class="space-y-3">
            {#each selectedMilestone.kpis as kpi, i (i)}
              <div class="bg-gray-50 p-4 rounded-md">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-medium text-gray-900">{kpi.name}</span>
                  <span class="text-sm text-gray-600">{kpi.unit}</span>
                </div>
                <div class="flex justify-between text-sm text-gray-600">
                  <span>목표: {kpi.target}</span>
                  <span>현재: {kpi.current}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Deliverables -->
      <div>
        <h4 class="font-medium text-gray-900 mb-3">산출물 현황</h4>
        <div class="space-y-2">
          {#each selectedMilestone.deliverables as deliverable, i (i)}
            <div
              class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <span class="text-gray-900">{deliverable.name}</span>
              <div class="flex items-center gap-3">
                <Badge variant={getStatusVariant(deliverable.status)}>
                  {getStatusText(deliverable.status)}
                </Badge>
                <span class="text-sm text-gray-500"
                  >{formatDate(deliverable.dueDate)}</span
                >
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</Modal>

<!-- Create Modal -->
<Modal bind:open={showCreateModal} title="새 마일스톤 추가">
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
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
          for="create-quarter"
          class="block text-sm font-medium text-gray-700 mb-1">분기 *</label
        >
        <input
          id="create-quarter"
          type="text"
          bind:value={formData.quarter}
          placeholder="예: 2024-Q1"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
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
        placeholder="마일스톤 제목"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label
        for="create-description"
        class="block text-sm font-medium text-gray-700 mb-1">설명</label
      >
      <textarea
        id="create-description"
        bind:value={formData.description}
        rows="3"
        placeholder="마일스톤 설명"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label
          for="create-owner"
          class="block text-sm font-medium text-gray-700 mb-1">담당자 *</label
        >
        <select
          id="create-owner"
          bind:value={formData.ownerId}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">담당자 선택</option>
          {#each $employees as person, i (i)}
            <option value={person.id}>{person.name}</option>
          {/each}
        </select>
      </div>
      <div>
        <label
          for="create-due-date"
          class="block text-sm font-medium text-gray-700 mb-1">마감일 *</label
        >
        <input
          id="create-due-date"
          type="date"
          bind:value={formData.dueDate}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <!-- KPIs -->
    <div>
      <div class="flex justify-between items-center mb-2">
        <div class="block text-sm font-medium text-gray-700">KPI</div>
        <button
          type="button"
          onclick={addKPI}
          class="text-sm text-blue-600 hover:text-blue-700"
        >
          + KPI 추가
        </button>
      </div>
      <div class="space-y-2">
        {#each formData.kpis as kpi, index (index)}
          <div class="flex gap-2 items-center">
            <input
              type="text"
              bind:value={kpi.name}
              placeholder="KPI 이름"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              bind:value={kpi.target}
              placeholder="목표값"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              bind:value={kpi.unit}
              placeholder="단위"
              class="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onclick={() => removeKPI(index)}
              class="text-red-600 hover:text-red-700"
            >
              삭제
            </button>
          </div>
        {/each}
      </div>
    </div>

    <!-- Deliverables -->
    <div>
      <div class="flex justify-between items-center mb-2">
        <div class="block text-sm font-medium text-gray-700">산출물</div>
        <button
          type="button"
          onclick={addDeliverable}
          class="text-sm text-blue-600 hover:text-blue-700"
        >
          + 산출물 추가
        </button>
      </div>
      <div class="space-y-2">
        {#each formData.deliverables as deliverable, index (index)}
          <div class="flex gap-2 items-center">
            <input
              type="text"
              bind:value={deliverable.name}
              placeholder="산출물 이름"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              bind:value={deliverable.dueDate}
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onclick={() => removeDeliverable(index)}
              class="text-red-600 hover:text-red-700"
            >
              삭제
            </button>
          </div>
        {/each}
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-4">
      <button
        type="button"
        onclick={() => (showCreateModal = false)}
        class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        취소
      </button>
      <button
        type="button"
        onclick={createMilestone}
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        생성
      </button>
    </div>
  </div>
</Modal>
