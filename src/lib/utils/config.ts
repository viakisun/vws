export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const fromEnv = (key: string, fallback = ''): string => {
	// SvelteKit private/public env separation not used here for brevity
	if (typeof process !== 'undefined' && process.env && key in process.env) return String(process.env[key]);
	return fallback;
};

export const config = {
	apiBaseUrl: fromEnv('API_BASE_URL', 'http://localhost:3000/api'),
	logLevel: (fromEnv('LOG_LEVEL', 'info') as LogLevel),
	database: {
		host: fromEnv('DB_HOST', 'localhost'),
		port: parseInt(fromEnv('DB_PORT', '5432')),
		database: fromEnv('DB_NAME', 'workstream'),
		user: fromEnv('DB_USER', 'postgres'),
		password: fromEnv('DB_PASSWORD', 'password')
	},
	jwt: {
		secret: fromEnv('JWT_SECRET', 'your-secret-key'),
		expiresIn: fromEnv('JWT_EXPIRES_IN', '24h')
	}
};
