<script setup lang="ts">
/**
 * 安全中心 · 各安全项完整交互流程（演示，对标头部交易所分步验证与文案节奏）。
 * 由账户工作台 AccountHubLayout 统一挂载；安全子页与总览共用。
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSecurityCenterUiStore } from '@/stores/securityCenterUi'
import { useUserCenterStore } from '@/stores/userCenter'
import { useAppStore } from '@/stores/app'
import ExPasswordRevealInput from '@/components/common/ExPasswordRevealInput.vue'
import ExSixDigitPinInput from '@/components/common/ExSixDigitPinInput.vue'

const ui = useSecurityCenterUiStore()
const uc = useUserCenterStore()
const app = useAppStore()

const {
  activeFlow,
  flowStep,
  phoneFlowMode,
  gaManageOnly,
  phoneBound,
  phoneMasked,
  emailMaskedOverride,
  gaDemoSecret,
  whitelistRows,
  deviceRows,
  whitelistEnabled,
} = storeToRefs(ui)

const { payload: ucPayload } = storeToRefs(uc)

const emailMasked = computed(
  () => emailMaskedOverride.value ?? ucPayload.value?.overview?.emailMasked ?? '—',
)

const otp = ref('')
const otpNew = ref('')
const countdown = ref(0)
const countdownNew = ref(0)
let tick: ReturnType<typeof setInterval> | null = null

const loginOld = ref('')
const loginOld2 = ref('')
const loginNew = ref('')
const loginNew2 = ref('')

const emailNew = ref('')

const phoneInput = ref('')
const smsCode = ref('')

const gaTotp = ref('')
const backupCodes = ref<string[]>([])

const whitelistAgree = ref(false)
const wlNetwork = ref('TRON (USDT)')
const wlAddress = ref('')
const wlLabel = ref('')

const deviceRemoveId = ref<string | null>(null)

function startCountdown(target: 'primary' | 'newAddr') {
  const setter = target === 'primary' ? countdown : countdownNew
  if (setter.value > 0) return
  setter.value = 60
  if (tick) clearInterval(tick)
  tick = setInterval(() => {
    setter.value -= 1
    if (setter.value <= 0 && tick) {
      clearInterval(tick)
      tick = null
    }
  }, 1000)
  app.pushToast('info', '验证码已发送（演示），请输入任意 6 位数字完成校验')
}

function close() {
  deviceRemoveId.value = null
  ui.closeFlow()
}

const flowTitle = computed(() => {
  switch (activeFlow.value) {
    case 'login_pwd':
      return '修改登录密码'
    case 'email':
      return '更换绑定邮箱'
    case 'phone':
      return phoneFlowMode.value === 'change' ? '更换绑定手机' : '绑定手机'
    case 'ga':
      return gaManageOnly.value ? 'Google 验证器' : '开启 Google 验证器'
    case 'withdraw_whitelist':
      return '提现地址白名单'
    case 'devices':
      return '设备管理'
    default:
      return '安全验证'
  }
})

const stepDots = computed(() => {
  if (activeFlow.value === 'login_pwd') return ['安全验证', '设置新密码', '完成'] as const
  if (activeFlow.value === 'email') return ['验证身份', '绑定新邮箱', '完成'] as const
  if (activeFlow.value === 'phone') return ['安全验证', '完成'] as const
  if (activeFlow.value === 'ga' && !gaManageOnly.value) return ['绑定验证器', '备份密钥', '完成'] as const
  return [] as const
})

function resetForm() {
  otp.value = ''
  otpNew.value = ''
  loginOld.value = ''
  loginOld2.value = ''
  loginNew.value = ''
  loginNew2.value = ''
  emailNew.value = ''
  phoneInput.value = ''
  smsCode.value = ''
  gaTotp.value = ''
  whitelistAgree.value = false
  wlAddress.value = ''
  wlLabel.value = ''
  wlNetwork.value = 'TRON (USDT)'
  if (tick) {
    clearInterval(tick)
    tick = null
  }
  countdown.value = 0
  countdownNew.value = 0
}

watch(activeFlow, (f) => {
  resetForm()
  backupCodes.value = []
  deviceRemoveId.value = null
  if (f === 'ga' && !gaManageOnly.value) {
    backupCodes.value = Array.from({ length: 8 }, () =>
      Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, '0').slice(0, 8),
    )
  }
})

onUnmounted(() => {
  if (tick) clearInterval(tick)
})

function assertOtp(code: string): boolean {
  if (code.length !== 6) {
    app.pushToast('error', '请输入 6 位验证码')
    return false
  }
  return true
}

/* —— 登录密码 —— */
function submitLoginStep0() {
  if (!assertOtp(otp.value)) return
  ui.nextStep()
}

