# Bean Catalog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared global Bean catalog with search, detail pages, and reviews, replacing free-text coffeeBean/origin/roastLevel fields in recipes with a logical FK to the catalog.

**Architecture:** Backend-first approach — new Bean/BeanReview entities + REST API in Quarkus/Kotlin, then Recipe entity migration (add beanId, remove free-text fields), then frontend catalog pages + recipe form updates. No Flyway; Hibernate `update` mode handles new columns in dev, and SQL scripts are provided for production column drops.

**Tech Stack:** Quarkus 3.x + Kotlin + Panache (active record) + Jakarta REST | Next.js 14 App Router + TypeScript + Tailwind CSS

---

## Repo layout

- Backend: `/Users/minseok/Documents/GitHub/coffee-zip`
- Frontend: `/Users/minseok/Documents/GitHub/coffee-zip-fe`
- Run backend: `cd /Users/minseok/Documents/GitHub/coffee-zip && ./mvnw quarkus:dev`
- Run frontend: `cd /Users/minseok/Documents/GitHub/coffee-zip-fe && npm run dev`
- Run backend tests: `./mvnw test`

---

## Chunk 1: Backend — Bean Catalog Core

### Task 1: Bean + BeanReview Entities

**Files:**
- Create: `src/main/kotlin/org/coffeezip/entity/Bean.kt`
- Create: `src/main/kotlin/org/coffeezip/entity/BeanReview.kt`

- [ ] **Step 1: Create `Bean.kt`**

```kotlin
// src/main/kotlin/org/coffeezip/entity/Bean.kt
package org.coffeezip.entity

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "bean")
class Bean : PanacheEntityBase {

    @get:Id
    @get:GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @get:Column(nullable = false, length = 200)
    var name: String = ""

    @get:Column(nullable = false, length = 200)
    var roastery: String = ""

    @get:Column(nullable = false, length = 100)
    var origin: String = ""

    @get:Column(length = 100)
    var region: String? = null

    @get:Column(length = 200)
    var farm: String? = null

    @get:Column(length = 100)
    var variety: String? = null

    @get:Column(length = 50)
    var processing: String? = null   // Natural / Washed / Honey / Anaerobic

    @get:Column(name = "roast_level", nullable = false, length = 50)
    var roastLevel: String = ""      // Light / Medium-Light / Medium / Medium-Dark / Dark

    var altitude: Int? = null

    @get:Column(name = "harvest_year")
    var harvestYear: Int? = null

    @get:Column(columnDefinition = "TEXT")
    var description: String? = null

    @get:ElementCollection(fetch = FetchType.EAGER)
    @get:CollectionTable(name = "bean_flavor_note", joinColumns = [JoinColumn(name = "bean_id")])
    @get:Column(name = "note", length = 50)
    var flavorNotes: MutableList<String> = mutableListOf()

    @get:Column(name = "created_by", nullable = false)
    var createdBy: Long = 0

    @get:Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()

    @get:Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
}
```

- [ ] **Step 2: Create `BeanReview.kt`**

```kotlin
// src/main/kotlin/org/coffeezip/entity/BeanReview.kt
package org.coffeezip.entity

import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "bean_review",
    uniqueConstraints = [UniqueConstraint(columnNames = ["bean_id", "member_id"])]
)
class BeanReview : PanacheEntityBase {

    @get:Id
    @get:GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @get:Column(name = "bean_id", nullable = false)
    var beanId: Long = 0

    @get:Column(name = "member_id", nullable = false)
    var memberId: Long = 0

    @get:Column(nullable = false)
    var rating: Int = 0    // 1–5

    @get:Column(columnDefinition = "TEXT")
    var content: String? = null

    var acidity: Int? = null    // 1–5
    var sweetness: Int? = null  // 1–5
    var body: Int? = null       // 1–5
    var aroma: Int? = null      // 1–5

    @get:Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()

    @get:Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
}
```

- [ ] **Step 3: Start dev server to verify entities compile and tables are auto-created**

```bash
cd /Users/minseok/Documents/GitHub/coffee-zip
./mvnw quarkus:dev -Dquarkus.log.level=WARN 2>&1 | head -20
```

Expected: Quarkus starts without errors. Hibernate creates `bean`, `bean_flavor_note`, `bean_review` tables in dev DB.

- [ ] **Step 4: Commit**

```bash
cd /Users/minseok/Documents/GitHub/coffee-zip
git add src/main/kotlin/org/coffeezip/entity/Bean.kt \
        src/main/kotlin/org/coffeezip/entity/BeanReview.kt
git commit -m "feat: add Bean and BeanReview entities"
```

---

### Task 2: BeanDtos

**Files:**
- Create: `src/main/kotlin/org/coffeezip/bean/BeanDtos.kt`

- [ ] **Step 1: Create `BeanDtos.kt`**

```kotlin
// src/main/kotlin/org/coffeezip/bean/BeanDtos.kt
package org.coffeezip.bean

// ── Request DTOs ──────────────────────────────────────────────

data class CreateBeanRequest(
    val name: String,
    val roastery: String,
    val origin: String,
    val roastLevel: String,
    val region: String? = null,
    val farm: String? = null,
    val variety: String? = null,
    val processing: String? = null,
    val altitude: Int? = null,
    val harvestYear: Int? = null,
    val description: String? = null,
    val flavorNotes: List<String> = emptyList()
)

data class UpdateBeanRequest(
    val name: String,
    val roastery: String,
    val origin: String,
    val roastLevel: String,
    val region: String? = null,
    val farm: String? = null,
    val variety: String? = null,
    val processing: String? = null,
    val altitude: Int? = null,
    val harvestYear: Int? = null,
    val description: String? = null,
    val flavorNotes: List<String> = emptyList()
)

data class CreateBeanReviewRequest(
    val rating: Int,           // 1–5, required
    val content: String? = null,
    val acidity: Int? = null,
    val sweetness: Int? = null,
    val body: Int? = null,
    val aroma: Int? = null
)

// ── Response DTOs ─────────────────────────────────────────────

data class BeanListItem(
    val id: Long,
    val name: String,
    val roastery: String,
    val origin: String,
    val roastLevel: String,
    val flavorNotes: List<String>,
    val avgRating: Double?,
    val reviewCount: Long
)

data class BeanResponse(
    val id: Long,
    val name: String,
    val roastery: String,
    val origin: String,
    val region: String?,
    val farm: String?,
    val variety: String?,
    val processing: String?,
    val roastLevel: String,
    val altitude: Int?,
    val harvestYear: Int?,
    val description: String?,
    val flavorNotes: List<String>,
    val avgRating: Double?,
    val reviewCount: Long,
    val recipeCount: Long,
    val avgAcidity: Double?,
    val avgSweetness: Double?,
    val avgBody: Double?,
    val avgAroma: Double?,
    val createdBy: Long,
    val createdAt: String
)

// Embedded in RecipeResponse (kept minimal for feed performance)
data class BeanSummary(
    val id: Long,
    val name: String,
    val roastery: String,
    val origin: String,
    val roastLevel: String,
    val flavorNotes: List<String>
)

data class BeanReviewResponse(
    val id: Long,
    val memberId: Long,
    val nickname: String,
    val rating: Int,
    val content: String?,
    val acidity: Int?,
    val sweetness: Int?,
    val body: Int?,
    val aroma: Int?,
    val createdAt: String,
    val updatedAt: String
)

data class BeanReviewListResponse(
    val items: List<BeanReviewResponse>,
    val total: Long
)
```

- [ ] **Step 2: Commit**

```bash
git add src/main/kotlin/org/coffeezip/bean/BeanDtos.kt
git commit -m "feat: add Bean DTOs"
```

---

### Task 3: BeanRepository + BeanService

**Files:**
- Create: `src/main/kotlin/org/coffeezip/bean/BeanRepository.kt`
- Create: `src/main/kotlin/org/coffeezip/bean/BeanService.kt`

- [ ] **Step 1: Write the failing test**

```kotlin
// src/test/kotlin/org/coffeezip/BeanServiceTest.kt
package org.coffeezip

import io.quarkus.test.junit.QuarkusTest
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import org.coffeezip.bean.BeanService
import org.coffeezip.bean.CreateBeanRequest
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

@QuarkusTest
class BeanServiceTest {

    @Inject
    lateinit var beanService: BeanService

    @Test
    @io.quarkus.test.TestTransaction
    fun `createBean stores all fields and flavorNotes`() {
        val req = CreateBeanRequest(
            name = "예가체프 G1",
            roastery = "블루보틀",
            origin = "에티오피아",
            roastLevel = "Light",
            region = "예가체프",
            flavorNotes = listOf("블루베리", "자스민")
        )
        val result = beanService.createBean(memberId = 1L, req = req)

        assertEquals("예가체프 G1", result.name)
        assertEquals("에티오피아", result.origin)
        assertEquals(2, result.flavorNotes.size)
        assertNotNull(result.id)
    }

    @Test
    @io.quarkus.test.TestTransaction
    fun `searchBeans returns matching beans by name`() {
        beanService.createBean(1L, CreateBeanRequest("테스트원두", "테스트로스터리", "콜롬비아", "Medium"))
        val results = beanService.searchBeans(q = "테스트원두")
        assertTrue(results.isNotEmpty())
        assertEquals("테스트원두", results[0].name)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./mvnw test -Dtest=BeanServiceTest -pl . 2>&1 | tail -20
```

Expected: FAIL — `BeanService` not found

- [ ] **Step 3: Create `BeanRepository.kt`**

