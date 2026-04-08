<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  ChatDotRound,
  CircleCheck,
  Clock,
  Headset,
  Promotion,
  Refresh,
  Search,
  SwitchButton,
  User,
  UserFilled,
} from '@element-plus/icons-vue'

const { t } = useI18n()

type MsgRole = 'user' | 'agent' | 'system'
type SessionStatus = 'open' | 'queued' | 'closed'

interface ChatMessage {
  id: string
  role: MsgRole
  body: string
  at: number
}

interface ChatSession {
  id: string
  channel: string
  userLabel: string
  uid: string
  unread: number
  status: SessionStatus
  lastPreview: string
  lastAt: number
  kyc: string
  vip: string
  registerAt: string
  messages: ChatMessage[]
}

function now() {
  return Date.now()
}

function seedSessions(): ChatSession[] {
  const base = now()
  return [
    {
      id: 'cs-10021',
      channel: 'app',
      userLabel: '用户 8821***',
      uid: '882193441',
      unread: 2,
      status: 'open',
      lastPreview: '提币一直显示审核中，能帮忙看下吗？',
      lastAt: base - 120_000,
      kyc: 'L2',
      vip: 'VIP1',
      registerAt: '2024-06-12',
      messages: [
        {
          id: 'm1',
          role: 'system',
          body: '会话已接入 · 队列耗时 12s',
          at: base - 600_000,
        },
        {
          id: 'm2',
          role: 'user',
          body: '提币一直显示审核中，能帮忙看下吗？',
          at: base - 580_000,
        },
        {
          id: 'm3',
          role: 'agent',
          body: '您好，已收到。请提供提币订单号与链上币种，我为您核对风控状态。',
          at: base - 560_000,
        },
        {
          id: 'm4',
          role: 'user',
          body: '订单号 WD-20260402-00912，USDT-TRC20。',
          at: base - 120_000,
        },
      ],
    },
    {
      id: 'cs-10020',
      channel: 'web',
      userLabel: '用户 7710***',
      uid: '771088902',
      unread: 0,
      status: 'queued',
      lastPreview: '好的，我等一下。',
      lastAt: base - 900_000,
      kyc: 'L1',
      vip: '-',
      registerAt: '2025-11-01',
      messages: [
        { id: 'm1', role: 'system', body: '用户进入排队，当前前方 3 人', at: base - 920_000 },
        { id: 'm2', role: 'user', body: '合约仓位被强平了，想申诉。', at: base - 910_000 },
        { id: 'm3', role: 'agent', body: '已记录合约单号，稍后专员回电说明规则与复核路径。', at: base - 905_000 },
        { id: 'm4', role: 'user', body: '好的，我等一下。', at: base - 900_000 },
      ],
    },
    {
      id: 'cs-10019',
      channel: 'app',
      userLabel: '用户 6605***',
      uid: '660512003',
      unread: 0,
      status: 'closed',
      lastPreview: '问题已解决，谢谢。',
      lastAt: base - 3_600_000,
      kyc: 'L2',
      vip: 'VIP2',
      registerAt: '2023-02-20',
      messages: [
        { id: 'm1', role: 'user', body: '登录验证码收不到。', at: base - 3_800_000 },
        { id: 'm2', role: 'agent', body: '已为您重置短信通道并补发，请查收。', at: base - 3_700_000 },
        { id: 'm3', role: 'user', body: '问题已解决，谢谢。', at: base - 3_600_000 },
        { id: 'm4', role: 'system', body: '会话已结束 · 满意度待推送', at: base - 3_590_000 },
      ],
    },
    {
      id: 'cs-10018',
      channel: 'web',
      userLabel: '用户 5599***',
      uid: '559912774',
      unread: 1,
      status: 'open',
      lastPreview: 'KYC 审核要多久？',
      lastAt: base - 45_000,
      kyc: '审核中',
      vip: '-',
      registerAt: '2026-03-28',
      messages: [
        { id: 'm1', role: 'user', body: 'KYC 审核要多久？', at: base - 45_000 },
      ],
    },
    {
      id: 'cs-10017',
      channel: 'app',
      userLabel: '用户 4488***',
      uid: '448877661',
      unread: 0,
      status: 'open',
      lastPreview: 'C2C 订单对方未放行',
      lastAt: base - 8_640_000,
      kyc: 'L2',
      vip: 'VIP1',
      registerAt: '2025-08-08',
      messages: [
        { id: 'm1', role: 'user', body: 'C2C 订单对方未放行', at: base - 8_700_000 },
        { id: 'm2', role: 'agent', body: '请先上传付款凭证截图，我们同步冻结争议单并介入协调。', at: base - 8_660_000 },
        { id: 'm3', role: 'system', body: '已关联订单 #C2C-88421', at: base - 8_650_000 },
      ],
    },
  ]
}

