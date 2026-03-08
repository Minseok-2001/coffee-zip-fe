'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function NotePage() {
  const { date } = useParams()
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    apiFetch<Note>(`/notes?date=${date}`)
      .then(data => {
        if (data) {
          setNote(data)
          setContent(data.content ?? '')
          setRating(data.rating ?? 0)
        }
      })
      .catch(() => {})
  }, [date])

  async function save() {
    try {
      const result = await apiFetch<Note>(`/notes/${date}`, {
        method: 'PUT',
        body: JSON.stringify({ content, rating: rating || null }),
      })
      setNote(result)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-900">{date as string}</h1>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n)} className="text-xl">
              {n <= rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="오늘의 커피 경험을 기록해보세요..."
          className="w-full h-40 text-sm text-amber-800 placeholder-amber-300 focus:outline-none resize-none"
        />
      </div>

      <button
        onClick={save}
        className="w-full py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
      >
        {saved ? '저장됐어요 ✓' : '저장'}
      </button>

      {note && note.timerLogs.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
          <h2 className="font-semibold text-amber-900 mb-3">오늘의 브루잉</h2>
          <div className="space-y-2">
            {note.timerLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-800">☕ {log.recipeName}</span>
                <span className="text-amber-400 text-xs">
                  {log.completedAt ? log.completedAt.slice(11, 16) : '진행중'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
