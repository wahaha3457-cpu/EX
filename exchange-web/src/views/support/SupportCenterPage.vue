<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupportCenterStore } from '@/stores/supportCenter'
import { useSupportChatUiStore } from '@/stores/supportChatUi'
import ExPageState from '@/components/common/ExPageState.vue'
import SupportHubNav from '@/components/support/SupportHubNav.vue'

const store = useSupportCenterStore()
const chatUi = useSupportChatUiStore()
const {
  loading,
  loadError,
  filteredFaqs,
  hotFaqs,
  tickets,
  searchQuery,
  activeCategoryId,
  activeTab,
  openFaqId,
  faqCategories,
} = storeToRefs(store)

const ticketSubject = ref('')
const ticketCategoryId = ref('')
const ticketBody = ref('')

onMounted(() => {
  void store.bootstrap().then(() => {
    const first = faqCategories.value[0]?.id
    if (first && !ticketCategoryId.value) ticketCategoryId.value = first
  })
})

const categoryOptions = computed(() => faqCategories.value)

/** 热门区已展示，列表中不再重复 */
const normalFaqs = computed(() => filteredFaqs.value.filter((f) => !f.hot))

function openChat() {
  chatUi.open()
}

function onSubmitTicket() {
  store.submitTicket({
    subject: ticketSubject.value,
    categoryId: ticketCategoryId.value || categoryOptions.value[0]?.id || 'general',
    body: ticketBody.value,
  })
  ticketSubject.value = ''
  ticketBody.value = ''
}

function ticketStatusLabel(s: string) {
  if (s === 'OPEN') return '待处理'
  if (s === 'PENDING') return '处理中'
  if (s === 'RESOLVED') return '已解决'
  return s
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN')
}
</script>

