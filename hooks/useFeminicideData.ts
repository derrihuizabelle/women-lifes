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
    circumstances?: string
    source: string
    url?: string
  }>
  dataQuality: 'real' | 'statistical' | 'mixed'
  historicalContext: {
    totalSince2018: number
    yearlyAverage: number
    worstYear: { year: number, totalCases: number }
    bestYear: { year: number, totalCases: number }
    currentTrend: 'increasing' | 'decreasing' | 'stable'
    projection2025: { projectedTotal: number, projection: string }
    daysAnalyzed: number
  }
}

interface UseFeminicideDataReturn {
  data: FeminicideData
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastFetchTime: Date | null
}

const INITIAL_DATA: FeminicideData = {
  count: 0,
  countSince2018: 0,
  dailyAverage: 10.7,
  lastUpdated: new Date().toISOString(),
  recentCases: [],
  dataQuality: 'statistical',
  historicalContext: {
    totalSince2018: 0,
    yearlyAverage: 0,
    worstYear: { year: 2018, totalCases: 0 },
    bestYear: { year: 2018, totalCases: 0 },
    currentTrend: 'stable',
    projection2025: { projectedTotal: 0, projection: 'stable' },
    daysAnalyzed: 0
  }
}

export function useFeminicideData(): UseFeminicideDataReturn {
  const [data, setData] = useState<FeminicideData>(INITIAL_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const realtimeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Função para buscar dados históricos da API
  const fetchData = useCallback(async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setError(null)
      
      console.log('Buscando dados históricos (2018-2025)...')
      
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
      setLastFetchTime(new Date())
      setError(null)
      
      console.log('Dados históricos carregados:', {
        since2018: newData.countSince2018.toLocaleString('pt-BR'),
        sinceSite: newData.count,
        trend: newData.historicalContext.currentTrend,
        worstYear: `${newData.historicalContext.worstYear.year} (${newData.historicalContext.worstYear.totalCases})`,
        cases: newData.recentCases.length
      })

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Requisição cancelada')
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro ao buscar dados históricos:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Contador em tempo real para ambos os números
  useEffect(() => {
    if (isLoading || !data.lastUpdated) return

    const updateRealtimeCount = () => {
      const lastApiUpdate = new Date(data.lastUpdated)
      const now = new Date()
      const timeSinceApiUpdate = now.getTime() - lastApiUpdate.getTime()
      const millisecondsPerDay = 24 * 60 * 60 * 1000
      const deathsPerMs = data.dailyAverage / millisecondsPerDay
      
      // Calcular mortes adicionais desde a última atualização da API
      const additionalDeaths = Math.floor(timeSinceApiUpdate * deathsPerMs)
      
      // Atualizar ambos os contadores
      const newCountSinceSite = Math.max(0, (data.count || 0) + additionalDeaths)
      const newCountSince2018 = Math.max(0, (data.countSince2018 || 0) + additionalDeaths)

      setData(prev => {
        // Otimização: só atualizar se os valores mudaram
        if (prev.count === newCountSinceSite && prev.countSince2018 === newCountSince2018) {
          return prev
        }
        
        return { 
          ...prev, 
          count: newCountSinceSite,
          countSince2018: newCountSince2018
        }
      })
    }

    updateRealtimeCount()
    realtimeIntervalRef.current = setInterval(updateRealtimeCount, 10000) // A cada 10 segundos

    return () => {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current)
      }
    }
  }, [data.lastUpdated, data.dailyAverage, data.count, data.countSince2018, isLoading])

  // Buscar dados iniciais
  useEffect(() => {
    fetchData()

    // Atualizar dados históricos a cada hora (dados mais estáveis)
    const dataUpdateInterval = setInterval(fetchData, 60 * 60 * 1000)

    return () => {
      clearInterval(dataUpdateInterval)
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
    refetch,
    lastFetchTime
  }
}

// Hook adicional para estatísticas históricas detalhadas
export function useHistoricalStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchHistoricalStats = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/feminicide-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'historical-stats' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas históricas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return { stats, loading, fetchHistoricalStats }
}
