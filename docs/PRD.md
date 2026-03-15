# CoffeeZip — Product Requirements Document

> **Version**: 0.1.0-MVP
> **Last Updated**: 2026-03-14
> **Status**: In Development

---

## 1. 제품 개요 (Product Overview)

### 1.1 Product Vision

CoffeeZip은 **홈 브루어(Home Brewer)를 위한 핸드드립 커피 전용 기록·가이드 앱**이다.
"좋은 커피 한 잔을 매일 재현할 수 있게" — 레시피를 따르고, 브루잉을 타이밍하고, 오늘의 한 잔을 기록한다.

### 1.2 Problem Statement

| 문제 | 현재 상황 |
|------|----------|
| 레시피 산재 | 핸드드립 레시피가 노트, 유튜브, 블로그에 흩어져 있음 |
| 재현 불가 | 어제 맛있게 만들었어도 파라미터를 기억하지 못함 |
| 타이머 불편 | 별도 타이머 앱 + 레시피 화면을 오가며 브루잉 |
| 기록 부재 | 오늘 어떤 원두로 어떻게 마셨는지 체계적 기록 없음 |

### 1.3 Solution

- **레시피 피드**: 커뮤니티 레시피를 탐색하고 저장
- **브루잉 타이머**: 레시피 기반 단계별 타이머 + 시각 피드백
- **데일리 노트**: 하루 한 잔의 브루잉 기록과 평점
- **캘린더**: 나의 커피 일지를 월별로 되돌아보기

### 1.4 Target Users

| 세그먼트 | 설명 | 비중 |
|----------|------|------|
| **입문 홈브루어** | 핸드드립 시작 6개월 미만, 레시피 가이드 필요 | 40% |
| **중급 홈브루어** | 자신만의 레시피를 가지고 있고, 기록·공유 원함 | 45% |
| **카페 바리스타** | 레시피 관리 및 고객 공유 목적 | 15% |

### 1.5 Platforms

- **Primary**: 모바일 웹 (iOS Safari / Android Chrome)
- **Secondary**: 데스크탑 브라우저 (반응형 지원)

---

## 2. 기술 스택 (Tech Stack)

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | ^5 |
| Runtime | React | 19.2.3 |
| Styling | Tailwind CSS v4 | ^4 |
| Animation | Framer Motion | ^12 |
| Animation (SVG) | GSAP | ^3 |
| UI Primitives | Radix UI | - |
| Theme | next-themes | ^0.4.6 |
| Icons | Lucide React | ^0.577 |
| HTTP Client | Native fetch (apiFetch wrapper) | - |
| Backend | Quarkus REST API | localhost:8080 |

---

## 3. 디자인 시스템 (Design System)

### 3.1 Design Philosophy

> Toss 스타일 미니멀 모노크롬 + 앰버(Amber) 단색 포인트

- **흑백 중심**: 배경/텍스트/보더는 순수 무채색
- **앰버 원포인트**: `hsl(38 92% 50%)` — 인터랙션, 강조, 브루잉 활성 상태에만 사용
- **애니메이션**: 거슬리지 않는 자연스러운 전환, 항상 `ease` 기반

### 3.2 Color Tokens

```css
/* Light Mode */
--background:  0 0% 99%     /* 거의 흰색 */
--foreground:  0 0% 9%      /* 거의 검정 */
--muted:       0 0% 96%
--border:      0 0% 89%
--card:        0 0% 100%
--primary:     38 92% 50%   /* Amber — 유일한 컬러 포인트 */

/* Dark Mode */
--background:  0 0% 7%
--foreground:  0 0% 95%
--muted:       0 0% 13%
--border:      0 0% 18%
--card:        0 0% 10%
--primary:     38 92% 50%   /* Amber — 동일 */
```

### 3.3 Typography

- **Font**: Geist (sans), Geist Mono (mono)
- **Scale**: Tailwind 기본 스케일 (`text-xs` ~ `text-2xl`)
- **Weight**: regular(400) / medium(500) / bold(700)

### 3.4 Spacing & Radius

- **Border Radius**: `0.875rem` (14px) 기본
- **Page Padding**: `px-4` (16px)
- **Section Gap**: `space-y-5` (20px)

### 3.5 Component Library

| Component | Variants / Notes |
|-----------|-----------------|
| `Button` | default / outline / secondary / ghost / link; sm / default / lg / icon |
| `Card` | 기본 래퍼 |
| `Badge` | 태그 표시용 |
| `Input` / `Textarea` | 공통 인풋 스타일 |
| `RatingStars` | 인터랙티브 5점 별점, hover preview |
| `ThemeToggle` | 라이트/다크 토글 |
| `RecipeCard` | 레시피 카드 + `.Skeleton` 로딩 상태 |
| `BrewingStep` | done / active / upcoming 3-state indicator |
| `PageHeader` | 스티키 헤더 + 뒤로가기 |
| `BottomNav` | 하단 4탭 네비게이션 |

