'use client'

import { motion } from 'framer-motion'
import { Check, Droplets, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrewingStepProps {
  stepOrder: number
  label: string
  duration: number
  waterAmount?: number | null
  status: 'done' | 'active' | 'upcoming'
}

export function BrewingStep({ stepOrder, label, duration, waterAmount, status }: BrewingStepProps) {
  const isDone = status === 'done'
  const isActive = status === 'active'

  return (
    <div className={cn('flex items-start gap-3 py-3 transition-opacity', isDone && 'opacity-50')}>
      {/* Step circle */}
      <div className="relative flex-shrink-0 mt-0.5">
        <motion.div
          layout
          layoutId={`step-circle-${stepOrder}`}
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
            isDone && 'bg-foreground text-background',
            isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
            status === 'upcoming' && 'bg-muted text-muted-foreground border border-border'
          )}
        >
          {isDone ? <Check className="size-3.5 stroke-[3]" /> : stepOrder}
        </motion.div>

        {/* Active indicator glow */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium leading-snug',
          isActive ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {label}
        </p>
        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {duration}초
          </span>
          {waterAmount && (
            <span className="flex items-center gap-1">
              <Droplets className="size-3" />
              {waterAmount}ml
            </span>
          )}
        </div>
      </div>

      {/* Active highlight bar */}
      {isActive && (
        <motion.div
          layoutId="active-step-bar"
          className="absolute left-0 w-0.5 h-12 bg-primary rounded-r-full"
          transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
        />
      )}
    </div>
  )
}
