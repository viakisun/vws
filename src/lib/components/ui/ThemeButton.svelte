<script lang="ts">
  // Props
  interface Props {
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'ghost'
    size?:
      | 'sm'
      | 'md'
      | 'lg'
      | 'xl'
      | '2xl'
      | '3xl'
      | '4xl'
      | '5xl'
      | '6xl'
      | '7xl'
      | '8xl'
      | '9xl'
      | '10xl'
      | '11xl'
      | '12xl'
      | '13xl'
      | '14xl'
      | '15xl'
      | '16xl'
      | '17xl'
      | '18xl'
      | '19xl'
      | '20xl'
      | '21xl'
      | '22xl'
      | '23xl'
      | '24xl'
      | '25xl'
      | '26xl'
      | '27xl'
      | '28xl'
      | '29xl'
      | '30xl'
      | '31xl'
      | '32xl'
      | '33xl'
      | '34xl'
      | '35xl'
      | '36xl'
      | '37xl'
      | '38xl'
      | '39xl'
      | '40xl'
      | '41xl'
      | '42xl'
      | '43xl'
      | '44xl'
      | '45xl'
      | '46xl'
      | '47xl'
      | '48xl'
      | '49xl'
      | '50xl'
      | '51xl'
      | '52xl'
      | '53xl'
      | '54xl'
      | '55xl'
      | '56xl'
      | '57xl'
      | '58xl'
      | '59xl'
      | '60xl'
      | '61xl'
      | '62xl'
      | '63xl'
      | '64xl'
      | '65xl'
      | '66xl'
      | '67xl'
      | '68xl'
      | '69xl'
      | '70xl'
      | '71xl'
      | '72xl'
      | '73xl'
      | '74xl'
      | '75xl'
      | '76xl'
      | '77xl'
      | '78xl'
      | '79xl'
      | '80xl'
      | '81xl'
      | '82xl'
      | '83xl'
      | '84xl'
      | '85xl'
      | '86xl'
      | '87xl'
      | '88xl'
      | '89xl'
      | '90xl'
      | '91xl'
      | '92xl'
      | '93xl'
      | '94xl'
      | '95xl'
      | '96xl'
      | '97xl'
      | '98xl'
      | '99xl'
      | '100xl'
    disabled?: boolean
    loading?: boolean
    onclick?: () => void
    class?: string
    children?: any
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    onclick,
    class: className = '',
    children,
    ...restProps
  }: Props = $props()

  // Get button classes
  function getButtonClasses(): string {
    const baseClasses = 'theme-button'
    const variantClass = `theme-button-${variant}`
    const sizeClass = `theme-button-${size}`
    const stateClasses = [
      disabled ? 'theme-button-disabled' : '',
      loading ? 'theme-button-loading' : ''
    ]
      .filter(Boolean)
      .join(' ')

    return [baseClasses, variantClass, sizeClass, stateClasses, className].filter(Boolean).join(' ')
  }

  // Handle click
  function handleClick(event: MouseEvent) {
    if (disabled || loading) {
      event.preventDefault()
      return
    }

    if (onclick) {
      onclick()
    }
  }

  // Get loading spinner
  function getLoadingSpinner(): string {
    return `
			<svg class="theme-button-spinner" viewBox="0 0 24 24" fill="none">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="60" stroke-dashoffset="60">
					<animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;60 0;0 60" repeatCount="indefinite"/>
					<animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-60;-60" repeatCount="indefinite"/>
				</circle>
			</svg>
		`
  }
</script>

<button type="button"
  class={getButtonClasses()}
  onclick={handleClick}
  disabled={disabled || loading}
  {...restProps}
