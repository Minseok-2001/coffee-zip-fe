# CoffeeZip Design Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Feed, RecipeCard, Recipe Detail, Timer 화면을 Stitch 디자인 스펙에 맞게 정비한다.

**Architecture:** 컴포넌트 의존 순서(RecipeCard → Feed → RecipeDetail → Timer)로 진행. 공통 토큰(`--surface-container`, `--cta`)은 Phase 1에서 이미 globals.css에 등록되어 있음. 테스트는 `npm run build`(타입 체크 + 빌드) + 브라우저 시각 확인으로 대체.

**Tech Stack:** Next.js 14 App Router, Tailwind v4, shadcn/ui, Framer Motion, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-14-design-system-phase2-design.md`

---

## Chunk 1: RecipeCard 컴포넌트

### Task 1: RecipeCard — 이미지, tonal 카드, 태그

**Files:**
- Modify: `components/brewing/recipe-card.tsx`

- [ ] **Step 1: Props 인터페이스에 `imageUrl`, `roastLevel` 추가**

`RecipeCardProps` 인터페이스를 아래와 같이 수정:
```tsx
interface RecipeCardProps {
  id: number
  title: string
  coffeeBean?: string | null
  origin?: string | null
  roastLevel?: string | null   // 추가
  waterTemp?: number | null
  coffeeGrams?: number | null
  waterGrams?: number | null
  imageUrl?: string | null     // 추가
  likeCount: number
  tags: string[]
  initialLiked?: boolean
  onLike?: (id: number) => void
}
```

- [ ] **Step 2: RecipeCardSkeleton — 이미지 영역 추가**

`RecipeCardSkeleton` 함수를 아래로 교체:
```tsx
function RecipeCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] overflow-hidden space-y-0 animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-5 bg-muted rounded w-2/3" />
          <div className="h-5 bg-muted rounded w-12" />
        </div>
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded-full w-16" />
          <div className="h-5 bg-muted rounded-full w-20" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: RecipeCard 함수 시그니처에 새 props 구조분해 추가**

```tsx
export function RecipeCard({
  id,
  title,
  coffeeBean,
  origin,
  roastLevel,        // 추가
  waterTemp,
  coffeeGrams,
  waterGrams,
  imageUrl,          // 추가
  likeCount: initialLikeCount,
  tags,
  initialLiked = false,
  onLike,
}: RecipeCardProps) {
```

- [ ] **Step 4: 카드 JSX 전체 교체**

`return (...)` 내부를 아래로 교체:
```tsx
return (
  <motion.div
    whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
  >
    <Link href={`/recipes/${id}`}>
      <div className="rounded-2xl bg-[hsl(var(--surface-container-low))] overflow-hidden transition-colors">
        {/* 이미지 영역 */}
        <div className="relative aspect-video bg-[hsl(var(--surface-container))]">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          )}
          {roastLevel && (
            <span className="label-upper absolute top-3 left-3 bg-foreground/80 text-background text-[10px] px-2 py-0.5 rounded-full">
              {roastLevel}
            </span>
          )}
        </div>

        {/* 텍스트 영역 */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start gap-3">
            <h2 className="font-semibold text-foreground leading-snug flex-1">{title}</h2>
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-sm shrink-0 mt-0.5"
              aria-label={liked ? '좋아요 취소' : '좋아요'}
            >
              <motion.div
                animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <Heart
                  className={cn(
                    'size-4 transition-colors',
                    liked ? 'fill-foreground text-foreground' : 'text-muted-foreground'
                  )}
                />
              </motion.div>
              <span className={cn('tabular-nums', liked ? 'text-foreground' : 'text-muted-foreground')}>
                {likeCount}
              </span>
            </button>
          </div>

          {(coffeeBean || origin) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Coffee className="size-3.5 shrink-0" />
              <span>{coffeeBean}{origin && ` · ${origin}`}</span>
            </div>
          )}

          {(waterTemp || (coffeeGrams && waterGrams)) && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              {waterTemp && (
                <span className="flex items-center gap-1">
                  <Thermometer className="size-3" />
                  {waterTemp}°C
                </span>
              )}
              {coffeeGrams && waterGrams && (
                <span className="flex items-center gap-1">
                  <Scale className="size-3" />
                  {coffeeGrams}g : {waterGrams}g
                </span>
              )}
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-2 py-0 bg-[hsl(var(--surface-container))] text-foreground/70 border-0"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  </motion.div>
)
```

