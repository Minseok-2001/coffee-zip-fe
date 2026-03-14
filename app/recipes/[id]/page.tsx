'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Thermometer, Scale, Flame, Settings2,
  Target, MessageSquare, Play, ChevronDown
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { BrewingStep } from '@/components/brewing/brewing-step'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
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
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)

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

  if (!recipe) {
    return (
      <>
        <PageHeader title="" showBack />
        <div className="space-y-4 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={recipe.title}
        showBack
        right={
          <button
            onClick={toggleLike}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-[hsl(var(--surface-container))] transition-colors"
          >
            <motion.div
              animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Heart className={cn('size-4', liked ? 'fill-primary text-primary' : 'text-muted-foreground')} />
            </motion.div>
            <span className={cn('tabular-nums font-medium', liked ? 'text-primary' : 'text-muted-foreground')}>
              {recipe.likeCount}
            </span>
          </button>
        }
      />

      <div className="space-y-4 py-4">
        {/* Cover card */}
        <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{recipe.description}</p>
            )}
          </div>

          {(recipe.coffeeBean || recipe.origin) && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">원두</p>
              <p className="font-medium text-foreground">
                {recipe.coffeeBean}
                {recipe.origin && <span className="text-muted-foreground font-normal"> · {recipe.origin}</span>}
              </p>
            </div>
          )}

          {recipe.coffeeGrams && recipe.waterGrams && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <Scale className="size-4 text-muted-foreground shrink-0" />
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">{recipe.coffeeGrams}g</span>
                <span className="text-muted-foreground text-sm">원두</span>
                <span className="text-muted-foreground mx-1">:</span>
                <span className="text-xl font-bold text-foreground">{recipe.waterGrams}g</span>
                <span className="text-muted-foreground text-sm">물</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {recipe.waterTemp && (
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">물 온도</span>
                <span className="font-medium text-foreground ml-auto">{recipe.waterTemp}°C</span>
              </div>
            )}
            {recipe.roastLevel && (
              <div className="flex items-center gap-2 text-sm">
                <Flame className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">로스팅</span>
                <span className="font-medium text-foreground ml-auto">{recipe.roastLevel}</span>
              </div>
            )}
            {recipe.targetYield && (
              <div className="flex items-center gap-2 text-sm">
                <Target className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">수율</span>
                <span className="font-medium text-foreground ml-auto">{recipe.targetYield}ml</span>
              </div>
            )}
            {recipe.grinder && (
              <div className="flex items-center gap-2 text-sm">
                <Settings2 className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">그라인더</span>
                <span className="font-medium text-foreground ml-auto">{recipe.grinder}</span>
              </div>
            )}
          </div>

          {recipe.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {recipe.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-[hsl(var(--surface-container))] text-foreground/70 border-0">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5">
            <h2 className="font-semibold text-foreground mb-1">브루잉 단계</h2>
            <p className="text-xs text-muted-foreground mb-4">총 {recipe.steps.length}단계</p>
            <div className="relative space-y-2">
              {recipe.steps.map((step, index) => (
                <div key={step.id}>
                  <p className="label-upper text-muted-foreground mb-1">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <BrewingStep
                    stepOrder={step.stepOrder}
                    label={step.label}
                    duration={step.duration}
                    waterAmount={step.waterAmount}
                    status="upcoming"
                  />
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <Link href={`/timer/${id}`}>
              <Button variant="cta" className="w-full gap-2" size="lg">
                <Play className="size-4 fill-current" />
                브루잉 시작
              </Button>
            </Link>
          </div>
        )}

        {/* Comments */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <button
            onClick={() => setCommentOpen(prev => !prev)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">댓글</span>
              <span className="text-sm text-muted-foreground">{comments.length}</span>
            </div>
            <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', commentOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {commentOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className="text-sm">
                      <p className="text-foreground">{c.content}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.createdAt.slice(0, 10)}</p>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex gap-2">
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitComment()}
                      placeholder="댓글을 입력하세요"
                      className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                    />
                    <Button size="sm" onClick={submitComment}>등록</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
