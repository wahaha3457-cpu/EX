<script setup lang="ts">
/**
 * C2C 订单进行中买卖家沟通区（演示 localStorage；交互参考币安 P2P 聊天）
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { C2cChatMessage } from '@/types/c2c'
import {
  ensureC2cChatWelcome,
  fetchC2cChatMessages,
  sendC2cChatMessage,
} from '@/api/c2c/c2cMock'

const props = defineProps<{
  orderId: string
  merchantDisplayName: string
  counterpartyMasked: string
  userSide: 'buy' | 'sell'
  fiatAmount: number
  fiat: string
  cryptoAmount: number
  crypto: string
  /** 进行中可发消息；完成/取消只读 */
  interactive: boolean
}>()

const messages = ref<C2cChatMessage[]>([])
const draft = ref('')
const loading = ref(false)
const listRef = ref<HTMLElement | null>(null)
let peerTimer: ReturnType<typeof setTimeout> | null = null

const peerRoleLabel = computed(() => (props.userSide === 'buy' ? '卖家' : '买家'))

const quickPhrases = computed(() =>
  props.userSide === 'buy'
    ? ['我已转账，请查收', '请确认收款金额与备注', '转账备注已按订单填写', '麻烦尽快放币，谢谢']
    : ['已看到付款，正在核对', '请稍等，确认到账后放币', '收款信息已核对', '已放币，请查收钱包'],
)

const PEER_AUTO_REPLIES = [
  '好的，收到。',
  '我马上核对收款记录。',
  '请确认转账备注与订单一致。',
  '已查收，请稍等。',
  '感谢您的配合。',
]

function fmtClock(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function scrollToBottom() {
  await nextTick()
  const el = listRef.value
  if (el) el.scrollTop = el.scrollHeight
}

async function loadThread() {
  loading.value = true
  try {
    await ensureC2cChatWelcome(props.orderId, {
      merchantDisplayName: props.merchantDisplayName,
      userSide: props.userSide,
      fiatAmount: props.fiatAmount,
      fiat: props.fiat,
      cryptoAmount: props.cryptoAmount,
      crypto: props.crypto,
    })
    messages.value = await fetchC2cChatMessages(props.orderId)
    await scrollToBottom()
  } finally {
    loading.value = false
  }
}

async function onSend() {
  const t = draft.value.trim()
  if (!t || !props.interactive || loading.value) return
  loading.value = true
  try {
    await sendC2cChatMessage(props.orderId, t, 'user')
    draft.value = ''
    messages.value = await fetchC2cChatMessages(props.orderId)
    await scrollToBottom()
    schedulePeerReply()
  } finally {
    loading.value = false
  }
}

function schedulePeerReply() {
  if (!props.interactive) return
  if (peerTimer) clearTimeout(peerTimer)
  peerTimer = setTimeout(async () => {
    peerTimer = null
    const reply = PEER_AUTO_REPLIES[Math.floor(Math.random() * PEER_AUTO_REPLIES.length)]!
    try {
      await sendC2cChatMessage(props.orderId, reply, 'counterparty')
      messages.value = await fetchC2cChatMessages(props.orderId)
      await scrollToBottom()
    } catch {
      /* ignore */
    }
  }, 700 + Math.floor(Math.random() * 900))
}

function insertQuick(p: string) {
  draft.value = p
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void onSend()
  }
}

watch(
  () => props.orderId,
  () => {
    void loadThread()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (peerTimer) clearTimeout(peerTimer)
})
</script>

