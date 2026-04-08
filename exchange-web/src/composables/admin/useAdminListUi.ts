import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

/** 后台列表页通用：加载态、异步包裹、二次确认（对接 API 时在 withLoading 内调用接口即可） */
export function useAdminListUi() {
  const loading = ref(false)

  async function withLoading<T>(fn: () => Promise<T> | T): Promise<T> {
    loading.value = true
    try {
      return await Promise.resolve(fn())
    } finally {
      loading.value = false
    }
  }

  return { loading, withLoading }
}

export async function adminConfirm(
  message: string,
  options?: { title?: string; type?: 'warning' | 'info' | 'success' | 'error' },
): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, options?.title ?? '确认', {
      type: options?.type ?? 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      appendTo: document.body,
    })
    return true
  } catch {
    return false
  }
}

export function toastSuccess(message: string) {
  ElMessage.success(message)
}

export function toastInfo(message: string) {
  ElMessage.info(message)
}

export function toastWarning(message: string) {
  ElMessage.warning(message)
}

/** 模拟网络延迟，便于演示 loading / 骨架屏 */
export function mockDelay(ms = 320): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
