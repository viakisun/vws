// .eslintrc.js
module.exports = {
  extends: ['@sveltejs/eslint-config-svelte'],
  plugins: ['custom-rules'],
  rules: {
    'custom-rules/no-complex-effect': 'error',
    'custom-rules/no-template-function-calls': 'error'
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      rules: {
        // Svelte 특화 규칙
        'custom-rules/no-complex-effect': 'error',
        'custom-rules/no-template-function-calls': 'error'
      }
    }
  ]
};
