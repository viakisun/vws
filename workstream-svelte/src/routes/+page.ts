import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const res = await fetch('/health');
		return { health: res.ok ? '정상' as const : '오프라인' as const };
	} catch {
		return { health: '오프라인' as const };
	}
};
