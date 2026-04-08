import { adaptAssetsCenter } from '@/api/asset/asset.adapter'
import { fetchAssetsCenterRaw } from '@/api/asset/asset.api'

export async function fetchAssetsCenter() {
  const raw = await fetchAssetsCenterRaw()
  return adaptAssetsCenter(raw)
}

export type { AssetsCenterPayload } from '@/types/assetsCenter'
