'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface RecipeStep {
  id: number
  stepOrder: number
  label: string
  duration: number
  waterAmount: number | null
}

interface Comment {
  id: number
  memberId: number
  content: string
  createdAt: string
}

interface Recipe {
  id: number
  title: string
  description: string | null
  coffeeBean: string | null
  origin: string | null
  roastLevel: string | null
  grinder: string | null
  grindSize: string | null
  coffeeGrams: number | null
  waterGrams: number | null
  waterTemp: number | null
  targetYield: number | null
  likeCount: number
  tags: string[]
  steps: RecipeStep[]
}

export default function RecipeDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    apiFetch<Recipe>(`/recipes/${id}`).then(setRecipe)
    apiFetch<Comment[]>(`/recipes/${id}/comments`).then(setComments)
  }, [id])

  async function toggleLike() {
    try {
      const res = await apiFetch<{ liked: boolean; likeCount: number }>(`/recipes/${id}/like`, { method: 'POST' })
      setLiked(res.liked)
      setRecipe(prev => prev ? { ...prev, likeCount: res.likeCount } : prev)
    } catch (e) { console.error(e) }
  }

  async function submitComment() {
    if (!newComment.trim()) return
    try {
      const comment = await apiFetch<Comment>(`/recipes/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment }),
      })
      setComments(prev => [...prev, comment])
      setNewComment('')
    } catch (e) { console.error(e) }
  }

  if (!recipe) return <p className="text-center text-amber-400 py-12">로딩 중...</p>

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-bold text-amber-900">{recipe.title}</h1>
          <button onClick={toggleLike} className="text-2xl">{liked ? '❤️' : '🤍'} {recipe.likeCount}</button>
        </div>
        {recipe.description && <p className="text-amber-700 mt-2 text-sm">{recipe.description}</p>}

        <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-amber-800">
          {recipe.coffeeBean && <div>☕ <strong>원두:</strong> {recipe.coffeeBean}</div>}
          {recipe.origin && <div>🌍 <strong>원산지:</strong> {recipe.origin}</div>}
          {recipe.roastLevel && <div>🔥 <strong>로스팅:</strong> {recipe.roastLevel}</div>}
          {recipe.grinder && <div>⚙️ <strong>그라인더:</strong> {recipe.grinder} {recipe.grindSize}</div>}
          {recipe.waterTemp && <div>🌡️ <strong>물 온도:</strong> {recipe.waterTemp}°C</div>}
          {recipe.coffeeGrams && recipe.waterGrams && (
            <div>⚖️ <strong>비율:</strong> {recipe.coffeeGrams}g : {recipe.waterGrams}g</div>
          )}
          {recipe.targetYield && <div>🥤 <strong>목표 수율:</strong> {recipe.targetYield}ml</div>}
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {recipe.tags.map(tag => (
              <span key={tag} className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {recipe.steps.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
          <h2 className="font-semibold text-amber-900 mb-3">브루잉 단계</h2>
          <div className="space-y-2">
            {recipe.steps.map(step => (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step.stepOrder}
                </span>
                <span className="flex-1 text-amber-800">{step.label}</span>
                <span className="text-amber-500">{step.duration}초</span>
                {step.waterAmount && <span className="text-amber-500">{step.waterAmount}ml</span>}
              </div>
            ))}
          </div>
          <Link href={`/timer/${id}`}>
            <button className="w-full mt-4 py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors">
              ▶ 브루잉 시작
            </button>
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
        <h2 className="font-semibold text-amber-900 mb-3">댓글 {comments.length}</h2>
        <div className="space-y-3 mb-4">
          {comments.map(c => (
            <div key={c.id} className="text-sm text-amber-800 border-b border-amber-50 pb-2">
              {c.content}
              <span className="text-xs text-amber-400 ml-2">{c.createdAt.slice(0, 10)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitComment()}
            placeholder="댓글을 입력하세요"
            className="flex-1 border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={submitComment}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-600 transition-colors"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  )
}
