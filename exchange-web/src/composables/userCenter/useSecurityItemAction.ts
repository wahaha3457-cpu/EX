import { useAppStore } from '@/stores/app'
import { useFundPasswordStore } from '@/stores/fundPassword'
import { useSecurityCenterUiStore } from '@/stores/securityCenterUi'
import type { UserCenterSecurityItem } from '@/types/userCenter'

/** 安全中心 / 总览安全矩阵共用：打开对应流程或资金密码面板 */
export function useSecurityItemAction() {
  const app = useAppStore()
  const fundPwd = useFundPasswordStore()
  const secUi = useSecurityCenterUiStore()

  function onSecurityItemAction(item: UserCenterSecurityItem) {
    if (item.id === 'fund_password') {
      fundPwd.open(item.status === 'ON' ? 'change' : 'set')
      return
    }
    if (item.id === 'password') {
      secUi.openFlow('login_pwd')
      return
    }
    if (item.id === 'email') {
      secUi.openFlow('email')
      return
    }
    if (item.id === 'phone') {
      secUi.openFlow('phone', { phoneMode: item.status === 'ON' ? 'change' : 'bind' })
      return
    }
    if (item.id === 'ga') {
      secUi.openFlow('ga', { gaManage: secUi.googleEnabled })
      return
    }
    if (item.id === 'withdraw_whitelist') {
      secUi.openFlow('withdraw_whitelist')
      return
    }
    if (item.id === 'devices') {
      secUi.openFlow('devices')
      return
    }
    app.pushToast('info', `打开「${item.title}」· 演示`)
  }

  return { onSecurityItemAction }
}
