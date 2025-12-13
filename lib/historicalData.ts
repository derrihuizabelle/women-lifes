// Base de dados históricos de violência contra a mulher no Brasil (2018-2025)
// Incluindo: feminicídios, agressões físicas, violência doméstica, assédio sexual
// Fontes: Atlas da Violência (IPEA/FBSP), Anuário de Segurança Pública, Disque 180

export interface YearlyData {
  year: number
  totalCases: number
  feminicides: number
  physicalViolence: number
  harassment: number
  dailyAverage: number
  source: string
}

export interface MonthlyData {
  year: number
  month: number
  cases: number
  dailyAverage: number
  source: string
}

// Dados anuais consolidados - VIOLÊNCIA CONTRA A MULHER (todas as formas)
export const HISTORICAL_YEARLY_DATA: YearlyData[] = [
  {
    year: 2018,
    totalCases: 536000,
    feminicides: 4519,
    physicalViolence: 485000,
    harassment: 47000,
    dailyAverage: 1468,
    source: "Atlas da Violência 2020 + Disque 180 + SSPs estaduais"
  },
  {
    year: 2019,
    totalCases: 492000,
    feminicides: 3737,
    physicalViolence: 442000,
    harassment: 46000,
    dailyAverage: 1348,
    source: "Atlas da Violência 2021 + Disque 180 + SSPs estaduais"
  },
  {
    year: 2020,
    totalCases: 648000,
    feminicides: 3913,
    physicalViolence: 590000,
    harassment: 54000,
    dailyAverage: 1775,
    source: "Atlas da Violência 2022 + Disque 180 + SSPs estaduais"
  },
  {
    year: 2021,
    totalCases: 597000,
    feminicides: 3293,
    physicalViolence: 542000,
    harassment: 52000,
    dailyAverage: 1636,
    source: "Atlas da Violência 2023 + Disque 180 + SSPs estaduais"
  },
  {
    year: 2022,
    totalCases: 615000,
    feminicides: 3681,
    physicalViolence: 558000,
    harassment: 53000,
    dailyAverage: 1685,
    source: "17º Anuário Brasileiro de Segurança Pública + Disque 180"
  },
  {
    year: 2023,
    totalCases: 638000,
    feminicides: 3903,
    physicalViolence: 580000,
    harassment: 54000,
    dailyAverage: 1748,
    source: "Atlas da Violência 2024 + 18º Anuário de Segurança Pública + Disque 180"
  }
]

// Dados mensais de 2024 - VIOLÊNCIA GERAL CONTRA A MULHER
export const MONTHLY_DATA_2024: MonthlyData[] = [
  { year: 2024, month: 1, cases: 54200, dailyAverage: 1748, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 2, cases: 48600, dailyAverage: 1676, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 3, cases: 52800, dailyAverage: 1703, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 4, cases: 51300, dailyAverage: 1710, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 5, cases: 55400, dailyAverage: 1787, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 6, cases: 53200, dailyAverage: 1773, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 7, cases: 57100, dailyAverage: 1842, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 8, cases: 56200, dailyAverage: 1813, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 9, cases: 54800, dailyAverage: 1827, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 10, cases: 58300, dailyAverage: 1881, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 11, cases: 55700, dailyAverage: 1857, source: "Disque 180 + SSPs estaduais" },
  { year: 2024, month: 12, cases: 46800, dailyAverage: 1832, source: "Disque 180 + SSPs estaduais (parcial)" }
]

// Dados mensais de 2025 (projeções baseadas em tendências)
export const MONTHLY_DATA_2025: MonthlyData[] = [
  { year: 2025, month: 1, cases: 56800, dailyAverage: 1832, source: "Projeção baseada em tendências" },
  { year: 2025, month: 2, cases: 50400, dailyAverage: 1800, source: "Projeção baseada em tendências" },
  { year: 2025, month: 3, cases: 54200, dailyAverage: 1748, source: "Projeção baseada em tendências" },
  { year: 2025, month: 4, cases: 52500, dailyAverage: 1750, source: "Projeção baseada em tendências" },
  { year: 2025, month: 5, cases: 56700, dailyAverage: 1829, source: "Projeção baseada em tendências" },
  { year: 2025, month: 6, cases: 54300, dailyAverage: 1810, source: "Projeção baseada em tendências" },
  { year: 2025, month: 7, cases: 58100, dailyAverage: 1874, source: "Projeção baseada em tendências" },
  { year: 2025, month: 8, cases: 57200, dailyAverage: 1845, source: "Projeção baseada em tendências" },
  { year: 2025, month: 9, cases: 55600, dailyAverage: 1853, source: "Projeção baseada em tendências" },
  { year: 2025, month: 10, cases: 59200, dailyAverage: 1910, source: "Projeção baseada em tendências" },
  { year: 2025, month: 11, cases: 57800, dailyAverage: 1927, source: "Projeção baseada em tendências" }
]

export class HistoricalDataCalculator {
  
  static calculateTotalSince2018(): number {
    const cutoffDate = this.getCutoffDate()
    const cutoffYear = cutoffDate.getFullYear()
    const cutoffMonth = cutoffDate.getMonth() + 1
    const cutoffDay = cutoffDate.getDate()

    let totalViolence = 0

    HISTORICAL_YEARLY_DATA.forEach(yearData => {
        totalViolence += yearData.totalCases  
    })

    MONTHLY_DATA_2024.forEach(monthData => {
      totalViolence += monthData.cases
    })

  
    // Somar 2025 até o mês de corte
    MONTHLY_DATA_2025.forEach(monthData => {
      if (monthData.month < cutoffMonth) {
        totalViolence += monthData.cases
      } else if (monthData.month === cutoffMonth) {
        const daysInMonth = new Date(cutoffYear, cutoffMonth, 0).getDate()
        const proportionalCases = Math.floor((monthData.cases / daysInMonth) * cutoffDay)
        totalViolence += proportionalCases
      }
    })
    

    return totalViolence
  }

  // data de corte = 1 dia antes do dia atual
  static getCutoffDate(): Date {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 1)
    cutoff.setHours(23, 59, 59, 999)
    return cutoff
  }


  static getHistoricalContext() {
    const cutoffDate = this.getCutoffDate()
    const totalSince2018 = this.calculateTotalSince2018()
    const daysSince2018 = this.calculateDaysSince2018()
    const averagePerDay = Math.round((totalSince2018 / daysSince2018) * 10) / 10

    return {
      totalSince2018,
      averagePerDay,
      daysSince2018,
      cutoffDate: cutoffDate.toISOString()
    }
  }

  private static calculateDaysSince2018(): number {
    const START_DATE = new Date('2018-01-01T00:00:00-03:00')
    const cutoffDate = this.getCutoffDate()
    const diffMs = cutoffDate.getTime() - START_DATE.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }
}
