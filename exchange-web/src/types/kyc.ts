/**
 * 身份认证 KYC（演示域模型，流程对标币安 Lv.1 / Lv.2）
 */

export type KycDocKind = 'ID_FRONT' | 'ID_BACK' | 'ADDRESS_PROOF' | 'SELFIE'

export type KycStepStatus = 'LOCKED' | 'TODO' | 'IN_REVIEW' | 'PASSED' | 'REJECTED'

export interface KycDocumentSlot {
  kind: KycDocKind
  /** i18n 键 stem：`kyc.doc.<label>.title` / `.hint` */
  label: string
  /** 演示：是否已选择文件 */
  uploaded: boolean
  fileName: string | null
}

export interface KycPersonalBasic {
  countryCode: string
  countryName: string
  fullName: string
  idType: 'ID_CARD' | 'PASSPORT'
  idNumber: string
  /** YYYY-MM-DD */
  dateOfBirth: string
}

export interface KycPersonalAdvanced {
  residentialAddress: string
  city: string
  postalCode: string
}

export interface KycStoredState {
  basic: {
    status: KycStepStatus
    personal: KycPersonalBasic | null
    docs: KycDocumentSlot[]
    rejectReason: string | null
    submittedAt: string | null
    reviewedAt: string | null
  }
  advanced: {
    status: KycStepStatus
    personal: KycPersonalAdvanced | null
    docs: KycDocumentSlot[]
    rejectReason: string | null
    submittedAt: string | null
    reviewedAt: string | null
  }
  /** 0 未通过基础 / 1 基础通过 / 2 进阶通过 */
  tier: 0 | 1 | 2
}

export interface KycLimitsRow {
  label: string
  tier0: string
  tier1: string
  tier2: string
}
