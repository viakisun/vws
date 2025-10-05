export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const fromEnv = (key: string, fallback = ''): string => {
  // SvelteKit private/public env separation not used here for brevity
  if (typeof process !== 'undefined' && process.env && key in process.env)
    return String(process.env[key])
  return fallback
}

export const config = {
  apiBaseUrl: fromEnv('API_BASE_URL', 'http://localhost:3000/api'),
  logLevel: fromEnv('LOG_LEVEL', 'info') as LogLevel,
  database: {
    host: fromEnv('AWS_DB_HOST', 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com'),
    port: parseInt(fromEnv('AWS_DB_PORT', '5432')),
    database: fromEnv('AWS_DB_NAME', 'postgres'),
    user: fromEnv('AWS_DB_USER', 'postgres'),
    password: fromEnv('AWS_DB_PASSWORD', 'viahubdev'),
  },
  jwt: {
    secret: fromEnv('JWT_SECRET', 'your-secret-key'),
    expiresIn: fromEnv('JWT_EXPIRES_IN', '24h'),
  },
  google: {
    clientId: fromEnv('GOOGLE_CLIENT_ID', ''),
    clientSecret: fromEnv('GOOGLE_CLIENT_SECRET', ''),
    redirectUri: fromEnv('GOOGLE_REDIRECT_URI', 'http://localhost:5173/api/auth/callback/google'),
  },
  auth: {
    allowedDomains: fromEnv('ALLOWED_DOMAINS', 'viasofts.com').split(','),
    adminEmails: fromEnv('ADMIN_EMAILS', 'kisun@viasofts.com').split(','),
  },
}
