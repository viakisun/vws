import type { User } from '$lib/auth/user-service'

declare global {
  namespace App {
    interface Locals {
      user: User | null
    }
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
