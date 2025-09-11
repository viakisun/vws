export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const fromEnv = (key: string, fallback = ''): string => {
	// SvelteKit private/public env separation not used here for brevity
	if (typeof process !== 'undefined' && process.env && key in process.env) return String(process.env[key]);
	return fallback;
};

export const config = {
	apiBaseUrl: fromEnv('API_BASE_URL', 'http://localhost:3000/api'),
	logLevel: (fromEnv('LOG_LEVEL', 'info') as LogLevel)
};
