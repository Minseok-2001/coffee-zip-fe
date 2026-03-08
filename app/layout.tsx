import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Providers } from './providers'
import { BottomNav } from '@/components/layout/bottom-nav'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CoffeeZip',
  description: '나만의 브루잉 레시피 커뮤니티',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={geist.className}>
        <Providers>
          <main className="max-w-lg mx-auto px-4 pt-0 pb-20 min-h-screen">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
