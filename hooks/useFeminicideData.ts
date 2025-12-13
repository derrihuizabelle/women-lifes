import { useState, useEffect, useRef, useCallback } from 'react'

interface FeminicideData {
  count: number
  countSince2018: number
  dailyAverage: number
  lastUpdated: string
  historicalContext: {
    totalSince2018: number
    averagePerDay: number
    daysSince2018: number
    cutoffDate: string
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
  historicalContext: {
    totalSince2018: 0,
    averagePerDay: 0,
    daysSince2018: 0,
    cutoffDate: new Date().toISOString()
  }
}

export function useFeminicideData(): UseFeminicideDataReturn {
  const [data, setData] = useState<FeminicideData>(INITIAL_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setError(null)
      
      const response = await fetch('/api/feminicide-data', {
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const newData: FeminicideData = await response.json()
      
      setData(newData)
      setError(null)

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

  useEffect(() => {
    fetchData()

    return () => {
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
