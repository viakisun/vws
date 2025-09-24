// Project Management Store
// 프로젝트 관리 시스템의 메인 스토어

import { logger } from "$lib/utils/logger";
import { derived, writable } from "svelte/store";
import type {
  BudgetAlert,
  BudgetSummaryByYear,
  EmployeeParticipationSummary,
  ParticipationRate,
  ParticipationRateAlert,
  ParticipationRateFilters,
  ParticipationRateHistory,
  ParticipationRateStats,
  Project,
  ProjectBudget,
  ProjectFilters,
  ProjectMember,
  ProjectStatusStats,
  ProjectSummary,
} from "./types";

// 기본 상태
const initialState = {
  projects: [] as Project[],
  projectMembers: [] as ProjectMember[],
  projectBudgets: [] as ProjectBudget[],
  participationRates: [] as ParticipationRate[],
  participationRateHistory: [] as ParticipationRateHistory[],
  summary: null as ProjectSummary | null,
  employeeParticipationSummary: [] as EmployeeParticipationSummary[],
  budgetSummaryByYear: [] as BudgetSummaryByYear[],
  alerts: [] as (ParticipationRateAlert | BudgetAlert)[],
  loading: false,
  error: null as string | null,
};

// 메인 스토어
export const projectStore = writable(initialState);

// 프로젝트 관련 액션들
export const projectActions = {
  // 프로젝트 목록 로드
  async loadProjects(filters?: ProjectFilters) {
    projectStore.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await fetch(
        `/api/project-management/projects?${params}`,
      );
      if (!response.ok)
        throw new Error("프로젝트 목록을 불러오는데 실패했습니다.");

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        projects: data.data || [],
        loading: false,
      }));
    } catch (error) {
      projectStore.update((state) => ({
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      }));
    }
  },

  // 프로젝트 생성
  async createProject(projectData: any) {
    projectStore.update((state) => ({ ...state, loading: true, error: null }));

    try {
      logger.log("프로젝트 생성 요청 데이터:", projectData);

      const response = await fetch("/api/project-management/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      logger.log("프로젝트 생성 응답 상태:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("프로젝트 생성 API 에러 응답:", errorData);
        throw new Error(errorData.message || "프로젝트 생성에 실패했습니다.");
      }

      const data = await response.json();
      logger.log("프로젝트 생성 성공 응답:", data);

      projectStore.update((state) => ({
        ...state,
        projects: [...state.projects, data.data],
        loading: false,
      }));

      return data.data;
    } catch (error) {
      logger.error("프로젝트 생성 API 호출 실패:", error);
      logger.error("요청 데이터:", projectData);

      projectStore.update((state) => ({
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      }));
      throw error;
    }
  },

  // 프로젝트 수정
  async updateProject(id: string, projectData: any) {
    projectStore.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const response = await fetch(`/api/project-management/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "프로젝트 수정에 실패했습니다.");
      }

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        projects: state.projects.map((p) => (p.id === id ? data.data : p)),
        loading: false,
      }));

      return data.data;
    } catch (error) {
      projectStore.update((state) => ({
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      }));
      throw error;
    }
  },

  // 프로젝트 삭제
  async deleteProject(id: string) {
    projectStore.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const response = await fetch(`/api/project-management/projects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "프로젝트 삭제에 실패했습니다.");
      }

      projectStore.update((state) => ({
        ...state,
        projects: state.projects.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (error) {
      projectStore.update((state) => ({
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      }));
      throw error;
    }
  },

  // 프로젝트 요약 정보 로드
  async loadProjectSummary() {
    try {
      const response = await fetch("/api/project-management/summary");
      if (!response.ok)
        throw new Error("프로젝트 요약 정보를 불러오는데 실패했습니다.");

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        summary: data.data,
      }));
    } catch (error) {
      logger.error("프로젝트 요약 정보 로드 실패:", error);
    }
  },
};

