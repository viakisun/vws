import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	// Svelte 5 호환성 설정
	compilerOptions: {
		runes: true, // Svelte 5 runes 활성화
		enableSourcemap: true
	},

	kit: {
		adapter: adapter({ out: 'build' })
	}
};

export default config;