function submitLoginStep1() {
  if (loginOld.value.length < 8) {
    app.pushToast('error', '请输入当前登录密码（至少 8 位）')
    return
  }
  if (loginOld.value !== loginOld2.value) {
    app.pushToast('error', '两次输入的当前密码不一致，请核对后重试')
    return
  }
  if (loginNew.value.length < 8) {
    app.pushToast('error', '新密码至少 8 位，建议包含大小写字母与数字')
    return
  }
  if (loginNew.value !== loginNew2.value) {
    app.pushToast('error', '两次输入的新密码不一致')
    return
  }
  if (loginNew.value === loginOld.value) {
    app.pushToast('error', '新密码不能与当前密码相同')
    return
  }
  ui.nextStep()
  app.pushToast('success', '登录密码已更新（演示）')
}

/* —— 邮箱 —— */
function submitEmailStep0() {
  if (!assertOtp(otp.value)) return
  ui.nextStep()
}

function submitEmailStep1() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNew.value.trim())) {
    app.pushToast('error', '请输入有效邮箱')
    return
  }
  if (!assertOtp(otpNew.value)) return
  ui.applyEmailChange(emailNew.value.trim())
  ui.nextStep()
  app.pushToast('success', '邮箱已更换（演示）')
}

/* —— 手机 —— */
function submitPhoneStep0() {
  const d = phoneInput.value.replace(/\D/g, '')
  if (d.length < 11) {
    app.pushToast('error', '请输入有效手机号码')
    return
  }
  if (!assertOtp(smsCode.value)) return
  ui.bindPhone(d)
  ui.nextStep()
  app.pushToast('success', phoneFlowMode.value === 'change' ? '手机号已更换（演示）' : '手机绑定成功（演示）')
}

/* —— Google —— */
function submitGaStep0() {
  if (gaTotp.value.length !== 6 || gaTotp.value === '000000') {
    app.pushToast('error', '请输入验证器中的 6 位动态码（演示可填 123456）')
    return
  }
  ui.nextStep()
}

function submitGaStep1() {
  ui.enableGoogle()
  ui.nextStep()
  app.pushToast('success', 'Google 验证器已开启（演示）')
}

function onDisableGa() {
  ui.disableGoogle()
  app.pushToast('success', '已关闭 Google 验证器（演示）')
  close()
}

/* —— 白名单 —— */
function enableWhitelist() {
  if (!whitelistAgree.value) {
    app.pushToast('warning', '请勾选知晓提现白名单风险')
    return
  }
  ui.setWhitelistEnabled(true)
  app.pushToast('success', '提现白名单已开启（演示）')
  ui.setStep(1)
}

function finishWhitelistIntro() {
  ui.setStep(0)
  close()
}

function submitAddWhitelist() {
  const addr = wlAddress.value.trim()
  if (addr.length < 16) {
    app.pushToast('error', '请填写有效提现地址')
    return
  }
  ui.addWhitelistDemo({
    network: wlNetwork.value,
    address: `${addr.slice(0, 10)}…${addr.slice(-6)}`,
    label: wlLabel.value.trim() || '主地址',
  })
  app.pushToast('success', '地址已加入白名单（演示）')
  wlAddress.value = ''
  wlLabel.value = ''
  ui.setStep(0)
}

function disableWhitelist() {
  ui.setWhitelistEnabled(false)
  app.pushToast('info', '已关闭提现白名单（演示）')
  close()
}

