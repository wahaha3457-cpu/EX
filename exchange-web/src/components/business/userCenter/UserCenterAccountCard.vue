<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useUserCenterStore } from '@/stores/userCenter'
import type { UserKycStatus } from '@/types/userCenter'
import {
  VIP_TIER_TABLE,
  defaultDemo30dVolumeForTier,
  formatVolUsdt,
  nextTierInfo,
  vipFloorFromAccountTier,
  vipLevelFrom30dVolume,
} from '@/constants/vipTiers'
import { readUcProfileOverlay, writeUcProfileOverlay, type UcProfileOverlay } from '@/utils/userCenter/profileOverlayStorage'
import { fileToAvatarDataUrl } from '@/utils/image/avatarDataUrl'

const auth = useAuthStore()
const app = useAppStore()
const ucStore = useUserCenterStore()
const { account, displayUid, loading, overview } = storeToRefs(ucStore)

const overlay = ref<UcProfileOverlay>({})
const fileRef = ref<HTMLInputElement | null>(null)
const editingName = ref(false)
const draftName = ref('')
const vipDialogOpen = ref(false)
const demoVolDraft = ref('')

function reloadOverlay() {
  const code = auth.user?.userCode
  overlay.value = code ? readUcProfileOverlay(code) : {}
}

onMounted(reloadOverlay)
watch(() => auth.user?.userCode, reloadOverlay)

const displayNickname = computed(() => {
  const o = overlay.value.displayNickname?.trim()
  if (o) return o
  const n = auth.user?.nickname?.trim()
  if (n) return n
  return '未设置昵称'
})

const avatarSrc = computed(() => overlay.value.avatarDataUrl ?? auth.user?.avatarUrl ?? '')

const nameInitial = computed(() => {
  const s = displayNickname.value.trim()
  const ch = s ? s[0] : 'U'
  return /[a-z]/i.test(ch) ? ch.toUpperCase() : ch
})

const volume30dUsdt = computed(() => {
  const v = overlay.value.mock30dVolumeUsdt
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return v
  if (account.value) return defaultDemo30dVolumeForTier(account.value.accountTier)
  return 0
})

const vipLevel = computed(() => {
  const vol = volume30dUsdt.value
  const fromVol = vipLevelFrom30dVolume(vol)
  const floor = account.value ? vipFloorFromAccountTier(account.value.accountTier) : 0
  return Math.max(fromVol, floor)
})

const vipRow = computed(() => VIP_TIER_TABLE.find((r) => r.level === vipLevel.value) ?? VIP_TIER_TABLE[0])

const nextTier = computed(() => nextTierInfo(vipLevel.value))

