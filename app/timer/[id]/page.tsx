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
  roastLevel?: string
  steps: RecipeStep[]
}

type TimerState = 'idle' | 'running' | 'paused' | 'done'

// Server = straight-sided glass beaker (70–130px wide, y=118–278)
const SRV_X = 70
const SRV_W = 60        // 130 - 70
const SRV_TOP = 118
const SRV_BOT = 278
const SRV_FILL = SRV_BOT - SRV_TOP  // 160

export default function TimerPage() {
  const { id } = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [displaySeconds, setDisplaySeconds] = useState(0)
  const [isBloom, setIsBloom] = useState(false)

  const coffeeRectRef = useRef<SVGRectElement>(null)
  const waveGroupRef = useRef<SVGGElement>(null)
  const dripperGlowRef = useRef<SVGPolygonElement>(null)
  const dropsGroupRef = useRef<SVGGElement>(null)

  const startedAtRef = useRef<string | null>(null)
  const rafRef = useRef<number | null>(null)
  const pausedAtRef = useRef<number>(0)
  const virtualStartRef = useRef<number>(0)
  const stepDurMsRef = useRef<number>(0)
  const stepIdxRef = useRef<number>(0)
  const recipeRef = useRef<Recipe | null>(null)
  const lastSecsRef = useRef<number>(0)
  const timerStateRef = useRef<TimerState>('idle')
  const totalWaterRef = useRef<number>(0)
  const cumWaterRef = useRef<number>(0)

  useEffect(() => {
    apiFetch<Recipe>(`/recipes/${id}`).then(r => {
      setRecipe(r)
      recipeRef.current = r
      if (r.steps.length > 0) setDisplaySeconds(r.steps[0].duration)
    })
  }, [id])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const updateDOM = useCallback((p: number) => {
    const cp = Math.max(0, Math.min(p, 1))
    if (coffeeRectRef.current) {
      const h = cp * SRV_FILL
      coffeeRectRef.current.setAttribute('y', String(SRV_BOT - h))
      coffeeRectRef.current.setAttribute('height', String(h))
    }
    if (waveGroupRef.current) {
      waveGroupRef.current.setAttribute('transform',
        `translate(${SRV_X}, ${SRV_BOT - SRV_FILL * cp - 6})`)
    }
    if (dripperGlowRef.current) {
      dripperGlowRef.current.setAttribute('opacity', cp > 0 ? '0.32' : '0')
    }
  }, [])

  const saveLog = useCallback(async () => {
    const r = recipeRef.current; if (!r) return
    try {
      await apiFetch('/timer/log', {
        method: 'POST',
        body: JSON.stringify({
          recipeId: r.id, recipeName: r.title,
          startedAt: startedAtRef.current, completedAt: new Date().toISOString(),
        }),
      })
    } catch (e) { console.error(e) }
  }, [])

  const runTick = useCallback((now: number) => {
    const elapsed = now - virtualStartRef.current
    const total = stepDurMsRef.current
    const p = Math.max(0, Math.min(elapsed / total, 1))
    const stepWater = recipeRef.current?.steps[stepIdxRef.current]?.waterAmount ?? 0
    const tw = totalWaterRef.current
    updateDOM(tw > 0 ? Math.min((cumWaterRef.current + stepWater * p) / tw, 1) : p)

    const secs = Math.max(0, Math.ceil((total - elapsed) / 1000))
    if (secs !== lastSecsRef.current) { lastSecsRef.current = secs; setDisplaySeconds(secs) }

    if (p < 1) { rafRef.current = requestAnimationFrame(runTick); return }

    const r = recipeRef.current!
    cumWaterRef.current += r.steps[stepIdxRef.current].waterAmount ?? 0
    const next = stepIdxRef.current + 1
    if (next >= r.steps.length) {
      setTimerState('done'); timerStateRef.current = 'done'; saveLog()
    } else {
      stepIdxRef.current = next; setStepIndex(next)
      stepDurMsRef.current = r.steps[next].duration * 1000
      lastSecsRef.current = r.steps[next].duration
      setDisplaySeconds(r.steps[next].duration)
      virtualStartRef.current = now
      setIsBloom(false)
      rafRef.current = requestAnimationFrame(runTick)
    }
  }, [updateDOM, saveLog])

  function start() {
    if (!recipe) return
    startedAtRef.current = new Date().toISOString()
    stepIdxRef.current = 0
    stepDurMsRef.current = recipe.steps[0].duration * 1000
    lastSecsRef.current = recipe.steps[0].duration
    totalWaterRef.current = recipe.steps.reduce((s, st) => s + (st.waterAmount ?? 0), 0)
    cumWaterRef.current = 0
    virtualStartRef.current = performance.now()
    updateDOM(0)
    setIsBloom(true)
    setTimerState('running'); timerStateRef.current = 'running'
    rafRef.current = requestAnimationFrame(runTick)
  }

  function pause() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    pausedAtRef.current = performance.now()
    setTimerState('paused'); timerStateRef.current = 'paused'
    if (dropsGroupRef.current) dropsGroupRef.current.style.display = 'none'
  }

  function resume() {
    virtualStartRef.current += performance.now() - pausedAtRef.current
    setTimerState('running'); timerStateRef.current = 'running'
    if (dropsGroupRef.current) dropsGroupRef.current.style.display = ''
    rafRef.current = requestAnimationFrame(runTick)
  }

  function skipStep() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const r = recipeRef.current!
    cumWaterRef.current += r.steps[stepIdxRef.current].waterAmount ?? 0
    const next = stepIdxRef.current + 1
    if (next >= r.steps.length) { setTimerState('done'); saveLog(); return }
    stepIdxRef.current = next; setStepIndex(next)
    stepDurMsRef.current = r.steps[next].duration * 1000
    lastSecsRef.current = r.steps[next].duration
    setDisplaySeconds(r.steps[next].duration)
    virtualStartRef.current = performance.now()
    setIsBloom(false)
    setTimerState('running')
    rafRef.current = requestAnimationFrame(runTick)
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
  const minutes = Math.floor(displaySeconds / 60)
  const seconds = displaySeconds % 60
  const isRunning = timerState === 'running'
  const isActive = timerState === 'running' || timerState === 'paused'

  // Bloom scale based on roast level
  const roast = (recipe.roastLevel ?? '').toLowerCase()
  const bloomScale = roast.includes('dark') ? 1.5 : roast.includes('medium') ? 1.1 : 0.9

  if (timerState === 'done') {
    const today = new Date().toISOString().slice(0, 10)
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }} className="mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Coffee className="size-12 text-primary" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }} className="space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-foreground">브루잉 완료!</h2>
          <p className="text-muted-foreground">{recipe.title}</p>
          <p className="text-sm text-muted-foreground">타이머 로그가 오늘의 노트에 저장됐어요</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }} className="w-full max-w-xs space-y-3">
          <Button className="w-full" onClick={() => router.push(`/notes/${today}`)}>오늘의 노트 보기</Button>
          <Button variant="outline" className="w-full" onClick={() => router.back()}>레시피로 돌아가기</Button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <PageHeader title={recipe.title} showBack />
      <div className="py-4 space-y-5">

        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            단계 {stepIndex + 1} / {recipe.steps.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.h2 key={stepIndex} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
              className="text-lg font-semibold text-foreground">
              {currentStep?.label}
            </motion.h2>
          </AnimatePresence>
          {currentStep?.waterAmount && (
            <p className="text-sm text-primary font-medium">{currentStep.waterAmount}ml</p>
          )}
        </div>

        {/* ── Illustration ── */}
        <div className="flex justify-center">
          <div className="w-full max-w-[200px]"
            style={{ perspective: '700px', perspectiveOrigin: '50% -10%' }}
          >
            {/*
              Fixed "얼짱" angle: slightly above + rotated to show 3/4 view.
              rotateX = looking down, rotateY = turned to show right side depth.
            */}
            <svg viewBox="0 0 200 295" className="w-full"
              style={{
                transform: 'rotateX(22deg) rotateY(-28deg)',
                transformStyle: 'preserve-3d',
                filter: isRunning
                  ? 'drop-shadow(0 12px 32px rgba(0,0,0,0.35)) drop-shadow(0 0 20px hsl(38 92% 50% / 0.25))'
                  : 'drop-shadow(0 8px 22px rgba(0,0,0,0.22))',
                transition: 'filter 0.5s ease',
              }}
            >
              <defs>
                <linearGradient id="coffeeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(32 78% 40%)" />
                  <stop offset="100%" stopColor="hsl(22 68% 20%)" />
                </linearGradient>

                {/* Dripper cone: left-bright / right-dark side lighting */}
                <linearGradient id="dripGrad" x1="0" y1="0" x2="1" y2="0"
                  gradientUnits="objectBoundingBox">
                  <stop offset="0%"   stopColor="hsl(37 42% 91%)" />
                  <stop offset="30%"  stopColor="hsl(34 28% 80%)" />
                  <stop offset="70%"  stopColor="hsl(30 18% 67%)" />
                  <stop offset="100%" stopColor="hsl(23 11% 50%)" />
                </linearGradient>

                <radialGradient id="rimGrad" cx="38%" cy="28%" r="72%">
                  <stop offset="0%"   stopColor="hsl(38 44% 94%)" />
                  <stop offset="100%" stopColor="hsl(25 13% 58%)" />
                </radialGradient>

                {/* Glass: near-transparent, cool-toned */}
                <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="rgba(210,228,245,0.18)" />
                  <stop offset="16%"  stopColor="rgba(210,228,245,0.04)" />
                  <stop offset="84%"  stopColor="rgba(15,20,35,0.04)" />
                  <stop offset="100%" stopColor="rgba(15,20,35,0.22)" />
                </linearGradient>

                <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="7" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>

                <clipPath id="coneClip">
                  <polygon points="40,14 160,14 120,78 80,78" />
                </clipPath>

                {/* Server clip = straight-sided rect + rounded bottom */}
                <clipPath id="srvClip">
                  <path d="M70,118 L70,262 Q70,278 86,278 L114,278 Q130,278 130,262 L130,118 Z" />
                </clipPath>
              </defs>

              {/* ═══════ V60 DRIPPER ═══════ */}
              <g>
                {/* Cone body — side-lit */}
                <polygon points="40,14 160,14 120,78 80,78"
                  fill="url(#dripGrad)" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />

                {/* Filter paper (lighter inner area = depth) */}
                <polygon points="48,19 152,19 116,75 84,75"
                  fill="hsl(42 28% 91%)" clipPath="url(#coneClip)" />

                {/* Spiral ridges */}
                <g stroke="rgba(0,0,0,0.09)" strokeWidth="1.1" clipPath="url(#coneClip)">
                  {[
                    [85, 82], [93, 91], [100, 100], [107, 109], [115, 118]
                  ].map(([x1, x2], i) => (
                    <line key={i} x1={x1} y1="20" x2={x2} y2="74" />
                  ))}
                </g>

                {/* Left-edge highlight */}
                <polygon points="40,14 56,14 53,78 80,78"
                  fill="rgba(255,255,255,0.18)" clipPath="url(#coneClip)" />

                {/* ── 3D RIM: outer ring + inner opening showing depth ── */}
                <ellipse cx="100" cy="14" rx="62" ry="10"
                  fill="url(#rimGrad)" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
                <ellipse cx="100" cy="14" rx="46" ry="6.5"
                  fill="hsl(26 10% 38%)" />
                <ellipse cx="100" cy="14" rx="38" ry="5"
                  fill="hsl(42 26% 83%)" />
                <path d="M54,14 A46,6.5 0 0 1 146,14" fill="rgba(255,255,255,0.26)" />

                {/* Top brim bar */}
                <rect x="38" y="5" width="124" height="10" rx="5"
                  fill="url(#dripGrad)" stroke="rgba(0,0,0,0.13)" strokeWidth="1.2" />

                {/* CONE-SHAPED glow (matches dripper perfectly) */}
                <polygon ref={dripperGlowRef}
                  points="40,14 160,14 120,78 80,78"
                  fill="hsl(38 92% 54%)" opacity="0"
                  filter="url(#glow)" style={{ pointerEvents: 'none' }} />

                {/* ── BLOOM EFFECT (step 1 only) ──
                    CO2 causes coffee grounds to swell and bubble. */}
                {isBloom && isRunning && (
                  <g clipPath="url(#coneClip)">
                    {/* Swelling coffee bed dome */}
                    <ellipse cx="100" cy={72 - bloomScale * 4} rx={16 * bloomScale} ry={5 * bloomScale}
                      fill="rgba(140,100,45,0.40)"
                      style={{
                        animation: 'bloom-dome 2.2s ease-in-out infinite',
                        transformBox: 'fill-box', transformOrigin: 'center',
                      }}
                    />
                    {/* Rising CO2 bubbles */}
                    {[84, 95, 100, 106, 116].map((bx, i) => (
                      <circle key={i} cx={bx} cy={70} r={1.4 * bloomScale}
                        fill="rgba(190,155,80,0.60)"
                        style={{
                          animation: `bloom-rise ${1.6 + i * 0.2}s ease-out ${i * 0.32}s infinite`,
                          transformBox: 'fill-box', transformOrigin: 'center bottom',
                        }}
                      />
                    ))}
                  </g>
                )}

                {/* Spout: ends y=100, 8px gap before server opening y=108 */}
                <rect x="93" y="78" width="14" height="22" rx="5"
                  fill="url(#dripGrad)" stroke="rgba(0,0,0,0.13)" strokeWidth="1.2" />
                <rect x="95" y="80" width="4" height="18" rx="2"
                  fill="rgba(255,255,255,0.24)" />
              </g>

              {/* ═══════ SERVER (rendered together — drops inside) ═══════ */}
              <g>
                {/* ── Opening rim (y=108): visible 3D cylinder top ──
                    Outer ellipse = glass rim
                    Inner ellipse = depth shadow of opening
                    Shows the server is a cylinder, not a flat shape */}
                <ellipse cx="100" cy="108" rx="30" ry="9"
                  fill="rgba(200,218,235,0.15)" stroke="rgba(155,175,200,0.55)" strokeWidth="1.8" />
                <ellipse cx="100" cy="108" rx="22" ry="6"
                  fill="rgba(8,10,18,0.50)" />
                <path d="M78,108 A22,6 0 0 1 122,108" fill="rgba(255,255,255,0.22)" />

                {/* ── DROPS ──
                    Inside server z-order but unclipped.
                    At cy=106: visible in 8px gap (y=100-108) + through transparent glass body.
                    Falls from y=98 (near spout tip) to y=124 (inside server). */}
                <g ref={dropsGroupRef} style={{ display: isActive ? '' : 'none' }}>
                  {[0, 0.43, 0.87].map((delay, i) => (
                    <ellipse key={i}
                      cx={98 + i * 2} cy="106"
                      rx="2.2" ry="3.5"
                      fill={isRunning ? 'hsl(38 92% 65%)' : 'hsl(38 92% 65% / 0.4)'}
                      style={{
                        animation: isRunning ? `drop-fall 1.3s ease-in ${delay}s infinite` : 'none',
                        transformBox: 'fill-box', transformOrigin: 'center',
                        opacity: 0,
                      }}
                    />
                  ))}
                </g>

                {/* ── Glass body: straight-sided beaker ──
                    Path: rect with slightly rounded bottom corners only.
                    NO bottle-neck taper — top is same width as body. */}
                <path
                  d="M70,118 L70,262 Q70,278 86,278 L114,278 Q130,278 130,262 L130,118 Z"
                  fill="rgba(200,218,235,0.06)" stroke="rgba(155,175,200,0.50)" strokeWidth="2"
                />

                {/* Coffee fill — clipped */}
                <g clipPath="url(#srvClip)">
                  <rect ref={coffeeRectRef}
                    x={SRV_X} y={SRV_BOT} width={SRV_W} height="0"
                    fill="url(#coffeeGrad)"
                  />
                  <g ref={waveGroupRef} transform={`translate(${SRV_X}, ${SRV_BOT - 6})`}>
                    <svg width={SRV_W * 2} height="12"
                      viewBox={`0 0 ${SRV_W * 2} 12`} overflow="visible"
                      style={{ animation: isRunning ? 'wave-scroll 1.9s linear infinite' : 'none' }}
                    >
                      <path
                        d={`M0,6 Q${SRV_W/4},0 ${SRV_W/2},6 Q${SRV_W*3/4},12 ${SRV_W},6 Q${SRV_W*5/4},0 ${SRV_W*3/2},6 Q${SRV_W*7/4},12 ${SRV_W*2},6 L${SRV_W*2},12 L0,12 Z`}
                        fill="hsl(30 78% 48% / 0.82)"
                      />
                    </svg>
                  </g>
                </g>

                {/* Glass sheen overlay */}
                <g clipPath="url(#srvClip)">
                  <rect x={SRV_X} y="118" width={SRV_W} height={SRV_FILL} fill="url(#glassGrad)" />
                </g>

                {/* Left glass edge — bright (key glass cue) */}
                <line x1="70" y1="118" x2="70" y2="260"
                  stroke="rgba(255,255,255,0.52)" strokeWidth="2.5" />
                <line x1="73" y1="118" x2="73" y2="258"
                  stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" />

                {/* Right glass edge — shadow */}
                <line x1="130" y1="118" x2="130" y2="260"
                  stroke="rgba(0,0,0,0.28)" strokeWidth="2" />

                {/* Bottom edge */}
                <path d="M70,262 Q70,278 86,278 L114,278 Q130,278 130,262"
                  fill="none" stroke="rgba(155,175,200,0.40)" strokeWidth="1.8" />

                {/* Handle — D-shape, right side */}
                <path d="M130,155 C162,155 165,198 130,198"
                  fill="none" stroke="rgba(155,175,200,0.65)" strokeWidth="14" strokeLinecap="round" />
                <path d="M130,155 C162,155 165,198 130,198"
                  fill="none" stroke="rgba(200,218,235,0.15)" strokeWidth="8" strokeLinecap="round" />
                <path d="M130,155 C162,155 165,198 130,198"
                  fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="2.5" strokeLinecap="round" />

                {/* Body border top (clean line where body starts) */}
                <line x1="70" y1="118" x2="130" y2="118"
                  stroke="rgba(155,175,200,0.45)" strokeWidth="1.5" />

                {/* Volume markings */}
                {[0.25, 0.5, 0.75].map(m => (
                  <g key={m}>
                    <line
                      x1={SRV_X + 4} y1={SRV_BOT - SRV_FILL * m}
                      x2={SRV_X + 13} y2={SRV_BOT - SRV_FILL * m}
                      stroke="rgba(155,175,200,0.45)" strokeWidth="1"
                    />
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* Phase 진행 표시 */}
        <div className="text-center">
          <p className="label-upper text-muted-foreground">
            PHASE {String(stepIndex + 1).padStart(2, '0')} / {String(recipe.steps.length).padStart(2, '0')}
          </p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {recipe.steps[stepIndex]?.label}
          </p>
        </div>

        {/* Countdown */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.div key={stepIndex}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.2 }}
              className="tabular-nums font-mono"
            >
              <span
                className={cn('text-5xl font-bold tracking-tight',
                  isRunning ? 'text-primary' : 'text-foreground')}
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

        {/* Controls */}
        <div className="space-y-3 px-1">
          {timerState === 'idle' && (
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button className="w-full gap-2" size="lg" onClick={start}>
                <Play className="size-4 fill-current" /> 타이머 시작
              </Button>
            </motion.div>
          )}
          {isActive && (
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1 gap-2"
                onClick={timerState === 'running' ? pause : resume}>
                {timerState === 'running'
                  ? <><Pause className="size-4" />일시정지</>
                  : <><Play className="size-4 fill-current" />재개</>}
              </Button>
              <Button size="lg" className="flex-1 gap-2" onClick={skipStep}>
                <SkipForward className="size-4" /> 다음 단계
              </Button>
            </div>
          )}
        </div>

        {/* Step list */}
        <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] overflow-hidden divide-y divide-border/20">
          {recipe.steps.map((step, i) => {
            const status = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'upcoming'
            return (
              <div key={step.stepOrder} className="px-4 relative">
                <motion.div
                  animate={status === 'active'
                    ? { backgroundColor: 'hsl(10 5% 93%)' }
                    : { backgroundColor: 'transparent' }}
                  transition={{ duration: 0.3 }} className="absolute inset-0"
                />
                <div className="relative">
                  {status === 'active' && (
                    <motion.div layoutId="step-active-bar"
                      className="absolute left-0 top-2 bottom-2 w-0.5 bg-[hsl(var(--cta))] rounded-r-full -ml-4"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                  )}
                  <div className={cn('flex items-center gap-3 py-3 text-sm',
                    status === 'done' && 'opacity-40 line-through',
                    status === 'active' && 'font-medium')}>
                    <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      status === 'active' && 'bg-primary text-primary-foreground',
                      status === 'done' && 'bg-foreground text-background',
                      status === 'upcoming' && 'bg-muted text-muted-foreground')}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-foreground">{step.label}</span>
                    {step.waterAmount && <span className="text-[hsl(var(--cta))] text-xs">{step.waterAmount}ml</span>}
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
