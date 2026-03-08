'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { RecipeCard } from '@/components/brewing/recipe-card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { apiFetch } from '@/lib/api'

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

export default function FeedPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const url = cursor ? `/recipes?cursor=${cursor}&limit=10` : '/recipes?limit=10'
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
  }, [cursor, hasMore, loading])

  // Initial load
  useEffect(() => { loadMore() }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
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

      {/* Feed */}
      <div className="pt-4 pb-2">
        {recipes.length === 0 && !loading ? (
          <div className="text-center text-muted-foreground py-20 text-sm">
            아직 레시피가 없어요
          </div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {recipes.map(recipe => (
              <motion.div key={recipe.id} variants={item}>
                <RecipeCard {...recipe} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3 mt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <RecipeCard.Skeleton key={i} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
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
