# Equipment & Bean Catalog Design

## Overview

Three shared global catalogs — **Bean (원두)**, **Dripper (드리퍼)**, **Grinder (그라인더)** — that any logged-in user can contribute to. Catalog items link to recipes via logical FKs (ID columns, no DB constraints). Each item has a detail page with structured reviews.

---

## Decisions Made

| Question | Decision |
|---|---|
| Ownership | Global shared catalog — all users share one catalog |
| Who can add | Any logged-in user |
| Recipe field migration | Free-text `coffeeBean`/`grinder` replaced by `beanId`/`grinderId` Long FK; `dripper` field added as `dripperId` |
| FK style | Logical only — ID column stored, no DB FK constraints (consistent with existing codebase) |
| Review format | Star rating (1–5) + text + optional structured tasting attributes per type |
| Discovery | Dedicated catalog page in bottom nav — tabbed (원두 / 드리퍼 / 그라인더) with search within each tab |
| Phase | Phase 1: Bean → Phase 2: Dripper → Phase 3: Grinder |

---

## Phase 1: Bean Catalog

### 1. Data Model

#### Backend Entity: `Bean`

| Field | Type | Notes |
|---|---|---|
| id | Long | PK, auto-increment |
| name | String(200) | 상품명 e.g. "예가체프 G1" |
| roastery | String(200) | 로스터리 e.g. "블루보틀 커피" |
| origin | String(100) | 원산지 국가 e.g. "에티오피아" |
| region | String(100) | 세부 지역 e.g. "예가체프" (optional) |
| farm | String(200) | 농장명 (optional) |
| variety | String(100) | 품종 e.g. "게이샤", "버번", "SL28", "카투라" (optional) |
| processing | String(50) | 가공 방식: Natural / Washed / Honey / Anaerobic (optional) |
| roastLevel | String(50) | Light / Medium-Light / Medium / Medium-Dark / Dark |
| altitude | Int? | 재배 고도 (m, optional) |
| harvestYear | Int? | 수확 연도 (optional) |
| description | TEXT? | 자유 텍스트 설명 |
| createdBy | Long | memberId of creator |
| createdAt | LocalDateTime | |
| updatedAt | LocalDateTime | updated on PUT |

`processing` and `roastLevel` are validated against the allowed enum values listed above at the API layer (400 if invalid).

#### Flavor Notes

Stored as a separate table `bean_flavor_note(bean_id BIGINT, note VARCHAR(50))` with composite PK `(bean_id, note)` — no surrogate key needed. Modeled as `@ElementCollection` on `Bean` in Quarkus/Panache (avoids the need for a separate Panache entity). This is the standard Panache pattern for simple string collections.

```kotlin
@ElementCollection
@CollectionTable(name = "bean_flavor_note", joinColumns = [JoinColumn(name = "bean_id")])
@Column(name = "note", length = 50)
var flavorNotes: MutableList<String> = mutableListOf()
```

#### Backend Entity: `BeanReview`

| Field | Type | Notes |
|---|---|---|
| id | Long | PK, auto-increment |
| beanId | Long | logical FK |
| memberId | Long | logical FK |
| rating | Int | 1–5 (required) |
| content | TEXT? | 텍스트 리뷰 (optional, but rating is required) |
| acidity | Int? | 산미 1–5 (optional) |
| sweetness | Int? | 단맛 1–5 (optional) |
| body | Int? | 바디감 1–5 (optional) |
| aroma | Int? | 향 1–5 (optional) |
| createdAt | LocalDateTime | set on first create, not updated |
| updatedAt | LocalDateTime | set on every upsert |

DB constraint: `UNIQUE(bean_id, member_id)` — one review per member per bean.

**Upsert semantics**: `POST /beans/{id}/reviews` uses find-then-update:
- If no review exists for `(beanId, memberId)` → INSERT new row, return 201
- If review exists → UPDATE in place (same `id`, same `createdAt`, new `updatedAt`), return 200
- The `DELETE` endpoint identifies a review by `reviewId` (the stable surrogate PK)

