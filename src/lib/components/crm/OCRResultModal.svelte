<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import type { BankAccountData, BusinessRegistrationData } from '$lib/services/ocr'
  import { AlertTriangleIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-svelte'

  interface Props {
    open: boolean
    businessData: BusinessRegistrationData | null
    bankData: BankAccountData | null
    onClose: () => void
    onConfirm: (data: {
      businessData: BusinessRegistrationData
      bankData: BankAccountData | null
    }) => void
  }

  let { open, businessData, bankData, onClose, onConfirm }: Props = $props()

  // 편집 가능한 데이터
  let editableBusinessData = $state<BusinessRegistrationData | null>(null)
  let editableBankData = $state<BankAccountData | null>(null)
  let showRawText = $state(false)
  let submitting = $state(false)

  // open이 변경될 때 초기화
  $effect(() => {
    if (open && businessData) {
      editableBusinessData = { ...businessData }
      editableBankData = bankData ? { ...bankData } : null
      showRawText = false
    }
  })

  async function handleSubmit() {
    if (!editableBusinessData) return

    submitting = true
    try {
      onConfirm({
        businessData: editableBusinessData,
        bankData: editableBankData,
      })
    } finally {
      submitting = false
    }
  }

  const averageConfidence = $derived(() => {
    if (!editableBusinessData) return 0
    const bc = editableBusinessData.confidence || 0
    const bkc = editableBankData?.confidence || 0
    return editableBankData ? (bc + bkc) / 2 : bc
  })
</script>

<ThemeModal {open} {onClose} maxWidth="4xl">
  <div class="p-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">추출된 정보 확인</h2>

    <!-- 신뢰도 표시 -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-2">
        {#if averageConfidence() >= 80}
          <CheckCircleIcon class="w-5 h-5 text-green-600" />
          <span class="text-sm font-medium text-green-700">
            인식 신뢰도: {Math.round(averageConfidence())}%
          </span>
        {:else}
          <AlertTriangleIcon class="w-5 h-5 text-yellow-600" />
          <span class="text-sm font-medium text-yellow-700">
            인식 신뢰도: {Math.round(averageConfidence())}% (낮음)
          </span>
        {/if}
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all {averageConfidence() >= 80
            ? 'bg-green-600'
            : 'bg-yellow-600'}"
          style="width: {averageConfidence()}%"
        ></div>
      </div>
      {#if averageConfidence() < 80}
        <p class="text-sm text-gray-600 mt-1">
          신뢰도가 낮습니다. 추출된 정보를 확인하고 필요시 수정해주세요.
        </p>
      {/if}
    </div>

    {#if editableBusinessData}
      <!-- 사업자등록증 정보 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">사업자등록증 정보</h3>
        <div class="grid grid-cols-2 gap-4">
          <ThemeInput label="상호명 *" bind:value={editableBusinessData.companyName} required />
          <ThemeInput
            label="사업자번호"
            bind:value={editableBusinessData.businessNumber}
            placeholder="123-45-67890"
          />
          <ThemeInput label="대표자명" bind:value={editableBusinessData.representativeName} />
          <ThemeInput
            label="개업일자"
            type="date"
            bind:value={editableBusinessData.establishmentDate}
          />
          <ThemeInput label="업태" bind:value={editableBusinessData.businessType} />
          <ThemeInput label="종목" bind:value={editableBusinessData.businessCategory} />
          <div class="col-span-2">
            <ThemeInput label="사업장 주소" bind:value={editableBusinessData.businessAddress} />
          </div>
          <div class="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isCorporation"
              bind:checked={editableBusinessData.isCorporation}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label for="isCorporation" class="text-sm text-gray-700">법인</label>
          </div>
        </div>
      </div>

      {#if editableBankData}
        <!-- 통장사본 정보 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">통장사본 정보</h3>
          <div class="grid grid-cols-2 gap-4">
            <ThemeInput label="은행명" bind:value={editableBankData.bankName} />
            <ThemeInput label="예금주명" bind:value={editableBankData.accountHolder} />
            <div class="col-span-2">
              <ThemeInput
                label="계좌번호"
                bind:value={editableBankData.accountNumber}
                placeholder="123-456-7890"
              />
            </div>
          </div>
        </div>
      {/if}

      <!-- 원본 텍스트 보기 -->
      <div class="mb-6">
        <button
          type="button"
          class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          onclick={() => (showRawText = !showRawText)}
        >
          {#if showRawText}
            <ChevronUpIcon class="w-4 h-4" />
          {:else}
            <ChevronDownIcon class="w-4 h-4" />
          {/if}
          원본 텍스트 보기
        </button>

        {#if showRawText}
          <div class="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-xs font-mono text-gray-700 whitespace-pre-wrap">
              {editableBusinessData.rawText}
              {#if editableBankData}
                \n\n--- 통장사본 ---\n\n{editableBankData.rawText}
              {/if}
            </p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- 버튼 -->
    <div class="flex justify-end gap-3 pt-4 border-t">
      <ThemeButton variant="secondary" onclick={onClose}>취소</ThemeButton>
      <ThemeButton
        variant="primary"
        onclick={handleSubmit}
        disabled={!editableBusinessData?.companyName || submitting}
      >
        {submitting ? '생성 중...' : '고객 생성'}
      </ThemeButton>
    </div>
  </div>
</ThemeModal>
