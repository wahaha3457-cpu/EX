import { computed, nextTick, ref, type ComputedRef, type Ref } from 'vue'
import type { UserModuleColumn } from '@/config/adminUserModules'

/** 列排序：日期列按时间戳，其余按本地化字符串（含数字感知） */
export function adminSortCompare(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  col: Pick<UserModuleColumn, 'prop' | 'display'>,
): number {
  const va = a[col.prop]
  const vb = b[col.prop]
  if (col.display === 'date') {
    const ta = va != null ? Date.parse(String(va)) : Number.NaN
    const tb = vb != null ? Date.parse(String(vb)) : Number.NaN
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    return ta - tb
  }
  const sa = va == null ? '' : String(va)
  const sb = vb == null ? '' : String(vb)
  return sa.localeCompare(sb, 'zh-CN', { numeric: true, sensitivity: 'base' })
}

export function isAdminColumnSortable(col: Pick<UserModuleColumn, 'sortable'>): boolean {
  return col.sortable !== false
}

/**
 * 多选勾选 + 表格 ref（需配合 el-table row-key、selection-change）
 */
export function useAdminTableSelection(getRowId: (row: Record<string, unknown>) => string) {
  const tableRef = ref<{ clearSelection: () => void } | null>(null)
  const selectedRows = ref<Record<string, unknown>[]>([])

  function onSelectionChange(rows: Record<string, unknown>[]) {
    selectedRows.value = rows
  }

  async function clearTableSelection() {
    await nextTick()
    tableRef.value?.clearSelection()
    selectedRows.value = []
  }

  /** 从原始列表中移除若干 id，并清空勾选 */
  async function removeRowsFromSource(
    rawRows: Ref<Record<string, unknown>[]>,
    ids: Set<string>,
  ) {
    rawRows.value = rawRows.value.filter((r) => !ids.has(getRowId(r)))
    await clearTableSelection()
  }

  return {
    tableRef,
    selectedRows,
    onSelectionChange,
    clearTableSelection,
    removeRowsFromSource,
  }
}

/**
 * 表头排序：对「当前筛选后的全量行」排序后再分页（非仅当前页）
 */
export function useAdminTableSort(
  def: ComputedRef<{ columns: UserModuleColumn[] }>,
  filteredRows: Ref<Record<string, unknown>[]>,
) {
  const sortState = ref<{ prop: string; order: 'ascending' | 'descending' } | null>(null)

  function onSortChange(payload: { prop?: string; order?: string | null }) {
    const { prop, order } = payload
    if (!prop || order == null || order === '') {
      sortState.value = null
      return
    }
    sortState.value = {
      prop,
      order: order === 'ascending' ? 'ascending' : 'descending',
    }
  }

  const orderedFilteredRows = computed(() => {
    const list = [...filteredRows.value]
    const s = sortState.value
    if (!s) return list
    const col = def.value.columns.find((c) => c.prop === s.prop)
    if (!col || !isAdminColumnSortable(col)) return list
    const dir = s.order === 'ascending' ? 1 : -1
    list.sort((a, b) => adminSortCompare(a, b, col) * dir)
    return list
  })

  function resetSort() {
    sortState.value = null
  }

  return { onSortChange, orderedFilteredRows, resetSort }
}
