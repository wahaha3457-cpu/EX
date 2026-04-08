/** 将图片压成较小 JPEG data URL，控制 localStorage 体积 */

const MAX_EDGE = 256
const JPEG_Q = 0.86

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('load'))
      img.src = url
    })
    let w = img.naturalWidth
    let h = img.naturalHeight
    const scale = Math.min(1, MAX_EDGE / Math.max(w, h))
    w = Math.max(1, Math.round(w * scale))
    h = Math.max(1, Math.round(h * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('ctx')
    ctx.drawImage(img, 0, 0, w, h)
    let q = JPEG_Q
    let out = canvas.toDataURL('image/jpeg', q)
    while (out.length > 480_000 && q > 0.45) {
      q -= 0.08
      out = canvas.toDataURL('image/jpeg', q)
    }
    return out
  } finally {
    URL.revokeObjectURL(url)
  }
}