const roleLabel = computed(() => {
  if (auth.user?.roles?.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN')) return '管理员'
  return '普通用户'
})

function kycLabel(s: UserKycStatus | undefined) {
  const m: Record<UserKycStatus, string> = {
    NONE: '未认证',
    PENDING: '审核中',
    VERIFIED: '已认证',
    REJECTED: '未通过',
  }
  return s ? m[s] ?? s : '—'
}

function kycClass(s: UserKycStatus | undefined) {
  if (s === 'VERIFIED') return 'uc-card__kyc--ok'
  if (s === 'PENDING') return 'uc-card__kyc--pend'
  if (s === 'REJECTED') return 'uc-card__kyc--bad'
  return 'uc-card__kyc--muted'
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

const securityLabel = computed(() => {
  const lv = account.value?.securityLevel
  if (lv === 'HIGH') return '高'
  if (lv === 'MEDIUM') return '中'
  if (lv === 'LOW') return '低'
  return '—'
})

const securityClass = computed(() => {
  const lv = account.value?.securityLevel
  if (lv === 'HIGH') return 'uc-card__sec--high'
  if (lv === 'MEDIUM') return 'uc-card__sec--mid'
  if (lv === 'LOW') return 'uc-card__sec--low'
  return 'uc-card__sec--na'
})

function triggerAvatarPick() {
  fileRef.value?.click()
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

async function onAvatarFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !auth.user?.userCode) return
  if (!ALLOWED.includes(file.type)) {
    app.pushToast('error', '仅支持 JPG、PNG、WebP')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    app.pushToast('error', '图片请小于 5MB')
    return
  }
  try {
    const dataUrl = await fileToAvatarDataUrl(file)
    overlay.value = writeUcProfileOverlay(auth.user.userCode, { avatarDataUrl: dataUrl })
    auth.patchUser({ avatarUrl: dataUrl })
    app.pushToast('success', '头像已更新')
  } catch {
    app.pushToast('error', '头像处理失败，请换一张试试')
  }
}

function clearAvatar() {
  const code = auth.user?.userCode
  if (!code) return
  overlay.value = writeUcProfileOverlay(code, { avatarDataUrl: null })
  auth.patchUser({ avatarUrl: undefined })
  app.pushToast('info', '已移除本地上传头像')
}

function startEditName() {
  draftName.value =
    overlay.value.displayNickname?.trim() || auth.user?.nickname?.trim() || ''
  editingName.value = true
}

function cancelEditName() {
  editingName.value = false
}

function saveDisplayName() {
  const code = auth.user?.userCode
  if (!code) return
  const t = draftName.value.trim()
  if (t.length < 2 || t.length > 32) {
    app.pushToast('error', '昵称请填写 2–32 个字符')
    return
  }
  overlay.value = writeUcProfileOverlay(code, { displayNickname: t })
  auth.patchUser({ nickname: t })
  editingName.value = false
  app.pushToast('success', '昵称已保存')
}

async function copyUid() {
  const u = displayUid.value
  if (!u || u === '—') return
  try {
    await navigator.clipboard.writeText(u)
    app.pushToast('success', 'UID 已复制')
  } catch {
    app.pushToast('error', '复制失败，请手动选择')
  }
}

function openVipDialog() {
  demoVolDraft.value = String(Math.round(volume30dUsdt.value))
  vipDialogOpen.value = true
}

function saveDemoVolume() {
  const code = auth.user?.userCode
  if (!code) return
  const n = Number(demoVolDraft.value.replace(/,/g, '').trim())
  if (!Number.isFinite(n) || n < 0) {
    app.pushToast('error', '请输入有效的交易量数字')
    return
  }
  overlay.value = writeUcProfileOverlay(code, { mock30dVolumeUsdt: n })
  vipDialogOpen.value = false
  app.pushToast('success', '演示交易量已更新，VIP 将按规则重算')
}

function resetDemoVolume() {
  const code = auth.user?.userCode
  if (!code || !account.value) return
  overlay.value = writeUcProfileOverlay(code, { mock30dVolumeUsdt: undefined })
  vipDialogOpen.value = false
  app.pushToast('info', '已恢复为按账户标签估算的演示交易量')
}
</script>

<template>
  <section class="uc-card" aria-label="账户信息">
    <div v-if="loading" class="uc-card__loading">加载中…</div>
    <template v-else>
      <div class="uc-card__hero">
        <div class="uc-card__avatar-col">
          <div class="uc-card__avatar-wrap">
            <img v-if="avatarSrc" :src="avatarSrc" alt="" class="uc-card__avatar-img" />
            <div v-else class="uc-card__avatar-fallback" aria-hidden="true">
              {{ nameInitial }}
            </div>
            <button type="button" class="uc-card__avatar-shade" aria-label="上传头像" @click="triggerAvatarPick" />
            <span class="uc-card__avatar-hint" aria-hidden="true">更换</span>
          </div>
          <input
            ref="fileRef"
            type="file"
            class="uc-card__file"
            accept="image/jpeg,image/png,image/webp"
            @change="onAvatarFile"
          />
          <button v-if="avatarSrc" type="button" class="uc-card__avatar-remove" @click="clearAvatar">
            移除头像
          </button>
        </div>

        <div class="uc-card__identity">
          <div class="uc-card__name-block">
            <template v-if="!editingName">
              <h2 class="uc-card__name">{{ displayNickname }}</h2>
              <button type="button" class="uc-card__icon-btn" title="编辑昵称" @click="startEditName">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5z"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </template>
            <div v-else class="uc-card__name-edit">
              <input
                v-model="draftName"
                type="text"
                class="uc-card__name-input"
                maxlength="32"
                placeholder="2–32 个字符"
                @keydown.enter.prevent="saveDisplayName"
              />
              <button type="button" class="uc-card__btn uc-card__btn--primary" @click="saveDisplayName">
                保存
              </button>
              <button type="button" class="uc-card__btn" @click="cancelEditName">取消</button>
            </div>
          </div>

          <div class="uc-card__uid-row">
            <span class="uc-card__uid-label">UID</span>
            <span class="uc-card__uid ex-num">{{ displayUid }}</span>
            <button type="button" class="uc-card__btn uc-card__btn--ghost" @click="copyUid">复制</button>
          </div>

          <div class="uc-card__pills" role="list">
            <button type="button" class="uc-card__pill uc-card__pill--vip" role="listitem" @click="openVipDialog">
              <span class="uc-card__pill-k">VIP</span>
              <span class="uc-card__pill-v ex-num">{{ vipLevel }}</span>
              <span class="uc-card__pill-more">规则</span>
            </button>
            <span class="uc-card__pill uc-card__pill--role" role="listitem">{{ roleLabel }}</span>
            <RouterLink
              :to="{ name: RouteNames.Verification }"
              class="uc-card__pill uc-card__pill--kyc"
              :class="kycClass(overview?.kycStatus)"
              role="listitem"
            >
              <span>{{ kycLabel(overview?.kycStatus) }}</span>
              <span v-if="(overview?.kycTier ?? 0) >= 1" class="uc-card__kyc-tier ex-num"> · Lv.{{ overview?.kycTier }}</span>
              <span class="uc-card__chev" aria-hidden="true">›</span>
            </RouterLink>
          </div>
          <p class="uc-card__fine">
            头像与昵称为<strong>演示</strong>本地保存；生产请对接
            <code class="uc-card__code">PUT /v1/users/profile</code> 与 VIP 快照接口。
          </p>
        </div>
      </div>

      <div class="uc-card__divider" />

      <div class="uc-card__lower">
        <div class="uc-card__meta">
          <div class="uc-card__cell">
            <span class="uc-card__k">注册时间</span>
            <span class="uc-card__v">{{ account ? formatTime(account.registeredAt) : '—' }}</span>
          </div>
          <div class="uc-card__cell">
            <span class="uc-card__k">最近登录</span>
            <span class="uc-card__v">{{ account ? formatTime(account.lastLoginAt) : '—' }}</span>
          </div>
          <div class="uc-card__cell">
            <span class="uc-card__k">登录 IP</span>
            <span class="uc-card__v uc-card__mono">{{ account?.lastLoginIp ?? '—' }}</span>
          </div>
        </div>
        <div class="uc-card__badges">
          <div class="uc-card__badge uc-card__badge--tier">
            <span class="uc-card__badge-label">账户标签</span>
            <span class="uc-card__badge-val">{{ account?.accountTierLabel ?? '—' }}</span>
            <span class="uc-card__badge-sub">与 VIP 人工保底档位联动（演示）</span>
          </div>
          <div class="uc-card__badge" :class="securityClass">
            <span class="uc-card__badge-label">安全等级</span>
            <span class="uc-card__badge-val">{{ securityLabel }}</span>
            <span v-if="account" class="uc-card__score ex-num">{{ account.securityScore }} 分</span>
          </div>
        </div>
      </div>
    </template>

    <el-dialog
      v-model="vipDialogOpen"
      title="VIP 等级说明"
      width="min(540px, 94vw)"
      class="uc-card__vip-dialog"
      append-to-body
      destroy-on-close
    >
      <p class="uc-card__vip-lead">
        当前估算 <strong class="ex-num">30 日交易量 {{ formatVolUsdt(volume30dUsdt) }} USDT</strong>，等级
        <strong>VIP {{ vipLevel }}</strong>；挂单费率约 <span class="ex-num">{{ vipRow.makerFeeBps }}</span> bp，吃单约
        <span class="ex-num">{{ vipRow.takerFeeBps }}</span> bp（示意）。
      </p>
      <p v-if="nextTier" class="uc-card__vip-next">
        下一档 VIP {{ nextTier.level }} 需 30 日交易量 ≥
        <span class="ex-num">{{ formatVolUsdt(nextTier.min30dVolumeUsdt) }}</span> USDT。
      </p>
      <p v-else class="uc-card__vip-next">已达最高演示档位 VIP 9。</p>

      <div class="uc-card__vip-table-wrap">
        <table class="uc-card__vip-table">
          <thead>
            <tr>
              <th>等级</th>
              <th>30 日交易量 ≥ (USDT)</th>
              <th>Maker</th>
              <th>Taker</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in VIP_TIER_TABLE" :key="row.level" :class="{ 'uc-card__vip-tr--on': row.level === vipLevel }">
              <td>VIP {{ row.level }}</td>
              <td class="ex-num">{{ row.min30dVolumeUsdt.toLocaleString('en-US') }}</td>
              <td class="ex-num">{{ row.makerFeeBps }} bp</td>
              <td class="ex-num">{{ row.takerFeeBps }} bp</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="uc-card__vip-demo">
        <span class="uc-card__vip-demo-label">演示：自定义 30 日交易量（USDT）</span>
        <div class="uc-card__vip-demo-row">
          <el-input v-model="demoVolDraft" placeholder="例如 1500000" clearable class="uc-card__vip-input" />
          <el-button type="primary" @click="saveDemoVolume">应用</el-button>
          <el-button @click="resetDemoVolume">恢复估算</el-button>
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.uc-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: $space-5 $space-6;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--ex-text-primary) 4%, var(--ex-bg-elevated)) 0%,
    $color-bg-elevated 38%,
    color-mix(in srgb, var(--ex-brand) 5%, var(--ex-bg-elevated)) 100%
  );
  box-shadow: $shadow-card;
}

