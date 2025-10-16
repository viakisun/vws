// Asset Management Types

// =====================================================
// Database Types (DB 스키마와 일치)
// =====================================================

export interface DatabaseAssetCategory {
  id: string
  name: string
  type: 'physical' | 'ip' | 'certification'
  description?: string
  requires_serial: boolean
  requires_location: boolean
  requires_datetime_booking: boolean
  requires_assignment: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseAsset {
  id: string
  category_id: string
  asset_code: string
  name: string
  description?: string
  serial_number?: string
  manufacturer?: string
  model?: string
  purchase_date?: string
  purchase_price?: number
  warranty_end_date?: string
  location?: string
  status: 'available' | 'in_use' | 'maintenance' | 'disposed' | 'lost'
  condition?: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
  created_at: string
  updated_at: string
}

export interface DatabaseAssetAssignment {
  id: string
  asset_id: string
  employee_id: string
  assigned_date: string
  expected_return_date?: string
  actual_return_date?: string
  status: 'active' | 'returned' | 'overdue'
  purpose?: string
  notes?: string
  assigned_by?: string
  returned_by?: string
  created_at: string
  updated_at: string
}

export interface DatabaseAssetRequest {
  id: string
  requester_id: string
  asset_id?: string
  category_id?: string
  request_type:
    | 'vehicle_reservation'
    | 'equipment_assignment'
    | 'equipment_return'
    | 'new_purchase'
    | 'disposal'
  purpose?: string
  start_datetime?: string
  end_datetime?: string
  return_reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface DatabaseIntellectualProperty {
  id: string
  ip_type: 'patent' | 'trademark' | 'utility_model' | 'design' | 'domain' | 'copyright'
  title: string
  registration_number?: string
  application_number?: string
  application_date?: string
  registration_date?: string
  expiry_date?: string
  renewal_date?: string
  status: 'planning' | 'applied' | 'registered' | 'expired' | 'abandoned'
  country: string
  owner?: string
  inventor_names?: string[]
  description?: string
  classification_code?: string
  annual_fee?: number
  document_s3_key?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface DatabaseIpRenewalHistory {
  id: string
  ip_id: string
  renewal_date: string
  fee_paid?: number
  next_renewal_date?: string
  paid_by?: string
  notes?: string
  created_at: string
}

export interface DatabaseCompanyCertification {
  id: string
  company_id: string
  certification_type: string
  certification_name: string
  certification_number?: string
  issuing_authority?: string
  issue_date?: string
  expiry_date?: string
  status: 'active' | 'expired' | 'suspended' | 'cancelled'
  renewal_required: boolean
  document_s3_key?: string
  ocr_confidence?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface DatabaseCertificationRenewalHistory {
  id: string
  certification_id: string
  renewal_date: string
  expiry_date: string
  renewed_by?: string
  notes?: string
  created_at: string
}

export interface DatabaseAssetAudit {
  id: string
  audit_name: string
  audit_quarter: number
  audit_year: number
  start_date: string
  end_date: string
  status: 'planned' | 'in_progress' | 'completed'
  auditor_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface DatabaseAssetAuditItem {
  id: string
  audit_id: string
  asset_id: string
  checked: boolean
  checked_at?: string
  checked_by?: string
  condition?: string
  location_verified?: boolean
  discrepancy_notes?: string
  created_at: string
}

export interface DatabaseAssetNotification {
  id: string
  notification_type: 'expiry_warning' | 'renewal_due' | 'audit_reminder' | 'overdue_return'
  reference_type: 'asset' | 'ip' | 'certification' | 'assignment'
  reference_id: string
  recipient_id: string
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'sent' | 'read'
  scheduled_date?: string
  sent_at?: string
  read_at?: string
  created_at: string
}

// =====================================================
// Extended Types (관계형 데이터 포함)
// =====================================================

export interface Asset extends DatabaseAsset {
  category?: DatabaseAssetCategory
  current_assignment?: DatabaseAssetAssignment & {
    employee?: {
      id: string
      first_name: string
      last_name: string
      employee_id: string
    }
  }
}

export interface AssetRequest extends DatabaseAssetRequest {
  requester?: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
  }
  asset?: DatabaseAsset
  category?: DatabaseAssetCategory
  approved_by_user?: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
  }
}

export interface IntellectualProperty extends DatabaseIntellectualProperty {
  renewal_history?: DatabaseIpRenewalHistory[]
}

export interface CompanyCertification extends DatabaseCompanyCertification {
  company?: {
    id: string
    name: string
  }
  renewal_history?: DatabaseCertificationRenewalHistory[]
}

export interface AssetAudit extends DatabaseAssetAudit {
  auditor?: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
  }
  audit_items?: (DatabaseAssetAuditItem & {
    asset?: DatabaseAsset
    checked_by_user?: {
      id: string
      first_name: string
      last_name: string
      employee_id: string
    }
  })[]
}

export interface AssetNotification extends DatabaseAssetNotification {
  recipient?: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
  }
}

// =====================================================
// Form Data Types
// =====================================================

export interface CreateAssetDto {
  category_id: string
  asset_code: string
  name: string
  description?: string
  serial_number?: string
  manufacturer?: string
  model?: string
  purchase_date?: string
  purchase_price?: number
  warranty_end_date?: string
  location?: string
  condition?: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
}

export interface UpdateAssetDto extends Partial<CreateAssetDto> {
  status?: 'available' | 'in_use' | 'maintenance' | 'disposed' | 'lost'
}

export interface CreateAssetRequestDto {
  asset_id?: string
  category_id?: string
  request_type:
    | 'vehicle_reservation'
    | 'equipment_assignment'
    | 'equipment_return'
    | 'new_purchase'
    | 'disposal'
  purpose?: string
  start_datetime?: string
  end_datetime?: string
  return_reason?: string
}

export interface CreateIpDto {
  ip_type: 'patent' | 'trademark' | 'utility_model' | 'design' | 'domain' | 'copyright'
  title: string
  registration_number?: string
  application_number?: string
  application_date?: string
  registration_date?: string
  expiry_date?: string
  status?: 'planning' | 'applied' | 'registered' | 'expired' | 'abandoned'
  country?: string
  owner?: string
  inventor_names?: string[]
  description?: string
  classification_code?: string
  annual_fee?: number
  notes?: string
}

export interface CreateCertificationDto {
  company_id: string
  certification_type: string
  certification_name: string
  certification_number?: string
  issuing_authority?: string
  issue_date?: string
  expiry_date?: string
  renewal_required?: boolean
  notes?: string
}

export interface CreateAuditDto {
  audit_name: string
  audit_quarter: number
  audit_year: number
  start_date: string
  end_date: string
  auditor_id?: string
  notes?: string
}

// =====================================================
// Filter Types
// =====================================================

export interface AssetFilters {
  category_id?: string
  status?: string
  condition?: string
  location?: string
  search?: string
  limit?: number
  offset?: number
}

export interface AssetRequestFilters {
  requester_id?: string
  status?: string
  request_type?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

export interface IpFilters {
  ip_type?: string
  status?: string
  country?: string
  search?: string
  expiry_soon?: boolean
  limit?: number
  offset?: number
}

export interface CertificationFilters {
  company_id?: string
  certification_type?: string
  status?: string
  expiry_soon?: boolean
  limit?: number
  offset?: number
}

// =====================================================
// Dashboard Types
// =====================================================

export interface AssetDashboardStats {
  totalAssets: number
  availableAssets: number
  inUseAssets: number
  maintenanceAssets: number
  totalValue: number
  pendingRequests: number
  overdueReturns: number
  expiringIps: number
  expiringCertifications: number
}

export interface AssetNotificationSummary {
  urgent: number
  high: number
  normal: number
  low: number
}

// =====================================================
// OCR Types (인증서 등록용)
// =====================================================

export interface CertificationOcrResult {
  certification_name: string
  certification_number?: string
  issuing_authority?: string
  issue_date?: string
  expiry_date?: string
  confidence: number
  raw_text: string
}

// =====================================================
// Calendar Types (차량 예약용)
// =====================================================

export interface VehicleAvailability {
  date: string
  timeSlots: {
    start: string
    end: string
    available: boolean
    request_id?: string
  }[]
}

export interface VehicleBooking {
  asset_id: string
  start_datetime: string
  end_datetime: string
  purpose: string
}

// =====================================================
// Audit Types
// =====================================================

export interface AuditProgress {
  total_items: number
  checked_items: number
  percentage: number
  discrepancies: number
}

export interface AuditSummary {
  audit: AssetAudit
  progress: AuditProgress
  assets_by_status: Record<string, number>
  assets_by_condition: Record<string, number>
}

// =====================================================
// Notification Types
// =====================================================

export interface NotificationTemplate {
  type: 'expiry_warning' | 'renewal_due' | 'audit_reminder' | 'overdue_return'
  days_before: number
  title_template: string
  message_template: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

// =====================================================
// Report Types
// =====================================================

export interface AssetReport {
  period: {
    start_date: string
    end_date: string
  }
  summary: {
    total_assets: number
    total_value: number
    utilization_rate: number
    maintenance_cost: number
  }
  assets_by_category: Array<{
    category: string
    count: number
    value: number
  }>
  assets_by_status: Array<{
    status: string
    count: number
  }>
}

export interface IpReport {
  period: {
    start_date: string
    end_date: string
  }
  summary: {
    total_ips: number
    active_ips: number
    expiring_soon: number
    total_annual_fees: number
  }
  ips_by_type: Array<{
    ip_type: string
    count: number
    active_count: number
  }>
  ips_by_status: Array<{
    status: string
    count: number
  }>
}
