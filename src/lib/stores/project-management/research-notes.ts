import { writable } from "svelte/store";
import type { ResearchNote, Document } from "./types";
import { logAudit } from "./core";

// 연구노트 관리
export const researchNotes = writable<ResearchNote[]>([]);
export const researchNoteAttachments = writable<Record<string, Document[]>>({});
export const researchNoteSignatures = writable<Record<string, unknown[]>>({});

// 연구노트 생성
export function createResearchNote(
  projectId: string,
  authorId: string,
  weekOf: string,
  title: string,
  contentMd: string,
  attachments: string[] = [],
): string {
  const note: ResearchNote = {
    id: crypto.randomUUID(),
    projectId,
    authorId,
    weekOf,
    title,
    contentMd,
    attachments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  researchNotes.update((list) => [...list, note]);
  logAudit("create", "research_note", note.id, {}, note);

  return note.id;
}

// 연구노트 수정
export function updateResearchNote(
  noteId: string,
  updates: Partial<ResearchNote>,
): void {
  researchNotes.update((list) => {
    const index = list.findIndex((n) => n.id === noteId);
    if (index === -1) return list;

    const oldNote = list[index];
    const updatedNote = {
      ...oldNote,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const newList = [...list];
    newList[index] = updatedNote;

    logAudit("update", "research_note", noteId, oldNote, updatedNote);
    return newList;
  });
}

// 연구노트 삭제
export function deleteResearchNote(noteId: string): void {
  researchNotes.update((list) => {
    const note = list.find((n) => n.id === noteId);
    if (note) {
      logAudit("delete", "research_note", noteId, note, {});
    }
    return list.filter((n) => n.id !== noteId);
  });
}

// 첨부파일 추가
export function addResearchNoteAttachment(
  noteId: string,
  filename: string,
  storageUrl: string,
  sha256: string,
  description?: string,
): string {
  const attachment: Document = {
    id: crypto.randomUUID(),
    projectId: "", // 연구노트의 프로젝트 ID로 설정
    type: "other",
    filename,
    storageUrl,
    sha256,
    version: 1,
    meta: { description, noteId },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  researchNoteAttachments.update((attachments) => {
    const noteAttachments = attachments[noteId] || [];
    return {
      ...attachments,
      [noteId]: [...noteAttachments, attachment],
    };
  });

  logAudit("add_attachment", "research_note", noteId, {}, attachment);

  return attachment.id;
}

// 전자서명 추가
export function addResearchNoteSignature(
  noteId: string,
  signerId: string,
  signatureData: string,
  signatureType: "author" | "verifier" = "author",
): string {
  const signature = {
    id: crypto.randomUUID(),
    noteId,
    signerId,
    signatureData,
    signatureType,
    signedAt: new Date().toISOString(),
    verified: false,
  };

  researchNoteSignatures.update((signatures) => {
    const noteSignatures = signatures[noteId] || [];
    return {
      ...signatures,
      [noteId]: [...noteSignatures, signature],
    };
  });

  logAudit(
    "add_signature",
    "research_note",
    noteId,
    { signerId, signatureType },
    signature,
  );

  // 연구노트 서명 상태 업데이트
  updateResearchNote(noteId, { signedAt: signature.signedAt });

  return signature.id;
}

// 서명 검증
export function verifyResearchNoteSignature(
  noteId: string,
  signatureId: string,
  verifierId: string,
): void {
  researchNoteSignatures.update((signatures) => {
    const noteSignatures = signatures[noteId] || [];
    const updatedSignatures = noteSignatures.map((sig) => {
      if (sig.id === signatureId) {
        return {
          ...sig,
          verified: true,
          verifiedBy: verifierId,
          verifiedAt: new Date().toISOString(),
        };
      }
      return sig;
    });

    return {
      ...signatures,
      [noteId]: updatedSignatures,
    };
  });

  logAudit(
    "verify_signature",
    "research_note",
    noteId,
    { signatureId, verifierId },
    {},
  );

  // 연구노트 검증 상태 업데이트
  updateResearchNote(noteId, { verifiedBy: verifierId });
}

// 프로젝트별 연구노트 목록
export function getResearchNotesByProject(projectId: string): ResearchNote[] {
  let projectNotes: ResearchNote[] = [];

  researchNotes.subscribe((list) => {
    projectNotes = list
      .filter((n) => n.projectId === projectId)
      .sort(
        (a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime(),
      );
  })();

  return projectNotes;
}

// 작성자별 연구노트 목록
export function getResearchNotesByAuthor(authorId: string): ResearchNote[] {
  let authorNotes: ResearchNote[] = [];

  researchNotes.subscribe((list) => {
    authorNotes = list
      .filter((n) => n.authorId === authorId)
      .sort(
        (a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime(),
      );
  })();

  return authorNotes;
}

// 주차별 연구노트 목록
export function getResearchNotesByWeek(
  projectId: string,
  weekOf: string,
): ResearchNote[] {
  let weekNotes: ResearchNote[] = [];

  researchNotes.subscribe((list) => {
    weekNotes = list.filter(
      (n) => n.projectId === projectId && n.weekOf === weekOf,
    );
  })();

  return weekNotes;
}

// 연구노트별 첨부파일 목록
export function getResearchNoteAttachments(noteId: string): Document[] {
  let attachments: Document[] = [];

  researchNoteAttachments.subscribe((attachmentMap) => {
    attachments = attachmentMap[noteId] || [];
  })();

  return attachments;
}

// 연구노트별 서명 목록
export function getResearchNoteSignatures(noteId: string): unknown[] {
  let signatures: unknown[] = [];

  researchNoteSignatures.subscribe((signatureMap) => {
    signatures = signatureMap[noteId] || [];
  })();

  return signatures;
}

// 미제출 연구노트 체크
export function getMissingResearchNotes(
  projectId: string,
  startDate: string,
  endDate: string,
): {
  missingWeeks: string[];
  missingAuthors: string[];
} {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const missingWeeks: string[] = [];
  const missingAuthors: string[] = [];

  // 주차별로 체크
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const weekOf = getWeekOfYear(currentDate);
    const weekNotes = getResearchNotesByWeek(projectId, weekOf);

    if (weekNotes.length === 0) {
      missingWeeks.push(weekOf);
    }

    currentDate.setDate(currentDate.getDate() + 7);
  }

  // 작성자별 체크 (실제 구현에서는 프로젝트 참여자 목록을 가져와야 함)
  // 여기서는 간단히 처리

  return { missingWeeks, missingAuthors };
}

// 주차 계산 (ISO 8601 기준)
function getWeekOfYear(date: Date): string {
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil(
    (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7,
  );
  return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
}

// 연구노트 제출 현황
export function getResearchNoteSubmissionStatus(
  projectId: string,
  month: string,
): {
  totalWeeks: number;
  submittedWeeks: number;
  submissionRate: number;
  missingWeeks: string[];
} {
  const startDate = new Date(month + "-01");
  const endDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    0,
  );

  const { missingWeeks } = getMissingResearchNotes(
    projectId,
    startDate.toISOString(),
    endDate.toISOString(),
  );

  // 해당 월의 총 주차 수 계산
  const totalWeeks = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7),
  );
  const submittedWeeks = totalWeeks - missingWeeks.length;
  const submissionRate =
    totalWeeks > 0 ? (submittedWeeks / totalWeeks) * 100 : 0;

  return {
    totalWeeks,
    submittedWeeks,
    submissionRate,
    missingWeeks,
  };
}

// 연구노트 템플릿 생성
export function createResearchNoteTemplate(
  projectId: string,
  authorId: string,
  weekOf: string,
  templateType: "weekly" | "experiment" | "analysis" | "meeting",
): string {
  const templates = {
    weekly: {
      title: `주간 연구노트 - ${weekOf}`,
      content: `# 주간 연구노트

## 이번 주 주요 활동
- 

## 실험/연구 진행사항
- 

## 결과 및 분석
- 

## 다음 주 계획
- 

## 이슈 및 문제점
- 

## 참고자료
- `,
    },
    experiment: {
      title: `실험 노트 - ${weekOf}`,
      content: `# 실험 노트

## 실험 목적
- 

## 실험 방법
- 

## 실험 조건
- 

## 결과
- 

## 분석 및 해석
- 

## 결론
- 

## 향후 계획
- `,
    },
    analysis: {
      title: `분석 노트 - ${weekOf}`,
      content: `# 분석 노트

## 분석 목적
- 

## 데이터 소스
- 

## 분석 방법
- 

## 결과
- 

## 해석
- 

## 한계점
- 

## 개선 방안
- `,
    },
    meeting: {
      title: `회의 노트 - ${weekOf}`,
      content: `# 회의 노트

## 회의 정보
- 일시: 
- 참석자: 
- 장소: 

## 안건
- 

## 논의 내용
- 

## 결정사항
- 

## 액션 아이템
- 

## 다음 회의
- `,
    },
  };

  const template = templates[templateType];
  return createResearchNote(
    projectId,
    authorId,
    weekOf,
    template.title,
    template.content,
  );
}

// 연구노트 검색
export function searchResearchNotes(
  projectId: string,
  query: string,
  authorId?: string,
  startDate?: string,
  endDate?: string,
): ResearchNote[] {
  let searchResults: ResearchNote[] = [];

  researchNotes.subscribe((list) => {
    searchResults = list.filter((note) => {
      // 프로젝트 필터
      if (note.projectId !== projectId) return false;

      // 작성자 필터
      if (authorId && note.authorId !== authorId) return false;

      // 날짜 필터
      if (startDate && note.weekOf < startDate) return false;
      if (endDate && note.weekOf > endDate) return false;

      // 텍스트 검색
      if (query) {
        const searchText = query.toLowerCase();
        return (
          note.title.toLowerCase().includes(searchText) ||
          note.contentMd.toLowerCase().includes(searchText)
        );
      }

      return true;
    });
  })();

  return searchResults;
}

// 연구노트 통계
export function getResearchNoteStatistics(
  projectId: string,
  period: "month" | "quarter" | "year",
): {
  totalNotes: number;
  submittedNotes: number;
  signedNotes: number;
  verifiedNotes: number;
  averageNotesPerWeek: number;
  topAuthors: Array<{ authorId: string; count: number }>;
} {
  const projectNotes = getResearchNotesByProject(projectId);

  const totalNotes = projectNotes.length;
  const submittedNotes = projectNotes.filter((n) => n.signedAt).length;
  const signedNotes = projectNotes.filter((n) => n.signedAt).length;
  const verifiedNotes = projectNotes.filter((n) => n.verifiedBy).length;

  // 주차별 평균 계산
  const weeks = new Set(projectNotes.map((n) => n.weekOf));
  const averageNotesPerWeek = weeks.size > 0 ? totalNotes / weeks.size : 0;

  // 작성자별 통계
  const authorCounts: Record<string, number> = {};
  projectNotes.forEach((note) => {
    authorCounts[note.authorId] = (authorCounts[note.authorId] || 0) + 1;
  });

  const topAuthors = Object.entries(authorCounts)
    .map(([authorId, count]) => ({ authorId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalNotes,
    submittedNotes,
    signedNotes,
    verifiedNotes,
    averageNotesPerWeek,
    topAuthors,
  };
}

// 연구노트 내보내기 (PDF/Word 형식)
export function exportResearchNotes(
  projectId: string,
  format: "pdf" | "docx" | "html",
  startDate?: string,
  endDate?: string,
): string {
  const notes = getResearchNotesByProject(projectId);
  const filteredNotes = notes.filter((note) => {
    if (startDate && note.weekOf < startDate) return false;
    if (endDate && note.weekOf > endDate) return false;
    return true;
  });

  // 실제 구현에서는 서버에서 PDF/Word 생성
  // 여기서는 HTML 형식으로 반환
  const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>연구노트 모음</title>
			<meta charset="utf-8">
		</head>
		<body>
			<h1>연구노트 모음</h1>
			${filteredNotes
        .map(
          (note) => `
				<div class="note">
					<h2>${note.title}</h2>
					<p><strong>주차:</strong> ${note.weekOf}</p>
					<p><strong>작성자:</strong> ${note.authorId}</p>
					<p><strong>작성일:</strong> ${note.createdAt}</p>
					<div class="content">${note.contentMd}</div>
				</div>
			`,
        )
        .join("")}
		</body>
		</html>
	`;

  return html;
}

// 연구노트 백업
export function backupResearchNotes(projectId: string): {
  notes: ResearchNote[];
  attachments: Record<string, Document[]>;
  signatures: Record<string, unknown[]>;
  backupDate: string;
} {
  const notes = getResearchNotesByProject(projectId);
  const attachments: Record<string, Document[]> = {};
  const signatures: Record<string, unknown[]> = {};

  notes.forEach((note) => {
    attachments[note.id] = getResearchNoteAttachments(note.id);
    signatures[note.id] = getResearchNoteSignatures(note.id);
  });

  return {
    notes,
    attachments,
    signatures,
    backupDate: new Date().toISOString(),
  };
}
