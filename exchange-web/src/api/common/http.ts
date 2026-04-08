import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ErrorCode } from '@/enums/errorCode'
import type { ApiResult } from '@/types/api'
import { useAppStore } from '@/stores/app'
import { translate } from '@/i18n'
import router from '@/router'
import { RouteNames } from '@/constants/routeNames'
import { getAccessToken } from '@/utils/tokenStorage'
import { isLegacyAuthMode } from '@/config/env'

const baseURL = import.meta.env.VITE_API_BASE || '/api'

function createHttp(): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
    },
    validateStatus: (status) => status >= 200 && status < 300,
  })

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken()
      if (token) {
        config.headers = config.headers ?? {}
        // 原外汇平台文档：登录后 Header 使用 `Token`，非 Bearer
        if (isLegacyAuthMode()) {
          config.headers.Token = token
        } else {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResult>) => {
      const body = response.data
      if (body && typeof body === 'object' && 'success' in body) {
        if (body.success === false) {
          handleBusinessError(body)
          return Promise.reject({ isApiResult: true as const, response, data: body })
        }
        if (isAuthErrorCode(body.code)) {
          handleAuthFailure(body.message || translate('common.sessionExpired'))
          return Promise.reject({ isApiResult: true as const, response, data: body })
        }
      }
      return response
    },
    (error) => {
      if (error.response?.status === 401) {
        handleAuthFailure(translate('common.sessionExpiredRelogin'))
      } else if (!error.response) {
        useAppStore().pushToast('error', translate('common.networkError'))
      }
      return Promise.reject(error)
    },
  )

  return instance
}

function isAuthErrorCode(code: string | undefined): boolean {
  if (!code) return false
  return (
    code === ErrorCode.AUTH_TOKEN_EXPIRED ||
    code === ErrorCode.AUTH_TOKEN_INVALID ||
    code === ErrorCode.AUTH_TOKEN_MISSING
  )
}

function handleBusinessError(body: ApiResult): void {
  useAppStore().pushToast('error', body.message || translate('common.requestFailed'))
}

function handleAuthFailure(message: string): void {
  void import('@/stores/auth').then(async ({ useAuthStore }) => {
    await useAuthStore().clearSession()
  })
  useAppStore().pushToast('warning', message)
  const current = router.currentRoute.value
  if (current.name !== RouteNames.Login && current.name !== RouteNames.Register) {
    router.push({ name: RouteNames.Login, query: { redirect: current.fullPath } }).catch(() => {})
  }
}

export const http = createHttp()

export async function apiGet<T>(url: string, config?: Parameters<typeof http.get>[1]): Promise<T> {
  const res = await http.get<ApiResult<T>>(url, config)
  return res.data.data as T
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.post<ApiResult<T>>(url, body)
  return res.data.data as T
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.put<ApiResult<T>>(url, body)
  return res.data.data as T
}

export async function apiDelete<T>(url: string, config?: Parameters<typeof http.delete>[1]): Promise<T> {
  const res = await http.delete<ApiResult<T>>(url, config)
  return res.data.data as T
}