// 프로젝트 멤버 관련 액션들
export const projectMemberActions = {
  // 프로젝트 멤버 목록 로드
  async loadProjectMembers(projectId: string) {
    try {
      const response = await fetch(
        `/api/project-management/projects/${projectId}/members`,
      );
      if (!response.ok)
        throw new Error("프로젝트 멤버 목록을 불러오는데 실패했습니다.");

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        projectMembers: data.data || [],
      }));
    } catch (error) {
      logger.error("프로젝트 멤버 목록 로드 실패:", error);
    }
  },

  // 프로젝트 멤버 추가
  async addProjectMember(memberData: any) {
    projectStore.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const response = await fetch("/api/project-management/project-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "프로젝트 멤버 추가에 실패했습니다.",
        );
      }

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        projectMembers: [...state.projectMembers, data.data],
        loading: false,
      }));

      return data.data;
    } catch (error) {
      projectStore.update((state) => ({
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      }));
      throw error;
    }
  },

  // 프로젝트 멤버 수정
  async updateProjectMember(id: string, memberData: any) {
    projectStore.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/project-management/project-members/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "프로젝트 멤버 수정에 실패했습니다.",
        );
      }

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        projectMembers: state.projectMembers.map((m) =>
          m.id === id ? data.data : m,
        ),
        loading: false,
      }));

      return data.data;
    } catch (error) {
      projectStore.update((state) => ({
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      }));
      throw error;
    }
  },

  // 프로젝트 멤버 삭제
  async deleteProjectMember(id: string) {
    projectStore.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/project-management/project-members/${id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "프로젝트 멤버 삭제에 실패했습니다.",
        );
      }

      projectStore.update((state) => ({
        ...state,
        projectMembers: state.projectMembers.filter((m) => m.id !== id),
        loading: false,
      }));
    } catch (error) {
      projectStore.update((state) => ({
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      }));
      throw error;
    }
  },
};

// 참여율 관리 관련 액션들
export const participationRateActions = {
  // 참여율 현황 로드
  async loadParticipationRates(filters?: ParticipationRateFilters) {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await fetch(
        `/api/project-management/participation-rates?${params}`,
      );
      if (!response.ok)
        throw new Error("참여율 현황을 불러오는데 실패했습니다.");

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        participationRates: data.data || [],
      }));
    } catch (error) {
      logger.error("참여율 현황 로드 실패:", error);
    }
  },

  // 개인별 참여율 요약 로드
  async loadEmployeeParticipationSummary() {
    try {
      const response = await fetch(
        "/api/project-management/participation-rates/summary",
      );
      if (!response.ok)
        throw new Error("개인별 참여율 요약을 불러오는데 실패했습니다.");

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        employeeParticipationSummary: data.data || [],
      }));
    } catch (error) {
      logger.error("개인별 참여율 요약 로드 실패:", error);
    }
  },

  // 참여율 업데이트
  async updateParticipationRate(rateData: any) {
    projectStore.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const response = await fetch(
        "/api/project-management/participation-rates",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rateData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "참여율 업데이트에 실패했습니다.");
      }

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        participationRates: state.participationRates.map((r) =>
          r.employeeId === rateData.employeeId &&
          r.projectId === rateData.projectId
            ? { ...r, participationRate: rateData.participationRate }
            : r,
        ),
        loading: false,
      }));

      return data.data;
    } catch (error) {
      projectStore.update((state) => ({
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      }));
      throw error;
    }
  },

  // 참여율 변경 이력 로드
  async loadParticipationRateHistory(employeeId?: string, projectId?: string) {
    try {
      const params = new URLSearchParams();
      if (employeeId) params.append("employeeId", employeeId);
      if (projectId) params.append("projectId", projectId);

      const response = await fetch(
        `/api/project-management/participation-rates/history?${params}`,
      );
      if (!response.ok)
        throw new Error("참여율 변경 이력을 불러오는데 실패했습니다.");

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        participationRateHistory: data.data || [],
      }));
    } catch (error) {
      logger.error("참여율 변경 이력 로드 실패:", error);
    }
  },
};

