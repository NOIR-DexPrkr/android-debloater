import { useEffect, useState } from 'react'
import icon from '../assets/images/noiradb-icon.png'
import avatar from '../assets/images/avatar.webp'
import { CheckADB, GetPackages } from '../../wailsjs/go/main/App.js'
import { BrowserOpenURL, ClipboardSetText, Environment } from '../../wailsjs/runtime/runtime.js'

interface HomeProps {
  onStart: () => void
  onGuide: () => void
  devicesConnected?: number
  deviceInfo?: Record<string, string>
  selectedSerial?: string
}

// Kinetic typography: marquee rows, alternating directions (DEXNR hero)
const MARQUEE_ROWS = [
  { words: ['DEBLOAT', 'UNIVERSAL', 'NOIRADB', 'ANDROID'], direction: 'left' as const },
  { words: ['ADB', 'SIN ROOT', 'REVERSIBLE', 'MULTI-MARCA'], direction: 'right' as const },
  { words: ['ANUNCIOS', 'TELEMETRÍA', 'BLOATWARE', 'DEXNR'], direction: 'left' as const },
  { words: ['SAMSUNG', 'PIXEL', 'XIAOMI', 'MOTOROLA'], direction: 'right' as const },
  { words: ['ONEPLUS', 'OPPO', 'REALME', 'VIVO'], direction: 'left' as const },
]

const PLATFORM_TOOLS_URL = 'https://developer.android.com/tools/releases/platform-tools'
const GITHUB_REPO_URL = 'https://github.com/NOIR-DexPrkr/android-debloater'

// Easiest install command per platform, with fallbacks when it fails
const INSTALL_OPTIONS: Record<
  string,
  { label: string; primary: string; alternatives: { text: string; command?: string; url?: string }[] }
