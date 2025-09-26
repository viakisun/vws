// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user?: {
        id: string
        email: string
        name: string
        role: string
        department?: string
        position?: string
      }
      validatedBody?: unknown
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
