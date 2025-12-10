import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Contador de Feminicídios - Brasil",
  description: 'Contador em tempo real de mulheres assassinadas no Brasil. A cada dia, 10 mulheres são vítimas de feminicídio. Não podemos aceitar essa realidade.',
  keywords: ['feminicídio', 'violência contra mulher', 'brasil', 'estatísticas', 'protesto'],
  openGraph: {
    title: 'Contador de Feminicídios - Brasil',
    description: 'A cada dia, 10 mulheres são assassinadas no Brasil. Veja o contador em tempo real.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contador de Feminicídios - Brasil',
    description: 'A cada dia, 10 mulheres são assassinadas no Brasil. Não podemos aceitar essa realidade.',
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
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
