// svelte-check 설정
export default {
  // 경고 억제 - CSS 경고만 무시 (a11y 경고는 표시)
  onwarn: (warning) => {
    // CSS 경고 무시 (line-clamp)
    if (warning.code === 'css-unused-selector') return

    // 나머지 경고는 표시 (a11y 포함)
    return warning
  },
}