- [ ] **Step 5: 빌드 확인**

```bash
cd /Users/minseok/Documents/GitHub/coffee-zip-fe && npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add components/brewing/recipe-card.tsx
git commit -m "feat: RecipeCard — 이미지/roast 뱃지/tonal 카드/neutral 태그"
```

---

## Chunk 2: Feed 페이지

### Task 2: Feed — Hero 카드 + 필터 탭 + border 제거

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 0: 누락 import 추가**

`app/page.tsx` 상단 import에 추가:
```tsx
import Link from 'next/link'
import { cn } from '@/lib/utils'
```

- [ ] **Step 1: `Recipe` 인터페이스에 `imageUrl`, `roastLevel` 추가**

```tsx
interface Recipe {
  id: number
  title: string
  coffeeBean: string | null
  origin: string | null
  roastLevel: string | null   // 추가
  waterTemp: number | null
  coffeeGrams: number | null
  waterGrams: number | null
  imageUrl: string | null     // 추가
  likeCount: number
  tags: string[]
}
```

- [ ] **Step 2: 필터 탭 상수 + 상태 추가**

파일 상단 상수:
```tsx
const FILTER_TABS = [
  { label: 'ALL', value: 'all' },
  { label: 'POUR OVER', value: 'pour_over' },
  { label: 'ESPRESSO', value: 'espresso' },
  { label: 'COLD BREW', value: 'cold_brew' },
] as const
```

`FeedPage` 함수 내 상태에 추가:
```tsx
const [activeMethod, setActiveMethod] = useState<string>('all')
```

- [ ] **Step 3: `loadMore` URL에 method 파라미터 반영**

기존:
```tsx
const url = cursor ? `/recipes?cursor=${cursor}&limit=10` : '/recipes?limit=10'
```
변경:
```tsx
// TODO: 백엔드 미구현 — GET /recipes?method=string 엔드포인트 추가 필요
// 현재 method 파라미터는 서버에서 무시됨
const methodParam = activeMethod !== 'all' ? `&method=${activeMethod}` : ''
const url = cursor
  ? `/recipes?cursor=${cursor}&limit=10${methodParam}`
  : `/recipes?limit=10${methodParam}`
```

`loadMore`의 deps에 `activeMethod` 추가:
```tsx
}, [cursor, hasMore, loading, activeMethod])
```

- [ ] **Step 4: 탭 전환 useEffect 추가 + 강제 리로드 트리거**

`FeedPage` 상태에 `loadTrigger` 추가:
```tsx
const [loadTrigger, setLoadTrigger] = useState(0)
```

기존 `useEffect(() => { loadMore() }, [])` 를 아래로 교체:
```tsx
// Initial load + tab 전환 후 강제 리로드
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { loadMore() }, [loadTrigger])
```

필터 탭 `onClick` 핸들러에서 상태 리셋 + 트리거 증가:
```tsx
onClick={() => {
  setActiveMethod(tab.value)
  setRecipes([])
  setCursor(null)
  setHasMore(true)
  setLoadTrigger(t => t + 1)
}}
```

> **참고:** `loadMore`는 `activeMethod`를 deps로 가지는 useCallback이므로,
> 탭 전환 시 새 `activeMethod`가 반영된 loadMore가 호출됨.

- [ ] **Step 5: 헤더 border 제거**

```tsx
// Before
<header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
// After
<header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
```

- [ ] **Step 6: JSX — 필터 탭 + Hero 카드 + 리스트 교체**

헤더 아래 `{/* Feed */}` 섹션 전체를 아래로 교체:

```tsx
{/* 필터 탭 */}
<div className="flex gap-1 overflow-x-auto scrollbar-none pb-1 pt-2">
  {FILTER_TABS.map(tab => (
    <button
      key={tab.value}
      onClick={() => setActiveMethod(tab.value)}
      className={cn(
        'label-upper shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors',
        activeMethod === tab.value
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {tab.label}
    </button>
  ))}
</div>

{/* Feed */}
<div className="pt-3 pb-2">
  {/* Hero 카드 */}
  {loading && recipes.length === 0 ? (
    <div className="aspect-[16/9] bg-[hsl(var(--surface-container))] rounded-2xl animate-pulse mb-3" />
  ) : recipes.length > 0 ? (
    <motion.div
      className="mb-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Link href={`/recipes/${recipes[0].id}`}>
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-[hsl(var(--surface-container))]">
          {recipes[0].imageUrl && (
            <img
              src={recipes[0].imageUrl}
              alt={recipes[0].title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {recipes[0].roastLevel && (
              <p className="label-upper text-white/70 mb-1">{recipes[0].roastLevel}</p>
            )}
            <h2 className="text-white font-bold text-lg tracking-display leading-tight">
              {recipes[0].title}
            </h2>
            {recipes[0].coffeeBean && (
              <p className="text-white/70 text-sm mt-0.5">
                {recipes[0].coffeeBean}{recipes[0].origin && ` · ${recipes[0].origin}`}
              </p>
            )}
            <p className="text-white/50 text-xs mt-1">♥ {recipes[0].likeCount}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  ) : !loading ? (
    <div className="text-center text-muted-foreground py-20 text-sm">
      아직 레시피가 없어요
    </div>
  ) : null}

  {/* 일반 카드 리스트 (첫 번째 제외) */}
  {recipes.length > 1 && (
    <motion.div
      className="space-y-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {recipes.slice(1).map(recipe => (
        <motion.div key={recipe.id} variants={item}>
          <RecipeCard {...recipe} />
        </motion.div>
      ))}
    </motion.div>
  )}

  {/* 로딩 스켈레톤 */}
  {loading && recipes.length > 0 && (
    <div className="space-y-3 mt-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <RecipeCard.Skeleton key={i} />
      ))}
    </div>
  )}

  {/* 무한 스크롤 sentinel */}
  <div ref={sentinelRef} className="h-4" />

  {!hasMore && recipes.length > 0 && (
    <p className="text-center text-xs text-muted-foreground py-4">
      모든 레시피를 불러왔어요
    </p>
  )}
</div>
```

- [ ] **Step 7: 빌드 확인**

```bash
cd /Users/minseok/Documents/GitHub/coffee-zip-fe && npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 8: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: Feed — Hero 카드 + 필터 탭 + header border 제거"
```

---

## Chunk 3: Recipe Detail 페이지

### Task 3: Recipe Detail — border 제거, CTA 버튼, step 번호, 태그

**Files:**
- Modify: `app/recipes/[id]/page.tsx`

- [ ] **Step 1: border 제거 — Cover card**

```tsx
// Before
<div className="rounded-2xl border border-border bg-card p-5 space-y-4">
// After
<div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5 space-y-4">
```

- [ ] **Step 2: border 제거 — Steps card**

```tsx
// Before
<div className="rounded-2xl border border-border bg-card p-5">
// After
<div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5">
```

- [ ] **Step 3: border 제거 — Comments card**

```tsx
// Before
<div className="rounded-2xl border border-border bg-card p-5">
// After
<div className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-5">
```

- [ ] **Step 4: liked 버튼 border 제거**

```tsx
// Before
className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border hover:border-primary/40 transition-colors"
// After
className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-[hsl(var(--surface-container))] transition-colors"
```

- [ ] **Step 5: Start Brewing 버튼 → cta variant**

```tsx
// Before
<Button className="w-full gap-2" size="lg">
// After
<Button variant="cta" className="w-full gap-2" size="lg">
```

- [ ] **Step 6: Step 넘버링 래퍼 추가**

```tsx
// Before
<div className="relative divide-y divide-border/50">
  {recipe.steps.map(step => (
    <BrewingStep
      key={step.id}
      stepOrder={step.stepOrder}
      label={step.label}
      duration={step.duration}
      waterAmount={step.waterAmount}
      status="upcoming"
    />
  ))}
</div>
// After
<div className="relative space-y-2">
  {recipe.steps.map((step, index) => (
    <div key={step.id}>
      <p className="label-upper text-muted-foreground mb-1">
        {String(index + 1).padStart(2, '0')}
      </p>
      <BrewingStep
        stepOrder={step.stepOrder}
        label={step.label}
        duration={step.duration}
        waterAmount={step.waterAmount}
        status="upcoming"
      />
    </div>
  ))}
</div>
```

