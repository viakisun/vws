<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { ArrowLeftIcon, MessageSquareIcon, XIcon, PlusIcon } from 'lucide-svelte'
  import type { InitiativeWithOwner, ExternalLink } from '$lib/planner/types'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import MentionInput from '$lib/planner/components/MentionInput.svelte'

  // =============================================
  // State
  // =============================================

  let title = $state('')
  let body = $state('')
  let mentions = $state<string[]>([])
  let shape = $state<'block' | 'question' | 'decision' | 'build' | 'research'>('question')
  let externalLinks = $state<ExternalLink[]>([])
  let productId = $state('')
  let initiativeId = $state('')

  let products = $state<any[]>([])
  let allInitiatives = $state<InitiativeWithOwner[]>([])
  let loading = $state(false)
  let error = $state<string | null>(null)

  // =============================================
  // Data Loading
  // =============================================

  async function loadProducts() {
    try {
      const res = await fetch('/api/planner/products?status=active')
      if (res.ok) {
        const data = await res.json()
        products = data.data || []
      }
    } catch (e) {
      console.error('Failed to load products:', e)
    }
  }

  async function loadInitiatives() {
    try {
      const res = await fetch('/api/planner/initiatives?state=active,shaping')
      if (res.ok) {
        const data = await res.json()
        allInitiatives = data.data || []
      }
    } catch (e) {
      console.error('Failed to load initiatives:', e)
    }
  }

  onMount(async () => {
    await loadProducts()
    await loadInitiatives()

    // Check if initiative_id is in URL params
    const urlInitiativeId = $page.url.searchParams.get('initiative_id')
    if (urlInitiativeId) {
      initiativeId = urlInitiativeId
      // Find product for this initiative (data is now loaded)
      const initiative = allInitiatives.find((i) => i.id === urlInitiativeId)
      if (initiative?.product_id) {
        productId = initiative.product_id
      }
    }
  })

  // Filter initiatives by product
  const filteredInitiatives = $derived(
    productId ? allInitiatives.filter((i) => i.product_id === productId) : allInitiatives,
  )

  // =============================================
  // Actions
  // =============================================

  function addExternalLink() {
    externalLinks = [...externalLinks, { title: '', url: '' }]
  }

  function removeExternalLink(index: number) {
    externalLinks = externalLinks.filter((_, i) => i !== index)
  }

  async function handleSubmit() {
    try {
      loading = true
      error = null

      // Validate
      if (!title || !body || !initiativeId) {
        error = '제목, 내용, 이니셔티브는 필수 입력 항목입니다'
        return
      }

      // Filter out empty external links
      const filteredLinks = externalLinks.filter((link) => link.url.trim() !== '')

      const response = await fetch('/api/planner/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          shape,
          initiative_id: initiativeId,
          mentions: mentions.length > 0 ? mentions : undefined,
          external_links: filteredLinks.length > 0 ? filteredLinks : undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '스레드 생성 실패')
      }

      // Redirect to the new thread
      goto(`/planner/threads/${data.data.id}`)
    } catch (e) {
      error = e instanceof Error ? e.message : '스레드 생성 실패'
      console.error('Error creating thread:', e)
    } finally {
      loading = false
    }
  }

  // =============================================
  // Helpers
  // =============================================

  function getShapeIcon(s: string): string {
    switch (s) {
      case 'block':
        return '🔴'
      case 'question':
        return '🟡'
      case 'decision':
        return '🟣'
      case 'build':
        return '🔵'
      case 'research':
        return '🟢'
      default:
        return '⚪'
    }
  }

  function getShapeLabel(s: string): string {
    switch (s) {
      case 'block':
        return '차단'
      case 'question':
        return '질문'
      case 'decision':
        return '결정'
      case 'build':
        return '실행'
      case 'research':
        return '조사'
      default:
        return s
    }
  }

  const shapeOptions = [
    { value: 'question', label: '질문', icon: '🟡', description: '답변이 필요한 질문' },
    { value: 'decision', label: '결정', icon: '🟣', description: '결정이 필요한 사항' },
    { value: 'block', label: '차단', icon: '🔴', description: '진행을 막는 장애물' },
    { value: 'build', label: '실행', icon: '🔵', description: '구현할 작업' },
    { value: 'research', label: '조사', icon: '🟢', description: '조사가 필요한 항목' },
  ]
</script>

<svelte:head>
  <title>새 스레드 - 플래너</title>
</svelte:head>

