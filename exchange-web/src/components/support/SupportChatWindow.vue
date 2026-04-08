<script setup lang="ts">
/**
 * 全站浮动客服窗口：币安式底部右侧卡片 — 标题栏、在线状态、最小化/关闭、消息区与快捷入口。
 */
import { nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupportChatUiStore } from '@/stores/supportChatUi'

const chat = useSupportChatUiStore()
const { panelOpen, minimized, messages, inputDraft } = storeToRefs(chat)

const listRef = ref<HTMLElement | null>(null)

const quickTags = ['充值未到账', '合约保证金', '身份认证 KYC', '提币审核']

function scrollListEnd() {
  void nextTick(() => {
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

watch(
  () => messages.value.length,
  () => {
    scrollListEnd()
  },
)

watch(panelOpen, (v) => {
  if (v) scrollListEnd()
})

function onSend() {
  chat.send(inputDraft.value)
  scrollListEnd()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    onSend()
  }
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ex-chat-win">
      <div
        v-if="panelOpen && !minimized"
        class="ex-chat-win"
        role="dialog"
        aria-modal="false"
        aria-label="在线客服对话"
      >
        <header class="ex-chat-win__titlebar">
          <div class="ex-chat-win__brand">
            <span class="ex-chat-win__dots" aria-hidden="true">
              <span class="ex-chat-win__dot ex-chat-win__dot--r" />
              <span class="ex-chat-win__dot ex-chat-win__dot--y" />
              <span class="ex-chat-win__dot ex-chat-win__dot--g" />
            </span>
            <div class="ex-chat-win__titles">
              <span class="ex-chat-win__h">在线客服</span>
              <span class="ex-chat-win__sub">
                <span class="ex-chat-win__online" aria-hidden="true" />
                智能助手 · 演示
              </span>
            </div>
          </div>
          <div class="ex-chat-win__actions">
            <button
              type="button"
              class="ex-chat-win__icon-btn"
              aria-label="最小化"
              title="最小化"
              @click="chat.toggleMinimize()"
            >
              <span class="ex-chat-win__min" />
            </button>
            <button
              type="button"
              class="ex-chat-win__icon-btn"
              aria-label="关闭"
              title="关闭"
              @click="chat.close()"
            >
              <span class="ex-chat-win__x" />
            </button>
          </div>
        </header>

        <div class="ex-chat-win__quick" aria-label="常见问题快捷入口">
          <button
            v-for="q in quickTags"
            :key="q"
            type="button"
            class="ex-chat-win__chip"
            @click="chat.sendQuick(q)"
          >
            {{ q }}
          </button>
        </div>

        <div ref="listRef" class="ex-chat-win__scroll">
          <div
            v-for="m in messages"
            :key="m.id"
            class="ex-chat-win__row"
            :class="{
              'ex-chat-win__row--user': m.role === 'user',
              'ex-chat-win__row--agent': m.role === 'agent',
              'ex-chat-win__row--sys': m.role === 'system',
            }"
          >
            <div class="ex-chat-win__bubble">
              <p class="ex-chat-win__text">{{ m.text }}</p>
              <time class="ex-chat-win__time" :datetime="m.at">{{ fmtTime(m.at) }}</time>
            </div>
          </div>
        </div>

        <footer class="ex-chat-win__composer">
          <textarea
            v-model="inputDraft"
            class="ex-chat-win__input"
            rows="2"
            placeholder="描述您的问题，Enter 发送，Shift+Enter 换行"
            maxlength="2000"
            @keydown="onKeydown"
          />
          <button type="button" class="ex-chat-win__send" @click="onSend">发送</button>
        </footer>
      </div>
    </Transition>

    <Transition name="ex-chat-bar">
      <button
        v-if="panelOpen && minimized"
        type="button"
        class="ex-chat-win__bar"
        aria-label="展开在线客服"
        @click="chat.toggleMinimize()"
      >
        <span class="ex-chat-win__bar-dot" aria-hidden="true" />
        <span class="ex-chat-win__bar-t">在线客服</span>
        <span class="ex-chat-win__bar-chevron" aria-hidden="true" />
      </button>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ex-chat-win {
  position: fixed;
  right: max(16px, env(safe-area-inset-right, 0px));
  bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  z-index: 1100;
  display: flex;
  flex-direction: column;
  width: min(400px, calc(100vw - 32px));
  height: min(520px, calc(100vh - 120px));
  border-radius: 14px;
  overflow: hidden;
  background: var(--ex-card-surface);
  border: 1px solid $color-border;
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.22),
    0 0 0 1px color-mix(in srgb, var(--ex-brand) 12%, transparent);
}

.ex-chat-win__titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ex-brand) 18%, var(--ex-panel-sunken)) 0%,
    var(--ex-panel-sunken) 100%
  );
  border-bottom: 1px solid $color-border;
}

.ex-chat-win__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ex-chat-win__dots {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.ex-chat-win__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  opacity: 0.85;
}

