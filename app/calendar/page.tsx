'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarPage() {
  const router = useRouter()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [noteDates, setNoteDates] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    apiFetch<{ dates: string[] }>(`/calendar?year=${year}&month=${month}`)
      .then(data => setNoteDates(new Set(data.dates)))
      .catch(() => {})
  }, [year, month])

  function prevMonth() {
    setDirection(-1)
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    setDirection(1)
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  function mkDate(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function handleDayClick(ds: string) {
    setSelectedDate(ds)
    router.push(`/notes/${ds}`)
  }

  const calendarKey = `${year}-${month}`

  return (
    <div className="py-4 space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="이전 달"
        >
          <ChevronLeft className="size-5" />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          <motion.h1
            key={calendarKey}
            initial={{ opacity: 0, x: direction * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -20 }}
            transition={{ duration: 0.2 }}
            className="text-xl font-bold text-foreground"
          >
            {year}년 {month}월
          </motion.h1>
        </AnimatePresence>

        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="다음 달"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-border bg-card p-4">
        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d, i) => (
            <div
              key={d}
              className={cn(
                'text-center text-xs py-1 font-medium',
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground'
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={calendarKey}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.22 }}
            className="grid grid-cols-7 gap-1"
          >
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const ds = mkDate(day)
              const hasNote = noteDates.has(ds)
              const isToday = ds === todayStr
              const isSelected = selectedDate === ds

              return (
                <motion.button
                  key={ds}
                  onClick={() => handleDayClick(ds)}
                  whileTap={{ scale: 0.88 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-colors relative',
                    isToday && 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/30 ring-offset-1',
                    isSelected && !isToday && 'ring-2 ring-primary scale-105',
                    !isToday && 'hover:bg-muted text-foreground'
                  )}
                >
                  <span className="tabular-nums leading-none">{day}</span>
                  {hasNote && (
                    <span
                      className={cn(
                        'w-1 h-1 rounded-full mt-0.5',
                        isToday ? 'bg-primary-foreground' : 'bg-primary'
                      )}
                    />
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span>노트 기록 있는 날</span>
      </div>
    </div>
  )
}
