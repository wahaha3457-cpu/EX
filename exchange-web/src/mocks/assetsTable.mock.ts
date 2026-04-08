import type { AssetsTableRow } from '@/types/assetsTable'

export const mockAssetsTableRowsSpot: AssetsTableRow[] = [
  {
    asset: 'USDT',
    totalDisplay: '12,580.32',
    availableDisplay: '10,200.00',
    frozenDisplay: '120.50',
    marginOccupiedDisplay: null,
    valueQuoteDisplay: '12,580.32',
  },
  {
    asset: 'BTC',
    totalDisplay: '0.0521',
    availableDisplay: '0.0500',
    frozenDisplay: '0.0021',
    marginOccupiedDisplay: null,
    valueQuoteDisplay: '3,420.18',
  },
]

export const mockAssetsTableRowsFutures: AssetsTableRow[] = [
  {
    asset: 'USDT',
    totalDisplay: '5,000.00',
    availableDisplay: '2,100.00',
    frozenDisplay: '0',
    marginOccupiedDisplay: '2,900.00',
    valueQuoteDisplay: '5,000.00',
  },
]