<template>
  <div class="c2c-chat" aria-label="订单聊天">
    <div class="c2c-chat__head">
      <div class="c2c-chat__head-txt">
        <span class="c2c-chat__title">订单聊天</span>
        <span class="c2c-chat__sub">与{{ peerRoleLabel }}（{{ counterpartyMasked }}）沟通</span>
      </div>
      <span class="c2c-chat__pill">P2P</span>
    </div>
    <p class="c2c-chat__risk">
      请勿脱离平台私下交易；转账金额、备注以本订单为准。可疑行为请申诉或联系客服（演示）。
    </p>

    <div ref="listRef" class="c2c-chat__list" role="log" aria-live="polite">
      <p v-if="loading && !messages.length" class="c2c-chat__loading">加载会话…</p>
      <div
        v-for="m in messages"
        :key="m.id"
        class="c2c-chat__row"
        :class="m.sender === 'user' ? 'c2c-chat__row--me' : 'c2c-chat__row--peer'"
      >
        <div class="c2c-chat__bubble">
          <p class="c2c-chat__text">{{ m.text }}</p>
          <time class="c2c-chat__time" :datetime="m.createdAt">{{ fmtClock(m.createdAt) }}</time>
        </div>
      </div>
    </div>

    <div v-if="interactive" class="c2c-chat__quick" aria-label="快捷短语">
      <button
        v-for="p in quickPhrases"
        :key="p"
        type="button"
        class="c2c-chat__chip"
        @click="insertQuick(p)"
      >
        {{ p }}
      </button>
    </div>

    <div v-if="interactive" class="c2c-chat__composer">
      <textarea
        v-model="draft"
        class="c2c-chat__input"
        rows="2"
        maxlength="500"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        @keydown="onKeydown"
      />
      <button type="button" class="c2c-chat__send" :disabled="loading || !draft.trim()" @click="onSend">
        发送
      </button>
    </div>
    <p v-else class="c2c-chat__closed">订单已结束，聊天记录保留供查阅（演示）。</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.c2c-chat {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border);
  background: var(--ex-panel-sunken);
}

.c2c-chat__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-2;
}

.c2c-chat__head-txt {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.c2c-chat__title {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.c2c-chat__sub {
  font-size: 11px;
  color: $color-text-tertiary;
}

.c2c-chat__pill {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
  letter-spacing: 0.04em;
}

.c2c-chat__risk {
  margin: 0;
  font-size: 10px;
  line-height: 1.45;
  color: $color-text-tertiary;
}

.c2c-chat__list {
  max-height: 220px;
  min-height: 120px;
  overflow-y: auto;
  padding: $space-2;
  border-radius: $radius-sm;
  background: var(--ex-surface-inset);
  border: 1px solid var(--ex-border-subtle);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.c2c-chat__loading {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  text-align: center;
  padding: $space-3;
}

.c2c-chat__row {
  display: flex;
  width: 100%;

  &--me {
    justify-content: flex-end;
  }

  &--peer {
    justify-content: flex-start;
  }
}

.c2c-chat__bubble {
  max-width: 88%;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  border: 1px solid transparent;
}

.c2c-chat__row--me .c2c-chat__bubble {
  background: rgba(240, 185, 11, 0.14);
  border-color: rgba(240, 185, 11, 0.35);
}

.c2c-chat__row--peer .c2c-chat__bubble {
  background: var(--ex-fill-ghost);
  border-color: var(--ex-border-subtle);
}

.c2c-chat__text {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-primary;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.c2c-chat__time {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: $color-text-tertiary;
  font-variant-numeric: tabular-nums;
}

.c2c-chat__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.c2c-chat__chip {
  padding: 4px 8px;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: var(--ex-fill-hover-subtle);
  border: 1px solid var(--ex-border-subtle);
  border-radius: 999px;
  cursor: pointer;

  &:hover {
    border-color: rgba(240, 185, 11, 0.35);
    color: $color-brand;
  }
}

.c2c-chat__composer {
  display: flex;
  gap: $space-2;
  align-items: flex-end;
}

.c2c-chat__input {
  flex: 1;
  min-width: 0;
  resize: vertical;
  min-height: 44px;
  max-height: 120px;
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  color: $color-text-primary;
  background: var(--ex-card-surface);
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  font-family: inherit;
  line-height: 1.45;

  &::placeholder {
    color: $color-text-tertiary;
  }

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.45);
    box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.12);
  }
}

.c2c-chat__send {
  flex-shrink: 0;
  padding: 10px 14px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--ex-on-brand);
  background: $color-brand;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: var(--ex-brand-hover);
  }
}

.c2c-chat__closed {
  margin: 0;
  font-size: 11px;
  color: $color-text-tertiary;
  text-align: center;
  padding: $space-2;
}
</style>
