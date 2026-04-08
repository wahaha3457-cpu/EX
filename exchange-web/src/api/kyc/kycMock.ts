import type { KycDocumentSlot, KycPersonalAdvanced, KycPersonalBasic, KycStoredState } from '@/types/kyc'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function key(userCode: string) {
  return `ex.kyc.state.${userCode}`
}

export function buildDefaultBasicDocs(idType: 'ID_CARD' | 'PASSPORT'): KycDocumentSlot[] {
  if (idType === 'PASSPORT') {
    return [
      {
        kind: 'ID_FRONT',
        label: 'passportBio',
        uploaded: false,
        fileName: null,
      },
    ]
  }
  return [
    {
      kind: 'ID_FRONT',
      label: 'idFront',
      uploaded: false,
      fileName: null,
    },
    {
      kind: 'ID_BACK',
      label: 'idBack',
      uploaded: false,
      fileName: null,
    },
  ]
}

function defaultDocsAdvanced(): KycDocumentSlot[] {
  return [
    {
      kind: 'ADDRESS_PROOF',
      label: 'addressProof',
      uploaded: false,
      fileName: null,
    },
    {
      kind: 'SELFIE',
      label: 'selfie',
      uploaded: false,
      fileName: null,
    },
  ]
}

function mergeDocSlots(next: KycDocumentSlot[], prev: KycDocumentSlot[]): KycDocumentSlot[] {
  return next.map((slot) => {
    const old = prev.find((p) => p.kind === slot.kind)
    return {
      ...slot,
      uploaded: old?.uploaded ?? false,
      fileName: old?.fileName ?? null,
    }
  })
}

/** 切换证件类型时重建基础证件槽位，并尽量保留仍适用的已选文件 */
export function rebuildBasicDocsForIdType(
  idType: 'ID_CARD' | 'PASSPORT',
  previous: KycDocumentSlot[],
): KycDocumentSlot[] {
  return mergeDocSlots(buildDefaultBasicDocs(idType), previous)
}

export function defaultKycState(): KycStoredState {
  return {
    basic: {
      status: 'TODO',
      personal: null,
      docs: buildDefaultBasicDocs('ID_CARD'),
      rejectReason: null,
      submittedAt: null,
      reviewedAt: null,
    },
    advanced: {
      status: 'LOCKED',
      personal: null,
      docs: defaultDocsAdvanced(),
      rejectReason: null,
      submittedAt: null,
      reviewedAt: null,
    },
    tier: 0,
  }
}

function migrateKycState(s: KycStoredState): KycStoredState {
  const idType = s.basic.personal?.idType ?? 'ID_CARD'
  const expectedKinds =
    idType === 'PASSPORT' ? (['ID_FRONT'] as const) : (['ID_FRONT', 'ID_BACK'] as const)
  const kinds = s.basic.docs.map((d) => d.kind)
  const match =
    expectedKinds.length === kinds.length && expectedKinds.every((k) => kinds.includes(k as never))
  if (!match) {
    s.basic.docs = rebuildBasicDocsForIdType(idType, s.basic.docs)
  }
  return s
}

export function readKycState(userCode: string): KycStoredState {
  if (typeof localStorage === 'undefined') return defaultKycState()
  try {
    const raw = localStorage.getItem(key(userCode))
    if (!raw) return defaultKycState()
    const p = JSON.parse(raw) as KycStoredState
    if (!p?.basic || !p?.advanced) return defaultKycState()
    return migrateKycState(p)
  } catch {
    return defaultKycState()
  }
}

function writeKycState(userCode: string, s: KycStoredState) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key(userCode), JSON.stringify(s))
}

export async function fetchKycState(userCode: string): Promise<KycStoredState> {
  await delay(80)
  return readKycState(userCode)
}

export async function saveKycDraft(
  userCode: string,
  patch: {
    basicPersonal?: KycPersonalBasic | null
    advancedPersonal?: KycPersonalAdvanced | null
    basicDocs?: KycDocumentSlot[]
    advancedDocs?: KycDocumentSlot[]
  },
): Promise<KycStoredState> {
  await delay(60)
  const s = readKycState(userCode)
  if (patch.basicPersonal !== undefined) s.basic.personal = patch.basicPersonal
  if (patch.advancedPersonal !== undefined) s.advanced.personal = patch.advancedPersonal
  if (patch.basicDocs) s.basic.docs = patch.basicDocs
  if (patch.advancedDocs) s.advanced.docs = patch.advancedDocs
  writeKycState(userCode, s)
  return s
}

