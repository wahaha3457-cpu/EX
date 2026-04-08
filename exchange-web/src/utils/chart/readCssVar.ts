/** 读取已解析的 CSS 变量（适用于 runtime 图表主题与 data-theme 联动） */
export function readCssVar(name: string, root: HTMLElement = document.documentElement): string {
  return getComputedStyle(root).getPropertyValue(name).trim()
}
