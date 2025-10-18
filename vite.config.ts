import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

// 빌드 시점의 타임스탬프 생성
const buildTimestamp = new Date().toLocaleString('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTimestamp),
  },
  optimizeDeps: {
    exclude: ['pg', 'pg-native', 'dotenv'],
  },
  ssr: {
    noExternal: [],
    external: ['pg', 'pg-native', 'dotenv'],
  },
})
