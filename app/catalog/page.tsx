'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BeanCard } from '@/components/catalog/BeanCard'
import { apiFetch } from '@/lib/api'
import { Plus } from 'lucide-react'

interface BeanSummary {
  id: number
  name: string
  roastery: string
  origin: string
  roastLevel: string
  flavorNotes: string[]
  avgRating: number | null
  reviewCount: number
}

export default function CatalogPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'bean' | 'dripper' | 'grinder'>('bean')
  const [search, setSearch] = useState('')
  const [beans, setBeans] = useState<BeanSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeTab !== 'bean') return
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ size: '20', page: '0' })
        if (search) params.set('search', search)
        const data = await apiFetch<BeanSummary[]>(`/beans?${params}`)
        setBeans(data)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, activeTab])

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold tracking-tight">카탈로그</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 px-4 mb-4">
        {(['bean', 'dripper', 'grinder'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-foreground text-background'
                : 'bg-[hsl(var(--surface-container))] text-foreground opacity-60'
            }`}
          >
            {tab === 'bean' ? '원두' : tab === 'dripper' ? '드리퍼' : '그라인더'}
          </button>
        ))}
      </div>

      {activeTab === 'bean' ? (
        <div className="px-4 space-y-3">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="원두 검색..."
            className="w-full bg-[hsl(var(--surface-container))] text-foreground rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          {/* Bean list */}
          {loading ? (
            <p className="text-sm opacity-40 text-center py-8">로딩 중...</p>
          ) : beans.length === 0 ? (
            <p className="text-sm opacity-40 text-center py-8">검색 결과가 없습니다</p>
          ) : (
            beans.map(bean => (
              <BeanCard
                key={bean.id}
                {...bean}
                onClick={() => router.push(`/catalog/beans/${bean.id}`)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-16 opacity-40">
          <p className="text-sm">준비 중...</p>
        </div>
      )}

      {/* FAB */}
      {activeTab === 'bean' && (
        <button
          onClick={() => router.push('/catalog/beans/new')}
          className="fixed bottom-24 right-4 bg-foreground text-background rounded-full px-4 py-2.5 flex items-center gap-2 text-sm font-semibold shadow-lg"
        >
          <Plus className="size-4" />
          원두 등록
        </button>
      )}
    </div>
  )
}
