import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import sveltePlugin from 'eslint-plugin-svelte'
import unusedImports from 'eslint-plugin-unused-imports'
import svelteParser from 'svelte-eslint-parser'

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base configuration
  js.configs.recommended,

  // Global overrides for no-undef handling
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.svelte'],
    rules: {
      // TypeScript handles undefined names; avoid false positives in TS/Svelte
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: {
      // Keep strict undefined checks for plain JavaScript
      'no-undef': 'error',
    },
  },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        // SvelteKit globals
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        // SvelteKit specific
        locals: 'readonly',
        // Other common globals
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        // SVG globals
        SVGSVGElement: 'readonly',
        SVGGElement: 'readonly',
        SVGPathElement: 'readonly',
        SVGElement: 'readonly',
        // Animation globals
        requestAnimationFrame: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      // === TypeScript Rules ===
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'unused-imports/no-unused-imports': 'error',

      // === General Rules ===
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': 'off', // Handled by TypeScript

      // === 이름 처리 강제 규칙은 서버 사이드 파일에서만 적용 ===
      'no-restricted-syntax': 'off',
    },
  },

  // Server-side files (API routes, server utilities)
  {
    files: ['**/*.server.ts', '**/api/**/*.ts', '**/server/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        // SvelteKit globals
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        // SvelteKit specific
        locals: 'readonly',
        // Other common globals
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        // SVG globals
        SVGSVGElement: 'readonly',
        SVGGElement: 'readonly',
        SVGPathElement: 'readonly',
        SVGElement: 'readonly',
        // Animation globals
        requestAnimationFrame: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      // === TypeScript Rules ===
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'unused-imports/no-unused-imports': 'error',

      // === General Rules ===
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': 'off', // Handled by TypeScript

      // === 이름 처리 강제 규칙 (서버 사이드에서만 적용) ===
      'no-restricted-syntax': [
        'error',
        // 1) + 연산으로 성/이름을 단순 결합하는 경우만
        {
          selector:
            "BinaryExpression[operator='+'] > MemberExpression[property.name=/^(last_name|first_name)$/]",
          message:
            '이름 조합 시 formatEmployeeName 또는 formatKoreanNameStandard 함수를 사용하세요',
        },
        // 2) 템플릿 리터럴에서 실제 이름 필드가 복수 포함된 경우만 (매우 제한적)
        {
          selector:
            'TemplateLiteral[expressions.length>=2] > MemberExpression[property.name=/^(last_name|first_name)$/]',
          message:
            '이름 조합 시 formatEmployeeName 또는 formatKoreanNameStandard 함수를 사용하세요',
        },
        // === 날짜 처리 강제 규칙 ===
        {
          selector:
            'CallExpression[callee.object.name="Date"][callee.property.name="toLocaleDateString"]',
          message: '날짜 표시 시 formatDateForDisplay 함수를 사용하세요.',
        },
        {
          selector:
            'CallExpression[callee.object.name="Date"][callee.property.name="toLocaleString"]',
          message: '날짜/시간 표시 시 formatDateForDisplay 함수를 사용하세요.',
        },
        {
          selector: 'CallExpression[callee.name="Date"]',
          message: '날짜 생성 시 toUTC 함수를 사용하여 표준화하세요.',
        },
        {
          selector: 'CallExpression[callee.property.name="toISOString"]',
          message: 'UTC 변환 시 toUTC 함수를 사용하세요.',
        },
      ],
    },
  },

  // Svelte files
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        // Svelte 5 호환성
        svelteFeatures: {
          runes: true,
        },
        // Note: TypeScript project config removed to avoid parsing errors
        // Svelte files are not included in tsconfig.json
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        // SvelteKit globals
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        // SvelteKit specific
        locals: 'readonly',
        // Other common globals
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        // SVG globals
        SVGSVGElement: 'readonly',
        SVGGElement: 'readonly',
        SVGPathElement: 'readonly',
        SVGElement: 'readonly',
        // Animation globals
        requestAnimationFrame: 'readonly',
      },
    },
    plugins: {
      svelte: sveltePlugin,
      '@typescript-eslint': tsPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      // === Svelte Rules ===
      'svelte/valid-compile': 'off', // Svelte 5 호환성 문제로 비활성화
      'unused-imports/no-unused-imports': 'error',

      // === TypeScript-aware unused vars rules ===
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'svelte/no-at-debug-tags': 'warn',
      'svelte/no-at-html-tags': 'off',
      'svelte/no-dupe-else-if-blocks': 'warn',
      'svelte/no-dupe-style-properties': 'warn',
      'svelte/no-dynamic-slot-name': 'warn',
      'svelte/no-not-function-handler': 'error',
      'svelte/no-object-in-text-mustaches': 'error',
      'svelte/no-reactive-functions': 'error',
      'svelte/no-reactive-literals': 'error',
      'svelte/no-shorthand-style-property-overrides': 'error',
      'svelte/no-unknown-style-directive-property': 'error',
      'svelte/no-useless-mustaches': 'error',
      'svelte/require-each-key': 'warn',
      'svelte/require-stores-init': 'error',
      'svelte/require-store-callbacks-use-set-param': 'error',
      'svelte/block-lang': 'off', // Svelte 5에서는 TypeScript를 기본 지원
      'svelte/button-has-type': 'warn',
      'svelte/html-closing-bracket-spacing': 'warn',
      'svelte/html-quotes': 'warn',
      'svelte/html-self-closing': 'warn',
      'svelte/indent': ['warn', { indent: 2 }],
      'svelte/max-attributes-per-line': ['warn', { singleline: 3, multiline: 1 }],
      'svelte/mustache-spacing': 'warn',
      'svelte/no-spaces-around-equal-signs-in-attribute': 'warn',
      'svelte/no-trailing-spaces': 'warn',
      'svelte/prefer-class-directive': 'warn',
      'svelte/prefer-style-directive': 'warn',
      'svelte/shorthand-attribute': 'warn',
      'svelte/shorthand-directive': 'warn',
      'svelte/spaced-html-comment': 'warn',
      'svelte/derived-has-same-inputs-outputs': 'warn',
      'svelte/first-attribute-linebreak': 'warn',
      'svelte/no-export-load-in-svelte-module-in-kit-pages': 'warn',
      'svelte/no-target-blank': 'warn',
      'svelte/no-unused-class-name': 'off',
      'svelte/no-unused-svelte-ignore': 'warn',
      'svelte/prefer-destructured-store-props': 'warn',
      'svelte/require-event-dispatcher-types': 'warn',
      'svelte/require-optimized-style-attribute': 'off',
      'svelte/valid-each-key': 'warn',

      // === Svelte 5 호환성 규칙 ===
      'svelte/no-reactive-functions': 'off', // Svelte 5에서는 $derived 사용
      'svelte/no-reactive-literals': 'off', // Svelte 5에서는 $state 사용
      'svelte/require-stores-init': 'off', // Svelte 5에서는 $state 사용
      'svelte/require-store-callbacks-use-set-param': 'off', // Svelte 5에서는 $state 사용
      'svelte/prefer-destructured-store-props': 'off', // Svelte 5에서는 $props 사용

      // === 이름 처리 규칙은 Svelte 파일에서 비활성화 ===
      'no-restricted-syntax': 'off',
    },
  },

  // Allow console in scripts/migrations/tests; app code uses logger
  {
    files: ['scripts/**', 'migrations/**', 'tests/**'],
    rules: {
      'no-console': 'off',
    },
  },

  // Logger utility exception - allow console statements in logger.ts
  {
    files: ['src/lib/utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Node/CommonJS scripts and utility JS files
  {
    files: ['scripts/**/*.js', 'utils/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      'no-console': 'off',
    },
  },

  // Global ignores
  {
    ignores: [
      'build/**',
      '.svelte-kit/**',
      'dist/**',
      'node_modules/**',
      '*.config.js',
      '*.config.cjs',
    ],
  },

  // --- Delegate Svelte formatting to Prettier ---
  {
    files: ['**/*.svelte'],
    rules: {
      'svelte/indent': 'off',
      'svelte/max-attributes-per-line': 'off',
      'svelte/first-attribute-linebreak': 'off',
    },
  },
]