```kotlin
// src/main/kotlin/org/coffeezip/bean/BeanRepository.kt
package org.coffeezip.bean

import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import org.coffeezip.entity.Bean
import org.coffeezip.entity.BeanReview

@ApplicationScoped
class BeanRepository {

    @Inject
    lateinit var em: EntityManager

    fun searchBeans(q: String?, origin: String?, roastLevel: String?, page: Int, size: Int): List<Bean> {
        val sb = StringBuilder("SELECT b FROM Bean b WHERE 1=1")
        if (!q.isNullOrBlank()) sb.append(" AND (LOWER(b.name) LIKE LOWER(:q) OR LOWER(b.roastery) LIKE LOWER(:q))")
        if (!origin.isNullOrBlank()) sb.append(" AND b.origin = :origin")
        if (!roastLevel.isNullOrBlank()) sb.append(" AND b.roastLevel = :roastLevel")
        sb.append(" ORDER BY b.createdAt DESC")

        val query = em.createQuery(sb.toString(), Bean::class.java)
        if (!q.isNullOrBlank()) query.setParameter("q", "%$q%")
        if (!origin.isNullOrBlank()) query.setParameter("origin", origin)
        if (!roastLevel.isNullOrBlank()) query.setParameter("roastLevel", roastLevel)

        return query.setFirstResult(page * size).setMaxResults(size).resultList
    }

    fun findReviewsByBeanId(beanId: Long, page: Int, size: Int): List<BeanReview> =
        em.createQuery(
            "SELECT r FROM BeanReview r WHERE r.beanId = :beanId ORDER BY r.createdAt DESC",
            BeanReview::class.java
        ).setParameter("beanId", beanId)
            .setFirstResult(page * size)
            .setMaxResults(size)
            .resultList

    fun countReviewsByBeanId(beanId: Long): Long =
        em.createQuery(
            "SELECT COUNT(r) FROM BeanReview r WHERE r.beanId = :beanId",
            Long::class.javaObjectType
        ).setParameter("beanId", beanId).singleResult

    fun avgRating(beanId: Long): Double? =
        em.createQuery(
            "SELECT AVG(CAST(r.rating AS double)) FROM BeanReview r WHERE r.beanId = :beanId",
            Double::class.javaObjectType
        ).setParameter("beanId", beanId).singleResult

    fun avgField(beanId: Long, field: String): Double? =
        em.createQuery(
            "SELECT AVG(CAST(r.$field AS double)) FROM BeanReview r WHERE r.beanId = :beanId AND r.$field IS NOT NULL",
            Double::class.javaObjectType
        ).setParameter("beanId", beanId).singleResult

    fun findReviewByBeanAndMember(beanId: Long, memberId: Long): BeanReview? =
        em.createQuery(
            "SELECT r FROM BeanReview r WHERE r.beanId = :beanId AND r.memberId = :memberId",
            BeanReview::class.java
        ).setParameter("beanId", beanId).setParameter("memberId", memberId)
            .resultList.firstOrNull()

    fun findBeansByIds(ids: List<Long>): List<Bean> {
        if (ids.isEmpty()) return emptyList()
        return em.createQuery("SELECT b FROM Bean b WHERE b.id IN :ids", Bean::class.java)
            .setParameter("ids", ids)
            .resultList
    }
}
```

- [ ] **Step 4: Create `BeanService.kt`**

```kotlin
// src/main/kotlin/org/coffeezip/bean/BeanService.kt
package org.coffeezip.bean

import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import jakarta.ws.rs.WebApplicationException
import org.coffeezip.entity.Bean
import org.coffeezip.entity.BeanReview
import org.coffeezip.member.MeResource  // for getNickname helper — see note below

@ApplicationScoped
class BeanService {

    @Inject
    lateinit var em: EntityManager

    @Inject
    lateinit var beanRepository: BeanRepository

    // Nickname lookup: reuse existing MeResource or query member table directly
    private fun getNickname(memberId: Long): String =
        em.createQuery("SELECT m.nickname FROM Member m WHERE m.id = :id", String::class.java)
            .setParameter("id", memberId)
            .resultList.firstOrNull() ?: "알 수 없음"

    private val validProcessing = setOf("Natural", "Washed", "Honey", "Anaerobic")
    private val validRoastLevel = setOf("Light", "Medium-Light", "Medium", "Medium-Dark", "Dark")

    private fun validateBean(req: CreateBeanRequest) {
        if (req.name.isBlank()) throw WebApplicationException("name is required", 400)
        if (req.roastery.isBlank()) throw WebApplicationException("roastery is required", 400)
        if (req.origin.isBlank()) throw WebApplicationException("origin is required", 400)
        if (req.roastLevel !in validRoastLevel) throw WebApplicationException("invalid roastLevel", 400)
        if (req.processing != null && req.processing !in validProcessing)
            throw WebApplicationException("invalid processing", 400)
    }

    fun searchBeans(q: String? = null, origin: String? = null, roastLevel: String? = null,
                    page: Int = 0, size: Int = 20): List<BeanListItem> {
        return beanRepository.searchBeans(q, origin, roastLevel, page, size).map { toBeanListItem(it) }
    }

    @Transactional
    fun createBean(memberId: Long, req: CreateBeanRequest): BeanResponse {
        validateBean(req)
        val bean = Bean().apply {
            name = req.name
            roastery = req.roastery
            origin = req.origin
            region = req.region
            farm = req.farm
            variety = req.variety
            processing = req.processing
            roastLevel = req.roastLevel
            altitude = req.altitude
            harvestYear = req.harvestYear
            description = req.description
            flavorNotes = req.flavorNotes.toMutableList()
            createdBy = memberId
        }
        em.persist(bean)
        em.flush()
        return toBeanResponse(bean)
    }

    fun getBean(id: Long): BeanResponse {
        val bean = em.find(Bean::class.java, id) ?: throw WebApplicationException(404)
        return toBeanResponse(bean)
    }

    @Transactional
    fun updateBean(memberId: Long, id: Long, req: UpdateBeanRequest): BeanResponse {
        val bean = em.find(Bean::class.java, id) ?: throw WebApplicationException(404)
        if (bean.createdBy != memberId) throw WebApplicationException(
            "only the creator can edit this entry", 403
        )
        bean.name = req.name
        bean.roastery = req.roastery
        bean.origin = req.origin
        bean.region = req.region
        bean.farm = req.farm
        bean.variety = req.variety
        bean.processing = req.processing
        bean.roastLevel = req.roastLevel
        bean.altitude = req.altitude
        bean.harvestYear = req.harvestYear
        bean.description = req.description
        bean.flavorNotes = req.flavorNotes.toMutableList()
        bean.updatedAt = java.time.LocalDateTime.now()
        return toBeanResponse(bean)
    }

    fun getReviews(beanId: Long, page: Int = 0, size: Int = 10): BeanReviewListResponse {
        em.find(Bean::class.java, beanId) ?: throw WebApplicationException(404)
        val reviews = beanRepository.findReviewsByBeanId(beanId, page, size)
        val total = beanRepository.countReviewsByBeanId(beanId)
        return BeanReviewListResponse(
            items = reviews.map { toBeanReviewResponse(it) },
            total = total
        )
    }

    @Transactional
    fun upsertReview(memberId: Long, beanId: Long, req: CreateBeanReviewRequest): Pair<BeanReviewResponse, Boolean> {
        em.find(Bean::class.java, beanId) ?: throw WebApplicationException(404)
        if (req.rating < 1 || req.rating > 5) throw WebApplicationException("rating must be 1–5", 400)

        val existing = beanRepository.findReviewByBeanAndMember(beanId, memberId)
        return if (existing == null) {
            val review = BeanReview().apply {
                this.beanId = beanId
                this.memberId = memberId
                rating = req.rating
                content = req.content
                acidity = req.acidity
                sweetness = req.sweetness
                body = req.body
                aroma = req.aroma
            }
            em.persist(review)
            em.flush()
            Pair(toBeanReviewResponse(review), true)  // true = created
        } else {
            existing.rating = req.rating
            existing.content = req.content
            existing.acidity = req.acidity
            existing.sweetness = req.sweetness
            existing.body = req.body
            existing.aroma = req.aroma
            existing.updatedAt = java.time.LocalDateTime.now()
            Pair(toBeanReviewResponse(existing), false)  // false = updated
        }
    }

    @Transactional
    fun deleteReview(memberId: Long, beanId: Long, reviewId: Long) {
        val review = em.find(BeanReview::class.java, reviewId) ?: throw WebApplicationException(404)
        if (review.beanId != beanId) throw WebApplicationException(404)
        if (review.memberId != memberId) throw WebApplicationException(403)
        em.remove(review)
    }

    // Batch-load BeanSummary for a list of beanIds — used by RecipeService feed
    fun getBeanSummaries(beanIds: List<Long>): Map<Long, BeanSummary> {
        if (beanIds.isEmpty()) return emptyMap()
        return beanRepository.findBeansByIds(beanIds).associate { bean ->
            bean.id!! to BeanSummary(
                id = bean.id!!,
                name = bean.name,
                roastery = bean.roastery,
                origin = bean.origin,
                roastLevel = bean.roastLevel,
                flavorNotes = bean.flavorNotes.toList()
            )
        }
    }

    private fun avgOrNull(beanId: Long, field: String): Double? {
        val count = em.createQuery(
            "SELECT COUNT(r) FROM BeanReview r WHERE r.beanId = :beanId AND r.$field IS NOT NULL",
            Long::class.javaObjectType
        ).setParameter("beanId", beanId).singleResult
        return if (count >= 3) beanRepository.avgField(beanId, field) else null
    }

    private fun toBeanListItem(bean: Bean): BeanListItem {
        val reviewCount = beanRepository.countReviewsByBeanId(bean.id!!)
        val avgRating = if (reviewCount > 0) beanRepository.avgRating(bean.id!!) else null
        return BeanListItem(
            id = bean.id!!,
            name = bean.name,
            roastery = bean.roastery,
            origin = bean.origin,
            roastLevel = bean.roastLevel,
            flavorNotes = bean.flavorNotes.toList(),
            avgRating = avgRating,
            reviewCount = reviewCount
        )
    }

    private fun toBeanResponse(bean: Bean): BeanResponse {
        val beanId = bean.id!!
        val reviewCount = beanRepository.countReviewsByBeanId(beanId)
        val avgRating = if (reviewCount > 0) beanRepository.avgRating(beanId) else null
        val recipeCount = em.createQuery(
            "SELECT COUNT(r) FROM Recipe r WHERE r.beanId = :beanId", Long::class.javaObjectType
        ).setParameter("beanId", beanId).singleResult

        return BeanResponse(
            id = beanId,
            name = bean.name,
            roastery = bean.roastery,
            origin = bean.origin,
            region = bean.region,
            farm = bean.farm,
            variety = bean.variety,
            processing = bean.processing,
            roastLevel = bean.roastLevel,
            altitude = bean.altitude,
            harvestYear = bean.harvestYear,
            description = bean.description,
            flavorNotes = bean.flavorNotes.toList(),
            avgRating = avgRating,
            reviewCount = reviewCount,
            recipeCount = recipeCount,
            avgAcidity = avgOrNull(beanId, "acidity"),
            avgSweetness = avgOrNull(beanId, "sweetness"),
            avgBody = avgOrNull(beanId, "body"),
            avgAroma = avgOrNull(beanId, "aroma"),
            createdBy = bean.createdBy,
            createdAt = bean.createdAt.toString()
        )
    }

    private fun toBeanReviewResponse(review: BeanReview): BeanReviewResponse =
        BeanReviewResponse(
            id = review.id!!,
            memberId = review.memberId,
            nickname = getNickname(review.memberId),
            rating = review.rating,
            content = review.content,
            acidity = review.acidity,
            sweetness = review.sweetness,
            body = review.body,
            aroma = review.aroma,
            createdAt = review.createdAt.toString(),
            updatedAt = review.updatedAt.toString()
        )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
./mvnw test -Dtest=BeanServiceTest -pl . 2>&1 | tail -20
```