#### Recipe Entity Changes

**Remove fields**: `coffeeBean: String?`, `origin: String?`, `roastLevel: String?`
**Add field**: `beanId: Long?` (nullable — recipes without a linked bean are valid)

`grindSize: String?` stays (per-brew adjustment value, not a Grinder property).

**DB Migration (executed in order)**:

```sql
-- Step 1: create catalog tables
CREATE TABLE bean (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  roastery VARCHAR(200) NOT NULL,
  origin VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  farm VARCHAR(200),
  variety VARCHAR(100),
  processing VARCHAR(50),
  roast_level VARCHAR(50) NOT NULL,
  altitude INT,
  harvest_year INT,
  description TEXT,
  created_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE bean_flavor_note (
  bean_id BIGINT NOT NULL,
  note VARCHAR(50) NOT NULL,
  PRIMARY KEY (bean_id, note)
);

CREATE TABLE bean_review (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  bean_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  rating INT NOT NULL,
  content TEXT,
  acidity INT,
  sweetness INT,
  body INT,
  aroma INT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_bean_review (bean_id, member_id)
);

-- Step 2: add beanId to recipe
ALTER TABLE recipe ADD COLUMN bean_id BIGINT NULL;

-- Step 3: best-effort data migration — create a Bean entry for each distinct
-- coffeeBean value and back-fill bean_id on recipe rows.
-- Recipes with NULL coffeeBean get NULL bean_id.
-- origin and roastLevel from the first recipe row with that bean name are used.
-- (Implemented in a Flyway Java migration or a one-off script; not a pure SQL migration
--  due to the auto-increment PK requirement.)

-- Step 4: drop old free-text columns after migration is verified
ALTER TABLE recipe
  DROP COLUMN coffee_bean,
  DROP COLUMN origin,
  DROP COLUMN roast_level;
```

Step 3 is implemented as a Flyway Java/Kotlin migration class (not SQL) to handle the INSERT + UPDATE sequence with auto-increment PKs cleanly.

---

### 2. API Endpoints

#### Bean CRUD

```
GET  /beans?q=&origin=&roastLevel=&page=0&size=20   # 검색/목록
POST /beans                                          # 신규 등록 (인증 필요)
GET  /beans/{id}                                     # 상세
PUT  /beans/{id}                                     # 수정 (등록자만)
```

**Authorization on `PUT /beans/{id}`**: If the caller's memberId ≠ bean.createdBy → return `403 Forbidden` with body `{"error": "only the creator can edit this entry"}`. No admin override in Phase 1.

#### Bean Reviews

```
GET    /beans/{id}/reviews?page=0&size=20   # 리뷰 목록
POST   /beans/{id}/reviews                  # 리뷰 등록/수정 (인증 필요, upsert — see semantics above)
DELETE /beans/{id}/reviews/{reviewId}       # 삭제 (작성자만, 403 if not owner)
```

#### Response Shapes

**`BeanListResponse`** (GET /beans — list item):
```json
{
  "id": 1,
  "name": "예가체프 G1",
  "roastery": "블루보틀 커피",
  "origin": "에티오피아",
  "roastLevel": "Light",
  "flavorNotes": ["블루베리", "자스민"],
  "avgRating": 4.8,
  "reviewCount": 24
}
```

Note: `recipeCount` is **NOT** included in the list response (avoids N+1 joins). It appears only on the detail response.

**`BeanResponse`** (GET /beans/{id} — detail):
```json
{
  "id": 1,
  "name": "예가체프 G1",
  "roastery": "블루보틀 커피",
  "origin": "에티오피아",
  "region": "예가체프",
  "farm": null,
  "variety": "게이샤",
  "processing": "Washed",
  "roastLevel": "Light",
  "altitude": 1900,
  "harvestYear": 2024,
  "description": "...",
  "flavorNotes": ["블루베리", "자스민", "레몬그라스"],
  "avgRating": 4.8,
  "reviewCount": 24,
  "recipeCount": 41,
  "avgAcidity": 4.3,
  "avgSweetness": 3.5,
  "avgBody": 2.3,
  "avgAroma": 4.1,
  "createdBy": 7,
  "createdAt": "2026-03-16T10:00:00"
}
```