> = {
  windows: {
    label: 'Windows',
    primary: 'winget install Google.PlatformTools',
    alternatives: [
      {
        text: '¿No tienes winget? Descarga platform-tools y agrégalo al PATH',
        url: PLATFORM_TOOLS_URL,
      },
    ],
  },
  darwin: {
    label: 'macOS',
    primary: 'brew install android-platform-tools',
    alternatives: [
      {
        text: '¿No tienes Homebrew? Descarga platform-tools y agrégalo al PATH',
        url: PLATFORM_TOOLS_URL,
      },
    ],
  },
  linux: {
    label: 'Linux',
    primary: 'sudo apt install adb',
    alternatives: [
      { text: 'Fedora, openSUSE', command: 'sudo dnf install android-tools' },
      { text: 'Arch, Manjaro', command: 'sudo pacman -S android-tools' },
      { text: 'Descarga oficial de platform-tools', url: PLATFORM_TOOLS_URL },
    ],
  },
}

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Home({
  onStart,
  onGuide,
  devicesConnected = 0,
  deviceInfo = {},
  selectedSerial = '',
}: HomeProps) {
  const isConnected = devicesConnected > 0
  const isBrandSupported = Boolean(deviceInfo.brand_id && deviceInfo.brand_id.trim() !== '')
  const rawBrand = deviceInfo.brand_name || deviceInfo.manufacturer || deviceInfo.brand || 'Marca no detectada'
  const rawModel = deviceInfo.model || deviceInfo.device || 'Dispositivo Android'

  const [adbState, setAdbState] = useState<'checking' | 'installed' | 'missing'>('checking')
  const [adbVersion, setAdbVersion] = useState('')
  const [platform, setPlatform] = useState('')
  const [copiedCmd, setCopiedCmd] = useState('')

  // Modal state for requesting unsupported brand addition
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [reportData, setReportData] = useState<{
    jsonText: string
    markdownText: string
    packages: string[]
  } | null>(null)
  const [copiedReport, setCopiedReport] = useState(false)

  const checkAdb = async () => {
    setAdbState('checking')
    try {
      const version = await CheckADB()
      setAdbVersion(version.split('\n')[0])
      setAdbState('installed')
    } catch {
      setAdbVersion('')
      setAdbState('missing')
    }
  }

  useEffect(() => {
    Environment().then((env) => setPlatform(env.platform)).catch(() => setPlatform(''))
    checkAdb()
  }, [])

  const copyCmd = async (cmd: string) => {
    await ClipboardSetText(cmd)
    setCopiedCmd(cmd)
    setTimeout(() => setCopiedCmd(''), 1500)
  }

  // Load packages for brand submission report
  const handleOpenRequestModal = async () => {
    setRequestModalOpen(true)
    setCopiedReport(false)

    if (reportData) return

    setLoadingPackages(true)
    try {
      const serial = selectedSerial || deviceInfo.serial || ''
      let pkgNames: string[] = []
      if (serial) {
        const pkgs = await GetPackages(serial, '')
        pkgNames = (pkgs || [])
          .map((p: any) => p.name || p.Name)
          .filter(Boolean)
          .sort()
      }

      const payload = {
        request: 'new-brand-support',
        brand: rawBrand,
        manufacturer: deviceInfo.manufacturer || '',
        model: rawModel,
        android_version: deviceInfo.android || '',
        sdk: deviceInfo.sdk || '',
        total_packages: pkgNames.length,
        packages: pkgNames,
      }

      const jsonText = JSON.stringify(payload, null, 2)
      const markdownText = `### Solicitud de nueva marca: ${rawBrand}
- **Marca / Fabricante**: ${rawBrand} ${deviceInfo.manufacturer ? `(${deviceInfo.manufacturer})` : ''}
- **Modelo**: ${rawModel}
- **Versión de Android**: ${deviceInfo.android || 'Desconocida'} (SDK ${deviceInfo.sdk || ''})
- **Total de paquetes instalados**: ${pkgNames.length}

\`\`\`json
${jsonText}
\`\`\``

      setReportData({
        jsonText,
        markdownText,
        packages: pkgNames,
      })
    } catch (err) {
      console.error('Error al obtener paquetes para reporte:', err)
    } finally {
      setLoadingPackages(false)
    }
  }

  const handleCopyAndOpenIssue = async () => {
    if (!reportData) return
    await ClipboardSetText(reportData.markdownText)
    setCopiedReport(true)

    // Open GitHub issue with template
    const title = encodeURIComponent(`[New Brand] ${rawBrand} - ${rawModel}`)
    const issueUrl = `${GITHUB_REPO_URL}/issues/new?template=brand-request.yml&title=${title}`
    BrowserOpenURL(issueUrl)

    setTimeout(() => setCopiedReport(false), 4000)
  }

  const handleDownloadJSON = () => {
    if (!reportData) return
    const blob = new Blob([reportData.jsonText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const brandSlug = rawBrand.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const modelSlug = rawModel.toLowerCase().replace(/[^a-z0-9]/g, '_')
    a.href = url
    a.download = `reporte_${brandSlug}_${modelSlug}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const installOptions = INSTALL_OPTIONS[platform]

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero Section: kinetic typography + avatar, DEXNR style */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-12 overflow-hidden min-h-[400px] border-b border-noir-border">
        {/* Kinetic typography background */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-around select-none opacity-[0.16]"
          aria-hidden="true"
        >
          {MARQUEE_ROWS.map((row, idx) => (
            <div key={idx} className="noir-marquee-row">
              <div
                className={`noir-marquee-track ${
                  row.direction === 'left' ? 'noir-marquee-track-left' : 'noir-marquee-track-right'
                }`}
              >
                {[0, 1].map((group) => (
                  <div key={group} className="flex items-center flex-nowrap">
                    {row.words.map((word, i) => (
                      <span
                        key={`${group}-${i}`}
                        className="font-display font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-wider mx-5 sm:mx-7 flex-shrink-0 text-noir-text"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Dex Parker avatar */}
        <div className="pointer-events-none absolute right-2 sm:right-6 md:right-12 bottom-0 top-10 flex items-end justify-end select-none z-[1]">
          <img
            src={avatar}
            alt="Dex Parker"
            className="h-full w-auto max-w-[200px] sm:max-w-[260px] md:max-w-[320px] object-contain object-bottom"
            style={{
              WebkitMaskImage:
                'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.9) 16%, black 90%)',
              maskImage:
                'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.9) 16%, black 90%)',
            }}
          />
        </div>

        {/* Branding */}
        <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <img src={icon} alt="Noir Android Debloater" className="h-14 sm:h-16 w-auto select-none" />
            <h1 className="font-display font-black text-5xl sm:text-6xl tracking-[-0.03em] leading-none uppercase text-noir-text select-none">
              NOIR<span className="text-noir-cyan">ADB</span>
            </h1>
          </div>

          <span className="inline-block rounded bg-noir-accent border border-noir-cyan px-2.5 py-1 font-display font-bold text-[10px] uppercase tracking-[0.08em] text-noir-cyan mb-5">
            Debloater universal para Android
          </span>

          <p className="font-sans text-noir-body text-sm sm:text-base max-w-xl leading-relaxed">
            Elimina el bloatware, los anuncios y la telemetría de tus teléfonos Android de
            cualquier marca: Xiaomi, Samsung, Google Pixel, OnePlus, OPPO, realme, vivo,
            Motorola, Huawei y más. Funciona por ADB, sin root y con acciones reversibles.
          </p>
        </div>
      </section>

      {/* Main Content Area: depends on whether a device is connected */}
      {!isConnected ? (
        /* ======================== CUANDO NO ESTÁ CONECTADO ======================== */
        <div className="w-full">
          {/* BANNER DESTACADO: Esperando conexión de dispositivo */}
          <div className="w-full max-w-5xl mx-auto px-6 pt-8 pb-2">
            <div className="bg-noir-surface border-2 border-amber-500/50 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg relative overflow-hidden">
              <div className="flex items-start sm:items-center gap-4">
                <div className="relative flex h-5 w-5 flex-shrink-0 mt-0.5 sm:mt-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="font-display font-black text-base sm:text-lg text-noir-text uppercase tracking-wider">
                      Esperando conexión de dispositivo Android
                    </h2>
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 font-display font-bold text-[10px] uppercase tracking-wider animate-pulse">
                      Escaneo ADB activo
                    </span>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-noir-body mt-1">
                    Conecta tu teléfono Android por cable USB. Desbloquea la pantalla y acepta la depuración por USB cuando aparezca en pantalla.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-noir-muted font-mono text-xs bg-noir px-3.5 py-2 rounded-lg border border-noir-border flex-shrink-0 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>adb wait-for-device</span>
              </div>
            </div>
          </div>

          {/* Grid de 2 columnas: Detección ADB y Guía de activación */}
          <section className="w-full max-w-5xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Columna 1: Detección y descarga ADB */}
              <div className="bg-noir-surface border border-noir-border border-l-[3px] border-l-noir-cyan rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-noir border border-noir-border flex items-center justify-center text-noir-cyan flex-shrink-0">
                        <svg {...ICON_PROPS} className="w-[18px] h-[18px]">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="m7 9 3 3-3 3" />
                          <path d="M13 15h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-noir-text">Detección de ADB</h3>
                        <p className="font-sans text-xs text-noir-body leading-relaxed">
                          Android Debug Bridge para la conexión PC-móvil.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {adbState === 'checking' && (
                        <span className="px-2 py-0.5 rounded border bg-noir-surface border-noir-border text-noir-muted font-display font-bold text-[10px] uppercase tracking-[0.08em]">
                          Comprobando…
                        </span>
                      )}
                      {adbState === 'installed' && (
                        <span
                          className="px-2 py-0.5 rounded border bg-noir-accent border-noir-cyan text-noir-cyan font-display font-bold text-[10px] uppercase tracking-[0.08em] max-w-[200px] truncate"
                          title={adbVersion}
                        >
                          ADB instalado
                        </span>
                      )}
                      {adbState === 'missing' && (
                        <span className="px-2 py-0.5 rounded border bg-[#1A1400] border-amber-500 text-amber-500 font-display font-bold text-[10px] uppercase tracking-[0.08em]">
                          ADB no encontrado
                        </span>
                      )}
                      <button
                        onClick={checkAdb}
                        className="px-2 py-0.5 bg-noir border border-noir-border hover:border-noir-cyan rounded text-[11px] font-medium text-noir-body hover:text-noir-text transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>

                  {adbState === 'installed' && (
                    <div className="mt-4 p-3 bg-noir-sunken rounded border border-noir-border space-y-2">
                      <p className="font-mono text-[11px] text-noir-cyan truncate">{adbVersion}</p>
                      <p className="font-sans text-xs text-noir-body">
                        ADB está configurado correctamente en tu sistema. Ahora conecta tu móvil mediante
                        cable USB con la depuración activada para empezar.
                      </p>
                    </div>
                  )}

                  {adbState === 'missing' && installOptions && (
                    <div>
                      <p className="font-sans text-xs text-noir-body mb-2.5">
                        Instalación recomendada en{' '}
                        <span className="text-noir-text font-semibold">{installOptions.label}</span>:
                      </p>
                      <div className="flex items-center gap-2 bg-noir-sunken border border-noir-border rounded-md px-3 py-2 mb-3">
                        <code className="font-mono text-xs text-noir-cyan flex-1 truncate">
                          {installOptions.primary}
                        </code>
                        <button
                          onClick={() => copyCmd(installOptions.primary)}
                          className="px-2 py-1 bg-noir border border-noir-border hover:border-noir-cyan rounded text-[11px] font-medium text-noir-body hover:text-noir-text transition-colors flex-shrink-0"
                        >
                          {copiedCmd === installOptions.primary ? 'Copiado ✓' : 'Copiar'}
                        </button>
                      </div>
                      <p className="font-sans text-[11px] uppercase tracking-[0.08em] font-display font-bold text-noir-muted mb-1.5">
                        Alternativas
                      </p>
                      <ul className="space-y-1.5">
                        {installOptions.alternatives.map((alt) => (
                          <li key={alt.text} className="flex items-center gap-2 text-xs text-noir-body">
                            <span className="flex-1 truncate">
                              {alt.text}
                              {alt.command && (
                                <code className="font-mono text-[11px] text-noir-cyan ml-1.5">{alt.command}</code>
                              )}
                            </span>
                            {alt.command && (
                              <button
                                onClick={() => copyCmd(alt.command!)}
                                className="px-2 py-0.5 bg-noir border border-noir-border hover:border-noir-cyan rounded text-[10px] font-medium text-noir-muted hover:text-noir-text transition-colors flex-shrink-0"
                              >
                                {copiedCmd === alt.command ? 'Copiado ✓' : 'Copiar'}
                              </button>
                            )}
                            {alt.url && (
                              <button
                                onClick={() => BrowserOpenURL(alt.url!)}
                                className="px-2 py-0.5 bg-noir border border-noir-border hover:border-noir-cyan rounded text-[10px] font-medium text-noir-blue hover:text-noir-cyan transition-colors flex-shrink-0"
                              >
                                Descargar ↗
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {adbState === 'missing' && !installOptions && (
                    <p className="font-sans text-xs text-noir-body">
                      Descarga la versión oficial de{' '}
                      <button
                        onClick={() => BrowserOpenURL(PLATFORM_TOOLS_URL)}
                        className="text-noir-blue hover:text-noir-cyan underline transition-colors"
                      >
                        platform-tools ↗
                      </button>{' '}
                      y agrégala al PATH; después pulsa <span className="text-noir-text">Reintentar</span>.
                    </p>
                  )}
                </div>

                {/* Sub-barra de escaneo USB */}
                <div className="pt-4 mt-4 border-t border-noir-border">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                      </span>
                      <span className="font-display font-bold text-xs text-amber-400 uppercase tracking-wider">
                        Escaneo USB activo
                      </span>
                    </div>
                    <span className="text-xs text-noir-muted font-sans">Esperando conexión por cable</span>
                  </div>
                </div>
              </div>

              {/* Columna 2: Guía de cómo activar el ADB */}
              <div className="bg-noir-surface border border-noir-border rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-md bg-noir border border-noir-border flex items-center justify-center text-noir-cyan flex-shrink-0">
                      <svg {...ICON_PROPS} className="w-[18px] h-[18px]">
                        <rect x="5" y="2" width="14" height="20" rx="2" />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-noir-text">Cómo activar ADB</h3>
                      <p className="font-sans text-xs text-noir-body leading-relaxed">
                        Sigue estos pasos en tu dispositivo Android:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 font-sans text-xs text-noir-body">
                    <div className="flex items-start gap-3 p-2.5 rounded bg-noir-sunken border border-noir-border">
                      <span className="w-5 h-5 rounded-full bg-noir-accent border border-noir-cyan text-noir-cyan font-display font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <span className="text-noir-text font-semibold">Opciones de Desarrollador:</span> Ve a{' '}
                        <em>Ajustes &gt; Información del teléfono</em> y pulsa{' '}
                        <strong className="text-noir-text">7 veces</strong> sobre el{' '}
                        <em>Número de compilación</em> o versión del sistema.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded bg-noir-sunken border border-noir-border">
                      <span className="w-5 h-5 rounded-full bg-noir-accent border border-noir-cyan text-noir-cyan font-display font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <span className="text-noir-text font-semibold">Depuración por USB:</span> Entra en{' '}
                        <em>Ajustes del sistema &gt; Opciones de desarrollador</em> y activa{' '}
                        <strong className="text-noir-text">Depuración por USB</strong> (en Xiaomi/realme habilita también los permisos de seguridad).
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded bg-noir-sunken border border-noir-border">
                      <span className="w-5 h-5 rounded-full bg-noir-accent border border-noir-cyan text-noir-cyan font-display font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <span className="text-noir-text font-semibold">Autoriza la PC:</span> Conecta el cable USB.
                        En la pantalla de tu móvil aparecerá un aviso de clave RSA: marca{' '}
                        <strong className="text-noir-text">"Permitir siempre desde este ordenador"</strong> y pulsa Aceptar.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-noir-border">
                  <button
                    onClick={onGuide}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-noir border border-noir-border hover:border-noir-cyan rounded-md text-xs font-semibold text-noir-cyan transition-colors group cursor-pointer"
                  >
                    <span>Ver guía completa de debloat y marcas</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* ======================== CUANDO ESTÁ CONECTADO ======================== */
        <section className="w-full max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
          {/* 1. RECUADRO DE INICIAR DEBLOATER */}
          {isBrandSupported ? (
            /* Marca catalogada en NoirADB */
            <div className="bg-noir-surface border-2 border-noir-cyan rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-display font-bold text-[11px] uppercase tracking-[0.1em] text-emerald-400">
                  Dispositivo conectado
                </span>
                {deviceInfo.serial && (
                  <>
                    <span className="text-noir-border">·</span>
                    <span className="text-noir-muted text-xs font-mono">{deviceInfo.serial}</span>
                  </>
                )}
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-noir-text uppercase tracking-tight mb-1">
                    {rawBrand}{' '}
                    <span className="text-noir-cyan">{rawModel}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-noir-body max-w-xl leading-relaxed">
                    {deviceInfo.os_name || `Android ${deviceInfo.android || ''}`} · Listo para listar paquetes,
                    reducir el consumo en segundo plano y eliminar bloatware con seguridad.
                  </p>
                </div>

                {/* Botón Iniciar */}
                <button
                  onClick={onStart}
                  className="flex-shrink-0 px-8 py-4 bg-noir-cyan hover:bg-[#33E0FF] text-noir font-display font-black text-base uppercase tracking-[0.08em] rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <span>Iniciar Debloater</span>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            /* Marca NO catalogada en NoirADB */
            <div className="bg-noir-surface border-2 border-amber-500/80 rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-display font-bold text-[11px] uppercase tracking-[0.1em] text-amber-400">
                  Dispositivo conectado · Marca no catalogada
                </span>
                {deviceInfo.serial && (
                  <>
                    <span className="text-noir-border">·</span>
                    <span className="text-noir-muted text-xs font-mono">{deviceInfo.serial}</span>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-noir-text uppercase tracking-tight mb-1">
                    {rawBrand}{' '}
                    <span className="text-amber-400">{rawModel}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-noir-muted font-mono">
                    {deviceInfo.os_name || `Android ${deviceInfo.android || ''}`} {deviceInfo.sdk ? `(SDK ${deviceInfo.sdk})` : ''}
                  </p>
                </div>

                {/* Explicación amigable */}
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-noir-body space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold font-sans">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Tu marca no tiene una lista específica preinstalada en NoirADB.</span>
                  </div>
                  <p className="leading-relaxed">
                    Puedes continuar usando la <strong className="text-noir-text">Lista General</strong> (que incluye más de 370 paquetes de bloatware universal, servicios de Facebook, telemetría y apps de operadoras) o cambiar de marca manualmente en el selector si tu teléfono usa una capa compatible.
                  </p>
                  <p className="leading-relaxed">
                    También puedes <strong className="text-amber-400">solicitar agregar tu marca</strong> exportando tu lista de apps instaladas de forma 100% segura y anónima para que la analicemos e incorporemos en futuras versiones.
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    onClick={handleOpenRequestModal}
                    className="px-5 py-3 bg-noir border border-amber-500/50 hover:border-amber-400 rounded-lg text-xs font-display font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    <span>Solicitar agregar mi marca</span>
                  </button>

                  <button
                    onClick={onStart}
                    className="px-8 py-3.5 bg-noir-cyan hover:bg-[#33E0FF] text-noir font-display font-black text-sm uppercase tracking-[0.08em] rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <span>Continuar con Lista General</span>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fila debajo: Detección de ADB y La Guía al lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 2. Detección ADB (debajo del Iniciar) */}
            <div className="bg-noir-surface border border-noir-border border-l-[3px] border-l-noir-cyan rounded-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-noir border border-noir-border flex items-center justify-center text-noir-cyan">
                      <svg {...ICON_PROPS} className="w-4 h-4">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m7 9 3 3-3 3" />
                        <path d="M13 15h4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-noir-text uppercase tracking-wider">
                        Estado ADB
                      </h4>
                      <p className="font-sans text-[11px] text-noir-muted">Puente de depuración activo</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-noir-accent border border-noir-cyan text-noir-cyan font-display font-bold text-[9px] uppercase tracking-wider">
                    Conectado
                  </span>
                </div>
                <p className="font-mono text-xs text-noir-cyan bg-noir-sunken px-2.5 py-1.5 rounded border border-noir-border truncate">
                  {adbVersion || 'ADB en funcionamiento'}
                </p>
              </div>
              <p className="font-sans text-[11px] text-noir-muted mt-3">
                Conexión segura establecida con el dispositivo. Puedes reescanear paquetes o cerrar la sesión cuando desees.
              </p>
            </div>

            {/* 3. La Guía al lado */}
            <div className="bg-noir-surface border border-noir-border rounded-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-noir border border-noir-border flex items-center justify-center text-noir-muted">
                      <svg {...ICON_PROPS} className="w-4 h-4">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-noir-text uppercase tracking-wider">
                        Guía recomendada
                      </h4>
                      <span className="text-[10px] font-display font-bold text-noir-cyan uppercase tracking-wider">
                        {isBrandSupported ? rawBrand : 'Guía universal'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="font-sans text-xs text-noir-body leading-relaxed mt-1">
                  Revisa los paquetes seguros, advertencias y recomendaciones generales antes de desinstalar aplicaciones en tu dispositivo.
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-noir-border flex justify-end">
                <button
                  onClick={onGuide}
                  className="text-noir-cyan hover:underline text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Abrir guía de {isBrandSupported ? rawBrand : 'debloat'}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Credit Section */}
      <section className="w-full px-6 pb-8">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-noir-muted text-xs font-sans flex items-center gap-1.5">
            Creado con <span className="text-red-500">♥</span> por{' '}
            <span className="text-noir-body font-semibold">Dex Parker</span>
          </span>
          <span className="text-noir-muted text-[11px] font-sans">
            Inspirado originalmente en{' '}
            <a
              href="https://github.com/fadeltd/xiaomi-debloater"
              target="_blank"
              rel="noopener noreferrer"
              className="text-noir-blue hover:text-noir-cyan transition-colors"
            >
              Xiaomi Debloater
            </a>{' '}
            de Fadel Trivandi Dipantara · GPL-3.0
          </span>
        </div>
      </section>

      {/* MODAL: Solicitar agregar marca (Zero-Server, 100% transparente) */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-noir-surface border border-noir-border rounded-xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-noir-border">
              <div>
                <h3 className="font-display font-black text-lg text-noir-text uppercase tracking-tight flex items-center gap-2">
                  <span>Solicitar soporte para {rawBrand}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold uppercase tracking-wider">
                    Nueva marca
                  </span>
                </h3>
                <p className="font-sans text-xs text-noir-body mt-1">
                  Envía el reporte para que podamos catalogar las aplicaciones y añadir la marca a la base de datos de NoirADB.
                </p>
              </div>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="text-noir-muted hover:text-noir-text p-1.5 rounded bg-noir border border-noir-border hover:border-noir-border-hover transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-4 flex-1">
              {/* Nota de privacidad */}
              <div className="p-3.5 rounded bg-noir-sunken border border-emerald-500/30 text-xs text-noir-body space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold font-sans">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Privacidad y seguridad garantizada (Sin servidor)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-noir-body">
                  Este reporte <strong>no contiene ningún dato personal</strong> (ni cuentas, números de teléfono, fotos, IMEI o identificadores privados). Solo extrae los nombres técnicos de los paquetes instalados (ej. <code className="text-noir-cyan font-mono">com.transsion.hilauncher</code>) y el modelo del teléfono.
                </p>
              </div>

              {loadingPackages ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-6 h-6 border-2 border-noir-cyan border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-sans text-xs text-noir-muted">Leyendo paquetes instalados desde tu dispositivo...</p>
                </div>
              ) : reportData ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-noir p-2.5 rounded border border-noir-border">
                      <span className="text-[10px] text-noir-muted uppercase font-display block">Marca</span>
                      <span className="font-bold text-noir-text truncate block">{rawBrand}</span>
                    </div>
                    <div className="bg-noir p-2.5 rounded border border-noir-border">
                      <span className="text-[10px] text-noir-muted uppercase font-display block">Modelo</span>
                      <span className="font-bold text-noir-text truncate block">{rawModel}</span>
                    </div>
                    <div className="bg-noir p-2.5 rounded border border-noir-border">
                      <span className="text-[10px] text-noir-muted uppercase font-display block">Android</span>
                      <span className="font-bold text-noir-text truncate block">{deviceInfo.android || 'N/A'}</span>
                    </div>
                    <div className="bg-noir p-2.5 rounded border border-noir-border">
                      <span className="text-[10px] text-noir-muted uppercase font-display block">Paquetes</span>
                      <span className="font-bold text-noir-cyan truncate block">{reportData.packages.length}</span>
                    </div>
                  </div>

                  {/* Vista previa de paquetes */}
                  <div>
                    <span className="text-[11px] font-display font-bold uppercase tracking-wider text-noir-muted mb-1 block">
                      Vista previa de paquetes extraídos:
                    </span>
                    <div className="bg-noir-sunken border border-noir-border rounded-lg p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-noir-cyan space-y-1">
                      {reportData.packages.slice(0, 30).map((pkg) => (
                        <div key={pkg} className="truncate">{pkg}</div>
                      ))}
                      {reportData.packages.length > 30 && (
                        <div className="text-noir-muted pt-1 border-t border-noir-border text-[10px]">
                          ... y {reportData.packages.length - 30} paquetes más incluidos en el reporte completo.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Acciones del Modal */}
            <div className="pt-4 border-t border-noir-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handleDownloadJSON}
                disabled={loadingPackages || !reportData}
                className="w-full sm:w-auto px-4 py-2 bg-noir border border-noir-border hover:border-noir-border-hover rounded text-xs font-medium text-noir-body hover:text-noir-text transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Descargar archivo .json</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setRequestModalOpen(false)}
                  className="px-3 py-2 bg-noir border border-noir-border hover:border-noir-border-hover rounded text-xs text-noir-muted hover:text-noir-text transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  onClick={handleCopyAndOpenIssue}
                  disabled={loadingPackages || !reportData}
                  className="px-4 py-2 bg-noir-cyan hover:bg-[#33E0FF] text-noir font-display font-black text-xs uppercase tracking-wider rounded transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>{copiedReport ? '¡Copiado! Abriendo GitHub...' : 'Copiar y abrir GitHub Issue'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
