import { config } from '$lib/utils/config';

export interface ApiOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	headers?: Record<string, string>;
	body?: unknown;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
	const url = path.startsWith('http') ? path : `${config.apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
	const res = await fetch(url, {
		method: options.method ?? 'GET',
		headers: {
			'content-type': 'application/json',
			...(options.headers ?? {})
		},
		body: options.body ? JSON.stringify(options.body) : undefined
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`API ${res.status} ${res.statusText} ${text}`.trim());
	}
	return (await res.json()) as T;
}
