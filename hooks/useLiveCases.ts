import { useEffect, useState } from 'react'

export interface ReportedCase {
  id: number
  state: string
  city: string | null
  headline: string
  url: string
  outlet: string | null
  'published-at': string
}

interface Stats {
  count: number
  since: string | null
  disclaimer: string
}

const API_URL = process.env.NEXT_PUBLIC_PIPELINE_URL || 'http://localhost:8080'
const MAX_CASES = 10

export function useLiveCases() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [cases, setCases] = useState<ReportedCase[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let source: EventSource | null = null
    let cancelled = false

    async function load() {
      try {
        const [statsRes, casesRes] = await Promise.all([
          fetch(`${API_URL}/stats`),
          fetch(`${API_URL}/cases?limit=${MAX_CASES}`),
        ])
        if (!statsRes.ok || !casesRes.ok) throw new Error('Pipeline indisponível')
        if (cancelled) return
        setStats(await statsRes.json())
        setCases(await casesRes.json())
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro desconhecido')
        return
      }

      source = new EventSource(`${API_URL}/events`)
      source.addEventListener('case', (event) => {
        const newCase: ReportedCase = JSON.parse((event as MessageEvent).data)
        setCases((current) =>
          current.some((c) => c.id === newCase.id) ? current : [newCase, ...current].slice(0, MAX_CASES)
        )
        setStats((current) => current && { ...current, count: current.count + 1 })
      })
    }

    load()
    return () => {
      cancelled = true
      source?.close()
    }
  }, [])

  return { stats, cases, error }
}
