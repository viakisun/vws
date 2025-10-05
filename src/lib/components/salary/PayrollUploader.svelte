<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import {
    AlertCircleIcon,
    CalendarIcon,
    CheckCircleIcon,
    FileSpreadsheetIcon,
    UploadIcon,
    XCircleIcon,
  } from '@lucide/svelte'

  // Local types for this component
  type UploadResult = {
    success?: boolean
    message?: string
    data?: {
      period: string
      totalEmployees: number
      created: number
      updated: number
      errors: string[]
      summary: {
        totalPayments: number
        totalDeductions: number
        totalNetSalary: number
      }
    }
  }

  let showUploadModal = $state(false)
  let selectedFile = $state<File | null>(null)
  let selectedYear = $state(new Date().getFullYear())
  let selectedMonth = $state(new Date().getMonth() + 1)
  let isUploading = $state(false)
  let uploadResult = $state<UploadResult | null>(null)
  let showResultModal = $state(false)

  // 월 옵션 생성
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}월`,
  }))

  // 연도 옵션 생성 (현재 연도 기준 ±2년)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i
    return { value: year, label: `${year}년` }
  })

  // 파일 선택 처리
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
      // 파일 확장자 검증
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.')
        target.value = ''
        return
      }

      selectedFile = file
    }
  }

  // 파일 업로드
  async function uploadFile() {
    if (!selectedFile) {
      alert('파일을 선택해주세요.')
      return
    }

    isUploading = true

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('period', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`)

      const response = await fetch('/api/salary/payslips/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        uploadResult = result
        showResultModal = true
        showUploadModal = false
        selectedFile = null
      } else {
        alert(`업로드 실패: ${result.error}`)
      }
    } catch (_error) {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      isUploading = false
    }
  }

  // 모달 닫기
  function closeUploadModal() {
    showUploadModal = false
    selectedFile = null
  }

  function closeResultModal() {
    showResultModal = false
    uploadResult = null
  }
</script>

<!-- 업로드 버튼 -->
<ThemeButton onclick={() => (showUploadModal = true)} class="bg-green-600 hover:bg-green-700">
  <UploadIcon size={16} class="mr-2" />
  급여대장 업로드
</ThemeButton>

