<script lang="ts">
  import { LinkIcon, ExternalLinkIcon, TrashIcon, PlusIcon } from 'lucide-svelte'
  import type { ExternalLink } from '../types'
  import { getLinkTypeLabel } from '../utils/initiative-helpers'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import SectionActionButton from '$lib/components/ui/SectionActionButton.svelte'

  interface Props {
    links: ExternalLink[]
    showAddForm: boolean
    adding: boolean
    onAddLink: (link: ExternalLink) => Promise<void>
    onRemoveLink: (index: number) => Promise<void>
    onToggleForm: () => void
    onCloseForm: () => void
  }

  let {
    links,
    showAddForm = $bindable(),
    adding,
    onAddLink,
    onRemoveLink,
    onToggleForm,
    onCloseForm,
  }: Props = $props()

  let newLinkUrl = $state('')
  let newLinkTitle = $state('')
  let newLinkType = $state<'doc' | 'figma' | 'notion' | 'other'>('other')

  async function handleAddLink() {
    if (!newLinkUrl.trim() || !newLinkTitle.trim()) return

    try {
      await onAddLink({
        url: newLinkUrl.trim(),
        title: newLinkTitle.trim(),
        type: newLinkType,
      })
      newLinkUrl = ''
      newLinkTitle = ''
      newLinkType = 'other'
    } catch (e) {
      alert('링크 추가에 실패했습니다')
    }
  }

  async function handleRemoveLink(index: number) {
    if (!confirm('이 링크를 삭제하시겠습니까?')) return

    try {
      await onRemoveLink(index)
    } catch (e) {
      alert('링크 삭제에 실패했습니다')
    }
  }

  function handleCancel() {
    newLinkUrl = ''
    newLinkTitle = ''
    newLinkType = 'other'
    onCloseForm()
  }
</script>

<div class="rounded-lg border p-6" style:background="var(--color-surface)" style:border-color="var(--color-border)">
  <SectionHeader title="Links" count={links.length}>
    <SectionActionButton onclick={onToggleForm}>
      {showAddForm ? 'Cancel' : '+ Add Link'}
    </SectionActionButton>
  </SectionHeader>

  {#if showAddForm}
    <div
      class="p-4 rounded-lg border mb-4"
      style:background="var(--color-surface-base)"
      style:border-color="var(--color-border)"
    >
      <div class="space-y-3">
        <div>
          <label
            for="link-url"
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text-primary)"
          >
            URL
          </label>
          <input
            id="link-url"
            type="url"
            bind:value={newLinkUrl}
            placeholder="https://..."
            class="w-full px-3 py-2 rounded-lg border"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
          />
        </div>
        <div>
          <label
            for="link-title"
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text-primary)"
          >
            제목
          </label>
          <input
            id="link-title"
            type="text"
            bind:value={newLinkTitle}
            placeholder="링크 제목"
            class="w-full px-3 py-2 rounded-lg border"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
          />
        </div>
        <div>
          <label
            for="link-type"
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text-primary)"
          >
            타입
          </label>
          <select
            id="link-type"
            bind:value={newLinkType}
            class="w-full px-3 py-2 rounded-lg border"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
          >
            <option value="doc">문서 (Google Docs 등)</option>
            <option value="figma">Figma</option>
            <option value="notion">Notion</option>
            <option value="other">기타</option>
          </select>
        </div>
        <div class="flex gap-2 justify-end">
          <ThemeButton variant="ghost" size="sm" onclick={handleCancel} disabled={adding}>
            취소
          </ThemeButton>
          <ThemeButton
            variant="primary"
            size="sm"
            onclick={handleAddLink}
            disabled={adding || !newLinkUrl.trim() || !newLinkTitle.trim()}
          >
            {adding ? '추가 중...' : '추가'}
          </ThemeButton>
        </div>
      </div>
    </div>
  {/if}

  {#if links.length > 0}
    <div class="space-y-2">
      {#each links as link, index}
        <div
          class="flex items-center gap-3 p-3 rounded-lg border"
          style:background="var(--color-surface-base)"
          style:border-color="var(--color-border)"
        >
          <span class="flex-shrink-0" style:color="var(--color-purple-base)">
            <ExternalLinkIcon class="w-4 h-4" />
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="px-2 py-0.5 text-xs font-medium rounded"
                class:bg-blue-100={link.type === 'doc'}
                class:text-blue-700={link.type === 'doc'}
                class:bg-purple-100={link.type === 'figma'}
                class:text-purple-700={link.type === 'figma'}
                class:bg-orange-100={link.type === 'notion'}
                class:text-orange-700={link.type === 'notion'}
                class:bg-gray-100={link.type === 'other'}
                class:text-gray-700={link.type === 'other'}
              >
                {getLinkTypeLabel(link.type)}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm font-medium hover:underline"
                style:color="var(--color-text-primary)"
              >
                {link.title}
              </a>
            </div>
            <p class="text-xs truncate" style:color="var(--color-text-tertiary)">
              {link.url}
            </p>
          </div>
          <button
            type="button"
            onclick={() => handleRemoveLink(index)}
            class="flex-shrink-0 p-1.5 rounded hover:bg-red-50 transition"
            style:color="var(--color-error)"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8 rounded-lg border" style:border-color="var(--color-border)">
      <p class="text-sm" style:color="var(--color-text-tertiary)">아직 링크가 없습니다.</p>
    </div>
  {/if}
</div>
