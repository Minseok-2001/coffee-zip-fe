'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Coffee } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { RecipeCard } from '@/components/brewing/recipe-card'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

interface Recipe {
  id: number
  title: string
  coffeeBean: string | null
  origin: string | null
  roastLevel: string | null
  waterTemp: number | null
  coffeeGrams: number | null
  waterGrams: number | null
  imageUrl: string | null
  likeCount: number
  tags: string[]
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

export default function MyRecipesPage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Recipe[]>('/me/recipes')
      setRecipes(data)
    } catch {
      setRecipes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <>
      <PageHeader
        title="내 레시피"
        right={
          <Button
            size="sm"
            onClick={() => router.push('/me/recipes/new')}
            className="gap-1.5 h-8 px-3"
          >
            <Plus className="size-3.5" />
            새 레시피
          </Button>
        }
      />

      <div className="py-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <RecipeCard.Skeleton key={i} />
          ))
        ) : recipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-24 gap-5"
          >
            <div className="size-16 rounded-2xl bg-[hsl(var(--surface-container))] flex items-center justify-center">
              <Coffee className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">아직 레시피가 없어요</p>
              <p className="text-sm text-muted-foreground mt-1">나만의 브루잉 레시피를 기록해보세요</p>
            </div>
            <Button variant="cta" onClick={() => router.push('/me/recipes/new')} className="gap-2">
              <Plus className="size-4" />
              첫 레시피 만들기
            </Button>
          </motion.div>
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
      </div>
    </>
  )
}