/* —— 设备 —— */
function confirmRemoveDevice() {
  if (!deviceRemoveId.value) return
  ui.removeDevice(deviceRemoveId.value)
  deviceRemoveId.value = null
  app.pushToast('success', '已移除该设备登录态（演示）')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="activeFlow"
      class="scf-overlay"
      role="presentation"
      @click.self="close"
    >
      <div
        class="scf"
        role="dialog"
        aria-modal="true"
        :aria-label="flowTitle"
        @click.stop
      >
        <header class="scf__head">
          <div class="scf__head-txt">
            <h2 class="scf__title">{{ flowTitle }}</h2>
            <p class="scf__sub">以下为前端演示流程，正式环境以服务端风控与短信/邮件为准。</p>
          </div>
          <button type="button" class="scf__x" aria-label="关闭" @click="close">×</button>
        </header>

        <!-- 步骤条 -->
        <div v-if="stepDots.length && !gaManageOnly && activeFlow !== 'withdraw_whitelist' && activeFlow !== 'devices'" class="scf__steps" aria-hidden="true">
          <div class="scf__steps-row">
            <template v-for="(lab, i) in stepDots" :key="lab">
              <span
                class="scf__dot"
                :class="{
                  'scf__dot--on': flowStep === i,
                  'scf__dot--done': flowStep > i,
                }"
              >{{ i + 1 }}</span>
              <span v-if="i < stepDots.length - 1" class="scf__dot-line" />
            </template>
          </div>
          <div class="scf__step-labs">
            <span v-for="(lab, i) in stepDots" :key="`l-${lab}`" class="scf__step-lab" :class="{ 'scf__step-lab--on': flowStep === i }">{{ lab }}</span>
          </div>
        </div>

        <div class="scf__body">
          <!-- 修改登录密码 -->
          <template v-if="activeFlow === 'login_pwd'">
            <section v-if="flowStep === 0" class="scf__section">
              <p class="scf__lead">为保障账户安全，修改登录密码前需验证已绑定邮箱。</p>
              <p class="scf__hint-mail">验证码已发送至 <strong>{{ emailMasked }}</strong></p>
              <div class="scf__row-btn">
                <button type="button" class="scf__linkish" :disabled="countdown > 0" @click="startCountdown('primary')">
                  {{ countdown > 0 ? `${countdown}s 后可重发` : '发送验证码' }}
                </button>
              </div>
              <label class="scf__field">
                <span class="scf__lab">邮箱验证码</span>
                <ExSixDigitPinInput v-model="otp" autocomplete="one-time-code" plain />
              </label>
            </section>
            <section v-else-if="flowStep === 1" class="scf__section">
              <p class="scf__lead">
                请先验证当前登录密码（两次输入须一致），再设置新密码；全部校验通过后点击确认修改。
              </p>
              <label class="scf__field">
                <span class="scf__lab">当前登录密码</span>
                <ExPasswordRevealInput v-model="loginOld" autocomplete="current-password" placeholder="请输入当前密码" />
              </label>
              <label class="scf__field">
                <span class="scf__lab">再次输入当前密码</span>
                <ExPasswordRevealInput v-model="loginOld2" autocomplete="current-password" placeholder="与上一栏保持一致" />
              </label>
              <label class="scf__field">
                <span class="scf__lab">新登录密码</span>
                <ExPasswordRevealInput v-model="loginNew" autocomplete="new-password" placeholder="至少 8 位，含字母与数字" />
              </label>
              <label class="scf__field">
                <span class="scf__lab">确认新密码</span>
                <ExPasswordRevealInput v-model="loginNew2" autocomplete="new-password" placeholder="再次输入" />
              </label>
            </section>
            <section v-else class="scf__section scf__section--center scf__login-pwd-done">
              <div class="scf__login-pwd-done-card" role="status">
                <div class="scf__login-pwd-done-glow" aria-hidden="true" />
                <div class="scf__login-pwd-done-badge" aria-hidden="true">
                  <span class="scf__login-pwd-done-check">✓</span>
                </div>
                <p class="scf__login-pwd-done-ribbon">修改成功</p>
                <h3 class="scf__login-pwd-done-title">登录密码已更新</h3>
                <p class="scf__login-pwd-done-desc">
                  账户已使用新密码保护。建议您稍后在常用设备上重新登录以刷新会话（演示环境可继续使用）。
                </p>
              </div>
            </section>
          </template>

          <!-- 更换邮箱 -->
          <template v-else-if="activeFlow === 'email'">
            <section v-if="flowStep === 0" class="scf__section">
              <p class="scf__lead">请先验证当前绑定邮箱，再继续操作。</p>
              <p class="scf__hint-mail">验证码将发送至 <strong>{{ emailMasked }}</strong></p>
              <div class="scf__row-btn">
                <button type="button" class="scf__linkish" :disabled="countdown > 0" @click="startCountdown('primary')">
                  {{ countdown > 0 ? `${countdown}s 后可重发` : '发送验证码' }}
                </button>
              </div>
              <label class="scf__field">
                <span class="scf__lab">当前邮箱验证码</span>
                <ExSixDigitPinInput v-model="otp" autocomplete="one-time-code" plain />
              </label>
            </section>
            <section v-else-if="flowStep === 1" class="scf__section">
              <p class="scf__lead">请输入新邮箱并完成验证。</p>
              <label class="scf__field">
                <span class="scf__lab">新邮箱</span>
                <input v-model="emailNew" type="email" class="scf__input" autocomplete="off" placeholder="name@example.com" />
              </label>
              <div class="scf__row-btn">
                <button type="button" class="scf__linkish" :disabled="countdownNew > 0" @click="startCountdown('newAddr')">
                  {{ countdownNew > 0 ? `${countdownNew}s 后可重发` : '向新邮箱发送验证码' }}
                </button>
              </div>
              <label class="scf__field">
                <span class="scf__lab">新邮箱验证码</span>
                <ExSixDigitPinInput v-model="otpNew" autocomplete="one-time-code" no-auto-focus plain />
              </label>
            </section>
            <section v-else class="scf__section scf__section--center">
              <div class="scf__ok scf__ok--blue">✓</div>
              <h3 class="scf__ok-title">邮箱更换完成</h3>
              <p class="scf__ok-txt">重要通知将发送至您的新邮箱，请务必保管好邮箱安全。</p>
            </section>
          </template>

          <!-- 手机 -->
          <template v-else-if="activeFlow === 'phone'">
            <section v-if="flowStep === 0" class="scf__section">
              <p class="scf__lead">
                {{ phoneFlowMode === 'change' ? '将向新手机号发送短信验证码，请完成验证。' : '绑定手机可用于登录验证与安全通知。' }}
              </p>
              <label class="scf__field">
                <span class="scf__lab">手机号码</span>
                <input v-model="phoneInput" type="tel" class="scf__input" inputmode="numeric" placeholder="11 位手机号" maxlength="16" />
              </label>
              <div class="scf__row-btn">
                <button type="button" class="scf__linkish" :disabled="countdown > 0" @click="startCountdown('primary')">
                  {{ countdown > 0 ? `${countdown}s 后可重发` : '发送短信验证码' }}
                </button>
              </div>
              <label class="scf__field">
                <span class="scf__lab">短信验证码</span>
                <ExSixDigitPinInput v-model="smsCode" autocomplete="one-time-code" plain />
              </label>
            </section>
            <section v-else class="scf__section scf__section--center">
              <div class="scf__ok">✓</div>
              <h3 class="scf__ok-title">{{ phoneFlowMode === 'change' ? '手机号已更新' : '绑定成功' }}</h3>
              <p class="scf__ok-txt">当前绑定手机：{{ phoneBound ? phoneMasked : '—' }}</p>
            </section>
          </template>

          <!-- Google 验证器 -->
          <template v-else-if="activeFlow === 'ga'">
            <section v-if="gaManageOnly" class="scf__section">
              <p class="scf__lead">Google 验证器已开启。在进行提币等敏感操作时，将要求输入动态口令。</p>
              <ul class="scf__bullets">
                <li>请妥善保存备份密钥，勿截图外传或存储于未加密网盘。</li>
                <li>换机前请先在旧设备或备份码完成迁移（演示）。</li>
              </ul>
              <button type="button" class="scf__danger" @click="onDisableGa">关闭验证器（演示）</button>
            </section>
            <template v-else>
              <section v-if="flowStep === 0" class="scf__section">
                <p class="scf__lead">在 App Store / Google Play 下载 Google Authenticator，扫描下方密钥或手动录入。</p>
                <div class="scf__ga-box">
                  <div class="scf__ga-qr" aria-hidden="true" />
                  <div class="scf__ga-secret">
                    <span class="scf__lab">密钥（演示）</span>
                    <code class="scf__code">{{ gaDemoSecret }}</code>
                    <span class="scf__mini">请离线保存，丢失后可能影响账户恢复。</span>
                  </div>
                </div>
                <label class="scf__field">
                  <span class="scf__lab">输入 6 位动态码</span>
                  <ExSixDigitPinInput v-model="gaTotp" autocomplete="one-time-code" plain />
                </label>
              </section>
              <section v-else-if="flowStep === 1" class="scf__section">
                <p class="scf__lead">请将以下备份码抄写在安全位置。每枚备份码仅可使用一次。</p>
                <div class="scf__backup-grid">
                  <code v-for="(c, i) in backupCodes" :key="i" class="scf__backup-cell">{{ c }}</code>
                </div>
              </section>
              <section v-else class="scf__section scf__section--center">
                <div class="scf__ok">✓</div>
                <h3 class="scf__ok-title">验证器已绑定</h3>
                <p class="scf__ok-txt">您的账户安全等级已提升。请牢记备份码存放位置。</p>
              </section>
            </template>
          </template>

          <!-- 提现白名单 -->
          <template v-else-if="activeFlow === 'withdraw_whitelist'">
            <section v-if="!whitelistEnabled && flowStep === 0" class="scf__section">
              <p class="scf__lead">开启后，仅可向白名单内的地址发起提现，可降低鱼叉攻击与错填地址风险。</p>
              <ul class="scf__bullets">
                <li>首次添加地址后可能存在复核时间（演示省略）。</li>
                <li>关闭白名单或删除地址需谨慎，建议在安全网络环境下操作。</li>
              </ul>
              <label class="scf__check">
                <input v-model="whitelistAgree" type="checkbox" class="scf__cb" />
                <span>我已阅读并理解上述风险，自愿承担相应后果。</span>
              </label>
            </section>
            <section v-else-if="!whitelistEnabled && flowStep === 1" class="scf__section scf__section--center">
              <div class="scf__ok scf__ok--blue">✓</div>
              <h3 class="scf__ok-title">白名单已开启</h3>
              <p class="scf__ok-txt">您可继续添加常用提现地址，或稍后在「安全中心」中管理。</p>
            </section>
            <template v-else>
              <section v-if="flowStep === 0" class="scf__section">
                <p class="scf__lead">仅下列地址可接收提现资产。添加新地址后请耐心等待风控校验（演示）。</p>
                <ul v-if="whitelistRows.length" class="scf__wl-list">
                  <li v-for="w in whitelistRows" :key="w.id" class="scf__wl-item">
                    <div class="scf__wl-net">{{ w.network }}</div>
                    <div class="scf__wl-addr">{{ w.address }}</div>
                    <div class="scf__wl-lab">{{ w.label }}</div>
                  </li>
                </ul>
                <p v-else class="scf__empty-note">暂无白名单地址，请添加至少一个常用地址。</p>
                <button type="button" class="scf__linkish scf__linkish--block" @click="ui.setStep(1)">＋ 添加提现地址</button>
                <button type="button" class="scf__danger scf__danger--ghost" @click="disableWhitelist">关闭提现白名单</button>
              </section>
              <section v-else class="scf__section">
                <p class="scf__lead">填写链上地址信息（演示数据不会上链）。</p>
                <label class="scf__field">
                  <span class="scf__lab">网络</span>
                  <select v-model="wlNetwork" class="scf__input scf__select">
                    <option>TRON (USDT)</option>
                    <option>Ethereum (USDT)</option>
                    <option>Bitcoin</option>
                  </select>
                </label>
                <label class="scf__field">
                  <span class="scf__lab">提现地址</span>
                  <input v-model="wlAddress" type="text" class="scf__input scf__input--mono" placeholder="粘贴完整地址" autocomplete="off" />
                </label>
                <label class="scf__field">
                  <span class="scf__lab">备注</span>
                  <input v-model="wlLabel" type="text" class="scf__input" placeholder="例如：主钱包" />
                </label>
              </section>
            </template>
          </template>

          <!-- 设备管理 -->
          <template v-else-if="activeFlow === 'devices'">
            <section class="scf__section">
              <p class="scf__lead">以下为您近期登录过的设备。若发现异常，请立即移除并修改密码。</p>
              <ul class="scf__dev-list">
                <li v-for="d in deviceRows" :key="d.id" class="scf__dev-item">
                  <div class="scf__dev-main">
                    <span class="scf__dev-name">{{ d.label }}</span>
                    <span v-if="d.current" class="scf__dev-badge">本机</span>
                  </div>
                  <div class="scf__dev-meta">{{ d.ip }} · {{ d.lastSeenLabel }}</div>
                  <button
                    v-if="!d.current"
                    type="button"
                    class="scf__dev-remove"
                    @click="deviceRemoveId = d.id"
                  >
                    移除
                  </button>
                </li>
              </ul>
            </section>
          </template>
        </div>

        <!-- 移除设备确认 -->
        <div v-if="deviceRemoveId" class="scf__confirm" role="alertdialog">
          <p class="scf__confirm-txt">确定移除该设备？移除后在该设备上需重新登录。</p>
          <div class="scf__confirm-btns">
            <button type="button" class="scf__btn scf__btn--ghost" @click="deviceRemoveId = null">取消</button>
            <button type="button" class="scf__btn scf__btn--danger" @click="confirmRemoveDevice">移除</button>
          </div>
        </div>

        <footer class="scf__foot">
          <template v-if="activeFlow === 'login_pwd'">
            <button type="button" class="scf__btn scf__btn--ghost" @click="close">取消</button>
            <button v-if="flowStep === 0" type="button" class="scf__btn scf__btn--primary" @click="submitLoginStep0">下一步</button>
            <button v-else-if="flowStep === 1" type="button" class="scf__btn scf__btn--primary" @click="submitLoginStep1">确认修改</button>
            <button v-else type="button" class="scf__btn scf__btn--primary" @click="close">完成</button>
          </template>
          <template v-else-if="activeFlow === 'email'">
            <button type="button" class="scf__btn scf__btn--ghost" @click="close">取消</button>
            <button v-if="flowStep === 0" type="button" class="scf__btn scf__btn--primary" @click="submitEmailStep0">下一步</button>
            <button v-else-if="flowStep === 1" type="button" class="scf__btn scf__btn--primary" @click="submitEmailStep1">确认更换</button>
            <button v-else type="button" class="scf__btn scf__btn--primary" @click="close">完成</button>
          </template>
          <template v-else-if="activeFlow === 'phone'">
            <button type="button" class="scf__btn scf__btn--ghost" @click="close">取消</button>
            <button v-if="flowStep === 0" type="button" class="scf__btn scf__btn--primary" @click="submitPhoneStep0">提交</button>
            <button v-else type="button" class="scf__btn scf__btn--primary" @click="close">完成</button>
          </template>
          <template v-else-if="activeFlow === 'ga'">
            <button type="button" class="scf__btn scf__btn--ghost" @click="close">{{ gaManageOnly ? '关闭' : '取消' }}</button>
            <template v-if="!gaManageOnly">
              <button v-if="flowStep === 0" type="button" class="scf__btn scf__btn--primary" @click="submitGaStep0">下一步</button>
              <button v-else-if="flowStep === 1" type="button" class="scf__btn scf__btn--primary" @click="submitGaStep1">完成绑定</button>
              <button v-else type="button" class="scf__btn scf__btn--primary" @click="close">完成</button>
            </template>
          </template>
          <template v-else-if="activeFlow === 'withdraw_whitelist'">
            <button type="button" class="scf__btn scf__btn--ghost" @click="close">关闭</button>
            <template v-if="!whitelistEnabled">
              <button v-if="flowStep === 0" type="button" class="scf__btn scf__btn--primary" @click="enableWhitelist">确认开启</button>
              <button v-else type="button" class="scf__btn scf__btn--primary" @click="finishWhitelistIntro">完成</button>
            </template>
            <template v-else>
              <button v-if="flowStep === 0" type="button" class="scf__btn scf__btn--primary" @click="close">完成</button>
              <template v-else>
                <button type="button" class="scf__btn scf__btn--ghost" @click="ui.setStep(0)">返回</button>
                <button type="button" class="scf__btn scf__btn--primary" @click="submitAddWhitelist">保存地址</button>
              </template>
            </template>
          </template>
          <template v-else-if="activeFlow === 'devices'">
            <button type="button" class="scf__btn scf__btn--primary" @click="close">完成</button>
          </template>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.scf-overlay {
  position: fixed;
  inset: 0;
  z-index: 571;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.scf {
  width: 100%;
  max-width: 460px;
  max-height: min(90vh, 720px);
  display: flex;
  flex-direction: column;
  border-radius: $radius-md;
  border: 1px solid rgba(240, 185, 11, 0.22);
  background: var(--ex-modal-surface, var(--ex-card-surface));
  box-shadow: var(--ex-modal-shadow-elevated);
}

.scf__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-4;
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;
}

