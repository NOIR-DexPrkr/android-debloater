import { useEffect, useState } from 'react'
import { main } from '../../wailsjs/go/models.js'
import PackageRow from './PackageRow'
import ConfirmDialog, { type ActionType } from './ConfirmDialog'
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime.js'

interface PackageListProps {
  packages: main.AppPackage[]
  searchText: string
  activeCategory: string
  originFilter: 'all' | 'general' | 'brand'
  listNames: Record<string, string>
  selectedSerial: string
  mode: PackageMode
  showDanger: boolean
  onAddLog: (pkgName: string, message: string, success: boolean) => void
  onRefresh: () => void
  onActionStart: () => void
  isLoading: boolean
}

type PackageMode = 'disable' | 'uninstall' | 'enable' | 'restore'

interface DockAction {
  action: ActionType
  label: string
  hint: string
  titleClass: string
  hoverBorder: string
}

// Actions live here, on the selection — never on individual rows
const DOCK_ACTIONS: Record<ActionType, DockAction> = {
  disable: {
    action: 'disable',
    label: 'Deshabilitar',
    hint: 'Congela la app sin quitarla · reversible',
    titleClass: 'text-amber-500',
    hoverBorder: 'hover:border-amber-500',
  },
  enable: {
    action: 'enable',
    label: 'Habilitar',
    hint: 'Reactiva la app sin reinstalarla',
    titleClass: 'text-noir-cyan',
    hoverBorder: 'hover:border-noir-cyan',
  },
  uninstall: {
    action: 'uninstall',
    label: 'Desinstalar',
    hint: 'Quita la app para tu usuario · reversible',
    titleClass: 'text-red-400',
    hoverBorder: 'hover:border-red-500',
  },
  restore: {
    action: 'restore',
    label: 'Restaurar',
    hint: 'Reinstala la app que eliminaste',
    titleClass: 'text-noir-blue',
    hoverBorder: 'hover:border-noir-blue',
  },
}

// Each tab lists one app state and offers the actions that leave that state
const MODE_MATCH: Record<PackageMode, (pkg: main.AppPackage) => boolean> = {
  disable: (pkg) => !pkg.is_system && pkg.is_installed && pkg.is_enabled,
  uninstall: (pkg) => pkg.is_installed && pkg.is_enabled,
  enable: (pkg) => pkg.is_installed && !pkg.is_enabled,
  restore: (pkg) => !pkg.is_installed,
}

const MODE_ACTIONS: Record<PackageMode, ActionType[]> = {
  disable: ['disable'],
  uninstall: ['uninstall'],
  enable: ['enable', 'uninstall'],
  restore: ['restore'],
}

const MODE_EMPTY: Record<PackageMode, string> = {
  disable: 'No hay apps activas que puedas deshabilitar con estos filtros.',
  uninstall: 'No hay apps activas que puedas desinstalar con estos filtros.',
  enable: 'No hay apps deshabilitadas con estos filtros.',
  restore: 'No hay apps eliminadas con estos filtros.',
}

const CONFIRM_TITLES: Record<ActionType, string> = {
  uninstall: 'Confirmar desinstalación',
  disable: 'Confirmar deshabilitación',
  enable: 'Confirmar habilitación',
  restore: 'Confirmar restauración',
}

// Risk order for sorting (safest first)
const RISK_ORDER: Record<string, number> = { safe: 0, caution: 1, danger: 2 }

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nombre A → Z' },
  { value: 'name-desc', label: 'Nombre Z → A' },
  { value: 'risk-asc', label: 'Riesgo: seguro → peligroso' },
  { value: 'risk-desc', label: 'Riesgo: peligroso → seguro' },
  { value: 'category', label: 'Categoría' },
]