<template>
  <div class="scp">
    <header class="scp__hero">
      <h1 class="scp__title">客服中心</h1>
      <p class="scp__sub">
        自助查询常见问题、跟踪工单，或通过右下角悬浮窗发起在线咨询（演示）。布局参考
        <a
          class="scp__a"
          href="https://www.binance.com/zh-CN/support"
          target="_blank"
          rel="noopener noreferrer"
          >币安支持中心</a
        >
        的窗口化信息结构。
      </p>
    </header>

    <SupportHubNav />

    <div class="scp__toolbar">
      <button type="button" class="scp__cta" @click="openChat">
        <span class="scp__cta-glow" aria-hidden="true" />
        <span class="scp__cta-label">打开在线咨询窗口</span>
      </button>
      <p class="scp__toolbar-hint">与全站右下角悬浮客服按钮相同，可在任意页面唤起对话面板。</p>
    </div>

    <div class="scp__desk">
      <!-- 左侧：快捷服务「窗口」 -->
      <aside class="scp-win scp-win--side" aria-label="快捷服务">
        <header class="scp-win__bar">
          <span class="scp-win__dots" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span class="scp-win__title">快捷服务</span>
        </header>
        <div class="scp-win__body scp-win__body--side">
          <ul class="scp-shortcuts">
            <li><button type="button" class="scp-shortcuts__btn" @click="openChat">在线咨询</button></li>
            <li>
              <button type="button" class="scp-shortcuts__btn" @click="store.activeTab = 'faq'">
                常见问题
              </button>
            </li>
            <li>
              <button type="button" class="scp-shortcuts__btn" @click="store.activeTab = 'tickets'">
                我的工单
              </button>
            </li>
            <li>
              <button type="button" class="scp-shortcuts__btn" @click="store.activeTab = 'submit'">
                提交工单
              </button>
            </li>
          </ul>
          <p class="scp-win__note">
            请勿向任何「客服」透露短信验证码、谷歌验证码或私钥；官方不会致电索要资金密码。
          </p>
        </div>
      </aside>

      <!-- 右侧：主工作台「窗口」 -->
      <section class="scp-win scp-win--main" aria-label="客服工作台">
        <header class="scp-win__bar scp-win__bar--main">
          <span class="scp-win__dots" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span class="scp-win__title">支持工作台</span>
          <span class="scp-win__badge">演示</span>
        </header>

        <div class="scp-win__tabs" role="tablist" aria-label="客服功能分区">
          <button
            type="button"
            role="tab"
            class="scp-win__tab"
            :class="{ 'scp-win__tab--on': activeTab === 'faq' }"
            :aria-selected="activeTab === 'faq'"
            @click="store.activeTab = 'faq'"
          >
            常见问题
          </button>
          <button
            type="button"
            role="tab"
            class="scp-win__tab"
            :class="{ 'scp-win__tab--on': activeTab === 'tickets' }"
            :aria-selected="activeTab === 'tickets'"
            @click="store.activeTab = 'tickets'"
          >
            我的工单
          </button>
          <button
            type="button"
            role="tab"
            class="scp-win__tab"
            :class="{ 'scp-win__tab--on': activeTab === 'submit' }"
            :aria-selected="activeTab === 'submit'"
            @click="store.activeTab = 'submit'"
          >
            提交工单
          </button>
        </div>

        <div class="scp-win__body">
          <ExPageState
            :loading="loading && activeTab === 'faq'"
            use-skeleton
            skeleton-variant="panel"
            :error="activeTab === 'faq' ? loadError : null"
            loading-text="加载帮助内容…"
            @retry="store.bootstrap(true)"
          >
            <!-- FAQ -->
            <div v-show="activeTab === 'faq'" class="scp-pane" role="tabpanel">
              <div class="scp-search">
                <input
                  v-model="searchQuery"
                  type="search"
                  class="scp-search__input"
                  placeholder="搜索问题关键词…"
                  aria-label="搜索常见问题"
                />
              </div>
              <div class="scp-faq-cats" role="tablist" aria-label="问题分类">
                <button
                  type="button"
                  class="scp-chip"
                  :class="{ 'scp-chip--on': activeCategoryId === 'ALL' }"
                  @click="activeCategoryId = 'ALL'"
                >
                  全部
                </button>
                <button
                  v-for="c in faqCategories"
                  :key="c.id"
                  type="button"
                  class="scp-chip"
                  :class="{ 'scp-chip--on': activeCategoryId === c.id }"
                  @click="activeCategoryId = c.id"
                >
                  {{ c.name }}
                </button>
              </div>

              <section v-if="hotFaqs.length" class="scp-hot" aria-label="热门问题">
                <h3 class="scp-hot__h">热门</h3>
                <ul class="scp-hot__list">
                  <li v-for="f in hotFaqs" :key="'h-' + f.id">
                    <button type="button" class="scp-faq-q" @click="store.toggleFaq(f.id)">
                      {{ f.question }}
                    </button>
                    <div v-if="openFaqId === f.id" class="scp-faq-a">{{ f.answer }}</div>
                  </li>
                </ul>
              </section>

              <ul class="scp-faq-list">
                <li v-for="f in normalFaqs" :key="f.id" class="scp-faq-item">
                  <button type="button" class="scp-faq-q" @click="store.toggleFaq(f.id)">
                    <span class="scp-faq-q__tag">{{ store.categoryName(f.categoryId) }}</span>
                    {{ f.question }}
                  </button>
                  <div v-show="openFaqId === f.id" class="scp-faq-a">{{ f.answer }}</div>
                </li>
              </ul>
              <p v-if="!loading && !normalFaqs.length && !hotFaqs.length" class="scp-empty">未找到相关问题</p>
            </div>

            <!-- Tickets -->
            <div v-show="activeTab === 'tickets'" class="scp-pane" role="tabpanel">
              <ul v-if="tickets.length" class="scp-ticket-list">
                <li v-for="tk in tickets" :key="tk.id" class="scp-ticket">
                  <div class="scp-ticket__top">
                    <span class="scp-ticket__subj">{{ tk.subject }}</span>
                    <span class="scp-ticket__st" :data-st="tk.status">{{
                      ticketStatusLabel(tk.status)
                    }}</span>
                  </div>
                  <p class="scp-ticket__prev">{{ tk.preview }}</p>
                  <time class="scp-ticket__time" :datetime="tk.updatedAt">{{ fmtDate(tk.updatedAt) }}</time>
                </li>
              </ul>
              <p v-else class="scp-empty">暂无工单记录</p>
            </div>

            <!-- Submit -->
            <div v-show="activeTab === 'submit'" class="scp-pane scp-pane--form" role="tabpanel">
              <p class="scp-form-hint">登录后可提交工单（演示数据仅存于本机会话）。</p>
              <label class="scp-label">
                <span>标题</span>
                <input v-model="ticketSubject" type="text" class="scp-input" maxlength="120" />
              </label>
              <label class="scp-label">
                <span>分类</span>
                <select v-model="ticketCategoryId" class="scp-input">
                  <option v-for="c in categoryOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </label>
              <label class="scp-label">
                <span>问题描述（不少于 10 字）</span>
                <textarea v-model="ticketBody" class="scp-input scp-input--area" rows="5" />
              </label>
              <button type="button" class="scp-submit" @click="onSubmitTicket">提交工单</button>
            </div>
          </ExPageState>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.scp {
  max-width: min(1040px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-10;
  box-sizing: border-box;
}

.scp__hero {
  margin-bottom: $space-3;
}

.scp__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.scp__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.55;
}

.scp__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.scp__a:hover {
  text-decoration: underline;
}

.scp__toolbar {
  margin: $space-4 0 $space-5;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--ex-brand) 8%, var(--ex-card-surface)) 0%,
    var(--ex-card-surface) 55%
  );
}

.scp__cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--ex-on-brand);
  background: var(--ex-brand);
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--ex-brand) 35%, transparent);
  transition:
    transform 0.18s ease,
    filter 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }

  &:active {
    transform: translateY(0);
  }
}

