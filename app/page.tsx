'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { RecipeCard } from '@/components/brewing/recipe-card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { apiFetch } from '@/lib/api'

interface BeanSummary {
  id: number
  name: string
  roastery: string
}

interface Recipe {
  id: number
  title: string
  coffeeBean: string | null
  origin: string | null
  waterTemp: number | null
  coffeeGrams: number | null
  waterGrams: number | null
  likeCount: number
  tags: string[]
  roastLevel: string | null
  imageUrl: string | null
  bean: BeanSummary | null
  dripperId?: number | null
  dripper?: { id: number; name: string; brand: string } | null
}

interface FeedResponse {
  items: Recipe[]
  nextCursor: number | null
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

const FILTER_TABS = [
  { label: '전체', value: '' },
  { label: 'V60', value: 'V60' },
  { label: '에어로프레스', value: '에어로프레스' },
  { label: '칼리타', value: '칼리타' },
  { label: '모카포트', value: '모카포트' },
  { label: '프렌치프레스', value: '프렌치프레스' },
  { label: '클레버', value: '클레버' },
] as const

export default function FeedPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [loadTrigger, setLoadTrigger] = useState(0)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const baseUrl = selectedMethod
        ? `/recipes?method=${encodeURIComponent(selectedMethod)}`
        : '/recipes'
      const url = cursor
        ? `${baseUrl}${selectedMethod ? '&' : '?'}cursor=${cursor}&limit=10`
        : `${baseUrl}${selectedMethod ? '&' : '?'}limit=10`
      const data = await apiFetch<FeedResponse>(url)
      setRecipes(prev => [...prev, ...data.items])
      setCursor(data.nextCursor)
      setHasMore(data.nextCursor !== null)
    } catch (e) {
      console.error(e)
      setHasMore(false) // stop retrying on error
    } finally {
      setLoading(false)
    }
  }, [cursor, hasMore, loading, selectedMethod])

  // Initial load + tab 전환 후 강제 리로드
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadMore() }, [loadTrigger])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '120px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="space-y-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-foreground">CoffeeZip</h1>
          <div className="flex items-center gap-1">
            <button
              className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="검색"
            >
              <Search className="size-4" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 필터 탭 */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1 pt-2">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => {
              setSelectedMethod(tab.value)
              setRecipes([])
              setCursor(null)
              setHasMore(true)
              setLoadTrigger(t => t + 1)
            }}
            className={cn(
              'label-upper shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors',
              selectedMethod === tab.value
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="pt-3 pb-2">
        {/* Hero 카드 */}
        {loading && recipes.length === 0 ? (
          <div className="aspect-[16/9] bg-[hsl(var(--surface-container))] rounded-2xl animate-pulse mb-3" />
        ) : recipes.length > 0 ? (
          <motion.div
            className="mb-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Link href={`/recipes/${recipes[0].id}`}>
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-[hsl(var(--surface-container))]">
                {recipes[0].imageUrl ? (
                  <img
                    src={recipes[0].imageUrl}
                    alt={recipes[0].title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* TODO: dripper 필드 추가 시 dripper별 default image 매핑으로 교체 */
                  <div className="absolute inset-0 flex flex-col justify-end p-5 gap-1">
                    {(recipes[0].coffeeGrams && recipes[0].waterGrams) && (
                      <p className="tracking-display font-bold text-foreground/90 text-3xl">
                        {recipes[0].coffeeGrams}g<span className="text-muted-foreground font-normal mx-2">:</span>{recipes[0].waterGrams}g
                      </p>
                    )}
                    {recipes[0].waterTemp && (
                      <p className="label-upper text-muted-foreground">{recipes[0].waterTemp}°C</p>
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {recipes[0].roastLevel && (
                    <p className="label-upper text-white/70 mb-1">{recipes[0].roastLevel}</p>
                  )}
                  <h2 className="text-white font-bold text-lg tracking-display leading-tight">
                    {recipes[0].title}
                  </h2>
                  {(recipes[0].bean || recipes[0].coffeeBean) && (
                    <p className="text-white/70 text-sm mt-0.5">
                      {recipes[0].bean
                        ? <Link href={`/catalog/beans/${recipes[0].bean.id}`} className="hover:text-white transition-colors" onClick={e => e.stopPropagation()}>{recipes[0].bean.name}{recipes[0].bean.roastery && ` · ${recipes[0].bean.roastery}`}</Link>
                        : <>{recipes[0].coffeeBean}{recipes[0].origin && ` · ${recipes[0].origin}`}</>
                      }
                    </p>
                  )}
                  <p className="text-white/50 text-xs mt-1">♥ {recipes[0].likeCount}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ) : !loading ? (
          <div className="text-center text-muted-foreground py-20 text-sm">
            아직 레시피가 없어요
          </div>
        ) : null}

        {/* 일반 카드 리스트 (첫 번째 제외) */}
        {recipes.length > 1 && (
          <motion.div
            className="space-y-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {recipes.slice(1).map(recipe => (
              <motion.div key={recipe.id} variants={item}>
                <RecipeCard {...recipe} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && recipes.length > 0 && (
          <div className="space-y-3 mt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <RecipeCard.Skeleton key={i} />
            ))}
          </div>
        )}

        {/* 무한 스크롤 sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {!hasMore && recipes.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            모든 레시피를 불러왔어요
          </p>
        )}
      </div>
    </div>
  )
}
