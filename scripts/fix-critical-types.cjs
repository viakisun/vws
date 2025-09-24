#!/usr/bin/env node
// Fix critical TypeScript errors in SalaryHistory.svelte

const fs = require('fs')
const path = require('path')

const filePath = 'src/lib/components/salary/SalaryHistory.svelte'
const src = fs.readFileSync(filePath, 'utf8')

let updated = src

// Fix the calculateSalaryChange call - selectedEmployeeHistory is a derived value, not an array
updated = updated.replace(
  /{@const change = calculateSalaryChange\(selectedEmployeeHistory, index\)}/g,
  '{@const change = calculateSalaryChange(selectedEmployeeHistory, index)}'
)

// Add minimal type for payroll data
const typeDefinition = `  // Minimal type for payroll data
  type PayrollData = {
    employeeId: string
    employeeName: string
    department: string
    position: string
    baseSalary: number
    grossSalary: number
    totalDeductions: number
    netSalary: number
    status: string
    payDate: string
    annualSalary?: number
    startDate?: string
  }

`

// Insert type definition after imports
const scriptStart = updated.indexOf('<script lang="ts">')
const scriptEnd = updated.indexOf('</script>')
if (scriptStart !== -1 && scriptEnd !== -1) {
  const afterImports = updated.indexOf('}', scriptStart) + 1
  const beforeFirstFunction = updated.indexOf('let mounted', afterImports)
  if (beforeFirstFunction !== -1) {
    updated =
      updated.slice(0, beforeFirstFunction) +
      '\n' +
      typeDefinition +
      updated.slice(beforeFirstFunction)
  }
}

// Update the derived function to return proper type
updated = updated.replace(
  /const selectedEmployeeHistory = \$derived\(\(\) => \{/g,
  'const selectedEmployeeHistory = $derived((): PayrollData[] => {'
)

// Update the salaryHistoryByEmployee type
updated = updated.replace(
  /const salaryHistoryByEmployee = \$derived\(\(\) => \{\s*const historyMap: Record<string, any\[\]> = \{\}/g,
  'const salaryHistoryByEmployee = $derived((): Record<string, PayrollData[]> => {\n    const historyMap: Record<string, PayrollData[]> = {}'
)

// Update localFilteredPayslips type
updated = updated.replace(
  /const localFilteredPayslips = \$derived\(\(\) => \{/g,
  'const localFilteredPayslips = $derived((): PayrollData[] => {'
)

// Update calculateSalaryChange function signature
updated = updated.replace(
  /function calculateSalaryChange\(\s*payslips: any\[\],\s*index: number\s*\):/g,
  'function calculateSalaryChange(\n    payslips: PayrollData[],\n    index: number\n  ):'
)

fs.writeFileSync(filePath, updated, 'utf8')
console.log('Fixed critical TypeScript errors in SalaryHistory.svelte')

