import { adaptUserCenter } from '@/api/user/user.adapter'
import { fetchUserCenterPayloadRaw } from '@/api/user/user.api'

export async function fetchUserCenterPayload() {
  const raw = await fetchUserCenterPayloadRaw()
  return adaptUserCenter(raw)
}

export type { UserCenterPayload } from '@/types/userCenter'
