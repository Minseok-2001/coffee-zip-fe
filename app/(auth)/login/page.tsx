'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

function getGoogleOAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID || '',
    redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3000/auth/callback',
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // 이미 로그인한 경우 피드로
    const token = localStorage.getItem('accessToken')
    if (token) router.replace('/')
  }, [router])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-3">
        <p className="label-upper text-muted-foreground tracking-widest">COFFEEZIP</p>
        <h1 className="text-3xl font-bold tracking-display text-foreground text-center leading-tight">
          Your Brewing<br />Journal
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          레시피를 기록하고 공유하세요
        </p>
      </div>

      {/* Bottom area */}
      <div className="px-6 pb-12 space-y-3">
        <button
          onClick={() => { window.location.href = getGoogleOAuthUrl() }}
          className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-foreground text-background text-sm font-medium transition-colors hover:bg-foreground/90"
        >
          {/* Google SVG icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#fff" fillOpacity=".9"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#fff" fillOpacity=".7"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" fillOpacity=".5"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" fillOpacity=".6"/>
          </svg>
          Google로 계속하기
        </button>

        <p className="text-center text-xs text-muted-foreground px-4">
          계속하면{' '}
          <Link href="/terms" className="underline underline-offset-2">이용약관</Link>
          {' '}및{' '}
          <Link href="/privacy" className="underline underline-offset-2">개인정보처리방침</Link>
          에 동의하는 것으로 간주됩니다
        </p>

        <button
          onClick={() => router.push('/')}
          className="w-full text-center text-sm text-muted-foreground py-2 hover:text-foreground transition-colors"
        >
          로그인 없이 둘러보기
        </button>
      </div>
    </div>
  )
}
