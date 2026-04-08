<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMobileUiStore } from '@/stores/mobileUiStore'

const ui = useMobileUiStore()
const { confirm } = storeToRefs(ui)
</script>

<template>
  <Teleport to="body">
    <div v-if="confirm" class="m-confirm-overlay" @click.self="ui.answerConfirm(false)">
      <div class="m-confirm" role="dialog" aria-modal="true">
        <h3 class="m-confirm__title">{{ confirm.title }}</h3>
        <p class="m-confirm__msg">{{ confirm.message }}</p>
        <div class="m-confirm__actions">
          <button type="button" class="m-btn m-btn--ghost" @click="ui.answerConfirm(false)">
            {{ confirm.cancelText ?? '取消' }}
          </button>
          <button
            type="button"
            class="m-btn"
            :class="{ 'm-btn--danger': confirm.dangerous }"
            @click="ui.answerConfirm(true)"
          >
            {{ confirm.confirmText ?? '确定' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.m-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
}

.m-confirm {
  width: 100%;
  max-width: 400px;
  border-radius: 20px 20px 16px 16px;
  background: #161c26;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 22px 20px 18px;
  box-shadow: 0 -8px 48px rgba(0, 0, 0, 0.4);
}

.m-confirm__title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: -0.02em;
}

.m-confirm__msg {
  font-size: 14px;
  line-height: 1.5;
  color: #8b95a8;
  margin-bottom: 22px;
}

.m-confirm__actions {
  display: flex;
  gap: 10px;
}

.m-btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
  color: #061210;

  &--ghost {
    background: rgba(255, 255, 255, 0.08);
    color: #eef2f7;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  &--danger {
    background: linear-gradient(180deg, #e89898 0%, #c45c5c 100%);
    color: #fff;
  }
}
</style>
