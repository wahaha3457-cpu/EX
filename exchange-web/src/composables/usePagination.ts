import { computed, ref } from 'vue'

/** 通用列表分页状态（表格、历史记录等） */
export function usePagination(initialPage = 1, initialPageSize = 20) {
  const page = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const total = ref(0)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  function setPage(p: number) {
    page.value = Math.max(1, p)
  }

  function setPageSize(s: number) {
    pageSize.value = Math.max(1, s)
  }

  function reset() {
    page.value = initialPage
    pageSize.value = initialPageSize
    total.value = 0
  }

  return { page, pageSize, total, totalPages, setPage, setPageSize, reset }
}
