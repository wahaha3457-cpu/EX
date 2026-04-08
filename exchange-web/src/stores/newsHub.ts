import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { NewsCategory, NewsSegment, NewsArticleMeta } from '@/types/news'
import { fetchNewsArticles } from '@/api/news'
import { translate } from '@/i18n'

const ALL = 'ALL' as const

export const useNewsHubStore = defineStore('newsHub', () => {
  const segment = ref<NewsSegment>('featured')
  const categoryFilter = ref<NewsCategory | typeof ALL>(ALL)
  const searchQuery = ref('')

  const articles = ref<NewsArticleMeta[]>([])
  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const selectedSlug = ref<string | null>(null)

  async function bootstrap() {
    if (articles.value.length > 0) return
    loading.value = true
    loadError.value = null
    try {
      articles.value = await fetchNewsArticles()
    } catch {
      loadError.value = translate('news.error.load')
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    loading.value = true
    loadError.value = null
    try {
      articles.value = await fetchNewsArticles()
    } catch {
      loadError.value = translate('news.error.load')
    } finally {
      loading.value = false
    }
  }

  function setSegment(s: NewsSegment) {
    segment.value = s
    if (s === 'flash') categoryFilter.value = ALL
  }

  function setCategory(c: NewsCategory | typeof ALL) {
    categoryFilter.value = c
  }

  function setSearch(q: string) {
    searchQuery.value = q
  }

  function openArticle(slug: string) {
    selectedSlug.value = slug
  }

  function closeArticle() {
    selectedSlug.value = null
  }

  const trending = computed(() =>
    [...articles.value].sort((a, b) => b.views - a.views).slice(0, 5),
  )

  const filteredArticles = computed(() => {
    let rows = [...articles.value]

    if (segment.value === 'featured') {
      rows = rows.filter((x) => x.featured)
    } else if (segment.value === 'flash') {
      rows = rows.filter((x) => x.category === 'FLASH')
    }

    if (categoryFilter.value !== ALL) {
      rows = rows.filter((x) => x.category === categoryFilter.value)
    }

    rows.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    return rows
  })

  const selectedMeta = computed(() => {
    const s = selectedSlug.value
    if (!s) return null
    return articles.value.find((a) => a.slug === s) ?? null
  })

  return {
    segment,
    categoryFilter,
    searchQuery,
    articles,
    loading,
    loadError,
    selectedSlug,
    selectedMeta,
    trending,
    filteredArticles,
    bootstrap,
    refresh,
    setSegment,
    setCategory,
    setSearch,
    openArticle,
    closeArticle,
  }
})
