'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun, ChevronRight, Bell, Globe, Info, LogOut } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { cn } from '@/lib/utils'

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

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <>
      <PageHeader title="설정" />

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
            onClick={() => {
              localStorage.removeItem('accessToken')
              window.location.href = '/'
            }}
          />
        </div>
      </div>
    </>
  )
}
