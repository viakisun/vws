import { browser } from '$app/environment'
import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'

// User interface
export interface User {
  id: string
  email: string
  name: string
  department?: string
  position?: string
  role: string
  is_active: boolean
  last_login?: Date
  created_at: Date
  updated_at: Date
}

// Session interface
export interface Session {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Initial session state
const initialSession: Session = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true
}

// Create session store
export const session: Writable<Session> = writable(initialSession)

// Session management functions
export class SessionManager {
  private static instance: SessionManager
  private sessionStore = session

  private constructor() {
    // Initialize session from localStorage on client side
    if (browser) {
      this.initializeFromStorage()
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Initialize session from localStorage
  private initializeFromStorage(): void {
    try {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('user_data')

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser)
        this.sessionStore.update(session => ({
          ...session,
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false
        }))
      } else {
        this.sessionStore.update(session => ({
          ...session,
          isLoading: false
        }))
      }
    } catch (error) {
      console.error('Error initializing session from storage:', error)
      this.clearSession()
    }
  }

  // Set session data
  public setSession(user: User, token: string): void {
    this.sessionStore.update(session => ({
      ...session,
      user,
      token,
      isAuthenticated: true,
      isLoading: false
    }))

    // Store in localStorage on client side
    if (browser) {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
    }
  }

  // Clear session data
  public clearSession(): void {
    this.sessionStore.update(session => ({
      ...session,
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    }))

    // Remove from localStorage on client side
    if (browser) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    }
  }

  // Update user data
  public updateUser(user: Partial<User>): void {
    this.sessionStore.update(session => {
      if (session.user) {
        const updatedUser = { ...session.user, ...user }

        // Update localStorage on client side
        if (browser) {
          localStorage.setItem('user_data', JSON.stringify(updatedUser))
        }

        return {
          ...session,
          user: updatedUser
        }
      }
      return session
    })
  }

  // Get current session
  public getSession(): Session {
    let currentSession: Session
    this.sessionStore.subscribe(session => {
      currentSession = session
    })()
    return currentSession!
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.getSession().user
  }

  // Get auth token
  public getToken(): string | null {
    return this.getSession().token
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.getSession().isAuthenticated
  }

  // Check if user has specific role
  public hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  // Check if user has any of the specified roles
  public hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser()
    return user ? roles.includes(user.role) : false
  }

  // Check if user is admin
  public isAdmin(): boolean {
    return this.hasRole('ADMIN')
  }

  // Check if user is manager
  public isManager(): boolean {
    return this.hasRole('MANAGER')
  }

  // Check if user is employee
  public isEmployee(): boolean {
    return this.hasRole('EMPLOYEE')
  }

  // Check if user is viewer
  public isViewer(): boolean {
    return this.hasRole('VIEWER')
  }

  // Login function
  public async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        this.setSession(data.user, data.token)
        return { success: true }
      } else {
        return { success: false, message: data.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Network error' }
    }
  }

  // Logout function
  public async logout(): Promise<void> {
    try {
      // Call logout API if available
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        } as Record<string, string>
      })
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      this.clearSession()
    }
  }

  // Refresh token
  public async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        } as Record<string, string>
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.token) {
          this.sessionStore.update(session => ({
            ...session,
            token: data.token
          }))

          if (browser) {
            localStorage.setItem('auth_token', data.token)
          }
          return true
        }
      }
    } catch (error) {
      console.error('Token refresh error:', error)
    }

    // If refresh fails, clear session
    this.clearSession()
    return false
  }

  // Make authenticated API request
  public async apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    // Handle token expiration
    if (response.status === 401) {
      const refreshed = await this.refreshToken()
      if (refreshed) {
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${this.getToken()}`
        return fetch(url, {
          ...options,
          headers
        })
      } else {
        // Redirect to login if refresh fails
        if (browser) {
          window.location.href = '/login'
        }
      }
    }

    return response
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

// Helper functions for components
export function useSession() {
  return {
    subscribe: session.subscribe,
    login: sessionManager.login.bind(sessionManager),
    logout: sessionManager.logout.bind(sessionManager),
    isAuthenticated: sessionManager.isAuthenticated.bind(sessionManager),
    hasRole: sessionManager.hasRole.bind(sessionManager),
    hasAnyRole: sessionManager.hasAnyRole.bind(sessionManager),
    isAdmin: sessionManager.isAdmin.bind(sessionManager),
    isManager: sessionManager.isManager.bind(sessionManager),
    isEmployee: sessionManager.isEmployee.bind(sessionManager),
    isViewer: sessionManager.isViewer.bind(sessionManager),
    getCurrentUser: sessionManager.getCurrentUser.bind(sessionManager),
    apiRequest: sessionManager.apiRequest.bind(sessionManager)
  }
}

// Reactive stores for common checks
export const isAuthenticated = writable(false)
export const currentUser = writable<User | null>(null)
export const isAdmin = writable(false)
export const isManager = writable(false)

// Update reactive stores when session changes
session.subscribe(session => {
  isAuthenticated.set(session.isAuthenticated)
  currentUser.set(session.user)
  isAdmin.set(session.user?.role === 'ADMIN')
  isManager.set(session.user?.role === 'MANAGER')
})
