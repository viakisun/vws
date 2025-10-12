<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import type { BankAccountData, BusinessRegistrationData } from '$lib/services/ocr'
  import { AlertCircleIcon, FileIcon, UploadIcon } from 'lucide-svelte'

  interface Props {
    onComplete: (data: {
      businessData: BusinessRegistrationData | null
      bankData: BankAccountData | null
      businessFile: File | null
      bankFile: File | null
    }) => void
    onCancel: () => void
  }

  let { onComplete, onCancel }: Props = $props()

  // 상태
  let step = $state<'business' | 'bank'>('business')
  let businessFile = $state<File | null>(null)
  let bankFile = $state<File | null>(null)
  let businessData = $state<BusinessRegistrationData | null>(null)
  let bankData = $state<BankAccountData | null>(null)
  let loading = $state(false)
  let error = $state<string | null>(null)
  let dragOver = $state(false)

  // 드래그 앤 드롭 핸들러
  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    dragOver = true
  }

  function handleDragLeave() {
    dragOver = false
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    dragOver = false

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      await handleFileSelect(files[0])
    }
  }

  function handleFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      handleFileSelect(input.files[0])
    }
  }

  async function handleFileSelect(file: File) {
    error = null

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      error = '파일 크기는 5MB 이하여야 합니다'
      return
    }

    // 파일 타입 검증
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      error = 'PDF, JPG, PNG 파일만 업로드 가능합니다'
      return
    }

    if (step === 'business') {
      businessFile = file
      await processBusinessRegistration(file)
    } else {
      bankFile = file
      await processBankAccount(file)
    }
  }

  async function processBusinessRegistration(file: File) {
    loading = true
    error = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', 'business-registration')

      const response = await fetch('/api/crm/ocr', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'OCR 처리 실패')
      }

      const result = await response.json()
      businessData = result.data

      // 신뢰도가 낮으면 경고
      if (businessData && businessData.confidence < 80) {
        error = `인식 신뢰도가 낮습니다 (${Math.round(businessData.confidence)}%). 추출된 정보를 확인해주세요.`
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'OCR 처리 중 오류가 발생했습니다'
      businessFile = null
      businessData = null
    } finally {
      loading = false
    }
  }

  async function processBankAccount(file: File) {
    loading = true
    error = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', 'bank-account')

      const response = await fetch('/api/crm/ocr', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'OCR 처리 실패')
      }

      const result = await response.json()
      bankData = result.data

      // 신뢰도가 낮으면 경고
      if (bankData && bankData.confidence < 80) {
        error = `인식 신뢰도가 낮습니다 (${Math.round(bankData.confidence)}%). 추출된 정보를 확인해주세요.`
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'OCR 처리 중 오류가 발생했습니다'
      bankFile = null
      bankData = null
    } finally {
      loading = false
    }
  }

  function goToNextStep() {
    if (step === 'business' && businessData) {
      step = 'bank'
    } else if (step === 'bank') {
      handleComplete()
    }
  }

  function goToPrevStep() {
    if (step === 'bank') {
      step = 'business'
    }
  }

  function handleComplete() {
    onComplete({
      businessData,
      bankData,
      businessFile,
      bankFile,
    })
  }

  function handleSkipBank() {
    handleComplete()
  }
</script>