function PackageList({
  packages,
  searchText,
  activeCategory,
  originFilter,
  listNames,
  selectedSerial,
  mode,
  showDanger,
  onAddLog,
  onRefresh,
  onActionStart,
  isLoading,
}: PackageListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null)
  const [sort, setSort] = useState('name-asc')
  const [errorToast, setErrorToast] = useState<string | null>(null)

  // The selection belongs to one mode only: switching tabs starts clean
  useEffect(() => {
    setSelected(new Set())
    setPendingAction(null)
  }, [mode])

  useEffect(() => {
    if (!errorToast) return
    const timeout = window.setTimeout(() => setErrorToast(null), 7000)
    return () => window.clearTimeout(timeout)
  }, [errorToast])

  // Filter packages
  const filtered = packages.filter((pkg) => {
    // Each tab only shows apps in its own state (active, disabled or removed)
    const matchesMode = MODE_MATCH[mode](pkg)
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchText.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchText.toLowerCase())

    const matchesCategory =
      activeCategory === 'All' || pkg.category === activeCategory.toLowerCase()

    // Danger packages stay hidden unless advanced mode is on
    const matchesRisk = showDanger || pkg.risk !== 'danger'

    // Origin: the shared cross-brand list vs the detected brand's own list
    const matchesOrigin =
      originFilter === 'all' ||
      (originFilter === 'general' && pkg.list_id === 'general') ||
      (originFilter === 'brand' && pkg.list_id !== '' && pkg.list_id !== 'general')

    return matchesMode && matchesSearch && matchesCategory && matchesRisk && matchesOrigin
  })

  // Sort: by name, risk or category, depending on the chosen order
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'risk-asc':
        return (RISK_ORDER[a.risk] ?? 9) - (RISK_ORDER[b.risk] ?? 9) || a.name.localeCompare(b.name)
      case 'risk-desc':
        return (RISK_ORDER[b.risk] ?? 9) - (RISK_ORDER[a.risk] ?? 9) || a.name.localeCompare(b.name)
      case 'category':
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      default:
        return a.name.localeCompare(b.name)
    }
  })

  const toggleSelect = (name: string) => {
    const newSet = new Set(selected)
    if (newSet.has(name)) {
      newSet.delete(name)
    } else {
      newSet.add(name)
    }
    setSelected(newSet)
  }

  const allVisibleSelected = sorted.length > 0 && sorted.every((p) => selected.has(p.name))

  const toggleAllSelect = () => {
    if (allVisibleSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sorted.map((p) => p.name)))
    }
  }

  const selectOnlySafe = () => {
    setSelected(new Set(sorted.filter((p) => p.risk === 'safe').map((p) => p.name)))
  }

  // Each action only applies to the rows it can act on
  const selectedPkgs = packages.filter((p) => selected.has(p.name))
  const targets: Record<ActionType, main.AppPackage[]> = {
    uninstall: selectedPkgs.filter((p) => p.is_installed),
    disable: selectedPkgs.filter((p) => !p.is_system && p.is_installed && p.is_enabled),
    enable: selectedPkgs.filter((p) => p.is_installed && !p.is_enabled),
    restore: selectedPkgs.filter((p) => !p.is_installed),
  }
  const hasVisibleDanger = sorted.some((pkg) => pkg.risk === 'danger')
  const visibleActions = MODE_ACTIONS[mode].map((action) => DOCK_ACTIONS[action])

  const showActionError = (packageName: string, message: string) => {
    const lowerMessage = message.toLowerCase()
    let readableMessage = message
    if (
      mode === 'disable' &&
      (lowerMessage.includes('securityexception') || lowerMessage.includes('cannot disable system packages'))
    ) {
      readableMessage = 'El dispositivo no permite deshabilitar esta app del sistema. Usa Desinstalar en su lugar.'
    } else {
      const adbDetails = readableMessage.indexOf(' (adb ')
      if (adbDetails >= 0) readableMessage = readableMessage.slice(0, adbDetails)
      readableMessage = readableMessage
        .replace(/^La deshabilitación falló:\s*/i, '')
        .replace(/^La desinstalación falló:\s*/i, '')
        .replace(/^La habilitación falló:\s*/i, '')
        .replace(/^La restauración falló:\s*/i, '')
        .replace(/^Error:\s*/i, '')
      if (!readableMessage || /^(adb|exit status)\b/i.test(readableMessage)) {
        readableMessage = 'Verifica que el dispositivo siga conectado y vuelve a intentarlo.'
      }
    }
    setErrorToast(`${packageName}: ${readableMessage}`)
  }

  const confirmMessage = (action: ActionType): string => {
    const n = targets[action].length
    const danger = targets[action].filter((p) => p.risk === 'danger').length
    const warn =
      danger > 0
        ? ` ADVERTENCIA: ${danger} de ellos están marcados como peligrosos y pueden romper llamadas, SIM, Ajustes o el arranque.`
        : ''
    switch (action) {
      case 'uninstall':
        return `¿Desinstalar ${n} paquete(s) para el usuario actual? Podrás restaurarlos desde Restaurar → Eliminadas.${warn}`
      case 'disable':
        return `¿Deshabilitar ${n} paquete(s)? Las apps se congelan sin quitarse y podrás reactivarlas desde Restaurar → Deshabilitadas.${warn}`
      case 'enable':
        return `¿Habilitar ${n} paquete(s) deshabilitados? Volverán a estar activas y aparecerán en Eliminar.`
      case 'restore':
        return `¿Restaurar ${n} paquete(s)? Volverán a instalarse para tu usuario y aparecerán en Eliminar.`
    }
  }

  if (!selectedSerial) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-noir-muted">
          Ningún dispositivo seleccionado. Conecta un dispositivo para ver los paquetes.
        </span>
      </div>
    )
  }

  if (isLoading && packages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-noir-muted">Cargando paquetes...</span>
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-noir-muted">No se encontraron paquetes.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Risk legend */}
      <div className="flex items-center gap-2.5 px-4 py-2 border-b border-noir-border text-[11px] text-noir-muted flex-shrink-0 flex-wrap">
        {hasVisibleDanger && (
          <>
            <span className="font-display font-bold uppercase tracking-[0.08em]">Riesgo</span>
            <span className="px-1.5 py-0.5 rounded border border-noir-cyan text-noir-cyan bg-noir-accent font-display font-bold text-[9px] uppercase tracking-[0.08em]">
              Seguro
            </span>
            <span className="px-1.5 py-0.5 rounded border border-amber-500 text-amber-500 bg-[#1A1400] font-display font-bold text-[9px] uppercase tracking-[0.08em]">
              Precaución
            </span>
            <span className="px-1.5 py-0.5 rounded border border-red-500 text-red-500 bg-[#1A0505] font-display font-bold text-[9px] uppercase tracking-[0.08em]">
              Peligro
            </span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden md:inline text-[10px]">Selecciona filas para activar las acciones</span>
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.08em] text-noir-body">
            Ordenar
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-noir border border-noir-border rounded px-2 py-0.5 text-[11px] text-noir-body focus:border-noir-cyan focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aviso para com.msandroid.mobile (MagisTV / XuperTV) */}
      {packages.some((p) => p.name === 'com.msandroid.mobile') && (
        <div className="mx-4 my-2.5 p-3 rounded-lg bg-[#1F1600] border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start gap-2.5">
            <span className="text-amber-400 text-base leading-none mt-0.5">⚠️</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-xs text-amber-400 uppercase tracking-wider">
                  MagisTV / XuperTV detectado
                </span>
                <span className="font-mono text-[10px] text-noir-muted">com.msandroid.mobile</span>
              </div>
              <p className="text-xs text-noir-body mt-0.5 leading-relaxed">
                Esta app no oficial de IPTV suele incluir malware o publicidad invasiva. Consulta alternativas seguras recomendadas en:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => BrowserOpenURL('https://paste.cnrxd.com/tvip')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-noir font-display font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>paste.cnrxd.com/tvip</span>
            <span>↗</span>
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-noir-surface border-b border-noir-border">
            <tr>
              <th className="px-4 py-2 text-left w-10">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllSelect}
                  className="noir-checkbox"
                />
              </th>
              <th className="px-4 py-2 text-left font-display font-bold text-[10px] uppercase tracking-[0.08em] text-noir-muted">
                Aplicación
              </th>
              <th className="px-4 py-2 text-left font-display font-bold text-[10px] uppercase tracking-[0.08em] text-noir-muted">
                Categoría
              </th>
              {hasVisibleDanger && (
                <th className="px-4 py-2 text-left font-display font-bold text-[10px] uppercase tracking-[0.08em] text-noir-muted">
                  Riesgo
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={hasVisibleDanger ? 4 : 3} className="px-4 py-8 text-center text-noir-muted">
                  {MODE_EMPTY[mode]}
                </td>
              </tr>
            ) : (
              sorted.map((pkg) => (
                <PackageRow
                  key={pkg.name}
                  pkg={pkg}
                  isSelected={selected.has(pkg.name)}
                  showRisk={hasVisibleDanger}
                  listNames={listNames}
                  onToggleSelect={toggleSelect}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Selection action dock (below the list) */}
      {selected.size > 0 && (
        <div className="bg-noir-surface border-t border-noir-border px-4 py-3 space-y-2.5 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm text-noir-body">
              <span className="text-noir-text font-semibold">{selected.size}</span>{' '}
              seleccionado{selected.size === 1 ? '' : 's'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectOnlySafe}
                className="px-2.5 py-1 bg-noir border border-noir-border hover:border-noir-cyan rounded-md text-[11px] font-medium text-noir-body hover:text-noir-text transition-colors"
              >
                Seleccionar solo seguros
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="px-2.5 py-1 bg-noir border border-noir-border hover:border-noir-cyan rounded-md text-[11px] font-medium text-noir-muted hover:text-noir-text transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {visibleActions.filter((d) => targets[d.action].length > 0).map((d) => (
              <button
                key={d.action}
                onClick={() => setPendingAction(d.action)}
                className={`text-left px-3 py-2 rounded-md border border-noir-border bg-noir transition-colors ${d.hoverBorder}`}
              >
                <span className={`block font-display font-bold text-sm ${d.titleClass}`}>
                  {d.label}{' '}
                  <span className="text-noir-muted font-sans font-normal text-xs">
                    ({targets[d.action].length})
                  </span>
                </span>
                <span className="block text-[11px] text-noir-muted">{d.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {pendingAction && (
        <ConfirmDialog
          action={pendingAction}
          title={CONFIRM_TITLES[pendingAction]}
          message={confirmMessage(pendingAction)}
          selectedPackages={targets[pendingAction].map((p) => p.name)}
          serial={selectedSerial}
          onActionStart={onActionStart}
          onActionError={showActionError}
          onConfirm={() => {
            setPendingAction(null)
            setSelected(new Set())
            onRefresh()
          }}
          onCancel={() => setPendingAction(null)}
          onAddLog={onAddLog}
        />
      )}
      {errorToast && (
        <div
          role="alert"
          className="fixed right-5 top-5 z-[60] max-w-md rounded-md border border-red-500/70 bg-[#1A0505] px-4 py-3 pr-10 text-sm text-red-100 shadow-xl"
        >
          <span className="font-semibold text-red-300">No se pudo completar la acción</span>
          <p className="mt-1 break-words">{errorToast}</p>
          <button
            onClick={() => setErrorToast(null)}
            aria-label="Cerrar aviso"
            className="absolute right-3 top-2 text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default PackageList