const sessions = ref<ChatSession[]>(seedSessions())
const activeId = ref(sessions.value[0]?.id ?? '')
const sessionFilter = ref<'all' | SessionStatus>('all')
const keyword = ref('')
const composer = ref('')
const agentPresence = ref<'online' | 'busy' | 'offline'>('online')
const threadEndRef = ref<HTMLElement | null>(null)

const activeSession = computed(() => sessions.value.find((s) => s.id === activeId.value) ?? null)

const filteredSessions = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return sessions.value.filter((s) => {
    if (sessionFilter.value !== 'all' && s.status !== sessionFilter.value) return false
    if (!kw) return true
    return (
      s.id.toLowerCase().includes(kw) ||
      s.uid.includes(kw) ||
      s.userLabel.toLowerCase().includes(kw) ||
      s.lastPreview.toLowerCase().includes(kw)
    )
  })
})

function formatTime(ts: number) {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function formatDay(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function scrollThreadToEnd() {
  nextTick(() => {
    threadEndRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  })
}

watch(
  () => activeSession.value?.messages.length,
  () => scrollThreadToEnd(),
  { flush: 'post' },
)

watch(activeId, () => scrollThreadToEnd())

function selectSession(id: string) {
  activeId.value = id
  const s = sessions.value.find((x) => x.id === id)
  if (s) s.unread = 0
}

function sendMessage() {
  const text = composer.value.trim()
  const s = activeSession.value
  if (!s || !text) return
  s.messages.push({
    id: `m-${now()}`,
    role: 'agent',
    body: text,
    at: now(),
  })
  s.lastPreview = text
  s.lastAt = now()
  composer.value = ''
  ElMessage.success(t('admin.supportChat.sentDemo'))
  scrollThreadToEnd()
}

function markResolved() {
  const s = activeSession.value
  if (!s) return
  s.status = 'closed'
  s.messages.push({
    id: `m-${now()}`,
    role: 'system',
    body: t('admin.supportChat.systemResolved'),
    at: now(),
  })
  ElMessage.success(t('admin.supportChat.resolveOk'))
  scrollThreadToEnd()
}

function copyUid() {
  const uid = activeSession.value?.uid
  if (!uid) return
  void navigator.clipboard.writeText(uid).then(() => {
    ElMessage.success(t('admin.supportChat.copied'))
  })
}

function refreshDemo() {
  sessions.value = seedSessions()
  activeId.value = sessions.value[0]?.id ?? ''
  ElMessage.success(t('admin.supportChat.refreshOk'))
}
</script>

<template>
  <div class="adm-support">
    <header class="adm-support__head">
      <div class="adm-support__head-text">
        <h1 class="adm-support__title">{{ t('admin.supportChat.title') }}</h1>
        <p class="adm-support__sub">{{ t('admin.supportChat.subtitle') }}</p>
      </div>
      <div class="adm-support__head-actions">
        <span class="adm-support__presence-label">{{ t('admin.supportChat.presence') }}</span>
        <el-select v-model="agentPresence" size="small" class="adm-support__presence-select">
          <el-option value="online" :label="t('admin.supportChat.online')" />
          <el-option value="busy" :label="t('admin.supportChat.busy')" />
          <el-option value="offline" :label="t('admin.supportChat.offline')" />
        </el-select>
        <el-button size="small" :icon="Refresh" @click="refreshDemo">{{ t('admin.supportChat.refresh') }}</el-button>
      </div>
    </header>

    <div class="adm-support__shell">
      <!-- 会话列表 -->
      <aside class="adm-support__col adm-support__col--sessions">
        <div class="adm-support__filters">
          <el-input
            v-model="keyword"
            clearable
            size="small"
            :prefix-icon="Search"
            :placeholder="t('admin.supportChat.searchPh')"
            class="adm-support__search"
          />
          <el-radio-group v-model="sessionFilter" size="small" class="adm-support__tabs">
            <el-radio-button value="all">{{ t('admin.supportChat.filterAll') }}</el-radio-button>
            <el-radio-button value="open">{{ t('admin.supportChat.filterOpen') }}</el-radio-button>
            <el-radio-button value="queued">{{ t('admin.supportChat.filterQueued') }}</el-radio-button>
            <el-radio-button value="closed">{{ t('admin.supportChat.filterClosed') }}</el-radio-button>
          </el-radio-group>
        </div>
        <el-scrollbar class="adm-support__session-scroll">
          <div
            v-for="s in filteredSessions"
            :key="s.id"
            class="adm-support__session"
            :class="{ 'is-active': s.id === activeId }"
            role="button"
            tabindex="0"
            @click="selectSession(s.id)"
            @keydown.enter.prevent="selectSession(s.id)"
          >
            <div class="adm-support__session-top">
              <span class="adm-support__session-name">{{ s.userLabel }}</span>
              <span class="adm-support__session-time">{{ formatDay(s.lastAt) }} {{ formatTime(s.lastAt) }}</span>
            </div>
            <div class="adm-support__session-preview">{{ s.lastPreview }}</div>
            <div class="adm-support__session-meta">
              <el-tag size="small" effect="plain" type="info">{{ s.channel }}</el-tag>
              <el-tag
                size="small"
                :type="s.status === 'open' ? 'success' : s.status === 'queued' ? 'warning' : 'info'"
                effect="light"
              >
                {{
                  s.status === 'open'
                    ? t('admin.supportChat.stOpen')
                    : s.status === 'queued'
                      ? t('admin.supportChat.stQueued')
                      : t('admin.supportChat.stClosed')
                }}
              </el-tag>
              <span v-if="s.unread > 0" class="adm-support__unread">{{ s.unread }}</span>
            </div>
          </div>
          <el-empty
            v-if="filteredSessions.length === 0"
            :description="t('admin.supportChat.emptySessions')"
            :image-size="72"
          />
        </el-scrollbar>
      </aside>

      <!-- 消息主区 -->
      <section class="adm-support__col adm-support__col--thread">
        <template v-if="activeSession">
          <div class="adm-support__thread-head">
            <div class="adm-support__thread-head-main">
              <el-icon class="adm-support__thread-icon"><ChatDotRound /></el-icon>
              <div>
                <div class="adm-support__thread-title">{{ activeSession.userLabel }}</div>
                <div class="adm-support__thread-sub">
                  {{ t('admin.supportChat.sessionId') }} {{ activeSession.id }} · UID {{ activeSession.uid }}
                </div>
              </div>
            </div>
            <div class="adm-support__thread-tools">
              <el-button size="small" type="primary" plain>{{ t('admin.supportChat.assign') }}</el-button>
              <el-button size="small" plain>{{ t('admin.supportChat.transfer') }}</el-button>
              <el-button size="small" type="success" plain :icon="CircleCheck" @click="markResolved">
                {{ t('admin.supportChat.resolve') }}
              </el-button>
            </div>
          </div>
          <el-scrollbar class="adm-support__thread-body">
            <div class="adm-support__messages">
              <div
                v-for="m in activeSession.messages"
                :key="m.id"
                class="adm-support__msg"
                :class="`adm-support__msg--${m.role}`"
              >
                <template v-if="m.role === 'system'">
                  <div class="adm-support__system-pill">
                    <el-icon><Promotion /></el-icon>
                    <span>{{ m.body }}</span>
                  </div>
                </template>
                <template v-else>
                  <div class="adm-support__bubble-wrap">
                    <div v-if="m.role === 'user'" class="adm-support__avatar adm-support__avatar--user">
                      <el-icon><User /></el-icon>
                    </div>
                    <div v-else class="adm-support__avatar adm-support__avatar--agent">
                      <el-icon><Headset /></el-icon>
                    </div>
                    <div class="adm-support__bubble-stack">
                      <span class="adm-support__bubble-label">
                        {{
                          m.role === 'user' ? t('admin.supportChat.lblUser') : t('admin.supportChat.lblAgent')
                        }}
                      </span>
                      <div class="adm-support__bubble">{{ m.body }}</div>
                      <span class="adm-support__bubble-time">{{ formatTime(m.at) }}</span>
                    </div>
                  </div>
                </template>
              </div>
              <div ref="threadEndRef" class="adm-support__thread-end" aria-hidden="true" />
            </div>
          </el-scrollbar>
          <div class="adm-support__composer">
            <el-input
              v-model="composer"
              type="textarea"
              :rows="3"
              resize="none"
              :placeholder="t('admin.supportChat.composerPh')"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <div class="adm-support__composer-foot">
              <span class="adm-support__hint">{{ t('admin.supportChat.shortcutHint') }}</span>
              <el-button type="primary" :icon="Promotion" @click="sendMessage">{{ t('admin.supportChat.send') }}</el-button>
            </div>
          </div>
        </template>
        <el-empty v-else :description="t('admin.supportChat.emptyThread')" :image-size="80" />
      </section>

      <!-- 用户上下文 -->
      <aside v-if="activeSession" class="adm-support__col adm-support__col--ctx">
        <div class="adm-support__ctx-card">
          <div class="adm-support__ctx-head">
            <el-avatar :size="40" class="adm-support__ctx-avatar">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
            <div>
              <div class="adm-support__ctx-name">{{ activeSession.userLabel }}</div>
              <div class="adm-support__ctx-uid">UID {{ activeSession.uid }}</div>
            </div>
          </div>
          <el-button size="small" class="adm-support__ctx-copy" @click="copyUid">{{ t('admin.supportChat.copyUid') }}</el-button>
          <dl class="adm-support__ctx-dl">
            <div class="adm-support__ctx-row">
              <dt><el-icon><Clock /></el-icon>{{ t('admin.supportChat.registerAt') }}</dt>
              <dd>{{ activeSession.registerAt }}</dd>
            </div>
            <div class="adm-support__ctx-row">
              <dt>{{ t('admin.supportChat.kyc') }}</dt>
              <dd>{{ activeSession.kyc }}</dd>
            </div>
            <div class="adm-support__ctx-row">
              <dt>{{ t('admin.supportChat.vip') }}</dt>
              <dd>{{ activeSession.vip }}</dd>
            </div>
          </dl>
          <div class="adm-support__ctx-tags">
            <span class="adm-support__ctx-tags-title">{{ t('admin.supportChat.riskTags') }}</span>
            <div>
              <el-tag size="small" type="warning" effect="light">{{ t('admin.supportChat.tagNewDevice') }}</el-tag>
              <el-tag size="small" type="info" effect="light">{{ t('admin.supportChat.tagNormal') }}</el-tag>
            </div>
          </div>
          <div class="adm-support__ctx-actions">
            <span class="adm-support__ctx-tags-title">{{ t('admin.supportChat.quickActions') }}</span>
            <el-button size="small" plain class="adm-support__btn-wide">{{ t('admin.supportChat.actOrders') }}</el-button>
            <el-button size="small" plain class="adm-support__btn-wide">{{ t('admin.supportChat.actLedger') }}</el-button>
            <el-button size="small" plain class="adm-support__btn-wide" type="warning">{{ t('admin.supportChat.actRisk') }}</el-button>
            <el-button size="small" plain class="adm-support__btn-wide" :icon="SwitchButton">{{ t('admin.supportChat.actEnd') }}</el-button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.adm-support {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
  max-height: calc(100vh - 88px);
}

.adm-support__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.adm-support__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.adm-support__sub {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  max-width: 640px;
  line-height: 1.5;
}

.adm-support__head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.adm-support__presence-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.adm-support__presence-select {
  width: 120px;
}

.adm-support__shell {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(240px, 300px) 1fr minmax(220px, 280px);
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.adm-support__col {
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-fill-color-blank);
}

.adm-support__col--sessions {
  border-right: 1px solid var(--el-border-color-lighter);
}

.adm-support__col--ctx {
  border-left: 1px solid var(--el-border-color-lighter);
}

.adm-support__filters {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.adm-support__tabs {
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  :deep(.el-radio-button__inner) {
    padding: 5px 8px;
    font-size: 12px;
  }
}

.adm-support__session-scroll {
  flex: 1;
  padding: 8px;
}

.adm-support__session {
  padding: 10px 10px 8px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 6px;
  border: 1px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.is-active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }
}

.adm-support__session-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.adm-support__session-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.adm-support__session-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.adm-support__session-preview {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.adm-support__session-meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.adm-support__unread {
  margin-left: auto;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--el-color-danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.adm-support__thread-head {
  flex-shrink: 0;
  padding: 12px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.adm-support__thread-head-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.adm-support__thread-icon {
  font-size: 22px;
  color: var(--el-color-primary);
}

.adm-support__thread-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.adm-support__thread-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.adm-support__thread-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.adm-support__thread-body {
  flex: 1;
  min-height: 0;
  padding: 0 12px;
}

.adm-support__messages {
  padding: 14px 4px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.adm-support__msg--system {
  display: flex;
  justify-content: center;
}

.adm-support__system-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.adm-support__bubble-wrap {
  display: flex;
  gap: 10px;
  max-width: min(92%, 560px);
}

.adm-support__msg--user .adm-support__bubble-wrap {
  margin-right: auto;
  flex-direction: row;
}

.adm-support__msg--agent .adm-support__bubble-wrap {
  margin-left: auto;
  flex-direction: row-reverse;
  text-align: right;
}

.adm-support__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.adm-support__avatar--user {
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.adm-support__avatar--agent {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}

.adm-support__bubble-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.adm-support__bubble-label {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.adm-support__msg--agent .adm-support__bubble-label {
  align-self: flex-end;
}

.adm-support__bubble {
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.adm-support__msg--user .adm-support__bubble {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-lighter);
  border-top-left-radius: 4px;
}

.adm-support__msg--agent .adm-support__bubble {
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-color-primary-light-5);
  border-top-right-radius: 4px;
}

.adm-support__bubble-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.adm-support__msg--agent .adm-support__bubble-time {
  align-self: flex-end;
}

.adm-support__thread-end {
  height: 1px;
}

.adm-support__composer {
  flex-shrink: 0;
  padding: 10px 12px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay, var(--el-fill-color-blank));
}

.adm-support__composer-foot {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.adm-support__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.adm-support__ctx-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow: auto;
}

.adm-support__ctx-head {
  display: flex;
  gap: 12px;
  align-items: center;
}

.adm-support__ctx-avatar {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.adm-support__ctx-name {
  font-weight: 700;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.adm-support__ctx-uid {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.adm-support__ctx-copy {
  align-self: flex-start;
}

.adm-support__ctx-dl {
  margin: 0;
  padding: 12px 0 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.adm-support__ctx-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 8px;

  dt {
    margin: 0;
    color: var(--el-text-color-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  dd {
    margin: 0;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }
}

.adm-support__ctx-tags-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.adm-support__ctx-tags div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.adm-support__ctx-actions {
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.adm-support__btn-wide {
  width: 100%;
  margin-left: 0;
}

@media (max-width: 1100px) {
  .adm-support__shell {
    grid-template-columns: minmax(200px, 260px) 1fr;
  }

  .adm-support__col--ctx {
    display: none;
  }
}

@media (max-width: 768px) {
  .adm-support__shell {
    grid-template-columns: 1fr;
  }

  .adm-support__col--sessions {
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}
</style>
