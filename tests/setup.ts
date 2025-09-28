import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock Svelte stores
vi.mock('svelte/store', async () => {
  const actual = await vi.importActual('svelte/store')
  return {
    ...actual,
    writable: vi.fn(() => ({
      subscribe: vi.fn(() => vi.fn()),
      set: vi.fn(),
      update: vi.fn(),
    })),
    readable: vi.fn(() => ({
      subscribe: vi.fn(() => vi.fn()),
    })),
    derived: vi.fn(() => ({
      subscribe: vi.fn(() => vi.fn()),
    })),
  }
})

// Mock SvelteKit modules
vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(() => vi.fn()),
  },
  navigating: {
    subscribe: vi.fn(() => vi.fn()),
  },
  updated: {
    subscribe: vi.fn(() => vi.fn()),
  },
}))

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  preloadData: vi.fn(),
  preloadCode: vi.fn(),
  beforeNavigate: vi.fn(),
  afterNavigate: vi.fn(),
}))

// Mock environment variables
vi.mock('$env/static/public', () => ({
  PUBLIC_API_URL: 'http://localhost:3000',
}))

// Global test setup
beforeEach(() => {
  vi.clearAllMocks()
})
