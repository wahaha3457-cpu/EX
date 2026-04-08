<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useFundPasswordStore } from '@/stores/fundPassword'
import { useAppStore } from '@/stores/app'
import ExSixDigitPinInput from '@/components/common/ExSixDigitPinInput.vue'

const fp = useFundPasswordStore()
const app = useAppStore()
const { visible, mode } = storeToRefs(fp)

const pwd = ref('')
const pwd2 = ref('')
const oldPwd = ref('')
const agreed = ref(false)

const title = computed(() => (mode.value === 'change' ? '修改资金密码' : '设置资金密码'))

watch(visible, (v) => {
  if (v) {
    pwd.value = ''
    pwd2.value = ''
    oldPwd.value = ''
    agreed.value = false
  }
})

const canSubmitSet = computed(() => {
  return pwd.value.length === 6 && pwd2.value.length === 6 && agreed.value
})

const canSubmitChange = computed(() => {
  return oldPwd.value.length === 6 && pwd.value.length === 6 && pwd2.value.length === 6
})

function close() {
  fp.close()
}

function submit() {
  if (mode.value === 'set') {
    const r = fp.submitSet(pwd.value, pwd2.value)
    if (!r.ok) {
      app.pushToast('error', r.message)
      return
    }
    app.pushToast('success', '资金密码已设置')
    close()
    return
  }
  const r = fp.submitChange(oldPwd.value, pwd.value, pwd2.value)
  if (!r.ok) {
    app.pushToast('error', r.message)
    return
  }
  app.pushToast('success', '资金密码已更新')
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fppm-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click.self="close"
    >
      <div class="fppm">
        <div class="fppm__head">
          <div class="fppm__head-text">
            <h2 class="fppm__title">{{ title }}</h2>
            <p class="fppm__subtitle">
              资金密码用于提现、站内敏感资金类操作，与登录密码相互独立；请妥善保管，勿向他人透露。
            </p>
          </div>
          <button type="button" class="fppm__x" aria-label="关闭" @click="close">×</button>
        </div>

        <div class="fppm__body">
          <ul class="fppm__rules" aria-label="规则说明">
            <li>须为 <strong>6 位数字</strong>，不建议使用生日、连续或重复数字等弱密码。</li>
            <li>设置成功后，提现等操作将要求输入资金密码（以实际风控策略为准）。</li>
            <li>本演示环境密码仅存于本机浏览器，更换设备或清除站点数据后需重新设置。</li>
          </ul>

          <template v-if="mode === 'set'">
            <label class="fppm__field">
              <span class="fppm__lab">资金密码</span>
              <ExSixDigitPinInput v-model="pwd" autocomplete="new-password" />
            </label>
            <label class="fppm__field">
              <span class="fppm__lab">确认资金密码</span>
              <ExSixDigitPinInput v-model="pwd2" autocomplete="new-password" no-auto-focus />
            </label>
            <label class="fppm__check">
              <input v-model="agreed" type="checkbox" class="fppm__cb" />
              <span>我已阅读并理解资金密码的用途与风险，将妥善保管且不向任何人泄露。</span>
            </label>
          </template>

          <template v-else>
            <label class="fppm__field">
              <span class="fppm__lab">原资金密码</span>
              <ExSixDigitPinInput v-model="oldPwd" autocomplete="current-password" />
            </label>
            <label class="fppm__field">
              <span class="fppm__lab">新资金密码</span>
              <ExSixDigitPinInput v-model="pwd" autocomplete="new-password" no-auto-focus />
            </label>
            <label class="fppm__field">
              <span class="fppm__lab">确认新资金密码</span>
              <ExSixDigitPinInput v-model="pwd2" autocomplete="new-password" no-auto-focus />
            </label>
          </template>
        </div>

        <div class="fppm__foot">
          <button type="button" class="fppm__btn fppm__btn--ghost" @click="close">取消</button>
          <button
            v-if="mode === 'set'"
            type="button"
            class="fppm__btn fppm__btn--primary"
            :disabled="!canSubmitSet"
            @click="submit"
          >
            确认设置
          </button>
          <button
            v-else
            type="button"
            class="fppm__btn fppm__btn--primary"
            :disabled="!canSubmitChange"
            @click="submit"
          >
            确认修改
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.fppm-overlay {
  position: fixed;
  inset: 0;
  z-index: 570;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.fppm {
  width: 100%;
  max-width: 440px;
  max-height: min(92vh, 680px);
  overflow-y: auto;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-modal-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.fppm__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-4 $space-4 $space-3;
  border-bottom: 1px solid $color-border;
}

.fppm__head-text {
  min-width: 0;
}

.fppm__title {
  margin: 0 0 $space-2;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.02em;
}

.fppm__subtitle {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.55;
  max-width: 360px;
}

.fppm__x {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
  margin-top: -2px;
}

.fppm__body {
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.fppm__rules {
  margin: 0;
  padding: $space-3 $space-3 $space-3 $space-5;
  font-size: 11px;
  line-height: 1.55;
  color: $color-text-secondary;
  background: rgba(240, 185, 11, 0.06);
  border: 1px solid rgba(240, 185, 11, 0.18);
  border-radius: $radius-sm;

  li {
    margin-bottom: 6px;
  }

  li:last-child {
    margin-bottom: 0;
  }

  strong {
    color: $color-brand;
    font-weight: $font-weight-bold;
  }
}

.fppm__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fppm__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
}

.fppm__input {
  padding: 12px $space-3;
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

.fppm__check {
  display: flex;
  gap: $space-2;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-secondary;
  cursor: pointer;
  align-items: flex-start;
  margin-top: 2px;
}

.fppm__cb {
  margin-top: 2px;
  accent-color: $color-brand;
  flex-shrink: 0;
}

.fppm__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.fppm__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.fppm__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.fppm__btn--primary {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
}

.fppm__btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
