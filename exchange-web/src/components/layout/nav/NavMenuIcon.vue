<script setup lang="ts">
import type { Component } from 'vue'
import { defineComponent, h } from 'vue'
import {
  Bell,
  ChatDotRound,
  CircleCheck,
  Coin,
  Connection,
  Cpu,
  CreditCard,
  DataLine,
  Document,
  Finished,
  Grid,
  Headset,
  Histogram,
  Iphone,
  Lock,
  Medal,
  Postcard,
  Promotion,
  Refresh,
  Search,
  SetUp,
  Share,
  Switch,
  SwitchButton,
  User,
  Wallet,
} from '@element-plus/icons-vue'

/** 语言/地区：线框地球，与 Element Plus 线形图标视觉重量对齐 */
const LocaleGlobeOutline = defineComponent(function LocaleGlobeOutline() {
  return () =>
    h(
      'svg',
      {
        class: 'nav-menu-icon',
        viewBox: '0 0 24 24',
        xmlns: 'http://www.w3.org/2000/svg',
        fill: 'none',
        'aria-hidden': 'true',
      },
      [
        h('circle', {
          cx: '12',
          cy: '12',
          r: '9',
          stroke: 'currentColor',
          'stroke-width': '1.5',
        }),
        h('ellipse', {
          cx: '12',
          cy: '12',
          rx: '3.25',
          ry: '9',
          stroke: 'currentColor',
          'stroke-width': '1.5',
        }),
        h('ellipse', {
          cx: '12',
          cy: '12',
          rx: '9',
          ry: '3.25',
          stroke: 'currentColor',
          'stroke-width': '1.5',
        }),
      ],
    )
})

const props = defineProps<{
  name: string
}>()

const MAP: Record<string, Component> = {
  spot: DataLine,
  copy: Connection,
  demo: Cpu,
  convert: Switch,
  c2c: Postcard,
  perpetual: Histogram,
  options: Finished,
  fund: Wallet,
  miner: SetUp,
  lending: CreditCard,
  staking: Lock,
  announce: Bell,
  activity: Promotion,
  support: Headset,
  news: Document,
  nft: Grid,
  charity: Medal,
  app: Iphone,
  chat: ChatDotRound,
  locale: LocaleGlobeOutline,
  search: Search,
  walletOverview: Grid,
  walletSpot: Coin,
  walletFutures: Histogram,
  walletEarn: Medal,
  walletFunding: Wallet,
  walletNft: Grid,
  walletTransfer: Connection,
  walletHistory: Refresh,
  userOverview: Grid,
  userAssets: Wallet,
  userOrders: Document,
  userAccount: User,
  userSecurity: Lock,
  userKyc: CircleCheck,
  userInvite: Share,
  userLogout: SwitchButton,
}
</script>

<template>
  <component :is="MAP[props.name] ?? DataLine" class="nav-menu-icon" aria-hidden="true" />
</template>

<style scoped lang="scss">
.nav-menu-icon {
  display: block;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  color: inherit;
  vertical-align: middle;
}
</style>
