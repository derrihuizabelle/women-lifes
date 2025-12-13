/**
 * @jest-environment node
 */
import { GET } from '../../app/api/feminicide-data/route'
import { NextRequest } from 'next/server'

// Helper para criar NextRequest mock
function createMockRequest(url: string = 'http://localhost:3000/api/feminicide-data'): NextRequest {
  return new NextRequest(url)
}

describe('API /api/feminicide-data', () => {
  describe('GET', () => {
    it('deve retornar status 200', async () => {
      const request = createMockRequest()
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('deve retornar JSON válido', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data).toBeDefined()
      expect(typeof data).toBe('object')
    })

    it('deve retornar todas as propriedades esperadas', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('count')
      expect(data).toHaveProperty('countSince2018')
      expect(data).toHaveProperty('dailyAverage')
      expect(data).toHaveProperty('lastUpdated')
      expect(data).toHaveProperty('historicalContext')
    })

    it('deve retornar historicalContext com propriedades corretas', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data.historicalContext).toHaveProperty('totalSince2018')
      expect(data.historicalContext).toHaveProperty('averagePerDay')
      expect(data.historicalContext).toHaveProperty('daysSince2018')
      expect(data.historicalContext).toHaveProperty('cutoffDate')
    })

    it('count deve ser número não negativo', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(typeof data.count).toBe('number')
      expect(data.count).toBeGreaterThanOrEqual(0)
    })

    it('countSince2018 deve ser maior que 3 milhões', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      // Com base nos dados históricos, o total desde 2018 deve ser > 3 milhões
      expect(data.countSince2018).toBeGreaterThan(3000000)
    })

    it('dailyAverage deve estar em range razoável', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data.dailyAverage).toBeGreaterThan(1000)
      expect(data.dailyAverage).toBeLessThan(3000)
    })

    it('lastUpdated deve ser ISO date válido', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      const parsedDate = new Date(data.lastUpdated)
      expect(parsedDate.toString()).not.toBe('Invalid Date')
    })

    it('deve incluir headers de cache corretos', async () => {
      const request = createMockRequest()
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=1800')
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('deve incluir headers customizados', async () => {
      const request = createMockRequest()
      const response = await GET(request)

      expect(response.headers.get('X-Processing-Time')).toBeDefined()
      expect(response.headers.get('X-Total-Since-2018')).toBeDefined()
      expect(response.headers.get('X-Last-Update')).toBeDefined()
    })

    it('deve retornar dados consistentes em múltiplas chamadas', async () => {
      const request1 = createMockRequest()
      const request2 = createMockRequest()
      
      const response1 = await GET(request1)
      const response2 = await GET(request2)
      
      const data1 = await response1.json()
      const data2 = await response2.json()

      // Os dados devem ser iguais (cache)
      expect(data1.countSince2018).toBe(data2.countSince2018)
      expect(data1.dailyAverage).toBe(data2.dailyAverage)
    })
  })
})

describe('Validação de Dados da API', () => {
  it('historicalContext.totalSince2018 deve corresponder a countSince2018', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(data.countSince2018).toBe(data.historicalContext.totalSince2018)
  })

  it('historicalContext.averagePerDay deve corresponder a dailyAverage', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(data.dailyAverage).toBe(data.historicalContext.averagePerDay)
  })

})

