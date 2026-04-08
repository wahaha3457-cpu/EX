import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchSupportFaq, fetchSupportTickets } from '@/api/support/supportMock'
import type { SupportFaqCategory, SupportFaqItem, SupportTicketItem } from '@/types/supportHub'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useSupportChatUiStore } from '@/stores/supportChatUi'

function uid() {
  return `tk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export type SupportTab = 'faq' | 'tickets' | 'submit'

export const useSupportCenterStore = defineStore('supportCenter', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const faqCategories = ref<SupportFaqCategory[]>([])
  const faqs = ref<SupportFaqItem[]>([])
  const tickets = ref<SupportTicketItem[]>([])
  const searchQuery = ref('')
  const activeCategoryId = ref<string | 'ALL'>('ALL')
  const activeTab = ref<SupportTab>('faq')
  const openFaqId = ref<string | null>(null)

  const filteredFaqs = computed(() => {
    let list = faqs.value
    if (activeCategoryId.value !== 'ALL') {
      list = list.filter((f) => f.categoryId === activeCategoryId.value)
    }
    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q),
      )
    }
    return list
  })

  const hotFaqs = computed(() => faqs.value.filter((f) => f.hot))

  async function bootstrap(force = false) {
    if (faqs.value.length > 0 && !force) return
    loading.value = true
    loadError.value = null
    try {
      const data = await fetchSupportFaq()
      faqCategories.value = data.categories
      faqs.value = data.faqs
      tickets.value = await fetchSupportTickets()
    } catch {
      loadError.value = '客服内容加载失败'
    } finally {
      loading.value = false
    }
  }

  function categoryName(id: string) {
    return faqCategories.value.find((c) => c.id === id)?.name ?? id
  }

  function toggleFaq(id: string) {
    openFaqId.value = openFaqId.value === id ? null : id
  }

  function submitTicket(payload: { subject: string; categoryId: string; body: string }) {
    if (!useAuthStore().isAuthenticated) {
      useAppStore().pushToast('warning', '请先登录后再提交工单')
      return
    }
    const s = payload.subject.trim()
    const b = payload.body.trim()
    if (s.length < 4 || b.length < 10) {
      useAppStore().pushToast('error', '请填写完整标题与问题描述（描述不少于 10 字）')
      return
    }
    tickets.value.unshift({
      id: uid(),
      subject: s,
      categoryId: payload.categoryId,
      status: 'OPEN',
      updatedAt: new Date().toISOString(),
      preview: b.slice(0, 80) + (b.length > 80 ? '…' : ''),
    })
    useAppStore().pushToast('success', '工单已提交（演示），客服将在 24h 内回复')
    activeTab.value = 'tickets'
  }

  function openLiveChat() {
    useSupportChatUiStore().open()
  }

  return {
    loading,
    loadError,
    faqCategories,
    faqs,
    tickets,
    searchQuery,
    activeCategoryId,
    activeTab,
    openFaqId,
    filteredFaqs,
    hotFaqs,
    bootstrap,
    categoryName,
    toggleFaq,
    submitTicket,
    openLiveChat,
  }
})
