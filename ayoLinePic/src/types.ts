export type FitMode = 'contain' | 'cover'

export interface StickerItem {
  id: string
  name: string
  sourceUrl: string
  width: number
  height: number
  scale: number
  offsetX: number
  offsetY: number
  fitMode: FitMode
}

export interface PackMeta {
  title: string
  fitMode: FitMode
  packSize: 8 | 16 | 24 | 32 | 40
}
