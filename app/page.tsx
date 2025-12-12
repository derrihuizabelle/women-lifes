'use client'

import { useFeminicideData } from '../hooks/useFeminicideData'

export default function Home() {
  const { data, isLoading, error, refetch } = useFeminicideData()

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR')
  }

  const getCutoffInfo = () => {
    if (!data.historicalContext?.cutoffDate) return ''
    
    const cutoffDate = new Date(data.historicalContext.cutoffDate)
    return cutoffDate.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Compilando dados de violência...</p>
          <p className="loading-detail">
            Calculando casos de violência contra mulheres de janeiro/2018 até ontem
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
          <h2>Erro ao carregar dados de violência</h2>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => refetch()}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Contador Principal - Violência Geral */}
      <div className="main-counter-section">
        <div className="period-label">NÃO É SEGURO SER MULHER NO BRASIL</div>
        <div className="main-death-counter">
          {formatNumber(data.countSince2018)}
        </div>
        
        <h1 className="main-title">
          MULHERES FORAM<br />
          ASSASSINADAS, AGREDIDAS<br />
          OU ASSEDIADAS NO BRASIL
        </h1>
      </div>

      <div className="message-section">
        <h2>EPIDEMIA DE VIOLÊNCIA</h2>
        <p>
          De janeiro de 2018 até ontem, <strong>{formatNumber(data.countSince2018)}</strong> mulheres 
          brasileiras sofreram algum tipo de violência registrada oficialmente.
        </p>
        <p>
          Isso representa <strong>{formatNumber(Math.floor(data.historicalContext?.averagePerDay || 0))} casos 
          por dia</strong> durante {formatNumber(data.historicalContext?.daysSince2018 || 0)} dias consecutivos.
          A cada hora, cerca de <strong>{Math.floor((data.historicalContext?.averagePerDay || 0) / 24)} mulheres </strong> 
          sofrem violência no Brasil.
        </p>
        <p>
          <strong>A VIOLÊNCIA CONTRA A MULHER É UMA EPIDEMIA NACIONAL.</strong>
        </p>
      </div>

      <div className="action-section">
        <h3>CANAIS DE DENÚNCIA E PROTEÇÃO</h3>
        <div className="action-grid">
          <div className="action-card emergency" onClick={() => window.open('tel:180')}>
            <div className="action-icon">🆘</div>
            <div className="action-title">Disque 180</div>
            <div className="action-description">Central de atendimento à mulher<br /><strong>Para TODOS os tipos de violência</strong></div>
          </div>
          
          <div className="action-card emergency" onClick={() => window.open('tel:190')}>
            <div className="action-icon">🚔</div>
            <div className="action-title">Disque 190</div>
            <div className="action-description">Polícia Militar<br /><strong>Emergências e flagrantes</strong></div>
          </div>
          
          <div className="action-card" onClick={() => window.open('https://www.gov.br/mdh/pt-br/navegue-por-temas/politicas-para-mulheres/arquivo/centro-de-atendimento-a-mulher')}>
            <div className="action-icon">🏠</div>
            <div className="action-title">Casa da Mulher</div>
            <div className="action-description">Atendimento especializado integrado</div>
          </div>
          
          <div className="action-card" onClick={() => window.open('https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm')}>
            <div className="action-icon">⚖️</div>
            <div className="action-title">Lei Maria da Penha</div>
            <div className="action-description">Proteção contra TODAS as violências</div>
          </div>
        </div>
      </div>

      {/* Explicação da Metodologia Expandida */}
      <div className="methodology-section">
        <h3>METODOLOGIA DO PROJETO</h3>
        <p>
          Este contador compila <strong>todos os tipos de violência contra a mulher</strong> registrados 
          até ontem ({getCutoffInfo()}), incluindo assassinatos, agressões físicas, violência doméstica, 
          assédio sexual, violência psicológica e ameaças.
        </p>
        
        <div className="methodology-sources">
          <div className="source-item">
            <span className="source-icon">🏛️</span>
            <span>Dados oficiais: IBGE, IPEA, FBSP, SSPs Estaduais e Anuário de Segurança Pública</span>
          </div>
          <div className="source-item">
            <span className="source-icon">⚡</span>
            <span>Cálculo em tempo real da média diária a cada novo carregamento</span>
          </div>
          <div className="source-item">
            <span className="source-icon">📰</span>
            <span>Fontes jornalísticas: G1, Portal da Mulher, CNN Brasil</span>
          </div>
        </div>
      </div>

      <div className="source-section">
        <p>
          <small>
            <strong>Período:</strong> Janeiro de 2018 até {getCutoffInfo()}<br />
            <a href={process.env.NEXT_PUBLIC_GITHUB_URL} 
               target="_blank" rel="noopener noreferrer">
              Projeto open source criado por @derrihuizabelle
            </a>
          </small>
        </p>
      </div>
    </div>
  )
}