---

## 4. 정보 구조 (Information Architecture)

```
/ (피드)
├── /recipes/[id]         레시피 상세
│   └── /timer/[id]       브루잉 타이머
├── /calendar             캘린더
│   └── /notes/[date]     데일리 노트
├── /me/recipes           내 레시피 (예정)
└── /settings             설정 (예정)
```

**Bottom Navigation (4탭)**

| Tab | Route | Icon |
|-----|-------|------|
| 피드 | `/` | Feed |
| 캘린더 | `/calendar` | Calendar |
| 내 레시피 | `/me/recipes` | BookOpen |
| 설정 | `/settings` | Settings |

---

## 5. 기능 요구사항 (Functional Requirements)

### 5.1 피드 (Feed) — `/`

**목적**: 커뮤니티 레시피를 탐색하고 마음에 드는 레시피를 발견한다.

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| F-01 | 레시피 카드 목록을 무한 스크롤로 표시 | P0 |
| F-02 | 각 카드: 제목, 원두, 원산지, 배전도, 레시피 작성자, 좋아요 수, 태그 표시 | P0 |
| F-03 | 커서 기반 페이지네이션 (`cursor` 파라미터) | P0 |
| F-04 | 좋아요 버튼 (즉시 낙관적 업데이트) | P0 |
| F-05 | 카드 스켈레톤 로딩 상태 | P1 |
| F-06 | 카드 클릭 시 레시피 상세로 이동 | P0 |
| F-07 | 검색 기능 | P2 |
| F-08 | 태그 필터링 | P2 |

**API**
```
GET /recipes?limit=10&cursor={cursor}
POST /recipes/{id}/like
```

---

### 5.2 레시피 상세 (Recipe Detail) — `/recipes/[id]`

**목적**: 레시피 전체 스펙을 확인하고, 타이머를 시작하거나 코멘트를 남긴다.

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| R-01 | 레시피 기본 정보: 제목, 설명, 원두, 원산지, 배전도, 분쇄도, 커피량(g), 물량(g), 수온(°C), 추출량(ml) | P0 |
| R-02 | 단계별 브루잉 스텝 목록 (순서, 레이블, 시간, 물량) | P0 |
| R-03 | 좋아요 버튼 (토글) | P0 |
| R-04 | "브루잉 시작" 버튼 → 타이머 페이지 이동 | P0 |
| R-05 | 코멘트 목록 (접기/펼치기) | P1 |
| R-06 | 코멘트 작성 (Enter 제출) | P1 |
| R-07 | 태그 뱃지 표시 | P1 |

**API**
```
GET /recipes/{id}
GET /recipes/{id}/comments
POST /recipes/{id}/comments
POST /recipes/{id}/like
```

---

### 5.3 브루잉 타이머 (Brewing Timer) — `/timer/[id]`

**목적**: 레시피 단계를 따라가며 정확한 시간에 물을 붓는다. 시각적 피드백으로 몰입감을 높인다.

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| T-01 | 현재 단계 표시 (레이블, 물량, 남은 시간) | P0 |
| T-02 | 카운트다운 타이머 (60fps RAF 기반) | P0 |
| T-03 | 시작 / 일시정지 / 재개 / 다음 단계 컨트롤 | P0 |
| T-04 | SVG 일러스트: V60 드리퍼 + Hario 서버 | P1 |
| T-05 | 서버 커피 레벨 — **총 물량 대비 누적 물량 비율** 기반 상승 (step마다 리셋 없음) | P1 |
| T-06 | 물방울 낙하 애니메이션 (브루잉 중) | P1 |
| T-07 | 파도(wave) 표면 애니메이션 | P1 |
| T-08 | Bloom 효과 — 첫 단계(뜸들이기)에서 CO2 거품 + 돔 팽창 | P2 |
| T-09 | 배전도(roastLevel)에 따라 Bloom 강도 조절 | P2 |
| T-10 | 브루잉 완료 시 타이머 로그 자동 저장 | P0 |
| T-11 | 완료 화면: "오늘의 노트 보기" / "레시피로 돌아가기" | P0 |
| T-12 | 단계 목록 (done/active/upcoming 상태 인디케이터) | P1 |

**타이머 로직**
```
totalWater  = Σ step.waterAmount (null → 0)
globalFill  = (cumulativeWater + currentStepWater × p) / totalWater
         p  = elapsed / stepDuration  (0 → 1)
```
- `totalWater == 0` fallback: `globalFill = p`

**API**
```
GET /recipes/{id}
POST /timer/log  { recipeId, recipeName, startedAt, completedAt }
```

---

