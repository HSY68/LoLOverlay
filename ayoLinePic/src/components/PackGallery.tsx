import { useEffect, useState } from 'react'

type ManifestSticker = {
  file: string
  label: string
}

type Manifest = {
  id: string
  title: string
  character: string
  count: number
  stickers: ManifestSticker[]
  zip: string
}

const PACK_BASE = '/packs/daily24'

export function PackGallery() {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${PACK_BASE}/manifest.json`)
      .then((res) => {
        if (!res.ok) throw new Error('無法載入貼圖包')
        return res.json() as Promise<Manifest>
      })
      .then((data) => {
        if (!cancelled) setManifest(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '載入失敗')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <section className="pack-gallery" id="daily24">
        <p className="status-line error">{error}</p>
      </section>
    )
  }

  if (!manifest) {
    return (
      <section className="pack-gallery" id="daily24">
        <p className="status-line">載入日常用語貼圖包…</p>
      </section>
    )
  }

  return (
    <section className="pack-gallery" id="daily24">
      <div className="workspace-head">
        <div>
          <h2>{manifest.title}</h2>
          <p>
            依上傳角色生成的 {manifest.count}{' '}
            張日常用語貼圖，已套 LINE 規格（370×320）與透明底，可直接下載 ZIP。
          </p>
        </div>
        <div className="cta-row">
          <a
            className="btn btn-secondary"
            href={`${PACK_BASE}/${manifest.zip}`}
            download
          >
            下載 LINE ZIP
          </a>
        </div>
      </div>

      <div className="pack-showcase">
        {manifest.stickers.map((item, index) => (
          <figure className="pack-item" key={item.file}>
            <div className="pack-thumb">
              <img
                src={`${PACK_BASE}/${item.file}`}
                alt={item.label}
                loading="lazy"
              />
              <span className="badge">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <figcaption>{item.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
