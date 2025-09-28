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

// Svelte 5 runes
declare global {
  function $props<T = Record<string, any>>(): T
  function $state<T>(initial: T): T
  function $derived<T>(fn: () => T): T
  function $effect(fn: () => void | (() => void)): void
}

// svelteHTML namespace
declare global {
  namespace svelteHTML {
    interface HTMLAttributes<_T = any> {
      [key: string]: any
      align?: string
    }

    interface IntrinsicElements {
      [elemName: string]: any
    }

    interface ElementTagNameMap {
      [key: string]: HTMLElement
    }

    // HTMLDivElement specific attributes
    interface HTMLDivElementAttributes extends HTMLAttributes<HTMLDivElement> {
      align?: string
    }
  }
}

export {}
