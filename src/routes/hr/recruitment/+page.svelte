<script lang="ts">
  import { onMount } from 'svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Modal from '$lib/components/ui/Modal.svelte'
  import { formatDate } from '$lib/utils/format'

  import {
    jobPostings,
    candidates,
    addJobPosting,
    updateJobPosting,
    publishJobPosting,
    closeJobPosting,
    getRecruitmentStats,
    type JobPosting,
    type Candidate
  } from '$lib/stores/recruitment'

  // 모달 상태
  let isJobPostingModalOpen = $state(false)
  let isCandidateModalOpen = $state(false)
  let isInterviewModalOpen = $state(false)
  let selectedJobPosting = $state<JobPosting | null>(null)
  let selectedCandidate = $state<Candidate | null>(null)

  // 필터
  let statusFilter = $state('')
  let departmentFilter = $state('')

  // 폼 데이터
  let jobPostingForm = $state({
    title: '',
    department: '',
    position: '',
    level: '',
    employmentType: 'full-time' as JobPosting['employmentType'],
    location: '',
    description: '',
    requirements: [''],
    preferredQualifications: [''],
    benefits: [''],
    salaryRange: { min: 0, max: 0, currency: 'KRW' },
    applicationDeadline: ''
  })

  let candidateForm = $state({
    jobPostingId: '',
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      address: '',
      birthDate: '',
      gender: 'male' as Candidate['personalInfo']['gender']
    },
    education: [{ degree: '', school: '', major: '', graduationYear: new Date().getFullYear() }],
    experience: [{ company: '', position: '', startDate: '', endDate: '', description: '' }],
    skills: [''],
    languages: [
      { language: '', proficiency: 'intermediate' as Candidate['languages'][0]['proficiency'] }
    ]
  })

  // 필터링된 채용 공고
  let filteredJobPostings = $derived(() => {
    let filtered = $jobPostings
    if (statusFilter) filtered = filtered.filter(job => job.status === statusFilter)
    if (departmentFilter) filtered = filtered.filter(job => job.department === departmentFilter)
    return filtered
  })

  // 함수들
  function openJobPostingModal(jobPosting?: JobPosting) {
    if (jobPosting) {
      selectedJobPosting = jobPosting
      jobPostingForm = {
        title: jobPosting.title,
        department: jobPosting.department,
        position: jobPosting.position,
        level: jobPosting.level,
        employmentType: jobPosting.employmentType,
        location: jobPosting.location,
        description: jobPosting.description,
        requirements: jobPosting.requirements,
        preferredQualifications: jobPosting.preferredQualifications,
        benefits: jobPosting.benefits,
        salaryRange: jobPosting.salaryRange,
        applicationDeadline: jobPosting.applicationDeadline
      }
    } else {
      selectedJobPosting = null
      jobPostingForm = {
        title: '',
        department: '',
        position: '',
        level: '',
        employmentType: 'full-time',
        location: '',
        description: '',
        requirements: [''],
        preferredQualifications: [''],
        benefits: [''],
        salaryRange: { min: 0, max: 0, currency: 'KRW' },
        applicationDeadline: ''
      }
    }
    isJobPostingModalOpen = true
  }

  function handleJobPostingSubmit() {
    if (selectedJobPosting) {
      updateJobPosting(selectedJobPosting.id, jobPostingForm)
    } else {
      addJobPosting({
        ...jobPostingForm,
        status: 'draft',
        postedBy: 'current-user'
      })
    }
    isJobPostingModalOpen = false
  }

  function publishJob(jobId: string) {
    publishJobPosting(jobId)
    alert('채용 공고가 게시되었습니다.')
  }

  function closeJob(jobId: string) {
    closeJobPosting(jobId)
    alert('채용 공고가 마감되었습니다.')
  }

  function getStatusBadgeVariant(
    status: JobPosting['status']
  ): 'secondary' | 'success' | 'danger' | 'warning' {
    switch (status) {
      case 'draft':
        return 'secondary'
      case 'published':
        return 'success'
      case 'closed':
        return 'danger'
      case 'cancelled':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  function getStatusText(status: JobPosting['status']): string {
    switch (status) {
      case 'draft':
        return '임시저장'
      case 'published':
        return '게시중'
      case 'closed':
        return '마감'
      case 'cancelled':
        return '취소'
      default:
        return status
    }
  }

  onMount(() => {
  // 초기 데이터 로드
  })
</script>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- 헤더 -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">채용 관리</h1>
        <p class="text-gray-600 mt-1">채용 공고 및 지원자 관리를 합니다</p>
      </div>
      <button type="button"
        onclick={() => openJobPostingModal()}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        채용 공고 작성
      </button>
    </div>

    <!-- 필터 -->
    <Card class="mb-6">
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              bind:value={statusFilter}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 상태</option>
              <option value="draft">임시저장</option>
              <option value="published">게시중</option>
              <option value="closed">마감</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">부서</label>
            <select
              bind:value={departmentFilter}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 부서</option>
              <option value="부서없음">부서없음</option>
              <option value="개발팀">개발팀</option>
              <option value="마케팅팀">마케팅팀</option>
              <option value="영업팀">영업팀</option>
              <option value="인사팀">인사팀</option>
            </select>
          </div>
          <div class="flex items-end">
            <button type="button"
              onclick={() => {
                statusFilter = ''
                departmentFilter = ''
              }}
              class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </Card>

    <!-- 채용 공고 목록 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {#each filteredJobPostings() as jobPosting}
        <Card>
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{jobPosting.title}</h3>
                <p class="text-sm text-gray-600">{jobPosting.department} • {jobPosting.position}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(jobPosting.status)}>
                {getStatusText(jobPosting.status)}
              </Badge>
            </div>

            <div class="space-y-2 mb-4">
              <p class="text-sm text-gray-600">
                <strong>급여:</strong>
                {jobPosting.salaryRange.min.toLocaleString()}원 - {jobPosting.salaryRange.max.toLocaleString()}원
              </p>
              <p class="text-sm text-gray-600">
                <strong>위치:</strong>
                {jobPosting.location}
              </p>
              <p class="text-sm text-gray-600">
                <strong>마감일:</strong>
                {formatDate(jobPosting.applicationDeadline)}
              </p>
            </div>

            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-500">
                지원자: {getRecruitmentStats(jobPosting.id, $candidates).totalApplications}명
              </div>
              <div class="flex space-x-2">
                <button type="button"
                  onclick={() => openJobPostingModal(jobPosting)}
                  class="text-blue-600 hover:text-blue-900 text-sm"
                >
                  수정
                </button>
                {#if jobPosting.status === 'draft'}
                  <button type="button"
                    onclick={() => publishJob(jobPosting.id)}
                    class="text-green-600 hover:text-green-900 text-sm"
                  >
                    게시
                  </button>
                {:else if jobPosting.status === 'published'}
                  <button type="button"
                    onclick={() => closeJob(jobPosting.id)}
                    class="text-red-600 hover:text-red-900 text-sm"
                  >
                    마감
                  </button>
                {/if}
              </div>
            </div>
          </div>
        </Card>
      {/each}
    </div>

    <!-- 채용 공고 작성/수정 모달 -->
    <Modal bind:open={isJobPostingModalOpen}>
      <div class="p-6 max-w-4xl">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          {selectedJobPosting ? '채용 공고 수정' : '채용 공고 작성'}
        </h3>
        <form
          onsubmit={e => {
            e.preventDefault()
            handleJobPostingSubmit()
          }}
        >
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  bind:value={jobPostingForm.title}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">부서 *</label>
                <input
                  type="text"
                  bind:value={jobPostingForm.department}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">직급 *</label>
                <input
                  type="text"
                  bind:value={jobPostingForm.position}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">레벨 *</label>
                <input
                  type="text"
                  bind:value={jobPostingForm.level}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">직무 설명 *</label>
              <textarea
                bind:value={jobPostingForm.description}
                required
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">필수 요구사항</label>
              <div class="space-y-2">
                {#each jobPostingForm.requirements as requirement, index, i (i)}
                  <div class="flex space-x-2">
                    <input
                      type="text"
                      bind:value={jobPostingForm.requirements[index]}
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onclick={() => jobPostingForm.requirements.splice(index, 1)}
                      class="px-3 py-2 text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </div>
                {/each}
                <button
                  type="button"
                  onclick={() => jobPostingForm.requirements.push('')}
                  class="text-blue-600 hover:text-blue-900 text-sm"
                >
                  + 요구사항 추가
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">최소 급여 *</label>
                <input
                  type="number"
                  bind:value={jobPostingForm.salaryRange.min}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">최대 급여 *</label>
                <input
                  type="number"
                  bind:value={jobPostingForm.salaryRange.max}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">위치 *</label>
                <input
                  type="text"
                  bind:value={jobPostingForm.location}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">지원 마감일 *</label>
                <input
                  type="date"
                  bind:value={jobPostingForm.applicationDeadline}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onclick={() => (isJobPostingModalOpen = false)}
              class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {selectedJobPosting ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
</div>