.scf__head-txt {
  min-width: 0;
}

.scf__title {
  margin: 0 0 $space-2;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.scf__sub {
  margin: 0;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.scf__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.scf__steps {
  padding: $space-3 $space-4 0;
  flex-shrink: 0;
}

.scf__steps-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px 0;
}

.scf__dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: $font-weight-bold;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-tertiary;
}

.scf__dot--on {
  background: rgba(240, 185, 11, 0.22);
  color: $color-brand;
  box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.35);
}

.scf__dot--done {
  background: rgba(14, 203, 129, 0.18);
  color: $color-rise;
}

.scf__dot-line {
  display: inline-block;
  width: 20px;
  height: 2px;
  margin: 0 4px;
  vertical-align: middle;
  background: var(--ex-border-subtle);
  border-radius: 1px;
}

.scf__step-labs {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  gap: $space-1;
}

.scf__step-lab {
  flex: 1;
  font-size: 9px;
  color: $color-text-tertiary;
  text-align: center;
  line-height: 1.2;
}

.scf__step-lab--on {
  color: $color-brand;
  font-weight: $font-weight-bold;
}

.scf__body {
  padding: $space-4;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.scf__section {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.scf__section--center {
  align-items: center;
  text-align: center;
  padding: $space-2 0;
}

.scf__lead {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.55;
}

.scf__hint-mail {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;

  strong {
    color: $color-text-primary;
  }
}

.scf__row-btn {
  margin-top: -6px;
}

.scf__linkish {
  padding: 0;
  border: none;
  background: none;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: #8ab4ff;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.scf__linkish:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  text-decoration: none;
}

.scf__linkish--block {
  display: block;
  width: 100%;
  text-align: center;
  padding: $space-2;
  margin-top: $space-2;
  border-radius: $radius-sm;
  border: 1px dashed rgba(240, 185, 11, 0.4);
  text-decoration: none;
  color: $color-brand;
  background: rgba(240, 185, 11, 0.06);
}

.scf__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scf__lab {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
}

.scf__input {
  padding: 11px $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-size: $font-size-sm;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.45);
  }
}

