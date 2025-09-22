<script lang="ts">
  // Props
  interface Props {
    currentPage?: number
    totalPages?: number
    showFirstLast?: boolean
    showPrevNext?: boolean
    maxVisible?: number
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'pills' | 'outlined' | 'ghost'
    class?: string
    onchange?: (page: number) => void
    children?: any
  }

  let {
    currentPage = 1,
    totalPages = 1,
    showFirstLast = true,
    showPrevNext = true,
    maxVisible = 5,
    size = 'md',
    variant = 'default',
    class: className = '',
    onchange,
    children,
    ...restProps
  }: Props = $props()

  // Get pagination classes
  function getPaginationClasses(): string {
    const baseClasses = 'theme-pagination'
    const sizeClass = `theme-pagination-${size}`
    const variantClass = `theme-pagination-${variant}`

    return [baseClasses, sizeClass, variantClass, className].filter(Boolean).join(' ')
  }

  // Get page button classes
  function getPageButtonClasses(page: number): string {
    const baseClasses = 'theme-pagination-button'
    const sizeClass = `theme-pagination-button-${size}`
    const variantClass = `theme-pagination-button-${variant}`
    const activeClass = page === currentPage ? 'theme-pagination-button-active' : ''

    return [baseClasses, sizeClass, variantClass, activeClass].filter(Boolean).join(' ')
  }

  // Get navigation button classes
  function getNavButtonClasses(): string {
    const baseClasses = 'theme-pagination-nav'
    const sizeClass = `theme-pagination-nav-${size}`
    const variantClass = `theme-pagination-nav-${variant}`

    return [baseClasses, sizeClass, variantClass].filter(Boolean).join(' ')
  }

  // Get visible pages
  function getVisiblePages(): number[] {
    const pages: number[] = []
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  // Handle page click
  function handlePageClick(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      currentPage = page
      if (onchange) {
        onchange(page)
      }
    }
  }

  // Handle first page
  function handleFirstPage() {
    handlePageClick(1)
  }

  // Handle last page
  function handleLastPage() {
    handlePageClick(totalPages)
  }

  // Handle previous page
  function handlePrevPage() {
    handlePageClick(currentPage - 1)
  }

  // Handle next page
  function handleNextPage() {
    handlePageClick(currentPage + 1)
  }

  // Check if first page
  function isFirstPage(): boolean {
    return currentPage === 1
  }

  // Check if last page
  function isLastPage(): boolean {
    return currentPage === totalPages
  }
</script>

<div class={getPaginationClasses()} {...restProps}>
  {#if showFirstLast && !isFirstPage()}
    <button class={getNavButtonClasses()} onclick={handleFirstPage} aria-label="First page">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"></path>
      </svg>
    </button>
  {/if}

  {#if showPrevNext && !isFirstPage()}
    <button class={getNavButtonClasses()} onclick={handlePrevPage} aria-label="Previous page">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6"></path>
      </svg>
    </button>
  {/if}

  {#each getVisiblePages() as page}
    <button
      class={getPageButtonClasses(page)}
      onclick={() => handlePageClick(page)}
      aria-label="Page {page}"
      aria-current={page === currentPage ? 'page' : undefined}
    >
      {page}
    </button>
  {/each}

  {#if showPrevNext && !isLastPage()}
    <button class={getNavButtonClasses()} onclick={handleNextPage} aria-label="Next page">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"></path>
      </svg>
    </button>
  {/if}

  {#if showFirstLast && !isLastPage()}
    <button class={getNavButtonClasses()} onclick={handleLastPage} aria-label="Last page">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 17l5-5-5-5M6 17l5-5-5-5"></path>
      </svg>
    </button>
  {/if}
</div>

<style>
  .theme-pagination {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .theme-pagination-button,
  .theme-pagination-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--color-surface);
    color: var(--color-text);
  }

  .theme-pagination-button:focus,
  .theme-pagination-nav:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-pagination-button:hover,
  .theme-pagination-nav:hover {
    background: var(--color-border);
  }

  .theme-pagination-button-active {
    background: var(--color-primary);
    color: white;
  }

  .theme-pagination-button-active:hover {
    background: var(--color-primary-hover);
  }

  /* Variants */
  .theme-pagination-default {
    /* Default styling is handled by base classes */
  }

  .theme-pagination-pills .theme-pagination-button,
  .theme-pagination-pills .theme-pagination-nav {
    border-radius: 9999px;
  }

  .theme-pagination-outlined .theme-pagination-button,
  .theme-pagination-outlined .theme-pagination-nav {
    border: 1px solid var(--color-border);
    background: transparent;
  }

  .theme-pagination-outlined .theme-pagination-button:hover,
  .theme-pagination-outlined .theme-pagination-nav:hover {
    background: var(--color-surface);
  }

  .theme-pagination-outlined .theme-pagination-button-active {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }

  .theme-pagination-ghost .theme-pagination-button,
  .theme-pagination-ghost .theme-pagination-nav {
    background: transparent;
    border: none;
  }

  .theme-pagination-ghost .theme-pagination-button:hover,
  .theme-pagination-ghost .theme-pagination-nav:hover {
    background: var(--color-border);
  }

  .theme-pagination-ghost .theme-pagination-button-active {
    background: var(--color-primary);
  }

  /* Sizes */
  .theme-pagination-sm .theme-pagination-button,
  .theme-pagination-sm .theme-pagination-nav {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .theme-pagination-md .theme-pagination-button,
  .theme-pagination-md .theme-pagination-nav {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .theme-pagination-lg .theme-pagination-button,
  .theme-pagination-lg .theme-pagination-nav {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .theme-pagination-xl .theme-pagination-button,
  .theme-pagination-xl .theme-pagination-nav {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  /* Navigation icons */
  .theme-pagination-nav svg {
    width: 16px;
    height: 16px;
  }

  .theme-pagination-sm .theme-pagination-nav svg {
    width: 12px;
    height: 12px;
  }

  .theme-pagination-lg .theme-pagination-nav svg {
    width: 18px;
    height: 18px;
  }

  .theme-pagination-xl .theme-pagination-nav svg {
    width: 20px;
    height: 20px;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-pagination {
      gap: 2px;
    }

    .theme-pagination-sm .theme-pagination-button,
    .theme-pagination-sm .theme-pagination-nav {
      width: 24px;
      height: 24px;
      font-size: 11px;
    }

    .theme-pagination-md .theme-pagination-button,
    .theme-pagination-md .theme-pagination-nav {
      width: 28px;
      height: 28px;
      font-size: 13px;
    }

    .theme-pagination-lg .theme-pagination-button,
    .theme-pagination-lg .theme-pagination-nav {
      width: 32px;
      height: 32px;
      font-size: 15px;
    }

    .theme-pagination-xl .theme-pagination-button,
    .theme-pagination-xl .theme-pagination-nav {
      width: 36px;
      height: 36px;
      font-size: 17px;
    }

    .theme-pagination-sm .theme-pagination-nav svg {
      width: 10px;
      height: 10px;
    }

    .theme-pagination-md .theme-pagination-nav svg {
      width: 12px;
      height: 12px;
    }

    .theme-pagination-lg .theme-pagination-nav svg {
      width: 14px;
      height: 14px;
    }

    .theme-pagination-xl .theme-pagination-nav svg {
      width: 16px;
      height: 16px;
    }
  }
</style>
