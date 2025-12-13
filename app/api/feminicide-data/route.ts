import { NextRequest, NextResponse } from 'next/server'
import { HistoricalDataCalculator } from '../../../lib/historicalData'

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

// Cache em memória
let cachedData: FeminicideData | null = null
let lastFetch = 0
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

async function fetchViolenceData(): Promise<FeminicideData> {
  const now = Date.now()
  
  const today = new Date().toDateString()
  const cacheDate = cachedData ? new Date(cachedData.lastUpdated).toDateString() : null
  const isNewDay = cacheDate !== today
  
  if (cachedData && (now - lastFetch) < CACHE_DURATION && !isNewDay) {
    return cachedData
  }

  try {
    const historicalContext = HistoricalDataCalculator.getHistoricalContext()
    const countSince2018 = HistoricalDataCalculator.calculateTotalSince2018()
    const siteStartDate = new Date('2024-12-09T00:00:00-03:00')
    const today = new Date()
    
    const daysSinceSite = (today.getTime() - siteStartDate.getTime()) / (1000 * 60 * 60 * 24)
    const countSinceSite = Math.floor(daysSinceSite * historicalContext.averagePerDay)

    const violenceData: FeminicideData = {
      count: countSinceSite,
      countSince2018,
      dailyAverage: historicalContext.averagePerDay,
      lastUpdated: today.toISOString(),
      historicalContext,
    }

    cachedData = violenceData
    lastFetch = now
    
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
  const today = new Date()
  
  const daysSinceSite = (today.getTime() - siteStartDate.getTime()) / (1000 * 60 * 60 * 24)
  const countSinceSite = Math.floor(daysSinceSite * 1748) // Média conservadora

  return {
    count: countSinceSite,
    countSince2018,
    dailyAverage: 1748,
    lastUpdated: today.toISOString(),
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
