import axios, { type AxiosInstance } from 'axios'
import { legacyAuthApiBase } from '@/config/env'
import { isLegacySuccess } from '@/api/auth/legacy/legacyContract'
import { getAccessToken } from '@/utils/tokenStorage'

let instance: AxiosInstance | null = null

function getLegacyClient(): AxiosInstance {
  if (instance) return instance
  instance = axios.create({
    baseURL: legacyAuthApiBase(),
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: (s) => s >= 200 && s < 300,
  })
  instance.interceptors.request.use((config) => {
    /** Spring `*.action` 路径常含 `!`；部分网关/代理对未编码 `!` 会 404，统一编码为 %21 */
    if (config.url?.includes('!')) {
      config.url = config.url.replace(/!/g, '%21')
    }
    const token = getAccessToken()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Token = token
    }
    return config
  })
  return instance
}

export interface LegacyEnvelope {
  code?: unknown
  msg?: string
  message?: string
  data?: unknown
  /** Swagger「Result」中的业务成功标记 */
  succeed?: boolean
}

function assertLegacyOk(raw: LegacyEnvelope): void {
  const code = raw?.code
  const ok = isLegacySuccess(code, raw?.succeed)
  if (!ok) {
    const text = raw?.msg || raw?.message || `业务错误 code=${String(code)}`
    throw new Error(text)
  }
}

/**
 * POST + JSON body（少数旧接口仍用 body 时可调用）。
 */
export async function legacyPost<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  const client = getLegacyClient()
  const res = await client.post<LegacyEnvelope>(path, body)
  const raw = res.data as LegacyEnvelope
  assertLegacyOk(raw)
  return (raw?.data ?? null) as T
}

type QueryPrimitive = string | number | boolean | undefined | null

/**
 * POST + QueryString（外汇平台 `/api/login`、注册等文档约定）。
 */
export async function legacyPostQuery<T = unknown>(
  path: string,
  params: Record<string, QueryPrimitive>,
): Promise<T> {
  const client = getLegacyClient()
  const search = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Record<string, string | number | boolean>
  const res = await client.post<LegacyEnvelope>(path, null, { params: search })
  const raw = res.data as LegacyEnvelope
  assertLegacyOk(raw)
  return (raw?.data ?? null) as T
}

/**
 * GET + QueryString（行情列表、K 线等）。
 */
export async function legacyGet<T = unknown>(
  path: string,
  params?: Record<string, QueryPrimitive>,
): Promise<T> {
  const client = getLegacyClient()
  const search = params
    ? (Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
      ) as Record<string, string | number | boolean>)
    : undefined
  const res = await client.get<LegacyEnvelope>(path, { params: search })
  const raw = res.data as LegacyEnvelope
  assertLegacyOk(raw)
  return (raw?.data ?? null) as T
}

export async function legacyTryGet<T = unknown>(
  path: string,
  params?: Record<string, QueryPrimitive>,
): Promise<T | null> {
  try {
    return await legacyGet<T>(path, params)
  } catch {
    return null
  }
}

export async function legacyTryPost<T = unknown>(
  path: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  try {
    return await legacyPost<T>(path, body)
  } catch {
    return null
  }
}

export async function legacyTryPostQuery<T = unknown>(
  path: string,
  params: Record<string, QueryPrimitive>,
): Promise<T | null> {
  try {
    return await legacyPostQuery<T>(path, params)
  } catch {
    return null
  }
}
