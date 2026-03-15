'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, PenLine, BarChart2, Coffee, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

interface DaySummary {
  name: string
  method: string
  temp: string
  duration: string
}

function formatKorDate(ds: string) {
  const [y, m, d] = ds.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return `${y}년 ${m}월 ${d}일 ${dayNames[date.getDay()]}요일`
}

export default function CalendarPage() {
  const router = useRouter()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [noteDates, setNoteDates] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [direction, setDirection] = useState(0)
  const [todayBrew, setTodayBrew] = useState<DaySummary | null>(null)
  const [brewCount, setBrewCount] = useState(0)

  // Bottom sheet state
  const [sheetDate, setSheetDate] = useState<string | null>(null)
  const [sheetData, setSheetData] = useState<DaySummary | null>(null)
  const [sheetLoading, setSheetLoading] = useState(false)

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  useEffect(() => {
    apiFetch<{ dates: string[] }>(`/calendar?year=${year}&month=${month}`)
      .then(data => {
        setNoteDates(new Set(data.dates))
        setBrewCount(data.dates.length)
      })
      .catch(() => {})
  }, [year, month])

  useEffect(() => {
    apiFetch<DaySummary>(`/calendar/${todayStr}/summary`)
      .then(data => setTodayBrew(data))
      .catch(() => setTodayBrew(null))
  }, [todayStr])

  // Fetch selected date summary
  useEffect(() => {
    if (!sheetDate) return
    setSheetLoading(true)
    setSheetData(null)
    apiFetch<DaySummary>(`/calendar/${sheetDate}/summary`)
      .then(data => setSheetData(data))
      .catch(() => setSheetData(null))
      .finally(() => setSheetLoading(false))
  }, [sheetDate])

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

  function handleDayClick(ds: string) {
    setSelectedDate(ds)
    setSheetDate(ds)
  }

  function closeSheet() {
    setSheetDate(null)
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
      <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4">
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
        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
        <span>노트 기록 있는 날</span>
      </div>

      {/* Today's Summary */}
      {todayBrew && (
        <div className="bg-[hsl(var(--surface-container-low))] rounded-2xl px-4 py-3">
          <p className="label-upper text-muted-foreground mb-1">Today's Summary</p>
          <p className="text-sm font-semibold">{todayBrew.name}</p>
          <p className="text-xs text-muted-foreground">{todayBrew.method} · {todayBrew.temp} · {todayBrew.duration}</p>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push(`/notes/${todayStr}`)}
          className="bg-foreground text-background rounded-2xl p-4 text-left"
        >
          <PenLine className="size-4 mb-3" />
          <p className="text-sm font-semibold">Write Today's Note</p>
          <p className="text-xs opacity-60">Record your brew</p>
        </button>

        <button
          className="bg-[hsl(var(--surface-container))] text-foreground rounded-2xl p-4 text-left"
        >
          <BarChart2 className="size-4 mb-3" />
          <p className="text-sm font-semibold">Monthly Insights</p>
          <p className="text-xs text-muted-foreground">{brewCount} brews logged</p>
        </button>
      </div>

      {/* Date Bottom Sheet */}
      <AnimatePresence>
        {sheetDate && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSheet}
              className="fixed inset-0 z-40 bg-black/30"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background max-w-lg mx-auto"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <p className="font-semibold text-foreground">{formatKorDate(sheetDate)}</p>
                <button
                  onClick={closeSheet}
                  className="size-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 pb-2 min-h-[80px]">
                {sheetLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                ) : sheetData ? (
                  <div className="bg-[hsl(var(--surface-container-low))] rounded-xl px-4 py-3">
                    <p className="label-upper text-muted-foreground mb-1">Brew Session</p>
                    <p className="text-sm font-semibold">{sheetData.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sheetData.method} · {sheetData.temp} · {sheetData.duration}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-2">
                    <div className="size-8 rounded-xl bg-[hsl(var(--surface-container))] flex items-center justify-center">
                      <Coffee className="size-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">기록된 브루잉이 없어요</p>
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-2 px-5 pt-2 pb-8">
                <button
                  onClick={() => { closeSheet(); router.push(`/notes/${sheetDate}`) }}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-foreground text-background text-sm font-medium transition-colors hover:bg-foreground/90"
                >
                  <PenLine className="size-3.5" />
                  노트 작성
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[hsl(var(--surface-container))] text-foreground text-sm font-medium transition-colors"
                >
                  <Coffee className="size-3.5" />
                  브루 기록
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
