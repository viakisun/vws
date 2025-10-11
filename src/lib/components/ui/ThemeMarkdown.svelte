<script lang="ts">
  // ============================================================================
  // 📐 마크다운 스타일 설정 (여기서 글자 크기 조정)
  // ============================================================================
  const MARKDOWN_STYLE_CONFIG = {
    // 기본 폰트
    baseFontSize: '12px',
    baseLineHeight: '1.7',

    // 제목 크기 (em 단위)
    h1Size: '1.6em',
    h2Size: '1.4em',
    h3Size: '1.2em',
    h4Size: '1.0em',

    // 제목 간격 (px)
    headingMarginTop: '24px',
    headingMarginBottom: '16px',

    // 문단/리스트 간격 (px)
    paragraphMarginBottom: '16px',
    listMarginBottom: '16px',
    listItemSpacing: '0.5em',

    // 코드
    inlineCodeSize: '0.9em',
    codeBlockSize: '0.85em',

    // 구분선 간격 (px)
    hrMarginVertical: '24px',

    // Compact 버전
    compactBaseFontSize: '14px',
    compactH1Size: '1.6em',
    compactH2Size: '1.4em',
    compactH3Size: '1.2em',
  }
  // ============================================================================

  import DOMPurify from 'dompurify'
  import 'github-markdown-css/github-markdown.css'
  import {
    CheckIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CopyIcon,
    ListIcon
  } from 'lucide-svelte'
  import { marked } from 'marked'

  const {
    content,
    variant = 'default',
    showCopy = false,
    collapsible = false,
    maxPreviewHeight = 0,
    showToc = false,
    externalLinksNewTab = true,
    class: className = '',
  }: {
    content: string
    variant?: 'default' | 'compact' | 'card'
    showCopy?: boolean
    collapsible?: boolean
    maxPreviewHeight?: number
    showToc?: boolean
    externalLinksNewTab?: boolean
    class?: string
  } = $props()

  // 상태 관리
  let copied = $state(false)
  let isExpanded = $state(false)
  let isOverflowing = $state(false)
  let showTableOfContents = $state(false)
  let tocItems = $state<{ id: string; text: string; level: number }[]>([])

  // 목차 추출 함수
  function extractToc(html: string): { id: string; text: string; level: number }[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4')
    const items: { id: string; text: string; level: number }[] = []

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1))
      const text = heading.textContent || ''
      const id = `heading-${index}`
      heading.id = id
      items.push({ id, text, level })
    })

    return items
  }

  // 마크다운 렌더링 함수
  function renderMarkdown(markdown: string): string {
    if (!markdown) return ''

    // marked 옵션 설정
    marked.setOptions({
      breaks: true, // 단일 줄바꿈(\n)을 <br>로 변환
      gfm: true, // GitHub Flavored Markdown 활성화 (표, 취소선 등)
    })

    let html = marked.parse(markdown, { async: false }) as string

    // 외부 링크 새 탭에서 열기
    if (externalLinksNewTab) {
      html = html.replace(
        /<a href="(https?:\/\/[^"]+)"/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="external-link"',
      )
    }

    // 목차 추출
    if (showToc) {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      const headings = tempDiv.querySelectorAll('h1, h2, h3, h4')
      const items: { id: string; text: string; level: number }[] = []

      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.substring(1))
        const text = heading.textContent || ''
        const id = `heading-${index}`
        heading.id = id
        items.push({ id, text, level })
      })

      tocItems = items
      html = tempDiv.innerHTML
    }

    return DOMPurify.sanitize(html, {
      ADD_ATTR: ['target', 'rel'],
    })
  }

  // 복사 기능
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(content)
      copied = true
      setTimeout(() => {
        copied = false
      }, 2000)
    } catch (err) {
      console.error('복사 실패:', err)
    }
  }

  // 펼치기/접기
  function toggleExpand() {
    isExpanded = !isExpanded
  }

  // variant에 따른 스타일 클래스
  const variantClasses = {
    default: 'markdown-body',
    compact: 'markdown-body markdown-body-compact',
    card: 'markdown-body bg-gray-50 rounded-lg p-6 border border-gray-200',
  }

  const computedClass = $derived(`${variantClasses[variant]} ${className}`)

  // CSS 변수를 인라인 스타일로 적용
  const styleVars = $derived(() => {
    const vars = [
      `--md-base-font-size: ${MARKDOWN_STYLE_CONFIG.baseFontSize}`,
      `--md-base-line-height: ${MARKDOWN_STYLE_CONFIG.baseLineHeight}`,
      `--md-h1-size: ${MARKDOWN_STYLE_CONFIG.h1Size}`,
      `--md-h2-size: ${MARKDOWN_STYLE_CONFIG.h2Size}`,
      `--md-h3-size: ${MARKDOWN_STYLE_CONFIG.h3Size}`,
      `--md-h4-size: ${MARKDOWN_STYLE_CONFIG.h4Size}`,
      `--md-heading-margin-top: ${MARKDOWN_STYLE_CONFIG.headingMarginTop}`,
      `--md-heading-margin-bottom: ${MARKDOWN_STYLE_CONFIG.headingMarginBottom}`,
      `--md-paragraph-margin-bottom: ${MARKDOWN_STYLE_CONFIG.paragraphMarginBottom}`,
      `--md-list-margin-bottom: ${MARKDOWN_STYLE_CONFIG.listMarginBottom}`,
      `--md-list-item-spacing: ${MARKDOWN_STYLE_CONFIG.listItemSpacing}`,
      `--md-inline-code-size: ${MARKDOWN_STYLE_CONFIG.inlineCodeSize}`,
      `--md-code-block-size: ${MARKDOWN_STYLE_CONFIG.codeBlockSize}`,
      `--md-hr-margin-vertical: ${MARKDOWN_STYLE_CONFIG.hrMarginVertical}`,
      `--md-compact-base-font-size: ${MARKDOWN_STYLE_CONFIG.compactBaseFontSize}`,
      `--md-compact-h1-size: ${MARKDOWN_STYLE_CONFIG.compactH1Size}`,
      `--md-compact-h2-size: ${MARKDOWN_STYLE_CONFIG.compactH2Size}`,
      `--md-compact-h3-size: ${MARKDOWN_STYLE_CONFIG.compactH3Size}`,
    ]

    // 높이 제한 스타일 추가
    if (maxPreviewHeight > 0 && !isExpanded) {
      vars.push(`max-height: ${maxPreviewHeight}px`)
      vars.push('overflow: hidden')
      vars.push('position: relative')
    }

    return vars.join('; ')
  })
