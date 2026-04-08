export { fetchAssetsCenter } from '@/api/asset/index'
export type { AssetsCenterPayload } from '@/api/asset/index'

/** 预留：POST /api/v1/assets/deposit/intent */
export async function requestDepositIntent(): Promise<unknown> {
  return null
}

/** 预留：POST /api/v1/assets/withdraw/intent */
export async function requestWithdrawIntent(): Promise<unknown> {
  return null
}
