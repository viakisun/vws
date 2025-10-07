import { writable } from 'svelte/store'

export interface BankAccount {
  id: string
  name: string
  balance: number
  accountNumber: string
  bankName?: string
  accountType?: 'checking' | 'savings' | 'foreign'
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  accountId: string
  reference?: string
  createdAt: string
  updatedAt: string
}

export interface ExpectedTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  status: 'pending' | 'confirmed' | 'cancelled'
  probability?: number // 확률 (0-100)
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface FundsReport {
  id: string
  date: string
  bankAccounts: BankAccount[]
  transactions: Transaction[]
  expectedTransactions: ExpectedTransaction[]
  totalBalance: number
  totalIncome: number
  totalExpense: number
  expectedIncome: number
  expectedExpense: number
  netIncome: number
  expectedNetIncome: number
  createdAt: string
  updatedAt: string
}

// 초기 데이터 (빈 배열)
const initialBankAccounts: BankAccount[] = []

const initialTransactions: Transaction[] = []

const initialExpectedTransactions: ExpectedTransaction[] = []

// 스토어 생성
export const bankAccounts = writable<BankAccount[]>(initialBankAccounts)
export const transactions = writable<Transaction[]>(initialTransactions)
export const expectedTransactions = writable<ExpectedTransaction[]>(initialExpectedTransactions)

// 자금 일보 생성 함수
export function createFundsReport(): FundsReport {
  const now = new Date().toISOString()

  return {
    id: `funds-report-${Date.now()}`,
    date: new Date().toISOString().split('T')[0] || '',
    bankAccounts: initialBankAccounts,
    transactions: initialTransactions,
    expectedTransactions: initialExpectedTransactions,
    totalBalance: initialBankAccounts.reduce((sum, account) => sum + account.balance, 0),
    totalIncome: initialTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: initialTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    expectedIncome: initialExpectedTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    expectedExpense: initialExpectedTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    netIncome: 0, // 계산됨
    expectedNetIncome: 0, // 계산됨
    createdAt: now,
    updatedAt: now,
  }
}

// 거래 추가 함수
export function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
  const newTransaction: Transaction = {
    ...transaction,
    id: `transaction-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  transactions.update((current) => [...current, newTransaction])
}

// 거래 수정 함수
export function updateTransaction(updatedTransaction: Transaction) {
  transactions.update((current) =>
    current.map((transaction) =>
      transaction.id === updatedTransaction.id
        ? { ...updatedTransaction, updatedAt: new Date().toISOString() }
        : transaction,
    ),
  )
}

// 거래 삭제 함수
export function deleteTransaction(transactionId: string) {
  transactions.update((current) =>
    current.filter((transaction) => transaction.id !== transactionId),
  )
}

// 예상 거래 추가 함수
export function addExpectedTransaction(
  transaction: Omit<ExpectedTransaction, 'id' | 'createdAt' | 'updatedAt'>,
) {
  const newTransaction: ExpectedTransaction = {
    ...transaction,
    id: `expected-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  expectedTransactions.update((current) => [...current, newTransaction])
}

// 통장 계좌 추가 함수
export function addBankAccount(account: Omit<BankAccount, 'id'>) {
  const newAccount: BankAccount = {
    ...account,
    id: `account-${Date.now()}`,
  }

  bankAccounts.update((current) => [...current, newAccount])
}

// 통장 계좌 수정 함수
export function updateBankAccount(updatedAccount: BankAccount) {
  bankAccounts.update((current) =>
    current.map((account) =>
      account.id === updatedAccount.id
        ? { ...updatedAccount, updatedAt: new Date().toISOString() }
        : account,
    ),
  )
}

// 통장 계좌 삭제 함수
export function deleteBankAccount(accountId: string) {
  bankAccounts.update((current) => current.filter((account) => account.id !== accountId))
}

// 통장 잔고 업데이트 함수
export function updateBankAccountBalance(accountId: string, newBalance: number) {
  bankAccounts.update((accounts) =>
    accounts.map((account) =>
      account.id === accountId
        ? {
            ...account,
            balance: newBalance,
            updatedAt: new Date().toISOString(),
          }
        : account,
    ),
  )
}

// AI 분석을 위한 데이터 내보내기 함수
export function exportForAIAnalysis(): {
  bankAccounts: BankAccount[]
  transactions: Transaction[]
  expectedTransactions: ExpectedTransaction[]
  summary: {
    totalBalance: number
    totalIncome: number
    totalExpense: number
    expectedIncome: number
    expectedExpense: number
    netIncome: number
    expectedNetIncome: number
  }
} {
  let currentBankAccounts: BankAccount[] = []
  let currentTransactions: Transaction[] = []
  let currentExpectedTransactions: ExpectedTransaction[] = []

  bankAccounts.subscribe((value) => (currentBankAccounts = value))()
  transactions.subscribe((value) => (currentTransactions = value))()
  expectedTransactions.subscribe((value) => (currentExpectedTransactions = value))()

  const totalBalance = currentBankAccounts.reduce((sum, account) => sum + account.balance, 0)
  const totalIncome = currentTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = currentTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const expectedIncome = currentExpectedTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expectedExpense = currentExpectedTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    bankAccounts: currentBankAccounts,
    transactions: currentTransactions,
    expectedTransactions: currentExpectedTransactions,
    summary: {
      totalBalance,
      totalIncome,
      totalExpense,
      expectedIncome,
      expectedExpense,
      netIncome: totalIncome - totalExpense,
      expectedNetIncome: expectedIncome - expectedExpense,
    },
  }
}
