import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CoffeeZip',
  description: '나만의 브루잉 레시피 커뮤니티',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geist.className} bg-amber-50 min-h-screen`}>
        <header className="sticky top-0 z-10 bg-white border-b border-amber-100 shadow-sm">
          <nav className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-amber-800 font-bold text-lg tracking-tight">
              ☕ CoffeeZip
            </Link>
            <div className="flex gap-4 text-sm text-amber-700">
              <Link href="/calendar" className="hover:text-amber-900">캘린더</Link>
              <Link href="/me/recipes" className="hover:text-amber-900">내 레시피</Link>
            </div>
          </nav>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6 pb-16">
          {children}
        </main>
      </body>
    </html>
  )
}
