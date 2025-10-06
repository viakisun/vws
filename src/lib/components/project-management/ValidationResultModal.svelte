<script lang="ts">
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'

  interface ValidationSummary {
    total: number
    valid: number
    invalid: number
    issues?: string[]
  }

  interface SchemaValidation {
    database?: {
      isValid: boolean
    }
    naming?: {
      isValid: boolean
    }
  }

  interface ProjectValidationResult {
    ruleName: string
    isValid: boolean
  }

  interface ProjectValidation {
    validationResults?: ProjectValidationResult[]
  }

  interface ValidationResults {
    summary?: ValidationSummary
    schema?: SchemaValidation
    project?: ProjectValidation
  }

  interface Props {
    open: boolean
    onclose: () => void
    validationResults: ValidationResults | null
  }

  let { open = $bindable(false), onclose, validationResults }: Props = $props()
</script>

<ThemeModal {open} {onclose}>
  <div class="max-w-4xl">
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-gray-900">프로젝트 검증 결과</h3>
    </div>

    {#if validationResults}
      <div class="space-y-6">
        <!-- 검증 요약 -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-2">검증 요약</h4>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-gray-600">총 검증 항목:</span>
              <span class="font-medium ml-2">{validationResults.summary?.total || 0}</span>
            </div>
            <div>
              <span class="text-gray-600">유효:</span>
              <span class="font-medium text-green-600 ml-2"
                >{validationResults.summary?.valid || 0}</span
              >
            </div>
            <div>
              <span class="text-gray-600">문제:</span>
              <span class="font-medium text-red-600 ml-2"
                >{validationResults.summary?.invalid || 0}</span
              >
            </div>
          </div>
        </div>

        <!-- 스키마 검증 결과 -->
        {#if validationResults.schema}
          <div class="border rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-3">스키마 검증</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>데이터베이스 스키마:</span>
                <span
                  class={validationResults.schema.database?.isValid
                    ? 'text-green-600'
                    : 'text-red-600'}
                >
                  {validationResults.schema.database?.isValid ? '유효' : '문제 있음'}
                </span>
              </div>
              <div class="flex justify-between">
                <span>컬럼 명명 규칙:</span>
                <span
                  class={validationResults.schema.naming?.isValid
                    ? 'text-green-600'
                    : 'text-red-600'}
                >
                  {validationResults.schema.naming?.isValid ? '유효' : '문제 있음'}
                </span>
              </div>
            </div>
          </div>
        {/if}

        <!-- 프로젝트 검증 결과 -->
        {#if validationResults.project}
          <div class="border rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-3">프로젝트 검증</h4>
            <div class="space-y-2 text-sm">
              {#each validationResults.project.validationResults || [] as result, i (i)}
                <div class="flex justify-between">
                  <span>{result.ruleName}:</span>
                  <span class={result.isValid ? 'text-green-600' : 'text-red-600'}>
                    {result.isValid ? '유효' : '문제 있음'}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- 문제점 목록 -->
        {#if validationResults.summary?.issues?.length && validationResults.summary.issues.length > 0}
          <div class="border border-red-200 rounded-lg p-4 bg-red-50">
            <h4 class="font-medium text-red-900 mb-3">발견된 문제점</h4>
            <ul class="space-y-1 text-sm text-red-800">
              {#each validationResults.summary.issues as issue, i (i)}
                <li>• {issue}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</ThemeModal>
