import { writable } from 'svelte/store';

export interface BudgetCategory {
	id: string;
	name: string;
	amount: number;
	spent: number;
	period: 'monthly' | 'quarterly' | 'yearly';
	createdAt: string;
	updatedAt: string;
}

export interface BudgetGoal {
	id: string;
	name: string;
	targetAmount: number;
	currentAmount: number;
	deadline: string;
	status: 'active' | 'completed' | 'paused';
	createdAt: string;
	updatedAt: string;
}

// 초기 예산 데이터
const initialBudgetCategories: BudgetCategory[] = [
	{
		id: '1',
		name: '인건비',
		amount: 15000000,
		spent: 8000000,
		period: 'monthly',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-15T00:00:00Z'
	},
	{
		id: '2',
		name: '임대료',
		amount: 3000000,
		spent: 2000000,
		period: 'monthly',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-15T00:00:00Z'
	},
	{
		id: '3',
		name: '마케팅',
		amount: 5000000,
		spent: 1500000,
		period: 'monthly',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-15T00:00:00Z'
	}
];

const initialBudgetGoals: BudgetGoal[] = [
	{
		id: '1',
		name: '분기 매출 목표',
		targetAmount: 100000000,
		currentAmount: 27000000,
		deadline: '2024-03-31',
		status: 'active',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-15T00:00:00Z'
	},
	{
		id: '2',
		name: '비상금 적립',
		targetAmount: 50000000,
		currentAmount: 85000000,
		deadline: '2024-12-31',
		status: 'completed',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-15T00:00:00Z'
	}
];

// 스토어 생성
export const budgetCategories = writable<BudgetCategory[]>(initialBudgetCategories);
export const budgetGoals = writable<BudgetGoal[]>(initialBudgetGoals);

// 예산 카테고리 추가 함수
export function addBudgetCategory(category: Omit<BudgetCategory, 'id' | 'createdAt' | 'updatedAt'>) {
	const newCategory: BudgetCategory = {
		...category,
		id: `budget-category-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	
	budgetCategories.update(current => [...current, newCategory]);
}

// 예산 카테고리 수정 함수
export function updateBudgetCategory(updatedCategory: BudgetCategory) {
	budgetCategories.update(current => 
		current.map(category => 
			category.id === updatedCategory.id 
				? { ...updatedCategory, updatedAt: new Date().toISOString() }
				: category
		)
	);
}

// 예산 카테고리 삭제 함수
export function deleteBudgetCategory(categoryId: string) {
	budgetCategories.update(current => 
		current.filter(category => category.id !== categoryId)
	);
}

// 예산 목표 추가 함수
export function addBudgetGoal(goal: Omit<BudgetGoal, 'id' | 'createdAt' | 'updatedAt'>) {
	const newGoal: BudgetGoal = {
		...goal,
		id: `budget-goal-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	
	budgetGoals.update(current => [...current, newGoal]);
}

// 예산 목표 수정 함수
export function updateBudgetGoal(updatedGoal: BudgetGoal) {
	budgetGoals.update(current => 
		current.map(goal => 
			goal.id === updatedGoal.id 
				? { ...updatedGoal, updatedAt: new Date().toISOString() }
				: goal
		)
	);
}

// 예산 목표 삭제 함수
export function deleteBudgetGoal(goalId: string) {
	budgetGoals.update(current => 
		current.filter(goal => goal.id !== goalId)
	);
}

// 예산 사용률 계산 함수
export function calculateBudgetUsage(category: BudgetCategory): number {
	return (category.spent / category.amount) * 100;
}

// 예산 목표 진행률 계산 함수
export function calculateGoalProgress(goal: BudgetGoal): number {
	return (goal.currentAmount / goal.targetAmount) * 100;
}
