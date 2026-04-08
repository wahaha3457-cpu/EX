/** 充值/提现网络与费率（演示，可对接链与风控配置 API） */

export interface WalletNetworkOption {
  id: string
  label: string
  /** 提现手续费（该币种数量） */
  withdrawFee: number
  minWithdraw: number
  minDeposit: number
  confirmNote: string
  /** 合约地址展示（代币网络） */
  tokenContract?: string
  /** 需填写 Memo/Tag 的链 */
  memoRequired?: boolean
  memoHint?: string
  /** 预计到账时间文案 */
  arrivalNote?: string
}

/** 演示：24h 提现折合上限（USDT），仅展示用 */
export const DEMO_WITHDRAW_DAILY_CAP_USDT = 100_000

/** 演示：当日已用提现额度折合（USDT） */
export const DEMO_WITHDRAW_DAILY_USED_USDT = 12_400

const USDT_NETS: WalletNetworkOption[] = [
  {
    id: 'TRC20',
    label: 'TRC20 (Tron)',
    withdrawFee: 1,
    minWithdraw: 10,
    minDeposit: 1,
    confirmNote: '约 19 个网络确认',
  },
  {
    id: 'ERC20',
    label: 'ERC20 (Ethereum)',
    withdrawFee: 5,
    minWithdraw: 20,
    minDeposit: 5,
    confirmNote: '约 12 个区块确认',
    tokenContract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    arrivalNote: '通常 5–20 分钟',
  },
  {
    id: 'BEP20',
    label: 'BEP20 (BSC)',
    withdrawFee: 0.8,
    minWithdraw: 10,
    minDeposit: 1,
    confirmNote: '约 15 个区块确认',
  },
]

export const WALLET_ASSET_NETWORKS: Record<string, WalletNetworkOption[]> = {
  USDT: USDT_NETS,
  USDC: USDT_NETS,
  BTC: [
    {
      id: 'BTC',
      label: 'Bitcoin',
      withdrawFee: 0.0005,
      minWithdraw: 0.001,
      minDeposit: 0.0001,
      confirmNote: '约 2 次网络确认',
    },
  ],
  ETH: [
    {
      id: 'ERC20',
      label: 'Ethereum (ERC20)',
      withdrawFee: 0.002,
      minWithdraw: 0.01,
      minDeposit: 0.002,
      confirmNote: '约 12 个区块确认',
    },
  ],
  BNB: [
    {
      id: 'BEP20',
      label: 'BEP20 (BSC)',
      withdrawFee: 0.0005,
      minWithdraw: 0.02,
      minDeposit: 0.001,
      confirmNote: '约 15 个区块确认',
      arrivalNote: '通常 1–5 分钟',
    },
  ],
  SOL: [
    {
      id: 'SOL',
      label: 'Solana',
      withdrawFee: 0.01,
      minWithdraw: 0.1,
      minDeposit: 0.01,
      confirmNote: '约 32 次确认',
      memoRequired: true,
      memoHint: '若收款平台要求 Memo/Tag，请务必填写一致，否则无法入账。',
      arrivalNote: '通常 1–3 分钟',
    },
  ],
  XRP: [
    {
      id: 'XRP',
      label: 'XRP Ledger',
      withdrawFee: 0.25,
      minWithdraw: 22,
      minDeposit: 10,
      confirmNote: '约 1 次账本确认',
      memoRequired: true,
      memoHint: 'XRP 提现普遍需要 Destination Tag，请向收款方确认标签数字。',
      arrivalNote: '通常 1 分钟内',
    },
  ],
}

export const WALLET_DEPOSIT_ASSETS = Object.keys(WALLET_ASSET_NETWORKS)

/** 演示充值地址（非真实） */
export function mockDepositAddress(asset: string, network: string): string {
  const seed = `${asset}:${network}`
  const b = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0)
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  if (asset === 'BTC') return `bc1q${hex(b)}demo${hex(b % 255)}addr`
  if (asset === 'SOL') return `SoL${hex(b)}Dmo${hex((b * 5) % 255)}${hex((b * 19) % 255)}`
  if (asset === 'XRP') return `rDEMO${hex(b)}${hex((b * 17) % 255)}addr`
  if (network === 'TRC20') return `T${hex(b)}DEMO${hex((b * 7) % 255)}${hex((b * 13) % 255)}`
  return `0x${hex(b)}dEm0${hex((b * 3) % 255)}${hex((b * 11) % 255)}`
}

export function networksForAsset(asset: string): WalletNetworkOption[] {
  return WALLET_ASSET_NETWORKS[asset] ?? []
}

export function networkMeta(asset: string, networkId: string): WalletNetworkOption | null {
  return networksForAsset(asset).find((n) => n.id === networkId) ?? null
}

function tagHash(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

/** 演示：链上充值需附带的 Memo/Tag（与地址一并展示） */
export function mockDepositMemo(asset: string, networkId: string): string | null {
  const m = networkMeta(asset, networkId)
  if (!m?.memoRequired) return null
  const n = tagHash(`${asset}:${networkId}`)
  return String(100_000 + (n % 899_000))
}

/** 二维码图片 URL（外链服务，仅演示） */
export function walletAddressQrUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}`
}
