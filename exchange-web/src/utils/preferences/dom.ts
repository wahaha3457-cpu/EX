import type { CandlePaletteMode } from '@/types/preferences'

export function applyCandlePaletteToDocument(mode: CandlePaletteMode) {
  const root = document.documentElement
  if (mode === 'intl') root.setAttribute('data-candle-palette', 'intl')
  else root.removeAttribute('data-candle-palette')
}

export function applyPrivacyHideBalancesToDocument(on: boolean) {
  const root = document.documentElement
  if (on) root.setAttribute('data-privacy-hide-balances', 'true')
  else root.removeAttribute('data-privacy-hide-balances')
}
