import type { FitMode, StickerItem } from '../types'
import { MAIN_SIZE, STICKER_MAX, TAB_SIZE } from './lineSpecs'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('無法載入圖片'))
    img.src = url
  })
}

function computeDrawRect(
  imgW: number,
  imgH: number,
  canvasW: number,
  canvasH: number,
  fitMode: FitMode,
  scale: number,
  offsetX: number,
  offsetY: number,
) {
  const base =
    fitMode === 'cover'
      ? Math.max(canvasW / imgW, canvasH / imgH)
      : Math.min(canvasW / imgW, canvasH / imgH)

  const drawW = imgW * base * scale
  const drawH = imgH * base * scale
  const x = (canvasW - drawW) / 2 + offsetX
  const y = (canvasH - drawH) / 2 + offsetY
  return { x, y, drawW, drawH }
}

export async function renderStickerToBlob(
  item: StickerItem,
  targetW: number = STICKER_MAX.width,
  targetH: number = STICKER_MAX.height,
): Promise<Blob> {
  const img = await loadImage(item.sourceUrl)
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  ctx.clearRect(0, 0, targetW, targetH)
  const { x, y, drawW, drawH } = computeDrawRect(
    img.naturalWidth,
    img.naturalHeight,
    targetW,
    targetH,
    item.fitMode,
    item.scale,
    item.offsetX * (targetW / STICKER_MAX.width),
    item.offsetY * (targetH / STICKER_MAX.height),
  )
  ctx.drawImage(img, x, y, drawW, drawH)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  )
  if (!blob) throw new Error('PNG 匯出失敗')
  return blob
}

export async function renderMainImage(item: StickerItem): Promise<Blob> {
  return renderStickerToBlob(item, MAIN_SIZE.width, MAIN_SIZE.height)
}

export async function renderTabImage(item: StickerItem): Promise<Blob> {
  return renderStickerToBlob(item, TAB_SIZE.width, TAB_SIZE.height)
}

export function revokeUrls(items: StickerItem[]) {
  for (const item of items) {
    URL.revokeObjectURL(item.sourceUrl)
  }
}
