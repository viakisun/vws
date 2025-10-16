<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import { pushToast } from '$lib/stores/toasts'
  import type { Customer } from '$lib/types/crm'
  import { FileTextIcon, UploadIcon, X } from 'lucide-svelte'

  interface Props {
    open: boolean
    customer: Customer | null
    onClose: () => void
    onSave: (customer: any, files: { business?: File; bank?: File }) => Promise<void>
  }

  let { open, customer, onClose, onSave }: Props = $props()

  // 편집 가능한 데이터
  let formData = $state({
    id: null as string | null,
    name: '',
    businessNumber: '',
    representativeName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    industry: '',
    status: 'active' as string,
    businessEntityType: 'individual' as string,
    businessCategory: '',
    establishmentDate: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    businessRegistrationS3Key: null as string | null,
    bankAccountS3Key: null as string | null,
    notes: '',
  })

  let businessFile = $state<File | null>(null)
  let bankFile = $state<File | null>(null)
  let submitting = $state(false)
  let businessDragOver = $state(false)
  let bankDragOver = $state(false)

  const isEditMode = $derived(!!customer?.id)
  const modalTitle = $derived(isEditMode ? '고객 정보 수정' : '새 고객 추가')
  const submitButtonText = $derived(isEditMode ? '저장' : '추가')

  // 초기화 함수 (개별 속성 업데이트로 binding 유지)
  function initializeForm(customerData: Customer | null) {
    if (customerData) {
      // 편집 모드: 기존 데이터로 초기화
      formData.id = customerData.id
      formData.name = customerData.name || ''
      formData.businessNumber = customerData.businessNumber || ''
      formData.representativeName = customerData.representativeName || ''
      formData.contactPerson = customerData.contactPerson || ''
      formData.contactPhone = customerData.contactPhone || ''
      formData.contactEmail = customerData.contactEmail || ''
      formData.address = customerData.address || ''
      formData.industry = customerData.industry || ''
      formData.status = customerData.status || 'active'
      formData.businessEntityType = customerData.businessEntityType || 'individual'
      formData.businessCategory = customerData.businessCategory || ''
      formData.establishmentDate = customerData.establishmentDate || ''
      formData.bankName = customerData.bankName || ''
      formData.accountNumber = customerData.accountNumber || ''
      formData.accountHolder = customerData.accountHolder || ''
      formData.businessRegistrationS3Key = customerData.businessRegistrationS3Key || null
      formData.bankAccountS3Key = customerData.bankAccountS3Key || null
      formData.notes = customerData.notes || ''
    } else {
      // 생성 모드: 빈 폼으로 초기화
      formData.id = null
      formData.name = ''
      formData.businessNumber = ''
      formData.representativeName = ''
      formData.contactPerson = ''
      formData.contactPhone = ''
      formData.contactEmail = ''
      formData.address = ''
      formData.industry = ''
      formData.status = 'active'
      formData.businessEntityType = 'individual'
      formData.businessCategory = ''
      formData.establishmentDate = ''
      formData.bankName = ''
      formData.accountNumber = ''
      formData.accountHolder = ''
      formData.businessRegistrationS3Key = null
      formData.bankAccountS3Key = null
      formData.notes = ''
    }

    businessFile = null
    bankFile = null
  }

  // open prop과 customer가 변경될 때 초기화
  let lastCustomerId: string | null = null
  $effect(() => {
    if (open) {
      const currentCustomerId = customer?.id ?? null

      // 모달이 새로 열렸거나, customer가 변경된 경우에만 초기화
      if (lastCustomerId !== currentCustomerId) {
        initializeForm(customer)
        lastCustomerId = currentCustomerId
      }
    } else {
      // 모달이 닫히면 lastCustomerId 리셋
      lastCustomerId = null
    }
  })

  async function handleSubmit() {
    if (!formData.name || !formData.businessNumber) {
      pushToast('회사명과 사업자번호는 필수입니다', 'error')
      return
    }

    submitting = true
    try {
      await onSave(formData, {
        business: businessFile || undefined,
        bank: bankFile || undefined,
      })
    } finally {
      submitting = false
    }
  }

  function handleClose() {
    if (!submitting) {
      onClose()
    }
  }

  function handleDeleteBusinessFile() {
    formData.businessRegistrationS3Key = null
    businessFile = null
  }

  function handleDeleteBankFile() {
    formData.bankAccountS3Key = null
    bankFile = null
  }

  // Drag & Drop handlers for business registration
  function handleBusinessDragOver(e: DragEvent) {
    e.preventDefault()
    businessDragOver = true
  }

  function handleBusinessDragLeave() {
    businessDragOver = false
  }

  function handleBusinessDrop(e: DragEvent) {
    e.preventDefault()
    businessDragOver = false

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleBusinessFileSelect(files[0])
    }
  }

  function handleBusinessFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      handleBusinessFileSelect(input.files[0])
    }
  }

  function handleBusinessFileSelect(file: File) {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      pushToast('파일 크기는 5MB 이하여야 합니다', 'error')
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      pushToast('PDF, JPG, PNG 파일만 업로드 가능합니다', 'error')
      return
    }

    businessFile = file
  }

  // Drag & Drop handlers for bank account
  function handleBankDragOver(e: DragEvent) {
    e.preventDefault()
    bankDragOver = true
  }

  function handleBankDragLeave() {
    bankDragOver = false
  }

  function handleBankDrop(e: DragEvent) {
    e.preventDefault()
    bankDragOver = false

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleBankFileSelect(files[0])
    }
  }

  function handleBankFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      handleBankFileSelect(input.files[0])
    }
  }

  function handleBankFileSelect(file: File) {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      pushToast('파일 크기는 5MB 이하여야 합니다', 'error')
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      pushToast('PDF, JPG, PNG 파일만 업로드 가능합니다', 'error')
      return
    }

    bankFile = file
  }
