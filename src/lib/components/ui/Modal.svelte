<script lang="ts">
  import { XIcon } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let {
    open = $bindable(false),
    title = "",
    maxWidth = "max-w-lg",
    onClose,
    children,
  } = $props<{
    open?: boolean;
    title?: string;
    maxWidth?: string;
    onClose?: () => void;
    children?: () => unknown;
  }>();

  function close() {
    open = false;
    onClose?.();
    dispatch("close");
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div
      class="absolute inset-0 bg-black/40"
      role="button"
      tabindex="0"
      onclick={close}
      onkeydown={(e) =>
        (e.key === "Escape" || e.key === "Enter" || e.key === " ") && close()}
    ></div>
    <div
      class={`relative w-full ${maxWidth} mx-4 rounded-xl bg-white shadow-lg border border-gray-200`}
      role="dialog"
      aria-modal="true"
    >
      <header
        class="flex items-center justify-between border-b border-gray-200 px-4 py-3"
      >
        <h3 class="text-base font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          class="p-1.5 rounded-md hover:bg-gray-50"
          aria-label="Close"
          onclick={close}
        >
          <XIcon size={18} />
        </button>
      </header>
      <div class="p-4">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
