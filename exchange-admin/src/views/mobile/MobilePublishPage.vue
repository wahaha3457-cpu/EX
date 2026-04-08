<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'

const router = useRouter()
</script>

<template>
  <div class="pub">
    <div class="pub__status">9:41 · 发布</div>
    <header class="pub__hdr">
      <h1>发布</h1>
      <p>创建任务、托管或服务 listing</p>
    </header>
    <p class="intro">
      资金通过平台<strong>托管</strong>流转，验收后再结算（演示数据会写入本地）。
    </p>
    <button type="button" class="card primary" @click="router.push({ name: RouteNames.MobilePublishTask })">
      <span class="ic">✦</span>
      <strong>发布任务</strong>
      <small>设定赏金 · 托管结算</small>
      <span class="ar">→</span>
    </button>
    <button type="button" class="card" @click="router.push({ name: RouteNames.MobilePublishEscrow })">
      <span class="ic">⛨</span>
      <strong>创建托管交易</strong>
      <small>锁定 USDT · 条件满足释放</small>
      <span class="ar c">→</span>
    </button>
    <button type="button" class="card dim" @click="router.push({ name: RouteNames.MobilePublishService })">
      <span class="ic">◇</span>
      <strong>上架服务 · 数字资源</strong>
      <small>定价展示 · 买家意向沟通（演示）</small>
      <span class="ar g">→</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.pub {
  padding: 12px 18px 24px;
}

.pub__status {
  font-size: 12px;
  color: #8b95a8;
  margin-bottom: 12px;
}

.pub__hdr h1 {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 4px;
}

.pub__hdr p {
  font-size: 13px;
  color: #8b95a8;
  margin-bottom: 16px;
}

.intro {
  font-size: 13px;
  line-height: 1.55;
  color: #8b95a8;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(77, 196, 255, 0.06);
  border: 1px solid rgba(77, 196, 255, 0.14);
  margin-bottom: 18px;

  strong {
    color: #2ee6c8;
  }
}

.card {
  position: relative;
  width: 100%;
  text-align: left;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 22px 20px;
  margin-bottom: 14px;
  cursor: pointer;
  color: inherit;
  font: inherit;
  background: rgba(22, 28, 38, 0.82);

  &.primary {
    background: linear-gradient(145deg, rgba(46, 230, 200, 0.18) 0%, rgba(22, 28, 38, 0.92) 55%);
    border-color: rgba(46, 230, 200, 0.2);
  }

  &.dim {
    opacity: 0.88;
    border-color: rgba(201, 169, 98, 0.2);
  }

  .ic {
    display: inline-flex;
    width: 48px;
    height: 48px;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    font-size: 22px;
    margin-bottom: 12px;
    background: rgba(46, 230, 200, 0.15);
    border: 1px solid rgba(46, 230, 200, 0.25);
  }

  strong {
    display: block;
    font-size: 18px;
    margin-bottom: 6px;
  }

  small {
    font-size: 13px;
    color: #8b95a8;
    line-height: 1.4;
  }

  .ar {
    position: absolute;
    right: 18px;
    bottom: 22px;
    font-size: 20px;
    color: #2ee6c8;
    font-weight: 700;

    &.c {
      color: #4dc4ff;
    }

    &.g {
      color: #c9a962;
    }
  }

  .badge {
    position: absolute;
    top: 14px;
    right: 14px;
    font-size: 10px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 8px;
    background: rgba(201, 169, 98, 0.18);
    color: #c9a962;
  }
}
</style>