export async function ensureBasicDocsForIdType(
  userCode: string,
  idType: 'ID_CARD' | 'PASSPORT',
): Promise<KycStoredState> {
  await delay(40)
  const s = readKycState(userCode)
  if (s.basic.status === 'PASSED' || s.basic.status === 'IN_REVIEW') return s
  s.basic.docs = rebuildBasicDocsForIdType(idType, s.basic.docs)
  writeKycState(userCode, s)
  return s
}

export async function markDocUploaded(
  userCode: string,
  tier: 'basic' | 'advanced',
  kind: KycDocumentSlot['kind'],
  fileName: string,
): Promise<KycStoredState> {
  const s = readKycState(userCode)
  const bucket = tier === 'basic' ? s.basic.docs : s.advanced.docs
  const d = bucket.find((x) => x.kind === kind)
  if (d) {
    d.uploaded = true
    d.fileName = fileName
  }
  writeKycState(userCode, s)
  await delay(40)
  return s
}

export async function submitBasicKyc(userCode: string, personal: KycPersonalBasic): Promise<KycStoredState> {
  await delay(200)
  const s = readKycState(userCode)
  const expected =
    personal.idType === 'PASSPORT' ? ['ID_FRONT'] : (['ID_FRONT', 'ID_BACK'] as const)
  const ok = expected.every((k) => s.basic.docs.some((d) => d.kind === k && d.uploaded))
  if (!ok) throw new Error('kyc.error.uploadAllIdDocs')
  s.basic.personal = personal
  s.basic.status = 'IN_REVIEW'
  s.basic.rejectReason = null
  s.basic.submittedAt = new Date().toISOString()
  s.basic.reviewedAt = null
  writeKycState(userCode, s)
  return s
}

export async function simulateBasicApproved(userCode: string): Promise<KycStoredState> {
  await delay(400)
  const s = readKycState(userCode)
  if (s.basic.status !== 'IN_REVIEW') return s
  s.basic.status = 'PASSED'
  s.basic.reviewedAt = new Date().toISOString()
  s.tier = 1
  s.advanced.status = 'TODO'
  writeKycState(userCode, s)
  return s
}

export async function simulateBasicRejected(userCode: string, reasonKey: string): Promise<KycStoredState> {
  await delay(400)
  const s = readKycState(userCode)
  if (s.basic.status !== 'IN_REVIEW') return s
  s.basic.status = 'REJECTED'
  s.basic.rejectReason = reasonKey
  s.basic.reviewedAt = new Date().toISOString()
  writeKycState(userCode, s)
  return s
}

export async function submitAdvancedKyc(userCode: string, personal: KycPersonalAdvanced): Promise<KycStoredState> {
  await delay(200)
  const s = readKycState(userCode)
  if (s.tier < 1) throw new Error('kyc.error.needBasicFirst')
  const allUp = s.advanced.docs.every((d) => d.uploaded)
  if (!allUp) throw new Error('kyc.error.uploadAllAdvanced')
  s.advanced.personal = personal
  s.advanced.status = 'IN_REVIEW'
  s.advanced.rejectReason = null
  s.advanced.submittedAt = new Date().toISOString()
  s.advanced.reviewedAt = null
  writeKycState(userCode, s)
  return s
}

export async function simulateAdvancedApproved(userCode: string): Promise<KycStoredState> {
  await delay(400)
  const s = readKycState(userCode)
  if (s.advanced.status !== 'IN_REVIEW') return s
  s.advanced.status = 'PASSED'
  s.advanced.reviewedAt = new Date().toISOString()
  s.tier = 2
  writeKycState(userCode, s)
  return s
}

export async function simulateAdvancedRejected(userCode: string, reasonKey: string): Promise<KycStoredState> {
  await delay(400)
  const s = readKycState(userCode)
  if (s.advanced.status !== 'IN_REVIEW') return s
  s.advanced.status = 'REJECTED'
  s.advanced.rejectReason = reasonKey
  s.advanced.reviewedAt = new Date().toISOString()
  writeKycState(userCode, s)
  return s
}

/** 演示：一键重置（便于验收重复走流程） */
export async function resetKycDemo(userCode: string): Promise<KycStoredState> {
  await delay(80)
  const fresh = defaultKycState()
  writeKycState(userCode, fresh)
  return fresh
}

export function kycStepToOverviewStatus(s: KycStoredState): {
  kycStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  tier: 0 | 1 | 2
} {
  const b = s.basic.status
  const a = s.advanced.status
  if (b === 'REJECTED' || a === 'REJECTED') return { kycStatus: 'REJECTED', tier: s.tier }
  if (b === 'IN_REVIEW' || a === 'IN_REVIEW') return { kycStatus: 'PENDING', tier: s.tier }
  if (s.tier >= 1 && b === 'PASSED') return { kycStatus: 'VERIFIED', tier: s.tier }
  return { kycStatus: 'NONE', tier: s.tier }
}
