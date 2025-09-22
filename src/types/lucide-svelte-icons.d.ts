declare module 'lucide-svelte/icons/*' {
  import type { SvelteComponent } from 'svelte'
  const Icon: new (...args: any[]) => SvelteComponent
  export default Icon
}