<div>
  <!-- Back Link -->
  <div class="flex items-center gap-3 mb-4">
    <a
      href={initiativeId ? `/planner/initiatives/${initiativeId}` : '/planner'}
      class="flex items-center gap-2 transition hover:opacity-70"
    >
      <ArrowLeftIcon size={16} style="color: var(--color-text-secondary);" />
      <span class="text-sm" style:color="var(--color-text-secondary)">
        {initiativeId ? '이니셔티브로' : '플래너로'} 돌아가기
      </span>
    </a>
  </div>

  <PageLayout title="새 스레드" subtitle="이니셔티브에 스레드를 추가합니다" backLink="">
    {#if error}
      <ThemeCard variant="outlined" class="border-red-200 bg-red-50 mb-6">
        <p style:color="var(--color-error)">{error}</p>
      </ThemeCard>
    {/if}

    <ThemeCard variant="default">
      <form
        onsubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        class="space-y-6"
      >
        <!-- Product & Initiative -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              for="product"
              class="block text-sm font-medium mb-2"
              style:color="var(--color-text-primary)"
            >
              제품
            </label>
            <select
              id="product"
              bind:value={productId}
              onchange={() => {
                initiativeId = ''
              }}
              class="w-full px-3 py-2 rounded-lg border transition"
              style:border-color="var(--color-border)"
              style:background="var(--color-surface)"
              style:color="var(--color-text-primary)"
            >
              <option value="">전체 제품</option>
              {#each products as product}
                <option value={product.id}>{product.name}</option>
              {/each}
            </select>
            <p class="text-xs mt-1" style:color="var(--color-text-tertiary)">
              제품으로 이니셔티브 필터링
            </p>
          </div>

          <div>
            <label
              for="initiative"
              class="block text-sm font-medium mb-2"
              style:color="var(--color-text-primary)"
            >
              이니셔티브 <span style:color="var(--color-error)">*</span>
            </label>
            <select
              id="initiative"
              bind:value={initiativeId}
              required
              class="w-full px-3 py-2 rounded-lg border transition"
              style:border-color="var(--color-border)"
              style:background="var(--color-surface)"
              style:color="var(--color-text-primary)"
            >
              <option value="">이니셔티브를 선택하세요</option>
              {#each filteredInitiatives as initiative}
                <option value={initiative.id}>{initiative.title}</option>
              {/each}
            </select>
            <p class="text-xs mt-1" style:color="var(--color-text-tertiary)">
              {#if productId && filteredInitiatives.length === 0}
                이 제품에 이니셔티브가 없습니다
              {:else if productId}
                선택한 제품의 이니셔티브만 표시
              {:else}
                이 스레드가 속한 이니셔티브
              {/if}
            </p>
          </div>
        </div>

        <!-- Shape -->
        <div>
          <label class="block text-sm font-medium mb-3" style:color="var(--color-text-primary)">
            유형 <span style:color="var(--color-error)">*</span>
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each shapeOptions as option}
              <label
                class="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition"
                class:border-primary={shape === option.value}
                style:border-color={shape === option.value
                  ? 'var(--color-primary)'
                  : 'var(--color-border)'}
                style:background={shape === option.value
                  ? 'var(--color-primary-light)'
                  : 'var(--color-surface)'}
              >
                <input
                  type="radio"
                  name="shape"
                  value={option.value}
                  bind:group={shape}
                  class="sr-only"
                />
                <span class="text-2xl">{option.icon}</span>
                <div class="flex-1">
                  <p class="text-sm font-semibold mb-1" style:color="var(--color-text-primary)">
                    {option.label}
                  </p>
                  <p class="text-xs" style:color="var(--color-text-secondary)">
                    {option.description}
                  </p>
                </div>
              </label>
            {/each}
          </div>
        </div>

        <!-- Title -->
        <div>
          <label
            for="title"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text-primary)"
          >
            제목 <span style:color="var(--color-error)">*</span>
          </label>
          <input
            type="text"
            id="title"
            bind:value={title}
            required
            placeholder="예: 결제 모듈 API 설계 방향"
            class="w-full px-3 py-2 rounded-lg border transition"
            style:border-color="var(--color-border)"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
          />
        </div>

        <!-- Body with Mentions -->
        <div>
          <label
            for="body"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text-primary)"
          >
            내용 <span style:color="var(--color-error)">*</span>
          </label>
          <MentionInput
            bind:value={body}
            bind:mentions
            placeholder="상세 내용을 작성하세요... (@이름 으로 멘션)"
            rows={8}
            required={true}
          />
          <p class="text-xs mt-2" style:color="var(--color-text-tertiary)">
            @ 입력 후 이름을 입력하면 멘션할 수 있습니다. 멘션된 사람은 응답해야 합니다.
          </p>
        </div>

        <!-- External Links -->
        <div>
          <label class="block text-sm font-medium mb-2" style:color="var(--color-text-primary)">
            외부 링크 (선택사항)
          </label>
          <p class="text-xs mb-3" style:color="var(--color-text-secondary)">
            관련 문서, 이슈, PR 등의 링크를 추가할 수 있습니다
          </p>
          <div class="space-y-2">
            {#each externalLinks as link, i}
              <div class="flex gap-2">
                <input
                  type="text"
                  bind:value={link.title}
                  placeholder="링크 제목"
                  class="flex-1 px-3 py-2 rounded-lg border transition"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface)"
                  style:color="var(--color-text-primary)"
                />
                <input
                  type="url"
                  bind:value={link.url}
                  placeholder="https://..."
                  class="flex-1 px-3 py-2 rounded-lg border transition"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface)"
                  style:color="var(--color-text-primary)"
                />
                <button
                  type="button"
                  onclick={() => removeExternalLink(i)}
                  class="px-3 py-2 rounded-lg transition hover:opacity-70"
                  style:color="var(--color-error)"
                  style:background="var(--color-error-light)"
                >
                  <XIcon size={16} />
                </button>
              </div>
            {/each}
          </div>
          <button
            type="button"
            onclick={addExternalLink}
            class="mt-2 text-sm hover:opacity-70 transition"
            style:color="var(--color-primary)"
          >
            <PlusIcon size={16} class="inline" /> 링크 추가
          </button>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <ThemeButton type="submit" variant="primary" disabled={loading}>
            <MessageSquareIcon size={18} />
            {loading ? '생성 중...' : '스레드 생성'}
          </ThemeButton>
          <a href={initiativeId ? `/planner/initiatives/${initiativeId}` : '/planner'}>
            <ThemeButton variant="secondary">취소</ThemeButton>
          </a>
        </div>
      </form>
    </ThemeCard>
  </PageLayout>
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .border-primary {
    border-color: var(--color-primary) !important;
  }
</style>
