<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { SUPPORTED_LANGUAGES, type AppLocaleCode } from '@/locales/supportedLanguages'
import type { CandlePaletteMode, DateFormatPreference } from '@/types/preferences'
import ExPageState from '@/components/common/ExPageState.vue'

const auth = useAuthStore()
const app = useAppStore()
const prefStore = usePreferencesStore()
const { prefs } = storeToRefs(prefStore)

const TIMEZONES: { id: string; label: string }[] = [
  { id: 'auto', label: '自动（跟随浏览器）' },
  { id: 'Asia/Shanghai', label: '中国 · 上海' },
  { id: 'Asia/Hong_Kong', label: '中国香港' },
  { id: 'Asia/Singapore', label: '新加坡' },
  { id: 'Asia/Tokyo', label: '日本 · 东京' },
  { id: 'Europe/London', label: '英国 · 伦敦' },
  { id: 'Europe/Berlin', label: '中欧 · 柏林' },
  { id: 'America/New_York', label: '美国东部 · 纽约' },
  { id: 'America/Los_Angeles', label: '美国西部 · 洛杉矶' },
  { id: 'UTC', label: 'UTC' },
]

const DATE_FORMAT_OPTS: { id: DateFormatPreference; label: string; hint: string }[] = [
  { id: 'iso', label: 'ISO（YYYY-MM-DD）', hint: '技术账单、导出常用' },
  { id: 'locale_cn', label: '中文区域习惯', hint: '与界面语言日期展示对齐' },
  { id: 'locale_us', label: '美式（MM/DD/YYYY）', hint: '部分国际站习惯' },
]

const CANDLE_OPTS: { id: CandlePaletteMode; title: string; desc: string }[] = [
  {
    id: 'cn',
    title: '绿涨红跌',
    desc: '华语区与主流加密终端默认；上涨为绿，下跌为红。',
  },
  {
    id: 'intl',
    title: '红涨绿跌',
    desc: '部分证券/欧美用户习惯；上涨为红，下跌为绿。',
  },
]

const timePreview = computed(() => {
  const tz = prefs.value.timeZone
  const d = new Date()
  try {
    if (tz === 'auto') {
      return d.toLocaleString(app.locale === 'zh-CN' ? 'zh-CN' : 'en-US')
    }
    return d.toLocaleString('zh-CN', { timeZone: tz })
  } catch {
    return d.toLocaleString('zh-CN')
  }
})

function setLocale(code: AppLocaleCode) {
  app.setLocale(code)
}

function onCandle(id: CandlePaletteMode) {
  prefStore.savePartial({ candlePalette: id })
}

function onDateFmt(id: DateFormatPreference) {
  prefStore.savePartial({ dateFormat: id })
}

function onTimeZone(id: string) {
  prefStore.savePartial({ timeZone: id })
}
</script>

