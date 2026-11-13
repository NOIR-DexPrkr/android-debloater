import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { marked } from 'marked'
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime.js'

// Per-brand guides bundled with the app; ids match lists/manifest.json
const GUIDE_LABELS: Record<string, string> = {
  general: 'Guía General',
  xiaomi: 'Xiaomi / POCO',
  samsung: 'Samsung',
  google: 'Google Pixel',
  oneplus: 'OnePlus',
  oppo: 'OPPO',
  realme: 'realme',
  vivo: 'vivo / iQOO',
  motorola: 'Motorola',
  huawei: 'Huawei / Honor',
  otros: 'Otras marcas',
}

const guideFiles = import.meta.glob('../guide/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function loadGuide(id: string): string {
  const entry = Object.entries(guideFiles).find(([path]) => path.endsWith(`/${id}.md`))
  return entry ? entry[1] : ''
}

interface GuideProps {
  defaultBrand?: string
}

function Guide({ defaultBrand = '' }: GuideProps) {
  // Determine if a connected brand is recognized
  const connectedBrand = useMemo(() => {
    if (!defaultBrand) return null
    return GUIDE_LABELS[defaultBrand] ? defaultBrand : 'otros'
  }, [defaultBrand])

  const [guideID, setGuideID] = useState<string>(() => {
    if (connectedBrand) return connectedBrand
    return 'general'
  })

  // Follow brand detection when a device is connected or disconnected
  useEffect(() => {
    if (connectedBrand) {
      setGuideID(connectedBrand)
    } else if (guideID !== 'general' && !GUIDE_LABELS[guideID]) {
      setGuideID('general')
    }
  }, [connectedBrand])

  // Brand keys to show: if a device is connected, show ONLY that brand; otherwise show all brands
  const brandKeys = useMemo(() => {
    if (connectedBrand) {
      return [connectedBrand]
    }
    return Object.keys(GUIDE_LABELS).filter((k) => k !== 'general')
  }, [connectedBrand])

  // Each guide is rendered separately (no concatenation)
  const html = useMemo(() => {
    const raw = guideID === 'general' ? loadGuide('comun') : loadGuide(guideID)
    return marked.parse(raw || '', { async: false })
  }, [guideID])

  // Links open in the default system browser
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest('a')
    if (link?.href.startsWith('http')) {
      e.preventDefault()
      BrowserOpenURL(link.href)
    }
  }

  return (
    <div>
      {/* Top selector bar */}
      <div className="sticky top-0 z-10 bg-noir border-b border-noir-border px-6 py-3">
        <div className="flex items-center gap-2 flex-wrap max-w-3xl mx-auto">
          {/* General button: distinct styling, wider and separated */}
          <button
            onClick={() => setGuideID('general')}
            className={`px-4 py-1.5 rounded border font-display font-bold text-[10px] uppercase tracking-[0.09em] transition-all flex items-center gap-2 ${
              guideID === 'general'
                ? 'bg-noir-accent border-noir-cyan text-noir-cyan shadow-sm'
                : 'bg-noir-surface border-noir-border text-noir-body hover:border-noir-border-hover hover:text-noir-text'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                guideID === 'general' ? 'bg-noir-cyan' : 'bg-noir-muted'
              }`}
            />
            Guía General
          </button>

          {/* Subtle separator */}
          <span className="h-4 w-[1px] bg-noir-border mx-1 self-center hidden sm:inline-block" />

          {/* Brand buttons: only the connected device's brand or all brands if none connected */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {brandKeys.map((id) => {
              const label = GUIDE_LABELS[id] || id
              const isSelected = guideID === id
              const isConnectedBrand = connectedBrand === id

              return (
                <button
                  key={id}
                  onClick={() => setGuideID(id)}
                  className={`px-2.5 py-1 rounded border font-display font-bold text-[9px] uppercase tracking-[0.08em] transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-noir-accent border-noir-cyan text-noir-cyan'
                      : 'bg-noir-surface border-noir-border text-noir-body hover:border-noir-border-hover hover:text-noir-text'
                  }`}
                >
                  {isConnectedBrand && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Dispositivo conectado" />
                  )}
                  {label}
                  {isConnectedBrand && (
                    <span className="text-[8px] opacity-75 font-sans lowercase">· conectado</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Guide Content */}
      <div
        className="guide max-w-3xl mx-auto px-6 py-6"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export default Guide
