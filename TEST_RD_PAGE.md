# R&D 프로젝트 페이지 테스트 가이드

## 문제: 데이터가 표시되지 않음

### 수정 사항

1. ✅ `RdDevProjectService.getProjectById()` - start_date, end_date 등 필수 필드 추가

### 확인할 사항

#### 1. 브라우저 콘솔 확인

```
F12 → Console 탭 확인
- 에러 메시지가 있는지
- 데이터가 로드되는지
```

#### 2. 네트워크 탭 확인

```
F12 → Network 탭 → 페이지 리로드
- API 요청이 성공하는지 (200 OK)
- 응답 데이터에 project, phases, deliverables 등이 있는지
```

#### 3. 서버 로그 확인

```bash
# 터미널에서 서버 로그 확인
npm run dev
```

#### 4. 데이터베이스 확인

실제 데이터가 있는지 확인:

```sql
-- 프로젝트 확인
SELECT * FROM rd_dev_projects WHERE id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6';

-- Phases 확인
SELECT * FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6';

-- Deliverables 확인
SELECT * FROM rd_dev_deliverables WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6';

-- Institutions 확인
SELECT * FROM rd_dev_institutions WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6';
```

#### 5. 임시 디버깅 추가

+page.svelte에 임시로 추가:

```svelte
{#if project}
  <div style="background: yellow; padding: 20px; margin: 20px;">
    <h2>DEBUG INFO</h2>
    <p>Project ID: {project.id}</p>
    <p>Title: {project.title}</p>
    <p>Phases: {phases.length}</p>
    <p>Deliverables: {deliverables.length}</p>
    <p>Institutions: {institutions.length}</p>
  </div>
{/if}
```

## 테스트 순서

1. **서버 재시작**

   ```bash
   # Ctrl+C로 서버 중지 후
   npm run dev
   ```

2. **페이지 강제 새로고침**
   - Chrome: Ctrl+Shift+R (Mac: Cmd+Shift+R)
   - 캐시 완전 제거

3. **브라우저 콘솔 확인**
   - F12 → Console
   - 에러 메시지 확인

4. **빈 데이터 확인**
   - 만약 데이터가 0개라면 → 시드 데이터 확인 필요
   - 만약 에러가 있다면 → 콘솔 에러 메시지 공유

## 예상 문제와 해결책

### 문제 1: 프로젝트는 있는데 phases, deliverables가 0개

→ 시드 데이터가 없음. 다음 스크립트 실행:

```bash
npm run seed  # 또는 적절한 시드 스크립트
```

### 문제 2: "Project not found" 에러

→ URL의 프로젝트 ID가 잘못됨. 다른 프로젝트 ID 시도:

```bash
# DB에서 실제 프로젝트 ID 확인
SELECT id, title FROM rd_dev_projects LIMIT 5;
```

### 문제 3: 컴포넌트가 렌더링 안됨

→ 브라우저 콘솔에서 Svelte 컴파일 에러 확인

### 문제 4: CSS 문제로 보이지 않음

→ 개발자 도구에서 Elements 확인, display: none 등이 있는지

## 빠른 테스트

페이지 상단에 다음을 임시로 추가:

```svelte
<div
  style="position: fixed; top: 100px; right: 20px; background: white; padding: 20px; border: 2px solid red; z-index: 9999;"
>
  <h3>Debug Panel</h3>
  <p>Project: {project ? '✅' : '❌'}</p>
  <p>Phases: {phases?.length || 0}</p>
  <p>Deliverables: {deliverables?.length || 0}</p>
  <p>Institutions: {institutions?.length || 0}</p>
  <p>KPIs: {kpis?.length || 0}</p>
  <p>Error: {error || 'None'}</p>
</div>
```

이렇게 하면 데이터가 로드되는지 즉시 확인 가능합니다.
