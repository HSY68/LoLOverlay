import { useEffect, useId, useRef, useState } from 'react'
import './App.css'
import { StickerPreview } from './components/StickerPreview'
import { revokeUrls } from './lib/canvas'
import { exportLinePackZip } from './lib/exportZip'
import { PACK_SIZES } from './lib/lineSpecs'
import type { FitMode, PackMeta, StickerItem } from './types'

const HERO_FACES = [
  { fill: '#06c755', eyes: 'open', mouth: 'smile' },
  { fill: '#1f6f4a', eyes: 'wink', mouth: 'grin' },
  { fill: '#c45c26', eyes: 'open', mouth: 'flat' },
  { fill: '#10221a', eyes: 'open', mouth: 'smile' },
  { fill: '#3aa36a', eyes: 'wink', mouth: 'flat' },
  { fill: '#0a9e4a', eyes: 'open', mouth: 'grin' },
] as const

const DEFAULT_META: PackMeta = {
  title: 'ayoLinePic 貼圖包',
  fitMode: 'contain',
  packSize: 8,
}

function createId() {
  return crypto.randomUUID()
}

async function filesToStickers(
  files: FileList | File[],
  fitMode: FitMode,
): Promise<StickerItem[]> {
  const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
  const items: StickerItem[] = []

  for (const file of list) {
    const sourceUrl = URL.createObjectURL(file)
    const dims = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const img = new Image()
        img.onload = () =>
          resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => reject(new Error(`無法讀取 ${file.name}`))
        img.src = sourceUrl
      },
    )

    items.push({
      id: createId(),
      name: file.name,
      sourceUrl,
      width: dims.width,
      height: dims.height,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      fitMode,
    })
  }

  return items
}

