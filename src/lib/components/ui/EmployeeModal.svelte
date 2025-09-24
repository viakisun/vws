<script lang="ts">
  import { logger } from "$lib/utils/logger";

  import { formatEmployeeName } from "$lib/utils/format";
  import { splitKoreanName } from "$lib/utils/korean-name";
  import { SaveIcon } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";
  import ThemeModal from "./ThemeModal.svelte";

  interface Employee {
    id?: string;
    employee_id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    salary: number;
    hire_date: string;
    birth_date?: string;
    termination_date?: string;
    status: "active" | "inactive" | "on-leave" | "terminated";
    employment_type: "full-time" | "part-time" | "contract" | "intern";
    job_title_id?: string;
    job_title_name?: string;
    job_title_level?: number;
    job_title_category?: string;
  }

  interface Props {
    open: boolean;
    employee?: Employee | null;
    loading?: boolean;
    departments?: Array<{ id: string; name: string }>;
    positions?: Array<{ id: string; name: string; department: string }>;
    jobTitles?: Array<{
      id: string;
      name: string;
      level: number;
      category: string;
    }>;
  }

  let {
    open,
    employee = null,
    loading = false,
    departments = [],
    positions = [],
    jobTitles = [],
  }: Props = $props();

  const dispatch = createEventDispatcher<{
    close: void;
    save: Employee;
  }>();

  // 폼 데이터
  let formData = $state<Employee>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    salary: 0,
    hire_date: new Date().toISOString().split("T")[0],
    birth_date: "",
    termination_date: "",
    status: "active",
    employment_type: "full-time",
    job_title_id: "",
  });

  // 한국 이름 분리 함수 (통합된 유틸리티 사용)
  // splitKoreanName은 korean-name.ts에서 import

  // 전체 이름 입력 필드
  let fullName = $state("");

  // 전체 이름이 변경될 때 성/이름 자동 분리
  $effect(() => {
    if (fullName && !employee?.id) {
      // 새 직원 추가 시에만 자동 분리
      const { surname, givenName } = splitKoreanName(fullName);
      formData.last_name = surname;
      formData.first_name = givenName;
    }
  });

  // 직원 데이터가 변경될 때 폼 데이터 업데이트
  $effect(() => {
    if (employee) {
      logger.log("Employee data loaded:", employee);
      logger.log("Available positions:", positions);

      formData.first_name = String(employee.first_name || "");
      formData.last_name = String(employee.last_name || "");
      formData.email = String(employee.email || "");
      formData.phone = String(employee.phone || "");
      formData.department = String(employee.department || "");
      formData.position = String(employee.position || "");
      formData.salary = Number(employee.salary || 0);
      formData.hire_date = employee.hire_date
        ? new Date(employee.hire_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      formData.birth_date = employee.birth_date
        ? new Date(employee.birth_date).toISOString().split("T")[0]
        : "";
      formData.termination_date = employee.termination_date
        ? new Date(employee.termination_date).toISOString().split("T")[0]
        : "";
      formData.status = employee.status || "active";
      formData.employment_type = employee.employment_type || "full-time";
      formData.job_title_id = employee.job_title_id || "";
      // 수정 모드에서는 전체 이름을 조합해서 표시
      fullName = formatEmployeeName(employee);

      logger.log("Form data set:", formData);
      logger.log("Filtered positions:", filteredPositions());
    } else {
      // 새 직원 추가 시 기본값으로 리셋
      formData.first_name = "";
      formData.last_name = "";
      formData.email = "";
      formData.phone = "";
      formData.department = "";
      formData.position = "";
      formData.salary = 0;
      formData.hire_date = new Date().toISOString().split("T")[0];
      formData.birth_date = "";
      formData.termination_date = "";
      formData.status = "active";
      formData.employment_type = "full-time";
      formData.job_title_id = "";
      fullName = "";
    }
  });

  // 부서별 직급 매핑
  const _departmentPositionMapping = {
    개발팀: "연구개발",
    PSR팀: "연구개발",
    GRIT팀: "디자인",
    경영지원팀: "행정",
    경영기획팀: "연구개발",
  };

  // 모든 직급 표시 (임시로 필터링 제거)
  let filteredPositions = $derived(() => {
    logger.log("All positions:", positions);
    return positions;
  });

  // 상태 옵션
  const statusOptions = [
    { value: "active", label: "활성" },
    { value: "inactive", label: "비활성" },
    { value: "on-leave", label: "휴직" },
    { value: "terminated", label: "퇴사" },
  ];

  // 고용 형태 옵션
  const employmentTypeOptions = [
    { value: "full-time", label: "정규직" },
    { value: "part-time", label: "계약직" },
    { value: "contract", label: "프리랜서" },
    { value: "intern", label: "인턴" },
  ];

  function handleSave() {
    // 필수 필드 검증
    if (
      !formData.first_name?.trim() ||
      !formData.last_name?.trim() ||
      !formData.email?.trim() ||
      !formData.department?.trim() ||
      !formData.position?.trim()
    ) {
      alert("성, 이름, 이메일, 부서, 직급은 필수 입력 항목입니다.");
      return;
    }

    // 이름 분리 검증 - 성과 이름이 명확히 분리되어야 함
    if (
      formData.first_name.trim().length === 0 ||
      formData.last_name.trim().length === 0
    ) {
      alert("성과 이름은 반드시 분리되어 입력되어야 합니다.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    // salary를 숫자로 변환
    const dataToSave = {
      ...formData,
      salary: Number(formData.salary) || 0,
    };

    // 수정 모드일 때는 id를 포함
    if (employee?.id) {
      dataToSave.id = employee.id;
    }

    dispatch("save", dataToSave);
  }

  function handleClose() {
    dispatch("close");
  }

  let isEdit = $derived(!!employee?.id);
  let title = $derived(isEdit ? "직원 정보 수정" : "새 직원 추가");
</script>

<ThemeModal {open} size="lg" onclose={handleClose}>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold" style:color="var(--color-text)">
        {title}
      </h2>
    </div>

    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      class="space-y-4"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 전체 이름 (새 직원 추가 시에만 표시) -->
        {#if !employee?.id}
          <div class="md:col-span-2">
            <label
              for="full-name"
              class="block text-sm font-medium mb-2"
              style:color="var(--color-text)">전체 이름 *</label
            >
            <input
              id="full-name"
              type="text"
              bind:value={fullName}
              placeholder="예: 김철수, John Smith"
              required
              class="w-full px-3 py-2 border rounded-md text-sm"
              style:background="var(--color-surface)"
              style:border-color="var(--color-border)"
              style:color="var(--color-text)"
            />
            <p class="text-xs mt-1" style:color="var(--color-text-secondary)">
              한글 이름은 첫 글자가 성으로 자동 분리됩니다.
            </p>
          </div>
        {/if}

        <!-- 성 -->
        <div>
          <label
            for="last-name"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">성 *</label
          >
          <input
            id="last-name"
            type="text"
            bind:value={formData.last_name}
            placeholder="성을 입력하세요"
            required
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          />
        </div>

        <!-- 이름 -->
        <div>
          <label
            for="first-name"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">이름 *</label
          >
          <input
            id="first-name"
            type="text"
            bind:value={formData.first_name}
            placeholder="이름을 입력하세요"
            required
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          />
        </div>

        <!-- 이메일 -->
        <div>
          <label
            for="email"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">이메일 *</label
          >
          <input
            id="email"
            type="email"
            bind:value={formData.email}
            placeholder="이메일을 입력하세요"
            required
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          />
        </div>

        <!-- 전화번호 -->
        <div>
          <label
            for="phone"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">전화번호</label
          >
          <input
            id="phone"
            type="tel"
            bind:value={formData.phone}
            placeholder="전화번호를 입력하세요"
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          />
        </div>

        <!-- 부서 -->
        <div>
          <label
            for="department"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">부서 *</label
          >
          <select
            id="department"
            bind:value={formData.department}
            required
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          >
            <option value="">부서를 선택하세요</option>
            <option value="대표">대표</option>
            <option value="전략기획실">전략기획실</option>
            <option value="연구소">연구소</option>
            {#each departments.filter((d) => !["대표", "전략기획실", "연구소", "부서없음"].includes(d.name)) as dept, idx (idx)}
              <!-- TODO: replace index key with a stable id when model provides one -->
              <option value={dept.name}>{dept.name}</option>
            {/each}
            <option value="부서없음">부서없음</option>
          </select>
        </div>

        <!-- 직급 -->
        <div>
          <label
            for="position"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">직급 *</label
          >
          <select
            id="position"
            bind:value={formData.position}
            required
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          >
            <option value="">직급을 선택하세요</option>
            {#each filteredPositions() as pos, idx (idx)}
              <!-- TODO: replace index key with a stable id when model provides one -->
              <option value={pos.name}>{pos.name} ({pos.department})</option>
            {/each}
          </select>
          <!-- 디버깅 정보 -->
          {#if filteredPositions().length === 0}
            <p class="text-xs text-red-500 mt-1">
              직급 데이터가 없습니다. positions: {positions.length}개
            </p>
          {:else}
            <p class="text-xs text-green-500 mt-1">
              직급 {filteredPositions().length}개 로드됨
            </p>
          {/if}
        </div>

        <!-- 직책 (선택사항) -->
        <div>
          <label
            for="job-title"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">직책</label
          >
          <select
            id="job-title"
            bind:value={formData.job_title_id}
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          >
            <option value="">직책을 선택하세요 (선택사항)</option>
            {#each jobTitles as jobTitle, i (i)}
              <option value={jobTitle.id}
                >{jobTitle.name} ({jobTitle.category})</option
              >
            {/each}
          </select>
          <p class="text-xs mt-1" style:color="var(--color-text-secondary)">
            직책이 있으면 직급 대신 직책으로 표시됩니다.
          </p>
        </div>

        <!-- 급여 -->
        <div>
          <label
            for="salary"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">급여 *</label
          >
          <input
            id="salary"
            type="number"
            bind:value={formData.salary}
            placeholder="급여를 입력하세요"
            required
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          />
        </div>

        <!-- 입사일 -->
        <div>
          <label
            for="hire-date"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">입사일 *</label
          >
          <input
            id="hire-date"
            type="date"
            bind:value={formData.hire_date}
            required
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          />
        </div>

        <!-- 생일 -->
        <div>
          <label
            for="birth-date"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">생일</label
          >
          <input
            id="birth-date"
            type="date"
            bind:value={formData.birth_date}
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          />
        </div>

        <!-- 퇴사일 -->
        <div>
          <label
            for="termination-date"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">퇴사일</label
          >
          <input
            id="termination-date"
            type="date"
            bind:value={formData.termination_date}
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          />
        </div>

        <!-- 상태 -->
        <div>
          <label
            for="status"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">상태</label
          >
          <select
            id="status"
            bind:value={formData.status}
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          >
            {#each statusOptions as option, i (i)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <!-- 고용 형태 -->
        <div>
          <label
            for="employment-type"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text)">고용 형태</label
          >
          <select
            id="employment-type"
            bind:value={formData.employment_type}
            class="w-full px-3 py-2 border rounded-md text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
          >
            {#each employmentTypeOptions as option, i (i)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <div
        class="flex items-center justify-end gap-3 pt-6 border-t"
        style:border-color="var(--color-border)"
      >
        <button
          type="button"
          onclick={handleClose}
          disabled={loading}
          class="px-4 py-2 text-sm font-medium rounded-md border transition-colors"
          style:border-color="var(--color-border)"
          style:color="var(--color-text)"
          style:background="var(--color-surface)"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          class="px-4 py-2 text-sm font-medium rounded-md text-white transition-colors flex items-center gap-2"
          style:background="var(--color-primary)"
        >
          {#if loading}
            <div
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
          {:else}
            <SaveIcon size={16} />
          {/if}
          {isEdit ? "수정" : "추가"}
        </button>
      </div>
    </form>
  </div>
</ThemeModal>
