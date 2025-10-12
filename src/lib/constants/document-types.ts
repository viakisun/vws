/**
 * 증빙 서류 타입 정의
 */

export enum DocumentType {
  QUOTATION = 'quotation', // 견적서
  TAX_INVOICE = 'tax_invoice', // 세금계산서
  CONTRACT = 'contract', // 계약서
  RECEIPT = 'receipt', // 영수증
  BANK_STATEMENT = 'bank_statement', // 통장사본
  PURCHASE_ORDER = 'purchase_order', // 발주서
  DELIVERY_NOTE = 'delivery_note', // 납품서
  SPECIFICATION = 'specification', // 사양서
  REPORT = 'report', // 보고서
  OTHER = 'other', // 기타
}

export interface DocumentTypeInfo {
  type: DocumentType
  label: string
  description: string
  icon: string // Lucide icon name
}

export const DOCUMENT_TYPES: DocumentTypeInfo[] = [
  {
    type: DocumentType.QUOTATION,
    label: '견적서',
    description: '거래처로부터 받은 견적서',
    icon: 'FileText',
  },
  {
    type: DocumentType.TAX_INVOICE,
    label: '세금계산서',
    description: '세금계산서 또는 계산서',
    icon: 'Receipt',
  },
  {
    type: DocumentType.CONTRACT,
    label: '계약서',
    description: '계약서 또는 협약서',
    icon: 'FileSignature',
  },
  {
    type: DocumentType.RECEIPT,
    label: '영수증',
    description: '영수증 또는 결제증명서',
    icon: 'CreditCard',
  },
  {
    type: DocumentType.BANK_STATEMENT,
    label: '통장사본',
    description: '거래 내역이 포함된 통장사본',
    icon: 'Landmark',
  },
  {
    type: DocumentType.PURCHASE_ORDER,
    label: '발주서',
    description: '발주 요청서',
    icon: 'ShoppingCart',
  },
  {
    type: DocumentType.DELIVERY_NOTE,
    label: '납품서',
    description: '납품 확인서',
    icon: 'Truck',
  },
  {
    type: DocumentType.SPECIFICATION,
    label: '사양서',
    description: '제품 또는 서비스 사양서',
    icon: 'ClipboardList',
  },
  {
    type: DocumentType.REPORT,
    label: '보고서',
    description: '연구 보고서 또는 결과 보고서',
    icon: 'BookOpen',
  },
  {
    type: DocumentType.OTHER,
    label: '기타',
    description: '기타 증빙 서류',
    icon: 'File',
  },
]

/**
 * 문서 타입 정보 조회
 */
export function getDocumentTypeInfo(type: DocumentType): DocumentTypeInfo | undefined {
  return DOCUMENT_TYPES.find((t) => t.type === type)
}

/**
 * 문서 타입 라벨 조회
 */
export function getDocumentTypeLabel(type: DocumentType): string {
  return getDocumentTypeInfo(type)?.label || '알 수 없음'
}
