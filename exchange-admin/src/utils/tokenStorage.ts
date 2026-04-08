import { StorageKeys } from '@/constants/storageKeys'

export function getAccessToken(): string | null {
  return localStorage.getItem(StorageKeys.ACCESS_TOKEN)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(StorageKeys.ACCESS_TOKEN, token)
}

export function setRefreshToken(token: string | undefined): void {
  if (!token) {
    localStorage.removeItem(StorageKeys.REFRESH_TOKEN)
    return
  }
  localStorage.setItem(StorageKeys.REFRESH_TOKEN, token)
}

export function clearTokens(): void {
  localStorage.removeItem(StorageKeys.ACCESS_TOKEN)
  localStorage.removeItem(StorageKeys.REFRESH_TOKEN)
  localStorage.removeItem(StorageKeys.TOKEN_EXPIRES_AT)
}
