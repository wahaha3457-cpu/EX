import { formatOrderQty, formatPrice } from '@/utils/format/number'
import type { AssetsBalanceRow } from '@/types/assetsCenter'
import type { AssetsTableRow } from '@/types/assetsTable'

/** 币种余额数量：与委托量同级精度策略，折合估值用 {@link formatPrice}（计价货币） */
function fmtQty(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return formatOrderQty(n)
}

/**
 * @param showMarginColumn 为 true 时填充 margin 列（合约账户）；否则 margin 为 null，表格不渲染该列
 */
export function mapBalancesToAssetsTableRows(
  rows: AssetsBalanceRow[],
  showMarginColumn: boolean,
): AssetsTableRow[] {
  return rows.map((r) => ({
    asset: r.asset,
    totalDisplay: fmtQty(r.total),
    availableDisplay: fmtQty(r.available),
    frozenDisplay: fmtQty(r.frozen),
    marginOccupiedDisplay:
      showMarginColumn && r.marginOccupied != null && Number.isFinite(r.marginOccupied)
        ? fmtQty(r.marginOccupied)
        : showMarginColumn
          ? '—'
          : null,
    valueQuoteDisplay: formatPrice(r.valueUsdt),
  }))
}
