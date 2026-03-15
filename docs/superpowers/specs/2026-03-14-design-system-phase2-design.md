# CoffeeZip 디자인 시스템 Phase 2 — Design Spec

**Date:** 2026-03-14
**Status:** Approved
**Scope:** Feed, RecipeCard, Recipe Detail, Timer 화면을 Stitch 디자인에 맞게 정비

> 커스텀 토큰(`bg-surface-container`, `bg-surface-container-low` 등)은
> `app/globals.css` `@theme inline` 블록에 등록되어 있으며 Tailwind v4 유틸리티로 자동 생성됨.

---

## 1. 배경

Phase 1에서 globals.css 토큰, card.tsx border 제거, button.tsx cta variant, calendar 섹션을 완료했다.
Phase 2는 화면별 레이아웃을 Stitch "Feed (Standardized Nav)"와 맞추는 작업이다.

---

## 2. 변경 대상

### 2-1. `components/brewing/recipe-card.tsx`

**Props 추가 (`RecipeCardProps` 인터페이스)**
```ts
imageUrl?: string | null   // 추가
roastLevel?: string | null // 추가
```

**이미지 영역**
- 카드 상단 full-width `aspect-video rounded-t-2xl overflow-hidden` 이미지
- `imageUrl` 있을 때: `<img>` 또는 `<Image>` (next/image)
- `imageUrl` 없을 때: `bg-surface-container` placeholder (동일 aspect-video)
- 이미지 위 좌상단 absolute `label-upper` roastLevel 뱃지 (`roastLevel` 있을 때만)
  - 스타일: `bg-foreground/80 text-background text-[10px] px-2 py-0.5 rounded-full`

**카드 스타일**
- `border border-border bg-card hover:border-primary/30` 전부 제거
- `bg-surface-container-low` tonal 배경만 사용
- hover: `boxShadow: 0 8px 30px rgba(0,0,0,0.04)` + `y: -2` (기존 whileHover 유지)
- 이미지 있을 때 padding 구조: `rounded-2xl overflow-hidden` 카드, 이미지 위에 `p-4` 텍스트 영역

**태그**
- `bg-primary/10 text-primary` → `bg-surface-container text-foreground/70`

**Skeleton 업데이트**
- 이미지 영역 포함: `<div className="aspect-video bg-muted animate-pulse rounded-t-2xl" />`

---

### 2-2. `app/page.tsx` (Feed)

**Props / 인터페이스 변경**
```ts
interface Recipe {
  // 기존 필드 유지 +
  imageUrl?: string | null
  roastLevel?: string | null
}
```

**헤더**
- `border-b border-border` 제거, `bg-background/95 backdrop-blur-sm`만 유지

**필터 탭 상태**
```ts
const [activeMethod, setActiveMethod] = useState<string>('all')
```
탭 목록: `[{ label: 'ALL', value: 'all' }, { label: 'POUR OVER', value: 'pour_over' }, { label: 'ESPRESSO', value: 'espresso' }, { label: 'COLD BREW', value: 'cold_brew' }]`

탭 변경 시:
```ts
setActiveMethod(method)
setRecipes([])
setCursor(null)
setHasMore(true)
// loadMore는 useEffect에서 [activeMethod] 의존으로 트리거
```

API URL: `activeMethod === 'all'` → `/recipes?limit=10`, 아니면 `/recipes?method=${activeMethod}&limit=10`

**TODO 주석:**
```ts
// TODO: 백엔드 미구현 — GET /recipes?method=string 엔드포인트 추가 필요
// 현재 method 파라미터는 서버에서 무시됨
```

**에러 복구 (탭 전환 후 fetch 실패 시)**
- catch에서 `setHasMore(false)` 유지 (재시도 방지)
- `recipes`가 비어있고 `!loading`이면 "레시피를 불러오지 못했어요" empty state 표시

**Hero 카드 (`recipes[0]`)**
- 로딩 중(`loading && recipes.length === 0`): Hero Skeleton (`aspect-[16/9] bg-muted animate-pulse rounded-2xl`)
- 비어있음(`!loading && recipes.length === 0`): Hero 슬롯 없이 empty state 텍스트만
- 데이터 있음: `recipes[0]`을 Hero, `recipes.slice(1)`을 일반 카드 리스트

**Hero 카드 스타일**
```
- 이미지: aspect-[16/9] rounded-2xl overflow-hidden w-full
- 텍스트 오버레이: absolute bottom-0 left-0 right-0
  gradient: linear-gradient(to top, rgba(0,0,0,0.7), transparent)
  텍스트: title(text-white font-bold), bean(text-white/70 text-sm), likes(text-white/60 text-xs)
- 이미지 없을 때: bg-surface-container에 텍스트 일반 표시 (RecipeCard와 동일)
```

---

### 2-3. `app/recipes/[id]/page.tsx` (Recipe Detail)

**카드 border 제거**
- `rounded-2xl border border-border bg-card` → `rounded-2xl bg-surface-container-low`
- `rounded-2xl border border-border bg-card p-5` 패턴 전체 교체

**Start Brewing CTA**
```tsx
// Before
<Button className="w-full gap-2" size="lg">
// After
<Button variant="cta" className="w-full gap-2" size="lg">
```

**Step 넘버링 — 래퍼에서 처리 (BrewingStep 컴포넌트 수정 없음)**
```tsx
{recipe.steps.map((step, index) => (
  <div key={step.id}>
    <p className="label-upper text-muted-foreground mb-1">
      {String(index + 1).padStart(2, '0')}
    </p>
    <BrewingStep ... />
  </div>
))}
```
- `padStart(2, '0')` 적용 → step 9까지 `01~09`, step 10 이상은 `10`, `11` (zero-pad 없음)

**태그**
- `bg-primary/10 text-primary border-0` → `bg-surface-container text-foreground/70 border-0`

**liked 버튼 border 제거**
- `border border-border` → border 없이 `bg-surface-container` 배경으로 변경

---

### 2-4. `app/timer/[id]/page.tsx` (Timer)

**Phase 진행 표시**
- 현재 step의 카드 또는 섹션 상단에 `label-upper` 텍스트 추가:
  ```
  PHASE {String(currentStepIndex + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
  ```
- step >= 10: 두 자리 그대로 (`10`, `11`...)

**Active step glassmorphism**
- Timer 화면에서 step list를 감싸는 container를 `bg-card` opaque에서 투명으로 변경 필요:
  - 기존 step list 컨테이너: `rounded-2xl border border-border bg-card`
  - 변경: `rounded-2xl bg-surface-container-low`
  - active step 행(motion.div): `bg-white/70 backdrop-blur-[12px] rounded-xl`
  - `.dark` 대응: `dark:bg-white/10`
  - **주의:** backdrop-filter는 부모가 불투명하면 효과 없음 → 컨테이너 bg를 반드시 반투명으로

---

## 3. 실행 순서

1. `RecipeCard` — props + 이미지 + tonal + 태그
2. `app/page.tsx` (Feed) — Hero + 탭 + border 제거
3. `app/recipes/[id]/page.tsx` (Recipe Detail) — border + CTA + 태그 + step 번호
4. `app/timer/[id]/page.tsx` (Timer) — Phase 표시 + glassmorphism
