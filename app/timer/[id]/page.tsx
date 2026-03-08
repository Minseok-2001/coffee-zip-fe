'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function TimerPage() {
  const { id } = useParams()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [state, setState] = useState<TimerState>('idle')
  const startedAtRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    apiFetch<Recipe>(`/recipes/${id}`).then(r => {
      setRecipe(r)
      if (r.steps.length > 0) setRemaining(r.steps[0].duration)
    })
  }, [id])

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
  }, [state, stepIndex])

  function goNextStep() {
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
  }

  function start() {
    startedAtRef.current = new Date().toISOString()
    setState('running')
  }

  function togglePause() {
    setState(s => s === 'running' ? 'paused' : 'running')
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

  if (!recipe) return <p className="text-center text-amber-400 py-12">로딩 중...</p>

  const currentStep = recipe.steps[stepIndex]
  const totalSteps = recipe.steps.length

  if (state === 'done') {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-6xl">☕</div>
        <h2 className="text-2xl font-bold text-amber-900">브루잉 완료!</h2>
        <p className="text-amber-600">{recipe.title}</p>
        <p className="text-sm text-amber-400">타이머 로그가 오늘의 노트에 저장됐어요</p>
      </div>
    )
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-amber-500 mb-1">{recipe.title}</p>
        <p className="text-xs text-amber-400">단계 {stepIndex + 1} / {totalSteps}</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-amber-100 text-center">
        {currentStep && (
          <>
            <h2 className="text-xl font-semibold text-amber-800 mb-6">{currentStep.label}</h2>
            {currentStep.waterAmount && (
              <p className="text-amber-500 mb-4">💧 {currentStep.waterAmount}ml</p>
            )}
            <div className="text-7xl font-mono font-bold text-amber-900 mb-8">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </>
        )}

        {state === 'idle' && (
          <button
            onClick={start}
            className="w-full py-4 rounded-2xl bg-amber-600 text-white text-lg font-semibold hover:bg-amber-700 transition-colors"
          >
            시작
          </button>
        )}
        {(state === 'running' || state === 'paused') && (
          <div className="flex gap-3">
            <button
              onClick={togglePause}
              className="flex-1 py-4 rounded-2xl bg-amber-100 text-amber-800 text-lg font-semibold hover:bg-amber-200 transition-colors"
            >
              {state === 'running' ? '일시정지' : '재개'}
            </button>
            <button
              onClick={goNextStep}
              className="flex-1 py-4 rounded-2xl bg-amber-600 text-white text-lg font-semibold hover:bg-amber-700 transition-colors"
            >
              다음 단계
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {recipe.steps.map((step, i) => (
          <div
            key={step.stepOrder}
            className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-colors ${
              i === stepIndex ? 'bg-amber-100 text-amber-900 font-medium' :
              i < stepIndex ? 'text-amber-300 line-through' : 'text-amber-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs flex-shrink-0">
              {step.stepOrder}
            </span>
            <span className="flex-1">{step.label}</span>
            <span>{step.duration}초</span>
          </div>
        ))}
      </div>
    </div>
  )
}
