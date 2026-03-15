'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Coffee, Check } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { RatingStars } from '@/components/ui/rating-stars'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

interface TimerLog {
  id: number
  recipeId: number
  recipeName: string
  startedAt: string
  completedAt: string | null
}

interface Note {
  id: number
  noteDate: string
  content: string | null
  rating: number | null
  timerLogs: TimerLog[]
}

function formatDateKo(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

export default function NotePage() {
  const { date } = useParams()
  const router = useRouter()
  const dateStr = date as string
  const [note, setNote] = useState<Note | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
    }
  }, [router])
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    apiFetch<Note>(`/notes?date=${dateStr}`)
      .then(data => {
        if (data) {
          setNote(data)
          setContent(data.content ?? '')
          setRating(data.rating ?? 0)
        }
      })
      .catch(() => {})
  }, [dateStr])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [content])

  async function save() {
    try {
      const result = await apiFetch<Note>(`/notes/${dateStr}`, {
        method: 'PUT',
        body: JSON.stringify({ content, rating: rating || null }),
      })
      setNote(result)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) { console.error(e) }
  }

  return (
    <>
      <PageHeader title="데일리 노트" showBack />

      <div className="py-4 space-y-4">
        {/* Date header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{formatDateKo(dateStr)}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">오늘의 커피 기록</p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">오늘의 만족도</span>
          <RatingStars value={rating} onChange={setRating} size="lg" />
        </div>

        {/* Note textarea */}
        <div className="rounded-2xl border border-border bg-card p-4 focus-within:ring-1 focus-within:ring-ring transition-shadow">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="오늘의 커피 경험을 기록해보세요..."
            className="w-full min-h-[120px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none bg-transparent leading-relaxed"
          />
        </div>

        {/* Save button */}
        <Button className="w-full gap-2" onClick={save}>
          <AnimatePresence mode="wait" initial={false}>
            {saved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Check className="size-4" />
                저장됐어요
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                저장
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        {/* Timer logs timeline */}
        {note && note.timerLogs.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-4">오늘의 브루잉</h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-4">
                {note.timerLogs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 pl-1"
                  >
                    {/* Timeline dot */}
                    <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Coffee className="size-2.5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{log.recipeName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="size-3" />
                        {log.completedAt
                          ? log.completedAt.slice(11, 16)
                          : '진행중'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
