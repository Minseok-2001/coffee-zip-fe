'use client'

import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'

interface DripperSummary {
  id: number
  name: string
  brand: string
  type: string
  material: string
  extractionSpeed: string | null
  avgRating: number | null
  reviewCount: number
}

interface SelectedDripper {
  id: number
  name: string
  brand: string
}

interface DripperSearchFieldProps {
  value: SelectedDripper | null
  onChange: (dripper: SelectedDripper | null) => void
  onRegisterNew?: () => void
}

export function DripperSearchField({ value, onChange, onRegisterNew }: DripperSearchFieldProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DripperSummary[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
        const data = await apiFetch<DripperSummary[]>(
          `/drippers?search=${encodeURIComponent(query)}&size=5`
        )
        setResults(data)
        setIsOpen(true)
      } catch {
        // silently ignore
      } finally {
        setIsLoading(false)
      }
    }, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  const handleSelect = (d: DripperSummary) => {
    onChange({ id: d.id, name: d.name, brand: d.brand })
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
  }

  if (value) {
    return (
      <div className="flex items-center justify-between bg-[hsl(var(--surface-container))] rounded-xl px-3 py-2">
        <div>
          <p className="text-sm font-semibold">{value.name}</p>
          <p className="text-[11px] opacity-50">{value.brand}</p>
        </div>
        <button onClick={handleClear} className="text-muted-foreground text-sm ml-2 hover:opacity-80" aria-label="선택 해제">×</button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="드리퍼 검색..."
        className="w-full bg-[hsl(var(--surface-container))] text-foreground rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
      />
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-[hsl(var(--surface-container-low))] rounded-xl border border-border overflow-hidden">
          {results.map(d => (
            <button
              key={d.id}
              onClick={() => handleSelect(d)}
              className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--surface-container))] transition-colors"
            >
              <p className="text-sm font-semibold">{d.name}</p>
              <p className="text-[11px] opacity-50">{d.type} · {d.material} · {d.brand}</p>
            </button>
          ))}
          {onRegisterNew && (
            <>
              <div className="h-px bg-border mx-3" />
              <button
                onClick={onRegisterNew}
                className="w-full text-left px-3 py-2 text-[11px] opacity-60 hover:opacity-90 transition-opacity"
              >
                ＋ 카탈로그에 새 드리퍼 등록
              </button>
            </>
          )}
        </div>
      )}
      {isLoading && <p className="text-[10px] opacity-40 mt-1">검색 중...</p>}
    </div>
  )
}
