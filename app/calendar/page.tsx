'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function CalendarPage() {
  const router = useRouter()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [noteDates, setNoteDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    apiFetch<{ dates: string[] }>(`/calendar?year=${year}&month=${month}`)
      .then(data => setNoteDates(new Set(data.dates)))
      .catch(() => {})
  }, [year, month])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  function dateStr(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="text-amber-600 text-xl px-2">‹</button>
        <h1 className="text-xl font-bold text-amber-900">{year}년 {month}월</h1>
        <button onClick={nextMonth} className="text-amber-600 text-xl px-2">›</button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
        <div className="grid grid-cols-7 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(d => (
            <div key={d} className="text-center text-xs text-amber-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />
            const ds = dateStr(day)
            const hasNote = noteDates.has(ds)
            const isToday = ds === todayStr
            return (
              <button
                key={ds}
                onClick={() => router.push(`/notes/${ds}`)}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-colors
                  ${isToday ? 'bg-amber-600 text-white font-bold' : 'hover:bg-amber-50 text-amber-800'}`}
              >
                {day}
                {hasNote && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday ? 'bg-white' : 'bg-amber-400'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
