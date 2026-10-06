/** LINE Creators Market static sticker specifications */
export const STICKER_MAX = { width: 370, height: 320 } as const
export const MAIN_SIZE = { width: 240, height: 240 } as const
export const TAB_SIZE = { width: 96, height: 74 } as const

export const PACK_SIZES = [8, 16, 24, 32, 40] as const

export const MAX_FILE_BYTES = 1 * 1024 * 1024

export function padIndex(index: number): string {
  return String(index).padStart(2, '0')
}