.scf__input--mono {
  font-family: $font-family-mono;
  font-size: $font-size-xs;
}

.scf__select {
  cursor: pointer;
}

.scf__bullets {
  margin: 0;
  padding-left: $space-5;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.55;
}

.scf__check {
  display: flex;
  gap: $space-2;
  font-size: 11px;
  color: $color-text-secondary;
  cursor: pointer;
  align-items: flex-start;
}

.scf__cb {
  margin-top: 2px;
  accent-color: $color-brand;
  flex-shrink: 0;
}

.scf__ga-box {
  display: flex;
  gap: $space-3;
  align-items: stretch;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
}

.scf__ga-qr {
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  border-radius: $radius-sm;
  background: repeating-conic-gradient(#2a2d35 0% 25%, #1a1d24 0% 50%) 50% / 12px 12px;
  border: 1px solid $color-border;
}

.scf__ga-secret {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scf__code {
  font-size: $font-size-sm;
  font-family: $font-family-mono;
  color: $color-rise;
  word-break: break-all;
}

.scf__mini {
  font-size: 10px;
  color: $color-text-tertiary;
}

.scf__backup-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-2;
}

.scf__backup-cell {
  padding: $space-2;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset);
  font-size: 11px;
  font-family: $font-family-mono;
  text-align: center;
  color: $color-text-primary;
}

