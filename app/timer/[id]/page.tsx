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

// SVG layout constants (viewBox 0 0 200 295)
const SVG_W = 200
const SVG_H = 295
const SERVER_X = 48
const SERVER_Y = 122
const SERVER_W = 104
const SERVER_H = 163

export default function TimerPage() {
  const { id } = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [displaySeconds, setDisplaySeconds] = useState(0)

  // Direct DOM refs for 60fps animation (no React re-render)
  const coffeeRectRef = useRef<SVGRectElement>(null)
  const waveGroupRef = useRef<SVGGElement>(null)
  const dripperGlowRef = useRef<SVGEllipseElement>(null)
  const dropsGroupRef = useRef<SVGGElement>(null)

  // Timer state refs
  const startedAtRef = useRef<string | null>(null)
  const rafRef = useRef<number | null>(null)
  const pausedAtRef = useRef<number>(0)
  const virtualStartRef = useRef<number>(0)
  const stepDurationMsRef = useRef<number>(0)
  const stepIndexRef = useRef<number>(0)
  const recipeRef = useRef<Recipe | null>(null)
  const lastSecsRef = useRef<number>(0)
  const timerStateRef = useRef<TimerState>('idle')

  useEffect(() => {
    apiFetch<Recipe>(`/recipes/${id}`).then(r => {
      setRecipe(r)
      recipeRef.current = r
      if (r.steps.length > 0) setDisplaySeconds(r.steps[0].duration)
    })
  }, [id])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // Direct DOM update — called at 60fps from RAF
  const updateDOM = useCallback((p: number) => {
    const clampedP = Math.max(0, Math.min(p, 1))
    // Rising coffee level
    if (coffeeRectRef.current) {
      const h = clampedP * SERVER_H
      const y = SERVER_Y + SERVER_H - h
      coffeeRectRef.current.setAttribute('y', String(y))
      coffeeRectRef.current.setAttribute('height', String(h))
    }
    // Wave surface position
    if (waveGroupRef.current) {
      const coffeeSurface = SERVER_Y + SERVER_H * (1 - clampedP)
      waveGroupRef.current.setAttribute('transform', `translate(${SERVER_X}, ${coffeeSurface - 6})`)
    }
    // Dripper glow intensity
    if (dripperGlowRef.current) {
      dripperGlowRef.current.setAttribute('opacity', clampedP > 0 ? '0.35' : '0')
    }
  }, [])

  const saveTimerLog = useCallback(async () => {
    const r = recipeRef.current
    if (!r) return
    try {
      await apiFetch('/timer/log', {
        method: 'POST',
        body: JSON.stringify({
          recipeId: r.id,
          recipeName: r.title,
          startedAt: startedAtRef.current,
          completedAt: new Date().toISOString(),
        }),
      })
    } catch (e) { console.error(e) }
  }, [])

  const runTick = useCallback((now: number) => {
    const elapsed = now - virtualStartRef.current
    const total = stepDurationMsRef.current
    const p = Math.max(0, Math.min(elapsed / total, 1))

    updateDOM(p)

    const secs = Math.max(0, Math.ceil((total - elapsed) / 1000))
    if (secs !== lastSecsRef.current) {
      lastSecsRef.current = secs
      setDisplaySeconds(secs)
    }

    if (p < 1) {
      rafRef.current = requestAnimationFrame(runTick)
      return
    }

    // Step complete
    const r = recipeRef.current!
    const next = stepIndexRef.current + 1
    if (next >= r.steps.length) {
      setTimerState('done')
      timerStateRef.current = 'done'
      saveTimerLog()
    } else {
      stepIndexRef.current = next
      setStepIndex(next)
      stepDurationMsRef.current = r.steps[next].duration * 1000
      lastSecsRef.current = r.steps[next].duration
      setDisplaySeconds(r.steps[next].duration)
      virtualStartRef.current = now
      updateDOM(0)
      rafRef.current = requestAnimationFrame(runTick)
    }
  }, [updateDOM, saveTimerLog])

  function start() {
    if (!recipe) return
    startedAtRef.current = new Date().toISOString()
    stepIndexRef.current = 0
    stepDurationMsRef.current = recipe.steps[0].duration * 1000
    lastSecsRef.current = recipe.steps[0].duration
    virtualStartRef.current = performance.now()
    updateDOM(0)
    setTimerState('running')
    timerStateRef.current = 'running'
    rafRef.current = requestAnimationFrame(runTick)
  }

  function pause() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    pausedAtRef.current = performance.now()
    setTimerState('paused')
    timerStateRef.current = 'paused'
    if (dropsGroupRef.current) dropsGroupRef.current.style.display = 'none'
  }

  function resume() {
    virtualStartRef.current += performance.now() - pausedAtRef.current
    setTimerState('running')
    timerStateRef.current = 'running'
    if (dropsGroupRef.current) dropsGroupRef.current.style.display = ''
    rafRef.current = requestAnimationFrame(runTick)
  }

  function skipStep() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const r = recipeRef.current!
    const next = stepIndexRef.current + 1
    if (next >= r.steps.length) {
      setTimerState('done')
      saveTimerLog()
    } else {
      stepIndexRef.current = next
      setStepIndex(next)
      stepDurationMsRef.current = r.steps[next].duration * 1000
      lastSecsRef.current = r.steps[next].duration
      setDisplaySeconds(r.steps[next].duration)
      virtualStartRef.current = performance.now()
      updateDOM(0)
      setTimerState('running')
      rafRef.current = requestAnimationFrame(runTick)
    }
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
  const minutes = Math.floor(displaySeconds / 60)
  const seconds = displaySeconds % 60
  const isRunning = timerState === 'running'
  const isActive = timerState === 'running' || timerState === 'paused'

  if (timerState === 'done') {
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

      <div className="py-4 space-y-5">
        {/* Step info */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            단계 {stepIndex + 1} / {totalSteps}
          </p>
          <AnimatePresence mode="wait">
            <motion.h2
              key={stepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="text-lg font-semibold text-foreground"
            >
              {currentStep?.label}
            </motion.h2>
          </AnimatePresence>
          {currentStep?.waterAmount && (
            <p className="text-sm text-primary font-medium">{currentStep.waterAmount}ml</p>
          )}
        </div>

        {/* ── Main animation ── */}
        <div className="flex flex-col items-center">
          {/* 3D perspective container */}
          <div
            className="w-full max-w-[240px]"
            style={{ perspective: '700px', perspectiveOrigin: '50% 10%' }}
          >
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full drop-shadow-xl"
              style={{
                transform: 'rotateX(8deg) rotateY(-4deg)',
                transformStyle: 'preserve-3d',
                filter: isRunning
                  ? 'drop-shadow(0 16px 40px rgba(0,0,0,0.18)) drop-shadow(0 0 32px hsl(38 92% 50% / 0.12))'
                  : 'drop-shadow(0 12px 28px rgba(0,0,0,0.12))',
                transition: 'filter 0.6s ease',
              }}
            >
              <defs>
                {/* Coffee gradient */}
                <linearGradient id="coffeeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(32 80% 42%)" />
                  <stop offset="100%" stopColor="hsl(22 70% 22%)" />
                </linearGradient>
                {/* Glass highlight gradient (left-to-right sheen) */}
                <linearGradient id="glassHighlight" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                  <stop offset="18%" stopColor="rgba(255,255,255,0.04)" />
                  <stop offset="82%" stopColor="rgba(0,0,0,0.04)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.14)" />
                </linearGradient>
                {/* Dripper gradient (top-light) */}
                <linearGradient id="dripperGrad" x1="0.3" y1="0" x2="0.7" y2="1"
                  gradientUnits="objectBoundingBox">
                  <stop offset="0%" stopColor="hsl(30 18% 86%)" />
                  <stop offset="100%" stopColor="hsl(30 12% 70%)" />
                </linearGradient>
                {/* Server clip */}
                <clipPath id="serverClip">
                  <rect x={SERVER_X} y={SERVER_Y} width={SERVER_W} height={SERVER_H} rx="13" />
                </clipPath>
                {/* Dripper clip */}
                <clipPath id="dripperClip">
                  <polygon points="40,8 160,8 122,78 78,78" />
                </clipPath>
                {/* Glow filter */}
                <filter id="amberGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* ── Dripper ── */}
              <g>
                {/* Rim (top bar) */}
                <rect x="38" y="5" width="124" height="9" rx="4.5"
                  fill="url(#dripperGrad)" stroke="hsl(var(--border))" strokeWidth="1.2" />

                {/* Outer cone body */}
                <polygon
                  points="40,14 160,14 122,78 78,78"
                  fill="url(#dripperGrad)"
                  stroke="hsl(var(--border))" strokeWidth="1.5"
                />

                {/* Filter paper (lighter inside) */}
                <polygon
                  points="46,17 154,17 120,75 80,75"
                  fill="rgba(255,255,255,0.55)"
                  clipPath="url(#dripperClip)"
                />

                {/* V60 ridges — characteristic angled lines */}
                <g stroke="rgba(0,0,0,0.12)" strokeWidth="1" clipPath="url(#dripperClip)">
                  <line x1="86" y1="18" x2="83" y2="73" />
                  <line x1="100" y1="17" x2="100" y2="75" />
                  <line x1="114" y1="18" x2="117" y2="73" />
                  <line x1="93" y1="17" x2="91" y2="74" />
                  <line x1="107" y1="17" x2="109" y2="74" />
                </g>

                {/* Cone highlight sheen */}
                <polygon
                  points="40,14 160,14 122,78 78,78"
                  fill="url(#glassHighlight)"
                  clipPath="url(#dripperClip)"
                />

                {/* Dripper glow halo (amber, when running) */}
                <ellipse
                  ref={dripperGlowRef}
                  cx="100" cy="46" rx="62" ry="36"
                  fill="hsl(38 92% 50%)"
                  opacity="0"
                  filter="url(#amberGlow)"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Spout */}
                <rect x="93" y="78" width="14" height="26" rx="5"
                  fill="url(#dripperGrad)" stroke="hsl(var(--border))" strokeWidth="1.2" />
                <rect x="95" y="80" width="5" height="22" rx="2.5"
                  fill="rgba(255,255,255,0.3)" />
              </g>

              {/* ── Animated drops (visible when running) ── */}
              <g ref={dropsGroupRef} style={{ display: isActive ? '' : 'none' }}>
                {[0, 0.42, 0.84].map((delay, i) => (
                  <ellipse
                    key={i}
                    cx={98 + i * 2}
                    cy="105"
                    rx="2.2"
                    ry="3.2"
                    fill={isRunning ? 'hsl(38 92% 60%)' : 'hsl(38 92% 60% / 0.4)'}
                    style={{
                      animation: isRunning
                        ? `drop-fall 1.3s ease-in ${delay}s infinite`
                        : 'none',
                      transformBox: 'fill-box',
                      transformOrigin: 'center',
                      opacity: 0,
                    }}
                  />
                ))}
              </g>

              {/* ── Server / Flask ── */}
              <g>
                {/* Neck */}
                <rect x="82" y="108" width="36" height="18" rx="7"
                  fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
                <rect x="84" y="110" width="10" height="14" rx="4"
                  fill="rgba(255,255,255,0.25)" />

                {/* Server body outline (background) */}
                <rect
                  x={SERVER_X} y={SERVER_Y} width={SERVER_W} height={SERVER_H} rx="13"
                  fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.8"
                />

                {/* Coffee fill — driven by RAF */}
                <g clipPath="url(#serverClip)">
                  <rect
                    ref={coffeeRectRef}
                    x={SERVER_X} y={SERVER_Y + SERVER_H}
                    width={SERVER_W} height="0"
                    fill="url(#coffeeGrad)"
                  />

                  {/* Wave surface */}
                  <g ref={waveGroupRef} transform={`translate(${SERVER_X}, ${SERVER_Y + SERVER_H - 6})`}>
                    <svg
                      width={SERVER_W * 2} height="12"
                      viewBox={`0 0 ${SERVER_W * 2} 12`}
                      overflow="visible"
                      style={{
                        animation: isRunning ? 'wave-scroll 1.9s linear infinite' : 'none',
                      }}
                    >
                      <path
                        d={`M0,6 Q${SERVER_W / 4},0 ${SERVER_W / 2},6 Q${SERVER_W * 3 / 4},12 ${SERVER_W},6 Q${SERVER_W * 5 / 4},0 ${SERVER_W * 3 / 2},6 Q${SERVER_W * 7 / 4},12 ${SERVER_W * 2},6 L${SERVER_W * 2},12 L0,12 Z`}
                        fill="hsl(32 80% 52% / 0.75)"
                      />
                    </svg>
                  </g>
                </g>

                {/* Glass sheen overlay */}
                <rect
                  x={SERVER_X} y={SERVER_Y} width={SERVER_W} height={SERVER_H} rx="13"
                  fill="url(#glassHighlight)"
                />

                {/* Right handle */}
                <path
                  d="M 152,152 Q 178,152 178,178 Q 178,205 152,205"
                  fill="none" stroke="hsl(var(--border))" strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M 152,152 Q 178,152 178,178 Q 178,205 152,205"
                  fill="none" stroke="hsl(var(--card))" strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Server body front border (re-draw on top for crisp edge) */}
                <rect
                  x={SERVER_X} y={SERVER_Y} width={SERVER_W} height={SERVER_H} rx="13"
                  fill="none" stroke="hsl(var(--border))" strokeWidth="1.8"
                />

                {/* Volume markings */}
                {[0.25, 0.5, 0.75].map((mark) => (
                  <g key={mark}>
                    <line
                      x1={SERVER_X + 6} y1={SERVER_Y + SERVER_H * (1 - mark)}
                      x2={SERVER_X + 14} y2={SERVER_Y + SERVER_H * (1 - mark)}
                      stroke="hsl(var(--border))" strokeWidth="1"
                      opacity="0.6"
                    />
                  </g>
                ))}
              </g>
            </svg>
          </div>

          {/* Countdown display below animation */}
          <div className="mt-4 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="tabular-nums font-mono"
              >
                <span
                  className={cn(
                    'text-5xl font-bold tracking-tight',
                    isRunning ? 'text-primary' : 'text-foreground',
                  )}
                  style={{ transition: 'color 0.4s ease' }}
                >
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </motion.div>
            </AnimatePresence>
            <p className="text-xs text-muted-foreground mt-1">
              {timerState === 'idle' ? '시작 버튼을 눌러주세요' :
               timerState === 'paused' ? '일시정지됨' : '브루잉 중...'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3 px-1">
          {timerState === 'idle' && (
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button className="w-full gap-2" size="lg" onClick={start}>
                <Play className="size-4 fill-current" />
                타이머 시작
              </Button>
            </motion.div>
          )}
          {isActive && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 gap-2"
                onClick={timerState === 'running' ? pause : resume}
              >
                {timerState === 'running' ? (
                  <><Pause className="size-4" />일시정지</>
                ) : (
                  <><Play className="size-4 fill-current" />재개</>
                )}
              </Button>
              <Button size="lg" className="flex-1 gap-2" onClick={skipStep}>
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
                  animate={status === 'active'
                    ? { backgroundColor: 'hsl(var(--primary) / 0.06)' }
                    : { backgroundColor: 'transparent' }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                />
                <div className="relative">
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
                    {step.waterAmount && (
                      <span className="text-primary text-xs">{step.waterAmount}ml</span>
                    )}
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
