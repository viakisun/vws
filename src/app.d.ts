import type { User } from '$lib/auth/user-service'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  department: string
  position: string
  hire_date: string
  status: string
  employment_type: string
  phone: string
  birth_date: string
}

interface UserWithEmployee extends User {
  employee?: Employee
}

declare global {
  namespace App {
    interface Locals {
      user: UserWithEmployee | null
    }
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
