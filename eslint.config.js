import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

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
			'no-unused-vars': 'off' // Handled by TypeScript
		}
	},

	// Svelte files
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
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
			// 'svelte/no-dupe-use-elements': 'error', // Rule not found
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
			// 'svelte/require-store-reactive-return': 'error', // Rule not found
			// 'svelte/require-store-rest-parameters': 'error', // Rule not found
			'svelte/require-stores-leading-store': 'error',
			'svelte/block-lang': 'error',
			'svelte/button-has-type': 'error',
			'svelte/html-closing-bracket-spacing': 'error',
			'svelte/html-quotes': 'error',
			'svelte/html-self-closing': 'error',
			'svelte/indent': 'error',
			'svelte/max-attributes-per-line': 'error',
			'svelte/mustache-spacing': 'error',
			'svelte/no-extra-reactive-curlies-in-string': 'error',
			'svelte/no-spaces-around-equal-signs-in-attribute': 'error',
			'svelte/no-trailing-spaces': 'error',
			'svelte/prefer-class-directive': 'error',
			'svelte/prefer-style-directive': 'error',
			'svelte/shorthand-attribute': 'error',
			'svelte/shorthand-directive': 'error',
			'svelte/spaced-html-comment': 'error',
			'svelte/derived-has-same-inputs-outputs': 'error',
			'svelte/first-attribute-linebreak': 'error',
			'svelte/html-content-first-newline': 'error',
			'svelte/label-has-associated-control': 'error',
			'svelte/no-conflict-variable-names': 'error',
			'svelte/no-export-load-in-svelte-module-in-kit-pages': 'error',
			'svelte/no-proxy-in-rest-props': 'error',
			'svelte/no-reactive-class': 'error',
			'svelte/no-reactive-label': 'error',
			'svelte/no-reactive-textarea': 'error',
			'svelte/no-target-blank': 'error',
			'svelte/no-unused-class-name': 'error',
			'svelte/no-unused-svelte-ignore': 'error',
			'svelte/no-useless-fragment': 'error',
			'svelte/prefer-destructured-store-props': 'error',
			'svelte/require-event-dispatcher-types': 'error',
			'svelte/require-optimized-style-attribute': 'error',
			'svelte/valid-each-key': 'error'
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
];