`recipeCount` is computed via `Recipe.count("beanId = ?1", id)` — acceptable single query on detail endpoint.

Avg tasting fields (avgAcidity etc.) are computed only when ≥ 3 reviews include that structured field; otherwise `null`.

**`BeanSummary`** (embedded in RecipeResponse):
```json
{
  "id": 1,
  "name": "예가체프 G1",
  "roastery": "블루보틀 커피",
  "origin": "에티오피아",
  "roastLevel": "Light",
  "flavorNotes": ["블루베리", "자스민"]
}
```

**Feed N+1 mitigation**: The feed endpoint (`GET /recipes`) batch-loads BeanSummary for all unique `beanId` values in the result page in a single `Bean.list("id IN :ids", ...)` query, then maps summaries into recipe responses in memory. `@ElementCollection` flavor notes are loaded eagerly with the bean (single join in Panache).

**`RecipeResponse` change**: remove `coffeeBean`, `origin`, `roastLevel` fields; add `bean: BeanSummary?`.

**`BeanReviewResponse`**:
```json
{
  "id": 1,
  "memberId": 3,
  "nickname": "졸린 수달",
  "rating": 5,
  "content": "자스민 향이 정말 선명해요.",
  "acidity": 5,
  "sweetness": 3,
  "body": 2,
  "aroma": 5,
  "createdAt": "2026-03-16T12:00:00",
  "updatedAt": "2026-03-16T14:30:00"
}
```

---

### 3. Recipe Integration

**Backend files to modify**:
- `recipe/RecipeDtos.kt` — remove `coffeeBean`/`origin`/`roastLevel` from request/response; add `beanId: Long?` to requests, `bean: BeanSummary?` to responses
- `recipe/RecipeService.kt` — batch-load BeanSummary when building feed response
- `entity/Recipe.kt` — remove `coffeeBean`/`origin`/`roastLevel` fields; add `beanId: Long?`

**Frontend files to modify**:
- `app/me/recipes/new/page.tsx` — remove coffeeBean/origin/roastLevel form fields; add BeanSearchField component
- `app/me/recipes/[id]/edit/page.tsx` — **this file does not yet exist and must be created** as part of this feature. Use `new/page.tsx` as the structural template, apply the same BeanSearchField changes, and wire it to `PUT /me/recipes/{id}`.
- `app/page.tsx` (feed) — update Recipe interface, replace coffeeBean/origin/roastLevel display with bean.name / bean.roastLevel / bean.flavorNotes
- `components/brewing/recipe-card.tsx` — update props/display for bean summary

---

### 4. Frontend Pages

#### Navigation
Add "카탈로그" tab to bottom nav (between 캘린더 and 내 레시피). Route: `/catalog`

#### `/catalog` — Catalog Index
- Top tabs: **원두** / 드리퍼 / 그라인더 (드리퍼·그라인더 tabs shown but disabled, tooltip "Coming soon")
- Search bar within the 원두 tab (calls `GET /beans?q=`)
- Filter chips: origin, roastLevel
- Bean list: `BeanListResponse` cards — name, roastery, origin + roastLevel, flavor note tags, avg rating + review count
- FAB "+ 원두 등록" (로그인 유저만 visible)

#### `/catalog/beans/new` — Bean Registration Form
Required fields: name, roastery, origin, roastLevel (select)
Optional fields: region, farm, variety, processing (select), altitude, harvestYear, flavorNotes (tag input), description

