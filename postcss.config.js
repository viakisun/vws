export default {
  plugins: {
    '@tailwindcss/postcss': {},
    // autoprefixer는 Tailwind v4에 내장되어 있음
    // CSS 경고는 svelte-check에서 발생하므로 여기서는 처리 불가
  },
}
