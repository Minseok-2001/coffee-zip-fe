'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { TastingBar } from '@/components/catalog/TastingBar'
import { DripperReviewForm } from '@/components/catalog/DripperReviewForm'

const TYPE_LABELS: Record<string, string> = {
  V60: 'V60', KALITA: '칼리타', AEROPRESS: '에어로프레스',
  ORIGAMI: '오리가미', CHEMEX: '케멕스', CLEVER: '클레버', OTHER: '기타',
}
const MATERIAL_LABELS: Record<string, string> = {
  PLASTIC: '플라스틱', CERAMIC: '세라믹', COPPER: '동',
  GLASS: '유리', STAINLESS: '스테인리스', OTHER: '기타',
}
const SPEED_LABELS: Record<string, string> = {
  FAST: '빠름', MEDIUM: '보통', SLOW: '느림',
}

interface DripperDetail {
  id: number
  name: string
  brand: string
  type: string
  material: string
  holesCount: number | null
  extractionSpeed: string | null
  description: string | null
  avgRating: number | null
  reviewCount: number
  recipeCount: number
  avgExtractionRate: number | null
  avgCleanability: number | null
  avgDurability: number | null
  avgHeatRetention: number | null
  createdBy: number
  createdAt: string
}

interface DripperReview {
  id: number
  dripperId: number
  memberId: number
  rating: number
  content: string | null
  extractionRate: number | null
  cleanability: number | null
  durability: number | null
  heatRetention: number | null
  createdAt: string
  updatedAt: string
}

export default function DripperDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()

  const [dripper, setDripper] = useState<DripperDetail | null>(null)
  const [reviews, setReviews] = useState<DripperReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [detail, reviewList] = await Promise.all([
        apiFetch<DripperDetail>(`/drippers/${id}`),
        apiFetch<DripperReview[]>(`/drippers/${id}/reviews`),
      ])
      setDripper(detail)
      setReviews(reviewList)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded-2xl" />
      </div>
    )
  }

  if (error || !dripper) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">드리퍼를 불러올 수 없어요</p>
      </div>
    )
  }

  const attributes = [
    { label: '타입', value: TYPE_LABELS[dripper.type] ?? dripper.type },
    { label: '재질', value: MATERIAL_LABELS[dripper.material] ?? dripper.material },
    ...(dripper.holesCount != null ? [{ label: '구멍 개수', value: `${dripper.holesCount}개` }] : []),
    ...(dripper.extractionSpeed ? [{ label: '추출속도', value: SPEED_LABELS[dripper.extractionSpeed] ?? dripper.extractionSpeed }] : []),
  ]

  const tastingBars = [
    { label: '추출속도', value: dripper.avgExtractionRate },
    { label: '청소용이', value: dripper.avgCleanability },
    { label: '내구성', value: dripper.avgDurability },
    { label: '열보존', value: dripper.avgHeatRetention },
  ].filter(b => b.value != null) as { label: string; value: number }[]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">←</button>
        <h1 className="font-semibold text-sm truncate">{dripper.name}</h1>
      </header>

      <div className="px-4 pb-8 space-y-4 mt-2">
        <div className="bg-[hsl(var(--surface-container-low))] rounded-2xl p-4">
          <p className="font-bold text-lg">{dripper.name}</p>
          <p className="text-sm opacity-50 mt-0.5">{dripper.brand}</p>
          {dripper.description && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{dripper.description}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '평점', value: dripper.avgRating != null ? `★ ${dripper.avgRating.toFixed(1)}` : '-' },
            { label: '리뷰', value: `${dripper.reviewCount}개` },
            { label: '레시피', value: `${dripper.recipeCount}개` },
          ].map(stat => (
            <div key={stat.label} className="bg-[hsl(var(--surface-container-low))] rounded-2xl p-3 text-center">
              <p className="text-base font-bold">{stat.value}</p>
              <p className="text-[10px] opacity-50 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-[hsl(var(--surface-container-low))] rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">속성</h2>
          <div className="flex flex-wrap gap-2">
            {attributes.map(attr => (
              <span key={attr.label} className="bg-[hsl(var(--surface-container))] rounded-full px-3 py-1 text-xs text-foreground/80">
                <span className="text-muted-foreground">{attr.label}</span> {attr.value}
              </span>
            ))}
          </div>
        </div>

        {tastingBars.length > 0 && (
          <div className="bg-[hsl(var(--surface-container-low))] rounded-2xl p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">추출 특성 (평균)</h2>
            <div className="space-y-2">
              {tastingBars.map(b => (
                <TastingBar key={b.label} label={b.label} value={b.value} />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => router.push(`/me/recipes/new?dripperId=${dripper.id}`)}
          className="w-full bg-foreground text-background rounded-xl py-3 text-sm font-semibold"
        >
          이 드리퍼로 레시피 쓰기
        </button>

        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">리뷰 작성</h2>
          <DripperReviewForm
            dripperId={dripper.id}
            onSubmitted={load}
          />
        </div>

        {reviews.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">리뷰 {reviews.length}개</h2>
            <div className="space-y-2">
              {reviews.map(r => (
                <div key={r.id} className="bg-[hsl(var(--surface-container-low))] rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 text-sm">{'★'.repeat(r.rating)}</span>
                    <span className="text-[10px] opacity-40">{r.createdAt.slice(0, 10)}</span>
                  </div>
                  {r.content && <p className="text-sm text-foreground/80">{r.content}</p>}
                  {(r.extractionRate || r.cleanability || r.durability || r.heatRetention) && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {r.extractionRate && <span className="text-[10px] opacity-60">추출속도 {r.extractionRate}</span>}
                      {r.cleanability && <span className="text-[10px] opacity-60">청소 {r.cleanability}</span>}
                      {r.durability && <span className="text-[10px] opacity-60">내구성 {r.durability}</span>}
                      {r.heatRetention && <span className="text-[10px] opacity-60">열보존 {r.heatRetention}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
