import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import sveltePlugin from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'

/** @type {import('eslint').Linter.Config[]} */
export default [
	// Base configuration
	js.configs.recommended,

	// TypeScript files
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module'
			},
			globals: {
				// Browser globals
				window: 'readonly',
				document: 'readonly',
				console: 'readonly',
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
				EventTarget: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			// === TypeScript Rules ===
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

			// === General Rules ===
			'no-console': 'warn',
			'no-debugger': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			'no-unused-vars': 'off', // Handled by TypeScript

			// === 이름 처리 강제 규칙 ===
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TemplateLiteral[expressions.length=2]',
					message:
						'이름 조합 시 formatEmployeeName 또는 formatKoreanNameStandard 함수를 사용하세요.'
				},
				{
					selector: 'BinaryExpression[operator="+"] > Literal[value=" "]',
					message: '이름 조합 시 공백을 직접 사용하지 마세요. 표준 함수를 사용하세요.'
				},
				// === 날짜 처리 강제 규칙 ===
				{
					selector:
						'CallExpression[callee.object.name="Date"][callee.property.name="toLocaleDateString"]',
					message: '날짜 표시 시 formatDateForDisplay 함수를 사용하세요.'
				},
				{
					selector:
						'CallExpression[callee.object.name="Date"][callee.property.name="toLocaleString"]',
					message: '날짜/시간 표시 시 formatDateForDisplay 함수를 사용하세요.'
				},
				{
					selector: 'CallExpression[callee.name="Date"]',
					message: '날짜 생성 시 toUTC 함수를 사용하여 표준화하세요.'
				},
				{
					selector: 'CallExpression[callee.property.name="toISOString"]',
					message: 'UTC 변환 시 toUTC 함수를 사용하세요.'
				}
			]
		}
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
					runes: true
				}
			},
			globals: {
				// Browser globals
				window: 'readonly',
				document: 'readonly',
				console: 'readonly',
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
				EventTarget: 'readonly'
			}
		},
		plugins: {
			svelte: sveltePlugin
		},
		rules: {
			// === Svelte Rules ===
			'svelte/valid-compile': 'error',
			'svelte/no-at-debug-tags': 'error',
			'svelte/no-at-html-tags': 'error',
			'svelte/no-dupe-else-if-blocks': 'error',
			'svelte/no-dupe-style-properties': 'error',
			'svelte/no-dynamic-slot-name': 'error',
			'svelte/no-not-function-handler': 'error',
			'svelte/no-object-in-text-mustaches': 'error',
			'svelte/no-reactive-functions': 'error',
			'svelte/no-reactive-literals': 'error',
			'svelte/no-shorthand-style-property-overrides': 'error',
			'svelte/no-unknown-style-directive-property': 'error',
			'svelte/no-useless-mustaches': 'error',
			'svelte/require-each-key': 'error',
			'svelte/require-stores-init': 'error',
			'svelte/require-store-callbacks-use-set-param': 'error',
			'svelte/block-lang': 'error',
			'svelte/button-has-type': 'error',
			'svelte/html-closing-bracket-spacing': 'error',
			'svelte/html-quotes': 'error',
			'svelte/html-self-closing': 'error',
			'svelte/indent': ['error', { indent: 2 }],
			'svelte/max-attributes-per-line': 'error',
			'svelte/mustache-spacing': 'error',
			'svelte/no-spaces-around-equal-signs-in-attribute': 'error',
			'svelte/no-trailing-spaces': 'error',
			'svelte/prefer-class-directive': 'error',
			'svelte/prefer-style-directive': 'error',
			'svelte/shorthand-attribute': 'error',
			'svelte/shorthand-directive': 'error',
			'svelte/spaced-html-comment': 'error',
			'svelte/derived-has-same-inputs-outputs': 'error',
			'svelte/first-attribute-linebreak': 'error',
			'svelte/no-export-load-in-svelte-module-in-kit-pages': 'error',
			'svelte/no-target-blank': 'error',
			'svelte/no-unused-class-name': 'error',
			'svelte/no-unused-svelte-ignore': 'error',
			'svelte/prefer-destructured-store-props': 'error',
			'svelte/require-event-dispatcher-types': 'error',
			'svelte/require-optimized-style-attribute': 'error',
			'svelte/valid-each-key': 'error',

			// === Svelte 5 호환성 규칙 ===
			'svelte/no-reactive-functions': 'off', // Svelte 5에서는 $derived 사용
			'svelte/no-reactive-literals': 'off', // Svelte 5에서는 $state 사용
			'svelte/require-stores-init': 'off', // Svelte 5에서는 $state 사용
			'svelte/require-store-callbacks-use-set-param': 'off', // Svelte 5에서는 $state 사용
			'svelte/prefer-destructured-store-props': 'off' // Svelte 5에서는 $props 사용
		}
	},

	// Global ignores
	{
		ignores: [
			'build/**',
			'.svelte-kit/**',
			'dist/**',
			'node_modules/**',
			'*.config.js',
			'*.config.cjs'
		]
	}
]
