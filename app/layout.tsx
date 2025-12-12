import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Contador de Violência Contra a Mulher - Brasil",
  description: 'Contador histórico em tempo real de violência contra mulheres no Brasil. Inclui feminicídios, agressões, assédio e violência doméstica. Mais de 1.700 casos por dia desde 2018.',
  keywords: [
    'violência contra mulher', 'feminicídio', 'violência doméstica', 'assédio sexual', 
    'brasil', 'estatísticas', 'protesto', 'lei maria da penha', 'disque 180',
    'agressão', 'violência psicológica', 'dados históricos'
  ],
  openGraph: {
    title: 'Contador de Violência Contra a Mulher - Brasil',
    description: 'Mais de 1.700 casos de violência contra mulheres são registrados por dia no Brasil. Veja os dados históricos consolidados desde 2018.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contador de Violência Contra a Mulher - Brasil',
    description: 'Dados chocantes: mais de 1.700 casos de violência contra mulheres por dia no Brasil. Incluindo feminicídios, agressões, assédio e violência doméstica.',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#2d1b4e" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Observatório da Violência Contra a Mulher" />
        <meta property="og:image" content="/og-violence-counter.jpg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
