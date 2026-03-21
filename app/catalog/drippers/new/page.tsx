'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const TYPES = [
  { value: 'V60', label: 'V60' },
  { value: 'KALITA', label: '칼리타' },
  { value: 'AEROPRESS', label: '에어로프레스' },
  { value: 'ORIGAMI', label: '오리가미' },
  { value: 'CHEMEX', label: '케멕스' },
  { value: 'CLEVER', label: '클레버' },
  { value: 'OTHER', label: '기타' },
]

const MATERIALS = [
  { value: 'PLASTIC', label: '플라스틱' },
  { value: 'CERAMIC', label: '세라믹' },
  { value: 'COPPER', label: '동' },
  { value: 'GLASS', label: '유리' },
  { value: 'STAINLESS', label: '스테인리스' },
  { value: 'OTHER', label: '기타' },
]

const SPEEDS = [
  { value: 'FAST', label: '빠름' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'SLOW', label: '느림' },
]

interface FormState {
  name: string
  brand: string
  type: string
  material: string
  holesCount: string
  extractionSpeed: string
  description: string
}

export default function NewDripperPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    name: '',
    brand: '',
    type: 'V60',
    material: 'PLASTIC',
    holesCount: '',
    extractionSpeed: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.brand.trim()) {
      setError('이름과 브랜드는 필수예요')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiFetch<{ id: number }>('/drippers', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          brand: form.brand.trim(),
          type: form.type,
          material: form.material,
          holesCount: form.holesCount ? parseInt(form.holesCount) : null,
          extractionSpeed: form.extractionSpeed || null,
          description: form.description.trim() || null,
        }),
      })
      router.push(`/catalog/drippers/${res.id}`)
    } catch {
      setError('등록에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full bg-[hsl(var(--surface-container))] text-foreground rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
  const labelClass = "text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block"
  const sectionClass = "bg-[hsl(var(--surface-container-low))] rounded-2xl p-4 space-y-4"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">←</button>
        <h1 className="font-semibold text-sm">새 드리퍼 등록</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-4 mt-2">
        {error && (
          <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-xl px-3 py-2">{error}</p>
        )}

        <div className={sectionClass}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">기본 정보</h2>
          <div>
            <label className={labelClass}>드리퍼 이름 *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. V60 02" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>브랜드 *</label>
            <input value={form.brand} onChange={set('brand')} placeholder="e.g. Hario" className={inputClass} />
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">분류</h2>
          <div>
            <label className={labelClass}>타입</label>
            <select value={form.type} onChange={set('type')} className={inputClass}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>재질</label>
            <select value={form.material} onChange={set('material')} className={inputClass}>
              {MATERIALS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">추출 특성</h2>
          <div>
            <label className={labelClass}>구멍 개수</label>
            <input type="number" min="1" value={form.holesCount} onChange={set('holesCount')} placeholder="e.g. 1" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>추출속도</label>
            <select value={form.extractionSpeed} onChange={set('extractionSpeed')} className={inputClass}>
              <option value="">선택 안함</option>
              {SPEEDS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">설명</h2>
          <textarea
            value={form.description}
            onChange={set('description')}
            placeholder="드리퍼에 대한 설명을 입력해주세요..."
            rows={4}
            className={inputClass + ' resize-none'}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-foreground text-background rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
        >
          {submitting ? '등록 중...' : '드리퍼 등록'}
        </button>
      </form>
    </div>
  )
}
