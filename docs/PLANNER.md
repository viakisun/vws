# Planner: A Living System for Intentional Work

## Philosophy

**Planner** is not a task tracker. It's a **living system of intention** — where teams define outcomes they care about, align around meaningful work, and maintain clear accountability without ceremony.

Most tools fail because they optimize for *tracking* rather than *thinking*. They ask "what are you doing?" before "why does this matter?" Planner inverts this: it starts with **intent**, flows into **shape**, and resolves into **motion**.

### Core Principle
> **Clarity precedes execution. Accountability follows naturally from shared understanding.**

---

## Information Architecture

Planner organizes work across three conceptual layers:

### 1. **Initiatives** (Why & What)
*The outcomes we're committed to delivering*

- **Purpose**: Strategic containers that represent meaningful change or value
- **Horizon**: Weeks to months
- **Owner**: Single accountable human
- **States**: `shaping` → `active` → `shipped` / `paused` / `abandoned`

**Example**: "Enable real-time collaboration in finance module" or "회사소개서 제작 완료"

### 2. **Formations** (Who & How)
*The working groups assembled to execute*

- **Purpose**: Fluid team structures with explicit roles and sync rhythms
- **Roles**: Driver, Contributor, Advisor, Observer
- **Energy States**: `aligned` | `healthy` | `strained` | `blocked`
- **Cadence**: `daily` | `weekly` | `biweekly` | `async`

**Visual metaphor**: Think "squad configuration" rather than "assigned resources"

### 3. **Threads** (What's happening now)
*The atomic units of progress and communication*

- **Purpose**: Replace tasks, tickets, and status updates with contextual micro-commitments
- **Shapes**:
  - 🔴 **Block**: Impediment requiring resolution
  - 🟡 **Question**: Needs clarification or decision
  - 🟣 **Decision**: Requires explicit choice
  - 🔵 **Build**: Active execution work
  - 🟢 **Research**: Investigation or exploration
- **States**: `proposed` → `active` → `resolved` → `archived`

---

## Key Features

### 1. **Intent-First Design**
Every Initiative starts with:
- **Intent**: The "why" — explains purpose and context
- **Success Criteria**: What will be true when this succeeds
- **Horizon**: Expected resolution signal (not a deadline)

### 2. **Shape-Based Threading**
Threads are categorized by nature, not just status:
- Blocks surface urgency automatically
- Questions cluster decision-making
- Different shapes get different visual priority

### 3. **Formation Energy Tracking**
Instead of burndown charts, track team health:
- **Aligned**: Everything flowing smoothly
- **Healthy**: Normal working state
- **Strained**: Capacity concerns, attention needed
- **Blocked**: Cannot proceed, intervention required

### 4. **Activity Feed**
Automatic audit log of all state transitions and significant changes across all entities.

---

## Data Model

```
Initiatives (1) → (M) Threads
Initiatives (M) ← (M) Formations
Formations (1) → (M) FormationMembers
Threads (1) → (M) ThreadReplies
Threads (M) ← (M) ThreadContributors
```

### Database Tables

- `planner_initiatives` - Strategic outcomes
- `planner_formations` - Working groups
- `planner_formation_members` - Team roster with roles
- `planner_formation_initiatives` - Many-to-many link
- `planner_threads` - Units of work/discussion
- `planner_thread_contributors` - Additional thread participants
- `planner_thread_replies` - Threaded discussion
- `planner_activity_log` - Audit trail

---

## API Routes

### Initiatives
- `GET /api/planner/initiatives` - List with filters
- `POST /api/planner/initiatives` - Create new
- `GET /api/planner/initiatives/{id}` - Get details
- `PATCH /api/planner/initiatives/{id}` - Update
- `DELETE /api/planner/initiatives/{id}` - Soft delete
- `POST /api/planner/initiatives/{id}/state` - Change state

### Formations
- `GET /api/planner/formations` - List
- `POST /api/planner/formations` - Create
- `GET /api/planner/formations/{id}` - Get details
- `PATCH /api/planner/formations/{id}` - Update
- `DELETE /api/planner/formations/{id}` - Soft delete
- `POST /api/planner/formations/{id}/members` - Add member
- `DELETE /api/planner/formations/{id}/members` - Remove member

### Threads
- `GET /api/planner/threads` - List with filters
- `POST /api/planner/threads` - Create
- `GET /api/planner/threads/{id}` - Get details
- `PATCH /api/planner/threads/{id}` - Update
- `DELETE /api/planner/threads/{id}` - Soft delete
- `POST /api/planner/threads/{id}/state` - Change state
- `GET /api/planner/threads/{id}/replies` - Get replies
- `POST /api/planner/threads/{id}/replies` - Add reply

