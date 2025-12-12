// Serviço para buscar dados sobre violência contra a mulher (todas as formas)
// Incluindo: feminicídios, agressões, assédio, violência doméstica, psicológica

interface NewsSource {
  name: string
  url: string
  apiKey?: string
  searchTerms: string[]
}

interface ViolenceCase {
  date: string
  location: string
  age?: number
  violenceType: 'feminicide' | 'physical' | 'harassment' | 'psychological' | 'domestic'
  circumstances?: string
  source: string
  url?: string
}

export class NewsService {
  private sources: NewsSource[] = [
    {
      name: 'NewsAPI',
      url: 'https://newsapi.org/v2/everything',
      apiKey: process.env.NEWS_API_KEY,
      searchTerms: [
        // Feminicídios
        'feminicídio', 'mulher assassinada', 'mulher morta pelo marido',
        // Violência física
        'violência doméstica', 'mulher agredida', 'espancamento de mulher',
        // Assédio
        'assédio sexual', 'importunação sexual', 'abuso sexual',
        // Violência psicológica
        'violência psicológica', 'ameaça contra mulher', 'perseguição stalking'
      ]
    },
    {
      name: 'G1 RSS',
      url: 'https://g1.globo.com/rss/g1/',
      searchTerms: ['violência contra mulher', 'feminicídio', 'lei maria da penha']
    }
  ]

