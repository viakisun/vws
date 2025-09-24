import { writable } from "svelte/store";

// 채용 공고
export interface JobPosting {
  id: string;
  title: string;
  department: string;
  position: string;
  level: string;
  employmentType: "full-time" | "part-time" | "contract" | "intern";
  location: string;
  description: string;
  requirements: string[];
  preferredQualifications: string[];
  benefits: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  applicationDeadline: string;
  status: "draft" | "published" | "closed" | "cancelled";
  postedBy: string;
  postedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 지원자
export interface Candidate {
  id: string;
  jobPostingId: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    birthDate: string;
    gender: "male" | "female" | "other";
  };
  education: {
    degree: string;
    school: string;
    major: string;
    graduationYear: number;
    gpa?: number;
  }[];
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string;
    technologies?: string[];
  }[];
  skills: string[];
  languages: {
    language: string;
    proficiency: "beginner" | "intermediate" | "advanced" | "native";
  }[];
  portfolio?: {
    github?: string;
    website?: string;
    projects?: string[];
  };
  resumeUrl?: string;
  coverLetter?: string;
  appliedAt: string;
  status:
    | "applied"
    | "screening"
    | "interview"
    | "offer"
    | "hired"
    | "rejected"
    | "withdrawn";
  notes?: string;
}

