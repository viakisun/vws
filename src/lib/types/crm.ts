// CRM Types

export interface Customer {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  industry: string
  status: 'lead' | 'prospect' | 'customer' | 'inactive' | 'active'
  value: number
  lastContact: string
  createdAt: string
  notes?: string
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
}
