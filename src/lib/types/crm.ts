// CRM Types

export interface Customer {
  id: string
  name: string
  representativeName: string // 대표자 이름 (사업자등록증)
  contactPerson?: string // 담당자 이름
  contactEmail?: string // 담당자 이메일
  contactPhone?: string // 담당자 전화번호
  industry: string
  status: 'lead' | 'prospect' | 'customer' | 'inactive' | 'active'
  value: number
  lastContact: string
  createdAt: string
  notes?: string
  businessNumber?: string
  businessCategory?: string
  address?: string
  establishmentDate?: string
  corporationStatus?: boolean
  businessEntityType?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  ocrConfidence?: number | null
  businessRegistrationFileUrl?: string
  bankAccountFileUrl?: string
  businessRegistrationS3Key?: string
  bankAccountS3Key?: string
}

export interface Opportunity {
  id: string
  customer_id: string
  customer_name?: string
  title: string
  value: number
  stage: string
  probability: number
  expected_close_date: string
  status: 'open' | 'won' | 'lost'
  notes?: string
  createdAt: string
}

export interface CRMContract {
  id: string
  customerId: string
  customerName?: string
  opportunityId?: string
  contractNumber: string
  title: string
  type: 'sales' | 'purchase'
  contractParty: string
  totalAmount: number
  paidAmount?: number
  contractType: 'revenue' | 'expense'
  startDate: string
  endDate?: string
  paymentMethod?: string
  paymentTerms?: number
  assignedTo?: string
  status: 'active' | 'completed' | 'cancelled'
  contractFileS3Key?: string
  renewalDate?: string
  description?: string
  ownerId?: string
  createdAt: string
  updatedAt: string
}

export interface CRMInteraction {
  id: string
  customerId: string
  customerName: string
  type: 'meeting' | 'call' | 'email' | 'note'
  title: string
  description: string
  interactionDate: string
  nextActionDate?: string
  createdBy?: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

// Legacy interface for backward compatibility
export interface Contract {
  id: string
  customer_id: string
  customer_name?: string
  title: string
  value: number
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'expired' | 'cancelled'
  terms?: string
  createdAt: string
}

export interface Interaction {
  id: string
  customerId: string
  customerName: string
  type: 'call' | 'email' | 'meeting' | 'note'
  subject: string
  description: string
  date: string
  user: string
  status: 'completed' | 'pending' | 'scheduled'
}

export interface CRMOpportunity {
  id: string
  customerId: string
  customerName?: string
  title: string
  amount: number
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability: number
  expectedCloseDate?: string
  actualCloseDate?: string
  status: 'open' | 'won' | 'lost'
  assignedTo?: string
  assignedToName?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CRMTransaction {
  id: string
  customerId?: string
  customerName?: string
  contractId?: string
  opportunityId?: string
  type: 'invoice' | 'payment' | 'refund'
  amount: number
  transactionDate: string
  paymentMethod?: 'bank_transfer' | 'card' | 'cash' | 'other'
  status: 'pending' | 'completed' | 'cancelled'
  invoiceNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CRMStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  prospectCustomers: number
  newCustomersThisMonth: number
  newCustomersLastMonth: number
  newCustomersGrowth: number
  openOpportunities: number
  totalOpportunityAmount: number
  expectedRevenueThisMonth: number
  activeContracts: number
  totalRevenueContracts: number
  totalExpenseContracts: number
  netContractValue: number
  contractsToRenew: number
}

// Legacy interfaces for backward compatibility
export interface OpportunityDetails {
  id: string
  title: string
  customer_id: string
  customerId?: string // alias for customer_id
  customer_name?: string
  customerName?: string // alias for customer_name
  value: number
  stage: string
  probability: number
  expected_close_date: string
  expectedClose?: string // alias for expected_close_date
  status: 'open' | 'won' | 'lost'
  owner: string
  createdAt: string
  notes?: string
}

export interface CRMData {
  customers: Customer[]
  interactions: Interaction[]
  opportunities: OpportunityDetails[]
  contracts: Contract[]
  transactions: any[]
}
