import { writable } from 'svelte/store';

export interface BankAccount {
	id: string;
	name: string;
	balance: number;
	accountNumber: string;
	bankName?: string;
	accountType?: 'checking' | 'savings' | 'foreign';
}

export interface Transaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	type: 'income' | 'expense';
	category: string;
	accountId: string;
	reference?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ExpectedTransaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	type: 'income' | 'expense';
	category: string;
	status: 'pending' | 'confirmed' | 'cancelled';
	probability?: number; // 확률 (0-100)
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface FundsReport {
	id: string;
	date: string;
	bankAccounts: BankAccount[];
	transactions: Transaction[];
	expectedTransactions: ExpectedTransaction[];
	totalBalance: number;
	totalIncome: number;
	totalExpense: number;
	expectedIncome: number;
	expectedExpense: number;
	netIncome: number;
	expectedNetIncome: number;
	createdAt: string;
	updatedAt: string;
}

// 초기 데이터
const initialBankAccounts: BankAccount[] = [
	{ 
		id: '1', 
		name: '주거래계좌', 
		balance: 50000000, 
		accountNumber: '123-456-789',
		bankName: '국민은행',
		accountType: 'checking'
	},
	{ 
		id: '2', 
		name: '예금계좌', 
		balance: 30000000, 
		accountNumber: '987-654-321',
		bankName: '신한은행',
		accountType: 'savings'
	},
	{ 
		id: '3', 
		name: '외화계좌', 
		balance: 5000000, 
		accountNumber: '456-789-123',
		bankName: '하나은행',
		accountType: 'foreign'
	}
];

const initialTransactions: Transaction[] = [
	{ 
		id: '1', 
		date: '2024-01-15', 
		description: '프로젝트 A 수주금', 
		amount: 15000000, 
		type: 'income', 
		category: '프로젝트 수주', 
		accountId: '1',
		reference: 'INV-2024-001',
		createdAt: '2024-01-15T09:00:00Z',
		updatedAt: '2024-01-15T09:00:00Z'
	},
	{ 
		id: '2', 
		date: '2024-01-15', 
		description: '사무실 임대료', 
		amount: 2000000, 
		type: 'expense', 
		category: '임대료', 
		accountId: '1',
		reference: 'RENT-2024-01',
		createdAt: '2024-01-15T10:00:00Z',
		updatedAt: '2024-01-15T10:00:00Z'
	},
	{ 
		id: '3', 
		date: '2024-01-14', 
		description: '개발자 급여', 
		amount: 8000000, 
		type: 'expense', 
		category: '인건비', 
		accountId: '1',
		reference: 'PAY-2024-01',
		createdAt: '2024-01-14T18:00:00Z',
		updatedAt: '2024-01-14T18:00:00Z'
	},
	{ 
		id: '4', 
		date: '2024-01-14', 
		description: '프로젝트 B 완료금', 
		amount: 12000000, 
		type: 'income', 
		category: '프로젝트 완료', 
		accountId: '2',
		reference: 'INV-2024-002',
		createdAt: '2024-01-14T16:00:00Z',
		updatedAt: '2024-01-14T16:00:00Z'
	}
];

const initialExpectedTransactions: ExpectedTransaction[] = [
	{ 
		id: '1', 
		date: '2024-01-20', 
		description: '프로젝트 C 1차 수주금', 
		amount: 10000000, 
		type: 'income', 
		category: '프로젝트 수주', 
		status: 'pending',
		probability: 90,
		notes: '계약 진행 중',
		createdAt: '2024-01-15T11:00:00Z',
		updatedAt: '2024-01-15T11:00:00Z'
	},
	{ 
		id: '2', 
		date: '2024-01-25', 
		description: '사무용품 구매', 
		amount: 500000, 
		type: 'expense', 
		category: '사무용품', 
		status: 'pending',
		probability: 80,
		notes: '필요시 구매',
		createdAt: '2024-01-15T12:00:00Z',
		updatedAt: '2024-01-15T12:00:00Z'
	},
	{ 
		id: '3', 
		date: '2024-01-30', 
		description: '월 급여', 
		amount: 12000000, 
		type: 'expense', 
		category: '인건비', 
		status: 'pending',
		probability: 100,
		notes: '정기 급여',
		createdAt: '2024-01-15T13:00:00Z',
		updatedAt: '2024-01-15T13:00:00Z'
	}
];

