'use client'

const TYPE_LABELS: Record<string, string> = {
  V60: 'V60',
  KALITA: '칼리타',
  AEROPRESS: '에어로프레스',
  ORIGAMI: '오리가미',
  CHEMEX: '케멕스',
  CLEVER: '클레버',
  OTHER: '기타',
}

const MATERIAL_LABELS: Record<string, string> = {
  PLASTIC: '플라스틱',
  CERAMIC: '세라믹',
  COPPER: '동',
  GLASS: '유리',
  STAINLESS: '스테인리스',
  OTHER: '기타',
}

const SPEED_LABELS: Record<string, string> = {
  FAST: '빠름',
  MEDIUM: '보통',
  SLOW: '느림',
}

interface DripperCardProps {
  id: number
  name: string
  brand: string
  type: string
  material: string
  extractionSpeed: string | null
  avgRating: number | null
  reviewCount: number
  onClick?: () => void
}

export function DripperCard({
  id,
  name,
  brand,
  type,
  material,
  extractionSpeed,
  avgRating,
  reviewCount,
  onClick,
}: DripperCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-[hsl(var(--surface-container-low))] rounded-2xl px-4 py-3 cursor-pointer hover:bg-[hsl(var(--surface-container))] transition-colors"
    >
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-[11px] opacity-50">
            {TYPE_LABELS[type] ?? type} · {MATERIAL_LABELS[material] ?? material} · {brand}
          </p>
        </div>
        {avgRating != null && (
          <div className="text-amber-400 text-[11px] font-semibold shrink-0">
            ★ {avgRating.toFixed(1)}
          </div>
        )}
      </div>
      {extractionSpeed && (
        <div className="flex gap-1 flex-wrap mt-2">
          <span className="bg-sky-400/10 text-sky-400 text-[10px] px-2 py-0.5 rounded-full">
            추출속도 {SPEED_LABELS[extractionSpeed] ?? extractionSpeed}
          </span>
        </div>
      )}
    </div>
  )
}
