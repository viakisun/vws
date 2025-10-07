/**
 * Sales Store - 영업관리 상태 관리
 *
 * Responsibilities:
 * - 거래처, 영업기회, 계약, 거래내역 상태 관리
 * - 모달 상태 관리
 * - 폼 데이터 관리
 */

import type { Contract, Customer, Opportunity, Transaction } from '$lib/sales/types'

// ============================================================================
// Types
// ============================================================================

export interface SalesData {
  customers: Customer[]
  opportunities: Opportunity[]
  contracts: Contract[]
  transactions: Transaction[]
}

export interface ModalStates {
  showCustomerModal: boolean
  showOpportunityModal: boolean
  showContractModal: boolean
  showCreateModal: boolean
  showEditModal: boolean
  showDeleteConfirm: boolean
}

export interface SelectedItems {
  customer: Customer | null
  opportunity: Opportunity | null
  contract: Contract | null
  editingCustomer: Customer | null
  customerToDelete: Customer | null
}

export type CreateModalType = 'customer' | 'opportunity' | 'contract' | 'transaction'

export interface CustomerFormData {
  name: string
  business_number: string
  type: 'customer' | 'supplier' | 'both'
  contact_person: string
  contact_phone: string
  contact_email: string
  industry: string
  payment_terms: number
}

export interface OpportunityFormData {
  title: string
  customer_id: string
  type: 'sales' | 'purchase'
  expected_amount: number
  probability: number
  stage: string
  expected_close_date: string
}

export interface ContractFormData {
  title: string
  customer_id: string
  type: 'sales' | 'purchase'
  amount: number
  start_date: string
  end_date: string
}

export interface TransactionFormData {
  description: string
  customer_id: string
  type: 'sales' | 'purchase'
  amount: number
  transaction_date: string
  due_date: string
  payment_status: string
}

// ============================================================================
// Store State
// ============================================================================

class SalesStore {
  // Data
  data = $state<SalesData>({
    customers: [],
    opportunities: [],
    contracts: [],
    transactions: [],
  })

  // Modals
  modals = $state<ModalStates>({
    showCustomerModal: false,
    showOpportunityModal: false,
    showContractModal: false,
    showCreateModal: false,
    showEditModal: false,
    showDeleteConfirm: false,
  })

  // Selected Items
  selected = $state<SelectedItems>({
    customer: null,
    opportunity: null,
    contract: null,
    editingCustomer: null,
    customerToDelete: null,
  })

  // Create Modal Type
  createModalType = $state<CreateModalType>('customer')

  // Forms
  forms = $state({
    customer: {
      name: '',
      business_number: '',
      type: 'customer' as 'customer' | 'supplier' | 'both',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      industry: '',
      payment_terms: 30,
    },
    opportunity: {
      title: '',
      customer_id: '',
      type: 'sales' as const,
      expected_amount: 0,
      probability: 0,
      stage: 'prospecting',
      expected_close_date: '',
    },
    contract: {
      title: '',
      customer_id: '',
      type: 'sales' as const,
      amount: 0,
      start_date: '',
      end_date: '',
    },
    transaction: {
      description: '',
      customer_id: '',
      type: 'sales' as const,
      amount: 0,
      transaction_date: '',
      due_date: '',
      payment_status: 'pending',
    },
  })

  // Filters
  filters = $state({
    searchTerm: '',
    selectedType: 'all',
  })

  // ============================================================================
  // Modal Actions
  // ============================================================================

  openModal(type: keyof ModalStates) {
    this.modals[type] = true
  }

  closeModal(type: keyof ModalStates) {
    this.modals[type] = false
  }

  openCustomerModal(customer: Customer) {
    this.selected.customer = customer
    this.modals.showCustomerModal = true
  }

  closeCustomerModal() {
    this.modals.showCustomerModal = false
    this.selected.customer = null
  }

  openOpportunityModal(opportunity: Opportunity) {
    this.selected.opportunity = opportunity
    this.modals.showOpportunityModal = true
  }

  closeOpportunityModal() {
    this.modals.showOpportunityModal = false
    this.selected.opportunity = null
  }

  openContractModal(contract: Contract) {
    this.selected.contract = contract
    this.modals.showContractModal = true
  }

  closeContractModal() {
    this.modals.showContractModal = false
    this.selected.contract = null
  }

  openCreateModal(type: CreateModalType) {
    this.createModalType = type
    this.modals.showCreateModal = true
  }

  closeCreateModal() {
    this.modals.showCreateModal = false
    this.resetAllForms()
  }

  openEditModal(customer: Customer) {
    this.selected.editingCustomer = customer
    this.forms.customer = {
      name: customer.name,
      business_number: customer.business_number,
      type: customer.type,
      contact_person: customer.contact_person || '',
      contact_phone: customer.contact_phone || '',
      contact_email: customer.contact_email || '',
      industry: customer.industry || '',
      payment_terms: customer.payment_terms || 30,
    }
    this.modals.showEditModal = true
  }

  closeEditModal() {
    this.modals.showEditModal = false
    this.selected.editingCustomer = null
    this.resetCustomerForm()
  }

  openDeleteConfirm(customer: Customer) {
    this.selected.customerToDelete = customer
    this.modals.showDeleteConfirm = true
  }

  closeDeleteConfirm() {
    this.modals.showDeleteConfirm = false
    this.selected.customerToDelete = null
  }

  // ============================================================================
  // Form Actions
  // ============================================================================

  resetCustomerForm() {
    this.forms.customer = {
      name: '',
      business_number: '',
      type: 'customer',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      industry: '',
      payment_terms: 30,
    }
  }

  resetOpportunityForm() {
    this.forms.opportunity = {
      title: '',
      customer_id: '',
      type: 'sales',
      expected_amount: 0,
      probability: 0,
      stage: 'prospecting',
      expected_close_date: '',
    }
  }

  resetContractForm() {
    this.forms.contract = {
      title: '',
      customer_id: '',
      type: 'sales',
      amount: 0,
      start_date: '',
      end_date: '',
    }
  }

  resetTransactionForm() {
    this.forms.transaction = {
      description: '',
      customer_id: '',
      type: 'sales',
      amount: 0,
      transaction_date: '',
      due_date: '',
      payment_status: 'pending',
    }
  }

  resetAllForms() {
    this.resetCustomerForm()
    this.resetOpportunityForm()
    this.resetContractForm()
    this.resetTransactionForm()
  }

  // ============================================================================
  // Data Actions
  // ============================================================================

  setCustomers(customers: Customer[]) {
    this.data.customers = customers
  }

  setOpportunities(opportunities: Opportunity[]) {
    this.data.opportunities = opportunities
  }

  setContracts(contracts: Contract[]) {
    this.data.contracts = contracts
  }

  setTransactions(transactions: Transaction[]) {
    this.data.transactions = transactions
  }

  deleteCustomer(customerId: string) {
    this.data.customers = this.data.customers.filter((c) => c.id !== customerId)
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const salesStore = new SalesStore()
