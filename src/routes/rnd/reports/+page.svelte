<script lang="ts">
  import { logger } from "$lib/utils/logger";

  import { onMount } from "svelte";
  import { projects, employees } from "$lib/stores/rd";
  import { reports, expenseItems } from "$lib/stores/rnd/mock-data";
  import Badge from "$lib/components/ui/Badge.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import type { Report } from "$lib/stores/rnd/types";

  // Extended Report interface for this page
  interface ExtendedReport extends Omit<Report, "summaryJson"> {
    summary: {
      progress: number;
      budgetUtilization: number;
      deliverablesCompleted: number;
      totalDeliverables: number;
      risks: string[];
      achievements: string[];
      nextWeekGoals: string[];
    };
    summaryJson: Record<string, any>; // Add required summaryJson to match Report interface
  }

  // Mock reports data
  let _localReports = $state<ExtendedReport[]>([
    {
      id: "report-1",
      projectId: "project-1",
      type: "weekly",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-07",
      summary: {
        progress: 75,
        budgetUtilization: 68,
        deliverablesCompleted: 3,
        totalDeliverables: 4,
        risks: ["예산 초과 가능성", "인력 부족"],
        achievements: ["AI 모델 프로토타입 완성", "데이터 수집 완료"],
        nextWeekGoals: ["모델 성능 최적화", "사용자 테스트 진행"],
      },
      fileUrl: "/reports/weekly-2024-01-01.pdf",
      generatedAt: "2024-01-08T09:00:00Z",
      generatedBy: "emp-001",
      summaryJson: {
        progress: 75,
        budgetUtilization: 68,
        deliverablesCompleted: 3,
        totalDeliverables: 4,
        risks: ["예산 초과 가능성", "인력 부족"],
        achievements: ["AI 모델 프로토타입 완성", "데이터 수집 완료"],
        nextWeekGoals: ["모델 성능 최적화", "사용자 테스트 진행"],
      },
    },
    {
      id: "report-2",
      projectId: "project-1",
      type: "quarterly",
      periodStart: "2024-01-01",
      periodEnd: "2024-03-31",
      summary: {
        progress: 85,
        budgetUtilization: 72,
        deliverablesCompleted: 8,
        totalDeliverables: 10,
        risks: ["일정 지연", "기술적 도전"],
        achievements: ["핵심 기능 개발 완료", "사용자 피드백 수집"],
        nextWeekGoals: ["성능 최적화", "보안 강화"],
      },
      fileUrl: "/reports/quarterly-2024-Q1.pdf",
      generatedAt: "2024-04-01T10:00:00Z",
      generatedBy: "emp-002",
      summaryJson: {
        progress: 85,
        budgetUtilization: 78,
        deliverablesCompleted: 8,
        totalDeliverables: 10,
        risks: ["기술적 도전", "일정 지연"],
        achievements: ["핵심 기능 완성", "사용자 피드백 수집"],
        nextWeekGoals: ["성능 최적화", "문서화 완료"],
      },
    },
    {
      id: "report-3",
      projectId: "project-2",
      type: "weekly",
      periodStart: "2024-01-08",
      periodEnd: "2024-01-14",
      summary: {
        progress: 60,
        budgetUtilization: 45,
        deliverablesCompleted: 2,
        totalDeliverables: 5,
        risks: ["요구사항 변경"],
        achievements: ["UI 설계 완료", "프로토타입 개발 시작"],
        nextWeekGoals: ["프론트엔드 개발", "백엔드 API 설계"],
      },
      fileUrl: "/reports/weekly-2024-01-08.pdf",
      generatedAt: "2024-01-15T09:30:00Z",
      generatedBy: "emp-003",
      summaryJson: {
        progress: 60,
        budgetUtilization: 45,
        deliverablesCompleted: 2,
        totalDeliverables: 5,
        risks: ["요구사항 변경"],
        achievements: ["UI 설계 완료", "프로토타입 개발 시작"],
        nextWeekGoals: ["프론트엔드 개발", "백엔드 API 설계"],
      },
    },
  ]);

  let selectedReport = $state<ExtendedReport | null>(null);
  let showDetailModal = $state(false);
  let showGenerateModal = $state(false);
  let searchTerm = $state("");
  let selectedProject = $state<string>("all");
  let selectedType = $state<string>("all");
  let selectedPeriod = $state<string>("all");

  // Form data for generating new report
  let formData = $state({
    projectId: "",
    type: "weekly" as "weekly" | "quarterly",
    periodStart: "",
    periodEnd: "",
    includeBudget: true,
    includeDeliverables: true,
    includeRisks: true,
    includeAchievements: true,
  });

  // Get filtered reports
  let filteredReports = $derived(() => {
    let filtered = $reports;

    if (searchTerm) {
      filtered = filtered.filter(
        (report: any) =>
          report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.type.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedProject !== "all") {
      filtered = filtered.filter(
        (report: any) => report.projectId === selectedProject,
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((report: any) => report.type === selectedType);
    }

    if (selectedPeriod !== "all") {
      filtered = filtered.filter(
        (report: any) =>
          report.periodStart.startsWith(selectedPeriod) ||
          report.periodEnd.startsWith(selectedPeriod),
      );
    }

    return filtered.sort(
      (a: any, b: any) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
    );
  });

  // Get unique periods for filter
  let availablePeriods = $derived(() => {
    const periods = [
      ...new Set($reports.map((r: any) => r.periodStart.substring(0, 7))),
    ];
    return periods.sort().reverse();
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

  // Show report detail
  function showReportDetail(report: ExtendedReport) {
    selectedReport = report;
    showDetailModal = true;
  }

  // Generate new report
  function generateReport() {
    if (!formData.projectId || !formData.periodStart || !formData.periodEnd) {
      alert("모든 필수 필드를 입력해주세요.");
      return;
    }

    // Calculate summary data based on project data
    const _project = $projects.find((p: any) => p.id === formData.projectId);
    const _projectExpenses = $expenseItems.filter(
      (e: any) => e.projectId === formData.projectId,
    );

    // Mock calculation - in real implementation, this would be calculated from actual data
    const progress = Math.floor(Math.random() * 40) + 60; // 60-100%
    const budgetUtilization = Math.floor(Math.random() * 30) + 50; // 50-80%
    const deliverablesCompleted = Math.floor(Math.random() * 5) + 1;
    const totalDeliverables =
      deliverablesCompleted + Math.floor(Math.random() * 3) + 1;

    const newReport: ExtendedReport = {
      id: `report-${Date.now()}`,
      projectId: formData.projectId,
      type: formData.type,
      periodStart: formData.periodStart,
      periodEnd: formData.periodEnd,
      summary: {
        progress,
        budgetUtilization,
        deliverablesCompleted,
        totalDeliverables,
        risks: ["일정 지연 가능성", "예산 초과 위험"],
        achievements: ["주요 기능 개발 완료", "테스트 진행"],
        nextWeekGoals: ["성능 최적화", "문서화 작업"],
      },
      fileUrl: `/reports/${formData.type}-${formData.periodStart}.pdf`,
      generatedAt: new Date().toISOString(),
      generatedBy: "emp-001", // Current user
      summaryJson: {
        progress,
        budgetUtilization,
        deliverablesCompleted,
        totalDeliverables,
        risks: ["일정 지연 가능성", "예산 초과 위험"],
        achievements: ["주요 기능 개발 완료", "테스트 진행"],
        nextWeekGoals: ["성능 최적화", "문서화 작업"],
      },
    };

    $reports.push(newReport);

    // Reset form
    formData = {
      projectId: "",
      type: "weekly",
      periodStart: "",
      periodEnd: "",
      includeBudget: true,
      includeDeliverables: true,
      includeRisks: true,
      includeAchievements: true,
    };

    showGenerateModal = false;
  }

  // Download report
  function downloadReport(report: ExtendedReport) {
    // In real implementation, this would download the actual file
    logger.log("Downloading report:", report.fileUrl);
    alert(`리포트 다운로드: ${report.fileUrl}`);
  }

  // Format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ko-KR");
  }

  // Get type badge variant
  function getTypeVariant(type: string): "success" | "warning" | "danger" {
    switch (type) {
      case "quarterly":
        return "success";
      case "weekly":
        return "warning";
      default:
        return "danger";
    }
  }

  // Get type text
  function getTypeText(type: string): string {
    switch (type) {
      case "quarterly":
        return "분기";
      case "weekly":
        return "주간";
      default:
        return "기타";
    }
  }

  // Get progress color
  function getProgressColor(progress: number): string {
    if (progress >= 80) return "text-green-600";
    if (progress >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  // Get budget utilization color
  function getBudgetColor(utilization: number): string {
    if (utilization <= 70) return "text-green-600";
    if (utilization <= 90) return "text-yellow-600";
    return "text-red-600";
  }

  // Auto-generate weekly reports for all projects
  function generateWeeklyReports() {
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    $projects.forEach((project: any) => {
      const existingReport = $reports.find(
        (r: any) =>
          r.projectId === project.id &&
          r.type === "weekly" &&
          r.periodStart === weekStart.toISOString().split("T")[0],
      );

      if (!existingReport) {
        const progress = Math.floor(Math.random() * 40) + 60;
        const budgetUtilization = Math.floor(Math.random() * 30) + 50;
        const deliverablesCompleted = Math.floor(Math.random() * 3) + 1;
        const totalDeliverables =
          deliverablesCompleted + Math.floor(Math.random() * 2) + 1;

        const newReport: ExtendedReport = {
          id: `report-auto-${Date.now()}-${project.id}`,
          projectId: project.id,
          type: "weekly",
          periodStart: weekStart.toISOString().split("T")[0],
          periodEnd: weekEnd.toISOString().split("T")[0],
          summary: {
            progress,
            budgetUtilization,
            deliverablesCompleted,
            totalDeliverables,
            risks: ["일정 관리", "품질 보증"],
            achievements: ["주요 작업 완료", "테스트 진행"],
            nextWeekGoals: ["다음 단계 진행", "문서화"],
          },
          fileUrl: `/reports/weekly-${weekStart.toISOString().split("T")[0]}-${project.id}.pdf`,
          generatedAt: new Date().toISOString(),
          generatedBy: "emp-001",
          summaryJson: {
            progress,
            budgetUtilization,
            deliverablesCompleted,
            totalDeliverables,
            risks: ["일정 관리", "품질 보증"],
            achievements: ["주요 작업 완료", "테스트 진행"],
            nextWeekGoals: ["다음 단계 진행", "문서화"],
          },
        };

        $reports.push(newReport);
      }
    });

    alert("모든 프로젝트의 주간 리포트가 자동 생성되었습니다.");
  }

  onMount(() => {
    // Initialize dummy data if needed
  });
</script>

<div class="container mx-auto p-6">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">진도보고 관리</h1>
    <p class="text-gray-600">
      프로젝트별 주간/분기 진도보고서를 생성, 관리하고 자동화된 리포트를
      확인합니다.
    </p>
  </div>

  <!-- Action Buttons -->
  <div class="flex gap-4 mb-6">
    <button
      type="button"
      onclick={() => (showGenerateModal = true)}
      class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      리포트 생성
    </button>
    <button
      type="button"
      onclick={generateWeeklyReports}
      class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      주간 리포트 자동 생성
    </button>
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
          placeholder="리포트 ID 또는 타입 검색..."
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
          for="type-filter"
          class="block text-sm font-medium text-gray-700 mb-1">타입</label
        >
        <select
          id="type-filter"
          bind:value={selectedType}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체</option>
          <option value="weekly">주간</option>
          <option value="quarterly">분기</option>
        </select>
      </div>
      <div>
        <label
          for="period-filter"
          class="block text-sm font-medium text-gray-700 mb-1">기간</label
        >
        <select
          id="period-filter"
          bind:value={selectedPeriod}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체</option>
          {#each availablePeriods() as period, idx (idx)}
            <!-- TODO: replace index key with a stable id when model provides one -->
            <option value={period}>{period}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Reports List -->
  <div class="grid gap-6">
    {#each filteredReports() as report}
      <Card class="p-6 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-xl font-semibold text-gray-900">
                {getTypeText(report.type)} 진도보고서
              </h3>
              <Badge variant={getTypeVariant(report.type)}>
                {getTypeText(report.type)}
              </Badge>
            </div>
            <div class="text-sm text-gray-600 mb-3">
              <span class="font-medium">프로젝트:</span>
              {getProjectName(report.projectId)} |
              <span class="font-medium">기간:</span>
              {formatDate(report.periodStart)} ~ {formatDate(report.periodEnd)} |
              <span class="font-medium">생성자:</span>
              {getPersonName(report.generatedBy)} |
              <span class="font-medium">생성일:</span>
              {formatDate(report.generatedAt)}
            </div>
          </div>
          <div class="flex gap-2 ml-4">
            <button
              type="button"
              onclick={() => showReportDetail(report as any)}
              class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="상세보기"
            >
              상세보기
            </button>
            <button
              type="button"
              onclick={() => downloadReport(report as any)}
              class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              다운로드
            </button>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-gray-50 p-4 rounded-md">
            <div class="text-sm text-gray-600 mb-1">진행률</div>
            <div
              class="text-2xl font-bold {getProgressColor(
                (report as any).summary.progress,
              )}"
            >
              {(report as any).summary.progress}%
            </div>
          </div>
          <div class="bg-gray-50 p-4 rounded-md">
            <div class="text-sm text-gray-600 mb-1">예산 집행률</div>
            <div
              class="text-2xl font-bold {getBudgetColor(
                (report as any).summary.budgetUtilization,
              )}"
            >
              {(report as any).summary.budgetUtilization}%
            </div>
          </div>
          <div class="bg-gray-50 p-4 rounded-md">
            <div class="text-sm text-gray-600 mb-1">산출물 완료</div>
            <div class="text-2xl font-bold text-gray-900">
              {(report as any).summary.deliverablesCompleted}/{(report as any)
                .summary.totalDeliverables}
            </div>
          </div>
          <div class="bg-gray-50 p-4 rounded-md">
            <div class="text-sm text-gray-600 mb-1">리스크</div>
            <div class="text-2xl font-bold text-red-600">
              {(report as any).summary.risks.length}
            </div>
          </div>
        </div>

        <!-- Quick Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-gray-900 mb-2">주요 성과</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              {#each (report as any).summary.achievements.slice(0, 2) as achievement, idx (idx)}
                <!-- TODO: replace index key with a stable id when model provides one -->
                <li class="flex items-center gap-2">
                  <span class="text-green-500">✓</span>
                  {achievement}
                </li>
              {/each}
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 mb-2">다음 주 목표</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              {#each (report as any).summary.nextWeekGoals.slice(0, 2) as goal, idx (idx)}
                <!-- TODO: replace index key with a stable id when model provides one -->
                <li class="flex items-center gap-2">
                  <span class="text-blue-500">→</span>
                  {goal}
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </Card>
    {/each}
  </div>

  {#if filteredReports().length === 0}
    <div class="text-center py-12">
      <div class="text-gray-400 text-6xl mb-4">📊</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">리포트가 없습니다</h3>
      <p class="text-gray-500">새로운 진도보고서를 생성해보세요.</p>
    </div>
  {/if}
</div>

<!-- Detail Modal -->
<Modal bind:open={showDetailModal} title="리포트 상세">
  {#if selectedReport}
    <div class="space-y-6">
      <div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">
          {getTypeText(selectedReport.type)} 진도보고서
        </h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700">프로젝트:</span>
            <span class="ml-2">{getProjectName(selectedReport.projectId)}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">기간:</span>
            <span class="ml-2"
              >{formatDate(selectedReport.periodStart)} ~ {formatDate(
                selectedReport.periodEnd,
              )}</span
            >
          </div>
          <div>
            <span class="font-medium text-gray-700">생성자:</span>
            <span class="ml-2">{getPersonName(selectedReport.generatedBy)}</span
            >
          </div>
          <div>
            <span class="font-medium text-gray-700">생성일:</span>
            <span class="ml-2">{formatDate(selectedReport.generatedAt)}</span>
          </div>
        </div>
      </div>

      <!-- Summary Metrics -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 p-4 rounded-md">
          <div class="text-sm text-gray-600 mb-1">진행률</div>
          <div
            class="text-3xl font-bold {getProgressColor(
              selectedReport.summary.progress,
            )}"
          >
            {selectedReport.summary.progress}%
          </div>
        </div>
        <div class="bg-gray-50 p-4 rounded-md">
          <div class="text-sm text-gray-600 mb-1">예산 집행률</div>
          <div
            class="text-3xl font-bold {getBudgetColor(
              selectedReport.summary.budgetUtilization,
            )}"
          >
            {selectedReport.summary.budgetUtilization}%
          </div>
        </div>
      </div>

      <!-- Achievements -->
      <div>
        <h4 class="font-medium text-gray-900 mb-3">주요 성과</h4>
        <ul class="space-y-2">
          {#each selectedReport.summary.achievements as achievement, i (i)}
            <li class="flex items-center gap-2 p-2 bg-green-50 rounded">
              <span class="text-green-500">✓</span>
              <span class="text-gray-900">{achievement}</span>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Next Week Goals -->
      <div>
        <h4 class="font-medium text-gray-900 mb-3">다음 주 목표</h4>
        <ul class="space-y-2">
          {#each selectedReport.summary.nextWeekGoals as goal, i (i)}
            <li class="flex items-center gap-2 p-2 bg-blue-50 rounded">
              <span class="text-blue-500">→</span>
              <span class="text-gray-900">{goal}</span>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Risks -->
      <div>
        <h4 class="font-medium text-gray-900 mb-3">리스크 및 이슈</h4>
        <ul class="space-y-2">
          {#each selectedReport.summary.risks as risk, i (i)}
            <li class="flex items-center gap-2 p-2 bg-red-50 rounded">
              <span class="text-red-500">⚠</span>
              <span class="text-gray-900">{risk}</span>
            </li>
          {/each}
        </ul>
      </div>

      <div class="flex justify-end">
        <button
          type="button"
          onclick={() => selectedReport && downloadReport(selectedReport)}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          리포트 다운로드
        </button>
      </div>
    </div>
  {/if}
</Modal>

<!-- Generate Modal -->
<Modal bind:open={showGenerateModal} title="리포트 생성">
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label
          for="generate-project"
          class="block text-sm font-medium text-gray-700 mb-1">프로젝트 *</label
        >
        <select
          id="generate-project"
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
          for="generate-type"
          class="block text-sm font-medium text-gray-700 mb-1"
          >리포트 타입 *</label
        >
        <select
          id="generate-type"
          bind:value={formData.type}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="weekly">주간</option>
          <option value="quarterly">분기</option>
        </select>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label
          for="generate-start"
          class="block text-sm font-medium text-gray-700 mb-1">시작일 *</label
        >
        <input
          id="generate-start"
          type="date"
          bind:value={formData.periodStart}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label
          for="generate-end"
          class="block text-sm font-medium text-gray-700 mb-1">종료일 *</label
        >
        <input
          id="generate-end"
          type="date"
          bind:value={formData.periodEnd}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
    <div>
      <div class="block text-sm font-medium text-gray-700 mb-2">
        포함할 내용
      </div>
      <div class="space-y-2">
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={formData.includeBudget}
            class="mr-2"
          />
          <span class="text-sm text-gray-700">예산 집행 현황</span>
        </label>
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={formData.includeDeliverables}
            class="mr-2"
          />
          <span class="text-sm text-gray-700">산출물 현황</span>
        </label>
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={formData.includeRisks}
            class="mr-2"
          />
          <span class="text-sm text-gray-700">리스크 및 이슈</span>
        </label>
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={formData.includeAchievements}
            class="mr-2"
          />
          <span class="text-sm text-gray-700">주요 성과</span>
        </label>
      </div>
    </div>
    <div class="flex justify-end gap-2 pt-4">
      <button
        type="button"
        onclick={() => (showGenerateModal = false)}
        class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        취소
      </button>
      <button
        type="button"
        onclick={generateReport}
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        생성
      </button>
    </div>
  </div>
</Modal>
