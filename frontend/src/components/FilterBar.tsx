interface FilterBarProps {
  searchText: string
  activeCategory: string
  originFilter: 'all' | 'general' | 'brand'
  brandName: string
  onSearchChange: (text: string) => void
  onCategoryChange: (category: string) => void
  onOriginChange: (origin: 'all' | 'general' | 'brand') => void
}

// Keys stay in English; PackageList matches them against pkg.category
const BASE_CATEGORIES: { key: string; label: string }[] = [
  { key: 'All', label: 'Todas' },
  { key: 'Bloatware', label: 'Bloatware' },
  { key: 'OEM', label: 'OEM' },
  { key: 'System', label: 'Sistema' },
  { key: 'User', label: 'Usuario' },
]

function FilterBar({
  searchText,
  activeCategory,
  originFilter,
  brandName,
  onSearchChange,
  onCategoryChange,
  onOriginChange,
}: FilterBarProps) {
  const categories = BASE_CATEGORIES
  const origins: { key: 'all' | 'general' | 'brand'; label: string }[] = [
    { key: 'all', label: 'Origen: todas' },
    { key: 'general', label: 'General' },
    { key: 'brand', label: brandName || 'Marca' },
  ]

  return (
    <div className="space-y-1.5">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Buscar paquetes..."
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full bg-noir-surface border border-noir-border rounded-md px-3 py-1.5 text-sm text-noir-text placeholder-noir-muted focus:outline-none focus:border-noir-cyan"
      />

      {/* Category Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className={`px-2 py-0.5 rounded border font-display font-bold text-[9px] uppercase tracking-[0.08em] transition-colors ${
              activeCategory === cat.key
                ? 'bg-noir-accent border-noir-cyan text-noir-cyan'
                : 'bg-noir-surface border-noir-border text-noir-body hover:border-noir-border-hover hover:text-noir-text'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Origin Tabs: shared list vs the brand's own list */}
      <div className="flex gap-1.5 flex-wrap">
        {origins.map((origin) => (
          <button
            key={origin.key}
            onClick={() => onOriginChange(origin.key)}
            className={`px-2 py-0.5 rounded border font-display font-bold text-[9px] uppercase tracking-[0.08em] transition-colors ${
              originFilter === origin.key
                ? 'bg-noir-accent border-noir-blue text-noir-blue'
                : 'bg-noir-surface border-noir-border text-noir-body hover:border-noir-border-hover hover:text-noir-text'
            }`}
          >
            {origin.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default FilterBar