// 스토어 생성
export const bankAccounts = writable<BankAccount[]>(initialBankAccounts);
export const transactions = writable<Transaction[]>(initialTransactions);
export const expectedTransactions = writable<ExpectedTransaction[]>(initialExpectedTransactions);

// 자금 일보 생성 함수
export function createFundsReport(): FundsReport {
	const now = new Date().toISOString();
	
	return {
		id: `funds-report-${Date.now()}`,
		date: new Date().toISOString().split('T')[0] || '',
		bankAccounts: initialBankAccounts,
		transactions: initialTransactions,
		expectedTransactions: initialExpectedTransactions,
		totalBalance: initialBankAccounts.reduce((sum, account) => sum + account.balance, 0),
		totalIncome: initialTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
		totalExpense: initialTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
		expectedIncome: initialExpectedTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
		expectedExpense: initialExpectedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
		netIncome: 0, // 계산됨
		expectedNetIncome: 0, // 계산됨
		createdAt: now,
		updatedAt: now
	};
}

// 거래 추가 함수
export function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
	const newTransaction: Transaction = {
		...transaction,
		id: `transaction-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	
	transactions.update(current => [...current, newTransaction]);
}

// 거래 수정 함수
export function updateTransaction(updatedTransaction: Transaction) {
	transactions.update(current => 
		current.map(transaction => 
			transaction.id === updatedTransaction.id 
				? { ...updatedTransaction, updatedAt: new Date().toISOString() }
				: transaction
		)
	);
}

// 거래 삭제 함수
export function deleteTransaction(transactionId: string) {
	transactions.update(current => 
		current.filter(transaction => transaction.id !== transactionId)
	);
}

// 예상 거래 추가 함수
export function addExpectedTransaction(transaction: Omit<ExpectedTransaction, 'id' | 'createdAt' | 'updatedAt'>) {
	const newTransaction: ExpectedTransaction = {
		...transaction,
		id: `expected-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	
	expectedTransactions.update(current => [...current, newTransaction]);
}

// 통장 계좌 추가 함수
export function addBankAccount(account: Omit<BankAccount, 'id'>) {
	const newAccount: BankAccount = {
		...account,
		id: `account-${Date.now()}`
	};
	
	bankAccounts.update(current => [...current, newAccount]);
}

// 통장 계좌 수정 함수
export function updateBankAccount(updatedAccount: BankAccount) {
	bankAccounts.update(current => 
		current.map(account => 
			account.id === updatedAccount.id 
				? { ...updatedAccount, updatedAt: new Date().toISOString() }
				: account
		)
	);
}

// 통장 계좌 삭제 함수
export function deleteBankAccount(accountId: string) {
	bankAccounts.update(current => 
		current.filter(account => account.id !== accountId)
	);
}

// 통장 잔고 업데이트 함수
export function updateBankAccountBalance(accountId: string, newBalance: number) {
	bankAccounts.update(accounts => 
		accounts.map(account => 
			account.id === accountId 
				? { ...account, balance: newBalance, updatedAt: new Date().toISOString() }
				: account
		)
	);
}

// AI 분석을 위한 데이터 내보내기 함수
export function exportForAIAnalysis(): {
	bankAccounts: BankAccount[];
	transactions: Transaction[];
	expectedTransactions: ExpectedTransaction[];
	summary: {
		totalBalance: number;
		totalIncome: number;
		totalExpense: number;
		expectedIncome: number;
		expectedExpense: number;
		netIncome: number;
		expectedNetIncome: number;
	};
} {
	let currentBankAccounts: BankAccount[] = [];
	let currentTransactions: Transaction[] = [];
	let currentExpectedTransactions: ExpectedTransaction[] = [];
	
	bankAccounts.subscribe(value => currentBankAccounts = value)();
	transactions.subscribe(value => currentTransactions = value)();
	expectedTransactions.subscribe(value => currentExpectedTransactions = value)();
	
	const totalBalance = currentBankAccounts.reduce((sum, account) => sum + account.balance, 0);
	const totalIncome = currentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
	const totalExpense = currentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
	const expectedIncome = currentExpectedTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
	const expectedExpense = currentExpectedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
	
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
			expectedNetIncome: expectedIncome - expectedExpense
		}
	};
}
