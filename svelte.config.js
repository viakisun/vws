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
    // 모든 페이지를 클라이언트 사이드 렌더링으로 설정
    ssr: false,
  },
}

export default config
