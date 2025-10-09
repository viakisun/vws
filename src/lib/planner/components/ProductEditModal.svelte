<script lang="ts">
  import { onMount } from 'svelte'
  import { XIcon } from 'lucide-svelte'
  import type { ProductWithOwner } from '$lib/planner/types'

  interface Props {
    open: boolean
    product: ProductWithOwner
    onclose: () => void
    onsave: () => void
  }

  let { open = $bindable(false), product, onclose, onsave }: Props = $props()

  let formData = $state({
    name: product.name,
    code: product.code,
    description: product.description || '',
    category: product.category || '',
    repository_url: product.repository_url || '',
    documentation_url: product.documentation_url || '',
    status: product.status,
  })

  let saving = $state(false)
  let error = $state<string | null>(null)
  let categories = $state<Array<{ value: string; label: string }>>([
    { value: '', label: '카테고리 없음' },
  ])
  let loadingCategories = $state(false)

  async function loadCategories() {
    try {
      loadingCategories = true
      const res = await fetch('/api/planner/categories')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          categories = [
            { value: '', label: '카테고리 없음' },
            ...data.data.map((cat: any) => ({
              value: cat.code,
              label: cat.name,
            })),
          ]
        }
      }
    } catch (e) {
      console.error('Failed to load categories:', e)
    } finally {
      loadingCategories = false
    }
  }

  onMount(() => {
    loadCategories()
  })

  $effect(() => {
    if (open) {
      formData = {
        name: product.name,
        code: product.code,
        description: product.description || '',
        category: product.category || '',
        repository_url: product.repository_url || '',
        documentation_url: product.documentation_url || '',
        status: product.status,
      }
    }
  })

  async function handleSubmit() {
    try {
      saving = true
      error = null

      const response = await fetch(`/api/planner/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update product')
      }

      onsave()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update product'
    } finally {
      saving = false
    }
  }

  function handleClose() {
    if (!saving) {
      onclose()
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style:background="rgba(0, 0, 0, 0.5)"
    onclick={handleClose}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="w-full max-w-2xl rounded-lg shadow-lg"
      style:background="var(--color-surface)"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b"
        style:border-color="var(--color-border)"
      >
        <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">제품 편집</h2>
        <button
          type="button"
          onclick={handleClose}
          disabled={saving}
          class="transition hover:opacity-70"
          style:color="var(--color-text-tertiary)"
        >
          <XIcon size={20} />
        </button>
      </div>

      <!-- Form -->
      <form onsubmit={(e) => (e.preventDefault(), handleSubmit())} class="p-6 space-y-4">
        {#if error}
          <div
            class="p-3 rounded-lg border border-red-200 bg-red-50 text-sm"
            style:color="var(--color-error)"
          >
            {error}
          </div>
        {/if}

        <!-- Product Name -->
        <div>
          <label for="name" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            제품명 *
          </label>
          <input
            type="text"
            id="name"
            bind:value={formData.name}
            required
            class="w-full px-3 py-2 rounded-lg border text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
          />
        </div>

        <!-- Product Code -->
        <div>
          <label for="code" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            제품 코드 *
          </label>
          <input
            type="text"
            id="code"
            bind:value={formData.code}
            required
            class="w-full px-3 py-2 rounded-lg border text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
            placeholder="workstream, danngam, etc."
          />
          <p class="mt-1 text-xs" style:color="var(--color-text-tertiary)">
            영문 소문자, 숫자, 하이픈(-)만 사용 가능
          </p>
        </div>

        <!-- Category -->
        <div>
          <label for="category" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            카테고리
          </label>
          <select
            id="category"
            bind:value={formData.category}
            class="w-full px-3 py-2 rounded-lg border text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
          >
            {#each categories as category}
              <option value={category.value}>{category.label}</option>
            {/each}
          </select>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            설명
          </label>
          <textarea
            id="description"
            bind:value={formData.description}
            rows="3"
            class="w-full px-3 py-2 rounded-lg border text-sm resize-none"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
            placeholder="제품에 대한 간단한 설명을 입력하세요"
          ></textarea>
        </div>

        <!-- Repository URL -->
        <div>
          <label for="repository_url" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            저장소 URL
          </label>
          <input
            type="url"
            id="repository_url"
            bind:value={formData.repository_url}
            class="w-full px-3 py-2 rounded-lg border text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
            placeholder="https://github.com/..."
          />
        </div>

        <!-- Documentation URL -->
        <div>
          <label for="documentation_url" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            문서 URL
          </label>
          <input
            type="url"
            id="documentation_url"
            bind:value={formData.documentation_url}
            class="w-full px-3 py-2 rounded-lg border text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
            placeholder="https://docs.example.com/..."
          />
        </div>

        <!-- Status -->
        <div>
          <label for="status" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            상태
          </label>
          <select
            id="status"
            bind:value={formData.status}
            class="w-full px-3 py-2 rounded-lg border text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
          >
            <option value="active">활성</option>
            <option value="archived">보관</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onclick={handleClose}
            disabled={saving}
            class="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-70"
            style:background="var(--color-surface-elevated)"
            style:color="var(--color-text-secondary)"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            class="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
            style:background="var(--color-primary)"
            style:color="white"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
