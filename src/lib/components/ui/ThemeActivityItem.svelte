<script lang="ts">
  import { formatDateForDisplay } from "$lib/utils/date-handler";
  import ThemeBadge from "./ThemeBadge.svelte";

  interface Props {
    title: string;
    time: string;
    description?: string;
    type?: "success" | "warning" | "info" | "error";
    icon?: any;
    class?: string;
  }

  let {
    title,
    time,
    description,
    type = "info",
    icon,
    class: className = "",
    ...restProps
  }: Props = $props();

  // 날짜 포맷팅
  const formattedTime = $derived(
    time ? formatDateForDisplay(time, "KOREAN") : "",
  );

  const typeConfig = {
    success: { variant: "success" as const, label: "완료" },
    warning: { variant: "warning" as const, label: "대기" },
    info: { variant: "info" as const, label: "정보" },
    error: { variant: "error" as const, label: "오류" },
  };
</script>

<div
  class="flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] {className}"
  style:background="var(--color-surface)"
  style:border="1px solid var(--color-border)"
  {...restProps}
>
  {#if icon}
    <div
      class="h-10 w-10 rounded-full flex items-center justify-center"
      style:background="var(--color-primary-light)"
    >
      <icon class="h-5 w-5" style:color="var(--color-primary)"></icon>
    </div>
  {/if}
  <div class="flex-1 min-w-0">
    <p class="text-sm font-medium" style:color="var(--color-text)">{title}</p>
    {#if description}
      <p class="text-xs mt-1" style:color="var(--color-text-secondary)">
        {description}
      </p>
    {/if}
    <p class="text-xs mt-1" style:color="var(--color-text-secondary)">
      {formattedTime}
    </p>
  </div>
  <ThemeBadge variant={typeConfig[type].variant} size="sm">
    {typeConfig[type].label}
  </ThemeBadge>
</div>
