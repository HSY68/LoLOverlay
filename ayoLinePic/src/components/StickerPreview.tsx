import { useEffect, useRef } from 'react'
import type { StickerItem } from '../types'
import { STICKER_MAX } from '../lib/lineSpecs'

type Props = {
  item: StickerItem
  className?: string
}

export function StickerPreview({ item, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      const { width: tw, height: th } = STICKER_MAX
      canvas.width = tw
      canvas.height = th
      ctx.clearRect(0, 0, tw, th)

      const base =
        item.fitMode === 'cover'
          ? Math.max(tw / img.naturalWidth, th / img.naturalHeight)
          : Math.min(tw / img.naturalWidth, th / img.naturalHeight)
      const drawW = img.naturalWidth * base * item.scale
      const drawH = img.naturalHeight * base * item.scale
      const x = (tw - drawW) / 2 + item.offsetX
      const y = (th - drawH) / 2 + item.offsetY
      ctx.drawImage(img, x, y, drawW, drawH)
    }
    img.src = item.sourceUrl

    return () => {
      cancelled = true
    }
  }, [item])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={STICKER_MAX.width}
      height={STICKER_MAX.height}
      aria-label={item.name}
    />
  )
}
