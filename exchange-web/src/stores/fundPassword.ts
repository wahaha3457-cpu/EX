import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  changeFundPassword,
  isFundPasswordSet,
  isValidFundPasswordFormat,
  setFundPassword,
  verifyFundPassword,
} from '@/api/fundPassword/fundPasswordMock'
import { useUserCenterStore } from '@/stores/userCenter'

export type FundPasswordModalMode = 'set' | 'change'

export const useFundPasswordStore = defineStore('fundPassword', () => {
  const visible = ref(false)
  const mode = ref<FundPasswordModalMode>('set')

  const userCode = computed(() => useAuthStore().user?.userCode)
  const emailMasked = computed(() => useAuthStore().user?.emailMasked)

  const isSet = computed(() => isFundPasswordSet(userCode.value, emailMasked.value))

  function open(next: FundPasswordModalMode) {
    const m = next === 'change' && !isSet.value ? 'set' : next
    mode.value = m
    visible.value = true
  }

  function close() {
    visible.value = false
  }

  function applySecurityRow() {
    const uc = useUserCenterStore()
    const set = isFundPasswordSet(userCode.value, emailMasked.value)
    uc.patchFundPasswordRow(set)
  }

  function submitSet(password: string, confirm: string): { ok: true } | { ok: false; message: string } {
    const uc = userCode.value
    const em = emailMasked.value
    if (!uc && !em?.trim()) return { ok: false, message: '请先登录' }
    if (isFundPasswordSet(uc, em)) return { ok: false, message: '已设置资金密码，请使用「修改」' }
    if (!isValidFundPasswordFormat(password)) return { ok: false, message: '请输入 6 位数字' }
    if (password !== confirm) return { ok: false, message: '两次输入不一致' }
    try {
      setFundPassword(uc, em, password)
      applySecurityRow()
      return { ok: true }
    } catch {
      return { ok: false, message: '设置失败，请重试' }
    }
  }

  function submitChange(
    oldPwd: string,
    newPwd: string,
    confirm: string,
  ): { ok: true } | { ok: false; message: string } {
    const uc = userCode.value
    const em = emailMasked.value
    if (!uc && !em?.trim()) return { ok: false, message: '请先登录' }
    if (!isValidFundPasswordFormat(newPwd)) return { ok: false, message: '新密码须为 6 位数字' }
    if (newPwd !== confirm) return { ok: false, message: '两次新密码不一致' }
    if (newPwd === oldPwd) return { ok: false, message: '新密码不能与旧密码相同' }
    const r = changeFundPassword(uc, em, oldPwd, newPwd)
    if (!r.ok) {
      if (r.reason === 'BAD_OLD') return { ok: false, message: '原资金密码错误' }
      if (r.reason === 'NOT_SET') return { ok: false, message: '尚未设置资金密码' }
      return { ok: false, message: '新密码格式无效' }
    }
    applySecurityRow()
    return { ok: true }
  }

  function verifyForWithdraw(pwd: string): boolean {
    return verifyFundPassword(userCode.value, emailMasked.value, pwd)
  }

  return {
    visible,
    mode,
    isSet,
    open,
    close,
    submitSet,
    submitChange,
    verifyForWithdraw,
    isValidFundPasswordFormat,
  }
})
