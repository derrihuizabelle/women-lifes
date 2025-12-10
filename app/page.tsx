'use client'

import { Ticker } from './components/Ticker'
import { useFeminicideData } from '../hooks/useFeminicideData'

export default function Home() {
  const { data, isLoading, error, refetch, lastFetchTime } = useFeminicideData()

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR')
  }

  const getDataQualityBadge = () => {
    const badges = {
      'real': { text: 'DADOS REAIS', color: '#00ff88' },
      'mixed': { text: 'DADOS ATUALIZADOS', color: '#ffaa00' },
      'statistical': { text: 'DADOS OFICIAIS', color: '#ff6b6b' }
    }
    
    const badge = badges[data.dataQuality] || badges.statistical
    
    return (
      <div 
        className="data-quality-badge"
        style={{ backgroundColor: badge.color }}
      >
        {badge.text}
      </div>
    )
  }

  const getLastUpdateText = () => {
    if (!lastFetchTime) return 'Carregando...'
    
    const diffMs = new Date().getTime() - lastFetchTime.getTime()
    const minutes = Math.floor(diffMs / (1000 * 60))
    
    if (minutes < 1) return 'atualizado agora'
    if (minutes < 60) return `atualizado há ${minutes} min`
    const hours = Math.floor(minutes / 60)
    return `atualizado há ${hours}h`
  }

  const getTrendIcon = () => {
    const icons = {
      'increasing': '📈',
      'decreasing': '📉', 
      'stable': '➡️'
    }
    return icons[data.historicalContext?.currentTrend] || '➡️'
  }

  const getTrendText = () => {
    const texts = {
      'increasing': 'TENDÊNCIA DE AUMENTO',
      'decreasing': 'TENDÊNCIA DE REDUÇÃO',
      'stable': 'TENDÊNCIA ESTÁVEL'
    }
    return texts[data.historicalContext?.currentTrend] || 'ANALISANDO TENDÊNCIA'
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Calculando dados históricos...</p>
          <p className="loading-detail">
            Compilando feminicídios de 2018 até novembro de 2025
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-section">
          <div className="error-icon">⚠️</div>
          <h2>Erro ao carregar dados históricos</h2>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => refetch()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header-info">
        {getDataQualityBadge()}
        <div className="update-info">
          {getLastUpdateText()}
        </div>
        <div className="period-info">
          2018 - NOV 2025
        </div>
      </div>

      {/* Contador Principal - Desde 2018 */}
      <div className="main-counter-section">
        <div className="period-label">DESDE JANEIRO DE 2018</div>
        <div className="main-death-counter">
          {formatNumber(data.countSince2018)}
        </div>
        
        <h1 className="main-title">
          MULHERES FORAM<br />
          ASSASSINADAS NO BRASIL
        </h1>
        
        <div className="period-summary">
          <span className="days-count">{formatNumber(data.historicalContext?.daysAnalyzed || 0)} dias analisados</span>
          <span className="trend-indicator">
            {getTrendIcon()} {getTrendText()}
          </span>
        </div>
      </div>

      {/* Contador Secundário - Desde publicação do site */}
      <div className="secondary-counter-section">
        <div className="secondary-label">Desde que este contador foi iniciado:</div>
        <div className="secondary-counter">{formatNumber(data.count)}</div>
        <div className="secondary-subtitle">mortes que poderiam ter sido evitadas</div>
      </div>

      <Ticker recentCases={data.recentCases} />

      {/* Estatísticas Históricas */}
      <div className="historical-stats-section">
        <h3>CONTEXTO HISTÓRICO (2018-2025)</h3>
        <div className="stats-grid">
          <div className="stat-card historical">
            <div className="stat-number">{formatNumber(data.historicalContext?.yearlyAverage || 0)}</div>
            <div className="stat-label">média anual<br />de feminicídios</div>
          </div>
          
          <div className="stat-card historical worst-year">
            <div className="stat-number">{data.historicalContext?.worstYear?.totalCases || 0}</div>
            <div className="stat-label">pior ano<br />({data.historicalContext?.worstYear?.year})</div>
          </div>
          
          <div className="stat-card historical best-year">
            <div className="stat-number">{data.historicalContext?.bestYear?.totalCases || 0}</div>
            <div className="stat-label">melhor ano<br />({data.historicalContext?.bestYear?.year})</div>
          </div>

          <div className="stat-card historical projection">
            <div className="stat-number">{formatNumber(data.historicalContext?.projection2025?.projectedTotal || 0)}</div>
            <div className="stat-label">projeção para<br />fim de 2025</div>
          </div>
        </div>
      </div>

      {/* Estatísticas Atuais */}
      <div className="current-stats-section">
        <h3>SITUAÇÃO ATUAL</h3>
        <div className="stats-grid">
          <div className="stat-card current">
            <div className="stat-number">{data.dailyAverage.toFixed(1)}</div>
            <div className="stat-label">mulheres assassinadas<br />por dia (atual)</div>
          </div>
          
          <div className="stat-card current">
            <div className="stat-number">3.903</div>
            <div className="stat-label">casos confirmados<br />em 2023</div>
          </div>
          
          <div className="stat-card current">
            <div className="stat-number">7</div>
            <div className="stat-label">anos de dados<br />analisados</div>
          </div>
        </div>
      </div>

      {data.recentCases.length > 0 && (
        <div className="recent-cases-section">
          <h3>
            {data.dataQuality === 'real' ? 'CASOS RECENTES (NOTÍCIAS)' : 'REPRESENTAÇÃO ESTATÍSTICA'}
          </h3>
          <div className="cases-grid">
            {data.recentCases.slice(0, 8).map((case_, index) => (
              <div key={`${case_.date}-${index}`} className="case-card">
                <div className="case-date">
                  {new Date(case_.date).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
                <div className="case-location">{case_.location}</div>
                {case_.age && <div className="case-age">{case_.age} anos</div>}
                {case_.circumstances && (
                  <div className="case-circumstances">{case_.circumstances}</div>
                )}
                <div className="case-source">{case_.source}</div>
                {case_.url && (
                  <a 
                    href={case_.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="case-link"
                  >
                    Ver notícia →
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="cases-disclaimer">
            * {data.dataQuality === 'real' 
              ? 'Casos compilados de fontes jornalísticas. Tratamento respeitoso das informações.' 
              : 'Representação estatística baseada em dados oficiais do Atlas da Violência e SSPs.'}
          </p>
        </div>
      )}

      <div className="message-section">
        <h2>7 ANOS DE VIOLÊNCIA</h2>
        <p>
          De 2018 até hoje, <strong>{formatNumber(data.countSince2018)}</strong> mulheres 
          brasileiras tiveram suas vidas interrompidas pela violência.
        </p>
        <p>
          Cada número representa uma filha, mãe, irmã, amiga que não voltará para casa.
        </p>
        <p>
          <strong>CHEGA DE NATURALIZAR ESSA VIOLÊNCIA.</strong>
        </p>
      </div>

      <div className="action-section">
        <h3>CANAIS DE DENÚNCIA E PROTEÇÃO</h3>
        <div className="action-grid">
          <div className="action-card emergency" onClick={() => window.open('tel:180')}>
            <div className="action-icon">🆘</div>
            <div className="action-title">Disque 180</div>
            <div className="action-description">Central de atendimento à mulher<br /><strong>24h • Gratuito • Sigiloso</strong></div>
          </div>
          
          <div className="action-card emergency" onClick={() => window.open('tel:190')}>
            <div className="action-icon">🚔</div>
            <div className="action-title">Disque 190</div>
            <div className="action-description">Polícia Militar<br /><strong>Emergências</strong></div>
          </div>
          
          <div className="action-card" onClick={() => window.open('https://www.gov.br/mdh/pt-br/navegue-por-temas/politicas-para-mulheres/arquivo/centro-de-atendimento-a-mulher')}>
            <div className="action-icon">🏠</div>
            <div className="action-title">Casa da Mulher</div>
            <div className="action-description">Centros especializados de atendimento</div>
          </div>
          
          <div className="action-card" onClick={() => window.open('https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm')}>
            <div className="action-icon">⚖️</div>
            <div className="action-title">Lei Maria da Penha</div>
            <div className="action-description">Medidas protetivas de urgência</div>
          </div>
        </div>
      </div>

      <div className="source-section">
        <p>
          <small>
            <strong>Fontes oficiais:</strong> Atlas da Violência 2024 (IPEA/FBSP) • Anuário Brasileiro de Segurança Pública • SSPs Estaduais<br />
            <strong>Dados em tempo real:</strong> APIs de notícias e projeções estatísticas<br />
            <strong>Período analisado:</strong> Janeiro de 2018 até Novembro de 2025<br />
            <a href="https://noticias.uol.com.br/ultimas-noticias/agencia-estado/2025/05/12/atlas-da-violencia-brasil-tem-dez-mulheres-assassinadas-por-dia.htm" 
               target="_blank" rel="noopener noreferrer">
              Leia a reportagem que inspirou este contador
            </a>
          </small>
        </p>
      </div>
    </div>
  )
}