.uc-card__loading {
  padding: $space-4;
  text-align: center;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.uc-card__hero {
  display: flex;
  flex-wrap: wrap;
  gap: $space-5;
  align-items: flex-start;
}

.uc-card__avatar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  flex-shrink: 0;
}

.uc-card__avatar-wrap {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--ex-text-primary) 10%, transparent),
    0 8px 24px rgba(0, 0, 0, 0.2);
}

.uc-card__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uc-card__avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  font-weight: $font-weight-bold;
  color: var(--ex-on-brand);
  background: var(--ex-brand);
}

.uc-card__avatar-shade {
  position: absolute;
  inset: 0;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  border-radius: 50%;
  background: transparent;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.35);
  }
}

.uc-card__avatar-hint {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.uc-card__avatar-wrap:hover .uc-card__avatar-hint {
  opacity: 1;
}

.uc-card__file {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.uc-card__avatar-remove {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;

  &:hover {
    color: $color-brand;
  }
}

.uc-card__identity {
  flex: 1;
  min-width: 0;
}

.uc-card__name-block {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
  margin-bottom: $space-2;
}

.uc-card__name {
  margin: 0;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: -0.02em;
}

.uc-card__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: var(--ex-fill-ghost);
  color: $color-text-secondary;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: $color-brand;
    border-color: color-mix(in srgb, var(--ex-brand) 35%, transparent);
  }
}

