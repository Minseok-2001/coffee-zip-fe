'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'

interface BeanReviewFormProps {
  beanId: number
  existingReview?: {
    rating: number
    content: string | null
    acidity: number | null
    sweetness: number | null
    body: number | null
    aroma: number | null
  } | null
  onSubmitted: () => void
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`text-xl ${n <= (hover || value) ? 'text-amber-400' : 'opacity-20'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ScoreRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] opacity-60 w-8">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(value === n ? null : n)}
            className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
              n === value
                ? 'bg-amber-400 text-black'
                : 'bg-[hsl(var(--surface-container))] opacity-60 hover:opacity-100'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export function BeanReviewForm({ beanId, existingReview, onSubmitted }: BeanReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [content, setContent] = useState(existingReview?.content ?? '')
  const [acidity, setAcidity] = useState<number | null>(existingReview?.acidity ?? null)
  const [sweetness, setSweetness] = useState<number | null>(existingReview?.sweetness ?? null)
  const [body, setBody] = useState<number | null>(existingReview?.body ?? null)
  const [aroma, setAroma] = useState<number | null>(existingReview?.aroma ?? null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    try {
      await apiFetch(`/beans/${beanId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, content: content || null, acidity, sweetness, body, aroma }),
      })
      onSubmitted()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-[hsl(var(--surface-container-low))] rounded-2xl p-4 space-y-4">
      <StarRating value={rating} onChange={setRating} />
      <div className="space-y-2">
        <ScoreRow label="산미" value={acidity} onChange={setAcidity} />
        <ScoreRow label="단맛" value={sweetness} onChange={setSweetness} />
        <ScoreRow label="바디" value={body} onChange={setBody} />
        <ScoreRow label="향" value={aroma} onChange={setAroma} />
      </div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="맛 노트를 남겨보세요..."
        rows={3}
        className="w-full bg-[hsl(var(--surface-container))] text-foreground rounded-xl px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full bg-foreground text-background rounded-xl py-2 text-sm font-semibold disabled:opacity-40"
      >
        {submitting ? '저장 중...' : '리뷰 저장'}
      </button>
    </div>
  )
}