Expected: `Tests run: 2, Failures: 0, Errors: 0`

- [ ] **Step 6: Commit**

```bash
git add src/main/kotlin/org/coffeezip/bean/BeanRepository.kt \
        src/main/kotlin/org/coffeezip/bean/BeanService.kt \
        src/test/kotlin/org/coffeezip/BeanServiceTest.kt
git commit -m "feat: add BeanRepository and BeanService with upsert review logic"
```

---

### Task 4: BeanResource (REST layer)

**Files:**
- Create: `src/main/kotlin/org/coffeezip/bean/BeanResource.kt`

- [ ] **Step 1: Write the failing test**

```kotlin
// src/test/kotlin/org/coffeezip/BeanResourceTest.kt
package org.coffeezip

import io.quarkus.test.junit.QuarkusTest
import io.restassured.RestAssured.given
import org.hamcrest.CoreMatchers.*
import org.junit.jupiter.api.Test

@QuarkusTest
class BeanResourceTest {

    @Test
    fun `GET beans returns 200 with empty list when no beans`() {
        given()
            .`when`().get("/beans")
            .then()
            .statusCode(200)
            .body("$", notNullValue())
    }

    @Test
    fun `GET beans with query returns filtered results`() {
        // first create a bean via POST (requires auth — skip in this test, just verify endpoint exists)
        given()
            .queryParam("q", "예가체프")
            .`when`().get("/beans")
            .then()
            .statusCode(200)
    }

    @Test
    fun `GET beans id 999 returns 404`() {
        given()
            .`when`().get("/beans/999")
            .then()
            .statusCode(404)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./mvnw test -Dtest=BeanResourceTest 2>&1 | tail -10
```

Expected: FAIL — endpoint not found (404 on /beans)

- [ ] **Step 3: Create `BeanResource.kt`**

```kotlin
// src/main/kotlin/org/coffeezip/bean/BeanResource.kt
package org.coffeezip.bean

import io.quarkus.security.Authenticated
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import jakarta.ws.rs.*
import jakarta.ws.rs.core.Response
import org.coffeezip.auth.AuthContext

@Path("/beans")
@ApplicationScoped
class BeanResource {

    @Inject
    lateinit var beanService: BeanService

    @Inject
    lateinit var authContext: AuthContext

    @GET
    fun searchBeans(
        @QueryParam("q") q: String?,
        @QueryParam("origin") origin: String?,
        @QueryParam("roastLevel") roastLevel: String?,
        @QueryParam("page") @DefaultValue("0") page: Int,
        @QueryParam("size") @DefaultValue("20") size: Int
    ): List<BeanListItem> = beanService.searchBeans(q, origin, roastLevel, page, size)

    @POST
    @Authenticated
    fun createBean(req: CreateBeanRequest): Response {
        val result = beanService.createBean(authContext.memberId, req)
        return Response.status(Response.Status.CREATED).entity(result).build()
    }

    @GET
    @Path("/{id}")
    fun getBean(@PathParam("id") id: Long): BeanResponse = beanService.getBean(id)

    @PUT
    @Path("/{id}")
    @Authenticated
    fun updateBean(
        @PathParam("id") id: Long,
        req: UpdateBeanRequest
    ): BeanResponse = beanService.updateBean(authContext.memberId, id, req)

    @GET
    @Path("/{id}/reviews")
    fun getReviews(
        @PathParam("id") id: Long,
        @QueryParam("page") @DefaultValue("0") page: Int,
        @QueryParam("size") @DefaultValue("10") size: Int
    ): BeanReviewListResponse = beanService.getReviews(id, page, size)

    @POST
    @Path("/{id}/reviews")
    @Authenticated
    fun upsertReview(
        @PathParam("id") id: Long,
        req: CreateBeanReviewRequest
    ): Response {
        val (result, created) = beanService.upsertReview(authContext.memberId, id, req)
        val status = if (created) Response.Status.CREATED else Response.Status.OK
        return Response.status(status).entity(result).build()
    }

    @DELETE
    @Path("/{id}/reviews/{reviewId}")
    @Authenticated
    fun deleteReview(
        @PathParam("id") id: Long,
        @PathParam("reviewId") reviewId: Long
    ): Response {
        beanService.deleteReview(authContext.memberId, id, reviewId)
        return Response.noContent().build()
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
./mvnw test -Dtest=BeanResourceTest 2>&1 | tail -10
```

Expected: `Tests run: 3, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add src/main/kotlin/org/coffeezip/bean/BeanResource.kt \
        src/test/kotlin/org/coffeezip/BeanResourceTest.kt
git commit -m "feat: add BeanResource REST endpoints"
```

---

## Chunk 2: Backend — Recipe Migration

### Task 5: Recipe Entity + import.sql Migration

**Files:**
- Modify: `src/main/kotlin/org/coffeezip/entity/Recipe.kt`
- Modify: `src/main/resources/import.sql`

- [ ] **Step 1: Read `Recipe.kt` first to see the full current state**

```bash
cat src/main/kotlin/org/coffeezip/entity/Recipe.kt
```

Then make the targeted edit — replace the `coffeeBean`, `origin`, `roastLevel` fields with `beanId`:

```kotlin
// Remove these three fields from Recipe.kt:
//   @get:Column(name = "coffee_bean", length = 200)
//   var coffeeBean: String? = null
//
//   @get:Column(length = 100)
//   var origin: String? = null
//
//   @get:Column(name = "roast_level", length = 50)
//   var roastLevel: String? = null

// Add after memberId field:
@get:Column(name = "bean_id")
var beanId: Long? = null
```

Full updated relevant section of `Recipe.kt` (replace the coffeeBean/origin/roastLevel block):

```kotlin
    @get:Column(name = "member_id", nullable = false)
    var memberId: Long = 0

    @get:Column(name = "bean_id")
    var beanId: Long? = null

    @get:Column(nullable = false, length = 200)
    var title: String = ""
    // ... rest of fields unchanged (grinder, grindSize, coffeeGrams, etc.)
```

Note: In **dev** mode with `database.generation=update`, Hibernate automatically adds `bean_id` column. The old columns `coffee_bean`, `origin`, `roast_level` remain in the DB for now (Hibernate update mode never drops columns). Run this SQL manually in dev after verifying migration works:
```sql
ALTER TABLE recipe DROP COLUMN coffee_bean, DROP COLUMN origin, DROP COLUMN roast_level;
```

- [ ] **Step 2: Read `import.sql` first to identify the existing recipe INSERT block**

```bash
cat src/main/resources/import.sql
```

Then replace the entire recipe-related INSERT block (the `INSERT INTO recipe (member_id, title, ..., coffee_bean, origin, roast_level, ...)` statement and the preceding bean values). Add beans first, then link recipes via `bean_id`:

```sql
-- Remove the old recipe INSERT and replace with:
INSERT INTO bean (name, roastery, origin, roast_level, region, variety, processing, created_by, created_at, updated_at)
VALUES
  ('에티오피아 예가체프', '직접 로스팅', '에티오피아', 'Light', '예가체프', NULL, 'Washed', 1, NOW(), NOW()),
  ('콜롬비아 수프리모', '직접 로스팅', '콜롬비아', 'Medium', NULL, NULL, NULL, 1, NOW(), NOW()),
  ('과테말라 안티구아', '직접 로스팅', '과테말라', 'Medium-Dark', '안티구아', NULL, NULL, 1, NOW(), NOW()),
  ('케냐 AA', '직접 로스팅', '케냐', 'Light', NULL, NULL, 'Washed', 1, NOW(), NOW());

INSERT INTO recipe (member_id, bean_id, title, description, grinder, grind_size,
                    coffee_grams, water_grams, water_temp, target_yield, published_at, like_count, created_at, updated_at)
VALUES (1, 1, '클래식 핸드드립', '깔끔하고 밸런스 좋은 핸드드립 레시피', '코만단테', '30클릭', 15.0, 250.0, 93, 230, NOW(), 0, NOW(), NOW()),
       (1, 2, '에스프레소 룽고', '진하고 묵직한 에스프레소 베이스 레시피', '바라짜 엔코어', '14클릭', 18.0, 36.0, 93, 40, NOW(), 3, NOW(), NOW()),
       (1, 3, '콜드브루 더치', '12시간 저온 추출 더치커피', NULL, NULL, 60.0, 600.0, NULL, 550, NOW(), 7, NOW(), NOW()),
       (1, 4, '비공개 레시피', '아직 다듬는 중인 레시피', NULL, NULL, 14.0, 210.0, 91, 200, NULL, 0, NOW(), NOW());
```

Note: The full `import.sql` file keeps all other INSERT statements (recipe_step, recipe_tag, etc.) unchanged.

- [ ] **Step 3: Run tests to ensure nothing broke**

```bash
./mvnw test 2>&1 | tail -15
```

Expected: All tests pass. (Test profile uses H2 + drop-and-create, so it applies the new schema cleanly.)

- [ ] **Step 4: Commit**

```bash
git add src/main/kotlin/org/coffeezip/entity/Recipe.kt \
        src/main/resources/import.sql
git commit -m "feat: migrate Recipe entity — beanId replaces coffeeBean/origin/roastLevel"
```

---

### Task 6: RecipeDtos + RecipeService (BeanSummary integration)

**Files:**
- Modify: `src/main/kotlin/org/coffeezip/recipe/RecipeDtos.kt`
- Modify: `src/main/kotlin/org/coffeezip/recipe/RecipeService.kt`

- [ ] **Step 1: Update `RecipeDtos.kt`**

In `CreateRecipeRequest` and `UpdateRecipeRequest`: remove `coffeeBean`, `origin`, `roastLevel`; add `beanId: Long? = null`.

In `RecipeResponse`: remove `coffeeBean`, `origin`, `roastLevel`; add `bean: BeanSummary? = null`.

Full updated DTOs (only the changed parts):

```kotlin
// In RecipeDtos.kt — add import:
import org.coffeezip.bean.BeanSummary

data class CreateRecipeRequest(
    val title: String,
    val description: String? = null,
    val beanId: Long? = null,           // replaces coffeeBean/origin/roastLevel
    val grinder: String? = null,
    val grindSize: String? = null,
    val coffeeGrams: Double? = null,
    val waterGrams: Double? = null,
    val waterTemp: Int? = null,
    val targetYield: Int? = null,
    val isPublic: Boolean = true,
    val steps: List<RecipeStepRequest> = emptyList(),
    val tags: List<String> = emptyList()
)

data class UpdateRecipeRequest(
    val title: String,
    val description: String? = null,
    val beanId: Long? = null,
    val grinder: String? = null,
    val grindSize: String? = null,
    val coffeeGrams: Double? = null,
    val waterGrams: Double? = null,
    val waterTemp: Int? = null,
    val targetYield: Int? = null,
    val isPublic: Boolean = true,
    val steps: List<RecipeStepRequest> = emptyList(),
    val tags: List<String> = emptyList()
)

data class RecipeResponse(
    val id: Long,
    val memberId: Long,
    val title: String,
    val description: String?,
    val bean: BeanSummary?,             // replaces coffeeBean/origin/roastLevel
    val grinder: String?,
    val grindSize: String?,
    val coffeeGrams: Double?,
    val waterGrams: Double?,
    val waterTemp: Int?,
    val targetYield: Int?,
    val publishedAt: String?,
    val likeCount: Int,
    val steps: List<RecipeStepResponse>,
    val tags: List<String>,
    val createdAt: String,
    val updatedAt: String
)
```

- [ ] **Step 2: Update `RecipeService.kt`**

Inject `BeanService`. Update `createRecipe`, `updateRecipe`, `getFeed`, and `toRecipeResponse` to use `beanId` and batch-load `BeanSummary`.

Key changes:

```kotlin
// Add to RecipeService.kt imports (at the top with other imports):
// import org.coffeezip.bean.BeanService
// import org.coffeezip.bean.BeanSummary

// Add to RecipeService class:
@Inject
lateinit var beanService: BeanService

// Update getFeed to batch-load bean summaries:
fun getFeed(cursor: Long?, limit: Int): FeedResponse {
    val results = recipeRepository.findPublicFeed(cursor, limit + 1)
    val hasNext = results.size > limit
    val items = if (hasNext) results.dropLast(1) else results
    val nextCursor = if (hasNext) items.last().id else null

    // Batch-load bean summaries for all beanIds in this page
    val beanIds = items.mapNotNull { it.beanId }.distinct()
    val beanSummaries = beanService.getBeanSummaries(beanIds)

    return FeedResponse(
        items = items.map { toRecipeResponse(it, beanSummary = beanSummaries[it.beanId]) },
        nextCursor = nextCursor
    )
}

// Update createRecipe:
@Transactional
fun createRecipe(memberId: Long, req: CreateRecipeRequest): RecipeResponse {
    val recipe = Recipe().apply {
        this.memberId = memberId
        title = req.title
        description = req.description
        beanId = req.beanId           // was: coffeeBean/origin/roastLevel
        grinder = req.grinder
        grindSize = req.grindSize
        coffeeGrams = req.coffeeGrams
        waterGrams = req.waterGrams
        waterTemp = req.waterTemp
        targetYield = req.targetYield
        publishedAt = if (req.isPublic) java.time.LocalDateTime.now() else null
        likeCount = 0
    }
    em.persist(recipe)
    em.flush()
    // ... steps and tags persist unchanged ...
    val beanSummary = req.beanId?.let { beanService.getBeanSummaries(listOf(it))[it] }
    return toRecipeResponse(recipe, beanSummary = beanSummary)
}

// Update updateRecipe — full replacement:
@Transactional
fun updateRecipe(memberId: Long, id: Long, req: UpdateRecipeRequest): RecipeResponse {
    val recipe = em.find(Recipe::class.java, id) ?: throw WebApplicationException(404)
    if (recipe.memberId != memberId) throw WebApplicationException(403)

    recipe.title = req.title
    recipe.description = req.description
    recipe.beanId = req.beanId          // was: coffeeBean/origin/roastLevel
    recipe.grinder = req.grinder
    recipe.grindSize = req.grindSize
    recipe.coffeeGrams = req.coffeeGrams
    recipe.waterGrams = req.waterGrams
    recipe.waterTemp = req.waterTemp
    recipe.targetYield = req.targetYield
    recipe.publishedAt = if (req.isPublic) (recipe.publishedAt ?: java.time.LocalDateTime.now()) else null
    recipe.updatedAt = java.time.LocalDateTime.now()

    em.createQuery("DELETE FROM RecipeStep s WHERE s.recipeId = :recipeId")
        .setParameter("recipeId", id).executeUpdate()
    em.createQuery("DELETE FROM RecipeTag t WHERE t.recipeId = :recipeId")
        .setParameter("recipeId", id).executeUpdate()

    req.steps.forEach { stepReq ->
        val step = RecipeStep().apply {
            recipeId = id
            stepOrder = stepReq.stepOrder
            label = stepReq.label
            duration = stepReq.duration
            waterAmount = stepReq.waterAmount
        }
        em.persist(step)
    }
    req.tags.forEach { tagStr ->
        val tag = RecipeTag().apply { recipeId = id; tag = tagStr }
        em.persist(tag)
    }
    em.flush()
    return toRecipeResponse(recipe)
}

// Update toRecipeResponse signature:
private fun toRecipeResponse(
    recipe: Recipe,
    steps: List<RecipeStepResponse>? = null,
    tags: List<String>? = null,
    beanSummary: BeanSummary? = null  // pass in from batch load, or fetch lazily for single-recipe endpoints
): RecipeResponse {
    val resolvedBean = beanSummary ?: recipe.beanId?.let {
        beanService.getBeanSummaries(listOf(it))[it]
    }
    val resolvedSteps = steps ?: recipeRepository.findStepsByRecipeId(recipe.id!!).map {
        RecipeStepResponse(id = it.id!!, stepOrder = it.stepOrder, label = it.label,
            duration = it.duration, waterAmount = it.waterAmount)
    }
    val resolvedTags = tags ?: recipeRepository.findTagsByRecipeId(recipe.id!!)
    return RecipeResponse(
        id = recipe.id!!,
        memberId = recipe.memberId,
        title = recipe.title,
        description = recipe.description,
        bean = resolvedBean,
        grinder = recipe.grinder,
        grindSize = recipe.grindSize,
        coffeeGrams = recipe.coffeeGrams,
        waterGrams = recipe.waterGrams,
        waterTemp = recipe.waterTemp,
        targetYield = recipe.targetYield,
        publishedAt = recipe.publishedAt?.toString(),
        likeCount = recipe.likeCount,
        steps = resolvedSteps,
        tags = resolvedTags,
        createdAt = recipe.createdAt.toString(),
        updatedAt = recipe.updatedAt.toString()
    )
}
```

- [ ] **Step 3: Run all tests**

