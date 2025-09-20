<script lang="ts">
  import { userTimezone } from '$lib/stores/timezone'
  import { SUPPORTED_TIMEZONES } from '$lib/utils/timezone'
  import { CheckIcon, PlusIcon, TrashIcon, XIcon } from '@lucide/svelte'
  import { createEventDispatcher } from 'svelte'
  
  const dispatch = createEventDispatcher();
  
  // 폼 데이터 상태
  let projectData = $state({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    totalBudget: 0,
    annualPeriods: [] as Array<{
      periodNumber: number;
      startDate: string;
      endDate: string;
      budget: number;
    }>,
    budgetCategories: [
      { name: '인건비', percentage: 40 },
      { name: '재료비', percentage: 30 },
      { name: '연구활동비', percentage: 20 },
      { name: '간접비', percentage: 10 }
    ],
    members: [] as Array<{
      employeeId: string;
      role: string;
      participationRate: number;
      monthlyAmount: number;
      startDate: string;
      endDate: string;
    }>,
    evidenceSettings: {
      autoGenerate: true,
      namingConvention: '{name}({year}-{month})'
    }
  });
  
  // UI 상태
  let isSubmitting = $state(false);
  let validationErrors = $state<string[]>([]);
  let currentStep = $state(1);
  let showPreview = $state(false);
  
  // 단계별 폼 검증
  function validateStep(step: number): boolean {
    const errors: string[] = [];
    
    switch (step) {
      case 1: // 기본 정보
        if (!projectData.name.trim()) errors.push('프로젝트명을 입력해주세요.');
        if (!projectData.startDate) errors.push('시작일을 선택해주세요.');
        if (!projectData.endDate) errors.push('종료일을 선택해주세요.');
        if (new Date(projectData.startDate) >= new Date(projectData.endDate)) {
          errors.push('종료일은 시작일보다 늦어야 합니다.');
        }
        if (projectData.totalBudget <= 0) errors.push('총 예산을 입력해주세요.');
        break;
        
      case 2: // 연차별 예산
        if (projectData.annualPeriods.length === 0) {
          errors.push('최소 1개 이상의 연차를 설정해주세요.');
        }
        
        const totalBudgetFromPeriods = projectData.annualPeriods.reduce((sum, period) => sum + period.budget, 0);
        if (Math.abs(totalBudgetFromPeriods - projectData.totalBudget) > 1000) {
          errors.push(`연차별 예산 합계(${totalBudgetFromPeriods.toLocaleString()}원)와 총 예산(${projectData.totalBudget.toLocaleString()}원)이 일치하지 않습니다.`);
        }
        break;
        
      case 3: // 참여연구원
        if (projectData.members.length === 0) {
          errors.push('최소 1명 이상의 참여연구원을 등록해주세요.');
        }
        
        // 참여율 검증
        for (const member of projectData.members) {
          if (member.participationRate <= 0 || member.participationRate > 100) {
            errors.push(`${member.employeeId}의 참여율은 0% 초과 100% 이하여야 합니다.`);
          }
        }
        
        // 연차별 참여율 합계 및 참여기간 검증
        for (const period of projectData.annualPeriods) {
          const periodMembers = projectData.members.filter(member => 
            new Date(member.startDate) <= new Date(period.endDate) && 
            new Date(member.endDate) >= new Date(period.startDate)
          );
          
          const totalParticipationRate = periodMembers.reduce((sum, member) => sum + member.participationRate, 0);
          if (totalParticipationRate > 100) {
            errors.push(`${period.periodNumber}차년도 참여연구원 참여율 합계(${totalParticipationRate}%)가 100%를 초과합니다.`);
          }
          
          // 참여연구원 참여기간이 사업 기간과 일치하는지 검증 (UTC 기준)
          for (const member of projectData.members) {
            // 모든 날짜를 UTC 기준으로 변환하여 비교
            const memberStartUtc = new Date(member.startDate + 'T00:00:00.000Z');
            const memberEndUtc = new Date(member.endDate + 'T23:59:59.999Z');
            const periodStartUtc = new Date(period.startDate + 'T00:00:00.000Z');
            const periodEndUtc = new Date(period.endDate + 'T23:59:59.999Z');
            
            // 참여기간이 사업 기간을 벗어나는 경우 경고
            if (memberStartUtc < periodStartUtc || memberEndUtc > periodEndUtc) {
              const overlapStart = memberStartUtc < periodStartUtc ? periodStartUtc : memberStartUtc;
              const overlapEnd = memberEndUtc > periodEndUtc ? periodEndUtc : memberEndUtc;
              const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
              const periodDays = Math.ceil((periodEndUtc.getTime() - periodStartUtc.getTime()) / (1000 * 60 * 60 * 24));
              const overlapPercentage = Math.round((overlapDays / periodDays) * 100);
              
              if (overlapPercentage < 100) {
                errors.push(
                  `${member.employeeId}의 참여기간(${member.startDate} ~ ${member.endDate})이 ${period.periodNumber}차년도 사업기간(${period.startDate} ~ ${period.endDate})과 ${overlapPercentage}%만 일치합니다.`
                );
              }
            }
          }
        }
        break;
    }
    
    validationErrors = errors;
    return errors.length === 0;
  }
  
  // 다음 단계로 이동
  function nextStep() {
    if (validateStep(currentStep)) {
      currentStep++;
    }
  }
  
  // 이전 단계로 이동
  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      validationErrors = [];
    }
  }
  
  // 연차 추가
  function addPeriod() {
    const lastPeriod = projectData.annualPeriods[projectData.annualPeriods.length - 1];
    const nextPeriodNumber = lastPeriod ? lastPeriod.periodNumber + 1 : 1;
    
    let startDate = '';
    let endDate = '';
    
    if (lastPeriod) {
      // 이전 연차 종료일을 UTC 기준으로 해석
      const lastEndUtc = new Date(lastPeriod.endDate + 'T00:00:00.000Z');
      
      // 다음 연차 시작일: 이전 연차 종료일 + 1일 (UTC 기준)
      const nextStartUtc = new Date(lastEndUtc.getTime() + 24 * 60 * 60 * 1000);
      
      // UTC를 사용자 타임존으로 변환하여 YYYY-MM-DD 형식으로 변환
      const userTimezoneString = SUPPORTED_TIMEZONES[$userTimezone];
      const nextStartLocal = new Date(nextStartUtc.toLocaleString('en-US', { timeZone: userTimezoneString }));
      const year = nextStartLocal.getFullYear();
      const month = String(nextStartLocal.getMonth() + 1).padStart(2, '0');
      const day = String(nextStartLocal.getDate()).padStart(2, '0');
      startDate = `${year}-${month}-${day}`;
      
      // 다음 연차 종료일: 시작일에서 1년 후 - 1일 (UTC 기준)
      const nextYearStartUtc = new Date(startDate + 'T00:00:00.000Z');
      const nextYearEndUtc = new Date(nextYearStartUtc.getTime() + (365 * 24 * 60 * 60 * 1000) - (24 * 60 * 60 * 1000));
      
      // UTC를 사용자 타임존으로 변환
      const nextYearEndLocal = new Date(nextYearEndUtc.toLocaleString('en-US', { timeZone: userTimezoneString }));
      const endYear = nextYearEndLocal.getFullYear();
      const endMonth = String(nextYearEndLocal.getMonth() + 1).padStart(2, '0');
      const endDay = String(nextYearEndLocal.getDate()).padStart(2, '0');
      endDate = `${endYear}-${endMonth}-${endDay}`;
    } else {
      startDate = projectData.startDate;
      
      // 프로젝트 시작일을 UTC 기준으로 해석
      const startUtc = new Date(projectData.startDate + 'T00:00:00.000Z');
      
      // 첫 연차 종료일: 시작일에서 1년 후 - 1일 (UTC 기준)
      const endUtc = new Date(startUtc.getTime() + (365 * 24 * 60 * 60 * 1000) - (24 * 60 * 60 * 1000));
      
      // UTC를 사용자 타임존으로 변환
      const userTimezoneString = SUPPORTED_TIMEZONES[$userTimezone];
      const endLocal = new Date(endUtc.toLocaleString('en-US', { timeZone: userTimezoneString }));
      const endYear = endLocal.getFullYear();
      const endMonth = String(endLocal.getMonth() + 1).padStart(2, '0');
      const endDay = String(endLocal.getDate()).padStart(2, '0');
      endDate = `${endYear}-${endMonth}-${endDay}`;
    }
    
    projectData.annualPeriods.push({
      periodNumber: nextPeriodNumber,
      startDate,
      endDate,
      budget: Math.round(projectData.totalBudget / (projectData.annualPeriods.length + 1))
    });
  }
  
  // 연차 삭제
  function removePeriod(index: number) {
    projectData.annualPeriods.splice(index, 1);
    // 연차 번호 재정렬
    projectData.annualPeriods.forEach((period, idx) => {
      period.periodNumber = idx + 1;
    });
  }
  
  // 참여연구원 추가
  function addMember() {
    projectData.members.push({
      employeeId: '',
      role: '연구원',
      participationRate: 0,
      monthlyAmount: 0,
      startDate: projectData.startDate,
      endDate: projectData.endDate
    });
  }
  
  // 참여연구원 삭제
  function removeMember(index: number) {
    projectData.members.splice(index, 1);
  }
  
  // 동적 타임존 기준 날짜 형식 변환 (YYYY-MM-DD 형식으로)
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    // 이미 YYYY-MM-DD 형식이면 그대로 반환
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    
    try {
      // UTC 시간으로 해석하여 사용자 타임존으로 변환
      const utcDate = new Date(dateStr + 'T00:00:00.000Z');
      if (isNaN(utcDate.getTime())) return '';
      
      // 사용자 타임존으로 변환
      const userTimezoneString = SUPPORTED_TIMEZONES[$userTimezone];
      const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: userTimezoneString }));
      
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };
  
  // 예산 항목 비율 자동 조정
  function adjustBudgetPercentages() {
    const total = projectData.budgetCategories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (total !== 100) {
      const factor = 100 / total;
      projectData.budgetCategories.forEach(cat => {
        cat.percentage = Math.round(cat.percentage * factor);
      });
    }
  }
  
  // 프로젝트 생성
  async function createProject() {
    if (!validateStep(currentStep)) return;
    
    isSubmitting = true;
    validationErrors = [];
    
    try {
      console.log('🚀 [UI] 프로젝트 생성 요청 시작');
      console.log('📋 [UI] 전송 데이터:', JSON.stringify(projectData, null, 2));
      
      const response = await fetch('/api/project-management/create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [UI] 프로젝트 생성 성공:', result);
        dispatch('projectCreated', result);
        // 성공 후 폼 초기화 또는 페이지 이동
      } else {
        console.log('❌ [UI] 프로젝트 생성 실패:', result.errors);
        validationErrors = result.errors || ['프로젝트 생성 중 오류가 발생했습니다.'];
      }
    } catch (error) {
      console.error('💥 [UI] 프로젝트 생성 중 오류:', error);
      validationErrors = ['프로젝트 생성 중 오류가 발생했습니다.'];
    } finally {
      isSubmitting = false;
    }
  }
  
  // 미리보기 토글
  function togglePreview() {
    if (validateStep(currentStep)) {
      showPreview = !showPreview;
    }
  }
