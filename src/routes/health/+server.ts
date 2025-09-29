import { json } from '@sveltejs/kit'

export const GET = () => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.2.0',
    environment: process.env.NODE_ENV || 'development',
  }

  return json(healthInfo)
}
