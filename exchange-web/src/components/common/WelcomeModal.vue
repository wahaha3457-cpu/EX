<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const { welcomeModal } = storeToRefs(app)

const illu = computed(() => welcomeModal.value.illustration)
</script>

<template>
  <Transition name="ex-welcome">
    <div v-if="welcomeModal.open" class="ex-welcome" role="dialog" aria-modal="true">
      <div class="ex-welcome__backdrop" @click="app.closeWelcomeModal()" />
      <div class="ex-welcome__card">
        <button class="ex-welcome__close" type="button" aria-label="关闭" @click="app.closeWelcomeModal()">
          ×
        </button>

        <div class="ex-welcome__body">
          <div class="ex-welcome__illu" aria-hidden="true">
            <!-- rocket -->
            <svg v-if="illu === 'rocket'" viewBox="0 0 220 160" class="ex-welcome__svg">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="var(--ex-brand)" stop-opacity="0.95" />
                  <stop offset="1" stop-color="#22c55e" stop-opacity="0.9" />
                </linearGradient>
                <radialGradient id="g2" cx="50%" cy="45%" r="60%">
                  <stop offset="0" stop-color="#ffffff" stop-opacity="0.85" />
                  <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="220" height="160" rx="18" fill="color-mix(in srgb, var(--ex-brand) 10%, transparent)" />
              <circle cx="60" cy="55" r="42" fill="url(#g2)" />
              <path
                d="M128 26c18 10 32 31 32 52 0 21-14 42-32 52-18-10-32-31-32-52 0-21 14-42 32-52Z"
                fill="url(#g1)"
              />
              <path d="M128 44c9 6 16 18 16 34s-7 28-16 34c-9-6-16-18-16-34s7-28 16-34Z" fill="rgba(0,0,0,0.18)" />
              <circle cx="128" cy="76" r="10" fill="rgba(255,255,255,0.92)" />
              <path d="M96 88l-18 10 10 18c10-6 16-16 18-28l-10 0Z" fill="rgba(34,197,94,0.85)" />
              <path d="M160 88l18 10-10 18c-10-6-16-16-18-28l10 0Z" fill="rgba(59,130,246,0.85)" />
              <path d="M128 128c-8 9-10 18-6 28 10-4 18-12 22-24-5-2-10-4-16-4Z" fill="rgba(255,255,255,0.85)" />
              <path d="M74 128c26 8 55 8 72 0" stroke="rgba(255,255,255,0.38)" stroke-width="2" stroke-linecap="round" />
            </svg>

            <!-- shield -->
            <svg v-else-if="illu === 'shield'" viewBox="0 0 220 160" class="ex-welcome__svg">
              <defs>
                <linearGradient id="s1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#22c55e" stop-opacity="0.95" />
                  <stop offset="1" stop-color="var(--ex-brand)" stop-opacity="0.9" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="220" height="160" rx="18" fill="color-mix(in srgb, var(--ex-brand) 10%, transparent)" />
              <path
                d="M110 24c28 14 56 18 72 20v40c0 42-30 62-72 76C68 146 38 126 38 84V44c16-2 44-6 72-20Z"
                fill="url(#s1)"
              />
              <path
                d="M78 84l18 18 44-52"
                fill="none"
                stroke="rgba(255,255,255,0.92)"
                stroke-width="10"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <!-- spark -->
            <svg v-else viewBox="0 0 220 160" class="ex-welcome__svg">
              <defs>
                <linearGradient id="p1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#a78bfa" stop-opacity="0.9" />
                  <stop offset="1" stop-color="var(--ex-brand)" stop-opacity="0.9" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="220" height="160" rx="18" fill="color-mix(in srgb, var(--ex-brand) 10%, transparent)" />
              <circle cx="110" cy="78" r="34" fill="url(#p1)" />
              <path d="M110 32v16M110 112v16M64 78h16M140 78h16" stroke="rgba(255,255,255,0.75)" stroke-width="4" stroke-linecap="round" />
              <path d="M78 46l10 10M142 110l10 10M78 110l10-10M142 46l10-10" stroke="rgba(255,255,255,0.55)" stroke-width="3.5" stroke-linecap="round" />
            </svg>
          </div>

          <div class="ex-welcome__text">
            <div class="ex-welcome__title">{{ welcomeModal.title }}</div>
            <div v-if="welcomeModal.subtitle" class="ex-welcome__sub">{{ welcomeModal.subtitle }}</div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ex-welcome {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: grid;
  place-items: center;
  padding: $space-4;
}

.ex-welcome__backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, #000 55%, transparent);
  backdrop-filter: blur(6px);
}

.ex-welcome__card {
  position: relative;
  width: min(720px, calc(100vw - #{$space-4} * 2));
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--ex-border) 65%, transparent);
  background: color-mix(in srgb, var(--ex-bg-nav-float) 92%, #000 8%);
  box-shadow: 0 24px 80px color-mix(in srgb, #000 60%, transparent);
  overflow: hidden;
}

.ex-welcome__close {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--ex-border) 70%, transparent);
  background: color-mix(in srgb, var(--ex-bg-nav-float) 85%, transparent);
  color: var(--ex-text-secondary);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.ex-welcome__close:hover {
  color: var(--ex-text-primary);
  border-color: color-mix(in srgb, var(--ex-brand) 35%, var(--ex-border));
}

.ex-welcome__body {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: $space-4;
  padding: $space-5;
  align-items: center;
}

.ex-welcome__illu {
  display: grid;
  place-items: center;
}

.ex-welcome__svg {
  width: 100%;
  height: auto;
  max-width: 260px;
}

.ex-welcome__title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ex-text-primary);
}

.ex-welcome__sub {
  margin-top: 10px;
  font-size: $font-size-sm;
  line-height: 1.55;
  color: var(--ex-text-secondary);
}

@media (max-width: 640px) {
  .ex-welcome__body {
    grid-template-columns: 1fr;
    padding: $space-4;
    text-align: center;
  }
  .ex-welcome__svg {
    max-width: 220px;
  }
}

.ex-welcome-enter-active,
.ex-welcome-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.ex-welcome-enter-from,
.ex-welcome-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>