</script>

<div class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
  <h2 class="text-2xl font-bold text-gray-900 mb-6">새 프로젝트 생성</h2>
  
  <!-- 진행 단계 표시 -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      {#each [1, 2, 3, 4] as step}
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            {step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}">
            {step}
          </div>
          <span class="ml-2 text-sm font-medium
            {step <= currentStep ? 'text-blue-600' : 'text-gray-500'}">
            {step === 1 ? '기본 정보' : step === 2 ? '연차별 예산' : step === 3 ? '참여연구원' : '미리보기'}
          </span>
        </div>
        {#if step < 4}
          <div class="flex-1 h-0.5 bg-gray-200 mx-4"></div>
        {/if}
      {/each}
    </div>
  </div>
  
  <!-- 검증 오류 표시 -->
  {#if validationErrors.length > 0}
    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center">
        <XIcon class="w-5 h-5 text-red-500 mr-2" />
        <h3 class="text-sm font-medium text-red-800">검증 오류</h3>
      </div>
      <ul class="mt-2 text-sm text-red-700">
        {#each validationErrors as error}
          <li>• {error}</li>
        {/each}
      </ul>
    </div>
  {/if}
  
  <!-- 단계별 폼 -->
  {#if currentStep === 1}
    <!-- 1단계: 기본 정보 -->
    <div class="space-y-6">
      <h3 class="text-lg font-semibold text-gray-900">기본 정보</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="projectName" class="block text-sm font-medium text-gray-700 mb-2">
            프로젝트명 *
          </label>
          <input
            id="projectName"
            type="text"
            bind:value={projectData.name}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="프로젝트명을 입력하세요"
          />
        </div>
        
        <div>
          <label for="totalBudget" class="block text-sm font-medium text-gray-700 mb-2">
            총 예산 (원) *
          </label>
          <input
            id="totalBudget"
            type="number"
            bind:value={projectData.totalBudget}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        
        <div>
          <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
            시작일 *
          </label>
          <input
            id="startDate"
            type="date"
            value={formatDateForInput(projectData.startDate)}
            onchange={(e) => projectData.startDate = (e.target as HTMLInputElement).value}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
            종료일 *
          </label>
          <input
            id="endDate"
            type="date"
            value={formatDateForInput(projectData.endDate)}
            onchange={(e) => projectData.endDate = (e.target as HTMLInputElement).value}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          프로젝트 설명
        </label>
        <textarea
          id="description"
          bind:value={projectData.description}
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="프로젝트에 대한 설명을 입력하세요"
        ></textarea>
      </div>
    </div>
    
  {:else if currentStep === 2}
    <!-- 2단계: 연차별 예산 -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">연차별 예산</h3>
        <button
          type="button"
          onclick={addPeriod}
          class="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon class="w-4 h-4 mr-1" />
          연차 추가
        </button>
      </div>
      
      <div class="space-y-4">
        {#each projectData.annualPeriods as period, index}
          <div class="p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium text-gray-900">{period.periodNumber}차년도</h4>
              {#if projectData.annualPeriods.length > 1}
                <button
                  type="button"
                  onclick={() => removePeriod(index)}
                  class="text-red-600 hover:text-red-800"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              {/if}
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="period-{index}-start" class="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  id="period-{index}-start"
                  type="date"
                  value={formatDateForInput(period.startDate)}
                  onchange={(e) => period.startDate = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="period-{index}-end" class="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  id="period-{index}-end"
                  type="date"
                  value={formatDateForInput(period.endDate)}
                  onchange={(e) => period.endDate = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="period-{index}-budget" class="block text-sm font-medium text-gray-700 mb-1">예산 (원)</label>
                <input
                  id="period-{index}-budget"
                  type="number"
                  bind:value={period.budget}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- 예산 항목별 배분 -->
      <div class="mt-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">예산 항목별 배분</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each projectData.budgetCategories as category, index}
            <div class="flex items-center space-x-3">
              <label for="category-{index}-percentage" class="block text-sm font-medium text-gray-700 w-24">
                {category.name}
              </label>
              <input
                id="category-{index}-percentage"
                type="number"
                bind:value={category.percentage}
                min="0"
                max="100"
                class="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-500">%</span>
            </div>
          {/each}
        </div>
        
        <div class="mt-4">
          <button
            type="button"
            onclick={adjustBudgetPercentages}
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            비율 자동 조정
          </button>
        </div>
      </div>
    </div>
    
  {:else if currentStep === 3}
    <!-- 3단계: 참여연구원 -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">참여연구원</h3>
        <button
          type="button"
          onclick={addMember}
          class="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon class="w-4 h-4 mr-1" />
          연구원 추가
        </button>
      </div>
      
      <div class="space-y-4">
        {#each projectData.members as member, index}
          <div class="p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium text-gray-900">참여연구원 {index + 1}</h4>
              <button
                type="button"
                onclick={() => removeMember(index)}
                class="text-red-600 hover:text-red-800"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label for="member-{index}-employee" class="block text-sm font-medium text-gray-700 mb-1">직원 ID</label>
                <input
                  id="member-{index}-employee"
                  type="text"
                  bind:value={member.employeeId}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="직원 ID"
                />
              </div>
              
              <div>
                <label for="member-{index}-role" class="block text-sm font-medium text-gray-700 mb-1">역할</label>
                <select
                  id="member-{index}-role"
                  bind:value={member.role}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="연구원">연구원</option>
                  <option value="선임연구원">선임연구원</option>
                  <option value="책임연구원">책임연구원</option>
                  <option value="프로젝트매니저">프로젝트매니저</option>
                </select>
              </div>
              
              <div>
                <label for="member-{index}-participation" class="block text-sm font-medium text-gray-700 mb-1">참여율 (%)</label>
                <input
                  id="member-{index}-participation"
                  type="number"
                  bind:value={member.participationRate}
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="member-{index}-salary" class="block text-sm font-medium text-gray-700 mb-1">월 급여 (원)</label>
                <input
                  id="member-{index}-salary"
                  type="number"
                  bind:value={member.monthlyAmount}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="member-{index}-start" class="block text-sm font-medium text-gray-700 mb-1">참여 시작일</label>
                <input
                  id="member-{index}-start"
                  type="date"
                  bind:value={member.startDate}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="member-{index}-end" class="block text-sm font-medium text-gray-700 mb-1">참여 종료일</label>
                <input
                  id="member-{index}-end"
                  type="date"
                  bind:value={member.endDate}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    
  {:else if currentStep === 4}
    <!-- 4단계: 미리보기 -->
    <div class="space-y-6">
      <h3 class="text-lg font-semibold text-gray-900">프로젝트 미리보기</h3>
      
      <div class="bg-gray-50 p-6 rounded-lg">
        <h4 class="font-medium text-gray-900 mb-4">기본 정보</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span class="font-medium">프로젝트명:</span> {projectData.name}</div>
          <div><span class="font-medium">총 예산:</span> {projectData.totalBudget.toLocaleString()}원</div>
          <div><span class="font-medium">시작일:</span> {projectData.startDate}</div>
          <div><span class="font-medium">종료일:</span> {projectData.endDate}</div>
        </div>
        
        <h4 class="font-medium text-gray-900 mb-4 mt-6">연차별 예산</h4>
        <div class="space-y-2 text-sm">
          {#each projectData.annualPeriods as period}
            <div class="flex justify-between">
              <span>{period.periodNumber}차년도 ({period.startDate} ~ {period.endDate})</span>
              <span>{period.budget.toLocaleString()}원</span>
            </div>
          {/each}
        </div>
        
        <h4 class="font-medium text-gray-900 mb-4 mt-6">참여연구원</h4>
        <div class="space-y-2 text-sm">
          {#each projectData.members as member}
            <div class="flex justify-between">
              <span>{member.employeeId} ({member.role})</span>
              <span>{member.participationRate}% - {member.monthlyAmount.toLocaleString()}원/월</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
  
  <!-- 하단 버튼 -->
  <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
    <button
      type="button"
      onclick={prevStep}
      disabled={currentStep === 1}
      class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      이전
    </button>
    
    <div class="flex space-x-3">
      {#if currentStep < 4}
        <button
          type="button"
          onclick={nextStep}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          다음
        </button>
      {:else}
        <button
          type="button"
          onclick={createProject}
          disabled={isSubmitting}
          class="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {#if isSubmitting}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            생성 중...
          {:else}
            <CheckIcon class="w-4 h-4 mr-2" />
            프로젝트 생성
          {/if}
        </button>
      {/if}
    </div>
  </div>
</div>

