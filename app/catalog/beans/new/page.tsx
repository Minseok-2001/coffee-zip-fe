'use client'

import { useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { apiFetch } from '@/lib/api'
import { X } from 'lucide-react'

const ROAST_LEVELS = [
  { value: 'LIGHT', label: '라이트' },
  { value: 'MEDIUM_LIGHT', label: '미디엄 라이트' },
  { value: 'MEDIUM', label: '미디엄' },
  { value: 'MEDIUM_DARK', label: '미디엄 다크' },
  { value: 'DARK', label: '다크' },
] as const

interface FormState {
  name: string
  roastery: string
  origin: string
  roastLevel: string
  region: string
  variety: string
  processing: string
  flavorNotes: string[]
  description: string
}

export default function NewBeanPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    name: '',
    roastery: '',
    origin: '',
    roastLevel: 'MEDIUM',
    region: '',
    variety: '',
    processing: '',
    flavorNotes: [],
    description: '',
  })
  const [noteInput, setNoteInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleNoteKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const note = noteInput.trim().replace(/,$/, '')
      if (note && !form.flavorNotes.includes(note)) {
        setField('flavorNotes', [...form.flavorNotes, note])
      }
      setNoteInput('')
    }
  }

  function removeNote(note: string) {
    setField('flavorNotes', form.flavorNotes.filter(n => n !== note))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const body = {
        name: form.name,
        roastery: form.roastery,
        origin: form.origin,
        roastLevel: form.roastLevel,
        region: form.region || null,
        variety: form.variety || null,
        processing: form.processing || null,
        flavorNotes: form.flavorNotes,
        description: form.description || null,
      }
      const created = await apiFetch<{ id: number }>('/beans', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      router.push(`/catalog/beans/${created.id}`)
    } catch (err) {
      console.error(err)
      setError('원두 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="원두 등록" showBack />

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Required fields */}
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">기본 정보</h2>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="name">원두 이름 *</label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="예: 예가체프 G1"
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="roastery">로스터리 *</label>
              <input
                id="roastery"
                type="text"
                required
                value={form.roastery}
                onChange={e => setField('roastery', e.target.value)}
                placeholder="예: 블루보틀 커피"
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="origin">원산지 *</label>
              <input
                id="origin"
                type="text"
                required
                value={form.origin}
                onChange={e => setField('origin', e.target.value)}
                placeholder="예: 에티오피아"
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="roastLevel">로스팅 레벨 *</label>
              <select
                id="roastLevel"
                required
                value={form.roastLevel}
                onChange={e => setField('roastLevel', e.target.value)}
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow appearance-none"
              >
                {ROAST_LEVELS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional fields */}
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">상세 정보 (선택)</h2>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="region">지역</label>
              <input
                id="region"
                type="text"
                value={form.region}
                onChange={e => setField('region', e.target.value)}
                placeholder="예: 예르가체페"
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="variety">품종</label>
              <input
                id="variety"
                type="text"
                value={form.variety}
                onChange={e => setField('variety', e.target.value)}
                placeholder="예: 헤이룸"
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="processing">가공 방식</label>
              <input
                id="processing"
                type="text"
                value={form.processing}
                onChange={e => setField('processing', e.target.value)}
                placeholder="예: 워시드, 내추럴"
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Flavor notes */}
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">풍미 노트</h2>

            {form.flavorNotes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.flavorNotes.map(note => (
                  <span
                    key={note}
                    className="flex items-center gap-1 bg-amber-400/15 text-amber-400 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >
                    {note}
                    <button
                      type="button"
                      onClick={() => removeNote(note)}
                      className="hover:text-amber-300 transition-colors"
                      aria-label={`${note} 제거`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              onKeyDown={handleNoteKeyDown}
              placeholder="노트 입력 후 Enter 또는 콤마로 추가"
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50"
            />
            <p className="text-xs text-muted-foreground/60">예: 자스민, 복숭아, 베리류</p>
          </div>

          {/* Description */}
          <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5 space-y-2">
            <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">설명 (선택)</h2>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder="이 원두에 대한 설명을 입력하세요"
              rows={4}
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow placeholder:text-muted-foreground/50 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground text-background rounded-2xl py-3.5 text-sm font-semibold transition-opacity disabled:opacity-50"
          >
            {submitting ? '등록 중...' : '원두 등록'}
          </button>
        </form>
      </div>
    </>
  )
}
