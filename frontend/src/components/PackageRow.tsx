import { main } from '../../wailsjs/go/models.js'
import AppIcon from './AppIcon'
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime.js'

interface PackageRowProps {
  pkg: main.AppPackage
  isSelected: boolean
  showRisk: boolean
  listNames: Record<string, string>
  onToggleSelect: (name: string) => void
}

function PackageRow({ pkg, isSelected, showRisk, listNames, onToggleSelect }: PackageRowProps) {
  const getRiskBadgeClass = () => {
    switch (pkg.risk) {
      case 'safe':
        return 'bg-noir-accent border-noir-cyan text-noir-cyan'
      case 'caution':
        return 'bg-[#1A1400] border-amber-500 text-amber-500'
      case 'danger':
        return 'bg-[#1A0505] border-red-500 text-red-500'
      default:
        return 'bg-noir-surface border-noir-border text-noir-body'
    }
  }

  const getCategoryBadgeClass = () => {
    switch (pkg.category) {
      case 'bloatware':
        return 'bg-red-500/10 border-red-500/40 text-red-400'
      case 'oem':
        return 'bg-noir-cyan/10 border-noir-cyan/40 text-noir-cyan'
      case 'system':
        return 'bg-purple-500/10 border-purple-500/40 text-purple-400'
      case 'user':
        return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
      default:
        return 'bg-noir-surface border-noir-border text-noir-body'
    }
  }

  const getCategoryLabel = () => {
    switch (pkg.category) {
      case 'bloatware':
        return 'Bloatware'
      case 'oem':
        return 'OEM'
      case 'system':
        return 'Sistema'
      case 'user':
        return 'Usuario'
      default:
        return pkg.category
    }
  }

  const getRiskLabel = () => {
    switch (pkg.risk) {
      case 'safe':
        return 'Seguro'
      case 'caution':
        return 'Precaución'
      case 'danger':
        return 'Peligro'
      default:
        return pkg.risk
    }
  }

  return (
    <tr className="border-t border-noir-border hover:bg-noir-hover transition-colors">
      <td className="px-4 py-2 w-10 align-middle">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(pkg.name)}
          className="noir-checkbox"
        />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-start gap-3 min-w-0">
          <AppIcon pkg={pkg.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-noir-body break-all" title={pkg.name}>
                {pkg.name}
              </span>
              {pkg.list_id && (
                <span
                  className="shrink-0 px-1.5 py-0.5 rounded border border-noir-blue/60 text-noir-blue text-[9px] uppercase tracking-[0.08em]"
                  title={pkg.list_id === 'general' ? 'Común entre marcas' : `Lista de ${listNames[pkg.list_id] ?? pkg.list_id}`}
                >
                  {pkg.list_id === 'general' ? 'General' : listNames[pkg.list_id] ?? pkg.list_id}
                </span>
              )}
              {!pkg.is_installed && (
                <span className="shrink-0 px-1.5 py-0.5 rounded border border-noir-blue/60 text-noir-blue text-[9px] uppercase tracking-[0.08em]">
                  eliminado
                </span>
              )}
              {pkg.is_installed && !pkg.is_enabled && (
                <span className="shrink-0 px-1.5 py-0.5 rounded border border-amber-500/60 text-amber-500 text-[9px] uppercase tracking-[0.08em]">
                  deshabilitado
                </span>
              )}
            </div>
            <div className="text-[11px] text-noir-muted leading-snug">{pkg.description}</div>

            {/* Aviso especial para com.msandroid.mobile (MagisTV / XuperTV) */}
            {pkg.name === 'com.msandroid.mobile' && (
              <div className="mt-2.5 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center justify-between gap-3 flex-wrap">
                <div className="flex items-start sm:items-center gap-2 text-xs">
                  <span className="font-display font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                    MagisTV / XuperTV
                  </span>
                  <span className="text-noir-body text-[11px] leading-relaxed">
                    Esta app suele incluir adware o troyanos. Se recomiendan alternativas seguras de IPTV.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    BrowserOpenURL('https://paste.cnrxd.com/tvip')
                  }}
                  className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-noir font-display font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Abrir https://paste.cnrxd.com/tvip en tu navegador"
                >
                  <span>Revisar alternativas (paste.cnrxd.com/tvip)</span>
                  <span>↗</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-2">
        <span
          className={`px-2 py-0.5 rounded border font-display font-bold text-[10px] uppercase tracking-[0.08em] whitespace-nowrap ${getCategoryBadgeClass()}`}
        >
          {getCategoryLabel()}
        </span>
      </td>
      {showRisk && (
        <td className="px-4 py-2">
          <span
            className={`px-2 py-0.5 rounded border font-display font-bold text-[10px] uppercase tracking-[0.08em] whitespace-nowrap ${getRiskBadgeClass()}`}
          >
            {getRiskLabel()}
          </span>
        </td>
      )}
    </tr>
  )
}

export default PackageRow
