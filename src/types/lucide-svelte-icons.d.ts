declare module "lucide-svelte/icons/*" {
  import type { SvelteComponent } from "svelte";
  const Icon: new (...args: unknown[]) => SvelteComponent;
  export default Icon;
}
