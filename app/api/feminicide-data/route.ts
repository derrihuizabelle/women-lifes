import { NextRequest, NextResponse } from 'next/server'
import { newsService } from '../../../lib/newsService'
import { HistoricalDataCalculator } from '../../../lib/historicalData'

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

// Cache em memória
let cachedData: FeminicideData | null = null
let lastFetch = 0
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutos

async function fetchViolenceData(): Promise<FeminicideData> {
  const now = Date.now()
  
  // Verificar se é um novo dia (se sim, invalidar cache)
  const today = new Date().toDateString()
  const cacheDate = cachedData ? new Date(cachedData.lastUpdated).toDateString() : null
  const isNewDay = cacheDate !== today
  
  if (cachedData && (now - lastFetch) < CACHE_DURATION && !isNewDay) {
    console.log('Usando dados do cache')
    return cachedData
  }

  try {
    console.log('Calculando dados de violência até ontem...')
    
    // Buscar dados históricos
    const historicalContext = HistoricalDataCalculator.getHistoricalContext()
    
    // Buscar casos recentes de notícias
    const recentCases = await newsService.fetchRecentCases()
    
    // Total desde 2018 até ontem
    const countSince2018 = HistoricalDataCalculator.calculateTotalSince2018()
    
    // Contador desde publicação do site
    const siteStartDate = new Date('2024-12-09T00:00:00-03:00')
    const yesterday = HistoricalDataCalculator.getCutoffDate()
    
    let countSinceSite = 0
    if (yesterday.getTime() > siteStartDate.getTime()) {
      const daysSinceSite = (yesterday.getTime() - siteStartDate.getTime()) / (1000 * 60 * 60 * 24)
      countSinceSite = Math.floor(daysSinceSite * historicalContext.averagePerDay)
    }

    const violenceData: FeminicideData = {
      count: countSinceSite,
      countSince2018,
      dailyAverage: historicalContext.averagePerDay,
      lastUpdated: new Date().toISOString(),
      recentCases: recentCases.slice(0, 12),
      dataQuality: recentCases.length > 5 ? 'mixed' : 'statistical',
      historicalContext
    }

    cachedData = violenceData
    lastFetch = now
    
    console.log('Dados de violência calculados:', {
      since2018: countSince2018.toLocaleString('pt-BR'),
      avgPerDay: historicalContext.averagePerDay,
      trend: historicalContext.currentTrend
    })
    
    return violenceData

  } catch (error) {
    console.error('Erro ao calcular dados de violência:', error)
    return getFallbackData()
  }
}

function getFallbackData(): FeminicideData {
  const historicalContext = HistoricalDataCalculator.getHistoricalContext()
  const countSince2018 = HistoricalDataCalculator.calculateTotalSince2018()
  
  const siteStartDate = new Date('2024-12-09T00:00:00-03:00')
  const yesterday = HistoricalDataCalculator.getCutoffDate()
  
  let countSinceSite = 0
  if (yesterday.getTime() > siteStartDate.getTime()) {
    const daysSinceSite = (yesterday.getTime() - siteStartDate.getTime()) / (1000 * 60 * 60 * 24)
    countSinceSite = Math.floor(daysSinceSite * 1748) // Média conservadora
  }

  return {
    count: countSinceSite,
    countSince2018,
    dailyAverage: 1748,
    lastUpdated: new Date().toISOString(),
    recentCases: [],
    dataQuality: 'statistical',
    historicalContext
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const data = await fetchViolenceData()
    const processingTime = Date.now() - startTime
    
    console.log(`API de violência processada em ${processingTime}ms`)
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=1800',
        'Access-Control-Allow-Origin': '*',
        'X-Processing-Time': processingTime.toString(),
        'X-Data-Quality': data.dataQuality,
        'X-Total-Since-2018': data.countSince2018.toString(),
        'X-Last-Update': data.lastUpdated
      }
    })
    
  } catch (error) {
    console.error('Erro crítico na API de violência:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        fallback: getFallbackData()
      },
      { status: 500 }
    )
  }
}