// 사업비 관리 관련 액션들
export const budgetActions = {
  // 프로젝트 사업비 로드
  async loadProjectBudgets(projectId: string) {
    try {
      const response = await fetch(
        `/api/project-management/projects/${projectId}/budgets`,
      );
      if (!response.ok)
        throw new Error("프로젝트 사업비를 불러오는데 실패했습니다.");

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        projectBudgets: data.data || [],
      }));
    } catch (error) {
      logger.error("프로젝트 사업비 로드 실패:", error);
    }
  },

  // 연차별 사업비 요약 로드
  async loadBudgetSummaryByYear() {
    try {
      const response = await fetch(
        "/api/project-management/budgets/summary-by-year",
      );
      if (!response.ok)
        throw new Error("연차별 사업비 요약을 불러오는데 실패했습니다.");

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        budgetSummaryByYear: data.data || [],
      }));
    } catch (error) {
      logger.error("연차별 사업비 요약 로드 실패:", error);
    }
  },

  // 사업비 생성/수정
  async saveProjectBudget(budgetData: any) {
    projectStore.update((state) => ({ ...state, loading: true, error: null }));

    try {
      const isUpdate = budgetData.id;
      const url = isUpdate
        ? `/api/project-management/project-budgets/${budgetData.id}`
        : "/api/project-management/project-budgets";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "사업비 저장에 실패했습니다.");
      }

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        projectBudgets: isUpdate
          ? state.projectBudgets.map((b) =>
              b.id === budgetData.id ? data.data : b,
            )
          : [...state.projectBudgets, data.data],
        loading: false,
      }));

      return data.data;
    } catch (error) {
      projectStore.update((state) => ({
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      }));
      throw error;
    }
  },
};

// 알림 관련 액션들
export const alertActions = {
  // 알림 로드
  async loadAlerts() {
    try {
      const response = await fetch("/api/project-management/alerts");
      if (!response.ok) throw new Error("알림을 불러오는데 실패했습니다.");

      const data = await response.json();
      projectStore.update((state) => ({
        ...state,
        alerts: data.data || [],
      }));
    } catch (error) {
      logger.error("알림 로드 실패:", error);
    }
  },
};

// Derived stores
export const activeProjects = derived(projectStore, ($store) =>
  $store.projects.filter((p) => p.status === "active"),
);

export const projectStatusStats = derived(projectStore, ($store) => {
  const stats: ProjectStatusStats = {
    planning: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    suspended: 0,
  };

  $store.projects.forEach((project) => {
    stats[project.status] = (stats[project.status] || 0) + 1;
  });

  return stats;
});

export const overParticipationEmployees = derived(projectStore, ($store) =>
  $store.employeeParticipationSummary.filter(
    (emp) => emp.participationStatus === "OVER_LIMIT",
  ),
);

export const participationRateStats = derived(projectStore, ($store) => {
  const summary = $store.employeeParticipationSummary;
  const stats: ParticipationRateStats = {
    overLimit: summary.filter((emp) => emp.participationStatus === "OVER_LIMIT")
      .length,
    full: summary.filter((emp) => emp.participationStatus === "FULL").length,
    available: summary.filter((emp) => emp.participationStatus === "AVAILABLE")
      .length,
    averageRate:
      summary.length > 0
        ? summary.reduce((sum, emp) => sum + emp.totalParticipationRate, 0) /
          summary.length
        : 0,
  };

  return stats;
});

// 초기 데이터 로드
export const initializeProjectManagement = async () => {
  await Promise.all([
    projectActions.loadProjectSummary(),
    participationRateActions.loadEmployeeParticipationSummary(),
    budgetActions.loadBudgetSummaryByYear(),
    alertActions.loadAlerts(),
  ]);
};
