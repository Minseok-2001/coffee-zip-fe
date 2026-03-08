'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  showBack?: boolean
  right?: React.ReactNode
  className?: string
}

export function PageHeader({ title, showBack = false, right, className }: PageHeaderProps) {
  const router = useRouter()

  return (
    <header className={cn('sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border', className)}>
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-1 -ml-1 rounded-full hover:bg-muted transition-colors"
              aria-label="뒤로가기"
            >
              <ChevronLeft className="size-5 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
        </div>
        {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
      </div>
    </header>
  )
}
