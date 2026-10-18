'use client'

import { useEffect, useState } from 'react'
import { useLiveCases, ReportedCase } from '../hooks/useLiveCases'

const ROTATE_MS = 6000

function formatPlace(c: ReportedCase) {
  return c.city ? `${c.city} (${c.state})` : c.state
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export default function LiveCases() {
  const { stats, cases, error } = useLiveCases()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || cases.length < 2) return
    const timer = setInterval(() => setActive((i) => (i + 1) % cases.length), ROTATE_MS)
    return () => clearInterval(timer)
  }, [paused, cases.length])

  // a new case arrives at the front of the list: show it
  useEffect(() => setActive(0), [cases[0]?.id])

  if (error) return null

  return (
    <section className="live-section" aria-live="polite">
      <div className="live-label">
        <span className="live-dot" /> AO VIVO · CASOS REPORTADOS NA IMPRENSA
      </div>
      <div className="live-counter">{stats ? stats.count.toLocaleString('pt-BR') : '—'}</div>
      <p className="live-subtitle">
        mortes de mulheres noticiadas como possível feminicídio
        {stats?.since && ` desde ${new Date(stats.since).toLocaleDateString('pt-BR')}`}
      </p>
      <p className="live-disclaimer">
        Contagem ilustrativa, feita automaticamente a partir de notícias. Não é estatística oficial e os casos
        não são confirmados.
      </p>

      {cases.length > 0 && (
        <div
          className="carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {cases.map((c, i) => (
            <article key={c.id} className={`carousel-item ${i === active ? 'active' : ''}`} aria-hidden={i !== active}>
              <div className="carousel-meta">
                {formatPlace(c)} · {formatDate(c['published-at'])}
                {c.outlet && ` · ${c.outlet}`}
              </div>
              <h3 className="carousel-headline">{c.headline}</h3>
              <a href={c.url} target="_blank" rel="noopener noreferrer" tabIndex={i === active ? 0 : -1}>
                Ler a matéria
              </a>
            </article>
          ))}
          <div className="carousel-dots">
            {cases.map((c, i) => (
              <button
                key={c.id}
                className={i === active ? 'active' : ''}
                aria-label={`Mostrar caso ${i + 1}`}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