- [ ] **Step 7: 태그 스타일 교체**

```tsx
// Before
<Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-0">
// After
<Badge key={tag} variant="secondary" className="bg-[hsl(var(--surface-container))] text-foreground/70 border-0">
```

- [ ] **Step 8: 빌드 확인**

```bash
cd /Users/minseok/Documents/GitHub/coffee-zip-fe && npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 9: 커밋**

```bash
git add app/recipes/[id]/page.tsx
git commit -m "feat: Recipe Detail — tonal 카드, amber CTA, step 번호, neutral 태그"
```

---

## Chunk 4: Timer 페이지

### Task 4: Timer — Phase 표시 + step list tonal

**Files:**
- Modify: `app/timer/[id]/page.tsx`

- [ ] **Step 1: Phase 진행 표시 추가 — Countdown 섹션 위**

타이머 파일에서 아래 패턴을 찾아 그 바로 위에 삽입 (`{/* Countdown */}` 주석과 같은 depth):
```tsx
{/* 찾을 코드: */}
{/* Countdown */}
<div className="text-center">
  <AnimatePresence mode="wait">
```

삽입 코드:

```tsx
{/* Phase 진행 표시 */}
<div className="text-center">
  <p className="label-upper text-muted-foreground">
    PHASE {String(stepIndex + 1).padStart(2, '0')} / {String(recipe.steps.length).padStart(2, '0')}
  </p>
  <p className="text-sm font-semibold text-foreground mt-0.5">
    {recipe.steps[stepIndex]?.label}
  </p>
</div>
```

- [ ] **Step 2: Step list 컨테이너 — border 제거 + tonal**

```tsx
// Before
<div className="rounded-2xl border border-border bg-card divide-y divide-border/50 overflow-hidden">
// After
<div className="rounded-2xl bg-[hsl(var(--surface-container-low))] overflow-hidden divide-y divide-border/20">
```

- [ ] **Step 3: Active step 배경 → surface-container**

step list 내부 active step의 `motion.div` animate 값을 변경:

```tsx
// Before
animate={status === 'active'
  ? { backgroundColor: 'hsl(var(--primary) / 0.06)' }
  : { backgroundColor: 'transparent' }}
// After
animate={status === 'active'
  ? { backgroundColor: 'hsl(var(--surface-container))' }
  : { backgroundColor: 'transparent' }}
```

- [ ] **Step 4: active step left bar — primary → cta 색상**

active step의 left indicator bar:
```tsx
// Before
className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r-full -ml-4"
// After
className="absolute left-0 top-2 bottom-2 w-0.5 bg-[hsl(var(--cta))] rounded-r-full -ml-4"
```

- [ ] **Step 5: waterAmount 색상 — primary → cta**

```tsx
// Before
{step.waterAmount && <span className="text-primary text-xs">{step.waterAmount}ml</span>}
// After
{step.waterAmount && <span className="text-[hsl(var(--cta))] text-xs">{step.waterAmount}ml</span>}
```

- [ ] **Step 6: 빌드 확인**

```bash
cd /Users/minseok/Documents/GitHub/coffee-zip-fe && npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 7: 커밋**

```bash
git add app/timer/[id]/page.tsx
git commit -m "feat: Timer — Phase 진행 표시 + tonal step list + amber accent"
```

---

## 최종 확인

- [ ] `npm run build` 통과 확인
- [ ] Feed: Hero 카드, 필터 탭, 이미지 placeholder 확인
- [ ] RecipeCard: border 없음, surface tonal, neutral 태그 확인
- [ ] Recipe Detail: amber CTA 버튼, border 없는 카드, step 번호 확인
- [ ] Timer: PHASE 01/04 표시, step list tonal 확인
- [ ] Light/Dark 모드 토글 양쪽 확인
