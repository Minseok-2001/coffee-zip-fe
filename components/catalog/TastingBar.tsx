interface TastingBarProps {
  label: string
  value: number
  maxValue?: number
}

export function TastingBar({ label, value, maxValue = 5 }: TastingBarProps) {
  const pct = Math.min(Math.max(value / maxValue, 0), 1) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] opacity-60 w-8 shrink-0">{label}</span>
      <div className="flex-1 bg-[#2a2a2a] rounded h-1">
        <div className="bg-amber-400 rounded h-1 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] w-6 text-right">{value.toFixed(1)}</span>
    </div>
  )
}
