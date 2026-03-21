'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Thermometer, Scale, Coffee } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BeanSummary {
  id: number
  name: string
  roastery: string
}

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
  imageUrl?: string | null
  roastLevel?: string | null
  bean?: BeanSummary | null
  dripper?: { id: number; name: string; brand: string } | null
}

function RecipeCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] overflow-hidden space-y-0 animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="p-4 space-y-3">
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
  roastLevel,
  imageUrl,
  bean,
  dripper,
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
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <Link href={`/recipes/${id}`}>
        <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] overflow-hidden transition-colors">
          {/* 이미지 영역 */}
          <div className="relative aspect-video bg-[hsl(var(--surface-container))]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              /* 이미지 없을 때 타이포 강조 슬롯
                 TODO: dripper 필드 추가 시 dripper별 default image 매핑으로 교체 */
              <div className="absolute inset-0 flex flex-col justify-center px-5 gap-1">
                {(coffeeGrams && waterGrams) ? (
                  <p className="tracking-display font-bold text-foreground/90" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
                    {coffeeGrams}g<span className="text-muted-foreground font-normal mx-1.5">:</span>{waterGrams}g
                  </p>
                ) : null}
                {waterTemp ? (
                  <p className="label-upper text-muted-foreground">{waterTemp}°C</p>
                ) : null}
                {!coffeeGrams && !waterTemp && (
                  <p className="label-upper text-muted-foreground">Recipe</p>
                )}
              </div>
            )}
            {roastLevel && (
              <span className="label-upper absolute top-3 left-3 bg-foreground/80 text-background text-[10px] px-2 py-0.5 rounded-full">
                {roastLevel}
              </span>
            )}
          </div>
          {/* 텍스트 영역 */}
          <div className="p-4 space-y-3">
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
                      liked ? 'fill-foreground text-foreground' : 'text-muted-foreground'
                    )}
                  />
                </motion.div>
                <span className={cn('tabular-nums', liked ? 'text-foreground' : 'text-muted-foreground')}>
                  {likeCount}
                </span>
              </button>
            </div>
            {(bean || coffeeBean || origin) && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Coffee className="size-3.5 shrink-0" />
                {bean ? (
                  <Link
                    href={`/catalog/beans/${bean.id}`}
                    className="hover:text-foreground transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    {bean.name}
                    {bean.roastery && <span className="ml-1 opacity-70">· {bean.roastery}</span>}
                  </Link>
                ) : (
                  <span>{coffeeBean}{origin && ` · ${origin}`}</span>
                )}
              </div>
            )}
            {dripper && (
              <Link
                href={`/catalog/drippers/${dripper.id}`}
                onClick={e => e.stopPropagation()}
                className="text-[11px] text-sky-400 mt-0.5 block"
              >
                ☕ {dripper.name} · {dripper.brand}
              </Link>
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
                    className="text-xs px-2 py-0 bg-[hsl(var(--surface-container))] text-foreground/70 border-0"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

RecipeCard.Skeleton = RecipeCardSkeleton
