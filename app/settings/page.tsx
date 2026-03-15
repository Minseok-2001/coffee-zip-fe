'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun, ChevronRight, Bell, Globe, Info, LogOut, Pencil, Check, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

type MeResponse = {
  id: number
  nickname: string
  email: string | null
  profileImage: string | null
}

function SettingRow({
  icon: Icon,
  label,
  description,
  right,
  onClick,
  destructive,
}: {
  icon: React.ElementType
  label: string
  description?: string
  right?: React.ReactNode
  onClick?: () => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors',
        'hover:bg-[hsl(var(--surface-container))]',
        !onClick && 'cursor-default'
      )}
    >
      <div className="size-8 rounded-xl bg-[hsl(var(--surface-container))] flex items-center justify-center shrink-0">
        <Icon className={cn('size-4', destructive ? 'text-destructive' : 'text-foreground/70')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', destructive ? 'text-destructive' : 'text-foreground')}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {right ?? (onClick && <ChevronRight className="size-4 text-muted-foreground shrink-0" />)}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="label-upper text-muted-foreground px-4 pt-5 pb-1">
      {children}
    </p>
  )
}

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [me, setMe] = useState<MeResponse | null>(null)

  // Nickname edit state
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [nicknameLoading, setNicknameLoading] = useState(false)
  const [nicknameError, setNicknameError] = useState('')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    apiFetch<MeResponse>('/me').then(setMe).catch(() => {})
  }, [])

  const initial = me?.nickname?.[0]?.toUpperCase() ?? '?'

  function startEdit() {
    setNicknameInput(me?.nickname ?? '')
    setNicknameError('')
    setEditingNickname(true)
  }

  function cancelEdit() {
    setEditingNickname(false)
    setNicknameError('')
  }

  async function saveNickname() {
    const trimmed = nicknameInput.trim()
    if (!trimmed) { setNicknameError('닉네임을 입력해주세요'); return }
    if (trimmed.length > 20) { setNicknameError('최대 20자까지 입력할 수 있어요'); return }
    setNicknameLoading(true)
    try {
      const updated = await apiFetch<MeResponse>('/me', {
        method: 'PATCH',
        body: JSON.stringify({ nickname: trimmed }),
      })
      setMe(updated)
      setEditingNickname(false)
    } catch {
      setNicknameError('저장에 실패했어요. 다시 시도해주세요')
    } finally {
      setNicknameLoading(false)
    }
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <>
      <PageHeader title="설정" />

      {/* Profile Header */}
      <div className="flex items-center gap-4 px-4 py-5">
        <div className="size-14 rounded-2xl bg-[hsl(var(--surface-container))] flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-foreground/70">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          {editingNickname ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nicknameInput}
                  onChange={e => setNicknameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') cancelEdit() }}
                  maxLength={20}
                  className="flex-1 text-sm font-semibold bg-transparent border-b border-foreground/30 focus:border-foreground outline-none py-0.5"
                />
                <button onClick={saveNickname} disabled={nicknameLoading} className="text-foreground/70 hover:text-foreground">
                  <Check className="size-4" />
                </button>
                <button onClick={cancelEdit} className="text-foreground/40 hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              {nicknameError && <p className="text-xs text-destructive">{nicknameError}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground truncate">{me?.nickname ?? '...'}</p>
              <button onClick={startEdit} className="text-foreground/30 hover:text-foreground/70 transition-colors shrink-0">
                <Pencil className="size-3" />
              </button>
            </div>
          )}
          {me?.email && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{me.email}</p>
          )}
          <span className="label-upper inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--surface-container))] text-foreground/60">
            Roaster Lv. 1
          </span>
        </div>
      </div>

      <div className="py-2">
        {/* 앱 설정 */}
        <SectionLabel>앱 설정</SectionLabel>
        <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] mx-0 overflow-hidden">
          <SettingRow
            icon={isDark ? Moon : Sun}
            label="테마"
            description={isDark ? '다크 모드' : '라이트 모드'}
            right={
              mounted ? (
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors shrink-0',
                    isDark ? 'bg-foreground' : 'bg-[hsl(var(--surface-container))]'
                  )}
                  aria-label="테마 전환"
                >
                  <span className={cn(
                    'absolute top-1 size-4 rounded-full bg-background transition-transform',
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
              ) : <div className="w-11 h-6" />
            }
          />
          <div className="h-px bg-border/30 mx-4" />
          <SettingRow
            icon={Bell}
            label="알림"
            description="브루잉 타이머 알림"
            onClick={() => {}}
          />
          <div className="h-px bg-border/30 mx-4" />
          <SettingRow
            icon={Globe}
            label="언어"
            description="한국어"
            onClick={() => {}}
          />
        </div>

        {/* 정보 */}
        <SectionLabel>정보</SectionLabel>
        <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] overflow-hidden">
          <SettingRow
            icon={Info}
            label="앱 버전"
            description="1.0.0"
          />
        </div>

        {/* 계정 */}
        <SectionLabel>계정</SectionLabel>
        <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] overflow-hidden">
          <SettingRow
            icon={LogOut}
            label="로그아웃"
            destructive
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
              localStorage.removeItem('memberId')
              localStorage.removeItem('nickname')
              window.location.href = '/login'
            }}
          />
        </div>
      </div>
    </>
  )
}
