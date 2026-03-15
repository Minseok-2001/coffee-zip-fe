'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
      router.replace('/login')
      return
    }

    fetch(`${API_URL}/auth/google/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Auth failed')
        return res.json()
      })
      .then(data => {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        localStorage.setItem('memberId', String(data.memberId))
        localStorage.setItem('nickname', data.nickname)
        router.replace('/')
      })
      .catch(() => {
        router.replace('/login')
      })
  }, [searchParams, router])

  return (
    <div className="flex flex-col min-h-screen items-center justify-center gap-4">
      <div className="size-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">로그인 중...</p>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