</script>

<ThemeModal {open} onclose={handleClose}>
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-lg font-semibold" style:color="var(--color-text)">
      {modalTitle}
    </h3>
    <button
      type="button"
      onclick={handleClose}
      class="p-1 rounded-md hover:bg-gray-200 :bg-gray-700"
      style:color="var(--color-text-secondary)"
      disabled={submitting}
    >
      <X class="w-5 h-5" />
    </button>
  </div>

  <div class="space-y-4">
    <ThemeInput
      label="회사명"
      placeholder="회사명을 입력하세요"
      bind:value={formData.name}
      required
    />
    <ThemeInput
      label="사업자번호"
      placeholder="000-00-00000"
      bind:value={formData.businessNumber}
      required
    />
    <ThemeInput
      label="대표자명"
      placeholder="대표자명 (사업자등록증)"
      bind:value={formData.representativeName}
    />

    <!-- 담당자 정보 -->
    <ThemeInput
      label="담당자명"
      placeholder="담당자명 (선택사항)"
      bind:value={formData.contactPerson}
    />
    <ThemeInput
      label="담당자 전화번호"
      placeholder="010-0000-0000"
      bind:value={formData.contactPhone}
    />
    <ThemeInput
      label="담당자 이메일"
      type="email"
      placeholder="email@example.com"
      bind:value={formData.contactEmail}
    />
    <ThemeInput label="주소" placeholder="주소를 입력하세요" bind:value={formData.address} />
    <ThemeInput label="업종" placeholder="업종을 입력하세요" bind:value={formData.industry} />

    <div>
      <label
        for="businessEntityType"
        class="block text-sm font-medium mb-1"
        style:color="var(--color-text)"
      >
        사업자 유형
      </label>
      <select
        id="businessEntityType"
        bind:value={formData.businessEntityType}
        class="w-full px-3 py-2 border rounded-md"
        style:background="var(--color-surface)"
        style:border-color="var(--color-border)"
        style:color="var(--color-text)"
      >
        <option value="individual">개인사업자</option>
        <option value="corporation">법인사업자</option>
        <option value="nonprofit">비영리법인</option>
        <option value="public">공공기관</option>
        <option value="cooperative">협동조합</option>
        <option value="foreign">외국기업</option>
      </select>
    </div>

    <ThemeInput
      label="업태"
      placeholder="업태를 입력하세요"
      bind:value={formData.businessCategory}
    />
    <ThemeInput
      label="설립일"
      type="text"
      placeholder="YYYY-MM-DD"
      bind:value={formData.establishmentDate}
    />

    <div class="grid grid-cols-3 gap-4">
      <ThemeInput label="은행명" placeholder="은행명" bind:value={formData.bankName} />
      <ThemeInput label="계좌번호" placeholder="계좌번호" bind:value={formData.accountNumber} />
      <ThemeInput label="예금주" placeholder="예금주" bind:value={formData.accountHolder} />
    </div>

    <!-- 파일 업로드 섹션 -->
    <div class="border-t pt-4" style:border-color="var(--color-border)">
      <div class="flex items-center justify-between mb-3">
        <div class="block text-sm font-medium" style:color="var(--color-text)">첨부 파일</div>
        {#if !formData.businessRegistrationS3Key && !formData.bankAccountS3Key}
          <span class="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600">
            📎 첨부 파일 없음
          </span>
        {:else if !formData.businessRegistrationS3Key || !formData.bankAccountS3Key}
          <span class="text-xs px-2 py-1 rounded-md bg-yellow-100 /30 text-yellow-700">
            ⚠️ 일부 파일 누락
          </span>
        {:else}
          <span class="text-xs px-2 py-1 rounded-md bg-green-100 /30 text-green-700">
            ✓ 모든 파일 업로드됨
          </span>
        {/if}
      </div>

      <div class="space-y-3">
        <!-- 사업자등록증 -->
        <div
          class="p-4 border rounded-lg"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <FileTextIcon size={16} style="color: var(--color-primary);" />
              <span class="text-sm font-medium" style:color="var(--color-text)">사업자등록증</span>
              {#if !formData.businessRegistrationS3Key && !businessFile}
                <span class="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                  비어있음
                </span>
              {:else}
                <span class="text-xs px-1.5 py-0.5 rounded bg-green-100 /30 text-green-700">
                  ✓ {formData.businessRegistrationS3Key ? '업로드됨' : '선택됨'}
                </span>
              {/if}
            </div>
            {#if formData.businessRegistrationS3Key || businessFile}
              <button
                type="button"
                onclick={handleDeleteBusinessFile}
                class="text-xs px-2 py-1 rounded hover:bg-red-50 :bg-red-900/20 text-red-600"
              >
                삭제
              </button>
            {/if}
          </div>

          {#if !formData.businessRegistrationS3Key}
            <div
              role="button"
              tabindex="0"
              class="border-2 border-dashed rounded-lg p-4 text-center transition-colors {businessDragOver
                ? 'border-blue-500 bg-blue-50 /20'
                : 'border-gray-300 '}"
              ondragover={handleBusinessDragOver}
              ondragleave={handleBusinessDragLeave}
              ondrop={handleBusinessDrop}
            >
              {#if businessFile}
                <div class="flex flex-col items-center gap-2">
                  <FileTextIcon size={32} class="text-green-600" />
                  <p class="text-sm font-medium" style:color="var(--color-text)">
                    {businessFile.name}
                  </p>
                  <p class="text-xs" style:color="var(--color-text-secondary)">
                    {(businessFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              {:else}
                <div class="flex flex-col items-center gap-2">
                  <UploadIcon size={32} class="text-gray-400" />
                  <p class="text-sm font-medium" style:color="var(--color-text)">
                    파일을 드래그하거나 클릭하여 선택하세요
                  </p>
                  <p class="text-xs" style:color="var(--color-text-secondary)">
                    PDF, JPG, PNG (최대 5MB)
                  </p>
                  <label class="mt-2">
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/jpg,image/png"
                      onchange={handleBusinessFileInputChange}
                      class="hidden"
                    />
                    <span
                      class="inline-block px-3 py-1.5 text-xs rounded cursor-pointer"
                      style="background: var(--color-primary); color: white;"
                    >
                      파일 선택
                    </span>
                  </label>
                </div>
              {/if}
            </div>
          {:else}
            <p class="text-xs text-center py-2" style:color="var(--color-text-secondary)">
              파일 업로드됨 ✓
            </p>
          {/if}
        </div>

        <!-- 통장사본 -->
        <div
          class="p-4 border rounded-lg"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <FileTextIcon size={16} style="color: var(--color-primary);" />
              <span class="text-sm font-medium" style:color="var(--color-text)">통장사본</span>
              {#if !formData.bankAccountS3Key && !bankFile}
                <span class="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                  비어있음
                </span>
              {:else}
                <span class="text-xs px-1.5 py-0.5 rounded bg-green-100 /30 text-green-700">
                  ✓ {formData.bankAccountS3Key ? '업로드됨' : '선택됨'}
                </span>
              {/if}
            </div>
            {#if formData.bankAccountS3Key || bankFile}
              <button
                type="button"
                onclick={handleDeleteBankFile}
                class="text-xs px-2 py-1 rounded hover:bg-red-50 :bg-red-900/20 text-red-600"
              >
                삭제
              </button>
            {/if}
          </div>

          {#if !formData.bankAccountS3Key}
            <div
              role="button"
              tabindex="0"
              class="border-2 border-dashed rounded-lg p-4 text-center transition-colors {bankDragOver
                ? 'border-blue-500 bg-blue-50 /20'
                : 'border-gray-300 '}"
              ondragover={handleBankDragOver}
              ondragleave={handleBankDragLeave}
              ondrop={handleBankDrop}
            >
              {#if bankFile}
                <div class="flex flex-col items-center gap-2">
                  <FileTextIcon size={32} class="text-green-600" />
                  <p class="text-sm font-medium" style:color="var(--color-text)">
                    {bankFile.name}
                  </p>
                  <p class="text-xs" style:color="var(--color-text-secondary)">
                    {(bankFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              {:else}
                <div class="flex flex-col items-center gap-2">
                  <UploadIcon size={32} class="text-gray-400" />
                  <p class="text-sm font-medium" style:color="var(--color-text)">
                    파일을 드래그하거나 클릭하여 선택하세요
                  </p>
                  <p class="text-xs" style:color="var(--color-text-secondary)">
                    PDF, JPG, PNG (최대 5MB)
                  </p>
                  <label class="mt-2">
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/jpg,image/png"
                      onchange={handleBankFileInputChange}
                      class="hidden"
                    />
                    <span
                      class="inline-block px-3 py-1.5 text-xs rounded cursor-pointer"
                      style="background: var(--color-primary); color: white;"
                    >
                      파일 선택
                    </span>
                  </label>
                </div>
              {/if}
            </div>
          {:else}
            <p class="text-xs text-center py-2" style:color="var(--color-text-secondary)">
              파일 업로드됨 ✓
            </p>
          {/if}
        </div>
      </div>
    </div>

    <ThemeInput label="메모" placeholder="메모를 입력하세요" bind:value={formData.notes} />
  </div>

  <div class="flex justify-end gap-2 mt-6">
    <ThemeButton variant="secondary" onclick={handleClose} disabled={submitting}>취소</ThemeButton>
    <ThemeButton variant="primary" onclick={handleSubmit} disabled={submitting}>
      {submitting ? '저장 중...' : submitButtonText}
    </ThemeButton>
  </div>
</ThemeModal>