.scp__cta-glow {
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, transparent 55%);
  pointer-events: none;
}

.scp__cta-label {
  position: relative;
}

.scp__toolbar-hint {
  margin: $space-3 0 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.scp__desk {
  display: grid;
  grid-template-columns: minmax(220px, 260px) 1fr;
  gap: $space-4;
  align-items: start;
}

.scp-win {
  border-radius: 12px;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.scp-win__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--ex-panel-sunken);
  border-bottom: 1px solid $color-border;
}

.scp-win__bar--main {
  justify-content: flex-start;
}

.scp-win__dots {
  display: flex;
  gap: 5px;

  i {
    display: block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    opacity: 0.85;
    &:nth-child(1) {
      background: #ff5f57;
    }
    &:nth-child(2) {
      background: #febc2e;
    }
    &:nth-child(3) {
      background: #28c840;
    }
  }
}

.scp-win__title {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.scp-win__badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
}

.scp-win__tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.scp-win__tab {
  flex: 1;
  padding: 12px 10px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  cursor: pointer;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 0;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: transparent;
    transition: background 0.15s;
  }

  &:hover {
    color: $color-text-primary;
  }
}

.scp-win__tab--on {
  color: $color-text-primary;

  &::after {
    background: var(--ex-brand);
  }
}

.scp-win__body {
  padding: $space-4;
  min-height: 420px;
}

.scp-win__body--side {
  min-height: auto;
}

.scp-win__note {
  margin: $space-4 0 0;
  font-size: 11px;
  line-height: 1.55;
  color: $color-text-tertiary;
}

.scp-shortcuts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scp-shortcuts__btn {
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: 10px;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  color: $color-text-primary;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;

  &:hover {
    border-color: rgba(240, 185, 11, 0.4);
    background: color-mix(in srgb, var(--ex-brand) 6%, var(--ex-panel-sunken));
  }
}

.scp-pane {
  min-height: 360px;
}

.scp-search {
  margin-bottom: $space-3;
}

.scp-search__input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  font-size: $font-size-sm;
  border-radius: 10px;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  color: $color-text-primary;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.45);
  }
}

.scp-faq-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: $space-4;
}

.scp-chip {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  border-radius: 999px;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  color: $color-text-tertiary;
  cursor: pointer;
}

.scp-chip--on {
  color: $color-text-primary;
  border-color: rgba(240, 185, 11, 0.45);
  background: rgba(240, 185, 11, 0.1);
}

.scp-hot {
  margin-bottom: $space-4;
  padding: $space-3;
  border-radius: 10px;
  border: 1px dashed rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.04);
}

.scp-hot__h {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-brand;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.scp-hot__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.scp-faq-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.scp-faq-q {
  width: 100%;
  text-align: left;
  padding: $space-3 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: 10px;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  color: $color-text-primary;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgba(240, 185, 11, 0.3);
  }
}

.scp-faq-q__tag {
  display: inline-block;
  margin-right: 8px;
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(48, 132, 252, 0.12);
  color: #6bb6ff;
  vertical-align: middle;
}

.scp-faq-a {
  margin-top: 8px;
  padding: $space-3;
  font-size: $font-size-sm;
  line-height: 1.6;
  color: $color-text-secondary;
  border-radius: 10px;
  background: var(--ex-card-surface);
  border: 1px solid $color-border;
}

.scp-empty {
  text-align: center;
  padding: $space-8;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.scp-ticket-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.scp-ticket {
  padding: $space-3;
  border-radius: 10px;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.scp-ticket__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.scp-ticket__subj {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.scp-ticket__st {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(48, 132, 252, 0.12);
  color: #6bb6ff;

  &[data-st='OPEN'] {
    background: rgba(240, 185, 11, 0.15);
    color: $color-brand;
  }
  &[data-st='RESOLVED'] {
    background: rgba(14, 203, 129, 0.12);
    color: #0ecb81;
  }
}

.scp-ticket__prev {
  margin: 0 0 8px;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
}

.scp-ticket__time {
  font-size: 10px;
  color: $color-text-tertiary;
}

.scp-pane--form {
  max-width: 520px;
}

.scp-form-hint {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.scp-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.scp-input {
  padding: 10px 12px;
  font-size: $font-size-sm;
  border-radius: 10px;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  color: $color-text-primary;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.45);
  }
}

.scp-input--area {
  resize: vertical;
  min-height: 120px;
}

.scp-submit {
  margin-top: $space-2;
  padding: 12px 24px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: 10px;
  background: var(--ex-brand);
  color: var(--ex-on-brand);
  cursor: pointer;

  &:hover {
    filter: brightness(1.05);
  }
}

@include mq.media-down(md) {
  .scp__desk {
    grid-template-columns: 1fr;
  }

  .scp-win--side {
    order: 2;
  }

  .scp-win--main {
    order: 1;
  }
}
</style>
