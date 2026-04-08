import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserCenterOverview, UserCenterSecurityItem } from '@/types/userCenter'

export type SecurityFlowId =
  | 'login_pwd'
  | 'email'
  | 'phone'
  | 'ga'
  | 'withdraw_whitelist'
  | 'devices'

export interface SecurityDeviceRow {
  id: string
  label: string
  ip: string
  lastSeenLabel: string
  current: boolean
}

export interface WhitelistAddressRow {
  id: string
  network: string
  address: string
  label: string
}

const initialDevices: SecurityDeviceRow[] = [
  {
    id: 'dev-1',
    label: 'Chrome 131 · macOS',
    ip: '203.0.113.42',
    lastSeenLabel: '当前会话',
    current: true,
  },
  {
    id: 'dev-2',
    label: 'Mobile Safari · iOS',
    ip: '198.51.100.8',
    lastSeenLabel: '约 1 天前',
    current: false,
  },
  {
    id: 'dev-3',
    label: 'Firefox · Windows',
    ip: '192.0.2.1',
    lastSeenLabel: '约 3 天前',
    current: false,
  },
]

function maskPhone(digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (d.length < 7) return digits
  return `${d.slice(0, 3)}****${d.slice(-4)}`
}

function maskEmailLocal(email: string): string {
  const [u, dom] = email.split('@')
  if (!dom) return '***@***'
  const head = u.length <= 2 ? u[0] + '*' : u.slice(0, 2) + '***'
  return `${head}@${dom}`
}

export type OpenSecurityFlowOptions = {
  phoneMode?: 'bind' | 'change'
  /** 已开启 Google 验证器时仅展示管理页 */
  gaManage?: boolean
}

export const useSecurityCenterUiStore = defineStore('securityCenterUi', () => {
  const activeFlow = ref<SecurityFlowId | null>(null)
  const flowStep = ref(0)
  const phoneFlowMode = ref<'bind' | 'change'>('bind')
  const gaManageOnly = ref(false)

  const phoneBound = ref(false)
  const phoneMasked = ref('')
  const googleEnabled = ref(false)
  const whitelistEnabled = ref(false)
  const emailMaskedOverride = ref<string | null>(null)

  const deviceRows = ref<SecurityDeviceRow[]>(initialDevices.map((d) => ({ ...d })))
  const whitelistRows = ref<WhitelistAddressRow[]>([])

  /** Google 验证器演示密钥（非真实） */
  const gaDemoSecret = 'JBSWY3DPEHPK3PXP'

  const openFlow = (id: SecurityFlowId, options?: OpenSecurityFlowOptions) => {
    activeFlow.value = id
    flowStep.value = 0
    gaManageOnly.value = id === 'ga' && !!options?.gaManage
    if (options?.phoneMode) phoneFlowMode.value = options.phoneMode
    else if (id === 'phone') phoneFlowMode.value = phoneBound.value ? 'change' : 'bind'
  }

  const closeFlow = () => {
    activeFlow.value = null
    flowStep.value = 0
    gaManageOnly.value = false
  }

  const nextStep = () => {
    flowStep.value += 1
  }

  const setStep = (n: number) => {
    flowStep.value = n
  }

  const bindPhone = (fullNumber: string) => {
    phoneBound.value = true
    phoneMasked.value = maskPhone(fullNumber)
  }

  const enableGoogle = () => {
    googleEnabled.value = true
  }

  const disableGoogle = () => {
    googleEnabled.value = false
  }

  const setWhitelistEnabled = (on: boolean) => {
    whitelistEnabled.value = on
    if (!on) whitelistRows.value = []
  }

  const addWhitelistDemo = (row: Omit<WhitelistAddressRow, 'id'>) => {
    whitelistRows.value = [
      {
        id: `wl-${Date.now()}`,
        ...row,
      },
      ...whitelistRows.value,
    ]
  }

  const applyEmailChange = (newEmail: string) => {
    emailMaskedOverride.value = maskEmailLocal(newEmail.trim())
  }

  const removeDevice = (id: string) => {
    deviceRows.value = deviceRows.value.filter((d) => d.id !== id)
  }

  function mergeSecurityItems(items: UserCenterSecurityItem[], overview: UserCenterOverview | null) {
    const emailMasked = emailMaskedOverride.value ?? overview?.emailMasked ?? '—'
    return items.map((item) => {
      if (item.id === 'phone') {
        if (phoneBound.value) {
          return {
            ...item,
            status: 'ON' as const,
            statusLabel: `已绑定 ${phoneMasked.value}`,
            actionLabel: '更换',
          }
        }
        return { ...item, actionLabel: '绑定' }
      }
      if (item.id === 'ga') {
        if (googleEnabled.value) {
          return {
            ...item,
            status: 'ON' as const,
            statusLabel: '已开启',
            actionLabel: '管理',
          }
        }
        return { ...item, actionLabel: '开启' }
      }
      if (item.id === 'withdraw_whitelist') {
        if (whitelistEnabled.value) {
          return {
            ...item,
            status: 'ON' as const,
            statusLabel: whitelistRows.value.length ? `已开启 · ${whitelistRows.value.length} 个地址` : '已开启',
            actionLabel: '管理',
          }
        }
        return { ...item, status: 'OFF' as const, statusLabel: '未开启', actionLabel: '管理' }
      }
      if (item.id === 'devices') {
        const n = deviceRows.value.length
        return {
          ...item,
          status: n > 0 ? ('PARTIAL' as const) : ('OFF' as const),
          statusLabel: n > 0 ? `${n} 台设备` : '无在线设备',
          actionLabel: '查看',
        }
      }
      if (item.id === 'email') {
        return {
          ...item,
          statusLabel: `已绑定 ${emailMasked}`,
        }
      }
      return item
    })
  }

  return {
    activeFlow,
    flowStep,
    phoneFlowMode,
    gaManageOnly,
    phoneBound,
    phoneMasked,
    googleEnabled,
    whitelistEnabled,
    emailMaskedOverride,
    deviceRows,
    whitelistRows,
    gaDemoSecret,
    openFlow,
    closeFlow,
    nextStep,
    setStep,
    bindPhone,
    enableGoogle,
    disableGoogle,
    setWhitelistEnabled,
    addWhitelistDemo,
    applyEmailChange,
    removeDevice,
    mergeSecurityItems,
  }
})
