'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { TastingBar } from '@/components/catalog/TastingBar'
import { BeanReviewForm } from '@/components/catalog/BeanReviewForm'
import { apiFetch } from '@/lib/api'
import { Star } from 'lucide-react'

interface BeanDetail {
  id: number
  name: string
  roastery: string
  origin: string
  region: string | null
  farm: string | null
  variety: string | null
  processing: string | null
  roastLevel: string
  altitude: number | null
  harvestYear: number | null
  description: string | null
  flavorNotes: string[]
  avgRating: number | null
  reviewCount: number
  recipeCount: number
  avgAcidity: number | null
  avgSweetness: number | null
  avgBody: number | null
  avgAroma: number | null
  createdBy: number
  createdAt: string
}

interface BeanReview {
  id: number
  beanId: number
  memberId: number
  rating: number
  content: string | null
  acidity: number | null
  sweetness: number | null
  body: number | null
  aroma: number | null
  createdAt: string
  updatedAt: string
}

const ROAST_LEVEL_LABELS: Record<string, string> = {
  LIGHT: '라이트',
  MEDIUM_LIGHT: '미디엄 라이트',
  MEDIUM: '미디엄',
  MEDIUM_DARK: '미디엄 다크',
  DARK: '다크',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
        />
      ))}
    </span>
  )
}

export default function BeanDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id as string
  const [bean, setBean] = useState<BeanDetail | null>(null)
  const [reviews, setReviews] = useState<BeanReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [beanData, reviewData] = await Promise.all([
        apiFetch<BeanDetail>(`/beans/${id}`),
        apiFetch<BeanReview[]>(`/beans/${id}/reviews`),
      ])
      setBean(beanData)
      setReviews(reviewData)
    } catch (err) {
      console.error(err)
      setError('데이터를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <>
        <PageHeader title="" showBack />
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  if (!loading && error) {
    return (
      <>
        <PageHeader title="" showBack />
        <div className="max-w-lg mx-auto px-4 py-4">
          <p className="text-sm text-red-400 text-center py-8">{error}</p>
        </div>
      </>
    )
  }

  if (!bean) return null

  const hasTastingData =
    bean.avgAcidity !== null ||
    bean.avgSweetness !== null ||
    bean.avgBody !== null ||
    bean.avgAroma !== null

  const attributes: { label: string; value: string }[] = [
    ...(bean.variety ? [{ label: '품종', value: bean.variety }] : []),
    ...(bean.processing ? [{ label: '가공', value: bean.processing }] : []),
    ...(bean.altitude ? [{ label: '고도', value: `${bean.altitude}m` }] : []),
    ...(bean.harvestYear ? [{ label: '수확', value: `${bean.harvestYear}년` }] : []),
  ]

  return (
    <>
      <PageHeader title={bean.name} showBack />

      <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4">

        {/* Header card */}
        <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5 space-y-2">
          <p className="text-xs text-muted-foreground">
            {bean.origin}
            {bean.region && ` · ${bean.region}`}
            {' · '}
            {ROAST_LEVEL_LABELS[bean.roastLevel] ?? bean.roastLevel}
          </p>
          <h1 className="text-2xl font-bold text-foreground leading-tight">{bean.name}</h1>
          <p className="text-sm text-muted-foreground">
            {bean.roastery}
            <span className="mx-1.5">·</span>
            <span className="opacity-60">등록자 #{bean.createdBy}</span>
          </p>
          {bean.description && (
            <p className="text-sm text-muted-foreground leading-relaxed pt-1">{bean.description}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-foreground tabular-nums">
                {bean.avgRating !== null ? bean.avgRating.toFixed(1) : '—'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">평점</p>
          </div>
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 flex flex-col items-center gap-1">
            <span className="text-lg font-bold text-foreground tabular-nums">{bean.reviewCount}</span>
            <p className="text-[10px] text-muted-foreground">리뷰</p>
          </div>
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 flex flex-col items-center gap-1">
            <span className="text-lg font-bold text-foreground tabular-nums">{bean.recipeCount}</span>
            <p className="text-[10px] text-muted-foreground">레시피</p>
          </div>
        </div>

        {/* Attributes */}
        {attributes.length > 0 && (
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">속성</h2>
            <div className="flex flex-wrap gap-2">
              {attributes.map(attr => (
                <span
                  key={attr.label}
                  className="bg-[hsl(var(--surface-container))] rounded-full px-3 py-1 text-xs text-foreground/80"
                >
                  <span className="text-muted-foreground">{attr.label}</span>
                  {' '}
                  {attr.value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Flavor notes */}
        {bean.flavorNotes.length > 0 && (
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">풍미 노트</h2>
            <div className="flex flex-wrap gap-1.5">
              {bean.flavorNotes.map(note => (
                <span
                  key={note}
                  className="bg-amber-400/15 text-amber-400 rounded-full px-3 py-1 text-xs font-medium"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tasting bars */}
        {hasTastingData && (
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">평균 맛 프로필</h2>
            <div className="space-y-2.5">
              {bean.avgAcidity !== null && (
                <TastingBar label="산미" value={bean.avgAcidity} />
              )}
              {bean.avgSweetness !== null && (
                <TastingBar label="단맛" value={bean.avgSweetness} />
              )}
              {bean.avgBody !== null && (
                <TastingBar label="바디" value={bean.avgBody} />
              )}
              {bean.avgAroma !== null && (
                <TastingBar label="향" value={bean.avgAroma} />
              )}
            </div>
          </div>
        )}

        {/* Review form */}
        <section>
          <p className="label-upper text-muted-foreground mb-3">리뷰 남기기</p>
          <BeanReviewForm
            beanId={Number(id)}
            onSubmitted={() => {
              fetchData()
            }}
          />
        </section>

        {/* Reviews */}
        <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            리뷰 <span className="text-foreground/50 normal-case font-normal ml-1">{reviews.length}개</span>
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-4">아직 리뷰가 없습니다</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground/80">회원 #{review.memberId}</span>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.content && (
                    <p className="text-sm text-foreground leading-relaxed">{review.content}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60">{review.createdAt.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action button */}
        <Link
          href={`/me/recipes/new?beanId=${id}`}
          className="block w-full bg-foreground text-background rounded-2xl py-3.5 text-sm font-semibold text-center transition-opacity hover:opacity-90"
        >
          이 원두로 레시피 쓰기
        </Link>
      </div>
    </>
  )
}