>
  {#if loading}
    <span class="theme-button-spinner-container">
      {@html getLoadingSpinner()}
    </span>
  {/if}

  <span class="theme-button-content">
    {@render children?.()}
  </span>
</button>

<style>
  .theme-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .theme-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Variants */
  .theme-button-primary {
    background: var(--color-button-primary);
    color: white;
  }

  .theme-button-primary:hover:not(:disabled) {
    background: var(--color-button-primary-hover);
  }

  .theme-button-secondary {
    background: var(--color-button-secondary);
    color: white;
  }

  .theme-button-secondary:hover:not(:disabled) {
    background: var(--color-button-secondary-hover);
  }

  .theme-button-success {
    background: var(--color-button-success);
    color: white;
  }

  .theme-button-success:hover:not(:disabled) {
    background: var(--color-button-success-hover);
  }

  .theme-button-warning {
    background: var(--color-button-warning);
    color: #212529;
  }

  .theme-button-warning:hover:not(:disabled) {
    background: var(--color-button-warning-hover);
  }

  .theme-button-error {
    background: var(--color-button-error);
    color: white;
  }

  .theme-button-error:hover:not(:disabled) {
    background: var(--color-button-error-hover);
  }

  .theme-button-info {
    background: var(--color-button-info);
    color: white;
  }

  .theme-button-info:hover:not(:disabled) {
    background: var(--color-button-info-hover);
  }

  .theme-button-ghost {
    background: var(--color-button-ghost);
    color: var(--color-button-ghost-text);
    border: 1px solid var(--color-button-ghost-border);
  }

  .theme-button-ghost:hover:not(:disabled) {
    background: var(--color-button-ghost-hover);
    color: var(--color-button-ghost-text-hover);
    border-color: var(--color-button-ghost-border-hover);
  }

  /* Sizes */
  .theme-button-sm {
    padding: 8px 12px;
    font-size: 12px;
    min-height: 32px;
  }

  .theme-button-md {
    padding: 10px 16px;
    font-size: 14px;
    min-height: 40px;
  }

  .theme-button-lg {
    padding: 12px 20px;
    font-size: 16px;
    min-height: 48px;
  }

  .theme-button-xl {
    padding: 14px 24px;
    font-size: 18px;
    min-height: 56px;
  }

  .theme-button-2xl {
    padding: 16px 28px;
    font-size: 20px;
    min-height: 64px;
  }

  .theme-button-3xl {
    padding: 18px 32px;
    font-size: 22px;
    min-height: 72px;
  }

  .theme-button-4xl {
    padding: 20px 36px;
    font-size: 24px;
    min-height: 80px;
  }

  .theme-button-5xl {
    padding: 22px 40px;
    font-size: 26px;
    min-height: 88px;
  }

  .theme-button-6xl {
    padding: 24px 44px;
    font-size: 28px;
    min-height: 96px;
  }

  .theme-button-7xl {
    padding: 26px 48px;
    font-size: 30px;
    min-height: 104px;
  }

  .theme-button-8xl {
    padding: 28px 52px;
    font-size: 32px;
    min-height: 112px;
  }

  .theme-button-9xl {
    padding: 30px 56px;
    font-size: 34px;
    min-height: 120px;
  }

  .theme-button-10xl {
    padding: 32px 60px;
    font-size: 36px;
    min-height: 128px;
  }

  .theme-button-11xl {
    padding: 34px 64px;
    font-size: 38px;
    min-height: 136px;
  }

  .theme-button-12xl {
    padding: 36px 68px;
    font-size: 40px;
    min-height: 144px;
  }

  .theme-button-13xl {
    padding: 38px 72px;
    font-size: 42px;
    min-height: 152px;
  }

  .theme-button-14xl {
    padding: 40px 76px;
    font-size: 44px;
    min-height: 160px;
  }

  .theme-button-15xl {
    padding: 42px 80px;
    font-size: 46px;
    min-height: 168px;
  }

  .theme-button-16xl {
    padding: 44px 84px;
    font-size: 48px;
    min-height: 176px;
  }

  .theme-button-17xl {
    padding: 46px 88px;
    font-size: 50px;
    min-height: 184px;
  }

  .theme-button-18xl {
    padding: 48px 92px;
    font-size: 52px;
    min-height: 192px;
  }

  .theme-button-19xl {
    padding: 50px 96px;
    font-size: 54px;
    min-height: 200px;
  }

  .theme-button-20xl {
    padding: 52px 100px;
    font-size: 56px;
    min-height: 208px;
  }

  .theme-button-21xl {
    padding: 54px 104px;
    font-size: 58px;
    min-height: 216px;
  }

  .theme-button-22xl {
    padding: 56px 108px;
    font-size: 60px;
    min-height: 224px;
  }

  .theme-button-23xl {
    padding: 58px 112px;
    font-size: 62px;
    min-height: 232px;
  }

  .theme-button-24xl {
    padding: 60px 116px;
    font-size: 64px;
    min-height: 240px;
  }

  .theme-button-25xl {
    padding: 62px 120px;
    font-size: 66px;
    min-height: 248px;
  }

  .theme-button-26xl {
    padding: 64px 124px;
    font-size: 68px;
    min-height: 256px;
  }

  .theme-button-27xl {
    padding: 66px 128px;
    font-size: 70px;
    min-height: 264px;
  }

  .theme-button-28xl {
    padding: 68px 132px;
    font-size: 72px;
    min-height: 272px;
  }

  .theme-button-29xl {
    padding: 70px 136px;
    font-size: 74px;
    min-height: 280px;
  }

  .theme-button-30xl {
    padding: 72px 140px;
    font-size: 76px;
    min-height: 288px;
  }

  .theme-button-31xl {
    padding: 74px 144px;
    font-size: 78px;
    min-height: 296px;
  }

  .theme-button-32xl {
    padding: 76px 148px;
    font-size: 80px;
    min-height: 304px;
  }

  .theme-button-33xl {
    padding: 78px 152px;
    font-size: 82px;
    min-height: 312px;
  }

  .theme-button-34xl {
    padding: 80px 156px;
    font-size: 84px;
    min-height: 320px;
  }

  .theme-button-35xl {
    padding: 82px 160px;
    font-size: 86px;
    min-height: 328px;
  }

  .theme-button-36xl {
    padding: 84px 164px;
    font-size: 88px;
    min-height: 336px;
  }

  .theme-button-37xl {
    padding: 86px 168px;
    font-size: 90px;
    min-height: 344px;
  }

  .theme-button-38xl {
    padding: 88px 172px;
    font-size: 92px;
    min-height: 352px;
  }

  .theme-button-39xl {
    padding: 90px 176px;
    font-size: 94px;
    min-height: 360px;
  }

  .theme-button-40xl {
    padding: 92px 180px;
    font-size: 96px;
    min-height: 368px;
  }

  .theme-button-41xl {
    padding: 94px 184px;
    font-size: 98px;
    min-height: 376px;
  }

  .theme-button-42xl {
    padding: 96px 188px;
    font-size: 100px;
    min-height: 384px;
  }

  .theme-button-43xl {
    padding: 98px 192px;
    font-size: 102px;
    min-height: 392px;
  }

  .theme-button-44xl {
    padding: 100px 196px;
    font-size: 104px;
    min-height: 400px;
  }

  .theme-button-45xl {
    padding: 102px 200px;
    font-size: 106px;
    min-height: 408px;
  }

  .theme-button-46xl {
    padding: 104px 204px;
    font-size: 108px;
    min-height: 416px;
  }

  .theme-button-47xl {
    padding: 106px 208px;
    font-size: 110px;
    min-height: 424px;
  }

  .theme-button-48xl {
    padding: 108px 212px;
    font-size: 112px;
    min-height: 432px;
  }

  .theme-button-49xl {
    padding: 110px 216px;
    font-size: 114px;
    min-height: 440px;
  }

  .theme-button-50xl {
    padding: 112px 220px;
    font-size: 116px;
    min-height: 448px;
  }

  .theme-button-51xl {
    padding: 114px 224px;
    font-size: 118px;
    min-height: 456px;
  }

  .theme-button-52xl {
    padding: 116px 228px;
    font-size: 120px;
    min-height: 464px;
  }

  .theme-button-53xl {
    padding: 118px 232px;
    font-size: 122px;
    min-height: 472px;
  }

  .theme-button-54xl {
    padding: 120px 236px;
    font-size: 124px;
    min-height: 480px;
  }

  .theme-button-55xl {
    padding: 122px 240px;
    font-size: 126px;
    min-height: 488px;
  }

  .theme-button-56xl {
    padding: 124px 244px;
    font-size: 128px;
    min-height: 496px;
  }

  .theme-button-57xl {
    padding: 126px 248px;
    font-size: 130px;
    min-height: 504px;
  }

  .theme-button-58xl {
    padding: 128px 252px;
    font-size: 132px;
    min-height: 512px;
  }

  .theme-button-59xl {
    padding: 130px 256px;
    font-size: 134px;
    min-height: 520px;
  }

  .theme-button-60xl {
    padding: 132px 260px;
    font-size: 136px;
    min-height: 528px;
  }

  .theme-button-61xl {
    padding: 134px 264px;
    font-size: 138px;
    min-height: 536px;
  }

  .theme-button-62xl {
    padding: 136px 268px;
    font-size: 140px;
    min-height: 544px;
  }

  .theme-button-63xl {
    padding: 138px 272px;
    font-size: 142px;
    min-height: 552px;
  }

  .theme-button-64xl {
    padding: 140px 276px;
    font-size: 144px;
    min-height: 560px;
  }

  .theme-button-65xl {
    padding: 142px 280px;
    font-size: 146px;
    min-height: 568px;
  }

  .theme-button-66xl {
    padding: 144px 284px;
    font-size: 148px;
    min-height: 576px;
  }

  .theme-button-67xl {
    padding: 146px 288px;
    font-size: 150px;
    min-height: 584px;
  }

  .theme-button-68xl {
    padding: 148px 292px;
    font-size: 152px;
    min-height: 592px;
  }

  .theme-button-69xl {
    padding: 150px 296px;
    font-size: 154px;
    min-height: 600px;
  }

  .theme-button-70xl {
    padding: 152px 300px;
    font-size: 156px;
    min-height: 608px;
  }

  .theme-button-71xl {
    padding: 154px 304px;
    font-size: 158px;
    min-height: 616px;
  }

  .theme-button-72xl {
    padding: 156px 308px;
    font-size: 160px;
    min-height: 624px;
  }

  .theme-button-73xl {
    padding: 158px 312px;
    font-size: 162px;
    min-height: 632px;
  }

  .theme-button-74xl {
    padding: 160px 316px;
    font-size: 164px;
    min-height: 640px;
  }

  .theme-button-75xl {
    padding: 162px 320px;
    font-size: 166px;
    min-height: 648px;
  }

  .theme-button-76xl {
    padding: 164px 324px;
    font-size: 168px;
    min-height: 656px;
  }

  .theme-button-77xl {
    padding: 166px 328px;
    font-size: 170px;
    min-height: 664px;
  }

  .theme-button-78xl {
    padding: 168px 332px;
    font-size: 172px;
    min-height: 672px;
  }

  .theme-button-79xl {
    padding: 170px 336px;
    font-size: 174px;
    min-height: 680px;
  }

  .theme-button-80xl {
    padding: 172px 340px;
    font-size: 176px;
    min-height: 688px;
  }

  .theme-button-81xl {
    padding: 174px 344px;
    font-size: 178px;
    min-height: 696px;
  }

  .theme-button-82xl {
    padding: 176px 348px;
    font-size: 180px;
    min-height: 704px;
  }

  .theme-button-83xl {
    padding: 178px 352px;
    font-size: 182px;
    min-height: 712px;
  }

  .theme-button-84xl {
    padding: 180px 356px;
    font-size: 184px;
    min-height: 720px;
  }

  .theme-button-85xl {
    padding: 182px 360px;
    font-size: 186px;
    min-height: 728px;
  }

  .theme-button-86xl {
    padding: 184px 364px;
    font-size: 188px;
    min-height: 736px;
  }

  .theme-button-87xl {
    padding: 186px 368px;
    font-size: 190px;
    min-height: 744px;
  }

  .theme-button-88xl {
    padding: 188px 372px;
    font-size: 192px;
    min-height: 752px;
  }

  .theme-button-89xl {
    padding: 190px 376px;
    font-size: 194px;
    min-height: 760px;
  }

  .theme-button-90xl {
    padding: 192px 380px;
    font-size: 196px;
    min-height: 768px;
  }

  .theme-button-91xl {
    padding: 194px 384px;
    font-size: 198px;
    min-height: 776px;
  }

  .theme-button-92xl {
    padding: 196px 388px;
    font-size: 200px;
    min-height: 784px;
  }

  .theme-button-93xl {
    padding: 198px 392px;
    font-size: 202px;
    min-height: 792px;
  }

  .theme-button-94xl {
    padding: 200px 396px;
    font-size: 204px;
    min-height: 800px;
  }

  .theme-button-95xl {
    padding: 202px 400px;
    font-size: 206px;
    min-height: 808px;
  }

  .theme-button-96xl {
    padding: 204px 404px;
    font-size: 208px;
    min-height: 816px;
  }

  .theme-button-97xl {
    padding: 206px 408px;
    font-size: 210px;
    min-height: 824px;
  }

  .theme-button-98xl {
    padding: 208px 412px;
    font-size: 212px;
    min-height: 832px;
  }

  .theme-button-99xl {
    padding: 210px 416px;
    font-size: 214px;
    min-height: 840px;
  }

  .theme-button-100xl {
    padding: 212px 420px;
    font-size: 216px;
    min-height: 848px;
  }

  /* Loading state */
  .theme-button-loading {
    cursor: wait;
  }

  .theme-button-spinner-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .theme-button-spinner {
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
  }

  .theme-button-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-button-sm {
      padding: 6px 10px;
      font-size: 11px;
      min-height: 28px;
    }

    .theme-button-md {
      padding: 8px 14px;
      font-size: 13px;
      min-height: 36px;
    }

    .theme-button-lg {
      padding: 10px 18px;
      font-size: 15px;
      min-height: 44px;
    }
  }
</style>