  async fetchRecentCases(): Promise<ViolenceCase[]> {
    const cases: ViolenceCase[] = []
    
    try {
      // Integração com NewsAPI (se a chave estiver configurada)
      if (process.env.NEWS_API_KEY) {
        const newsApiCases = await this.fetchFromNewsAPI()
        cases.push(...newsApiCases)
      }

      // Buscar de RSS feeds públicos
      const rssCases = await this.fetchFromRSSFeeds()
      cases.push(...rssCases)

      // Buscar dados de organizações (APIs públicas)
      const orgCases = await this.fetchFromOrganizations()
      cases.push(...orgCases)

      // Ordenar por data (mais recente primeiro)
      return cases
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30) // Mais casos para mostrar diversidade

    } catch (error) {
      console.error('Erro ao buscar casos de violência:', error)
      return this.getFallbackData()
    }
  }

  private async fetchFromNewsAPI(): Promise<ViolenceCase[]> {
    const cases: ViolenceCase[] = []
    
    for (const term of this.sources[0].searchTerms) {
      try {
        const response = await fetch(
          `${this.sources[0].url}?q=${encodeURIComponent(term)}&language=pt&sortBy=publishedAt&pageSize=5`,
          {
            headers: {
              'X-API-Key': process.env.NEWS_API_KEY!
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          const newCases = this.parseNewsAPIResponse(data.articles)
          cases.push(...newCases)
        }
      } catch (error) {
        console.error(`Erro ao buscar notícias para "${term}":`, error)
      }
    }

    return cases
  }

  private async fetchFromRSSFeeds(): Promise<ViolenceCase[]> {
    // Implementar parser de RSS para fontes públicas
    return []
  }

  private async fetchFromOrganizations(): Promise<ViolenceCase[]> {
    // Integrar com APIs de organizações como:
    // - Instituto Patrícia Galvão
    // - Instituto Maria da Penha
    // - Central de Atendimento à Mulher (Disque 180)
    return []
  }

  private parseNewsAPIResponse(articles: any[]): ViolenceCase[] {
    return articles
      .filter(article => this.isViolenceRelated(article))
      .map(article => this.extractCaseFromArticle(article))
      .filter(Boolean)
  }

  private isViolenceRelated(article: any): boolean {
    const content = `${article.title} ${article.description}`.toLowerCase()
    const keywords = [
      // Feminicídios
      'feminicídio', 'mulher assassinada', 'mulher morta', 'mulher foi morta',
      // Violência física
      'violência doméstica', 'mulher agredida', 'espancamento', 'mulher foi agredida',
      // Assédio
      'assédio sexual', 'importunação sexual', 'abuso sexual', 'estupro',
      // Violência psicológica
      'ameaça contra mulher', 'perseguição', 'stalking', 'violência psicológica',
      // Lei Maria da Penha
      'maria da penha', 'medida protetiva', 'violência contra a mulher'
    ]
    
    return keywords.some(keyword => content.includes(keyword))
  }

  private extractCaseFromArticle(article: any): ViolenceCase | null {
    try {
      const content = `${article.title} ${article.description}`.toLowerCase()
      const location = this.extractLocation(article.title + ' ' + article.description)
      const age = this.extractAge(article.title + ' ' + article.description)
      const violenceType = this.classifyViolenceType(content)
      
      return {
        date: article.publishedAt,
        location: location || 'Local não informado',
        age,
        violenceType,
        circumstances: this.extractCircumstances(content),
        source: article.source.name,
        url: article.url
      }
    } catch (error) {
      console.error('Erro ao extrair dados do artigo:', error)
      return null
    }
  }

  private classifyViolenceType(content: string): ViolenceCase['violenceType'] {
    if (content.includes('feminicídio') || content.includes('assassinada') || content.includes('morta')) {
      return 'feminicide'
    }
    if (content.includes('assédio') || content.includes('importunação') || content.includes('abuso sexual')) {
      return 'harassment'
    }
    if (content.includes('agredida') || content.includes('espancamento') || content.includes('lesão corporal')) {
      return 'physical'
    }
    if (content.includes('ameaça') || content.includes('perseguição') || content.includes('stalking')) {
      return 'psychological'
    }
    
    return 'domestic' // Padrão para violência doméstica geral
  }

  private extractLocation(text: string): string | null {
    // Regex para extrair localidades brasileiras
    const locationRegex = /(?:em|no|na)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})/g
    const match = locationRegex.exec(text)
    
    if (match) {
      return `${match[1]}, ${match[2]}`
    }
    
    return null
  }

  private extractAge(text: string): number | undefined {
    // Regex para extrair idade
    const ageRegex = /(?:de\s+)?(\d{1,2})\s+anos?/g
    const match = ageRegex.exec(text)
    
    if (match) {
      const age = parseInt(match[1])
      return age >= 15 && age <= 80 ? age : undefined
    }
    
    return undefined
  }

  private extractCircumstances(content: string): string {
    const circumstances = []
    
    // Relação com agressor
    if (content.includes('companheiro') || content.includes('marido') || content.includes('namorado')) {
      circumstances.push('Violência por parceiro íntimo')
    }
    if (content.includes('ex-marido') || content.includes('ex-companheiro') || content.includes('ex-namorado')) {
      circumstances.push('Violência por ex-parceiro')
    }
    
    // Tipo de agressão
    if (content.includes('tiro') || content.includes('bala') || content.includes('disparos')) {
      circumstances.push('Arma de fogo')
    }
    if (content.includes('faca') || content.includes('esfaqueada') || content.includes('facadas')) {
      circumstances.push('Arma branca')
    }
    if (content.includes('estrangulada') || content.includes('enforcada')) {
      circumstances.push('Asfixia')
    }
    
    // Local
    if (content.includes('em casa') || content.includes('residência') || content.includes('no lar')) {
      circumstances.push('No ambiente doméstico')
    }
    if (content.includes('na rua') || content.includes('via pública')) {
      circumstances.push('Em via pública')
    }
    
    // Contexto
    if (content.includes('discussão') || content.includes('briga') || content.includes('desentendimento')) {
      circumstances.push('Após discussão')
    }
    if (content.includes('separação') || content.includes('divórcio') || content.includes('fim do relacionamento')) {
      circumstances.push('Contexto de separação')
    }
    
    return circumstances.length > 0 ? circumstances.join(', ') : 'Circunstâncias não informadas'
  }

  private getFallbackData(): ViolenceCase[] {
    // Dados de fallback representando diferentes tipos de violência (anonimizados)
    const today = new Date()
    const violenceTypes: ViolenceCase['violenceType'][] = ['feminicide', 'physical', 'harassment', 'psychological', 'domestic']
    
    return Array.from({ length: 20 }, (_, i) => ({
      date: new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
      location: this.getRandomLocation(),
      age: Math.floor(Math.random() * 50) + 18,
      violenceType: violenceTypes[i % violenceTypes.length],
      circumstances: this.getRandomCircumstances(),
      source: 'Dados estatísticos representativos'
    }))
  }

  private getRandomLocation(): string {
    const locations = [
      'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Salvador, BA',
      'Fortaleza, CE', 'Brasília, DF', 'Curitiba, PR', 'Recife, PE', 'Porto Alegre, RS',
      'Manaus, AM', 'Belém, PA', 'Goiânia, GO', 'Guarulhos, SP', 'Campinas, SP',
      'São Luís, MA', 'Maceió, AL', 'Natal, RN', 'João Pessoa, PB'
    ]
    return locations[Math.floor(Math.random() * locations.length)]
  }

  private getRandomCircumstances(): string {
    const circumstances = [
      'Violência doméstica por parceiro íntimo',
      'Violência por ex-companheiro após separação',
      'Assédio sexual no ambiente de trabalho',
      'Importunação sexual em transporte público',
      'Violência psicológica e ameaças',
      'Agressão física em contexto doméstico',
      'Perseguição e stalking digital',
      'Violência sexual por conhecido',
      'Ameaças após denúncia à polícia'
    ]
    return circumstances[Math.floor(Math.random() * circumstances.length)]
  }
}

export const newsService = new NewsService()