<!-- 업로드 모달 -->
<ThemeModal open={showUploadModal} onclose={() => (showUploadModal = false)} size="lg">
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900">급여대장 엑셀 업로드</h2>
    </div>

    <div class="space-y-6">
      <!-- 기간 선택 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-blue-800 mb-3 flex items-center">
          <CalendarIcon size={20} class="mr-2" />
          급여 기간 선택
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="upload-year" class="block text-sm font-medium text-blue-700 mb-2"
              >연도</label
            >
            <select
              id="upload-year"
              bind:value={selectedYear}
              class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {#each yearOptions as year, i (i)}
                <option value={year.value}>{year.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="upload-month" class="block text-sm font-medium text-blue-700 mb-2">월</label
            >
            <select
              id="upload-month"
              bind:value={selectedMonth}
              class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {#each monthOptions as month, i (i)}
                <option value={month.value}>{month.label}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <!-- 업로드 안내 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-blue-800 mb-3 flex items-center">
          <FileSpreadsheetIcon size={20} class="mr-2" />
          업로드 안내
        </h3>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• 엑셀 파일(.xlsx, .xls)만 업로드 가능합니다</li>
          <li>• 파일 크기는 10MB를 초과할 수 없습니다</li>
          <li>• 급여대장 형식에 맞는 파일을 업로드해주세요</li>
          <li>• 기존 데이터가 있는 경우 업데이트됩니다</li>
        </ul>
      </div>

      <!-- 파일 업로드 -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <UploadIcon size={20} class="mr-2" />
          엑셀 파일 업로드
        </h3>
        <div class="space-y-4">
          <div>
            <label for="file-upload" class="block text-sm font-medium text-gray-700 mb-2">
              파일 선택
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onchange={handleFileSelect}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {#if selectedFile}
            <div class="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircleIcon size={20} class="text-green-600 mr-2" />
              <span class="text-green-700 font-medium">{selectedFile.name}</span>
            </div>
          {/if}

          <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div class="flex items-start">
              <AlertCircleIcon size={20} class="text-yellow-600 mr-2 mt-0.5" />
              <div class="text-yellow-700 text-sm">
                <p class="font-medium mb-1">주의사항:</p>
                <ul class="list-disc list-inside space-y-1">
                  <li>급여대장 형식을 그대로 유지해주세요</li>
                  <li>숫자만 입력하고 콤마나 원화 표시는 제외해주세요</li>
                  <li>기존 급여명세서가 있으면 덮어쓰기됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="flex justify-end space-x-3">
        <ThemeButton variant="ghost" onclick={closeUploadModal}>취소</ThemeButton>
        <ThemeButton
          onclick={uploadFile}
          disabled={!selectedFile || isUploading}
          class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
        >
          {#if isUploading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            업로드 중...
          {:else}
            <UploadIcon size={16} class="mr-2" />
            업로드
          {/if}
        </ThemeButton>
      </div>
    </div>
  </div>
</ThemeModal>

<!-- 결과 모달 -->
<ThemeModal open={showResultModal} onclose={() => (showResultModal = false)} size="xl">
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900">업로드 결과</h2>
    </div>

    {#if uploadResult}
      <div class="space-y-6">
        <!-- 요약 정보 -->
        <div class="grid grid-cols-4 gap-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircleIcon size={32} class="text-green-600 mx-auto mb-2" />
            <div class="text-2xl font-bold text-green-700">
              {uploadResult.data?.created || 0}
            </div>
            <div class="text-sm text-green-600">신규 생성</div>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <FileSpreadsheetIcon size={32} class="text-blue-600 mx-auto mb-2" />
            <div class="text-2xl font-bold text-blue-700">
              {uploadResult.data?.updated || 0}
            </div>
            <div class="text-sm text-blue-600">업데이트</div>
          </div>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <XCircleIcon size={32} class="text-red-600 mx-auto mb-2" />
            <div class="text-2xl font-bold text-red-700">
              {uploadResult.data?.errors?.length || 0}
            </div>
            <div class="text-sm text-red-600">오류</div>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <FileSpreadsheetIcon size={32} class="text-purple-600 mx-auto mb-2" />
            <div class="text-2xl font-bold text-purple-700">
              {uploadResult.data?.totalEmployees || 0}
            </div>
            <div class="text-sm text-purple-600">총 직원</div>
          </div>
        </div>

        <!-- 요약 통계 -->
        {#if uploadResult.data?.summary}
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">급여 요약</h3>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('ko-KR').format(uploadResult.data.summary.totalPayments)}원
                </div>
                <div class="text-sm text-gray-600">지급합계</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('ko-KR').format(
                    uploadResult.data.summary.totalDeductions,
                  )}원
                </div>
                <div class="text-sm text-gray-600">공제합계</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('ko-KR').format(
                    uploadResult.data.summary.totalNetSalary,
                  )}원
                </div>
                <div class="text-sm text-gray-600">차인지급액</div>
              </div>
            </div>
          </div>
        {/if}

        <!-- 오류 목록 -->
        {#if uploadResult.data?.errors && uploadResult.data.errors.length > 0}
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-red-800 mb-3">오류 목록</h3>
            <div class="max-h-40 overflow-y-auto">
              {#each uploadResult.data.errors as error, i (i)}
                <div class="text-sm text-red-700 py-1">{error}</div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- 액션 버튼 -->
        <div class="flex justify-end">
          <ThemeButton onclick={closeResultModal} class="bg-blue-600 hover:bg-blue-700">
            확인
          </ThemeButton>
        </div>
      </div>
    {/if}
  </div>
</ThemeModal>
