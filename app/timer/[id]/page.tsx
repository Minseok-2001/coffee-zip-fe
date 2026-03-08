'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, SkipForward, Coffee } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

interface RecipeStep {
  stepOrder: number
  label: string
  duration: number
  waterAmount: number | null
}

interface Recipe {
  id: number
  title: string
  steps: RecipeStep[]
}

type TimerState = 'idle' | 'running' | 'paused' | 'done'

// SVG circular timer constants
const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function TimerPage() {
  const { id } = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [state, setState] = useState<TimerState>('idle')
  const startedAtRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // GSAP water fill
  const waterFillRef = useRef<SVGRectElement>(null)
  const waveRef = useRef<SVGPathElement>(null)
  const gsapAnimRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    apiFetch<Recipe>(`/recipes/${id}`).then(r => {
      setRecipe(r)
      if (r.steps.length > 0) setRemaining(r.steps[0].duration)
    })
  }, [id])

  // GSAP water animation
  useEffect(() => {
    if (typeof window === 'undefined') return
    import('gsap').then(({ gsap }) => {
      if (!waterFillRef.current || !waveRef.current) return

      // Kill previous
      gsapAnimRef.current?.kill()

      const tl = gsap.timeline()
      gsapAnimRef.current = tl

      if (state === 'running') {
        const currentStep = recipe?.steps[stepIndex]
        if (!currentStep) return

        // Calculate current progress
        const totalDuration = currentStep.duration
        const elapsed = totalDuration - remaining
        const progress = elapsed / totalDuration

        // Animate fill from current to 100% in remaining seconds
        tl.to(waterFillRef.current, {
          attr: { y: `${100 - (progress * 100)}%`, height: `${progress * 100}%` },
          duration: 0,
        })
        tl.to(waterFillRef.current, {
          attr: { y: '0%', height: '100%' },
          duration: remaining,
          ease: 'none',
        })

        // Continuous wave animation
        gsap.to(waveRef.current, {
          attr: {
            d: 'M0,8 Q15,0 30,8 Q45,16 60,8 Q75,0 90,8 Q105,16 120,8 L120,20 L0,20 Z',
          },
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      } else if (state === 'paused') {
        tl.pause()
      } else if (state === 'idle') {
        // Reset water
        gsap.set(waterFillRef.current, { attr: { y: '100%', height: '0%' } })
      }
    })
  }, [state, stepIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNextStep = useCallback(() => {
    if (!recipe) return
    const nextIndex = stepIndex + 1
    if (nextIndex >= recipe.steps.length) {
      setState('done')
      saveTimerLog()
    } else {
      setStepIndex(nextIndex)
      setRemaining(recipe.steps[nextIndex].duration)
      setState('running')
    }
  }, [recipe, stepIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state !== 'running') return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          goNextStep()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [state, stepIndex, goNextStep])

  function start() {
    startedAtRef.current = new Date().toISOString()
    setState('running')
  }

  function togglePause() {
    setState(s => s === 'running' ? 'paused' : 'running')
    if (state === 'running') {
      gsapAnimRef.current?.pause()
    } else {
      gsapAnimRef.current?.resume()
    }
  }

  async function saveTimerLog() {
    try {
      await apiFetch('/timer/log', {
        method: 'POST',
        body: JSON.stringify({
          recipeId: recipe!.id,
          recipeName: recipe!.title,
          startedAt: startedAtRef.current,
          completedAt: new Date().toISOString(),
        }),
      })
    } catch (e) { console.error(e) }
  }

  if (!recipe) {
    return (
      <>
        <PageHeader title="브루잉 타이머" showBack />
        <div className="flex items-center justify-center h-64">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </>
    )
  }

  const currentStep = recipe.steps[stepIndex]
  const totalSteps = recipe.steps.length
  const stepDuration = currentStep?.duration || 1
  const progress = (stepDuration - remaining) / stepDuration
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  // Done screen
  if (state === 'done') {
    const today = new Date().toISOString().slice(0, 10)
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Coffee className="size-12 text-primary" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2 mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground">브루잉 완료!</h2>
          <p className="text-muted-foreground">{recipe.title}</p>
          <p className="text-sm text-muted-foreground">타이머 로그가 오늘의 노트에 저장됐어요</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-xs space-y-3"
        >
          <Button className="w-full" onClick={() => router.push(`/notes/${today}`)}>
            오늘의 노트 보기
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.back()}>
            레시피로 돌아가기
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <PageHeader title={recipe.title} showBack />

      <div className="py-4 space-y-6">
        {/* Step info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground tabular-nums">
            단계 {stepIndex + 1} / {totalSteps}
          </p>
          <AnimatePresence mode="wait">
            <motion.h2
              key={stepIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-semibold text-foreground mt-1"
            >
              {currentStep?.label}
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* Main timer + water animation */}
        <div className="flex items-center justify-center gap-6">
          {/* Circular SVG timer */}
          <div className="relative flex items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
              {/* Track */}
              <circle
                cx="70" cy="70" r={RADIUS}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              {/* Progress */}
              <motion.circle
                cx="70" cy="70" r={RADIUS}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transition={{ duration: 0.5, ease: 'linear' }}
              />
            </svg>
            {/* Center display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-mono font-bold text-foreground tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              {currentStep?.waterAmount && (
                <span className="text-xs text-muted-foreground mt-1">
                  {currentStep.waterAmount}ml
                </span>
              )}
            </div>
          </div>

          {/* GSAP Water cup SVG */}
          <div className="flex flex-col items-center">
            <svg width="60" height="90" viewBox="0 0 60 90">
              {/* Cup outline */}
              <path
                d="M8,5 L4,85 Q4,88 8,88 L52,88 Q56,88 56,85 L52,5 Z"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="2"
              />
              {/* Water clip path */}
              <clipPath id="cupClip">
                <path d="M9,6 L5,84 Q5,87 9,87 L51,87 Q55,87 55,84 L51,6 Z" />
              </clipPath>
              {/* Water fill */}
              <g clipPath="url(#cupClip)">
                <rect
                  ref={waterFillRef}
                  x="0" y="100%" width="60" height="0%"
                  fill="hsl(var(--primary) / 0.4)"
                />
                {/* Wave */}
                <path
                  ref={waveRef}
                  d="M0,8 Q15,4 30,8 Q45,12 60,8 L60,20 L0,20 Z"
                  fill="hsl(var(--primary) / 0.6)"
                  transform="translate(0, -8)"
                />
              </g>
            </svg>
            <span className="text-xs text-muted-foreground mt-1">물 붓기</span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {state === 'idle' && (
            <Button className="w-full gap-2" size="lg" onClick={start}>
              <Play className="size-4 fill-current" />
              시작
            </Button>
          )}

          {(state === 'running' || state === 'paused') && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 gap-2"
                onClick={togglePause}
              >
                {state === 'running' ? (
                  <><Pause className="size-4" />일시정지</>
                ) : (
                  <><Play className="size-4 fill-current" />재개</>
                )}
              </Button>
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={goNextStep}
              >
                <SkipForward className="size-4" />
                다음 단계
              </Button>
            </div>
          )}
        </div>

        {/* Step list */}
        <div className="rounded-2xl border border-border bg-card divide-y divide-border/50 overflow-hidden">
          {recipe.steps.map((step, i) => {
            const status = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'upcoming'
            return (
              <div key={step.stepOrder} className="px-4 relative">
                <motion.div
                  animate={status === 'active' ? { backgroundColor: 'hsl(var(--primary) / 0.06)' } : { backgroundColor: 'transparent' }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                />
                <div className="relative">
                  {/* Active indicator */}
                  {status === 'active' && (
                    <motion.div
                      layoutId="step-active-bar"
                      className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r-full -ml-4"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <div className={cn(
                    'flex items-center gap-3 py-3 text-sm',
                    status === 'done' && 'opacity-40 line-through',
                    status === 'active' && 'font-medium',
                  )}>
                    <span className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      status === 'active' && 'bg-primary text-primary-foreground',
                      status === 'done' && 'bg-foreground text-background',
                      status === 'upcoming' && 'bg-muted text-muted-foreground',
                    )}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-foreground">{step.label}</span>
                    <span className="text-muted-foreground tabular-nums">{step.duration}초</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
