'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
}

export function RatingStars({ value, onChange, readonly = false, size = 'md' }: RatingStarsProps) {
  const [hovered, setHovered] = useState(0)

  const displayValue = hovered || value

  return (
    <div
      className="flex gap-1"
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map(n => (
        <motion.button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          whileHover={!readonly ? { scale: 1.15 } : {}}
          whileTap={!readonly ? { scale: 0.9 } : {}}
          transition={{ duration: 0.12 }}
          className={cn(
            'transition-colors',
            readonly && 'cursor-default'
          )}
          aria-label={`${n}점`}
        >
          <Star
            className={cn(
              sizeMap[size],
              'transition-colors duration-150',
              n <= displayValue
                ? 'fill-primary text-primary'
                : 'fill-none text-muted-foreground'
            )}
          />
        </motion.button>
      ))}
    </div>
  )
}