.scf__ok {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: $font-weight-bold;
  color: var(--ex-on-brand);
  background: linear-gradient(135deg, #32d296, #0ecb81);
  box-shadow: 0 8px 22px rgba(14, 203, 129, 0.22);
}

.scf__ok--blue {
  background: linear-gradient(135deg, #5b8cff, #3084fc);
  box-shadow: 0 8px 22px rgba(48, 132, 252, 0.22);
}

.scf__ok-title {
  margin: $space-3 0 $space-2;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.scf__ok-txt {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
  max-width: 340px;
}

/* 修改登录密码 · 完成态 */
.scf__login-pwd-done {
  padding: $space-2 0 $space-1;
}

.scf__login-pwd-done-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: $space-4 $space-4 $space-3;
  border-radius: $radius-md;
  border: 1px solid rgba(14, 203, 129, 0.35);
  background: linear-gradient(
    165deg,
    rgba(14, 203, 129, 0.12) 0%,
    rgba(14, 203, 129, 0.04) 42%,
    var(--ex-surface-inset, rgba(255, 255, 255, 0.02)) 100%
  );
  box-shadow:
    0 0 0 1px rgba(14, 203, 129, 0.08),
    0 14px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.scf__login-pwd-done-glow {
  position: absolute;
  inset: -40% -20% auto;
  height: 120px;
  background: radial-gradient(ellipse at 50% 0%, rgba(14, 203, 129, 0.35), transparent 70%);
  pointer-events: none;
}

.scf__login-pwd-done-badge {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #3ee4a8, #0ecb81);
  color: #0b1530;
  box-shadow:
    0 0 0 4px rgba(14, 203, 129, 0.2),
    0 12px 28px rgba(14, 203, 129, 0.35);
}

.scf__login-pwd-done-check {
  font-size: 34px;
  font-weight: $font-weight-bold;
  line-height: 1;
}

.scf__login-pwd-done-ribbon {
  margin: $space-3 0 0;
  font-size: 11px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: $color-rise;
  text-shadow: 0 0 24px rgba(14, 203, 129, 0.35);
}

.scf__login-pwd-done-title {
  margin: $space-2 0 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.scf__login-pwd-done-desc {
  margin: $space-2 0 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.6;
}

.scf__danger {
  margin-top: $space-2;
  padding: 10px $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid rgba(246, 70, 93, 0.45);
  background: rgba(246, 70, 93, 0.1);
  color: $color-fall;
  cursor: pointer;
}

.scf__danger--ghost {
  background: transparent;
  margin-top: $space-4;
}

.scf__wl-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.scf__wl-item {
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-surface-inset);
}

.scf__wl-net {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-brand;
  margin-bottom: 4px;
}

.scf__wl-addr {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  word-break: break-all;
  color: $color-text-primary;
}

.scf__wl-lab {
  font-size: 10px;
  color: $color-text-tertiary;
  margin-top: 4px;
}

.scf__empty-note {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.scf__dev-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.scf__dev-item {
  position: relative;
  padding: $space-3 $space-10 $space-3 $space-3;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
}

.scf__dev-main {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: 4px;
}

.scf__dev-name {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.scf__dev-badge {
  font-size: 9px;
  font-weight: $font-weight-bold;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(48, 132, 252, 0.18);
  color: #8ab4ff;
}

.scf__dev-meta {
  font-size: 10px;
  color: $color-text-tertiary;
}

.scf__dev-remove {
  position: absolute;
  right: $space-3;
  top: 50%;
  transform: translateY(-50%);
  padding: 6px $space-2;
  font-size: 10px;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-secondary;
  cursor: pointer;
}

.scf__dev-remove:hover {
  border-color: $color-fall;
  color: $color-fall;
}

.scf__confirm {
  margin: 0 $space-4;
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(246, 70, 93, 0.35);
  background: rgba(246, 70, 93, 0.08);
}

.scf__confirm-txt {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
}

.scf__confirm-btns {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
}

.scf__foot {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
  flex-shrink: 0;
}

.scf__btn {
  padding: 10px $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.scf__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.scf__btn--primary {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
}

.scf__btn--danger {
  background: $color-fall;
  color: #fff;
  border: none;
}
</style>
