/**
 * useSalesManagement Hook
 *
 * 영업관리 비즈니스 로직을 캡슐화한 Hook
 */

import { salesStore } from '../stores/sales-store.svelte'
import * as salesService from '../services/sales-service'
import type { Customer } from '../types'

export function useSalesManagement() {
  const store = salesStore

  // ============================================================================
  // Data Loading
  // ============================================================================

  async function loadAllData() {
    const data = await salesService.loadAllSalesData()
    store.setCustomers(data.customers)
    store.setOpportunities(data.opportunities)
    store.setContracts(data.contracts)
    store.setTransactions(data.transactions)
  }

  // ============================================================================
  // Customer Actions
  // ============================================================================

  async function createCustomer() {
    const result = await salesService.createCustomer(store.forms.customer)

    if (result.success) {
      await salesService.loadCustomers().then((res) => {
        if (res.success && res.data) store.setCustomers(res.data)
      })
      store.closeCreateModal()
      alert('거래처가 성공적으로 생성되었습니다.')
    } else {
      alert(result.error || '거래처 저장에 실패했습니다.')
    }
  }

  async function updateCustomer() {
    if (!store.selected.editingCustomer) return

    const result = await salesService.updateCustomer(
      store.selected.editingCustomer.id,
      store.forms.customer,
    )

    if (result.success) {
      await salesService.loadCustomers().then((res) => {
        if (res.success && res.data) store.setCustomers(res.data)
      })
      store.closeEditModal()
      alert('거래처가 성공적으로 수정되었습니다.')
    } else {
      alert(result.error || '거래처 수정에 실패했습니다.')
    }
  }

  async function deleteCustomer() {
    if (!store.selected.customerToDelete) return

    const result = await salesService.deleteCustomer(store.selected.customerToDelete.id)

    if (result.success) {
      store.deleteCustomer(store.selected.customerToDelete.id)
      store.closeDeleteConfirm()
      alert('거래처가 삭제되었습니다.')
    } else {
      alert(result.error || '거래처 삭제에 실패했습니다.')
    }
  }

  // ============================================================================
  // Opportunity Actions
  // ============================================================================

  async function createOpportunity() {
    const result = await salesService.createOpportunity(store.forms.opportunity)

    if (result.success) {
      await salesService.loadOpportunities().then((res) => {
        if (res.success && res.data) store.setOpportunities(res.data)
      })
      store.closeCreateModal()
      alert('영업기회가 성공적으로 생성되었습니다.')
    } else {
      alert(result.error || '영업기회 저장에 실패했습니다.')
    }
  }

  // ============================================================================
  // Contract Actions
  // ============================================================================

  async function createContract() {
    const result = await salesService.createContract(store.forms.contract)

    if (result.success) {
      await salesService.loadContracts().then((res) => {
        if (res.success && res.data) store.setContracts(res.data)
      })
      store.closeCreateModal()
      alert('계약이 성공적으로 생성되었습니다.')
    } else {
      alert(result.error || '계약 저장에 실패했습니다.')
    }
  }

  // ============================================================================
  // Transaction Actions
  // ============================================================================

  async function createTransaction() {
    const result = await salesService.createTransaction(store.forms.transaction)

    if (result.success) {
      await salesService.loadTransactions().then((res) => {
        if (res.success && res.data) store.setTransactions(res.data)
      })
      store.closeCreateModal()
      alert('거래가 성공적으로 생성되었습니다.')
    } else {
      alert(result.error || '거래 저장에 실패했습니다.')
    }
  }

  // ============================================================================
  // Save Dispatcher
  // ============================================================================

  async function handleSave() {
    switch (store.createModalType) {
      case 'customer':
        await createCustomer()
        break
      case 'opportunity':
        await createOpportunity()
        break
      case 'contract':
        await createContract()
        break
      case 'transaction':
        await createTransaction()
        break
    }
  }

  // ============================================================================
  // Filtered Data
  // ============================================================================

  const filteredCustomers = $derived.by(() => {
    let customers = store.data.customers

    if (store.filters.searchTerm) {
      customers = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(store.filters.searchTerm.toLowerCase()) ||
          customer.contact_person?.toLowerCase().includes(store.filters.searchTerm.toLowerCase()) ||
          customer.industry?.toLowerCase().includes(store.filters.searchTerm.toLowerCase()),
      )
    }

    if (store.filters.selectedType !== 'all') {
      customers = customers.filter((customer) => customer.type === store.filters.selectedType)
    }

    return customers
  })

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    // Store
    store,

    // Actions
    loadAllData,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createOpportunity,
    createContract,
    createTransaction,
    handleSave,

    // Computed
    filteredCustomers,
  }
}
