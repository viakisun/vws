import { logger } from "$lib/utils/logger";
import { writable } from "svelte/store";
import { logAudit } from "./core";
import type { ReplacementRecommendation } from "./types";

// 대체 추천 시스템
export const replacementRecommendations = writable<ReplacementRecommendation[]>(
  [],
);
export const skillMatrix = writable<Record<string, unknown[]>>({});
export const availabilityMatrix = writable<Record<string, unknown>>({});

// 인력 이탈 시 대체 추천 생성
export function generateReplacementRecommendation(
  projectId: string,
  departingPersonId: string,
  reason: "resignation" | "transfer" | "medical" | "other",
  effectiveDate: string,
  urgency: "low" | "medium" | "high" | "critical",
): string {
  const recommendationId = crypto.randomUUID();

  // 대체자 추천 로직 실행
  const recommendedPersons = findReplacementCandidates(
    projectId,
    departingPersonId,
    urgency,
  );

  const recommendation: ReplacementRecommendation = {
    id: recommendationId,
    projectId,
    departingPersonId,
    recommendedPersons,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  replacementRecommendations.update((list) => [...list, recommendation]);
  logAudit(
    "create",
    "replacement_recommendation",
    recommendationId,
    {
      projectId,
      departingPersonId,
      reason,
      urgency,
    },
    recommendation,
  );

  return recommendationId;
}

// 대체자 후보 찾기
function findReplacementCandidates(
  projectId: string,
  departingPersonId: string,
  urgency: "low" | "medium" | "high" | "critical",
): Array<{
  personId: string;
  score: number;
  reason: string;
  availability: number;
}> {
  // 1. 프로젝트 요구사항 분석
  const projectRequirements = analyzeProjectRequirements(projectId);

  // 2. 이탈자 프로필 분석
  const departingPersonProfile = analyzePersonProfile(departingPersonId);

  // 3. 후보자 스코어링
  const candidates = scoreReplacementCandidates(
    projectRequirements,
    departingPersonProfile,
    urgency,
  );

  // 4. 상위 3명 반환
  return candidates.slice(0, 3);
}

// 프로젝트 요구사항 분석
function analyzeProjectRequirements(_projectId: string): any {
  // 실제 구현에서는 프로젝트 데이터를 분석
  return {
    requiredSkills: ["JavaScript", "React", "Node.js", "Database"],
    experienceLevel: "senior",
    department: "개발팀",
    participationRate: 80,
    startDate: "2024-02-01",
    duration: 6, // months
    budget: 50000000,
  };
}

// 개인 프로필 분석
function analyzePersonProfile(_personId: string): any {
  // 실제 구현에서는 개인 데이터를 분석
  return {
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    experienceLevel: "senior",
    department: "개발팀",
    currentParticipation: 100,
    salary: 6000000,
    performance: "excellent",
    availability: 80,
  };
}

// 대체자 후보 스코어링
function scoreReplacementCandidates(
  projectRequirements: any,
  departingPersonProfile: any,
  urgency: string,
): Array<{
  personId: string;
  score: number;
  reason: string;
  availability: number;
}> {
  // 실제 구현에서는 모든 직원을 대상으로 스코어링
  const candidates = [
    {
      personId: "person-1",
      name: "김대체",
      skills: ["JavaScript", "React", "Node.js", "PostgreSQL"],
      experienceLevel: "senior",
      department: "개발팀",
      currentParticipation: 60,
      salary: 5500000,
      performance: "excellent",
      availability: 90,
    },
    {
      personId: "person-2",
      name: "이대체",
      skills: ["JavaScript", "Vue.js", "Python", "MySQL"],
      experienceLevel: "mid",
      department: "개발팀",
      currentParticipation: 40,
      salary: 4500000,
      performance: "good",
      availability: 85,
    },
    {
      personId: "person-3",
      name: "박대체",
      skills: ["TypeScript", "React", "Express", "MongoDB"],
      experienceLevel: "senior",
      department: "개발팀",
      currentParticipation: 70,
      salary: 5800000,
      performance: "excellent",
      availability: 75,
    },
  ];

  return candidates
    .map((candidate) => {
      const score = calculateCandidateScore(
        candidate,
        projectRequirements,
        departingPersonProfile,
        urgency,
      );

      return {
        personId: candidate.personId,
        score: score.total,
        reason: score.reason,
        availability: candidate.availability,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// 후보자 점수 계산
function calculateCandidateScore(
  candidate: any,
  projectRequirements: any,
  departingPersonProfile: any,
  urgency: string,
): { total: number; reason: string } {
  let totalScore = 0;
  const reasons: string[] = [];

  // 1. 기술 스킬 매칭 (40%)
  const skillScore = calculateSkillScore(
    candidate.skills,
    projectRequirements.requiredSkills,
  );
  totalScore += skillScore * 0.4;
  reasons.push(`기술 스킬: ${skillScore}점`);

  // 2. 경험 수준 매칭 (20%)
  const experienceScore = calculateExperienceScore(
    candidate.experienceLevel,
    projectRequirements.experienceLevel,
  );
  totalScore += experienceScore * 0.2;
  reasons.push(`경험 수준: ${experienceScore}점`);

  // 3. 가용성 (20%)
  const availabilityScore = calculateAvailabilityScore(
    candidate.availability,
    projectRequirements.participationRate,
  );
  totalScore += availabilityScore * 0.2;
  reasons.push(`가용성: ${availabilityScore}점`);

  // 4. 성과 이력 (10%)
  const performanceScore = calculatePerformanceScore(candidate.performance);
  totalScore += performanceScore * 0.1;
  reasons.push(`성과: ${performanceScore}점`);

  // 5. 급여 적정성 (10%)
  const salaryScore = calculateSalaryScore(
    candidate.salary,
    departingPersonProfile.salary,
  );
  totalScore += salaryScore * 0.1;
  reasons.push(`급여 적정성: ${salaryScore}점`);

  // 긴급도 보정
  if (urgency === "critical") {
    totalScore *= 1.2;
  } else if (urgency === "high") {
    totalScore *= 1.1;
  }

  return {
    total: Math.round(totalScore),
    reason: reasons.join(", "),
  };
}

// 기술 스킬 점수 계산
function calculateSkillScore(
  candidateSkills: string[],
  requiredSkills: string[],
): number {
  const matchedSkills = candidateSkills.filter((skill) =>
    requiredSkills.includes(skill),
  );
  return (matchedSkills.length / requiredSkills.length) * 100;
}

// 경험 수준 점수 계산
function calculateExperienceScore(
  candidateLevel: string,
  requiredLevel: string,
): number {
  const levelScores = {
    intern: 20,
    junior: 40,
    mid: 60,
    senior: 80,
    lead: 90,
    manager: 100,
  };

  const candidateScore =
    levelScores[candidateLevel as keyof typeof levelScores] || 0;
  const requiredScore =
    levelScores[requiredLevel as keyof typeof levelScores] || 0;

  if (candidateScore >= requiredScore) {
    return 100;
  } else {
    return (candidateScore / requiredScore) * 100;
  }
}

// 가용성 점수 계산
function calculateAvailabilityScore(
  candidateAvailability: number,
  requiredParticipation: number,
): number {
  if (candidateAvailability >= requiredParticipation) {
    return 100;
  } else {
    return (candidateAvailability / requiredParticipation) * 100;
  }
}

// 성과 점수 계산
function calculatePerformanceScore(performance: string): number {
  const performanceScores = {
    excellent: 100,
    good: 80,
    average: 60,
    below_average: 40,
    poor: 20,
  };

  return performanceScores[performance as keyof typeof performanceScores] || 0;
}

// 급여 적정성 점수 계산
function calculateSalaryScore(
  candidateSalary: number,
  departingPersonSalary: number,
): number {
  const ratio = candidateSalary / departingPersonSalary;

  if (ratio <= 0.8) {
    return 100; // 20% 이상 저렴
  } else if (ratio <= 1.0) {
    return 90; // 동일하거나 저렴
  } else if (ratio <= 1.2) {
    return 70; // 20% 이내 비쌈
  } else {
    return 50; // 20% 이상 비쌈
  }
}

// 대체 추천 승인
export function approveReplacementRecommendation(
  recommendationId: string,
  approvedPersonId: string,
  approverId: string,
  comment?: string,
): void {
  replacementRecommendations.update((list) => {
    const index = list.findIndex((r) => r.id === recommendationId);
    if (index === -1) return list;

    const recommendation = list[index];
    const updatedRecommendation = {
      ...recommendation,
      status: "approved" as const,
      approvedBy: approverId,
      approvedAt: new Date().toISOString(),
    };

    const newList = [...list];
    newList[index] = updatedRecommendation;

    logAudit(
      "approve",
      "replacement_recommendation",
      recommendationId,
      {
        approvedPersonId,
        approverId,
        comment,
      },
      updatedRecommendation,
    );

    // 승인된 대체자 배정 처리
    processReplacementAssignment(
      recommendation.projectId,
      recommendation.departingPersonId,
      approvedPersonId,
      recommendation.createdAt,
    );

    return newList;
  });
}

// 대체자 배정 처리
function processReplacementAssignment(
  projectId: string,
  departingPersonId: string,
  replacementPersonId: string,
  effectiveDate: string,
): void {
  // 1. 기존 참여 배정 종료
  // 2. 새로운 참여 배정 생성
  // 3. 급여 변동 처리
  // 4. 알림 발송

  logAudit(
    "process_replacement",
    "participation_assignment",
    projectId,
    {
      departingPersonId,
      replacementPersonId,
      effectiveDate,
    },
    {},
  );
}

// 대체 추천 거부
export function rejectReplacementRecommendation(
  recommendationId: string,
  rejectorId: string,
  reason: string,
): void {
  replacementRecommendations.update((list) => {
    const index = list.findIndex((r) => r.id === recommendationId);
    if (index === -1) return list;

    const recommendation = list[index];
    const updatedRecommendation = {
      ...recommendation,
      status: "rejected" as const,
      approvedBy: rejectorId,
      approvedAt: new Date().toISOString(),
    };

    const newList = [...list];
    newList[index] = updatedRecommendation;

    logAudit(
      "reject",
      "replacement_recommendation",
      recommendationId,
      {
        rejectorId,
        reason,
      },
      updatedRecommendation,
    );

    return newList;
  });
}

// 채용 요청 생성 (적합한 대체자가 없는 경우)
export function createRecruitmentRequest(
  projectId: string,
  departingPersonId: string,
  requirements: any,
  urgency: "low" | "medium" | "high" | "critical",
): string {
  const requestId = crypto.randomUUID();

  const recruitmentRequest = {
    id: requestId,
    projectId,
    departingPersonId,
    requirements,
    urgency,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy: "current-user",
  };

  logAudit(
    "create",
    "recruitment_request",
    requestId,
    {
      projectId,
      departingPersonId,
      requirements,
      urgency,
    },
    recruitmentRequest,
  );

  return requestId;
}

// 대체 추천 이력 조회
export function getReplacementHistory(
  projectId: string,
): ReplacementRecommendation[] {
  let history: ReplacementRecommendation[] = [];

  replacementRecommendations.subscribe((list) => {
    history = list
      .filter((r) => r.projectId === projectId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  })();

  return history;
}

// 대체 추천 통계
export function getReplacementStatistics(projectId: string): any {
  const history = getReplacementHistory(projectId);

  const totalRecommendations = history.length;
  const approvedRecommendations = history.filter(
    (r) => r.status === "approved",
  ).length;
  const rejectedRecommendations = history.filter(
    (r) => r.status === "rejected",
  ).length;
  const pendingRecommendations = history.filter(
    (r) => r.status === "pending",
  ).length;

  const averageScore =
    history.length > 0
      ? history.reduce(
          (sum, r) => sum + r.recommendedPersons[0]?.score || 0,
          0,
        ) / history.length
      : 0;

  const averageProcessingTime = calculateAverageProcessingTime(history);

  return {
    totalRecommendations,
    approvedRecommendations,
    rejectedRecommendations,
    pendingRecommendations,
    approvalRate:
      totalRecommendations > 0
        ? (approvedRecommendations / totalRecommendations) * 100
        : 0,
    averageScore,
    averageProcessingTime,
  };
}

// 평균 처리 시간 계산
function calculateAverageProcessingTime(
  history: ReplacementRecommendation[],
): number {
  const processedRecommendations = history.filter((r) => r.approvedAt);

  if (processedRecommendations.length === 0) return 0;

  const totalTime = processedRecommendations.reduce((sum, r) => {
    const created = new Date(r.createdAt).getTime();
    const approved = new Date(r.approvedAt!).getTime();
    return sum + (approved - created);
  }, 0);

  return totalTime / processedRecommendations.length;
}

// 스킬 매트릭스 업데이트
export function updateSkillMatrix(personId: string, skills: unknown[]): void {
  skillMatrix.update((matrix) => ({
    ...matrix,
    [personId]: skills,
  }));
}

// 가용성 매트릭스 업데이트
export function updateAvailabilityMatrix(
  personId: string,
  availability: any,
): void {
  availabilityMatrix.update((matrix) => ({
    ...matrix,
    [personId]: availability,
  }));
}

// 대체 추천 알림 생성
export function createReplacementNotification(
  recommendationId: string,
  notificationType: "created" | "approved" | "rejected",
  recipients: string[],
): void {
  const notification = {
    id: crypto.randomUUID(),
    recommendationId,
    type: notificationType,
    recipients,
    createdAt: new Date().toISOString(),
  };

  // 실제 구현에서는 알림 시스템에 전송
  logger.log("Replacement notification:", notification);
}

// 대체 추천 대시보드 데이터
export function getReplacementDashboardData(): any {
  let allRecommendations: ReplacementRecommendation[] = [];

  replacementRecommendations.subscribe((list) => {
    allRecommendations = list;
  })();

  const recentRecommendations = allRecommendations
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  const pendingCount = allRecommendations.filter(
    (r) => r.status === "pending",
  ).length;
  const approvedCount = allRecommendations.filter(
    (r) => r.status === "approved",
  ).length;
  const rejectedCount = allRecommendations.filter(
    (r) => r.status === "rejected",
  ).length;

  return {
    recentRecommendations,
    pendingCount,
    approvedCount,
    rejectedCount,
    totalCount: allRecommendations.length,
  };
}
