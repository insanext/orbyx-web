'use client'
import { useState } from 'react'
import { FAQ_CATEGORIES } from './faq-data'

export default function FaqAccordion({ onCreateTicket }: { onCreateTicket: () => void }) {
  const [openKey, setOpenKey] = useState<string | null>(null)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>Preguntas frecuentes</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Resuelve tus dudas rápido antes de crear un ticket.</p>
      </div>

      <div className="space-y-8">
        {FAQ_CATEGORIES.map((cat, ci) => (
          <div key={cat.title}>
            <div className="flex items-center gap-2 mb-3">
              <i className={`ti ${cat.icon}`} style={{ fontSize: 15, color: "var(--text-muted)", opacity: 0.7 }} aria-hidden="true" />
              <h3
                className="text-xs font-semibold uppercase"
                style={{ color: "var(--text-main)", opacity: 0.75, letterSpacing: '0.06em' }}
              >
                {cat.title}
              </h3>
            </div>
            <div className="space-y-2.5">
              {cat.items.map((item, qi) => {
                const key = `${ci}-${qi}`
                const isOpen = openKey === key
                return (
                  <div
                    key={key}
                    className="rounded-2xl border overflow-hidden"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
                  >
                    <button
                      onClick={() => setOpenKey(isOpen ? null : key)}
                      className="w-full flex items-center justify-between gap-3 text-left px-4 py-3.5 hover:opacity-90 transition-opacity"
                    >
                      <span className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>{item.question}</span>
                      <i
                        className="ti ti-chevron-down shrink-0 transition-transform duration-300"
                        style={{ fontSize: 16, color: "var(--text-muted)", transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                        transition: 'grid-template-rows 300ms ease',
                      }}
                    >
                      <div className="overflow-hidden">
                        <p className="text-sm px-4 pb-4" style={{ color: "var(--text-muted)", opacity: 0.85, lineHeight: 1.6 }}>
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border p-5 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>¿No encontraste lo que buscabas?</p>
        <button
          onClick={onCreateTicket}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all inline-flex items-center gap-2"
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
          Crear un ticket
        </button>
      </div>
    </div>
  )
}
