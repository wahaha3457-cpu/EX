<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useNftUserStore } from '@/stores/nftUser'
import { NFT_SELL_FEE_RATE } from '@/api/nft/nftLiteDb'
import { formatPrice } from '@/utils/format'

const props = defineProps<{
  modelValue: boolean
  itemId: string
  title: string
  cover: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'listed'): void
}>()

const auth = useAuthStore()
const app = useAppStore()
const user = useNftUserStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const price = ref<number>(0)

watch(
  () => props.modelValue,
  (v) => {
    if (v) price.value = 0
  },
)

const feeUsdt = computed(() => +(price.value * NFT_SELL_FEE_RATE).toFixed(2))
const netUsdt = computed(() => +(price.value - feeUsdt.value).toFixed(2))

async function onConfirm() {
  const uid = auth.user?.userCode
  if (!uid) return
  const r = await user.list({ uid, itemId: props.itemId, priceUsdt: price.value })
  if (!r.ok) {
    app.pushToast('warning', '上架失败，请检查价格或状态')
    return
  }
  app.pushToast('success', '已上架')
  emit('listed')
  visible.value = false
}
</script>

<template>
  <el-dialog v-model="visible" title="上架出售" width="min(100%, 420px)" append-to-body destroy-on-close>
    <div class="nld">
      <div class="nld__sum">
        <img class="nld__img" :src="cover" :alt="title" />
        <div class="nld__txt">
          <p class="nld__name">{{ title }}</p>
          <p class="nld__sub">固定价格 · USDT</p>
        </div>
      </div>

      <div class="nld__form">
        <label class="nld__lab">出售价格（USDT）</label>
        <el-input-number v-model="price" :min="1" :step="1" :precision="2" class="nld__price" />
      </div>

      <div class="nld__lines">
        <div class="nld__line">
          <span>平台手续费（卖方）</span>
          <span class="ex-num">{{ (NFT_SELL_FEE_RATE * 100).toFixed(0) }}%</span>
        </div>
        <div class="nld__line">
          <span>预计手续费</span>
          <span class="ex-num">{{ formatPrice(feeUsdt) }} USDT</span>
        </div>
        <div class="nld__line nld__line--total">
          <span>预计到账</span>
          <span class="ex-num">{{ formatPrice(netUsdt) }} USDT</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="nld__foot">
        <button type="button" class="nld__btn" @click="visible = false">取消</button>
        <button type="button" class="nld__btn nld__btn--pri" :disabled="price <= 0" @click="onConfirm">
          确认上架
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.nld__sum {
  display: flex;
  gap: $space-3;
  padding-bottom: $space-3;
  margin-bottom: $space-3;
  border-bottom: 1px solid $color-border;
}

.nld__img {
  width: 72px;
  height: 72px;
  border-radius: $radius-md;
  object-fit: cover;
  border: 1px solid $color-border;
  flex-shrink: 0;
}

.nld__name {
  margin: 0 0 4px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.nld__sub {
  margin: 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.nld__lab {
  display: block;
  margin-bottom: $space-2;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  font-weight: $font-weight-semibold;
}

.nld__lines {
  margin-top: $space-4;
  padding-top: $space-3;
  border-top: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.nld__line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.nld__line--total {
  color: $color-text-primary;
  font-weight: $font-weight-bold;
}

.nld__foot {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
}

.nld__btn {
  border: 1px solid $color-border;
  background: transparent;
  color: $color-text-primary;
  border-radius: $radius-sm;
  padding: 8px 12px;
  font-weight: $font-weight-semibold;
  cursor: pointer;
}

.nld__btn--pri {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
  border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
}

.nld__btn--pri:hover {
  background: var(--ex-brand-hover);
}
</style>

