'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'

import { useSearchParams } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import { X, Plus, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { BeanSearchField } from '@/components/catalog/BeanSearchField'
import { DripperSearchField } from '@/components/catalog/DripperSearchField'

const inputCls =
  'w-full bg-[hsl(var(--surface-container))] border-0 border-b-2 border-transparent focus:border-[hsl(var(--cta))] rounded-t-xl rounded-b-none px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground'

interface Step {
  stepOrder: number
  label: string
  duration: string
  waterAmount: string
}

interface FormState {
  title: string
  description: string
  grinder: string
  grindSize: string
  coffeeGrams: string
  waterGrams: string
  waterTemp: string
  targetYield: string
  isPublic: boolean
}

const defaultStep = (stepOrder: number): Step => ({
  stepOrder,
  label: '',
  duration: '',
  waterAmount: '',
})

export default function NewRecipePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
    }
  }, [router])
  const [titleError, setTitleError] = useState(false)
  const [selectedBean, setSelectedBean] = useState<{ id: number; name: string; roastery: string } | null>(null)
  const [selectedDripper, setSelectedDripper] = useState<{ id: number; name: string; brand: string } | null>(null)

  useEffect(() => {
    const beanIdStr = searchParams.get('beanId')
    if (beanIdStr) {
      const beanId = Number(beanIdStr)
      if (!isNaN(beanId)) {
        apiFetch<{ id: number; name: string; roastery: string }>(`/beans/${beanId}`)
          .then(bean => setSelectedBean({ id: bean.id, name: bean.name, roastery: bean.roastery }))
          .catch(() => {/* ignore — field just stays empty */})
      }
    }
    const dripperIdParam = searchParams.get('dripperId')
    if (dripperIdParam) {
      apiFetch<{ id: number; name: string; brand: string; type: string; material: string; extractionSpeed: string | null; avgRating: number | null; reviewCount: number }>(`/drippers/${dripperIdParam}`)
        .then(d => setSelectedDripper({ id: d.id, name: d.name, brand: d.brand }))
        .catch(() => {})
    }
  }, []) // intentionally empty — only on mount

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    grinder: '',
    grindSize: '',
    coffeeGrams: '',
    waterGrams: '',
    waterTemp: '',
    targetYield: '',
    isPublic: true,
  })

  const [steps, setSteps] = useState<Step[]>([defaultStep(1)])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  function updateForm(key: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'title') setTitleError(false)
  }

  function updateStep(index: number, key: keyof Step, value: string) {
    setSteps(prev =>
      prev.map((s, i) => (i === index ? { ...s, [key]: value } : s))
    )
  }

  function addStep() {
    setSteps(prev => [...prev, defaultStep(prev.length + 1)])
  }

  function removeStep(index: number) {
    setSteps(prev =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepOrder: i + 1 }))
    )
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  function addTag() {
    const trimmed = tagInput.trim().replace(/,+$/, '')
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setTitleError(true)
      return
    }

    setSubmitting(true)
    try {
      const body = {
        title: form.title.trim(),
        ...(form.description.trim() && { description: form.description.trim() }),
        beanId: selectedBean?.id ?? null,
        dripperId: selectedDripper?.id ?? null,
        ...(form.grinder.trim() && { grinder: form.grinder.trim() }),
        ...(form.grindSize.trim() && { grindSize: form.grindSize.trim() }),
        ...(form.coffeeGrams !== '' && { coffeeGrams: Number(form.coffeeGrams) }),
        ...(form.waterGrams !== '' && { waterGrams: Number(form.waterGrams) }),
        ...(form.waterTemp !== '' && { waterTemp: Number(form.waterTemp) }),
        ...(form.targetYield !== '' && { targetYield: Number(form.targetYield) }),
        isPublic: form.isPublic,
        steps: steps
          .filter(s => s.label.trim() || s.duration !== '')
          .map(s => ({
            stepOrder: s.stepOrder,
            label: s.label.trim(),
            duration: Number(s.duration) || 0,
            ...(s.waterAmount !== '' && { waterAmount: Number(s.waterAmount) }),
          })),
        tags,
      }

      await apiFetch('/me/recipes', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      router.push('/me/recipes')
    } catch {
      alert('레시피 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <PageHeader title="새 레시피" showBack />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">

        {/* 1. 기본 정보 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">기본 정보</p>
          <div className="space-y-1">
            <input
              type="text"
              value={form.title}
              onChange={e => updateForm('title', e.target.value)}
              placeholder="레시피 이름"
              className={inputCls}
            />
            {titleError && (
              <p className="text-xs text-destructive px-1">레시피 이름을 입력해주세요</p>
            )}
          </div>
          <textarea
            value={form.description}
            onChange={e => updateForm('description', e.target.value)}
            placeholder="레시피 설명 (선택)"
            rows={3}
            className={inputCls + ' resize-none'}
          />
        </section>

        {/* 2. 원두 정보 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">원두 정보</p>
          <div>
            <label className="label-upper text-muted-foreground mb-2 block">원두</label>
            <BeanSearchField
              value={selectedBean}
              onChange={setSelectedBean}
              onRegisterNew={() => router.push('/catalog/beans/new')}
            />
          </div>
          <div>
            <label className="label-upper text-muted-foreground mb-2 block">드리퍼</label>
            <DripperSearchField
              value={selectedDripper}
              onChange={setSelectedDripper}
              onRegisterNew={() => router.push('/catalog/drippers/new')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={form.coffeeGrams}
              onChange={e => updateForm('coffeeGrams', e.target.value)}
              placeholder="원두 (g)"
              min={0}
              className={inputCls}
            />
            <input
              type="number"
              value={form.waterGrams}
              onChange={e => updateForm('waterGrams', e.target.value)}
              placeholder="물 (g)"
              min={0}
              className={inputCls}
            />
          </div>
          <input
            type="number"
            value={form.waterTemp}
            onChange={e => updateForm('waterTemp', e.target.value)}
            placeholder="물 온도 (°C)"
            min={0}
            max={100}
            className={inputCls}
          />
        </section>

        {/* 3. 그라인더 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">그라인더</p>
          <input
            type="text"
            value={form.grinder}
            onChange={e => updateForm('grinder', e.target.value)}
            placeholder="그라인더 이름"
            className={inputCls}
          />
          <input
            type="text"
            value={form.grindSize}
            onChange={e => updateForm('grindSize', e.target.value)}
            placeholder="분쇄도"
            className={inputCls}
          />
        </section>

        {/* 4. 브루잉 스텝 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">브루잉 스텝</p>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {step.stepOrder}
                  </span>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-1 rounded-full hover:bg-[hsl(var(--surface-container))] transition-colors"
                      aria-label="스텝 삭제"
                    >
                      <X className="size-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={step.label}
                  onChange={e => updateStep(index, 'label', e.target.value)}
                  placeholder="단계 이름 (예: Bloom)"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={step.duration}
                    onChange={e => updateStep(index, 'duration', e.target.value)}
                    placeholder="시간 (초)"
                    min={0}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    value={step.waterAmount}
                    onChange={e => updateStep(index, 'waterAmount', e.target.value)}
                    placeholder="물 양 (ml)"
                    min={0}
                    className={inputCls}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addStep}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[hsl(var(--surface-container))] text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="size-4" />
            스텝 추가
          </button>
        </section>

        {/* 5. 태그 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">태그</p>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder="태그 입력 후 Enter 또는 쉼표"
            className={inputCls}
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-[hsl(var(--surface-container))] text-foreground/70 text-xs px-2 py-0.5 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-foreground transition-colors"
                    aria-label={`${tag} 태그 삭제`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 6. 공개 설정 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-upper text-muted-foreground mb-1">공개 설정</p>
              <p className="text-sm text-foreground">
                {form.isPublic ? '공개' : '비공개'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {form.isPublic
                  ? '다른 사용자들이 이 레시피를 볼 수 있어요'
                  : '나만 볼 수 있는 레시피예요'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isPublic}
              onClick={() => updateForm('isPublic', !form.isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isPublic
                  ? 'bg-[hsl(var(--cta))]'
                  : 'bg-[hsl(var(--surface-container))]'
              }`}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                  form.isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm px-4 py-3 safe-area-inset-bottom border-t border-border/40">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                저장 중...
              </>
            ) : (
              '레시피 저장'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
