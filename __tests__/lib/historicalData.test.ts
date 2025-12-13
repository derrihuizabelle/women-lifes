import {
  HistoricalDataCalculator,
  HISTORICAL_YEARLY_DATA,
  MONTHLY_DATA_2024,
  MONTHLY_DATA_2025,
  YearlyData,
  MonthlyData
} from '../../lib/historicalData'

describe('HistoricalDataCalculator', () => {
  describe('getCutoffDate', () => {
    it('deve retornar a data de ontem', () => {
      const cutoffDate = HistoricalDataCalculator.getCutoffDate()
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      expect(cutoffDate.getDate()).toBe(yesterday.getDate())
      expect(cutoffDate.getMonth()).toBe(yesterday.getMonth())
      expect(cutoffDate.getFullYear()).toBe(yesterday.getFullYear())
    })

    it('deve retornar horário 23:59:59', () => {
      const cutoffDate = HistoricalDataCalculator.getCutoffDate()

      expect(cutoffDate.getHours()).toBe(23)
      expect(cutoffDate.getMinutes()).toBe(59)
      expect(cutoffDate.getSeconds()).toBe(59)
    })
  })

  describe('calculateTotalSince2018', () => {
    it('deve retornar um número positivo', () => {
      const total = HistoricalDataCalculator.calculateTotalSince2018()
      
      expect(total).toBeGreaterThan(0)
    })

    it('deve incluir todos os dados históricos anuais', () => {
      const total = HistoricalDataCalculator.calculateTotalSince2018()
      const yearlyTotal = HISTORICAL_YEARLY_DATA.reduce((sum, year) => sum + year.totalCases, 0)

      // O total deve ser maior que os dados anuais (porque inclui 2024 e 2025)
      expect(total).toBeGreaterThan(yearlyTotal)
    })

    it('deve incluir dados de 2024', () => {
      const total = HistoricalDataCalculator.calculateTotalSince2018()
      const yearlyTotal = HISTORICAL_YEARLY_DATA.reduce((sum, year) => sum + year.totalCases, 0)
      const total2024 = MONTHLY_DATA_2024.reduce((sum, month) => sum + month.cases, 0)

      // O total deve ser maior que anuais + 2024 (porque inclui parte de 2025)
      expect(total).toBeGreaterThanOrEqual(yearlyTotal + total2024)
    })

    it('deve retornar valor consistente em múltiplas chamadas', () => {
      const total1 = HistoricalDataCalculator.calculateTotalSince2018()
      const total2 = HistoricalDataCalculator.calculateTotalSince2018()

      expect(total1).toBe(total2)
    })
  })

  describe('getHistoricalContext', () => {
    it('deve retornar objeto com todas as propriedades esperadas', () => {
      const context = HistoricalDataCalculator.getHistoricalContext()

      expect(context).toHaveProperty('totalSince2018')
      expect(context).toHaveProperty('averagePerDay')
      expect(context).toHaveProperty('daysSince2018')
      expect(context).toHaveProperty('cutoffDate')
    })

    it('totalSince2018 deve ser número positivo', () => {
      const context = HistoricalDataCalculator.getHistoricalContext()

      expect(typeof context.totalSince2018).toBe('number')
      expect(context.totalSince2018).toBeGreaterThan(0)
    })

    it('averagePerDay deve ser número positivo e razoável', () => {
      const context = HistoricalDataCalculator.getHistoricalContext()

      expect(typeof context.averagePerDay).toBe('number')
      expect(context.averagePerDay).toBeGreaterThan(1000) // média mínima esperada
      expect(context.averagePerDay).toBeLessThan(3000) // média máxima razoável
    })

    it('daysSince2018 deve ser maior que 2000 dias', () => {
      const context = HistoricalDataCalculator.getHistoricalContext()
      
      // De 2018 até hoje são mais de 2000 dias
      expect(context.daysSince2018).toBeGreaterThan(2000)
    })

    it('cutoffDate deve ser string ISO válida', () => {
      const context = HistoricalDataCalculator.getHistoricalContext()
      const parsedDate = new Date(context.cutoffDate)

      expect(typeof context.cutoffDate).toBe('string')
      expect(parsedDate.toString()).not.toBe('Invalid Date')
    })

    it('averagePerDay deve ser calculado corretamente', () => {
      const context = HistoricalDataCalculator.getHistoricalContext()
      const calculatedAverage = context.totalSince2018 / context.daysSince2018

      // Deve ser aproximadamente igual (com arredondamento)
      expect(Math.abs(context.averagePerDay - calculatedAverage)).toBeLessThan(1)
    })
  })
})

describe('Dados Históricos', () => {
  describe('HISTORICAL_YEARLY_DATA', () => {
    it('deve ter dados de 2018 a 2023', () => {
      const years = HISTORICAL_YEARLY_DATA.map(d => d.year)
      
      expect(years).toContain(2018)
      expect(years).toContain(2023)
      expect(HISTORICAL_YEARLY_DATA.length).toBe(6)
    })

    it('cada ano deve ter todas as propriedades obrigatórias', () => {
      HISTORICAL_YEARLY_DATA.forEach((yearData: YearlyData) => {
        expect(yearData).toHaveProperty('year')
        expect(yearData).toHaveProperty('totalCases')
        expect(yearData).toHaveProperty('feminicides')
        expect(yearData).toHaveProperty('physicalViolence')
        expect(yearData).toHaveProperty('harassment')
        expect(yearData).toHaveProperty('dailyAverage')
        expect(yearData).toHaveProperty('source')
      })
    })

    it('totalCases deve ser proporcional à soma das categorias', () => {
      HISTORICAL_YEARLY_DATA.forEach((yearData: YearlyData) => {
        // As categorias listadas representam a maior parte dos casos
        const sumCategories = yearData.feminicides + yearData.physicalViolence + yearData.harassment
        // A soma deve estar na mesma ordem de grandeza do total
        expect(sumCategories).toBeGreaterThan(yearData.totalCases * 0.8)
        expect(sumCategories).toBeLessThan(yearData.totalCases * 1.2)
      })
    })
  })

  describe('MONTHLY_DATA_2024', () => {
    it('deve ter 12 meses', () => {
      expect(MONTHLY_DATA_2024.length).toBe(12)
    })

    it('meses devem estar em ordem', () => {
      for (let i = 0; i < MONTHLY_DATA_2024.length; i++) {
        expect(MONTHLY_DATA_2024[i].month).toBe(i + 1)
      }
    })

    it('todos os registros devem ser do ano 2024', () => {
      MONTHLY_DATA_2024.forEach((monthData: MonthlyData) => {
        expect(monthData.year).toBe(2024)
      })
    })
  })

  describe('MONTHLY_DATA_2025', () => {
    it('deve ter pelo menos 11 meses (até novembro)', () => {
      expect(MONTHLY_DATA_2025.length).toBeGreaterThanOrEqual(11)
    })

    it('todos os registros devem ser do ano 2025', () => {
      MONTHLY_DATA_2025.forEach((monthData: MonthlyData) => {
        expect(monthData.year).toBe(2025)
      })
    })

    it('meses devem estar em ordem crescente', () => {
      for (let i = 1; i < MONTHLY_DATA_2025.length; i++) {
        expect(MONTHLY_DATA_2025[i].month).toBeGreaterThan(MONTHLY_DATA_2025[i - 1].month)
      }
    })
  })
})

