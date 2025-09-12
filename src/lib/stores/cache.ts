import { writable, get } from 'svelte/store';

export interface CacheEntry<T = unknown> {
	value: T;
	expiresAt: number; // epoch ms
}

// key -> entry
export const cacheStore = writable<Record<string, CacheEntry>>({});

export function setCached<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
	const expiresAt = Date.now() + Math.max(0, ttlMs);
	cacheStore.update((m) => ({ ...m, [key]: { value, expiresAt } }));
}

export function getCached<T>(key: string): T | undefined {
	const m = get(cacheStore);
	const e = m[key];
	if (!e) return undefined;
	if (Date.now() > e.expiresAt) {
		// expire lazily
		cacheStore.update((mm) => {
			const { [key]: _, ...rest } = mm;
			return rest;
		});
		return undefined;
	}
	return e.value as T;
}

export function clearCache(key?: string) {
	if (!key) {
		cacheStore.set({});
		return;
	}
	cacheStore.update((m) => {
		const { [key]: _, ...rest } = m;
		return rest;
	});
}