<template>
  <div class="pref">
    <header class="pref__hero">
      <div class="pref__hero-text">
        <h2 class="pref__title">偏好设置</h2>
        <p class="pref__lead">
          管理界面语言、主题、行情配色与交易确认等行为。以下为<strong>演示实现</strong>：偏好按账号保存在本机；上线请同步至用户偏好接口并做多端一致下发。
        </p>
        <p class="pref__route-hint">
          独立入口：
          <RouterLink :to="{ name: RouteNames.Preferences }" class="pref__route-link pref__mono"
            >/account/preferences</RouterLink
          >
        </p>
      </div>
    </header>

    <ExPageState :unauthorized="!auth.isAuthenticated">
      <!-- 显示与外观 -->
      <section class="pref__card" aria-labelledby="pref-display-h">
        <h3 id="pref-display-h" class="pref__h">显示与外观</h3>
        <p class="pref__sub">主题与涨跌色全局生效，与顶部快捷切换共用同一套状态。</p>

        <div class="pref__block pref__block--theme">
          <span class="pref__lab">主题模式</span>
          <ThemeToggle />
        </div>

        <div class="pref__block pref__block--stack">
          <span class="pref__lab">行情涨跌配色</span>
          <ul class="pref__choice-list" role="radiogroup" aria-label="涨跌配色">
            <li v-for="c in CANDLE_OPTS" :key="c.id">
              <button
                type="button"
                class="pref__choice"
                :class="{ 'pref__choice--on': prefs.candlePalette === c.id }"
                role="radio"
                :aria-checked="prefs.candlePalette === c.id"
                @click="onCandle(c.id)"
              >
                <span class="pref__choice-title">{{ c.title }}</span>
                <span class="pref__choice-desc">{{ c.desc }}</span>
                <span class="pref__swatch-row" aria-hidden="true">
                  <span
                    class="pref__swatch pref__swatch--up"
                    :class="c.id === 'cn' ? 'pref__swatch--g' : 'pref__swatch--r'"
                  />
                  <span
                    class="pref__swatch pref__swatch--down"
                    :class="c.id === 'cn' ? 'pref__swatch--r' : 'pref__swatch--g'"
                  />
                </span>
              </button>
            </li>
          </ul>
        </div>
      </section>

      <!-- 语言与区域 -->
      <section class="pref__card" aria-labelledby="pref-locale-h">
        <h3 id="pref-locale-h" class="pref__h">语言与区域</h3>
        <p class="pref__sub">语言与站点文案、日期格式联动；RTL 语言（如阿拉伯语）会自动调整排版方向。</p>

        <label class="pref__field">
          <span class="pref__lab">界面语言</span>
          <select :value="app.locale" class="pref__input" @change="setLocale(($event.target as HTMLSelectElement).value as AppLocaleCode)">
            <option v-for="lang in SUPPORTED_LANGUAGES" :key="lang.code" :value="lang.code">
              {{ lang.nativeName }}
            </option>
          </select>
        </label>

        <div class="pref__block pref__block--stack">
          <span class="pref__lab">日期格式偏好</span>
          <ul class="pref__mini-list" role="radiogroup">
            <li v-for="d in DATE_FORMAT_OPTS" :key="d.id">
              <button
                type="button"
                class="pref__mini"
                :class="{ 'pref__mini--on': prefs.dateFormat === d.id }"
                role="radio"
                :aria-checked="prefs.dateFormat === d.id"
                @click="onDateFmt(d.id)"
              >
                <span class="pref__mini-t">{{ d.label }}</span>
                <span class="pref__mini-h">{{ d.hint }}</span>
              </button>
            </li>
          </ul>
        </div>

        <label class="pref__field">
          <span class="pref__lab">默认时区</span>
          <select :value="prefs.timeZone" class="pref__input" @change="onTimeZone(($event.target as HTMLSelectElement).value)">
            <option v-for="z in TIMEZONES" :key="z.id" :value="z.id">{{ z.label }}</option>
          </select>
        </label>
        <p class="pref__hint">当前预览：<span class="pref__mono">{{ timePreview }}</span></p>
      </section>

      <!-- 交易习惯 -->
      <section class="pref__card" aria-labelledby="pref-trade-h">
        <h3 id="pref-trade-h" class="pref__h">交易习惯</h3>
        <p class="pref__sub">降低误触风险；关闭后将直接提交订单（仍受风控与校验约束）。</p>

        <label class="pref__row">
          <div class="pref__row-text">
            <span class="pref__row-title">现货下单前确认</span>
            <span class="pref__row-desc">买入/卖出前弹出二次确认（演示）</span>
          </div>
          <input
            :checked="prefs.confirmSpotOrder"
            type="checkbox"
            class="pref__toggle"
            @change="
              prefStore.savePartial({
                confirmSpotOrder: ($event.target as HTMLInputElement).checked,
              })
            "
          />
        </label>

        <label class="pref__row">
          <div class="pref__row-text">
            <span class="pref__row-title">合约下单前确认</span>
            <span class="pref__row-desc">U 本位与交割合约开仓/平仓前确认（演示）</span>
          </div>
          <input
            :checked="prefs.confirmFuturesOrder"
            type="checkbox"
            class="pref__toggle"
            @change="
              prefStore.savePartial({
                confirmFuturesOrder: ($event.target as HTMLInputElement).checked,
              })
            "
          />
        </label>
      </section>

      <!-- 通知（演示） -->
      <section class="pref__card" aria-labelledby="pref-notify-h">
        <h3 id="pref-notify-h" class="pref__h">通知与营销</h3>
        <p class="pref__sub">以下为演示开关；生产需对接消息中心、邮件服务商与用户订阅合规（含退订）。</p>

        <label class="pref__row">
          <div class="pref__row-text">
            <span class="pref__row-title">邮件 · 活动与产品资讯</span>
            <span class="pref__row-desc">营销类邮件，默认关闭</span>
          </div>
          <input
            :checked="prefs.notifyEmailMarketing"
            type="checkbox"
            class="pref__toggle"
            @change="
              prefStore.savePartial({
                notifyEmailMarketing: ($event.target as HTMLInputElement).checked,
              })
            "
          />
        </label>

        <label class="pref__row">
          <div class="pref__row-text">
            <span class="pref__row-title">推送 · 价格预警</span>
            <span class="pref__row-desc">触及预警价时提醒（演示）</span>
          </div>
          <input
            :checked="prefs.notifyPriceAlert"
            type="checkbox"
            class="pref__toggle"
            @change="
              prefStore.savePartial({ notifyPriceAlert: ($event.target as HTMLInputElement).checked })
            "
          />
        </label>

        <label class="pref__row">
          <div class="pref__row-text">
            <span class="pref__row-title">推送 · 成交通知</span>
            <span class="pref__row-desc">订单成交/部分成交（演示）</span>
          </div>
          <input
            :checked="prefs.notifyOrderFilled"
            type="checkbox"
            class="pref__toggle"
            @change="
              prefStore.savePartial({
                notifyOrderFilled: ($event.target as HTMLInputElement).checked,
              })
            "
          />
        </label>
      </section>

      <!-- 隐私 -->
      <section class="pref__card" aria-labelledby="pref-privacy-h">
        <h3 id="pref-privacy-h" class="pref__h">隐私</h3>
        <p class="pref__sub">在公共场合浏览时隐藏敏感数字；对带「等宽数字」样式的资产与表格生效。</p>

        <label class="pref__row">
          <div class="pref__row-text">
            <span class="pref__row-title">隐藏资产数值</span>
            <span class="pref__row-desc">模糊显示资产页等处的金额</span>
          </div>
          <input
            :checked="prefs.privacyHideBalances"
            type="checkbox"
            class="pref__toggle"
            @change="
              prefStore.savePartial({
                privacyHideBalances: ($event.target as HTMLInputElement).checked,
              })
            "
          />
        </label>
      </section>

      <section class="pref__faq" aria-label="说明">
        <h3 class="pref__faq-title">对接说明</h3>
        <ul class="pref__faq-list">
          <li>生产环境建议 <code class="pref__mono">GET/PUT /v1/users/preferences</code>，字段与前端模型对齐，并做版本迁移。</li>
          <li>主题、语言可继续沿用独立 Cookie/LocalStorage 以减轻首屏闪烁；服务端以最后写入为准合并。</li>
          <li>涨跌配色仅影响前端 CSS 变量；K 线库若硬编码颜色需单独映射。</li>
        </ul>
      </section>

      <p class="pref__reset">
        <button type="button" class="pref__linkish" @click="prefStore.resetDemo()">恢复默认偏好</button>
        <span class="pref__reset-hint">（仅重置本页管理的演示项）</span>
      </p>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.pref {
  min-width: 0;
}