<div class="space-y-6">
  <!-- 단계 표시 -->
  <div class="flex items-center justify-center gap-4">
    <div class="flex items-center gap-2">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center {step === 'business'
          ? 'bg-blue-600 text-white'
          : businessData
            ? 'bg-green-600 text-white'
            : 'bg-gray-300 text-gray-600'}"
      >
        {businessData ? '✓' : '1'}
      </div>
      <span class="text-sm font-medium">사업자등록증</span>
    </div>

    <div class="w-12 h-0.5 bg-gray-300"></div>

    <div class="flex items-center gap-2">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center {step === 'bank'
          ? 'bg-blue-600 text-white'
          : bankData
            ? 'bg-green-600 text-white'
            : 'bg-gray-300 text-gray-600'}"
      >
        {bankData ? '✓' : '2'}
      </div>
      <span class="text-sm font-medium">통장사본</span>
    </div>
  </div>

  <!-- 업로드 영역 -->
  <div
    class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {dragOver
      ? 'border-blue-500 bg-blue-50'
      : 'border-gray-300'}"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    {#if loading}
      <div class="flex flex-col items-center gap-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="text-gray-600">OCR 처리 중...</p>
      </div>
    {:else if (step === 'business' && businessFile) || (step === 'bank' && bankFile)}
      <div class="flex flex-col items-center gap-4">
        <FileIcon class="w-16 h-16 text-green-600" />
        <div>
          <p class="font-medium text-gray-900">
            {step === 'business' ? businessFile?.name : bankFile?.name}
          </p>
          <p class="text-sm text-gray-600 mt-1">OCR 처리 완료</p>
        </div>
      </div>
    {:else}
      <div class="flex flex-col items-center gap-4">
        <UploadIcon class="w-16 h-16 text-gray-400" />
        <div>
          <p class="text-lg font-medium text-gray-900">
            {step === 'business' ? '사업자등록증' : '통장사본'} 업로드
          </p>
          <p class="text-sm text-gray-600 mt-1">파일을 드래그하거나 클릭하여 선택하세요</p>
          <p class="text-xs text-gray-500 mt-1">PDF, JPG, PNG (최대 5MB)</p>
        </div>
        <label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            class="hidden"
            onchange={handleFileInputChange}
          />
          <ThemeButton variant="primary">파일 선택</ThemeButton>
        </label>
      </div>
    {/if}
  </div>

  <!-- 에러 메시지 -->
  {#if error}
    <div
      class="flex items-start gap-2 p-4 rounded-lg {error.includes('신뢰도')
        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        : 'bg-red-50 text-red-800 border border-red-200'}"
    >
      <AlertCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p class="text-sm">{error}</p>
    </div>
  {/if}

  <!-- 추출된 데이터 미리보기 -->
  {#if step === 'business' && businessData}
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="font-medium text-gray-900 mb-3">추출된 정보</h3>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-600">상호명:</span>
          <span class="font-medium ml-2">{businessData.companyName || '-'}</span>
        </div>
        <div>
          <span class="text-gray-600">사업자번호:</span>
          <span class="font-medium ml-2">{businessData.businessNumber || '-'}</span>
        </div>
        <div>
          <span class="text-gray-600">대표자:</span>
          <span class="font-medium ml-2">{businessData.representativeName || '-'}</span>
        </div>
        <div>
          <span class="text-gray-600">업태:</span>
          <span class="font-medium ml-2">{businessData.businessType || '-'}</span>
        </div>
        <div class="col-span-2">
          <span class="text-gray-600">주소:</span>
          <span class="font-medium ml-2">{businessData.businessAddress || '-'}</span>
        </div>
      </div>
      <div class="mt-2 text-xs text-gray-500">
        신뢰도: {Math.round(businessData.confidence)}%
      </div>
    </div>
  {:else if step === 'bank' && bankData}
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="font-medium text-gray-900 mb-3">추출된 정보</h3>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-600">은행명:</span>
          <span class="font-medium ml-2">{bankData.bankName || '-'}</span>
        </div>
        <div>
          <span class="text-gray-600">예금주:</span>
          <span class="font-medium ml-2">{bankData.accountHolder || '-'}</span>
        </div>
        <div class="col-span-2">
          <span class="text-gray-600">계좌번호:</span>
          <span class="font-medium ml-2">{bankData.accountNumber || '-'}</span>
        </div>
      </div>
      <div class="mt-2 text-xs text-gray-500">
        신뢰도: {Math.round(bankData.confidence)}%
      </div>
    </div>
  {/if}

  <!-- 버튼 영역 -->
  <div class="flex justify-between">
    <div>
      {#if step === 'bank'}
        <ThemeButton variant="secondary" onclick={goToPrevStep}>이전</ThemeButton>
      {/if}
    </div>

    <div class="flex gap-2">
      <ThemeButton variant="secondary" onclick={onCancel}>취소</ThemeButton>

      {#if step === 'business'}
        <ThemeButton variant="primary" onclick={goToNextStep} disabled={!businessData || loading}>
          다음
        </ThemeButton>
      {:else if step === 'bank'}
        <ThemeButton variant="secondary" onclick={handleSkipBank}>통장사본 건너뛰기</ThemeButton>
        <ThemeButton variant="primary" onclick={goToNextStep} disabled={!bankData || loading}>
          완료
        </ThemeButton>
      {/if}
    </div>
  </div>
</div>
