import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import sveltePlugin from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import unusedImports from 'eslint-plugin-unused-imports'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

// ============================================================================
// 공통 설정
// ============================================================================

// 브라우저 & Node.js 전역 변수
const COMMON_GLOBALS = {
  // Browser
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
  requestAnimationFrame: 'readonly',

  // Node.js
  process: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  global: 'readonly',

  // SvelteKit
  Response: 'readonly',
  Request: 'readonly',
  Headers: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  FormData: 'readonly',
  File: 'readonly',
  Blob: 'readonly',
  locals: 'readonly',

  // DOM Elements
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

  // SVG
  SVGSVGElement: 'readonly',
  SVGGElement: 'readonly',
  SVGPathElement: 'readonly',
  SVGElement: 'readonly',
}

// TypeScript 파서 옵션
const TS_PARSER_OPTIONS = {
  ecmaVersion: 2022,
  sourceType: 'module',
  project: './tsconfig.json',
  tsconfigRootDir: import.meta.dirname,
}

// ============================================================================
// 규칙 세트
// ============================================================================

// 기본 JavaScript 규칙
const BASE_RULES = {
  'no-undef': 'off', // TypeScript가 처리
  'no-unused-vars': 'off', // TypeScript가 처리
  'no-console': 'off', // console 사용 허용
  'no-debugger': 'warn', // debugger는 경고만
  'no-var': 'error', // var 사용 금지
  'prefer-const': 'warn', // const 사용 권장
}

// Prettier 관련 규칙
const PRETTIER_RULES = {
  'prettier/prettier': 'warn', // 포맷팅 규칙 (경고)
  indent: 'off',
  quotes: 'off',
  semi: 'off',
  'comma-dangle': 'off',
  'max-len': 'off',
}

// TypeScript 기본 규칙 (완화된 설정)
const TYPESCRIPT_RULES = {
  // 타입 체킹 (모두 비활성화)
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/restrict-template-expressions': 'off',
  '@typescript-eslint/restrict-plus-operands': 'off',

  // Promise 관련 (모두 비활성화)
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/await-thenable': 'off',
  '@typescript-eslint/no-misused-promises': 'off',
  '@typescript-eslint/require-await': 'off',

  // 기타 최적화 규칙 (비활성화)
  '@typescript-eslint/no-unnecessary-type-assertion': 'off',
  '@typescript-eslint/prefer-nullish-coalescing': 'off',
  '@typescript-eslint/prefer-optional-chain': 'off',

  // 사용하지 않는 변수 (경고)
  '@typescript-eslint/no-unused-vars': [
    'warn',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    },
  ],
}

// Svelte 규칙
const SVELTE_RULES = {
  // Svelte 5 호환성
  'svelte/valid-compile': 'off',
  'svelte/no-reactive-functions': 'off',
  'svelte/no-reactive-literals': 'off',
  'svelte/require-stores-init': 'off',
  'svelte/require-store-callbacks-use-set-param': 'off',
  'svelte/prefer-destructured-store-props': 'off',

  // 에러 방지
  'svelte/no-at-debug-tags': 'warn',
  'svelte/no-at-html-tags': 'off',
  'svelte/no-not-function-handler': 'error',
  'svelte/no-object-in-text-mustaches': 'error',
  'svelte/no-unknown-style-directive-property': 'error',
  'svelte/require-each-key': 'off',

  // 스타일 규칙 (Prettier에 위임)
  'svelte/indent': 'off',
  'svelte/max-attributes-per-line': 'off',
  'svelte/first-attribute-linebreak': 'off',
  'svelte/html-closing-bracket-spacing': 'off',
  'svelte/html-quotes': 'off',
  'svelte/mustache-spacing': 'off',

  // 기타
  'svelte/button-has-type': 'warn',
  'svelte/no-unused-class-name': 'off',
  'svelte/no-target-blank': 'warn',
}

// ============================================================================
// ESLint 설정
// ============================================================================

/** @type {import('eslint').Linter.Config[]} */
export default [
  // ========================================
  // 1. 기본 설정
  // ========================================
  js.configs.recommended,
  prettierConfig, // Prettier 충돌 방지

  // Prettier 플러그인 등록
  {
    plugins: {
      prettier: prettierPlugin,
    },
  },

  // ========================================
  // 2. 전역 규칙 (모든 파일)
  // ========================================
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.svelte', '**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: {
      ...BASE_RULES,
      ...PRETTIER_RULES,
    },
  },

  // ========================================
  // 3. TypeScript 파일
  // ========================================
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: TS_PARSER_OPTIONS,
      globals: COMMON_GLOBALS,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      ...TYPESCRIPT_RULES,
      'unused-imports/no-unused-imports': 'warn',
    },
  },

  // ========================================
  // 4. API 라우트 & 서버 파일
  // ========================================
  {
    files: ['**/*.server.ts', '**/api/**/*.ts', '**/server/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: TS_PARSER_OPTIONS,
      globals: COMMON_GLOBALS,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      ...TYPESCRIPT_RULES,
      'unused-imports/no-unused-imports': 'warn',
    },
  },

  // ========================================
  // 5. Svelte 파일
  // ========================================
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        svelteFeatures: {
          runes: true, // Svelte 5 지원
        },
      },
      globals: COMMON_GLOBALS,
    },
    plugins: {
      svelte: sveltePlugin,
      '@typescript-eslint': tsPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      ...SVELTE_RULES,
      'unused-imports/no-unused-imports': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Svelte에서는 타입 체킹 비활성화
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // ========================================
  // 6. 특정 디렉토리 예외 규칙
  // ========================================

  // 스크립트, 마이그레이션, 테스트는 console 허용
  {
    files: ['scripts/**', 'migrations/**', 'tests/**'],
    rules: {
      'no-console': 'off',
    },
  },

  // Logger 유틸리티는 console 허용
  {
    files: ['src/lib/utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Node.js 스크립트
  {
    files: ['scripts/**/*.js', 'scripts/**/*.cjs', 'utils/**/*.js'],
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

  // ========================================
  // 7. 제외할 파일/디렉토리
  // ========================================
  {
    ignores: [
      // 빌드 결과물
      'build/**',
      '.svelte-kit/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      '.nyc_output/**',

      // 설정 파일
      '*.config.js',
      '*.config.cjs',

      // 리포트 & 로그
      '.reports/**',
      'eslint.*.json',

      // Lock 파일
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',

      // CI/CD
      '.github/workflows/**',
    ],
  },
]
