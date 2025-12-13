'use client'

import { useFeminicideData } from '../hooks/useFeminicideData'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faExclamationTriangle,
  faSpinner,
  faBuilding,
  faPhone,
  faUser,
  faShieldAlt,
  faBalanceScale,
  faHandHoldingHeart,
  faHandBackFist
} from '@fortawesome/free-solid-svg-icons'

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
          <FontAwesomeIcon icon={faSpinner} className="loading-spinner" spin />
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
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Erro ao carregar dados</h2>
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
        <h2>PAREM DE NOS MATAR</h2>
        <p>
          De janeiro de 2018 até dezembro de 2025, <strong>{formatNumber(data.countSince2018)}</strong> mulheres 
          brasileiras sofreram algum tipo de violência registrada oficialmente.
        </p>
        <p>
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
            <FontAwesomeIcon icon={faPhone} className="action-icon" />
            <div className="action-title">Disque 180</div>
            <div className="action-description">Central de atendimento à mulher<br /><strong>Para TODOS os tipos de violência</strong></div>
          </div>
          
          <div className="action-card emergency" onClick={() => window.open('tel:190')}>
            <FontAwesomeIcon icon={faShieldAlt} className="action-icon" />
            <div className="action-title">Disque 190</div>
            <div className="action-description">Polícia Militar<br /><strong>Emergências e flagrantes</strong></div>
          </div>

          <div className="action-card emergency" onClick={() => window.open('tel:190')}>
            <FontAwesomeIcon icon={faUser} className="action-icon" />
            <div className="action-title">Disque 181</div>
            <div className="action-description">Disk denúncia<br /><strong>Denúncias anônimas</strong></div>
          </div>
          
        
          <div className="action-card" onClick={() => window.open('https://www.institutomariadapenha.org.br/')}>
            <FontAwesomeIcon icon={faBalanceScale} className="action-icon" />
            <div className="action-title">Instituto Maria da Penha</div>
            <div className="action-description">Ajuda, educação e proteção para vítimas de violência</div>
          </div>

          <div className="action-card" onClick={() => window.open('https://www.justiceiras.org.br/')}>
            <FontAwesomeIcon icon={faHandBackFist} className="action-icon" />
            <div className="action-title">Projeto Justiceiras</div>
            <div className="action-description">Orientação jurídica, psicológica, socioassistencial e rede de apoio para vítimas de violência</div>
          </div>

          <div className="action-card" onClick={() => window.open('https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm')}>
            <FontAwesomeIcon icon={faHandHoldingHeart} className="action-icon" />
            <div className="action-title">Mapa do Acolhimento</div>
            <div className="action-description">Acolhimento e apoio especializado para vítimas de violência</div>
          </div>
        </div>
      </div>

      <div className="methodology-section">
        <h3>METODOLOGIA DO PROJETO</h3>
        <p>
          Este contador tem finalidade de protesto e compila <strong>todos os tipos de violência contra a mulher</strong> registrados 
          de janeiro de 2018 até dezembro de 2024 e usa projeções para o ano de 2025. São incluídos assassinatos, agressões físicas, violência doméstica, 
          assédio sexual, violência psicológica e ameaças.
        </p>
        
        <div className="methodology-sources">
          <div className="source-item">
            <FontAwesomeIcon icon={faBuilding} className="source-icon" />
            <span>Fontes IBGE, IPEA, FBSP, SSPs Estaduais e Anuário de Segurança Pública</span>
          </div>
        </div>
      </div>

      <div className="source-section">
        <p>
          <small>
            <strong>Período:</strong> Janeiro de 2018 até Dezembro de 2025<br />
            <a href={process.env.NEXT_PUBLIC_GITHUB_URL} 
               target="_blank" rel="noopener noreferrer">
              Projeto open source criado por @derrihuizabelle, contribua
            </a>
          </small>
        </p>
      </div>
    </div>
  )
}
