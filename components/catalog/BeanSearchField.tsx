'use client'

import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'

interface BeanSummary {
  id: number
  name: string
  roastery: string
  origin: string
  roastLevel: string
  flavorNotes: string[]
  avgRating: number | null
  reviewCount: number
}

interface SelectedBean {
  id: number
  name: string
  roastery: string
}

interface BeanSearchFieldProps {
  value: SelectedBean | null
  onChange: (bean: SelectedBean | null) => void
  onRegisterNew?: () => void
}

export function BeanSearchField({ value, onChange, onRegisterNew }: BeanSearchFieldProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BeanSummary[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Search when query changes (debounced 300ms)
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const data = await apiFetch<BeanSummary[]>(
          `/beans?search=${encodeURIComponent(query)}&size=5`
        )
        setResults(data)
        setIsOpen(true)
      } catch {
        // silently ignore search errors
      } finally {
        setIsLoading(false)
      }
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const handleSelect = (bean: BeanSummary) => {
    onChange({ id: bean.id, name: bean.name, roastery: bean.roastery })
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
  }

  // If a bean is already selected, show it with a clear button
  if (value) {
    return (
      <div className="flex items-center justify-between bg-[hsl(var(--surface-container))] rounded-xl px-3 py-2">
        <div>
          <p className="text-sm font-semibold">{value.name}</p>
          <p className="text-[11px] opacity-50">{value.roastery}</p>
        </div>
        <button
          onClick={handleClear}
          className="text-muted-foreground text-sm ml-2 hover:opacity-80"
          aria-label="선택 해제"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="원두 검색..."
        className="w-full bg-[hsl(var(--surface-container))] text-foreground rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
      />
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-[hsl(var(--surface-container-low))] rounded-xl border border-border overflow-hidden">
          {results.map(bean => (
            <button
              key={bean.id}
              onClick={() => handleSelect(bean)}
              className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--surface-container))] transition-colors"
            >
              <p className="text-sm font-semibold">{bean.name}</p>
              <p className="text-[11px] opacity-50">
                {bean.origin} · {bean.roastLevel} · {bean.roastery}
              </p>
            </button>
          ))}
          {onRegisterNew && (
            <>
              <div className="h-px bg-border mx-3" />
              <button
                onClick={onRegisterNew}
                className="w-full text-left px-3 py-2 text-[11px] opacity-60 hover:opacity-90 transition-opacity"
              >
                ＋ 카탈로그에 새 원두 등록
              </button>
            </>
          )}
        </div>
      )}
      {isLoading && <p className="text-[10px] opacity-40 mt-1">검색 중...</p>}
    </div>
  )
}
