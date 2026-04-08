import type { UserModuleColumn } from '@/config/adminUserModules'

/** CSV 单元格转义（RFC 4180） */
export function escapeCsvField(value: string): string {
  let s = value
  if (s.includes('"')) s = s.replace(/"/g, '""')
  if (/[",\r\n]/.test(s)) return `"${s}"`
  return s
}

/** 下载用文件名片段：去掉路径非法字符 */
export function sanitizeFilenameBase(name: string): string {
  const t = name.replace(/[/\\:*?"<>|]/g, '_').replace(/\s+/g, '_').trim()
  return t.slice(0, 80) || 'export'
}

export function timestampForFilename(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

/** UTF-8 BOM，便于 Excel 正确打开中文 */
export function triggerUtf8BomCsvDownload(csvBody: string, filename: string): void {
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvBody], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export type AdminModuleExportColumn = Pick<UserModuleColumn, 'prop' | 'label' | 'display' | 'tagMap'>

export function adminModuleCellCsvText(col: AdminModuleExportColumn, row: Record<string, unknown>): string {
  const v = row[col.prop]
  if (col.display === 'tag' && col.tagMap) {
    const k = String(v ?? '')
    return col.tagMap[k]?.label ?? k
  }
  if (v == null) return ''
  return String(v)
}

/** 后台配置驱动列表（用户/订单/配置等模块）：表头与单元格与列表展示一致（含 tag 中文标签） */
export function buildAdminModuleListCsv(
  columns: AdminModuleExportColumn[],
  rows: Record<string, unknown>[],
): string {
  const header = columns.map((c) => escapeCsvField(c.label)).join(',')
  const lines = [header]
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvField(adminModuleCellCsvText(c, row))).join(','))
  }
  return lines.join('\r\n')
}

export type CsvColumnPick<T extends Record<string, unknown>> = {
  header: string
  key: keyof T & string
  format?: (raw: unknown, row: T) => string
}

/** 财务/报表等强类型行：按字段导出 */
export function buildCsvFromKeyedRows<T extends Record<string, unknown>>(rows: T[], spec: CsvColumnPick<T>[]): string {
  const header = spec.map((s) => escapeCsvField(s.header)).join(',')
  const lines = [header]
  for (const row of rows) {
    const cells = spec.map((s) => {
      const raw = row[s.key]
      const text = s.format ? s.format(raw, row) : raw == null ? '' : String(raw)
      return escapeCsvField(text)
    })
    lines.push(cells.join(','))
  }
  return lines.join('\r\n')
}