### 5.4 캘린더 (Calendar) — `/calendar`

**목적**: 내가 커피를 기록한 날을 월별로 한눈에 확인한다.

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| C-01 | 현재 월 달력 표시 (7열 그리드) | P0 |
| C-02 | 노트가 있는 날짜에 시각적 표시 (dot 또는 하이라이트) | P0 |
| C-03 | 이전/다음 달 네비게이션 (슬라이드 애니메이션) | P0 |
| C-04 | 날짜 클릭 → 해당 날의 노트 페이지 이동 | P0 |
| C-05 | 오늘 날짜 강조 | P1 |

**API**
```
GET /calendar?year={YYYY}&month={M}
```

---

### 5.5 데일리 노트 (Daily Note) — `/notes/[date]`

**목적**: 오늘 마신 커피 한 잔을 기록하고 평가한다.

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| N-01 | 날짜별 노트 조회/생성/수정 | P0 |
| N-02 | 자유 텍스트 입력 (자동 확장 textarea) | P0 |
| N-03 | 5점 별점 평가 (hover 미리보기) | P0 |
| N-04 | 저장 버튼 + 저장 완료 피드백 | P0 |
| N-05 | 타이머 로그 타임라인 (해당 날 브루잉 기록 목록) | P1 |
| N-06 | 오늘 날짜가 아닌 과거 기록도 수정 가능 | P1 |

**API**
```
GET /notes?date={YYYY-MM-DD}
PUT /notes/{date}  { content, rating }
```

---

### 5.6 내 레시피 — `/me/recipes` _(예정)_

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| M-01 | 내가 작성한 레시피 목록 | P1 |
| M-02 | 레시피 생성 폼 | P1 |
| M-03 | 레시피 수정/삭제 | P2 |

---

### 5.7 설정 — `/settings` _(예정)_

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| S-01 | 라이트/다크 모드 전환 | P0 |
| S-02 | 로그인/로그아웃 | P1 |
| S-03 | 프로필 편집 | P2 |

---

## 6. 비기능 요구사항 (Non-Functional Requirements)

### 6.1 Performance

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| 타이머 RAF 프레임 드롭 | 0 (60fps 유지) |
| API 응답 시간 | < 300ms (P95) |

### 6.2 Accessibility

- **WCAG 2.1 AA** 준수
- 모든 인터랙티브 요소에 ARIA label
- 키보드 네비게이션 지원 (Tab, Enter)
- 색상 대비비 4.5:1 이상

### 6.3 Responsiveness

| Breakpoint | Target Width |
|------------|-------------|
| Mobile (primary) | 320px – 480px |
| Tablet | 481px – 768px |
| Desktop | 769px+ |

### 6.4 Browser Support

- iOS Safari 16+
- Android Chrome 110+
- Desktop Chrome/Firefox/Edge 최신 2버전

### 6.5 Security

- Bearer Token 인증 (localStorage)
- 모든 API 요청에 `Authorization: Bearer {token}` 헤더
- 401 응답 시 로그인 페이지 리다이렉트 (미구현, P1)

---

## 7. 애니메이션 명세 (Animation Specification)

### 7.1 Page Transitions
```
Trigger: 페이지 이동
Enter: opacity 0→1, y +12→0, duration 0.22s, ease
Exit: opacity 1→0, y 0→-8, duration 0.15s, ease
```

### 7.2 브루잉 타이머 SVG 애니메이션

```css
/* 물 파도 */
@keyframes wave-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
  duration: 1.9s, linear, infinite
}

/* 물방울 낙하 */
@keyframes drop-fall {
  0%   { transform: translateY(-8px) scaleY(0.7); opacity: 0; }
  18%  { opacity: 1; }
  75%  { opacity: 0.85; }
  100% { transform: translateY(18px) scaleY(1.3); opacity: 0; }
  duration: 1.3s, ease-in, 3개 drop 0/0.43/0.87s offset
}

/* Bloom 거품 상승 */
@keyframes bloom-rise {
  0%   { transform: translateY(0) scale(1);    opacity: 0.6; }
  100% { transform: translateY(-28px) scale(1.6); opacity: 0; }
  duration: 1.6–2.4s per bubble
}

/* Bloom 돔 팽창 */
@keyframes bloom-dome {
  0%, 100% { transform: scale(1);    opacity: 0.25; }
  50%       { transform: scale(1.25); opacity: 0.45; }
  duration: 2.2s, ease-in-out, infinite
}
```

### 7.3 Framer Motion 주요 사용처

| 위치 | 효과 |
|------|------|
| 피드 카드 | staggerChildren 0.06s, fade+slideUp |
| 타이머 카운트다운 | scale 0.85→1 on step change |
| 타이머 단계 인디케이터 | layoutId "step-active-bar" spring |
| 캘린더 월 전환 | x ±100%, opacity 0→1 |
| 코멘트 펼치기 | height 0→auto AnimatePresence |
| 완료 화면 | spring bounce scale |

