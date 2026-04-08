<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { useAppStore } from '@/stores/app'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const router = useRouter()
const app = useAppStore()

const items = [
  {
    q: 'OTC 买卖 U 如何保障资金安全？',
    a: '演示环境：订单状态与资产变动由本地模拟。正式环境需完成 KYC、使用平台担保与争议仲裁流程。',
  },
  {
    q: '任务托管与担保托管有何区别？',
    a: '任务托管将赏金冻结在任务合约中；担保托管适用于双方约定的独立交易，按交付与放款节点释放资金。',
  },
  {
    q: '提现多久到账？',
    a: '本 Demo 提交后立即写入「处理中」流水；可继续在资产页查看模拟状态。',
  },
]

const open = ref<number | null>(0)

function toggle(i: number) {
  open.value = open.value === i ? null : i
}
</script>

<template>
  <div class="page">
    <MpBackBar title="帮助中心" />
    <p class="lead">常见问题与风险说明（演示文案）。</p>

    <section v-for="(it, i) in items" :key="i" class="faq">
      <button type="button" class="q" @click="toggle(i)">
        {{ it.q }}
        <span>{{ open === i ? '−' : '+' }}</span>
      </button>
      <p v-show="open === i" class="a">{{ it.a }}</p>
    </section>

    <button type="button" class="cta" @click="router.push({ name: RouteNames.MobileSecurity })">
      安全中心 →
    </button>
    <button
      type="button"
      class="cta ghost"
      @click="app.pushToast('success', '已复制客服邮箱（演示）')"
    >
      联系客服
    </button>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 32px;
}

.lead {
  font-size: 13px;
  color: #8b95a8;
  line-height: 1.5;
  margin-bottom: 20px;
}

.faq {
  margin-bottom: 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  background: rgba(22, 28, 38, 0.72);
}

.q {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border: none;
  background: transparent;
  color: #eef2f7;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  span {
    flex-shrink: 0;
    color: #4dc4ff;
    font-size: 18px;
    font-weight: 400;
  }
}

.a {
  padding: 0 18px 16px;
  font-size: 13px;
  color: #a8b0c0;
  line-height: 1.55;
}

.cta {
  width: 100%;
  margin-top: 12px;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid rgba(46, 230, 200, 0.35);
  background: rgba(46, 230, 200, 0.12);
  color: #2ee6c8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &.ghost {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: #eef2f7;
  }
}
</style>
