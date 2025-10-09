<script lang="ts">
  import ThemeButton from './ThemeButton.svelte'

  interface Props {
    onclick?: () => void
    disabled?: boolean
    children?: import('svelte').Snippet
  }

  let { onclick, disabled = false, children }: Props = $props()
</script>

<ThemeButton variant="ghost" size="sm" {onclick} {disabled}>
  {@render children?.()}
</ThemeButton>