export default function App() {
  const fileInputId = useId()
  const workspaceRef = useRef<HTMLElement>(null)
  const [meta, setMeta] = useState<PackMeta>(DEFAULT_META)
  const [stickers, setStickers] = useState<StickerItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mainId, setMainId] = useState<string | null>(null)
  const [tabId, setTabId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selected = stickers.find((s) => s.id === selectedId) ?? null

  const stickersRef = useRef<StickerItem[]>([])

  useEffect(() => {
    stickersRef.current = stickers
  }, [stickers])

  useEffect(() => {
    return () => revokeUrls(stickersRef.current)
  }, [])

  function scrollToWorkspace() {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function addFiles(files: FileList | File[] | null) {
    if (!files || files.length === 0) return
    setError(null)
    setStatus(null)
    try {
      const next = await filesToStickers(files, meta.fitMode)
      setStickers((prev) => {
        const merged = [...prev, ...next].slice(0, meta.packSize)
        if (!selectedId && merged[0]) setSelectedId(merged[0].id)
        if (!mainId && merged[0]) setMainId(merged[0].id)
        if (!tabId && merged[0]) setTabId(merged[0].id)
        return merged
      })
      if (next.length === 0) {
        setError('請選擇圖片檔（PNG / JPG / WebP）')
      } else {
        setStatus(`已加入 ${next.length} 張，可調整後匯出 ZIP`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '讀取圖片失敗')
    }
  }

  function updateSelected(patch: Partial<StickerItem>) {
    if (!selectedId) return
    setStickers((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)),
    )
  }

  function applyFitModeAll(fitMode: FitMode) {
    setMeta((m) => ({ ...m, fitMode }))
    setStickers((prev) => prev.map((s) => ({ ...s, fitMode })))
  }

  function removeSelected() {
    if (!selectedId) return
    setStickers((prev) => {
      const target = prev.find((s) => s.id === selectedId)
      if (target) URL.revokeObjectURL(target.sourceUrl)
      const next = prev.filter((s) => s.id !== selectedId)
      const fallback = next[0]?.id ?? null
      setSelectedId(fallback)
      if (mainId === selectedId) setMainId(fallback)
      if (tabId === selectedId) setTabId(fallback)
      return next
    })
  }

  function clearAll() {
    revokeUrls(stickers)
    setStickers([])
    setSelectedId(null)
    setMainId(null)
    setTabId(null)
    setStatus(null)
    setError(null)
  }

  async function handleExport() {
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const limited = stickers.slice(0, meta.packSize)
      await exportLinePackZip(
        limited,
        meta.title,
        mainId ?? limited[0]?.id ?? '',
        tabId ?? limited[0]?.id ?? '',
      )
      setStatus(`已匯出 ${limited.length} 張貼圖 ZIP（含 main.png / tab.png）`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '匯出失敗')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-visual" aria-hidden="true">
          <div className="sticker-plane">
            {Array.from({ length: 24 }, (_, i) => {
              const face = HERO_FACES[i % HERO_FACES.length]
              return (
                <div className="sticker-tile" key={i} data-tone={i % 3}>
                  <svg viewBox="0 0 100 100" className="face">
                    <circle cx="50" cy="52" r="34" fill={face.fill} />
                    {face.eyes === 'wink' ? (
                      <>
                        <circle cx="38" cy="46" r="3.2" fill="#f3faf6" />
                        <path
                          d="M58 46h10"
                          stroke="#f3faf6"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                        />
                      </>
                    ) : (
                      <>
                        <circle cx="38" cy="46" r="3.2" fill="#f3faf6" />
                        <circle cx="62" cy="46" r="3.2" fill="#f3faf6" />
                      </>
                    )}
                    {face.mouth === 'grin' ? (
                      <path
                        d="M36 60c4 10 24 10 28 0"
                        fill="none"
                        stroke="#f3faf6"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                      />
                    ) : face.mouth === 'flat' ? (
                      <path
                        d="M40 62h20"
                        stroke="#f3faf6"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                    ) : (
                      <path
                        d="M38 60c3 8 21 8 24 0"
                        fill="none"
                        stroke="#f3faf6"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                </div>
              )
            })}
          </div>
        </div>
        <div className="hero-copy">
          <p className="brand">ayoLinePic</p>
          <h1>把圖片變成可上傳的 LINE 貼圖</h1>
          <p>拖入圖片，自動套用 370×320 規格，一鍵打包 ZIP。</p>
          <div className="cta-row">
            <button type="button" className="btn btn-primary" onClick={scrollToWorkspace}>
              開始製作
            </button>
            <a
              className="btn btn-ghost"
              href="https://creator.line.me/en/guideline/sticker/"
              target="_blank"
              rel="noreferrer"
            >
              LINE 規格說明
            </a>
          </div>
        </div>
      </header>

      <main className="workspace" ref={workspaceRef} id="workspace">
        <div className="workspace-head">
          <div>
            <h2>貼圖工作台</h2>
            <p>
              支援一次匯入多張圖，自動透明底裁切進最大 370×320，並產出
              main（240×240）與 tab（96×74）。
            </p>
          </div>
          <div className="cta-row">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={stickers.length === 0 || busy}
              onClick={handleExport}
            >
              {busy ? '匯出中…' : '匯出 LINE ZIP'}
            </button>
            <button
              type="button"
              className="btn btn-soft"
              disabled={stickers.length === 0 || busy}
              onClick={clearAll}
            >
              清空
            </button>
          </div>
        </div>

        <div className="meta-bar">
          <div className="field">
            <label htmlFor="pack-title">貼圖包名稱</label>
            <input
              id="pack-title"
              value={meta.title}
              onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
              placeholder="ayoLinePic 貼圖包"
            />
          </div>
          <div className="field">
            <label htmlFor="pack-size">目標張數</label>
            <select
              id="pack-size"
              value={meta.packSize}
              onChange={(e) =>
                setMeta((m) => ({
                  ...m,
                  packSize: Number(e.target.value) as PackMeta['packSize'],
                }))
              }
            >
              {PACK_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} 張
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="fit-mode">預設縮放</label>
            <select
              id="fit-mode"
              value={meta.fitMode}
              onChange={(e) => applyFitModeAll(e.target.value as FitMode)}
            >
              <option value="contain">完整放入（留邊）</option>
              <option value="cover">填滿裁切</option>
            </select>
          </div>
        </div>

        <label
          className={`dropzone${dragging ? ' active' : ''}`}
          htmlFor={fileInputId}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void addFiles(e.dataTransfer.files)
          }}
        >
          <strong>拖放圖片到這裡</strong>
          <span>或點擊選取 · PNG 透明底效果最佳 · 最多 {meta.packSize} 張</span>
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              void addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>

        <div className="layout">
          <section aria-label="貼圖清單">
            {stickers.length === 0 ? (
              <p className="empty-editor">尚未加入貼圖。先拖幾張圖進來吧。</p>
            ) : (
              <div className="sticker-grid">
                {stickers.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`sticker-slot${item.id === selectedId ? ' selected' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="preview">
                      <img src={item.sourceUrl} alt="" />
                      <div className="badge-row">
                        <span className="badge">{String(index + 1).padStart(2, '0')}</span>
                        {item.id === mainId && <span className="badge main">MAIN</span>}
                        {item.id === tabId && <span className="badge tab">TAB</span>}
                      </div>
                    </div>
                    <div className="slot-meta">{item.name}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="editor" aria-label="編輯面板">
            {selected ? (
              <>
                <h3>調整這張</h3>
                <p className="hint">{selected.name}</p>
                <div className="editor-preview">
                  <StickerPreview item={selected} />
                </div>
                <div className="controls">
                  <div className="control">
                    <label>
                      <span>縮放</span>
                      <span>{selected.scale.toFixed(2)}×</span>
                    </label>
                    <input
                      type="range"
                      min={0.4}
                      max={2.5}
                      step={0.01}
                      value={selected.scale}
                      onChange={(e) =>
                        updateSelected({ scale: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="control">
                    <label>
                      <span>水平位移</span>
                      <span>{Math.round(selected.offsetX)}</span>
                    </label>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={selected.offsetX}
                      onChange={(e) =>
                        updateSelected({ offsetX: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="control">
                    <label>
                      <span>垂直位移</span>
                      <span>{Math.round(selected.offsetY)}</span>
                    </label>
                    <input
                      type="range"
                      min={-160}
                      max={160}
                      step={1}
                      value={selected.offsetY}
                      onChange={(e) =>
                        updateSelected({ offsetY: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="control">
                    <label htmlFor="item-fit">這張的縮放模式</label>
                    <select
                      id="item-fit"
                      value={selected.fitMode}
                      onChange={(e) =>
                        updateSelected({ fitMode: e.target.value as FitMode })
                      }
                    >
                      <option value="contain">完整放入</option>
                      <option value="cover">填滿裁切</option>
                    </select>
                  </div>
                  <div className="control-row">
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={() => setMainId(selected.id)}
                    >
                      設為 Main
                    </button>
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={() => setTabId(selected.id)}
                    >
                      設為 Tab
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={removeSelected}
                    >
                      移除
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="empty-editor">選一張貼圖後，可在此微調位置與縮放。</p>
            )}

            {error && <p className="status-line error">{error}</p>}
            {status && !error && <p className="status-line">{status}</p>}
            <p className="status-line">
              目前 {stickers.length} / {meta.packSize} 張
              {stickers.length > 0 && stickers.length < 8
                ? '（Creators Market 最少 8 張）'
                : ''}
            </p>
          </aside>
        </div>

        <p className="footer-note">
          匯出結構：<code>png/01.png …</code>、<code>png/main.png</code>、
          <code>png/tab.png</code>。上傳前請確認背景透明、尺寸為偶數，並符合
          <a
            href="https://creator.line.me/en/guideline/sticker/"
            target="_blank"
            rel="noreferrer"
          >
            LINE Creators Market
          </a>
          規範。
        </p>
      </main>
    </div>
  )
}
