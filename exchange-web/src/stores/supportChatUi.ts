import { defineStore } from 'pinia'
import { nextTick, ref } from 'vue'

export type SupportChatMessageRole = 'user' | 'agent' | 'system'

export interface SupportChatMessage {
  id: string
  role: SupportChatMessageRole
  text: string
  at: string
}

function mid() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const WELCOME_LINES = [
  '您好，我是智能客服助手（演示）。',
  '可先点击下方快捷问题，或在输入框描述您遇到的问题；复杂问题将为您转接人工（演示）。',
]

export const useSupportChatUiStore = defineStore('supportChatUi', () => {
  const panelOpen = ref(false)
  const minimized = ref(false)
  const inputDraft = ref('')
  const messages = ref<SupportChatMessage[]>([])
  const seeded = ref(false)

  function seedWelcome() {
    if (seeded.value) return
    seeded.value = true
    const now = new Date().toISOString()
    messages.value = WELCOME_LINES.map((text, i) => ({
      id: mid() + i,
      role: 'agent' as const,
      text,
      at: now,
    }))
  }

  function open() {
    panelOpen.value = true
    minimized.value = false
    seedWelcome()
  }

  /** 打开面板并预填输入框（如从 C2C 申诉跳转在线客服） */
  function openWithDraft(text: string) {
    open()
    inputDraft.value = text
  }

  function close() {
    panelOpen.value = false
    minimized.value = false
  }

  function toggleMinimize() {
    if (!panelOpen.value) return
    minimized.value = !minimized.value
  }

  function send(text: string) {
    const t = text.trim()
    if (!t) return
    const now = new Date().toISOString()
    messages.value.push({ id: mid(), role: 'user', text: t, at: now })
    inputDraft.value = ''
    void nextTick(() => {
      messages.value.push({
        id: mid(),
        role: 'agent',
        text:
          '已收到您的消息（演示环境）。请继续补充订单号、币种或报错截图等信息，或前往「客服中心」提交工单以便跟进。',
        at: new Date().toISOString(),
      })
    })
  }

  function sendQuick(label: string) {
    send(label)
  }

  return {
    panelOpen,
    minimized,
    inputDraft,
    messages,
    open,
    openWithDraft,
    close,
    toggleMinimize,
    send,
    sendQuick,
    seedWelcome,
  }
})
