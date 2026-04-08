<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { useAppStore } from '@/stores/app'
import { useMobileUiStore } from '@/stores/mobileUiStore'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const router = useRouter()
const app = useAppStore()
const ui = useMobileUiStore()

const twoFa = ref(false)
const bio = ref(true)

async function toggle2fa() {
  if (!twoFa.value) {
    const ok = await ui.openConfirm({
      title: '开启二次验证',
      message: '演示：开启后将显示成功提示，无真实绑定。',
      confirmText: '开启',
    })
    if (ok) {
      twoFa.value = true
      app.pushToast('success', '已开启二次验证（演示）')
    }
  } else {
    const ok = await ui.openConfirm({
      title: '关闭二次验证',
      message: '关闭后大额操作可能受限（演示文案）。',
      confirmText: '仍要关闭',
      dangerous: true,
    })
    if (ok) {
      twoFa.value = false
      app.pushToast('warning', '已关闭（演示）')
    }
  }
}
</script>

<template>
  <div class="page">
    <MpBackBar title="安全中心" />
    <p class="lead">登录保护、设备与验证（高保真演示）。</p>

    <div class="card">
      <div class="row">
        <div>
          <strong>二次验证</strong>
          <small>短信 / 验证器（模拟）</small>
        </div>
        <button type="button" class="switch" :class="{ on: twoFa }" @click="toggle2fa">
          <span />
        </button>
      </div>
      <div class="row">
        <div>
          <strong>生物识别</strong>
          <small>Face ID / 指纹快捷解锁</small>
        </div>
        <button
          type="button"
          class="switch"
          :class="{ on: bio }"
          @click="
            bio = !bio;
            app.pushToast('info', bio ? '已开启' : '已关闭')
          "
        >
          <span />
        </button>
      </div>
    </div>

    <h3 class="sec">登录设备</h3>
    <button
      type="button"
      class="device"
      @click="app.pushToast('info', '本机 · 当前会话（演示）')"
    >
      <span>📱</span>
      <div>
        <strong>iPhone · Safari</strong>
        <small>上海 · 刚刚活跃</small>
      </div>
      <em>当前</em>
    </button>
    <button
      type="button"
      class="device"
      @click="
        app.pushToast('warning', '已发送下线请求（演示）')
      "
    >
      <span>💻</span>
      <div>
        <strong>MacBook · Chrome</strong>
        <small>新加坡 · 3 天前</small>
      </div>
      <em>下线</em>
    </button>

    <button type="button" class="link" @click="router.push({ name: RouteNames.MobileHelp })">
      风险与争议处理 →
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
  margin-bottom: 18px;
}

.card {
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 28, 38, 0.82);
  overflow: hidden;
  margin-bottom: 22px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }

  strong {
    display: block;
    font-size: 15px;
    margin-bottom: 4px;
  }

  small {
    font-size: 12px;
    color: #8b95a8;
  }
}

.switch {
  width: 52px;
  height: 30px;
  border-radius: 15px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;

  span {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
  }

  &.on {
    background: rgba(46, 230, 200, 0.45);

    span {
      transform: translateX(22px);
    }
  }
}

.sec {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #8b95a8;
  margin-bottom: 10px;
}

.device {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  margin-bottom: 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 28, 38, 0.6);
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;

  span:first-child {
    font-size: 22px;
  }

  strong {
    display: block;
    font-size: 14px;
    margin-bottom: 2px;
  }

  small {
    font-size: 12px;
    color: #8b95a8;
  }

  em {
    margin-left: auto;
    font-style: normal;
    font-size: 12px;
    color: #4dc4ff;
  }
}

.link {
  width: 100%;
  margin-top: 20px;
  padding: 14px;
  border: none;
  background: transparent;
  color: #c9a962;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}
</style>
