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
    if (stage === currentStage) return false
    const allowedTransitions = INITIATIVE_STAGE_TRANSITIONS[currentStage]
    return allowedTransitions.allowed.includes(stage)
  }

  async function handleStageChange(stage: InitiativeStage) {
    if (isChanging || currentStatus !== 'active' || !isStageAllowed(stage)) return

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
  <div class="flex items-center justify-between">
    {#each stages as stage, index}
      {@const isActive = currentStage === stage}
      {@const isPast = stages.indexOf(currentStage) > index}
      {@const stageText = getStageText(stage)}
      {@const bgClass = isActive
        ? stage === 'shaping'
          ? 'bg-gray-500'
          : stage === 'building'
            ? 'bg-blue-500'
            : stage === 'testing'
              ? 'bg-purple-500'
              : stage === 'shipping'
                ? 'bg-orange-500'
                : 'bg-green-500'
        : isPast
          ? stage === 'shaping'
            ? 'bg-gray-300'
            : stage === 'building'
              ? 'bg-blue-300'
              : stage === 'testing'
                ? 'bg-purple-300'
                : stage === 'shipping'
                  ? 'bg-orange-300'
                  : 'bg-green-300'
          : 'bg-gray-200'}
      {@const textClass = isActive || isPast ? 'text-white' : 'text-gray-400'}
      {@const ringClass = isActive
        ? stage === 'shaping'
          ? 'ring-4 ring-gray-700'
          : stage === 'building'
            ? 'ring-4 ring-blue-700'
            : stage === 'testing'
              ? 'ring-4 ring-purple-700'
              : stage === 'shipping'
                ? 'ring-4 ring-orange-700'
                : 'ring-4 ring-green-700'
        : ''}
      {@const isClickable = !isChanging && currentStatus === 'active' && isStageAllowed(stage)}
      {@const cursorClass = isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
      {@const opacityClass = isClickable || isActive || isPast ? '' : 'opacity-50'}
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
      <div class="flex items-center flex-1">
        <div class="flex flex-col items-center flex-1">
          <button
            type="button"
            onclick={() => handleStageChange(stage)}
            disabled={!isClickable}
            class="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition border-0 {bgClass} {textClass} {ringClass} {cursorClass} {opacityClass}"
          >
            {index + 1}
          </button>
          <span class="mt-2 text-xs font-medium {labelTextClass}">
            {stageText}
          </span>
        </div>
        {#if index < 4}
          <div
            class="flex-1 h-1 mx-2 transition"
            class:bg-gray-400={isPast}
            class:bg-gray-200={!isPast}
          ></div>
        {/if}
      </div>
    {/each}
  </div>
</div>