.uc-card__name-edit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
  width: 100%;
}

.uc-card__name-input {
  flex: 1;
  min-width: 160px;
  max-width: 280px;
  padding: 8px 12px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  color: $color-text-primary;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;

  &:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
  }
}

.uc-card__btn {
  padding: 8px 14px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-fill-ghost);
  color: $color-text-secondary;
  cursor: pointer;
  font-family: inherit;

  &--primary {
    background: $color-brand;
    color: var(--ex-on-brand);
    border-color: transparent;
  }

  &--ghost {
    padding: 4px 12px;
    font-weight: $font-weight-semibold;
    border-color: color-mix(in srgb, var(--ex-text-primary) 12%, transparent);
    background: color-mix(in srgb, var(--ex-text-primary) 4%, transparent);
  }
}

.uc-card__uid-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-3;
}

.uc-card__uid-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  letter-spacing: 0.06em;
}

.uc-card__uid {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.03em;
}

.uc-card__pills {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
}

.uc-card__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-decoration: none;
  border: 1px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.uc-card__pill--vip {
  cursor: pointer;
  font-family: inherit;
  background: color-mix(in srgb, var(--ex-brand) 8%, transparent);
  border-color: color-mix(in srgb, var(--ex-brand) 35%, transparent);
  color: $color-text-primary;

  &:hover {
    background: color-mix(in srgb, var(--ex-brand) 14%, transparent);
  }
}

.uc-card__pill-k {
  color: $color-brand;
  font-weight: $font-weight-bold;
}

.uc-card__pill-v {
  font-size: $font-size-sm;
}

.uc-card__pill-more {
  margin-left: 2px;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
}

.uc-card__pill--role {
  background: var(--ex-fill-ghost);
  border-color: $color-border;
  color: $color-text-secondary;
}

.uc-card__pill--kyc {
  color: $color-text-primary;
  border-color: $color-border;
  background: var(--ex-fill-ghost);

  &:hover {
    border-color: color-mix(in srgb, var(--ex-brand) 30%, transparent);
    background: var(--ex-fill-hover-subtle);
  }
}

.uc-card__kyc--ok {
  border-color: color-mix(in srgb, var(--ex-rise) 35%, transparent);
  background: var(--ex-rise-bg);
  color: $color-rise;
}