// 면접 일정
export interface InterviewSchedule {
  id: string;
  candidateId: string;
  jobPostingId: string;
  interviewType: "phone" | "video" | "in-person" | "technical" | "final";
  interviewerIds: string[];
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // 분
  location?: string;
  meetingLink?: string;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 면접 평가
export interface InterviewEvaluation {
  id: string;
  interviewScheduleId: string;
  candidateId: string;
  interviewerId: string;
  technicalSkills: number; // 1-5 점수
  communicationSkills: number; // 1-5 점수
  problemSolving: number; // 1-5 점수
  culturalFit: number; // 1-5 점수
  overallRating: number; // 1-5 점수
  strengths: string[];
  weaknesses: string[];
  recommendation: "strong-hire" | "hire" | "no-hire" | "strong-no-hire";
  comments: string;
  evaluatedAt: string;
}

// 오퍼 레터
export interface OfferLetter {
  id: string;
  candidateId: string;
  jobPostingId: string;
  position: string;
  department: string;
  startDate: string;
  salary: number;
  benefits: string[];
  terms: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  sentAt?: string;
  responseDeadline?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 초기 데이터
const initialJobPostings: JobPosting[] = [
  {
    id: "job-1",
    title: "시니어 프론트엔드 개발자",
    department: "개발팀",
    position: "시니어 개발자",
    level: "senior",
    employmentType: "full-time",
    location: "서울 본사",
    description:
      "React 기반 웹 애플리케이션 개발 및 팀 리딩을 담당할 시니어 개발자를 모집합니다.",
    requirements: [
      "5년 이상 프론트엔드 개발 경험",
      "React, TypeScript 숙련",
      "상태 관리 라이브러리 경험 (Redux, Zustand 등)",
      "테스트 작성 경험 (Jest, React Testing Library)",
    ],
    preferredQualifications: [
      "Next.js 경험",
      "팀 리딩 경험",
      "오픈소스 기여 경험",
      "클라우드 플랫폼 경험",
    ],
    benefits: [
      "경쟁력 있는 연봉",
      "유연한 근무 환경",
      "교육비 지원",
      "건강보험 및 퇴직연금",
    ],
    salaryRange: {
      min: 60000000,
      max: 90000000,
      currency: "KRW",
    },
    applicationDeadline: "2024-03-31",
    status: "published",
    postedBy: "emp-3",
    postedAt: "2024-01-15T00:00:00Z",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
];

const initialCandidates: Candidate[] = [
  {
    id: "candidate-1",
    jobPostingId: "job-1",
    personalInfo: {
      name: "최민수",
      email: "choi.ms@email.com",
      phone: "010-1234-5678",
      address: "서울시 강남구",
      birthDate: "1990-05-15",
      gender: "male",
    },
    education: [
      {
        degree: "학사",
        school: "서울대학교",
        major: "컴퓨터공학과",
        graduationYear: 2013,
        gpa: 3.8,
      },
    ],
    experience: [
      {
        company: "ABC 테크",
        position: "시니어 프론트엔드 개발자",
        startDate: "2020-01-01",
        endDate: "2023-12-31",
        description: "React 기반 웹 애플리케이션 개발 및 팀 멘토링",
        technologies: ["React", "TypeScript", "Redux", "Jest"],
      },
    ],
    skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Node.js"],
    languages: [
      { language: "한국어", proficiency: "native" },
      { language: "영어", proficiency: "intermediate" },
    ],
    portfolio: {
      github: "https://github.com/choims",
      website: "https://choims.dev",
    },
    appliedAt: "2024-01-20T10:00:00Z",
    status: "interview",
    notes: "기술적 역량이 뛰어남",
  },
];

const initialInterviewSchedules: InterviewSchedule[] = [
  {
    id: "interview-1",
    candidateId: "candidate-1",
    jobPostingId: "job-1",
    interviewType: "technical",
    interviewerIds: ["emp-1", "emp-3"],
    scheduledDate: "2024-02-01",
    scheduledTime: "14:00",
    duration: 60,
    location: "서울 본사 회의실 A",
    status: "scheduled",
    createdAt: "2024-01-25T00:00:00Z",
    updatedAt: "2024-01-25T00:00:00Z",
  },
];

const initialInterviewEvaluations: InterviewEvaluation[] = [];

const initialOfferLetters: OfferLetter[] = [];

// 스토어 생성
export const jobPostings = writable<JobPosting[]>(initialJobPostings);
export const candidates = writable<Candidate[]>(initialCandidates);
export const interviewSchedules = writable<InterviewSchedule[]>(
  initialInterviewSchedules,
);
export const interviewEvaluations = writable<InterviewEvaluation[]>(
  initialInterviewEvaluations,
);
export const offerLetters = writable<OfferLetter[]>(initialOfferLetters);

// 채용 공고 관리 함수들
export function addJobPosting(
  posting: Omit<JobPosting, "id" | "createdAt" | "updatedAt">,
) {
  const newPosting: JobPosting = {
    ...posting,
    id: `job-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobPostings.update((current) => [...current, newPosting]);
}

export function updateJobPosting(id: string, updates: Partial<JobPosting>) {
  jobPostings.update((current) =>
    current.map((posting) =>
      posting.id === id
        ? { ...posting, ...updates, updatedAt: new Date().toISOString() }
        : posting,
    ),
  );
}

export function publishJobPosting(id: string) {
  jobPostings.update((current) =>
    current.map((posting) =>
      posting.id === id
        ? {
            ...posting,
            status: "published",
            postedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : posting,
    ),
  );
}

export function closeJobPosting(id: string) {
  jobPostings.update((current) =>
    current.map((posting) =>
      posting.id === id
        ? { ...posting, status: "closed", updatedAt: new Date().toISOString() }
        : posting,
    ),
  );
}

// 지원자 관리 함수들
export function addCandidate(candidate: Omit<Candidate, "id" | "appliedAt">) {
  const newCandidate: Candidate = {
    ...candidate,
    id: `candidate-${Date.now()}`,
    appliedAt: new Date().toISOString(),
  };
  candidates.update((current) => [...current, newCandidate]);
}

export function updateCandidate(id: string, updates: Partial<Candidate>) {
  candidates.update((current) =>
    current.map((candidate) =>
      candidate.id === id ? { ...candidate, ...updates } : candidate,
    ),
  );
}

export function updateCandidateStatus(
  id: string,
  status: Candidate["status"],
  notes?: string,
) {
  candidates.update((current) =>
    current.map((candidate) =>
      candidate.id === id
        ? { ...candidate, status, notes: notes || candidate.notes }
        : candidate,
    ),
  );
}

// 면접 일정 관리 함수들
export function scheduleInterview(
  schedule: Omit<InterviewSchedule, "id" | "createdAt" | "updatedAt">,
) {
  const newSchedule: InterviewSchedule = {
    ...schedule,
    id: `interview-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  interviewSchedules.update((current) => [...current, newSchedule]);
}

export function updateInterviewSchedule(
  id: string,
  updates: Partial<InterviewSchedule>,
) {
  interviewSchedules.update((current) =>
    current.map((schedule) =>
      schedule.id === id
        ? { ...schedule, ...updates, updatedAt: new Date().toISOString() }
        : schedule,
    ),
  );
}

export function completeInterview(id: string) {
  interviewSchedules.update((current) =>
    current.map((schedule) =>
      schedule.id === id
        ? {
            ...schedule,
            status: "completed",
            updatedAt: new Date().toISOString(),
          }
        : schedule,
    ),
  );
}

// 면접 평가 관리 함수들
export function addInterviewEvaluation(
  evaluation: Omit<InterviewEvaluation, "id" | "evaluatedAt">,
) {
  const newEvaluation: InterviewEvaluation = {
    ...evaluation,
    id: `evaluation-${Date.now()}`,
    evaluatedAt: new Date().toISOString(),
  };
  interviewEvaluations.update((current) => [...current, newEvaluation]);
}

export function updateInterviewEvaluation(
  id: string,
  updates: Partial<InterviewEvaluation>,
) {
  interviewEvaluations.update((current) =>
    current.map((evaluation) =>
      evaluation.id === id ? { ...evaluation, ...updates } : evaluation,
    ),
  );
}

// 오퍼 레터 관리 함수들
export function createOfferLetter(
  offer: Omit<OfferLetter, "id" | "createdAt" | "updatedAt">,
) {
  const newOffer: OfferLetter = {
    ...offer,
    id: `offer-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  offerLetters.update((current) => [...current, newOffer]);
}

export function sendOfferLetter(id: string, responseDeadline: string) {
  offerLetters.update((current) =>
    current.map((offer) =>
      offer.id === id
        ? {
            ...offer,
            status: "sent",
            sentAt: new Date().toISOString(),
            responseDeadline,
            updatedAt: new Date().toISOString(),
          }
        : offer,
    ),
  );
}

export function acceptOffer(id: string) {
  offerLetters.update((current) =>
    current.map((offer) =>
      offer.id === id
        ? {
            ...offer,
            status: "accepted",
            acceptedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : offer,
    ),
  );
}

export function rejectOffer(id: string) {
  offerLetters.update((current) =>
    current.map((offer) =>
      offer.id === id
        ? {
            ...offer,
            status: "rejected",
            rejectedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : offer,
    ),
  );
}

// 유틸리티 함수들
export function getCandidatesByJobPosting(
  jobPostingId: string,
  candidateList: Candidate[],
): Candidate[] {
  return candidateList.filter(
    (candidate) => candidate.jobPostingId === jobPostingId,
  );
}

export function getCandidatesByStatus(
  status: Candidate["status"],
  candidateList: Candidate[],
): Candidate[] {
  return candidateList.filter((candidate) => candidate.status === status);
}

export function getInterviewSchedulesByCandidate(
  candidateId: string,
  scheduleList: InterviewSchedule[],
): InterviewSchedule[] {
  return scheduleList.filter(
    (schedule) => schedule.candidateId === candidateId,
  );
}

export function getInterviewEvaluationsByCandidate(
  candidateId: string,
  evaluationList: InterviewEvaluation[],
): InterviewEvaluation[] {
  return evaluationList.filter(
    (evaluation) => evaluation.candidateId === candidateId,
  );
}

export function getOfferLetterByCandidate(
  candidateId: string,
  offerList: OfferLetter[],
): OfferLetter | undefined {
  return offerList.find((offer) => offer.candidateId === candidateId);
}

export function calculateAverageRating(
  evaluations: InterviewEvaluation[],
): number {
  if (evaluations.length === 0) return 0;
  const totalRating = evaluations.reduce(
    (sum, evaluation) => sum + evaluation.overallRating,
    0,
  );
  return Math.round((totalRating / evaluations.length) * 10) / 10;
}

export function getRecruitmentStats(
  jobPostingId: string,
  candidateList: Candidate[],
): {
  totalApplications: number;
  screeningCount: number;
  interviewCount: number;
  offerCount: number;
  hiredCount: number;
  rejectedCount: number;
} {
  const jobCandidates = getCandidatesByJobPosting(jobPostingId, candidateList);

  return {
    totalApplications: jobCandidates.length,
    screeningCount: jobCandidates.filter((c) => c.status === "screening")
      .length,
    interviewCount: jobCandidates.filter((c) => c.status === "interview")
      .length,
    offerCount: jobCandidates.filter((c) => c.status === "offer").length,
    hiredCount: jobCandidates.filter((c) => c.status === "hired").length,
    rejectedCount: jobCandidates.filter((c) => c.status === "rejected").length,
  };
}
