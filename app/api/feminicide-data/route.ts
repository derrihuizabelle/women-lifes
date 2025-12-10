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

// Cache em memória
let cachedData: FeminicideData | null = null
let lastFetch = 0
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutos

async function fetchComprehensiveFeminicideData(): Promise<FeminicideData> {
  const now = Date.now()
  
  // Verificar cache (mas sempre recalcular contadores em tempo real)
  if (cachedData && (now - lastFetch) < CACHE_DURATION) {
    // Atualizar apenas contadores em tempo real
    const updatedData = { ...cachedData }
    updatedData.countSince2018 = HistoricalDataCalculator.calculateTotalSince2018()
    
    // Contador desde publicação do site (pode ser mantido ou ajustado)
    const siteStartDate = new Date('2024-12-09T00:00:00-03:00')
    const timeSinceSite = new Date().getTime() - siteStartDate.getTime()
    const daysSinceSite = timeSinceSite / (1000 * 60 * 60 * 24)
    updatedData.count = Math.floor(Math.max(0, daysSinceSite) * updatedData.dailyAverage)
    
    updatedData.lastUpdated = new Date().toISOString()
    return updatedData
  }

  try {
    console.log('Calculando dados históricos completos (2018-2025)...')
    
    // Buscar dados históricos
    const historicalContext = HistoricalDataCalculator.getHistoricalContext()
    
    // Buscar casos recentes de notícias
    const recentCases = await newsService.fetchRecentCases()
    
    // Calcular estatísticas atualizadas
    const currentDailyAverage = HistoricalDataCalculator.getCurrentDailyAverage()
    
    // Contador desde 2018 (o grande número)
    const countSince2018 = HistoricalDataCalculator.calculateTotalSince2018()
    
    // Contador desde publicação do site (número menor, mais dinâmico)
    const siteStartDate = new Date('2024-12-09T00:00:00-03:00')
    const timeSinceSite = new Date().getTime() - siteStartDate.getTime()
    const daysSinceSite = timeSinceSite / (1000 * 60 * 60 * 24)
    const countSinceSite = Math.floor(Math.max(0, daysSinceSite) * currentDailyAverage)

    const comprehensiveData: FeminicideData = {
      count: countSinceSite, // Desde a publicação do site
      countSince2018, // Desde 2018 - O GRANDE NÚMERO
      dailyAverage: currentDailyAverage,
      lastUpdated: new Date().toISOString(),
      recentCases: recentCases.slice(0, 12), // Mais casos para mostrar
      dataQuality: recentCases.length > 5 ? 'mixed' : 'statistical',
      historicalContext
    }

    cachedData = comprehensiveData
    lastFetch = now
    
    console.log('Dados históricos calculados:', {
      since2018: countSince2018,
      sinceSite: countSinceSite,
      dailyAvg: currentDailyAverage,
      trend: historicalContext.currentTrend,
      recentCases: recentCases.length
    })
    
    return comprehensiveData

  } catch (error) {
    console.error('Erro ao calcular dados históricos:', error)
    return getFallbackHistoricalData()
  }
}

function getFallbackHistoricalData(): FeminicideData {
  const historicalContext = HistoricalDataCalculator.getHistoricalContext()
  const countSince2018 = HistoricalDataCalculator.calculateTotalSince2018()
  
  // Contador conservador desde publicação do site
  const siteStartDate = new Date('2024-12-09T00:00:00-03:00')
  const daysSinceSite = (new Date().getTime() - siteStartDate.getTime()) / (1000 * 60 * 60 * 24)
  const countSinceSite = Math.floor(Math.max(0, daysSinceSite) * 10.7)

  return {
    count: countSinceSite,
    countSince2018,
    dailyAverage: 10.7, // Média conservadora
    lastUpdated: new Date().toISOString(),
    recentCases: [],
    dataQuality: 'statistical',
    historicalContext
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const data = await fetchComprehensiveFeminicideData()
    const processingTime = Date.now() - startTime
    
    console.log(`API histórica processada em ${processingTime}ms`)
    console.log(`Total desde 2018: ${data.countSince2018.toLocaleString('pt-BR')}`)
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=1800', // 30 minutos
        'Access-Control-Allow-Origin': '*',
        'X-Processing-Time': processingTime.toString(),
        'X-Data-Quality': data.dataQuality,
        'X-Historical-Base': '2018-2025',
        'X-Total-Since-2018': data.countSince2018.toString(),
        'X-Last-Update': data.lastUpdated
      }
    })
    
  } catch (error) {
    console.error('Erro crítico na API histórica:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        fallback: getFallbackHistoricalData()
      },
      { status: 500 }
    )
  }
}

// Endpoint para estatísticas históricas detalhadas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'historical-stats') {
      const stats = HistoricalDataCalculator.getHistoricalContext()
      return NextResponse.json(stats)
    }

    if (action === 'refresh-cache') {
      cachedData = null
      lastFetch = 0
      const data = await fetchComprehensiveFeminicideData()
      
      return NextResponse.json({
        message: 'Cache histórico atualizado',
        data
      })
    }

    return NextResponse.json(
      { error: 'Ação não reconhecida' },
      { status: 400 }
    )
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}