---

## 8. API 명세 (API Reference)

### Base URL
```
process.env.NEXT_PUBLIC_API_URL  (기본값: http://localhost:8080)
```

### Authentication
```http
Authorization: Bearer {accessToken}
```
`accessToken`은 `localStorage.accessToken`에서 읽음.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/recipes` | 레시피 피드 (cursor-based) |
| GET | `/recipes/{id}` | 레시피 상세 |
| POST | `/recipes/{id}/like` | 좋아요 토글 |
| GET | `/recipes/{id}/comments` | 코멘트 목록 |
| POST | `/recipes/{id}/comments` | 코멘트 작성 |
| GET | `/calendar` | 달력 노트 날짜 목록 |
| GET | `/notes` | 날짜별 노트 조회 |
| PUT | `/notes/{date}` | 노트 저장/수정 |
| POST | `/timer/log` | 브루잉 완료 로그 저장 |

### Response Types (Frontend Interface)

```typescript
interface RecipeStep {
  stepOrder: number
  label: string
  duration: number       // 초
  waterAmount: number | null  // ml
}

interface Recipe {
  id: number
  title: string
  description: string
  coffeeBean: string
  origin: string
  roastLevel: string
  grinder: string
  grindSize: string
  coffeeGrams: number
  waterGrams: number
  waterTemp: number
  targetYield: number
  steps: RecipeStep[]
  tags: string[]
  likeCount: number
  publishedAt: string
}

interface Note {
  date: string
  content: string
  rating: number | null
  timerLogs: TimerLog[]
}

interface TimerLog {
  id: number
  recipeId: number
  recipeName: string
  startedAt: string
  completedAt: string
}
```

---

## 9. 파일 구조 (File Structure)

```
coffee-zip-fe/
├── app/
│   ├── globals.css          # 디자인 토큰, CSS 애니메이션 keyframes
│   ├── layout.tsx           # Root layout (BottomNav 포함)
│   ├── template.tsx         # 페이지 전환 애니메이션
│   ├── providers.tsx        # ThemeProvider
│   ├── page.tsx             # 피드
│   ├── calendar/page.tsx    # 캘린더
│   ├── notes/[date]/page.tsx
│   ├── recipes/[id]/page.tsx
│   └── timer/[id]/page.tsx
├── components/
│   ├── layout/
│   │   ├── bottom-nav.tsx
│   │   └── page-header.tsx
│   ├── brewing/
│   │   ├── recipe-card.tsx
│   │   └── brewing-step.tsx
│   └── ui/
│       ├── button.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── separator.tsx
│       ├── rating-stars.tsx
│       └── theme-toggle.tsx
├── lib/
│   ├── api.ts               # apiFetch wrapper
│   └── utils.ts             # cn()
└── docs/
    ├── PRD.md               # 이 문서
    └── plans/
        └── 2026-03-09-ui-overhaul.md
```

---

## 10. 우선순위 로드맵 (Roadmap)

### MVP (현재)
- [x] 피드 — 레시피 목록 + 무한스크롤
- [x] 레시피 상세 — 스펙 + 단계 + 코멘트
- [x] 브루잉 타이머 — 단계별 타이머 + SVG 일러스트
- [x] 캘린더 — 월별 노트 날짜 표시
- [x] 데일리 노트 — 텍스트 + 별점 + 타이머 로그
- [x] 다크모드

### Phase 2
- [ ] 인증 — 로그인/회원가입/토큰 갱신
- [ ] 내 레시피 — CRUD
- [ ] 레시피 검색 + 태그 필터
- [ ] 설정 페이지
- [ ] 401 인터셉터 → 자동 로그인 리다이렉트

### Phase 3
- [ ] 레시피 저장(북마크)
- [ ] 팔로우 피드 vs 전체 피드
- [ ] 브루잉 통계 (원두별, 날짜별)
- [ ] PWA — 오프라인 타이머 지원
- [ ] 원두 바코드 스캔

---

## 11. 알려진 이슈 (Known Issues)

| ID | Issue | Priority |
|----|-------|---------|
| KI-01 | Framer Motion `backgroundColor: 'hsl(var(--primary) / 0.06)'` animatable color 경고 | Low |
| KI-02 | `POST /timer/log` 401 Unauthorized — 인증 토큰 미설정 환경에서 로그 저장 실패 | Medium |
| KI-03 | `/me/recipes`, `/settings` 라우트 미구현 (탭은 존재) | Medium |
| KI-04 | 타이머 SVG — Bloom 애니메이션이 밝은 배경 cone 안에서 시각적으로 뚜렷하지 않음 | Low |
