import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true,
  },
  kit: {
    adapter: adapter({ out: 'build' }),
  },
  vitePlugin: {
    inspector: false,
    dynamicCompileOptions({ filename }) {
      // External libraries that use $$props should not use runes mode
      if (filename.includes('node_modules/lucide-svelte')) {
        return { runes: false }
      }
    },
  },
}

export default config
