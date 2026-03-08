'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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

export default function FeedPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  async function loadMore() {
    setLoading(true)
    try {
      const url = cursor ? `/recipes?cursor=${cursor}&limit=10` : '/recipes?limit=10'
      const data = await apiFetch<FeedResponse>(url)
      setRecipes(prev => [...prev, ...data.items])
      setCursor(data.nextCursor)
      setHasMore(data.nextCursor !== null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMore() }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-amber-900">레시피 피드</h1>
      {recipes.map(recipe => (
        <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-1">
              <h2 className="font-semibold text-amber-900">{recipe.title}</h2>
              <span className="text-sm text-amber-500">❤️ {recipe.likeCount}</span>
            </div>
            {recipe.coffeeBean && (
              <p className="text-sm text-amber-700">
                {recipe.coffeeBean}{recipe.origin && ` · ${recipe.origin}`}
              </p>
            )}
            <div className="flex gap-3 text-xs text-amber-600 mt-1">
              {recipe.waterTemp && <span>🌡️ {recipe.waterTemp}°C</span>}
              {recipe.coffeeGrams && recipe.waterGrams && (
                <span>⚖️ {recipe.coffeeGrams}g : {recipe.waterGrams}g</span>
              )}
            </div>
            {recipe.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {recipe.tags.map(tag => (
                  <span key={tag} className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
      ))}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-100 text-amber-800 font-medium hover:bg-amber-200 disabled:opacity-50 transition-colors"
        >
          {loading ? '불러오는 중...' : '더 보기'}
        </button>
      )}
      {!loading && !hasMore && recipes.length === 0 && (
        <p className="text-center text-amber-400 py-12">아직 레시피가 없어요 ☕</p>
      )}
    </div>
  )
}
