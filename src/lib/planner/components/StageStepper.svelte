<script lang="ts">
  import type { InitiativeStage, InitiativeStatus } from '../types'
  import { INITIATIVE_STAGE_TRANSITIONS } from '../types'
  import { getStageText } from '../utils/initiative-helpers'
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'

  interface Props {
    currentStage: InitiativeStage
    currentStatus: InitiativeStatus
    isChanging: boolean
    onStageChange: (stage: InitiativeStage) => Promise<void>
  }

  let { currentStage, currentStatus, isChanging, onStageChange }: Props = $props()

  const stages: InitiativeStage[] = ['shaping', 'building', 'testing', 'shipping', 'done']

  function isStageAllowed(stage: InitiativeStage): boolean {
    return stage !== currentStage
  }

  async function handleStageChange(stage: InitiativeStage) {
    if (isChanging || stage === currentStage) return

    try {
      await onStageChange(stage)
    } catch (e) {
      alert(e instanceof Error ? e.message : '단계 변경에 실패했습니다')
    }
  }
</script>

<div
  class="rounded-lg border p-6"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <SectionHeader title="Stage" />
  <div class="flex items-center justify-center gap-4">
    {#each stages as stage, index}
      {@const isActive = currentStage === stage}
      {@const isPast = stages.indexOf(currentStage) > index}
      {@const stageLabel = stage.charAt(0).toUpperCase() + stage.slice(1)}
      {@const borderClass = isActive
        ? stage === 'shaping'
          ? 'border-gray-500'
          : stage === 'building'
            ? 'border-blue-500'
            : stage === 'testing'
              ? 'border-purple-500'
              : stage === 'shipping'
                ? 'border-orange-500'
                : 'border-green-500'
        : 'border-gray-300'}
      {@const bgClass = isActive
        ? stage === 'shaping'
          ? 'bg-gray-50'
          : stage === 'building'
            ? 'bg-blue-50'
            : stage === 'testing'
              ? 'bg-purple-50'
              : stage === 'shipping'
                ? 'bg-orange-50'
                : 'bg-green-50'
        : ''}
      {@const labelTextClass = isActive
        ? stage === 'shaping'
          ? 'text-gray-700'
          : stage === 'building'
            ? 'text-blue-700'
            : stage === 'testing'
              ? 'text-purple-700'
              : stage === 'shipping'
                ? 'text-orange-700'
                : 'text-green-700'
        : isPast
          ? 'text-gray-600'
          : 'text-gray-400'}
      {@const isClickable = !isChanging && isStageAllowed(stage)}
      {@const cursorClass = isClickable ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed'}
      {@const opacityClass = isClickable || isActive || isPast ? '' : 'opacity-50'}

      <button
        type="button"
        onclick={() => handleStageChange(stage)}
        disabled={!isClickable}
        class="flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all w-32 {borderClass} {bgClass} {cursorClass} {opacityClass}"
        style:background={isActive ? '' : 'var(--color-surface-secondary)'}
        style:border-color={!isActive ? 'var(--color-border)' : ''}
      >
        <div class="text-xs font-semibold mb-1 {labelTextClass}">Stage #{index + 1}</div>
        <div class="text-sm font-bold {labelTextClass}">{stageLabel}</div>
      </button>
    {/each}
  </div>
</div>
