<script lang="ts">
  import { onMount } from 'svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import type { ProductWithOwner } from '$lib/planner/types'
  import { formatKoreanName } from '$lib/utils/korean-name'

  // =============================================
  // Props
  // =============================================

  interface Props {
    open: boolean
    product?: ProductWithOwner | null
    onclose: () => void
    onsave: () => void
  }

  let { open = $bindable(), product = null, onclose, onsave }: Props = $props()

  // =============================================
  // State
  // =============================================

  let name = $state('')
  let code = $state('')
  let description = $state('')
  let owner_id = $state('')
  let status = $state<'active' | 'archived'>('active')
  let repository_url = $state('')
  let documentation_url = $state('')

  let employees = $state<any[]>([])
  let loading = $state(false)
  let saving = $state(false)
  let error = $state<string | null>(null)

  // Is this edit mode?
  const isEdit = $derived(!!product)

  // =============================================
  // Data Loading
  // =============================================

  async function loadEmployees() {
    try {
      loading = true
      const res = await fetch('/api/employees?status=active')
      const data = await res.json()
      if (data.success) {
        employees = data.employees || []
      }
    } catch (e) {
      console.error('Failed to load employees:', e)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadEmployees()
  })

  // =============================================
  // Effects
  // =============================================

  $effect(() => {
    if (product) {
      name = product.name
      code = product.code
      description = product.description || ''
      owner_id = product.owner_id
      status = product.status
      repository_url = product.repository_url || ''
      documentation_url = product.documentation_url || ''
    } else {
      resetForm()
    }
  })

  // =============================================
  // Handlers
  // =============================================

  function resetForm() {
    name = ''
    code = ''
    description = ''
    owner_id = ''
    status = 'active'
    repository_url = ''
    documentation_url = ''
    error = null
  }

  async function handleSave() {
    if (!name.trim() || !code.trim() || !owner_id) {
      error = '제품명, 코드, 제품 책임자는 필수입니다'
      return
    }

    try {
      saving = true
      error = null

      const url = isEdit ? `/api/planner/products/${product!.id}` : '/api/planner/products'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          description: description.trim() || undefined,
          owner_id,
          status,
          repository_url: repository_url.trim() || undefined,
          documentation_url: documentation_url.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save product')
      }

      resetForm()
      onsave()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save product'
    } finally {
      saving = false
    }
  }

  function handleClose() {
    resetForm()
    onclose()
  }
</script>

<ThemeModal {open} onclose={handleClose} size="lg">
  <div class="p-6">
    <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text-primary)">
      {isEdit ? '제품 수정' : '새 제품 만들기'}
    </h3>

    {#if error}
      <div
        class="mb-4 p-3 rounded-lg"
        style:background="var(--color-error-light)"
        style:color="var(--color-error)"
      >
        {error}
      </div>
    {/if}

    <div class="space-y-4">
      <!-- Product Name -->
      <div>
        <label
          for="product-name"
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text-secondary)"
        >
          제품명 *
        </label>
        <input
          id="product-name"
          type="text"
          bind:value={name}
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
          placeholder="예: WorkStream"
          required
        />
      </div>

      <!-- Product Code -->
      <div>
        <label
          for="product-code"
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text-secondary)"
        >
          제품 코드 *
        </label>
        <input
          id="product-code"
          type="text"
          bind:value={code}
          class="w-full px-3 py-2 rounded-lg border transition font-mono"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
          placeholder="예: WS"
          required
        />
      </div>

      <!-- Description -->
      <div>
        <label
          for="product-description"
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text-secondary)"
        >
          설명
        </label>
        <textarea
          id="product-description"
          bind:value={description}
          rows="3"
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
          placeholder="제품에 대한 설명을 입력하세요"
        ></textarea>
      </div>

      <!-- Owner & Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            for="product-owner"
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text-secondary)"
          >
            제품 책임자 *
          </label>
          <select
            id="product-owner"
            bind:value={owner_id}
            class="w-full px-3 py-2 rounded-lg border transition"
            style:border-color="var(--color-border)"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
            required
            disabled={loading}
          >
            <option value="">선택하세요</option>
            {#each employees as employee}
              <option value={employee.id}>
                {formatKoreanName(employee.last_name, employee.first_name)}
              </option>
            {/each}
          </select>
        </div>

        <div>
          <label
            for="product-status"
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text-secondary)"
          >
            상태 *
          </label>
          <select
            id="product-status"
            bind:value={status}
            class="w-full px-3 py-2 rounded-lg border transition"
            style:border-color="var(--color-border)"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
            required
          >
            <option value="active">활성</option>
            <option value="archived">보관</option>
          </select>
        </div>
      </div>

      <!-- Repository URL -->
      <div>
        <label
          for="product-repo"
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text-secondary)"
        >
          저장소 URL
        </label>
        <input
          id="product-repo"
          type="url"
          bind:value={repository_url}
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
          placeholder="https://github.com/..."
        />
      </div>

      <!-- Documentation URL -->
      <div>
        <label
          for="product-docs"
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text-secondary)"
        >
          문서 URL
        </label>
        <input
          id="product-docs"
          type="url"
          bind:value={documentation_url}
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
          placeholder="https://docs..."
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6">
      <ThemeButton variant="ghost" onclick={handleClose} disabled={saving}>취소</ThemeButton>
      <ThemeButton onclick={handleSave} disabled={saving || loading}>
        {#if saving}
          저장 중...
        {:else if isEdit}
          수정
        {:else}
          만들기
        {/if}
      </ThemeButton>
    </div>
  </div>
</ThemeModal>