.pref__hero {
  margin-bottom: $space-4;
}

.pref__title {
  margin: 0 0 $space-2;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.pref__lead {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.55;
  max-width: 720px;

  :deep(strong) {
    color: $color-text-secondary;
    font-weight: $font-weight-semibold;
  }
}

.pref__route-hint {
  margin: $space-3 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.pref__mono {
  font-family: $font-family-mono;
  font-size: 11px;
}

.pref__route-link {
  color: $color-brand;
  font-weight: $font-weight-semibold;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.pref__card {
  margin-bottom: $space-4;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.pref__h {
  margin: 0 0 $space-1;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.pref__sub {
  margin: 0 0 $space-4;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.pref__block {
  margin-bottom: $space-4;

  &--stack {
    margin-bottom: 0;
  }

  &--theme {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $space-2;
  }
}

.pref__lab {
  display: block;
  margin-bottom: $space-2;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
}

.pref__field {
  display: block;
  margin-bottom: $space-4;
}

.pref__input {
  width: 100%;
  max-width: 400px;
  padding: 10px 12px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  color: $color-text-primary;
  font-size: $font-size-sm;

  &:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
  }
}

.pref__seg {
  display: inline-flex;
  padding: 3px;
  border-radius: $radius-sm;
  background: var(--ex-bg-muted);
  border: 1px solid $color-border;
  gap: 2px;
}

.pref__seg-btn {
  padding: 8px 20px;
  border: none;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    color: $color-text-secondary;
  }

  &--on {
    background: var(--ex-bg-elevated);
    color: $color-brand;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }
}

.pref__choice-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: $space-2;

  @include mq.media-up(sm) {
    grid-template-columns: 1fr 1fr;
  }
}

.pref__choice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding: $space-3;
  text-align: left;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-muted);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--ex-brand) 35%, transparent);
  }

  &--on {
    border-color: color-mix(in srgb, var(--ex-brand) 55%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--ex-brand) 25%, transparent);
    background: color-mix(in srgb, var(--ex-brand) 6%, transparent);
  }
}

.pref__choice-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.pref__choice-desc {
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.pref__swatch-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.pref__swatch {
  width: 36px;
  height: 10px;
  border-radius: 2px;

  &--g {
    background: #0ecb81;
  }

  &--r {
    background: #f6465d;
  }
}

.pref__mini-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.pref__mini {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-muted);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--ex-brand) 30%, transparent);
  }

  &--on {
    border-color: color-mix(in srgb, var(--ex-brand) 50%, transparent);
    background: color-mix(in srgb, var(--ex-brand) 5%, transparent);
  }
}

.pref__mini-t {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.pref__mini-h {
  font-size: 10px;
  color: $color-text-tertiary;
}

.pref__hint {
  margin: $space-2 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.pref__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-3 0;
  border-bottom: 1px solid $color-border;
  cursor: pointer;

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-of-type {
    padding-top: 0;
  }
}

.pref__row-text {
  min-width: 0;
}

.pref__row-title {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.pref__row-desc {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.4;
}

.pref__toggle {
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  accent-color: var(--ex-brand);
  cursor: pointer;
}

.pref__faq {
  margin-bottom: $space-4;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px dashed $color-border;
  background: var(--ex-bg-muted);
}

.pref__faq-title {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.pref__faq-list {
  margin: 0;
  padding-left: 1.2em;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.55;
}

.pref__reset {
  margin: 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.pref__linkish {
  background: none;
  border: none;
  padding: 0;
  color: $color-brand;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
}

.pref__reset-hint {
  margin-left: 8px;
}
</style>