```bash
./mvnw test 2>&1 | tail -15
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/main/kotlin/org/coffeezip/recipe/RecipeDtos.kt \
        src/main/kotlin/org/coffeezip/recipe/RecipeService.kt
git commit -m "feat: integrate BeanSummary into RecipeResponse with batch loading"
```

---

## Chunk 3: Frontend — Catalog Pages

### Task 7: Shared Catalog Components

**Files:**
- Create: `components/catalog/tasting-bar.tsx`
- Create: `components/catalog/bean-card.tsx`

- [ ] **Step 1: Create `tasting-bar.tsx`**

```tsx
// components/catalog/tasting-bar.tsx
interface TastingBarProps {
  label: string
  value: number  // 1–5
  max?: number
}

export function TastingBar({ label, value, max = 5 }: TastingBarProps) {
  const pct = (value / max) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-8 shrink-0">{label}</span>
      <div className="flex-1 bg-[hsl(var(--surface-container))] rounded-full h-1">
        <div
          className="bg-[hsl(var(--cta))] h-1 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-6 text-right">{value.toFixed(1)}</span>
    </div>
  )
}
```

- [ ] **Step 2: Create `bean-card.tsx`**

```tsx
// components/catalog/bean-card.tsx
import Link from 'next/link'
import { Star } from 'lucide-react'

interface BeanCardProps {
  id: number
  name: string
  roastery: string
  origin: string
  roastLevel: string
  flavorNotes: string[]
  avgRating: number | null
  reviewCount: number
}

export function BeanCard({ id, name, roastery, origin, roastLevel, flavorNotes, avgRating, reviewCount }: BeanCardProps) {
  return (
    <Link href={`/catalog/beans/${id}`} className="block">
      <div className="bg-[hsl(var(--surface-container-low))] rounded-2xl p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{roastery}</p>
          </div>
          {avgRating != null && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="size-3 fill-[hsl(var(--cta))] text-[hsl(var(--cta))]" />
              <span className="text-xs font-medium">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="label-upper text-[10px] text-muted-foreground">{origin}</span>
          <span className="text-muted-foreground text-[10px]">·</span>
          <span className="label-upper text-[10px] text-muted-foreground">{roastLevel}</span>
        </div>
        {flavorNotes.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {flavorNotes.slice(0, 3).map(note => (
              <span key={note} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--cta))]/10 text-[hsl(var(--cta))]">
                {note}
              </span>
            ))}
          </div>
        )}
        {reviewCount > 0 && (
          <p className="text-[10px] text-muted-foreground">{reviewCount}개 리뷰</p>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/minseok/Documents/GitHub/coffee-zip-fe
git add components/catalog/tasting-bar.tsx components/catalog/bean-card.tsx
git commit -m "feat: add TastingBar and BeanCard catalog components"
```

---

### Task 8: BeanSearchField Component

**Files:**
- Create: `components/catalog/bean-search-field.tsx`

- [ ] **Step 1: Create `bean-search-field.tsx`**

```tsx
// components/catalog/bean-search-field.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface BeanSummary {
  id: number
  name: string
  roastery: string
  origin: string
  roastLevel: string
  flavorNotes: string[]
}

interface BeanListItem {
  id: number
  name: string
  roastery: string
  origin: string
  roastLevel: string
  flavorNotes: string[]
}

interface BeanSearchFieldProps {
  value: BeanSummary | null
  onChange: (bean: BeanSummary | null) => void
}

export function BeanSearchField({ value, onChange }: BeanSearchFieldProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BeanListItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await apiFetch<BeanListItem[]>(`/beans?q=${encodeURIComponent(query)}&size=10`)
        setResults(data)
      } catch { /* ignore */ } finally { setLoading(false) }
    }, 300)
  }, [query])

  if (value) {
    return (
      <div className="flex items-center gap-2 bg-[hsl(var(--surface-container))] rounded-xl px-3 py-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{value.name}</p>
          <p className="text-xs text-muted-foreground truncate">{value.roastery} · {value.origin} · {value.roastLevel}</p>
        </div>
        <button onClick={() => onChange(null)} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-[hsl(var(--surface-container))] rounded-xl px-3 py-2.5">
        <Search className="size-4 text-muted-foreground shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="원두 검색..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading && <span className="text-xs text-muted-foreground">...</span>}
      </div>

      {open && (query.trim() || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[hsl(var(--surface-container-low))] rounded-xl overflow-hidden shadow-lg z-50 border border-border/20">
          {results.length === 0 && query.trim() && !loading && (
            <p className="text-xs text-muted-foreground px-3 py-2.5">결과 없음</p>
          )}
          {results.map(bean => (
            <button
              key={bean.id}
              onClick={() => { onChange(bean as BeanSummary); setOpen(false); setQuery('') }}
              className="w-full text-left px-3 py-2.5 hover:bg-[hsl(var(--surface-container))] transition-colors"
            >
              <p className="text-sm font-medium">{bean.name}</p>
              <p className="text-xs text-muted-foreground">{bean.roastery} · {bean.origin} · {bean.roastLevel}</p>
            </button>
          ))}
          <div className="border-t border-border/20 px-3 py-2">
            <a href="/catalog/beans/new" target="_blank" rel="noopener noreferrer"
               className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              + 카탈로그에 새 원두 등록 →
            </a>
          </div>
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/catalog/bean-search-field.tsx
git commit -m "feat: add BeanSearchField component with debounced search"
```

---

### Task 9: Bottom Nav + Catalog Index Page

**Files:**
- Modify: `components/layout/bottom-nav.tsx`
- Create: `app/catalog/page.tsx`

- [ ] **Step 1: Update `bottom-nav.tsx`** — add catalog tab between 캘린더 and 내 레시피

Replace the entire import line and `NAV_ITEMS` array. The current file imports `{ Rss, CalendarDays, BookOpen, Settings }` — replace it with:

```tsx
// Replace the lucide-react import line (line 5):
import { Rss, CalendarDays, BookOpen, Settings, Coffee } from 'lucide-react'

// Replace the NAV_ITEMS array (lines 8-13):
const NAV_ITEMS = [
  { href: '/', icon: Rss, label: '피드' },
  { href: '/calendar', icon: CalendarDays, label: '캘린더' },
  { href: '/catalog', icon: Coffee, label: '카탈로그' },
  { href: '/me/recipes', icon: BookOpen, label: '내 레시피' },
  { href: '/settings', icon: Settings, label: '설정' },
]
```

Active detection: the existing logic `href === '/' ? pathname === '/' : pathname.startsWith(href)` already handles `/catalog` correctly — no other changes needed.

- [ ] **Step 2: Create `app/catalog/page.tsx`**

```tsx
// app/catalog/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { BeanCard } from '@/components/catalog/bean-card'
import { apiFetch } from '@/lib/api'

interface BeanListItem {
  id: number
  name: string
  roastery: string
  origin: string
  roastLevel: string
  flavorNotes: string[]
  avgRating: number | null
  reviewCount: number
}

const ROAST_LEVELS = ['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark']

export default function CatalogPage() {
  const router = useRouter()
  const [activeTab] = useState<'beans' | 'drippers' | 'grinders'>('beans')
  const [beans, setBeans] = useState<BeanListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roastFilter, setRoastFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (roastFilter) params.set('roastLevel', roastFilter)
    setLoading(true)
    apiFetch<BeanListItem[]>(`/beans?${params}`)
      .then(setBeans)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [query, roastFilter])

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <PageHeader title="카탈로그" />

      {/* Tab bar */}
      <div className="flex border-b border-border/30 px-4">
        <button className="py-2.5 px-3 text-sm font-medium border-b-2 border-foreground text-foreground">
          원두
        </button>
        <button disabled className="py-2.5 px-3 text-sm font-medium text-muted-foreground/40 cursor-not-allowed">
          드리퍼
        </button>
        <button disabled className="py-2.5 px-3 text-sm font-medium text-muted-foreground/40 cursor-not-allowed">
          그라인더
        </button>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-3">
        {/* Search */}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="원두, 로스터리 검색..."
          className="w-full bg-[hsl(var(--surface-container))] rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />

        {/* Roast level filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setRoastFilter('')}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
              roastFilter === '' ? 'bg-foreground text-background' : 'bg-[hsl(var(--surface-container))] text-muted-foreground'
            }`}
          >전체</button>
          {ROAST_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setRoastFilter(level === roastFilter ? '' : level)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
                roastFilter === level ? 'bg-foreground text-background' : 'bg-[hsl(var(--surface-container))] text-muted-foreground'
              }`}
            >{level}</button>
          ))}
        </div>

        {/* Bean list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[hsl(var(--surface-container-low))] rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : beans.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">등록된 원두가 없어요</p>
            <button onClick={() => router.push('/catalog/beans/new')}
              className="mt-3 text-sm text-foreground underline underline-offset-2">
              첫 번째 원두 등록하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {beans.map(bean => <BeanCard key={bean.id} {...bean} />)}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => router.push('/catalog/beans/new')}
        className="fixed bottom-24 right-4 size-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg"
        aria-label="원두 등록"
      >
        <Plus className="size-5" />
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Run dev server and verify catalog tab appears in nav and page renders**

```bash
cd /Users/minseok/Documents/GitHub/coffee-zip-fe && npm run dev
# Open http://localhost:3000/catalog — should show catalog page with search + tabs
```

- [ ] **Step 4: Commit**

```bash
git add components/layout/bottom-nav.tsx app/catalog/page.tsx
git commit -m "feat: add catalog bottom nav tab and catalog index page"
```

---

### Task 10: Bean Registration + Detail Pages

**Files:**
- Create: `app/catalog/beans/new/page.tsx`
- Create: `app/catalog/beans/[id]/page.tsx`

- [ ] **Step 1: Create `app/catalog/beans/new/page.tsx`**

```tsx
// app/catalog/beans/new/page.tsx
'use client'

import { useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

const inputCls = 'w-full bg-[hsl(var(--surface-container))] border-0 border-b-2 border-transparent focus:border-[hsl(var(--cta))] rounded-t-xl rounded-b-none px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground'

const PROCESSING_OPTIONS = ['Natural', 'Washed', 'Honey', 'Anaerobic']
const ROAST_LEVELS = ['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark']

export default function NewBeanPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [flavorNotes, setFlavorNotes] = useState<string[]>([])
  const [noteInput, setNoteInput] = useState('')
  const [form, setForm] = useState({
    name: '', roastery: '', origin: '', roastLevel: '',
    region: '', farm: '', variety: '', processing: '',
    altitude: '', harvestYear: '', description: ''
  })

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  function addNote() {
    const t = noteInput.trim().replace(/,+$/, '')
    if (t && !flavorNotes.includes(t)) setFlavorNotes(prev => [...prev, t])
    setNoteInput('')
  }

  function handleNoteKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addNote() }
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = '원두 이름을 입력해주세요'
    if (!form.roastery.trim()) errs.roastery = '로스터리를 입력해주세요'
    if (!form.origin.trim()) errs.origin = '원산지를 입력해주세요'
    if (!form.roastLevel) errs.roastLevel = '로스팅 레벨을 선택해주세요'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const body = {
        name: form.name.trim(),
        roastery: form.roastery.trim(),
        origin: form.origin.trim(),
        roastLevel: form.roastLevel,
        ...(form.region.trim() && { region: form.region.trim() }),
        ...(form.farm.trim() && { farm: form.farm.trim() }),
        ...(form.variety.trim() && { variety: form.variety.trim() }),
        ...(form.processing && { processing: form.processing }),
        ...(form.altitude && { altitude: Number(form.altitude) }),
        ...(form.harvestYear && { harvestYear: Number(form.harvestYear) }),
        ...(form.description.trim() && { description: form.description.trim() }),
        flavorNotes,
      }
      const result = await apiFetch<{ id: number }>('/beans', { method: 'POST', body: JSON.stringify(body) })
      router.push(`/catalog/beans/${result.id}`)
    } catch {
      alert('등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <PageHeader title="원두 등록" showBack />
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">

        {/* Required */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">필수 정보</p>
          <div>
            <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="원두 이름" className={inputCls} />
            {errors.name && <p className="text-xs text-destructive px-1 mt-0.5">{errors.name}</p>}
          </div>
          <div>
            <input value={form.roastery} onChange={e => update('roastery', e.target.value)} placeholder="로스터리" className={inputCls} />
            {errors.roastery && <p className="text-xs text-destructive px-1 mt-0.5">{errors.roastery}</p>}
          </div>
          <div>
            <input value={form.origin} onChange={e => update('origin', e.target.value)} placeholder="원산지 (예: 에티오피아)" className={inputCls} />
            {errors.origin && <p className="text-xs text-destructive px-1 mt-0.5">{errors.origin}</p>}
          </div>
          <div>
            <select value={form.roastLevel} onChange={e => update('roastLevel', e.target.value)} className={inputCls + ' appearance-none cursor-pointer'}>
              <option value="">로스팅 레벨 선택</option>
              {ROAST_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {errors.roastLevel && <p className="text-xs text-destructive px-1 mt-0.5">{errors.roastLevel}</p>}
          </div>
        </section>

        {/* Optional details */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">추가 정보 (선택)</p>
          <input value={form.region} onChange={e => update('region', e.target.value)} placeholder="지역 (예: 예가체프)" className={inputCls} />
          <input value={form.farm} onChange={e => update('farm', e.target.value)} placeholder="농장 이름" className={inputCls} />
          <input value={form.variety} onChange={e => update('variety', e.target.value)} placeholder="품종 (예: 게이샤, 버번)" className={inputCls} />
          <select value={form.processing} onChange={e => update('processing', e.target.value)} className={inputCls + ' appearance-none cursor-pointer'}>
            <option value="">가공 방식 선택</option>
            {PROCESSING_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.altitude} onChange={e => update('altitude', e.target.value)} placeholder="고도 (m)" className={inputCls} />
            <input type="number" value={form.harvestYear} onChange={e => update('harvestYear', e.target.value)} placeholder="수확 연도" min={2000} max={2030} className={inputCls} />
          </div>
        </section>

        {/* Flavor notes */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">향미 노트</p>
          <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={handleNoteKey} onBlur={addNote}
            placeholder="블루베리, 자스민, 다크초콜릿..." className={inputCls} />
          {flavorNotes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {flavorNotes.map(note => (
                <span key={note} className="inline-flex items-center gap-1 bg-[hsl(var(--cta))]/10 text-[hsl(var(--cta))] text-xs px-2 py-0.5 rounded-full">
                  {note}
                  <button onClick={() => setFlavorNotes(prev => prev.filter(n => n !== note))}><X className="size-3" /></button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Description */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4">
          <p className="label-upper text-muted-foreground mb-3">설명</p>
          <textarea value={form.description} onChange={e => update('description', e.target.value)}
            placeholder="이 원두에 대한 설명..." rows={3} className={inputCls + ' resize-none'} />
        </section>

      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm px-4 py-3 border-t border-border/40">
        <div className="max-w-lg mx-auto">
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <><Loader2 className="size-4 animate-spin" />등록 중...</> : '원두 등록'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/catalog/beans/[id]/page.tsx`**

```tsx
// app/catalog/beans/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { TastingBar } from '@/components/catalog/tasting-bar'
import { apiFetch } from '@/lib/api'

interface BeanDetail {
  id: number; name: string; roastery: string; origin: string; region: string | null
  farm: string | null; variety: string | null; processing: string | null; roastLevel: string
  altitude: number | null; harvestYear: number | null; description: string | null
  flavorNotes: string[]; avgRating: number | null; reviewCount: number; recipeCount: number
  avgAcidity: number | null; avgSweetness: number | null; avgBody: number | null; avgAroma: number | null
}

interface Review {
  id: number; memberId: number; nickname: string; rating: number; content: string | null
  acidity: number | null; sweetness: number | null; body: number | null; aroma: number | null
  createdAt: string
}

interface ReviewList { items: Review[]; total: number }

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`size-3.5 ${i <= rating ? 'fill-[hsl(var(--cta))] text-[hsl(var(--cta))]' : 'text-muted-foreground'}`} />
      ))}
    </div>
  )
}

export default function BeanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [bean, setBean] = useState<BeanDetail | null>(null)
  const [reviews, setReviews] = useState<ReviewList | null>(null)
  const [loading, setLoading] = useState(true)
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('memberId')

  useEffect(() => {
    Promise.all([
      apiFetch<BeanDetail>(`/beans/${id}`),
      apiFetch<ReviewList>(`/beans/${id}/reviews`)
    ]).then(([b, r]) => { setBean(b); setReviews(r) })
      .catch(() => router.push('/catalog'))
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading || !bean) return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="" showBack />
      <div className="px-4 py-4 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-[hsl(var(--surface-container-low))] rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  const hasTasting = bean.avgAcidity != null || bean.avgSweetness != null || bean.avgBody != null || bean.avgAroma != null

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <PageHeader title="" showBack right={
        isLoggedIn ? (
          <button onClick={() => router.push(`/catalog/beans/${id}/review`)}
            className="text-sm font-medium text-foreground">
            리뷰 작성
          </button>
        ) : undefined
      } />

      <div className="max-w-lg mx-auto w-full px-4 py-4 space-y-4">

        {/* Header */}
        <div>
          <p className="label-upper text-muted-foreground text-[10px] mb-1">
            {bean.origin}{bean.region ? ` · ${bean.region}` : ''} · {bean.roastLevel}
          </p>
          <h1 className="text-xl font-bold">{bean.name}</h1>
          <p className="text-sm text-muted-foreground">{bean.roastery}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '평균 평점', value: bean.avgRating != null ? bean.avgRating.toFixed(1) : '—' },
            { label: '리뷰', value: String(bean.reviewCount) },
            { label: '레시피', value: String(bean.recipeCount) },
          ].map(stat => (
            <div key={stat.label} className="bg-[hsl(var(--surface-container-low))] rounded-xl p-3 text-center">
              <p className="font-semibold text-sm">{stat.value}</p>
              <p className="label-upper text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Attributes */}
        <div className="flex flex-wrap gap-1.5">
          {bean.variety && <span className="text-xs bg-[hsl(var(--surface-container))] px-2.5 py-1 rounded-full">{bean.variety}</span>}
          {bean.processing && <span className="text-xs bg-[hsl(var(--surface-container))] px-2.5 py-1 rounded-full">{bean.processing}</span>}
          {bean.altitude && <span className="text-xs bg-[hsl(var(--surface-container))] px-2.5 py-1 rounded-full">{bean.altitude}m</span>}
          {bean.harvestYear && <span className="text-xs bg-[hsl(var(--surface-container))] px-2.5 py-1 rounded-full">{bean.harvestYear}</span>}
        </div>

        {/* Flavor notes */}
        {bean.flavorNotes.length > 0 && (
          <div>
            <p className="label-upper text-muted-foreground text-[10px] mb-2">FLAVOR NOTES</p>
            <div className="flex flex-wrap gap-1.5">
              {bean.flavorNotes.map(note => (
                <span key={note} className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--cta))]/10 text-[hsl(var(--cta))]">{note}</span>
              ))}
            </div>
          </div>
        )}

        {/* Avg tasting */}
        {hasTasting && (
          <div className="bg-[hsl(var(--surface-container-low))] rounded-2xl p-4 space-y-2.5">
            <p className="label-upper text-muted-foreground text-[10px]">AVERAGE TASTING</p>
            {bean.avgAcidity != null && <TastingBar label="산미" value={bean.avgAcidity} />}
            {bean.avgSweetness != null && <TastingBar label="단맛" value={bean.avgSweetness} />}
            {bean.avgBody != null && <TastingBar label="바디" value={bean.avgBody} />}
            {bean.avgAroma != null && <TastingBar label="향" value={bean.avgAroma} />}
          </div>
        )}

        {/* Reviews */}
        {reviews && reviews.items.length > 0 && (
          <div className="space-y-2">
            <p className="label-upper text-muted-foreground text-[10px]">REVIEWS</p>
            {reviews.items.map(review => (
              <div key={review.id} className="bg-[hsl(var(--surface-container-low))] rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{review.nickname}</span>
                  <StarRating rating={review.rating} />
                </div>
                {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/catalog/beans/new/page.tsx app/catalog/beans/\[id\]/page.tsx
git commit -m "feat: add bean registration and detail pages"
```

---

### Task 11: Review Form Page

**Files:**
- Create: `app/catalog/beans/[id]/review/page.tsx`

- [ ] **Step 1: Create `app/catalog/beans/[id]/review/page.tsx`**

```tsx
// app/catalog/beans/[id]/review/page.tsx
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => onChange(i)} type="button">
          <Star className={`size-7 transition-colors ${i <= value ? 'fill-[hsl(var(--cta))] text-[hsl(var(--cta))]' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium">{value}</span>
      </div>
      <input type="range" min={1} max={5} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[hsl(var(--cta))]" />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>1</span><span>5</span>
      </div>
    </div>
  )
}

export default function BeanReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [showTasting, setShowTasting] = useState(false)
  const [acidity, setAcidity] = useState(3)
  const [sweetness, setSweetness] = useState(3)
  const [body, setBody] = useState(3)
  const [aroma, setAroma] = useState(3)
  const [submitting, setSubmitting] = useState(false)
  const [ratingError, setRatingError] = useState(false)

  async function handleSubmit() {
    if (rating === 0) { setRatingError(true); return }
    setSubmitting(true)
    try {
      await apiFetch(`/beans/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          content: content.trim() || null,
          ...(showTasting ? { acidity, sweetness, body, aroma } : {})
        })
      })
      router.push(`/catalog/beans/${id}`)
    } catch {
      alert('리뷰 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <PageHeader title="리뷰 작성" showBack />
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">

        {/* Star rating */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">별점</p>
          <StarSelector value={rating} onChange={v => { setRating(v); setRatingError(false) }} />
          {ratingError && <p className="text-xs text-destructive">별점을 선택해주세요</p>}
        </section>

        {/* Text */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">코멘트 (선택)</p>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="이 원두에 대한 생각을 공유해주세요..."
            rows={4}
            className="w-full bg-[hsl(var(--surface-container))] rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground resize-none"
          />
        </section>

        {/* Tasting notes toggle */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <button
            onClick={() => setShowTasting(v => !v)}
            className="w-full flex items-center justify-between text-sm"
          >
            <span className="label-upper text-muted-foreground">테이스팅 노트 추가</span>
            <span className="text-xs text-muted-foreground">{showTasting ? '접기 ↑' : '펼치기 ↓'}</span>
          </button>
          {showTasting && (
            <div className="space-y-4 pt-1">
              <Slider label="산미 (Acidity)" value={acidity} onChange={setAcidity} />
              <Slider label="단맛 (Sweetness)" value={sweetness} onChange={setSweetness} />
              <Slider label="바디감 (Body)" value={body} onChange={setBody} />
              <Slider label="향 (Aroma)" value={aroma} onChange={setAroma} />
            </div>
          )}
        </section>

      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm px-4 py-3 border-t border-border/40">
        <div className="max-w-lg mx-auto">
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <><Loader2 className="size-4 animate-spin" />등록 중...</> : '리뷰 등록'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/catalog/beans/[id]/review/page.tsx"
git commit -m "feat: add bean review form page"
```

---

## Chunk 4: Frontend — Recipe Integration

### Task 12: Recipe Create/Edit Forms

**Files:**
- Modify: `app/me/recipes/new/page.tsx`
- Create: `app/me/recipes/[id]/edit/page.tsx`

- [ ] **Step 1: Update `app/me/recipes/new/page.tsx`**

In `FormState`: remove `coffeeBean`, `origin`, `roastLevel`; add `beanId: number | null`.

In the form: replace the "원두 정보" section (coffeeBean input + origin input + roastLevel select) with the `BeanSearchField` component.

In `handleSubmit`: replace `coffeeBean`/`origin`/`roastLevel` body fields with `beanId: form.beanId`.

Key diff:

```tsx
// Add import:
import { BeanSearchField } from '@/components/catalog/bean-search-field'

// FormState change:
interface FormState {
  title: string
  description: string
  beanId: number | null       // replaces coffeeBean/origin/roastLevel
  grinder: string
  grindSize: string
  coffeeGrams: string
  waterGrams: string
  waterTemp: string
  targetYield: string
  isPublic: boolean
}

// Initial state:
const [form, setForm] = useState<FormState>({
  title: '', description: '',
  beanId: null,               // was: coffeeBean: '', origin: '', roastLevel: ''
  grinder: '', grindSize: '', coffeeGrams: '', waterGrams: '',
  waterTemp: '', targetYield: '', isPublic: true,
})

// Add bean state alongside form:
const [selectedBean, setSelectedBean] = useState<BeanSummary | null>(null)

// In handleSubmit body:
...(form.beanId != null && { beanId: form.beanId }),

// Replace the "원두 정보" section in JSX:
<section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
  <p className="label-upper text-muted-foreground">원두</p>
  <BeanSearchField
    value={selectedBean}
    onChange={bean => {
      setSelectedBean(bean)
      updateForm('beanId', bean?.id ?? null)
    }}
  />
</section>
```

Note: `updateForm` currently takes `keyof FormState` and `string | boolean`. Change the `beanId` update to directly call `setForm(prev => ({ ...prev, beanId: bean?.id ?? null }))`.

- [ ] **Step 2: Create `app/me/recipes/[id]/edit/page.tsx`**

This page does not exist — create it in full:

```tsx
// app/me/recipes/[id]/edit/page.tsx
'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { X, Plus, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { BeanSearchField } from '@/components/catalog/bean-search-field'
import { apiFetch } from '@/lib/api'

const inputCls =
  'w-full bg-[hsl(var(--surface-container))] border-0 border-b-2 border-transparent focus:border-[hsl(var(--cta))] rounded-t-xl rounded-b-none px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground'

interface BeanSummary {
  id: number; name: string; roastery: string
  origin: string; roastLevel: string; flavorNotes: string[]
}

interface Step {
  stepOrder: number; label: string; duration: string; waterAmount: string
}

interface FormState {
  title: string; description: string; beanId: number | null
  grinder: string; grindSize: string; coffeeGrams: string
  waterGrams: string; waterTemp: string; targetYield: string; isPublic: boolean
}

const defaultStep = (stepOrder: number): Step => ({ stepOrder, label: '', duration: '', waterAmount: '' })

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [titleError, setTitleError] = useState(false)
  const [selectedBean, setSelectedBean] = useState<BeanSummary | null>(null)
  const [form, setForm] = useState<FormState>({
    title: '', description: '', beanId: null,
    grinder: '', grindSize: '', coffeeGrams: '',
    waterGrams: '', waterTemp: '', targetYield: '', isPublic: true,
  })
  const [steps, setSteps] = useState<Step[]>([defaultStep(1)])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    apiFetch<any>(`/me/recipes/${id}`)
      .then(recipe => {
        setForm({
          title: recipe.title ?? '',
          description: recipe.description ?? '',
          beanId: recipe.bean?.id ?? null,
          grinder: recipe.grinder ?? '',
          grindSize: recipe.grindSize ?? '',
          coffeeGrams: recipe.coffeeGrams != null ? String(recipe.coffeeGrams) : '',
          waterGrams: recipe.waterGrams != null ? String(recipe.waterGrams) : '',
          waterTemp: recipe.waterTemp != null ? String(recipe.waterTemp) : '',
          targetYield: recipe.targetYield != null ? String(recipe.targetYield) : '',
          isPublic: recipe.publishedAt != null,
        })
        if (recipe.bean) setSelectedBean(recipe.bean)
        if (recipe.steps?.length) setSteps(recipe.steps.map((s: any) => ({
          stepOrder: s.stepOrder, label: s.label,
          duration: String(s.duration), waterAmount: s.waterAmount != null ? String(s.waterAmount) : ''
        })))
        if (recipe.tags?.length) setTags(recipe.tags)
      })
      .catch(() => router.push('/me/recipes'))
      .finally(() => setLoading(false))
  }, [id, router])

  function updateForm(key: keyof Omit<FormState, 'beanId'>, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'title') setTitleError(false)
  }
  function updateStep(index: number, key: keyof Step, value: string) {
    setSteps(prev => prev.map((s, i) => (i === index ? { ...s, [key]: value } : s)))
  }
  function addStep() { setSteps(prev => [...prev, defaultStep(prev.length + 1)]) }
  function removeStep(index: number) {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 })))
  }
  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
  }
  function addTag() {
    const t = tagInput.trim().replace(/,+$/, '')
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }
  function removeTag(tag: string) { setTags(prev => prev.filter(t => t !== tag)) }

  async function handleSubmit() {
    if (!form.title.trim()) { setTitleError(true); return }
    setSubmitting(true)
    try {
      const body = {
        title: form.title.trim(),
        ...(form.description.trim() && { description: form.description.trim() }),
        ...(form.beanId != null && { beanId: form.beanId }),
        ...(form.grinder.trim() && { grinder: form.grinder.trim() }),
        ...(form.grindSize.trim() && { grindSize: form.grindSize.trim() }),
        ...(form.coffeeGrams !== '' && { coffeeGrams: Number(form.coffeeGrams) }),
        ...(form.waterGrams !== '' && { waterGrams: Number(form.waterGrams) }),
        ...(form.waterTemp !== '' && { waterTemp: Number(form.waterTemp) }),
        ...(form.targetYield !== '' && { targetYield: Number(form.targetYield) }),
        isPublic: form.isPublic,
        steps: steps.filter(s => s.label.trim() || s.duration !== '').map(s => ({
          stepOrder: s.stepOrder, label: s.label.trim(),
          duration: Number(s.duration) || 0,
          ...(s.waterAmount !== '' && { waterAmount: Number(s.waterAmount) }),
        })),
        tags,
      }
      await apiFetch(`/me/recipes/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      router.push('/me/recipes')
    } catch {
      alert('레시피 수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="레시피 수정" showBack />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <PageHeader title="레시피 수정" showBack />
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">

        {/* 1. 기본 정보 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">기본 정보</p>
          <div className="space-y-1">
            <input type="text" value={form.title} onChange={e => updateForm('title', e.target.value)}
              placeholder="레시피 이름" className={inputCls} />
            {titleError && <p className="text-xs text-destructive px-1">레시피 이름을 입력해주세요</p>}
          </div>
          <textarea value={form.description} onChange={e => updateForm('description', e.target.value)}
            placeholder="레시피 설명 (선택)" rows={3} className={inputCls + ' resize-none'} />
        </section>

        {/* 2. 원두 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">원두</p>
          <BeanSearchField
            value={selectedBean}
            onChange={bean => { setSelectedBean(bean); setForm(prev => ({ ...prev, beanId: bean?.id ?? null })) }}
          />
        </section>

        {/* 3. 그라인더 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">그라인더</p>
          <input type="text" value={form.grinder} onChange={e => updateForm('grinder', e.target.value)}
            placeholder="그라인더 이름" className={inputCls} />
          <input type="text" value={form.grindSize} onChange={e => updateForm('grindSize', e.target.value)}
            placeholder="분쇄도" className={inputCls} />
        </section>

        {/* 4. 추출 비율 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">추출 정보</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.coffeeGrams} onChange={e => updateForm('coffeeGrams', e.target.value)}
              placeholder="원두 (g)" min={0} className={inputCls} />
            <input type="number" value={form.waterGrams} onChange={e => updateForm('waterGrams', e.target.value)}
              placeholder="물 (g)" min={0} className={inputCls} />
          </div>
          <input type="number" value={form.waterTemp} onChange={e => updateForm('waterTemp', e.target.value)}
            placeholder="물 온도 (°C)" min={0} max={100} className={inputCls} />
        </section>

        {/* 5. 브루잉 스텝 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">브루잉 스텝</p>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Step {step.stepOrder}</span>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(index)}
                      className="p-1 rounded-full hover:bg-[hsl(var(--surface-container))] transition-colors">
                      <X className="size-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <input type="text" value={step.label} onChange={e => updateStep(index, 'label', e.target.value)}
                  placeholder="단계 이름 (예: Bloom)" className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={step.duration} onChange={e => updateStep(index, 'duration', e.target.value)}
                    placeholder="시간 (초)" min={0} className={inputCls} />
                  <input type="number" value={step.waterAmount} onChange={e => updateStep(index, 'waterAmount', e.target.value)}
                    placeholder="물 양 (ml)" min={0} className={inputCls} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addStep}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[hsl(var(--surface-container))] text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="size-4" />스텝 추가
          </button>
        </section>

        {/* 6. 태그 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4 space-y-3">
          <p className="label-upper text-muted-foreground">태그</p>
          <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown} onBlur={addTag}
            placeholder="태그 입력 후 Enter 또는 쉼표" className={inputCls} />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-[hsl(var(--surface-container))] text-foreground/70 text-xs px-2 py-0.5 rounded-full">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 7. 공개 설정 */}
        <section className="rounded-2xl bg-[hsl(var(--surface-container-low))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-upper text-muted-foreground mb-1">공개 설정</p>
              <p className="text-sm text-foreground">{form.isPublic ? '공개' : '비공개'}</p>
            </div>
            <button type="button" role="switch" aria-checked={form.isPublic}
              onClick={() => updateForm('isPublic', !form.isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPublic ? 'bg-[hsl(var(--cta))]' : 'bg-[hsl(var(--surface-container))]'}`}>
              <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${form.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </section>

      </div>
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm px-4 py-3 safe-area-inset-bottom border-t border-border/40">
        <div className="max-w-lg mx-auto">
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <><Loader2 className="size-4 animate-spin" />저장 중...</> : '수정 완료'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/me/recipes/new/page.tsx "app/me/recipes/[id]/edit/page.tsx"
git commit -m "feat: replace free-text bean fields with BeanSearchField in recipe forms"
```

---

### Task 13: Feed + RecipeCard Updates

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/brewing/recipe-card.tsx`

- [ ] **Step 1: Update `app/page.tsx`**

Read the current `app/page.tsx` to find the `Recipe` interface. It currently contains `coffeeBean: string | null`, `origin: string | null`, `roastLevel: string | null` fields. Replace the entire `Recipe` interface with:

```tsx
interface BeanSummary {
  id: number
  name: string
  roastery: string
  origin: string
  roastLevel: string
  flavorNotes: string[]
}

interface Recipe {
  id: number
  title: string
  bean: BeanSummary | null        // replaces coffeeBean / origin / roastLevel
  waterTemp: number | null
  coffeeGrams: number | null
  waterGrams: number | null
  likeCount: number
  tags: string[]
  imageUrl: string | null
}
```

Then find the `<RecipeCard ... coffeeBean={recipe.coffeeBean} origin={recipe.origin} roastLevel={recipe.roastLevel} ...>` usage (there will be one or two instances) and replace those three props with `bean={recipe.bean}`.

- [ ] **Step 2: Update `components/brewing/recipe-card.tsx`**

Read the current `recipe-card.tsx` to see the full `RecipeCardProps` interface and JSX. The current props include `coffeeBean?: string | null`, `origin?: string | null`, `roastLevel?: string | null`. Do two things:

**2a. Replace `RecipeCardProps` interface** — remove the three fields and add `bean`:
```tsx
// Add BeanSummary interface above RecipeCardProps (same as defined in page.tsx):
interface BeanSummary {
  id: number; name: string; roastery: string
  origin: string; roastLevel: string; flavorNotes: string[]
}

// In RecipeCardProps, remove coffeeBean/origin/roastLevel and add:
bean?: BeanSummary | null       // replaces coffeeBean / origin / roastLevel
```

**2b. Replace the JSX that renders `coffeeBean` and `origin`** — find the lines that display those values (typically a `<p>` showing `coffeeBean · origin`) and replace with:
```tsx
{bean && (
  <p className="text-xs text-muted-foreground truncate">
    {bean.name} · {bean.origin} · {bean.roastLevel}
  </p>
)}
{bean?.flavorNotes && bean.flavorNotes.length > 0 && (
  <div className="flex gap-1 flex-wrap">
    {bean.flavorNotes.slice(0, 2).map(note => (
      <span key={note} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--cta))]/10 text-[hsl(var(--cta))]">{note}</span>
    ))}
  </div>
)}
```

Also remove the `roastLevel` badge rendering (find the `{roastLevel && ...}` JSX block and delete it — this info is now inside `bean.roastLevel` displayed inline above).

- [ ] **Step 3: Run dev server and verify feed renders with bean info**

```bash
npm run dev
# Navigate to http://localhost:3000 — recipe cards should show bean name/origin/roastLevel from BeanSummary
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/brewing/recipe-card.tsx
git commit -m "feat: update feed and recipe card to display BeanSummary"
```

---

## Final Verification

- [ ] **Backend: run full test suite**

```bash
cd /Users/minseok/Documents/GitHub/coffee-zip
./mvnw test 2>&1 | tail -10
```

Expected: All tests pass.

- [ ] **Frontend: run type check**

```bash
cd /Users/minseok/Documents/GitHub/coffee-zip-fe
npx tsc --noEmit 2>&1 | head -30
```

Expected: No type errors.

- [ ] **End-to-end smoke test (manual)**
  1. Start backend: `./mvnw quarkus:dev`
  2. Start frontend: `npm run dev`
  3. Log in → go to `/catalog` → tab shows 원두 list
  4. Click FAB → register a new bean → redirects to bean detail
  5. Click "리뷰 작성" → submit rating + tasting notes → detail page shows avg tasting bars
  6. Create new recipe → "원두" section shows search field → search and select bean
  7. Feed page → recipe card shows bean name + flavor notes

- [ ] **Production SQL (run manually on prod DB before deploying)**

```sql
-- After deploying backend with beanId column (Step 3 of Deployment Order in spec):
-- 1. Run data migration to create beans from existing coffeeBean values
--    (manual or scripted — see spec Deployment Order section)
-- 2. Drop old columns:
ALTER TABLE recipe
  DROP COLUMN coffee_bean,
  DROP COLUMN origin,
  DROP COLUMN roast_level;
```
