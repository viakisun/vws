<script lang="ts">
  import { onMount } from 'svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Modal from '$lib/components/ui/Modal.svelte'
  import { formatDate } from '$lib/utils/format'

  import { employees, getActiveEmployees } from '$lib/stores/hr'

  import {
    performanceReviews,
    feedback360,
    competencyMatrix,
    trainingRecords,
    addPerformanceReview,
    updatePerformanceReview,
    completePerformanceReview,
    approvePerformanceReview,
    addFeedback360,
    getPerformanceReviewsByEmployee,
    getFeedback360ByReviewee,
    getCompetencyMatrixByEmployee,
    getTrainingRecordsByEmployee,
    calculateAverageFeedback360,
    type PerformanceReview,
    type Feedback360
  } from '$lib/stores/performance'

  // 현재 선택된 직원
  let selectedEmployeeId = $state('')
  let selectedYear = $state(new Date().getFullYear())

  // 모달 상태
  let isReviewModalOpen = $state(false)
  let isFeedbackModalOpen = $state(false)
  let isCompetencyModalOpen = $state(false)
  let isTrainingModalOpen = $state(false)
  let selectedReview = $state<PerformanceReview | null>(null)

  // 폼 데이터
  let reviewForm = $state({
    reviewerId: '',
    reviewPeriod: {
      startDate: '',
      endDate: '',
      year: 0,
      quarter: 1
    },
    reviewType: 'annual' as PerformanceReview['reviewType'],
    goals: [
      {
        id: '',
        title: '',
        description: '',
        target: '',
        actual: '',
        achievement: 0,
        weight: 0,
        rating: 0,
        comments: ''
      }
    ],
    competencies: [{ id: '', name: '', description: '', rating: 0, evidence: '', improvement: '' }],
    overallRating: 0,
    strengths: [''],
    improvementAreas: [''],
    developmentPlan: '',
    careerGoals: '',
    promotionRecommendation: false,
    salaryIncreaseRecommendation: false,
    bonusRecommendation: false
  })

  // Update review form year when selectedYear changes
  $effect(() => {
    reviewForm.reviewPeriod.year = selectedYear
  })

  let feedbackForm = $state({
    revieweeId: '',
    reviewerType: 'peer' as Feedback360['reviewerType'],
    reviewPeriod: {
      startDate: '',
      endDate: ''
    },
    leadership: 3,
    communication: 3,
    teamwork: 3,
    problemSolving: 3,
    initiative: 3,
    adaptability: 3,
    technicalSkills: 3,
    strengths: '',
    improvementAreas: '',
    recommendations: '',
    additionalComments: '',
    isAnonymous: false
  })

  // 현재 선택된 직원의 데이터
  let selectedEmployee = $derived($employees.find(emp => emp.id === selectedEmployeeId))
  let employeeReviews = $derived(
    getPerformanceReviewsByEmployee(selectedEmployeeId, $performanceReviews)
  )
  let employeeFeedback = $derived(getFeedback360ByReviewee(selectedEmployeeId, $feedback360))
  let employeeCompetencies = $derived(
    getCompetencyMatrixByEmployee(selectedEmployeeId, $competencyMatrix)
  )
  let employeeTraining = $derived(
    getTrainingRecordsByEmployee(selectedEmployeeId, $trainingRecords)
  )
  let averageFeedback = $derived(calculateAverageFeedback360(selectedEmployeeId, $feedback360))

  // 함수들
  function openReviewModal(review?: PerformanceReview) {
    if (review) {
      selectedReview = review
      reviewForm = {
        reviewerId: review.reviewerId,
        reviewPeriod: review.reviewPeriod,
        reviewType: review.reviewType,
        goals: review.goals,
        competencies: review.competencies,
        overallRating: review.overallRating,
        strengths: review.strengths,
        improvementAreas: review.improvementAreas,
        developmentPlan: review.developmentPlan,
        careerGoals: review.careerGoals,
        promotionRecommendation: review.promotionRecommendation,
        salaryIncreaseRecommendation: review.salaryIncreaseRecommendation,
        bonusRecommendation: review.bonusRecommendation
      }
    } else {
      selectedReview = null
      reviewForm = {
        reviewerId: 'current-user',
        reviewPeriod: {
          startDate: `${selectedYear}-01-01`,
          endDate: `${selectedYear}-12-31`,
          year: selectedYear,
          quarter: 1
        },
        reviewType: 'annual',
        goals: [
          {
            id: '',
            title: '',
            description: '',
            target: '',
            actual: '',
            achievement: 0,
            weight: 0,
            rating: 0,
            comments: ''
          }
        ],
        competencies: [
          { id: '', name: '', description: '', rating: 0, evidence: '', improvement: '' }
        ],
        overallRating: 0,
        strengths: [''],
        improvementAreas: [''],
        developmentPlan: '',
        careerGoals: '',
        promotionRecommendation: false,
        salaryIncreaseRecommendation: false,
        bonusRecommendation: false
      }
    }
    isReviewModalOpen = true
  }

  function openFeedbackModal() {
    feedbackForm = {
      revieweeId: selectedEmployeeId,
      reviewerType: 'peer',
      reviewPeriod: {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`
      },
      leadership: 3,
      communication: 3,
      teamwork: 3,
      problemSolving: 3,
      initiative: 3,
      adaptability: 3,
      technicalSkills: 3,
      strengths: '',
      improvementAreas: '',
      recommendations: '',
      additionalComments: '',
      isAnonymous: false
    }
    isFeedbackModalOpen = true
  }

  function handleReviewSubmit() {
    if (!selectedEmployeeId) {
      alert('직원을 선택해주세요.')
      return
    }

    if (selectedReview) {
      updatePerformanceReview(selectedReview.id, reviewForm)
    } else {
      addPerformanceReview({
        employeeId: selectedEmployeeId,
        ...reviewForm,
        status: 'draft'
      })
    }
    isReviewModalOpen = false
    alert('성과 평가가 저장되었습니다.')
  }

  function handleFeedbackSubmit() {
    if (!selectedEmployeeId) {
      alert('직원을 선택해주세요.')
      return
    }

    addFeedback360({
      reviewerId: 'current-user',
      ...feedbackForm,
      status: 'pending'
    })
    isFeedbackModalOpen = false
    alert('360도 피드백이 제출되었습니다.')
  }

  function completeReview(reviewId: string) {
    completePerformanceReview(reviewId)
    alert('성과 평가가 완료되었습니다.')
  }

  function approveReview(reviewId: string) {
    approvePerformanceReview(reviewId, 'HR팀')
    alert('성과 평가가 승인되었습니다.')
  }

  function getStatusBadgeVariant(
    status: PerformanceReview['status']
  ): 'secondary' | 'warning' | 'success' | 'primary' {
    switch (status) {
      case 'draft':
        return 'secondary'
      case 'in-progress':
        return 'warning'
      case 'completed':
        return 'success'
      case 'approved':
        return 'primary'
      default:
        return 'secondary'
    }
  }

  function getStatusText(status: PerformanceReview['status']): string {
    switch (status) {
      case 'draft':
        return '임시저장'
      case 'in-progress':
        return '진행중'
      case 'completed':
        return '완료'
      case 'approved':
        return '승인'
      default:
        return status
    }
  }

  function getRatingStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  onMount(() => {
    // 첫 번째 활성 직원을 기본 선택
    const activeEmployees = getActiveEmployees($employees)
    if (activeEmployees.length > 0) {
      selectedEmployeeId = activeEmployees[0].id
    }
  })
</script>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- 헤더 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">성과 평가</h1>
      <p class="text-gray-600 mt-1">직원의 성과 평가 및 360도 피드백을 관리합니다</p>
    </div>

    <!-- 직원 선택 -->
    <Card class="mb-6">
      <div class="p-6">
        <div class="flex items-center space-x-4">
          <label
            for="employee-select"
            class="text-sm font-medium text-gray-700">직원 선택:</label>
          <select
            id="employee-select"
            bind:value={selectedEmployeeId}
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">직원을 선택하세요</option>
            {#each getActiveEmployees($employees) as employee}
              <option value={employee.id}>{employee.name} ({employee.employeeId})</option>
            {/each}
          </select>
          <label
            for="year-select"
            class="text-sm font-medium text-gray-700">평가 연도:</label>
          <select
            id="year-select"
            bind:value={selectedYear}
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
          </select>
        </div>
      </div>
    </Card>

    {#if selectedEmployee}
      <!-- 360도 피드백 요약 -->
      {#if averageFeedback.overall > 0}
        <Card class="mb-6">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">360도 피드백 요약</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="text-center">
                <p class="text-sm text-gray-600">리더십</p>
                <p class="text-2xl font-bold text-gray-900">{averageFeedback.leadership}</p>
                <p class="text-sm text-yellow-500">{getRatingStars(averageFeedback.leadership)}</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-600">커뮤니케이션</p>
                <p class="text-2xl font-bold text-gray-900">{averageFeedback.communication}</p>
                <p class="text-sm text-yellow-500">
                  {getRatingStars(averageFeedback.communication)}
                </p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-600">팀워크</p>
                <p class="text-2xl font-bold text-gray-900">{averageFeedback.teamwork}</p>
                <p class="text-sm text-yellow-500">{getRatingStars(averageFeedback.teamwork)}</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-600">기술적 역량</p>
                <p class="text-2xl font-bold text-gray-900">{averageFeedback.technicalSkills}</p>
                <p class="text-sm text-yellow-500">
                  {getRatingStars(averageFeedback.technicalSkills)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      {/if}

      <!-- 성과 평가 및 360도 피드백 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- 성과 평가 -->
        <Card>
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900">성과 평가</h3>
              <button type="button"
                onclick={() => openReviewModal()}
                class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                평가 작성
              </button>
            </div>
            <div class="space-y-3">
              {#each employeeReviews.filter(review => review.reviewPeriod.year === selectedYear) as review}
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {review.reviewType === 'annual'
                        ? '연간'
                        : review.reviewType === 'quarterly'
                        ? '분기'
                        : '프로젝트'} 평가
                    </p>
                    <p class="text-xs text-gray-500">
                      {formatDate(review.reviewPeriod.startDate)} - {formatDate(
                        review.reviewPeriod.endDate
                      )}
                    </p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <Badge variant={getStatusBadgeVariant(review.status)}>
                      {getStatusText(review.status)}
                    </Badge>
                    <div class="flex space-x-1">
                      <button type="button"
                        onclick={() => openReviewModal(review)}
                        class="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        보기
                      </button>
                      {#if review.status === 'completed'}
                        <button type="button"
                          onclick={() => approveReview(review.id)}
                          class="text-green-600 hover:text-green-900 text-sm"
                        >
                          승인
                        </button>
                      {:else if review.status === 'draft'}
                        <button type="button"
                          onclick={() => completeReview(review.id)}
                          class="text-yellow-600 hover:text-yellow-900 text-sm"
                        >
                          완료
                        </button>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </Card>

        <!-- 360도 피드백 -->
        <Card>
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900">360도 피드백</h3>
              <button type="button"
                onclick={openFeedbackModal}
                class="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                피드백 작성
              </button>
            </div>
            <div class="space-y-3">
              {#each employeeFeedback.filter(feedback => new Date(feedback.reviewPeriod.startDate).getFullYear() === selectedYear) as feedback}
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {feedback.reviewerType === 'manager'
                        ? '상사'
                        : feedback.reviewerType === 'peer'
                        ? '동료'
                        : feedback.reviewerType === 'subordinate'
                        ? '부하직원'
                        : '자기평가'}
                    </p>
                    <p class="text-xs text-gray-500">
                      종합점수: {feedback.leadership +
                        feedback.communication +
                        feedback.teamwork +
                        feedback.problemSolving +
                        feedback.initiative +
                        feedback.adaptability +
                        feedback.technicalSkills}/35
                    </p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <Badge variant={feedback.status === 'completed' ? 'success' : 'warning'}>
                      {feedback.status === 'completed' ? '완료' : '대기중'}
                    </Badge>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </Card>
      </div>

      <!-- 역량 매트릭스 및 교육 이수 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 역량 매트릭스 -->
        <Card>
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">역량 매트릭스</h3>
            <div class="space-y-3">
              {#each employeeCompetencies as competency, i (i)}
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{competency.competencyName}</p>
                    <p class="text-xs text-gray-500">
                      마지막 평가: {formatDate(competency.lastAssessed)}
                    </p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="flex">
                      {#each Array(5) as _, i}
                        <div
                          class="w-4 h-4 {i < competency.level
                            ? 'bg-blue-500'
                            : 'bg-gray-300'} rounded-full mr-1"
                        ></div>
                      {/each}
                    </div>
                    <span class="text-sm font-medium text-gray-900">{competency.level}/5</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </Card>

        <!-- 교육 이수 -->
        <Card>
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">교육 이수 현황</h3>
            <div class="space-y-3">
              {#each employeeTraining.slice(0, 5) as training}
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{training.title}</p>
                    <p class="text-xs text-gray-500">
                      {training.provider} • {training.duration}시간
                    </p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <Badge
                      variant={training.status === 'completed'
                        ? 'success'
                        : training.status === 'in-progress'
                        ? 'warning'
                        : 'secondary'}
                    >
                      {training.status === 'completed'
                        ? '완료'
                        : training.status === 'in-progress'
                        ? '진행중'
                        : '예정'}
                    </Badge>
                    {#if training.score}
                      <span class="text-sm font-medium text-gray-900">{training.score}점</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </Card>
      </div>
    {:else}
      <Card>
        <div class="p-12 text-center">
          <svg
            class="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">직원을 선택하세요</h3>
          <p class="text-gray-500">성과 평가를 위해 직원을 선택해주세요.</p>
        </div>
      </Card>
    {/if}

    <!-- 성과 평가 작성/수정 모달 -->
    <Modal bind:open={isReviewModalOpen}>
      <div class="p-6 max-w-4xl">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          {selectedReview ? '성과 평가 수정' : '성과 평가 작성'}
        </h3>
        <form
          onsubmit={e => {
            e.preventDefault()
            handleReviewSubmit()
          }}
        >
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  for="review-type"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >평가 유형 *</label
                >
                <select
                  id="review-type"
                  bind:value={reviewForm.reviewType}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="annual">연간 평가</option>
                  <option value="quarterly">분기 평가</option>
                  <option value="probation">수습 평가</option>
                  <option value="project">프로젝트 평가</option>
                </select>
              </div>
              <div>
                <label
                  for="overall-rating"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >종합 평가 점수 *</label
                >
                <select
                  id="overall-rating"
                  bind:value={reviewForm.overallRating}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1점 (매우 미흡)</option>
                  <option value={2}>2점 (미흡)</option>
                  <option value={3}>3점 (보통)</option>
                  <option value={4}>4점 (우수)</option>
                  <option value={5}>5점 (매우 우수)</option>
                </select>
              </div>
            </div>

            <div>
              <label
                for="strengths"
                class="block text-sm font-medium text-gray-700 mb-1"
              >강점</label
              >
              <div class="space-y-2">
                {#each reviewForm.strengths as strength, index, i (i)}
                  <div class="flex space-x-2">
                    <input
                      id="strengths-{index}"
                      type="text"
                      bind:value={reviewForm.strengths[index]}
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onclick={() => reviewForm.strengths.splice(index, 1)}
                      class="px-3 py-2 text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </div>
                {/each}
                <button
                  type="button"
                  onclick={() => reviewForm.strengths.push('')}
                  class="text-blue-600 hover:text-blue-900 text-sm"
                >
                  + 강점 추가
                </button>
              </div>
            </div>

            <div>
              <label
                for="improvement-areas"
                class="block text-sm font-medium text-gray-700 mb-1"
              >개선 영역</label
              >
              <div class="space-y-2">
                {#each reviewForm.improvementAreas as area, index, i (i)}
                  <div class="flex space-x-2">
                    <input
                      id="improvement-areas-{index}"
                      type="text"
                      bind:value={reviewForm.improvementAreas[index]}
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onclick={() => reviewForm.improvementAreas.splice(index, 1)}
                      class="px-3 py-2 text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </div>
                {/each}
                <button
                  type="button"
                  onclick={() => reviewForm.improvementAreas.push('')}
                  class="text-blue-600 hover:text-blue-900 text-sm"
                >
                  + 개선 영역 추가
                </button>
              </div>
            </div>

            <div>
              <label
                for="development-plan"
                class="block text-sm font-medium text-gray-700 mb-1"
              >개발 계획</label
              >
              <textarea
                id="development-plan"
                bind:value={reviewForm.developmentPlan}
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="개발 계획을 입력하세요"
              ></textarea>
            </div>

            <div>
              <label
                for="career-goals"
                class="block text-sm font-medium text-gray-700 mb-1"
              >경력 목표</label
              >
              <textarea
                id="career-goals"
                bind:value={reviewForm.careerGoals}
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="경력 목표를 입력하세요"
              ></textarea>
            </div>

            <div class="space-y-3">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={reviewForm.promotionRecommendation}
                  class="mr-2"
                />
                <span class="text-sm text-gray-700">승진 추천</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={reviewForm.salaryIncreaseRecommendation}
                  class="mr-2"
                />
                <span class="text-sm text-gray-700">급여 인상 추천</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={reviewForm.bonusRecommendation}
                  class="mr-2" />
                <span class="text-sm text-gray-700">보너스 추천</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onclick={() => (isReviewModalOpen = false)}
              class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {selectedReview ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- 360도 피드백 모달 -->
    <Modal bind:open={isFeedbackModalOpen}>
      <div class="p-6 max-w-2xl">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">360도 피드백 작성</h3>
        <form
          onsubmit={e => {
            e.preventDefault()
            handleFeedbackSubmit()
          }}
        >
          <div class="space-y-6">
            <div>
              <label
                for="reviewer-type"
                class="block text-sm font-medium text-gray-700 mb-1"
              >평가자 유형 *</label
              >
              <select
                id="reviewer-type"
                bind:value={feedbackForm.reviewerType}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manager">상사</option>
                <option value="peer">동료</option>
                <option value="subordinate">부하직원</option>
                <option value="self">자기평가</option>
              </select>
            </div>

            <div class="space-y-4">
              <h4 class="text-md font-medium text-gray-900">역량 평가 (1-5점)</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    for="leadership"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >리더십</label
                  >
                  <select
                    id="leadership"
                    bind:value={feedbackForm.leadership}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1점</option>
                    <option value={2}>2점</option>
                    <option value={3}>3점</option>
                    <option value={4}>4점</option>
                    <option value={5}>5점</option>
                  </select>
                </div>
                <div>
                  <label
                    for="communication"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >커뮤니케이션</label
                  >
                  <select
                    id="communication"
                    bind:value={feedbackForm.communication}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1점</option>
                    <option value={2}>2점</option>
                    <option value={3}>3점</option>
                    <option value={4}>4점</option>
                    <option value={5}>5점</option>
                  </select>
                </div>
                <div>
                  <label
                    for="teamwork"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >팀워크</label
                  >
                  <select
                    id="teamwork"
                    bind:value={feedbackForm.teamwork}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1점</option>
                    <option value={2}>2점</option>
                    <option value={3}>3점</option>
                    <option value={4}>4점</option>
                    <option value={5}>5점</option>
                  </select>
                </div>
                <div>
                  <label
                    for="problem-solving"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >문제 해결</label
                  >
                  <select
                    id="problem-solving"
                    bind:value={feedbackForm.problemSolving}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1점</option>
                    <option value={2}>2점</option>
                    <option value={3}>3점</option>
                    <option value={4}>4점</option>
                    <option value={5}>5점</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label
                for="feedback-strengths"
                class="block text-sm font-medium text-gray-700 mb-1"
              >강점</label
              >
              <textarea
                id="feedback-strengths"
                bind:value={feedbackForm.strengths}
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="강점을 입력하세요"
              ></textarea>
            </div>

            <div>
              <label
                for="feedback-improvement"
                class="block text-sm font-medium text-gray-700 mb-1"
              >개선 영역</label
              >
              <textarea
                id="feedback-improvement"
                bind:value={feedbackForm.improvementAreas}
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="개선이 필요한 영역을 입력하세요"
              ></textarea>
            </div>

            <div>
              <label
                for="recommendations"
                class="block text-sm font-medium text-gray-700 mb-1"
              >추천사항</label
              >
              <textarea
                id="recommendations"
                bind:value={feedbackForm.recommendations}
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="추천사항을 입력하세요"
              ></textarea>
            </div>

            <div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={feedbackForm.isAnonymous}
                  class="mr-2" />
                <span class="text-sm text-gray-700">익명으로 제출</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onclick={() => (isFeedbackModalOpen = false)}
              class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              제출
            </button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
</div>
