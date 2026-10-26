'use client'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock,
  CreditCard,
  Database,
  Globe,
  Headset,
  IdCard,
  LayoutGrid,
  Megaphone,
  Search,
  SearchX,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { FAQ_CATEGORIES, type FaqCategory, type FaqIconKey } from './faq-data'

// Íconos de lucide-react (la fuente "Tabler" de las clases `ti ti-*` no está
// cargada en la app, por eso los íconos de la versión anterior no se veían).
const FAQ_ICONS: Record<FaqIconKey | 'all', LucideIcon> = {
  all: LayoutGrid,
  clock: Clock,
  calendar: CalendarDays,
  users: Users,
  star: Star,
  megaphone: Megaphone,
  briefcase: Briefcase,
  staff: IdCard,
  card: CreditCard,
  database: Database,
  globe: Globe,
  building: Building2,
  headset: Headset,
}

function FaqIcon({ name, size }: { name: FaqIconKey | 'all'; size: number }) {
  const Icon = FAQ_ICONS[name]
  return <Icon size={size} aria-hidden="true" />
}

// Normaliza para buscar sin importar tildes ni mayúsculas.
function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function Answer({ lines }: { lines: string[] }) {
  // Agrupa líneas "- " consecutivas en una lista.
  const blocks: Array<{ type: 'p'; text: string } | { type: 'ul'; items: string[] }> = []
  for (const line of lines) {
    if (line.startsWith('- ')) {
      const last = blocks[blocks.length - 1]
      if (last && last.type === 'ul') last.items.push(line.slice(2))
      else blocks.push({ type: 'ul', items: [line.slice(2)] })
    } else {
      blocks.push({ type: 'p', text: line })
    }
  }
  return (
    <div className="space-y-2.5 px-4 pb-4 text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.65 }}>
      {blocks.map((block, i) =>
        block.type === 'p' ? (
          <p key={i}>{block.text}</p>
        ) : (
          <ul key={i} className="space-y-1.5">
            {block.items.map((item, k) => (
              <li key={k} className="flex gap-2">
                <span
                  className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: 'var(--accent-solid)' }}
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}

export default function FaqAccordion({ onCreateTicket }: { onCreateTicket?: () => void }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const normalizedQuery = normalize(query.trim())

  const visibleCategories: FaqCategory[] = useMemo(() => {
    return FAQ_CATEGORIES.filter((cat) => activeCategory === 'all' || cat.id === activeCategory)
      .map((cat) => ({
        ...cat,
        items: normalizedQuery
          ? cat.items.filter((item) =>
              normalize(`${item.question} ${item.answer.join(' ')}`).includes(normalizedQuery)
            )
          : cat.items,
      }))
      .filter((cat) => cat.items.length > 0)
  }, [activeCategory, normalizedQuery])

  const resultCount = visibleCategories.reduce((sum, cat) => sum + cat.items.length, 0)
  const featured = FAQ_CATEGORIES.filter((cat) => cat.featured)

  function selectCategory(id: string) {
    setActiveCategory(id)
    setOpenKey(null)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado + buscador */}
      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          borderColor: 'var(--border-color)',
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--accent-solid) 14%, var(--bg-card)) 0%, var(--bg-card) 70%)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: 'var(--accent-solid)' }}
            aria-hidden="true"
          >
            <CircleHelp size={18} />
          </span>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>
              Preguntas frecuentes
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Todo lo que necesitas para sacarle el máximo a Orbyx.
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpenKey(null)
            }}
            placeholder="Busca tu duda: feriado, cancelar, boleta, extras…"
            aria-label="Buscar en preguntas frecuentes"
            className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--accent-solid)]"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
          />
        </div>
      </div>

      {/* Temas importantes */}
      {!normalizedQuery && activeCategory === 'all' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {featured.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => selectCategory(cat.id)}
              className="group flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: 'color-mix(in srgb, var(--accent-solid) 16%, transparent)',
                  color: 'var(--accent-solid)',
                }}
                aria-hidden="true"
              >
                <FaqIcon name={cat.icon} size={20} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                    {cat.title}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ background: 'var(--accent-solid)' }}
                  >
                    Importante
                  </span>
                </span>
                <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>
                  {cat.description}
                </span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent-solid)' }}>
                  Ver {cat.items.length} preguntas
                  <ArrowRight size={13} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Temas */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ id: 'all', title: 'Todas', icon: 'all' as FaqIconKey | 'all', count: FAQ_CATEGORIES.reduce((s, c) => s + c.items.length, 0) }, ...FAQ_CATEGORIES.map((c) => ({ id: c.id, title: c.title, icon: c.icon, count: c.items.length }))].map((chip) => {
          const active = activeCategory === chip.id
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => selectCategory(chip.id)}
              aria-pressed={active}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition"
              style={
                active
                  ? { background: 'var(--accent-solid)', borderColor: 'var(--accent-solid)', color: '#fff' }
                  : { background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }
              }
            >
              <FaqIcon name={chip.icon} size={14} />
              {chip.title}
              <span className="opacity-70">{chip.count}</span>
            </button>
          )
        })}
      </div>

      {normalizedQuery ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {resultCount === 0
            ? 'Sin resultados.'
            : `${resultCount} resultado${resultCount === 1 ? '' : 's'} para "${query.trim()}"`}
        </p>
      ) : null}

      {/* Preguntas */}
      {visibleCategories.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-2xl border px-6 py-10 text-center"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
        >
          <SearchX size={28} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
            No encontramos una respuesta para eso.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Prueba con otras palabras o escríbenos y te ayudamos.
          </p>
          {onCreateTicket ? (
            <button
              type="button"
              onClick={onCreateTicket}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: 'var(--accent-solid)' }}
            >
              Crear un ticket
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-8">
          {visibleCategories.map((cat) => (
            <section key={cat.id} aria-labelledby={`faq-${cat.id}`}>
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: 'color-mix(in srgb, var(--accent-solid) 14%, transparent)',
                    color: 'var(--accent-solid)',
                  }}
                  aria-hidden="true"
                >
                  <FaqIcon name={cat.icon} size={16} />
                </span>
                <div className="min-w-0">
                  <h3 id={`faq-${cat.id}`} className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                    {cat.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {cat.items.map((item) => {
                  const key = `${cat.id}::${item.question}`
                  const isOpen = openKey === key || (Boolean(normalizedQuery) && resultCount <= 3)
                  return (
                    <div
                      key={key}
                      className="overflow-hidden rounded-2xl border transition-colors"
                      style={{
                        background: 'var(--bg-card)',
                        borderColor: isOpen ? 'color-mix(in srgb, var(--accent-solid) 45%, var(--border-color))' : 'var(--border-color)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenKey(openKey === key ? null : key)}
                        aria-expanded={isOpen}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--bg-soft)]"
                      >
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                          {item.question}
                        </span>
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-300"
                          style={{
                            background: isOpen ? 'var(--accent-solid)' : 'var(--bg-soft)',
                            color: isOpen ? '#fff' : 'var(--text-muted)',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                          aria-hidden="true"
                        >
                          <ChevronDown size={14} />
                        </span>
                      </button>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateRows: isOpen ? '1fr' : '0fr',
                          transition: 'grid-template-rows 300ms ease',
                        }}
                      >
                        <div className="overflow-hidden">
                          <Answer lines={item.answer} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Cierre */}
      {visibleCategories.length > 0 && onCreateTicket ? (
        <div
          className="flex flex-col items-start justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
              ¿No encontraste lo que buscabas?
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Crea un ticket y te respondemos lo antes posible.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateTicket}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: 'var(--accent-solid)' }}
          >
            Crear un ticket
          </button>
        </div>
      ) : null}
    </div>
  )
}