.uc-card__kyc--pend {
  border-color: color-mix(in srgb, var(--ex-brand) 40%, transparent);
  background: var(--ex-brand-muted);
}

.uc-card__kyc--bad {
  border-color: color-mix(in srgb, var(--ex-fall) 35%, transparent);
  background: var(--ex-fall-bg);
  color: $color-fall;
}

.uc-card__kyc--muted {
  border-color: $color-border;
  background: var(--ex-fill-ghost);
  color: $color-text-secondary;
}

.uc-card__kyc-tier {
  font-weight: $font-weight-bold;
}

.uc-card__chev {
  margin-left: 2px;
  opacity: 0.85;
}

.uc-card__fine {
  margin: $space-3 0 0;
  font-size: 10px;
  line-height: 1.45;
  color: $color-text-tertiary;

  :deep(strong) {
    color: $color-text-secondary;
  }
}

.uc-card__code {
  font-family: $font-family-mono;
  font-size: 10px;
  color: $color-brand;
}

.uc-card__divider {
  height: 1px;
  margin: $space-5 0;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--ex-text-primary) 10%, transparent) 15%,
    color-mix(in srgb, var(--ex-text-primary) 10%, transparent) 85%,
    transparent
  );
}

.uc-card__lower {
  display: flex;
  flex-wrap: wrap;
  gap: $space-5;
  justify-content: space-between;
  align-items: flex-start;
}

.uc-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: $space-3 $space-6;
  flex: 1;
  min-width: 0;
}

.uc-card__cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.uc-card__k {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.uc-card__v {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
}

.uc-card__mono {
  font-family: $font-family-mono;
  font-size: $font-size-xs;
}

.uc-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.uc-card__badge {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 148px;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.uc-card__badge--tier {
  border-color: color-mix(in srgb, var(--ex-text-primary) 12%, transparent);
  background: color-mix(in srgb, var(--ex-text-primary) 4%, var(--ex-panel-sunken));
}

.uc-card__badge-label {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.uc-card__badge-val {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.uc-card__badge-sub {
  font-size: 10px;
  color: $color-text-tertiary;
  line-height: 1.35;
  max-width: 200px;
}

.uc-card__score {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
}

.uc-card__sec--high {
  border-color: rgba(14, 203, 129, 0.4);
  background: rgba(14, 203, 129, 0.08);
}

.uc-card__sec--mid {
  border-color: rgba(240, 185, 11, 0.4);
  background: rgba(240, 185, 11, 0.06);
}

.uc-card__sec--low {
  border-color: rgba(132, 142, 156, 0.4);
  background: rgba(132, 142, 156, 0.06);
}

.uc-card__sec--na {
  border-color: $color-border;
}

@include mq.media-down(sm) {
  .uc-card {
    padding: $space-4;
  }

  .uc-card__hero {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .uc-card__identity {
    width: 100%;
  }

  .uc-card__name-block,
  .uc-card__uid-row,
  .uc-card__pills {
    justify-content: center;
  }

  .uc-card__fine {
    text-align: center;
  }

  .uc-card__lower {
    flex-direction: column;
  }
}
</style>

<style lang="scss">
/* el-dialog 挂到 body，需非 scoped */
.uc-card__vip-dialog .el-dialog__body {
  padding-top: 8px;
}

.uc-card__vip-lead,
.uc-card__vip-next {
  font-size: 13px;
  line-height: 1.55;
  color: var(--ex-text-secondary);
  margin: 0 0 10px;
}

.uc-card__vip-table-wrap {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--ex-border);
  margin: 12px 0 16px;
}

.uc-card__vip-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th,
  td {
    padding: 8px 10px;
    text-align: left;
    border-bottom: 1px solid var(--ex-border);
  }

  th {
    background: var(--ex-bg-muted);
    color: var(--ex-text-tertiary);
    font-weight: 600;
  }

  td {
    color: var(--ex-text-secondary);
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.uc-card__vip-tr--on {
  background: color-mix(in srgb, var(--ex-brand) 10%, transparent);

  td {
    color: var(--ex-text-primary);
    font-weight: 600;
  }
}

.uc-card__vip-demo {
  padding-top: 8px;
  border-top: 1px dashed var(--ex-border);
}

.uc-card__vip-demo-label {
  display: block;
  font-size: 11px;
  color: var(--ex-text-tertiary);
  margin-bottom: 8px;
}

.uc-card__vip-demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.uc-card__vip-input {
  flex: 1;
  min-width: 160px;
}
</style>
