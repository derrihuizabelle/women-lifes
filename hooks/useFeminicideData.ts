import { useState, useEffect, useRef, useCallback } from 'react'

interface FeminicideData {
  count: number
  countSince2018: number
  dailyAverage: number
  lastUpdated: string
  recentCases: Array<{
    date: string
    location: string
    age?: number
    violenceType: 'feminicide' | 'physical' | 'harassment' | 'psychological' | 'domestic'
    circumstances?: string
    source: string
    url?: string
  }>
  dataQuality: 'real' | 'statistical' | 'mixed'
  historicalContext: {
    totalSince2018: number
    averagePerDay: number
    daysSince2018: number
    cutoffDate: string
    worstYear: { year: number, totalCases: number }
    bestYear: { year: number, totalCases: number }
    currentTrend: 'increasing' | 'decreasing' | 'stable'
    projection2025: { projectedTotal: number, projection: string }
    dataCompleteness: string
  }
}

interface UseFeminicideDataReturn {
  data: FeminicideData
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const INITIAL_DATA: FeminicideData = {
  count: 0,
  countSince2018: 0,
  dailyAverage: 1748,
  lastUpdated: new Date().toISOString(),
  recentCases: [],
  dataQuality: 'statistical',
  historicalContext: {
    totalSince2018: 0,
    averagePerDay: 0,
    daysSince2018: 0,
    cutoffDate: new Date().toISOString(),
    worstYear: { year: 2018, totalCases: 0 },
    bestYear: { year: 2018, totalCases: 0 },
    currentTrend: 'stable',
    projection2025: { projectedTotal: 0, projection: 'stable' },
    dataCompleteness: 'Carregando...'
  }
}

export function useFeminicideData(): UseFeminicideDataReturn {
  const [data, setData] = useState<FeminicideData>(INITIAL_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  // Função para buscar dados históricos da API
  const fetchData = useCallback(async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setError(null)
      
      console.log('Buscando dados de violência (até ontem)...')
      
      const response = await fetch('/api/feminicide-data', {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const newData: FeminicideData = await response.json()
      
      setData(newData)
      setError(null)
      
      const cutoffDate = new Date(newData.historicalContext.cutoffDate)
      
      console.log('Dados de violência carregados:', {
        period: `2018 até ${cutoffDate.toLocaleDateString('pt-BR')}`,
        since2018: newData.countSince2018.toLocaleString('pt-BR'),
        avgPerDay: newData.historicalContext.averagePerDay,
        trend: newData.historicalContext.currentTrend,
        completeness: newData.historicalContext.dataCompleteness
      })

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Requisição cancelada')
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao buscar dados de violência:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Buscar dados iniciais e configurar atualizações
  useEffect(() => {
    fetchData()

    // Atualizar dados a cada hora
    const dataUpdateInterval = setInterval(fetchData, 60 * 60 * 1000)

    // Verificar se passou da meia-noite (novo dia = novos dados)
    const midnightCheck = setInterval(() => {
      const now = new Date()
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        console.log('Novo dia detectado, atualizando dados...')
        fetchData()
      }
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(dataUpdateInterval)
      clearInterval(midnightCheck)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  // Refetch manual
  const refetch = useCallback(async () => {
    setIsLoading(true)
    await fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch
  }
}
