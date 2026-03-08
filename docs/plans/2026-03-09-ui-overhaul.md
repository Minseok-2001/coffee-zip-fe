# CoffeeZip FE — UI 오버홀 (2026-03-09)

## 목표
Toss 스타일 미니멀 모노크롬 + amber single accent + 라이트/다크 모드 + 인터랙티브 애니메이션

## 기술 스택
| 라이브러리 | 용도 |
|---|---|
| shadcn/ui (Radix UI) | 접근성 내장 컴포넌트 |
| Framer Motion | 페이지 전환, 카드 제스처, AnimatePresence |
| GSAP | 타이머 물 붓기 SVG 애니메이션 |
| next-themes | 라이트/다크 모드 |
| lucide-react | 아이콘 |
| clsx + tailwind-merge | cn() 유틸리티 |

## 디자인 토큰
- Background (light): `hsl(0 0% 99%)`
- Background (dark): `hsl(0 0% 7%)`
- Accent: `hsl(38 92% 50%)` — amber-500, 유일한 컬러 포인트
- Border radius: `0.875rem`

## 변경된 파일
- `app/globals.css` — CSS custom properties + Tailwind v4 @theme
- `app/layout.tsx` — ThemeProvider, BottomNav (sticky header 제거)
- `app/providers.tsx` — next-themes ThemeProvider
- `app/template.tsx` — 페이지 전환 fade+slide-up
- `app/page.tsx` — 피드: staggerChildren, IntersectionObserver 무한 스크롤
- `app/recipes/[id]/page.tsx` — 상세: AnimatePresence 댓글, PageHeader
- `app/timer/[id]/page.tsx` — GSAP 물 붓기 + SVG 원형 타이머
- `app/notes/[date]/page.tsx` — RatingStars, 타임라인 로그
- `app/calendar/page.tsx` — Framer Motion 월 전환 slide
- `components/layout/bottom-nav.tsx` — 모바일 하단 탭 네비게이션
- `components/layout/page-header.tsx` — 뒤로가기 + 제목 헤더
- `components/brewing/recipe-card.tsx` — 좋아요 애니메이션, 스켈레톤
- `components/brewing/brewing-step.tsx` — active step layoutId 하이라이트
- `components/ui/rating-stars.tsx` — amber fill 별점
- `components/ui/theme-toggle.tsx` — sun/moon 토글
- `lib/utils.ts` — cn() 헬퍼
- `components.json` — shadcn 설정

## 검증
- TypeScript: 오류 없음 (`tsc --noEmit`)
- Build: 성공 (`next build`)
- Playwright: 라이트/다크 모드, 모바일(390px) 확인 완료
