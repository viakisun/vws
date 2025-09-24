<script lang="ts">
  import { logger } from "$lib/utils/logger";

  import { onMount } from "svelte";
  import { DownloadIcon, PrinterIcon } from "@lucide/svelte";

  interface Employee {
    name: string;
    position: string;
    email: string;
    salary?: number;
    job_title?: string;
    isTeamLead?: boolean;
  }

  interface Department {
    name: string;
    position: string;
    type?: string;
    children: Employee[];
  }

  interface Executive {
    name: string;
    position: string;
    email: string;
    children: Department[];
  }

  interface OrgStructure {
    [key: string]: Executive;
  }

  let orgData = $state<OrgStructure>({});
  let loading = $state(true);
  let error = $state("");
  let showPrintView = $state(false);
  let companyName = $state("VIA WorkStream");

  // 회사 정보 로드
  async function loadCompanyInfo() {
    try {
      const response = await fetch("/api/company");
      const result = await response.json();

      if (result.success && result.data) {
        companyName = result.data.name || "VIA WorkStream";
      }
    } catch (err) {
      logger.error("Error loading company info:", err);
      // 기본값 유지
    }
  }

  // 조직도 데이터 로드
  async function loadOrgData() {
    try {
      loading = true;
      const response = await fetch("/api/organization/chart");
      const result = await response.json();

      if (result.success) {
        orgData = result.data;
      } else {
        error = result.error || "조직도 데이터를 불러올 수 없습니다.";
      }
    } catch (err) {
      error = "조직도 데이터를 불러오는 중 오류가 발생했습니다.";
      logger.error("Error loading org data:", err);
    } finally {
      loading = false;
    }
  }

  // CSV 다운로드
  async function downloadCSV() {
    try {
      const response = await fetch("/api/organization/chart/download");
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "organization_chart.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      logger.error("Error downloading CSV:", err);
      alert("다운로드 중 오류가 발생했습니다.");
    }
  }

  // 프린트 뷰 토글
  function togglePrintView() {
    showPrintView = !showPrintView;
    if (showPrintView) {
      document.body.classList.add("print-mode");
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.body.classList.remove("print-mode");
          showPrintView = false;
        }, 1000);
      }, 100);
    }
  }

  // 팀 리더인지 확인
  function isTeamLead(employee: Employee): boolean {
    return (
      employee.job_title === "Team Lead" ||
      employee.position === "Team Lead" ||
      (employee.isTeamLead ?? false)
    );
  }

  // 직원을 정렬 (팀 리더 우선) - 원본 배열을 변경하지 않음
  function sortEmployees(employees: Employee[]): Employee[] {
    return [...employees].sort((a, b) => {
      const aIsTeamLead = isTeamLead(a);
      const bIsTeamLead = isTeamLead(b);

      if (aIsTeamLead && !bIsTeamLead) return -1;
      if (!aIsTeamLead && bIsTeamLead) return 1;

      return a.name.localeCompare(b.name);
    });
  }

  onMount(() => {
    loadCompanyInfo();
    loadOrgData();
  });
</script>

<div class="org-chart-print">
  <!-- 헤더 -->
  <div class="flex items-center justify-between print-hidden mb-4">
    <div>
      <h2 class="text-xl font-bold" style:color="var(--color-text)">조직도</h2>
      <p class="text-xs mt-1" style:color="var(--color-text-secondary)">
        {companyName} 조직 구조
      </p>
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        onclick={togglePrintView}
        class="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
      >
        <PrinterIcon class="w-3 h-3" />
        프린트
      </button>
      <button
        type="button"
        onclick={downloadCSV}
        class="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
      >
        <DownloadIcon class="w-3 h-3" />
        CSV
      </button>
    </div>
  </div>

  <!-- 프린트용 헤더 -->
  <div class="print-visible hidden text-center mb-2">
    <h1 class="text-lg font-bold text-black mb-1">{companyName} 조직도</h1>
    <p class="text-xs text-gray-600">
      생성일: {new Date().toLocaleDateString("ko-KR")}
    </p>
  </div>

  <!-- 로딩 상태 -->
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"
        ></div>
        <p class="text-xs" style:color="var(--color-text-secondary)">
          로딩 중...
        </p>
      </div>
    </div>
  {:else if error}
    <div class="text-center py-8">
      <p class="text-red-600 text-sm mb-2">{error}</p>
      <button
        type="button"
        onclick={loadOrgData}
        class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
      >
        다시 시도
      </button>
    </div>
  {:else}
    <!-- 단순한 조직도 표시 -->
    <div class="space-y-3">
      {#each Object.entries(orgData) as [_execName, executive] (_execName)}
        <div class="border border-gray-300 bg-white">
          <!-- 임원 헤더 -->
          <div class="bg-gray-100 border-b border-gray-300 px-3 py-2">
            <div class="flex items-center gap-2">
              <div
                class="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center"
              >
                <span class="text-white text-xs">■</span>
              </div>
              <span class="font-semibold text-sm text-gray-800"
                >{executive.name}</span
              >
              <span class="text-xs text-gray-600">({executive.position})</span>
            </div>
          </div>

          <!-- 부서들 -->
          <div class="p-2">
            {#each executive.children as department, i (i)}
              <div class="mb-2 last:mb-0">
                <!-- 부서명 -->
                <div class="flex items-center gap-2 mb-1">
                  <div
                    class="w-3 h-3 bg-green-600 rounded-sm flex items-center justify-center"
                  >
                    <span class="text-white text-xs">●</span>
                  </div>
                  <span class="font-medium text-sm text-gray-700"
                    >{department.name}</span
                  >
                </div>

                <!-- 직원들 -->
                <div class="ml-5 space-y-1">
                  {#each sortEmployees(department.children) as employee, idx (idx)}
                    <!-- TODO: replace index key with a stable id when model provides one -->
                    <div class="flex items-center gap-2 text-xs">
                      <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span class="text-gray-800">{employee.name}</span>
                      <span class="text-gray-500">({employee.position})</span>
                      {#if isTeamLead(employee)}
                        <span
                          class="bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded text-xs"
                          >TL</span
                        >
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- 프린트 스타일 -->
<style>
  /* 프린트 모드에서 전체 페이지 숨기기 */
  :global(body.print-mode *) {
    visibility: hidden;
  }

  :global(body.print-mode .org-chart-print),
  :global(body.print-mode .org-chart-print *) {
    visibility: visible;
  }

  :global(body.print-mode .org-chart-print) {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 9999;
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    * {
      visibility: hidden;
    }

    .org-chart-print,
    .org-chart-print * {
      visibility: visible;
    }

    .org-chart-print {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: white !important;
      color: black !important;
      font-family: "Arial", "Helvetica", sans-serif !important;
      margin: 0;
      padding: 5px;
      box-sizing: border-box;
    }

    .print-hidden {
      display: none !important;
    }

    .print-visible {
      display: block !important;
    }
  }
</style>