</script>

<div class="relative">
  <!-- 상단 버튼 그룹 -->
  {#if showCopy || showToc}
    <div class="absolute top-2 right-2 z-10 flex gap-2">
      <!-- 목차 버튼 -->
      {#if showToc && tocItems.length > 0}
        <button
          onclick={() => (showTableOfContents = !showTableOfContents)}
          class="p-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
          title="목차"
        >
          <ListIcon size={16} class="text-gray-600" />
        </button>
      {/if}

      <!-- 복사 버튼 -->
      {#if showCopy}
        <button
          onclick={copyToClipboard}
          class="p-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
          title={copied ? '복사됨!' : '복사하기'}
        >
          {#if copied}
            <CheckIcon size={16} class="text-green-600" />
          {:else}
            <CopyIcon size={16} class="text-gray-600" />
          {/if}
        </button>
      {/if}
    </div>
  {/if}

  <!-- 목차 (Table of Contents) -->
  {#if showToc && showTableOfContents && tocItems.length > 0}
    <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <ListIcon size={16} />
          목차
        </h4>
        <button
          onclick={() => (showTableOfContents = false)}
          class="text-gray-500 hover:text-gray-700"
        >
          <ChevronUpIcon size={16} />
        </button>
      </div>
      <nav class="space-y-1">
        {#each tocItems as item}
          <a
            href="#{item.id}"
            class="block text-sm hover:text-blue-600 transition-colors"
            style="padding-left: {(item.level - 1) * 12}px"
          >
            {item.text}
          </a>
        {/each}
      </nav>
    </div>
  {/if}

  <!-- 마크다운 콘텐츠 -->
  <div class={computedClass} style={styleVars()}>
    {@html renderMarkdown(content)}
  </div>

  <!-- 그라디언트 오버레이 (높이 제한 시) -->
  {#if maxPreviewHeight > 0 && !isExpanded}
    <div
      class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"
    ></div>
  {/if}

  <!-- 더 보기/접기 버튼 -->
  {#if collapsible || maxPreviewHeight > 0}
    <div class="flex justify-center mt-4">
      <button
        onclick={toggleExpand}
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
      >
        {#if isExpanded}
          <ChevronUpIcon size={16} />
          <span>접기</span>
        {:else}
          <ChevronDownIcon size={16} />
          <span>더 보기</span>
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  /* GitHub 마크다운 스타일 커스터마이징 */
  /* 💡 스타일 값은 파일 최상단 MARKDOWN_STYLE_CONFIG에서 조정하세요 */

  /* 기본 폰트 크기 조정 */
  :global(.markdown-body) {
    font-size: var(--md-base-font-size);
    line-height: var(--md-base-line-height);
  }

  /* 제목 크기 조정 */
  :global(.markdown-body h1) {
    font-size: var(--md-h1-size);
    margin-top: var(--md-heading-margin-top);
    margin-bottom: var(--md-heading-margin-bottom);
  }

  :global(.markdown-body h2) {
    font-size: var(--md-h2-size);
    margin-top: var(--md-heading-margin-top);
    margin-bottom: var(--md-heading-margin-bottom);
  }

  :global(.markdown-body h3) {
    font-size: var(--md-h3-size);
    margin-top: var(--md-heading-margin-top);
    margin-bottom: var(--md-heading-margin-bottom);
  }

  :global(.markdown-body h4) {
    font-size: var(--md-h4-size);
    margin-top: var(--md-heading-margin-top);
    margin-bottom: var(--md-heading-margin-bottom);
  }

  /* 첫 번째 제목 상단 마진 제거 */
  :global(.markdown-body > *:first-child) {
    margin-top: 0 !important;
  }

  /* 본문 텍스트 */
  :global(.markdown-body p) {
    margin-top: 0;
    margin-bottom: var(--md-paragraph-margin-bottom);
  }

  /* 리스트 간격 */
  :global(.markdown-body ul),
  :global(.markdown-body ol) {
    margin-top: 0;
    margin-bottom: var(--md-list-margin-bottom);
    padding-left: 2em;
  }

  :global(.markdown-body li) {
    margin-top: 0.25em;
  }

  :global(.markdown-body li + li) {
    margin-top: var(--md-list-item-spacing);
  }

  /* 코드 블록 */
  :global(.markdown-body code) {
    font-size: var(--md-inline-code-size);
    padding: 0.2em 0.4em;
  }

  :global(.markdown-body pre) {
    font-size: var(--md-code-block-size);
  }

  /* 구분선 간격 */
  :global(.markdown-body hr) {
    margin-top: var(--md-hr-margin-vertical);
    margin-bottom: var(--md-hr-margin-vertical);
  }

  /* compact 버전 */
  :global(.markdown-body-compact) {
    font-size: var(--md-compact-base-font-size);
  }

  :global(.markdown-body-compact h1) {
    font-size: var(--md-compact-h1-size);
  }

  :global(.markdown-body-compact h2) {
    font-size: var(--md-compact-h2-size);
  }

  :global(.markdown-body-compact h3) {
    font-size: var(--md-compact-h3-size);
  }

  /* 외부 링크 아이콘 */
  :global(.markdown-body a.external-link)::after {
    content: '';
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-left: 4px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%230969da' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'%3E%3C/path%3E%3Cpolyline points='15 3 21 3 21 9'%3E%3C/polyline%3E%3Cline x1='10' y1='14' x2='21' y2='3'%3E%3C/line%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    vertical-align: middle;
  }

  :global(.markdown-body a.external-link):hover::after {
    opacity: 0.7;
  }

  /* 카드 variant 스타일 미세 조정 */
  :global(.markdown-body.bg-gray-50) {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
</style>

