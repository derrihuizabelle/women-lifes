'use client'

import { useEffect, useState } from 'react'

interface RecentCase {
  date: string
  location: string
  age?: number
  circumstances?: string
  source: string
}

interface TickerProps {
  recentCases?: RecentCase[]
}

const SYMBOLIC_LOCATIONS = [
  'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Salvador, BA',
  'Fortaleza, CE', 'Brasília, DF', 'Curitiba, PR', 'Recife, PE', 'Porto Alegre, RS',
  'Manaus, AM', 'Belém, PA', 'Goiânia, GO', 'Guarulhos, SP', 'Campinas, SP',
  'São Luís, MA', 'São Gonçalo, RJ', 'Maceió, AL', 'Duque de Caxias, RJ',
  'Natal, RN', 'Campo Grande, MS', 'Teresina, PI', 'Nova Iguaçu, RJ'
]

export function Ticker({ recentCases = [] }: TickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRealData, setIsRealData] = useState(false)

  // Usar dados reais quando disponíveis, senão usar dados simbólicos
  const displayData = recentCases.length > 0 ? recentCases : 
    SYMBOLIC_LOCATIONS.map((location, index) => ({
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
      location,
      age: Math.floor(Math.random() * 40) + 18, // Idade entre 18-58
      circumstances: 'Violência doméstica',
      source: 'Dados simbólicos'
    }))

  useEffect(() => {
    setIsRealData(recentCases.length > 0)
  }, [recentCases])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayData.length)
    }, 4000) // Muda a cada 4 segundos para dar tempo de ler

    return () => clearInterval(interval)
  }, [displayData.length])

  const currentCase = displayData[currentIndex]
  if (!currentCase) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="ticker-section">
      <div className="ticker-label">
        {isRealData ? 'Caso registrado:' : 'Em memória de todas as vítimas:'}
      </div>
      
      <div className="ticker-content" key={currentIndex}>
        <div className="ticker-location">{currentCase.location}</div>
        <div className="ticker-date">{formatDate(currentCase.date)}</div>
        {currentCase.age && (
          <div className="ticker-age">{currentCase.age} anos</div>
        )}
      </div>
      
      <div className="ticker-subtitle">
        {isRealData ? 
          `Fonte: ${currentCase.source}` : 
          'Representando todas as vítimas no Brasil'
        }
      </div>
      
      {!isRealData && (
        <div className="ticker-disclaimer">
          * Dados simbólicos para representar a realidade estatística
        </div>
      )}
    </div>
  )
}
