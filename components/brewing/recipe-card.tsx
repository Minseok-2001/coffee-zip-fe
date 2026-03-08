'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Thermometer, Scale, Coffee } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface RecipeCardProps {
  id: number
  title: string
  coffeeBean?: string | null
  origin?: string | null
  waterTemp?: number | null
  coffeeGrams?: number | null
  waterGrams?: number | null
  likeCount: number
  tags: string[]
  initialLiked?: boolean
  onLike?: (id: number) => void
}

function RecipeCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="h-5 bg-muted rounded w-2/3" />
        <div className="h-5 bg-muted rounded w-12" />
      </div>
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-5 bg-muted rounded-full w-16" />
        <div className="h-5 bg-muted rounded-full w-20" />
      </div>
    </div>
  )
}

export function RecipeCard({
  id,
  title,
  coffeeBean,
  origin,
  waterTemp,
  coffeeGrams,
  waterGrams,
  likeCount: initialLikeCount,
  tags,
  initialLiked = false,
  onLike,
}: RecipeCardProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)

  function handleLike(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLiked(prev => !prev)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
    onLike?.(id)
  }

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <Link href={`/recipes/${id}`}>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 transition-colors hover:border-primary/30">
          <div className="flex justify-between items-start gap-3">
            <h2 className="font-semibold text-foreground leading-snug flex-1">{title}</h2>
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-sm shrink-0 mt-0.5"
              aria-label={liked ? '좋아요 취소' : '좋아요'}
            >
              <motion.div
                animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <Heart
                  className={cn(
                    'size-4 transition-colors',
                    liked ? 'fill-primary text-primary' : 'text-muted-foreground'
                  )}
                />
              </motion.div>
              <span className={cn('tabular-nums', liked ? 'text-primary' : 'text-muted-foreground')}>
                {likeCount}
              </span>
            </button>
          </div>

          {(coffeeBean || origin) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Coffee className="size-3.5 shrink-0" />
              <span>{coffeeBean}{origin && ` · ${origin}`}</span>
            </div>
          )}

          {(waterTemp || (coffeeGrams && waterGrams)) && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              {waterTemp && (
                <span className="flex items-center gap-1">
                  <Thermometer className="size-3" />
                  {waterTemp}°C
                </span>
              )}
              {coffeeGrams && waterGrams && (
                <span className="flex items-center gap-1">
                  <Scale className="size-3" />
                  {coffeeGrams}g : {waterGrams}g
                </span>
              )}
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-2 py-0 bg-primary/10 text-primary border-0 hover:bg-primary/15"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

RecipeCard.Skeleton = RecipeCardSkeleton
