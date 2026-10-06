import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { StickerItem } from '../types'
import {
  renderMainImage,
  renderStickerToBlob,
  renderTabImage,
} from './canvas'
import { padIndex } from './lineSpecs'

export async function exportLinePackZip(
  items: StickerItem[],
  packTitle: string,
  mainId: string,
  tabId: string,
) {
  if (items.length === 0) {
    throw new Error('請先加入至少一張貼圖')
  }

  const zip = new JSZip()
  const folder = zip.folder('png')
  if (!folder) throw new Error('無法建立 ZIP 資料夾')

  for (let i = 0; i < items.length; i += 1) {
    const blob = await renderStickerToBlob(items[i])
    folder.file(`${padIndex(i + 1)}.png`, blob)
  }

  const mainItem = items.find((s) => s.id === mainId) ?? items[0]
  const tabItem = items.find((s) => s.id === tabId) ?? items[0]

  folder.file('main.png', await renderMainImage(mainItem))
  folder.file('tab.png', await renderTabImage(tabItem))

  const content = await zip.generateAsync({ type: 'blob' })
  const safeName =
    packTitle.trim().replace(/[^\w\u4e00-\u9fff-]+/g, '_') || 'ayoLinePic'
  saveAs(content, `${safeName}-line-stickers.zip`)
}
