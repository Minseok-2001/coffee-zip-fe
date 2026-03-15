interface BeanCardProps {
  id: number
  name: string
  roastery: string
  origin: string
  roastLevel: string
  flavorNotes: string[]
  avgRating: number | null
  reviewCount: number
  onClick?: () => void
}

export function BeanCard({
  id,
  name,
  roastery,
  origin,
  roastLevel,
  flavorNotes,
  avgRating,
  reviewCount,
  onClick,
}: BeanCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-[#1a1a1a] rounded-2xl px-4 py-3 cursor-pointer hover:bg-[#222] transition-colors"
    >
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-[11px] opacity-50">
            {origin} · {roastLevel} · {roastery}
          </p>
        </div>
        {avgRating != null && (
          <div className="text-amber-400 text-[11px] font-semibold shrink-0">
            ★ {avgRating.toFixed(1)}
          </div>
        )}
      </div>
      {flavorNotes.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {flavorNotes.slice(0, 3).map((note) => (
            <span
              key={note}
              className="bg-amber-400/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full"
            >
              {note}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
