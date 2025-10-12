/**
 * CRM Services - 통합 Export
 */

// Customer Service
export * from './crm-customer-service'

// Contract Service
export * from './crm-contract-service'

// Opportunity Service
export * from './crm-opportunity-service'

// Transaction Service
export * from './crm-transaction-service'

// Stats Service
export * from './crm-stats-service'

// Batch Load Function
import type { CRMContract, CRMCustomer, CRMOpportunity, CRMTransaction } from '$lib/crm/types'
import { loadContracts } from './crm-contract-service'
import { loadCustomers } from './crm-customer-service'
import { loadOpportunities } from './crm-opportunity-service'
import { loadTransactions } from './crm-transaction-service'

export async function loadAllCRMData(): Promise<{
  customers: CRMCustomer[]
  opportunities: CRMOpportunity[]
  contracts: CRMContract[]
  transactions: CRMTransaction[]
}> {
  const [customers, opportunities, contracts, transactions] = await Promise.all([
    loadCustomers(),
    loadOpportunities(),
    loadContracts(),
    loadTransactions(),
  ])

  return {
    customers: customers.success ? customers.data || [] : [],
    opportunities: opportunities.success ? opportunities.data || [] : [],
    contracts: contracts.success ? contracts.data || [] : [],
    transactions: transactions.success ? transactions.data || [] : [],
  }
}