---

## UI Views

### 1. **Overview** (`/planner`)
The pulse of all work.

**Layout**:
- **Left rail**: Active Initiatives (sorted by horizon proximity)
- **Center**: "What's moving" — recent Thread activity
- **Right rail**: My accountability — Initiatives & Threads I own

### 2. **Initiative View** (`/planner/initiatives/{id}`)
Deep context for one Initiative.

**Sections**:
- Intent & Success Criteria
- Active Threads (grouped by shape: Blocks first)
- Formation info (if linked)
- Resolved threads (collapsed)

### 3. **Formation View** (`/planner/formations/{id}`)
Team configuration + roster.

**Sections**:
- Members with roles and bandwidth
- Linked initiatives
- Energy state indicator

---

## State Transitions

### Initiative States

```
shaping → active (requires success_criteria)
active → paused | shipped | abandoned
paused → active | abandoned
shipped → [terminal]
abandoned → [terminal]
```

### Thread States

```
proposed → active | archived
active → resolved | archived (resolved requires resolution notes)
resolved → archived | active (can reopen)
archived → active (can restore)
```

---

## Use Cases

### Engineering/R&D
- Initiative: "Ship real-time notifications system"
- Formation: "Platform Engineering Squad"
- Threads: Technical spikes, architecture decisions, implementation builds

### Marketing/Communications
- Initiative: "2025년 회사소개서 제작"
- Formation: "브랜드 커뮤니케이션팀"
- Threads: 디자인 컨셉 결정, 번역 검토, 인쇄업체 선정

### Operations/Admin
- Initiative: "사무실 자재 정리 및 재고 시스템 구축"
- Formation: "오피스 운영팀"
- Threads: 창고 정리, 재고 리스트 작성, 발주 기준 정립

### HR/Recruitment
- Initiative: "시니어 개발자 3명 채용"
- Formation: "채용 태스크포스"
- Threads: JD 작성, 헤드헌터 미팅, 면접 일정 조율

---

## Design Principles

1. **Calm, Not Crowded**
   - White space is intentional
   - Typography-first hierarchy
   - Minimal chrome, maximum clarity

2. **State Through Color**
   - Initiatives: Subtle background tints by state
   - Threads: Shape determines icon + accent color
   - Formations: Energy state = badge color

3. **Inline Editing**
   - Click to edit
   - Auto-save on blur
   - Optimistic UI updates

4. **Contextual Actions**
   - Hover states reveal actions
   - Modal overlays for detail views
   - No unnecessary page loads

---

## Future Enhancements (Phase 2+)

### Intelligence Features
- Smart prompts & nudges for stale work
- Auto-archive resolved threads after 30 days
- Pre-sync digest generation for Formations
- Search across all entities

### Collaboration Features
- @mentions in Thread replies
- Email digest notifications
- Real-time collaboration indicators
- Slack integration

### Analytics
- Cycle time analysis (Initiative shaping → shipped)
- Thread resolution patterns
- Formation health trends
- Personal velocity metrics

---

## Migration

Database migration file: `src/lib/database/migrations/009-planner-schema.sql`

Run with:
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f 009-planner-schema.sql
```

---

## Technical Stack

- **Backend**: SvelteKit API routes
- **Database**: PostgreSQL with full-text search
- **ORM**: Raw SQL via DatabaseService
- **Services**: initiative.service.ts, formation.service.ts, thread.service.ts, activity-log.service.ts
- **Frontend**: Svelte 5 with runes
- **Styling**: Tailwind CSS

---

## Why This Design?

**Against Jira**: Tasks are not the unit of thought. Jira optimizes for granular tracking, which creates overhead. Planner optimizes for *shared understanding*.

**Against Notion**: Docs are great for artifacts, bad for accountability. Planner is structured around *who owns what* and *what's blocking progress*.

**Against Gantt charts**: Timelines imply false precision. Planner uses **horizons** — signals of intent, not contracts.

**The Innovation**:
- **Threads** replace tasks, tickets, and status updates
- **Formations** replace rigid team structures
- **Energy states** replace burndown charts
- **Intent** precedes execution

---

## Final Thought

Planner is designed to feel like **a conversation about work, not a ledger of tasks**. It respects that creative and R&D work is emergent, not linear. It surfaces problems, clarifies ownership, and creates space for thinking — without demanding ceremony.

**It's not a project management tool. It's a clarity engine.**