#### `/catalog/beans/[id]` — Bean Detail
- Header: name, roastery, origin/region, roastLevel
- Stats row: avg rating, review count, recipe count
- Attribute chips: variety, processing, altitude
- Flavor notes tags (amber colored)
- Average tasting bars: acidity / sweetness / body / aroma (only rendered if ≥ 3 reviews have that field)
- Reviews list (paginated, 10 per page)
- "리뷰 작성" / "리뷰 수정" button (if logged in)
- "이 원두로 만든 레시피" section — deferred to Phase 1.5 / future enhancement; not in MVP

#### `/catalog/beans/[id]/review` — Review Form
- Star rating selector (1–5, required)
- Text area (optional)
- Optional structured section: acidity / sweetness / body / aroma sliders (1–5), shown collapsed with "테이스팅 노트 추가" toggle
- Submit → POST (upsert)

#### Recipe Create/Edit Form Changes (`app/me/recipes/new/page.tsx` and `app/me/recipes/[id]/edit/page.tsx`)
- Remove: coffeeBean text input, origin text input, roastLevel select
- Add: `BeanSearchField` component
  - Debounced search input → calls `GET /beans?q=` → dropdown with results
  - Select item → stores `beanId`, displays chip with bean name + roastery
  - Clear button on chip to unlink
  - "카탈로그에 없으면 등록 →" link at bottom of dropdown opens `/catalog/beans/new` in a new tab
  - beanId is nullable — recipe can be saved without linking a bean

---

## Phase 2: Dripper Catalog (future — spec written when Phase 1 ships)

Recipe will gain `dripperId: Long?` column. Dripper entity fields and review attributes to be specified then.

## Phase 3: Grinder Catalog (future — spec written when Phase 2 ships)

Recipe `grinder: String?` → `grinderId: Long?`. Grinder entity fields and review attributes to be specified then.

---

## File Structure

### Backend (`coffee-zip`)
```
src/main/kotlin/org/coffeezip/
├── entity/
│   ├── Bean.kt            (new — includes @ElementCollection flavorNotes)
│   ├── BeanReview.kt      (new)
│   └── Recipe.kt          (modified — beanId replaces coffeeBean/origin/roastLevel)
├── bean/
│   ├── BeanResource.kt    (new)
│   ├── BeanService.kt     (new)
│   ├── BeanRepository.kt  (new)
│   └── BeanDtos.kt        (new)
└── recipe/
    ├── RecipeDtos.kt      (modified — BeanSummary added, old fields removed)
    └── RecipeService.kt   (modified — batch BeanSummary loading)
src/main/resources/db/migration/
    └── V{n}__bean_catalog.sql + V{n+1}__bean_data_migration.kt  (Flyway)
```

### Frontend (`coffee-zip-fe`)
```
app/
├── catalog/
│   ├── page.tsx                        (catalog index — bean tab active)
│   ├── beans/
│   │   ├── new/page.tsx                (bean registration)
│   │   └── [id]/
│   │       ├── page.tsx                (bean detail)
│   │       └── review/page.tsx         (review form)
components/
├── catalog/
│   ├── bean-card.tsx                   (list item card)
│   ├── bean-search-field.tsx           (used in recipe create/edit)
│   └── tasting-bar.tsx                 (avg tasting visualization)
```

---

## Deployment Order

To avoid a breaking window where the frontend renders `undefined` for bean fields:

1. Deploy backend **with** `bean_id` column and new `BeanSummary` in `RecipeResponse`, but **without** the Step 4 column drops yet. The response includes both old fields (`coffeeBean` etc.) and new `bean` field simultaneously.
2. Deploy frontend — updates interfaces to use `bean` field.
3. Verify feed/recipe pages render correctly.
4. Run Step 4 `ALTER TABLE recipe DROP COLUMN ...` to remove old columns.

This minimizes the cutover risk without requiring a feature flag.

---

## Out of Scope (MVP)

- Admin curation / moderation of catalog entries
- Duplicate detection / merge
- Image upload for catalog items
- "이 원두로 만든 레시피" section on bean detail page
- Auto-link bean after creating from within recipe form
- Dripper / Grinder implementation (Phase 2/3)