.ex-chat-win__dot--r {
  background: #ff5f57;
}
.ex-chat-win__dot--y {
  background: #febc2e;
}
.ex-chat-win__dot--g {
  background: #28c840;
}

.ex-chat-win__titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ex-chat-win__h {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.02em;
}

.ex-chat-win__sub {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: $color-text-tertiary;
}

.ex-chat-win__online {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0ecb81;
  box-shadow: 0 0 0 2px color-mix(in srgb, #0ecb81 35%, transparent);
  animation: ex-chat-pulse 2s ease-in-out infinite;
}

@keyframes ex-chat-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

.ex-chat-win__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.ex-chat-win__icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: $color-text-secondary;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: color-mix(in srgb, var(--ex-brand) 10%, transparent);
    color: $color-text-primary;
  }
}

.ex-chat-win__min {
  display: block;
  width: 12px;
  height: 2px;
  border-radius: 1px;
  background: currentColor;
}

.ex-chat-win__x {
  position: relative;
  display: block;
  width: 14px;
  height: 14px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 12px;
    height: 2px;
    border-radius: 1px;
    background: currentColor;
  }
  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }
  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }
}

.ex-chat-win__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ex-chat-win__chip {
  padding: 5px 10px;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  border-radius: 999px;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  color: $color-text-secondary;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;

  &:hover {
    border-color: rgba(240, 185, 11, 0.45);
    color: $color-brand;
  }
}

.ex-chat-win__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ex-chat-win__row {
  display: flex;
}

.ex-chat-win__row--user {
  justify-content: flex-end;
}

.ex-chat-win__row--agent,
.ex-chat-win__row--sys {
  justify-content: flex-start;
}

.ex-chat-win__bubble {
  max-width: 88%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid $color-border;
}

.ex-chat-win__row--user .ex-chat-win__bubble {
  background: color-mix(in srgb, var(--ex-brand) 16%, transparent);
  border-color: rgba(240, 185, 11, 0.35);
  border-bottom-right-radius: 4px;
}

.ex-chat-win__row--agent .ex-chat-win__bubble,
.ex-chat-win__row--sys .ex-chat-win__bubble {
  background: var(--ex-panel-sunken);
  border-bottom-left-radius: 4px;
}

.ex-chat-win__text {
  margin: 0;
  font-size: $font-size-sm;
  line-height: 1.55;
  color: $color-text-primary;
  white-space: pre-wrap;
  word-break: break-word;
}

.ex-chat-win__time {
  display: block;
  margin-top: 6px;
  font-size: 10px;
  color: $color-text-tertiary;
}

.ex-chat-win__composer {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 10px 12px 12px;
  border-top: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ex-chat-win__input {
  flex: 1;
  resize: none;
  padding: 10px 12px;
  font-size: $font-size-sm;
  line-height: 1.45;
  border-radius: 10px;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  color: $color-text-primary;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.5);
    box-shadow: 0 0 0 2px rgba(240, 185, 11, 0.12);
  }
}

.ex-chat-win__send {
  flex-shrink: 0;
  padding: 10px 16px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: 10px;
  background: var(--ex-brand);
  color: var(--ex-on-brand);
  cursor: pointer;
  transition: filter 0.15s;

  &:hover {
    filter: brightness(1.06);
  }
}

.ex-chat-win__bar {
  position: fixed;
  right: max(16px, env(safe-area-inset-right, 0px));
  bottom: calc(28px + env(safe-area-inset-bottom, 0px));
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  text-align: left;
}

.ex-chat-win__bar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0ecb81;
  flex-shrink: 0;
}

.ex-chat-win__bar-t {
  flex: 1;
}

.ex-chat-win__bar-chevron {
  width: 8px;
  height: 8px;
  border-right: 2px solid $color-text-tertiary;
  border-bottom: 2px solid $color-text-tertiary;
  transform: rotate(-135deg);
  margin-bottom: 4px;
}

.ex-chat-win-enter-active,
.ex-chat-win-leave-active,
.ex-chat-bar-enter-active,
.ex-chat-bar-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.22s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.ex-chat-win-enter-from,
.ex-chat-win-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.ex-chat-bar-enter-from,
.ex-chat-bar-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@include mq.media-down(md) {
  .ex-chat-win {
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-width: none;
    height: min(88vh, 640px);
    border-radius: 16px 16px 0 0;
    margin-bottom: env(safe-area-inset-bottom, 0px);
  }

  .ex-chat-win__bar {
    bottom: calc(18px + #{$mobile-dock-height} + env(safe-area-inset-bottom, 0px));
    right: max(12px, env(safe-area-inset-right, 0px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ex-chat-win__online {
    animation: none;
  }

  .ex-chat-win-enter-active,
  .ex-chat-win-leave-active,
  .ex-chat-bar-enter-active,
  .ex-chat-bar-leave-active {
    transition: opacity 0.15s ease;
  }

  .ex-chat-win-enter-from,
  .ex-chat-win-leave-to,
  .ex-chat-bar-enter-from,
  .ex-chat-bar-leave-to {
    transform: none;
  }
}
</style>
