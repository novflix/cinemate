# CineMate — Technical Documentation

> Complete technical reference for the CineMate web application.  
> Version: 1.0.3 | Stack: React 19 + Supabase + TMDB API

---

## Table of Contents

- [CineMate — Technical Documentation](#cinemate--technical-documentation)
  - [Table of Contents](#table-of-contents)
  - [1. Architecture Overview](#1-architecture-overview)
  - [2. Tech Stack](#2-tech-stack)
  - [3. Project Structure](#3-project-structure)
  - [4. Data Flow](#4-data-flow)
    - [App Startup](#app-startup)
    - [Save a Movie](#save-a-movie)
    - [Language Switch](#language-switch)
  - [5. Authentication System](#5-authentication-system)
  - [6. State Management](#6-state-management)
    - [State Slices](#state-slices)
    - [Normalized Movie Shape](#normalized-movie-shape)
    - [Cloud Sync](#cloud-sync)
  - [7. TMDB API Integration](#7-tmdb-api-integration)
    - [Wrapper Functions](#wrapper-functions)
    - [Multi-Page Fetching (Parallel)](#multi-page-fetching-parallel)
    - [Image Sizes Used](#image-sizes-used)
    - [Session Cache](#session-cache)
    - [Streaming Links](#streaming-links)
  - [8. Recommendation Algorithm](#8-recommendation-algorithm)
    - [Phase 1: Build Taste Profile](#phase-1-build-taste-profile)
      - [Signal Weights](#signal-weights)
      - [Seed Selection](#seed-selection)
    - [Phase 2: Fetch Candidates](#phase-2-fetch-candidates)
    - [Phase 3: Scoring](#phase-3-scoring)
    - [Refresh Behaviour](#refresh-behaviour)
    - [Infinite Scroll](#infinite-scroll)
  - [9. Search System](#9-search-system)
    - [Search Pipeline](#search-pipeline)
    - [Filter System](#filter-system)
  - [10. Cloud Sync (Supabase)](#10-cloud-sync-supabase)
    - [Supabase Client](#supabase-client)
    - [Data Table](#data-table)
    - [Row Level Security](#row-level-security)
    - [Sync Strategy](#sync-strategy)
  - [11. Localization System](#11-localization-system)
    - [ThemeContext](#themecontext)
    - [TMDB Localization](#tmdb-localization)
    - [Saved List Localization](#saved-list-localization)
  - [12. TV Series Tracker](#12-tv-series-tracker)
    - [Data Shape](#data-shape)
    - [UI Flow](#ui-flow)
  - [13. Admin Panel](#13-admin-panel)
  - [14. PWA \& iOS Support](#14-pwa--ios-support)
    - [Apple Touch Icons](#apple-touch-icons)
    - [Key PWA Meta Tags](#key-pwa-meta-tags)
    - [Liquid Glass (iOS 26)](#liquid-glass-ios-26)
  - [15. Performance Optimizations](#15-performance-optimizations)
    - [React](#react)
    - [Network](#network)
    - [Canvas](#canvas)
    - [CSS](#css)
    - [Scroll](#scroll)
  - [16. CSS Architecture \& Theming](#16-css-architecture--theming)
    - [CSS Variables](#css-variables)
    - [Layout](#layout)
  - [17. Icon System](#17-icon-system)
    - [Key Icon Mappings](#key-icon-mappings)
  - [18. Seasonal \& Effects System](#18-seasonal--effects-system)
    - [Season Detection](#season-detection)
    - [Effects](#effects)
  - [19. Build \& Deployment](#19-build--deployment)
    - [Build](#build)
    - [Deployment (Vercel)](#deployment-vercel)
  - [20. Environment Variables](#20-environment-variables)
  - [21. Database Schema](#21-database-schema)
    - [Data Sizes (Estimated)](#data-sizes-estimated)
  - [22. Custom Lists](#22-custom-lists)
  - [23. About Page / Landing](#23-about-page--landing)
  - [24. Vercel Deployment & SPA Routing](#24-vercel-deployment--spa-routing)

---

## 1. Architecture Overview

CineMate is a **client-side React SPA** with no custom backend. All data lives in two external services:

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ AuthCtx  │  │StoreCtx  │  │ThemeCtx  │  │ AdminCtx  │  │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └───────────┘  │
│       │              │                                       │
│       ▼              ▼                                       │
│  ┌─────────┐   ┌──────────┐                                 │
│  │Supabase │   │localStorage│                               │
│  │  Auth   │   │  (cache)  │                                │
│  └─────────┘   └──────────┘                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                ┌──────────┴──────────┐
                │                     │
          ┌─────▼──────┐      ┌───────▼──────┐
          │  TMDB API  │      │   Supabase   │
          │ (films DB) │      │  (user data) │
          └────────────┘      └──────────────┘
```

**Key design decisions:**
- Zero backend — reduces infrastructure cost and complexity
- All movie data comes from TMDB API at runtime (no ETL, always fresh)
- User data (watchlists, ratings) stored in Supabase PostgreSQL
- Guest mode fully supported — localStorage only, no account required
- All React Context, no Redux or Zustand — sufficient for this scale

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| UI Framework | React | 19.x | Component tree, hooks, rendering |
| Build Tool | Create React App | 5.x | Webpack, Babel, dev server |
| Auth + DB | Supabase | JS v2 | Authentication, PostgreSQL, realtime |
| Movie Data | TMDB API | v3 | Films, TV shows, cast, images |
| Hosting | Vercel | — | Static file CDN, auto-deploy |
| Icons | Solar Icon Set | 2.0.1 | UI icons (1200+ Linear style) |
| Fonts | Google Fonts | — | Bebas Neue (headings), DM Sans (body) |
| CSS | Vanilla CSS + CSS Variables | — | No CSS-in-JS, no Tailwind |

---

## 3. Project Structure

```
cinemate/
├── public/
│   ├── index.html              # PWA meta tags, Apple touch icons
│   ├── manifest.json           # Web app manifest
│   └── apple-touch-icon*.png   # iOS home screen icons (6 sizes)
│
├── src/
│   ├── App.js                  # Root: auth gate, routing, providers
│   ├── index.js                # Entry point, global CSS imports
│   ├── index.css               # CSS variables, global styles, animations
│   ├── liquid-glass.css        # iOS 26 Liquid Glass effects
│   │
│   ├── auth.js                 # AuthContext: Supabase auth wrapper
│   ├── store.js                # StoreContext: app state + cloud sync
│   ├── theme.js                # ThemeContext: dark/light, language
│   ├── admin.js                # AdminContext: dev tools for admin user
│   ├── supabase.js             # Supabase client singleton
│   ├── api.js                  # TMDB API wrapper, getPages(), streaming links
│   ├── useLocalizedMovies.js   # Hook: hydrates saved lists in current language
│   ├── useSync.js              # Debounced cloud sync helper
│   │
│   ├── components/
│   │   ├── MovieCard.js/css    # Film poster card with save buttons
│   │   ├── MovieModal.js/css   # Film detail sheet with full info
│   │   ├── BottomNav.js/css    # Mobile tab bar (4 tabs)
│   │   ├── SideNav.js/css      # Desktop sidebar (sticky)
│   │   ├── ScrollRow.js/css    # Horizontal scroll + desktop arrows
│   │   ├── RatingPrompt.js/css # Post-watch rating picker (animated)
│   │   ├── Roulette.js/css     # Watchlist spin wheel
│   │   ├── Countdown.js        # Live "in X days" badge
│   │   ├── Confetti.js         # Canvas confetti on mark-watched
│   │   ├── Particles.js/css    # Background particle field
│   │   └── Effects.js/css      # SnowEffect, SparkBurst, FireParticles
│   │
│   ├── hooks/
│   │   ├── useDominantColor.js # Extracts accent color from poster image
│   │   └── useSeason.js        # Current season detection + config
│   │
│   └── pages/
│       ├── Home.js/css         # Main feed: hero, mood filter, sections
│       ├── Search.js/css       # Search + filters (genre, year, type, sort)
│       ├── Recs.js/css         # Infinite recommendation feed
│       ├── Profile.js/css      # User profile, lists, settings
│       ├── ActorPage.js/css    # Actor bio + full filmography
│       ├── AuthScreen.js/css   # Sign in / sign up / guest flow
│       ├── About.js/css        # App info page (desktop only)
│       └── CollectionPage.js   # Film collections / studios
│
├── .env                        # Local env variables (not committed)
├── package.json
└── TECHNICAL.md                # This file
```

---

## 4. Data Flow

### App Startup

```
1. App.js mounts
2. AuthProvider → supabase.auth.getSession() → sets user state
3. If user logged in:
   a. StoreProvider receives userId
   b. loadFromCloud(userId) → fetches user_data from Supabase
   c. Merges cloud data into localStorage
4. If guest:
   a. StoreProvider receives null userId
   b. Loads from localStorage only
5. Home page loads → fetches TMDB data (parallel)
6. sessionStorage cache checked first (5min TTL)
```

### Save a Movie

```
User taps "Eye" button on MovieCard
  → handleWatched() fires
  → addToWatched(movie) in StoreContext
  → watched[] state updated
  → localStorage.setItem('watched', ...) (sync)
  → pendingRating set → RatingPrompt appears
  → After 1500ms debounce: syncToCloud() fires
  → supabase.from('user_data').upsert({...})
```

### Language Switch

```
User toggles RU/EN in Settings
  → ThemeContext.setLang('en')
  → localStorage.setItem('lang', 'en')
  → All components re-render via useTheme()
  → useLocalizedMovies() detects lang change
  → Re-fetches TMDB data with language=en-US
  → Replaces titles/posters in saved lists
```

---

## 5. Authentication System

**File:** `src/auth.js`

Uses Supabase Auth v2 with email/password. No OAuth configured currently.

```javascript
// AuthContext exports:
{
  user,        // Supabase User object | null | undefined (loading)
  loading,     // boolean — auth operation in progress
  signUp,      // (email, password) → { data, error }
  signIn,      // (email, password) → { data, error }
  signOut,     // () → void
}
```

**Session persistence:** Supabase JS v2 automatically persists the session in `localStorage` under `sb-[project-ref]-auth-token`. On app load, `getSession()` restores the session without a network call.

**Auth state machine:**
```
undefined → loading (waiting for getSession)
null      → not logged in (guest mode)
User{}    → authenticated
```

**Guest → Account migration:**  
When a guest user registers in Settings, `signUp()` is called. `onAuthStateChange` fires → `StoreProvider` receives the new `userId` → on first cloud load it finds empty cloud data → writes current localStorage data to cloud. All lists, ratings, and progress migrate automatically.

---

## 6. State Management

**File:** `src/store.js`

Single React Context (`StoreContext`) holds all app state. The context value is memoized with `useMemo` to prevent unnecessary re-renders.

### State Slices

| Slice | Type | Description |
|-------|------|-------------|
| `watched` | `Movie[]` | Films/shows marked as watched |
| `watchlist` | `Movie[]` | Films/shows queued to watch |
| `ratings` | `{ [id]: 1-10 }` | User ratings by movie ID |
| `profile` | `{ name, avatar, bio }` | User profile data |
| `likedActors` | `{ [id]: Actor }` | Actors the user liked |
| `dislikedIds` | `number[]` | Movie IDs hidden from recommendations |
| `tvProgress` | `{ [id]: { season, episode, totalSeasons } }` | Series watch progress |
| `customLists` | `{ [listId]: CustomList }` | User-created custom lists |
| `pendingRating` | `Movie | null` | Triggers RatingPrompt overlay |
| `showConfetti` | `boolean` | Triggers confetti animation |

### Normalized Movie Shape

```typescript
interface NormalizedMovie {
  id: number;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  release_date: string | null;
  first_air_date: string | null;
  _fallback_title: string;
}
```

All movies are normalized via `normalize()` before storage to keep saved data lean (no unnecessary TMDB fields).

### Cloud Sync

```javascript
// Debounced 1500ms after any state change
syncToCloud(userId, {
  watched, watchlist, ratings, profile,
  liked_actors, disliked_ids, tv_progress, custom_lists
})
// → supabase.from('user_data').upsert(...)
```

localStorage is always written synchronously; Supabase is written with debounce to avoid excessive API calls.

---

## 7. TMDB API Integration

**File:** `src/api.js`

**Base URL:** `https://api.themoviedb.org/3`  
**Auth:** Bearer token in `Authorization` header  
**Image CDN:** `https://image.tmdb.org/t/p/`

### Wrapper Functions

```javascript
tmdb.trending(type, window)     // GET /trending/{type}/{window}
tmdb.popular(type, pages)       // GET /{type}/popular (multi-page)
tmdb.topRated(type, pages)      // GET /{type}/top_rated
tmdb.nowPlaying(pages)          // GET /movie/now_playing
tmdb.upcoming(pages)            // GET /movie/upcoming
tmdb.discover(type, params, pages) // GET /discover/{type}
tmdb.posterUrl(path, size)      // → full image URL
tmdb.backdropUrl(path, size)    // → full backdrop URL
```

### Multi-Page Fetching (Parallel)

```javascript
const getPages = async (path, params, pages = 2) => {
  // Fetch page 1 first to get total_pages
  const first = await get(path, { ...params, page: 1 });
  const total = Math.min(pages, first.total_pages || 1);
  
  // Fetch remaining pages IN PARALLEL
  const rest = await Promise.all(
    Array.from({ length: total - 1 }, (_, i) =>
      get(path, { ...params, page: i + 2 })
    )
  );
  
  return [...first.results, ...rest.flatMap(d => d.results)];
};
```

Pages are fetched in parallel (not sequential) — this cuts load time from `N × latency` to `1 × latency + overhead`.

### Image Sizes Used

| Context | Size | Dimensions |
|---------|------|-----------|
| Card poster | `w500` | ~342×513px |
| Modal main poster | `w780` | ~780×1170px |
| Backdrop | `w1280` | ~1280×720px |
| Cast photos | `w342` | ~342×513px |
| Actor photo | `w500` | ~500×750px |
| Streaming logos | `w92` | ~92×92px |

### Session Cache

Home page results are cached in `sessionStorage` for 5 minutes:
```javascript
const key = 'cinemate_home_cache_v1_' + lang;
// TTL: Date.now() - ts > 5 * 60 * 1000
```

This prevents refetching on tab switch or navigation back to home.

### Streaming Links

```javascript
const STREAMING_LINKS = {
  8:    'Netflix',
  9:    'Amazon Prime',
  337:  'Disney+',
  350:  'Apple TV+',
  384:  'Max',
  1899: 'Max',
  15:   'Hulu',
  531:  'Paramount+',
  283:  'Crunchyroll',
  192:  'YouTube',
  555:  'Okko',
  505:  'IVI',
  635:  'Kinopoisk',
};
```

---

## 8. Recommendation Algorithm

**File:** `src/pages/Recs.js`

The algorithm runs entirely client-side and consists of two phases: **Profile Building** and **Candidate Fetching**.

### Phase 1: Build Taste Profile

```
buildProfile(watched, watchlist, ratings, likedActors, dislikedIds)
  → { seedMovies, likedActorIds, genreBoost, avoidIds }
```

#### Signal Weights

| Signal | Seed Weight | Genre Boost |
|--------|-------------|-------------|
| Rating 9–10 | **5.0** (×2 via /similar) | +2.5 |
| Rating 8 | **3.5** | +1.5 |
| Rating 7 | **2.0** | +0.8 |
| Rating 5–6 | **0.4** | none |
| Rating 4 | skip | none |
| Rating 1–3 | skip | penalty only if 2+ bad |
| Unrated watched | **0.8** | +0.3 |
| Watchlist | **2.0** | +1.2 |

**Genre penalty logic:** A genre is only penalised if the user has rated **2+ films in that genre with score 1-3**. One bad rating is treated as a one-off — not a genre preference. This avoids the "disliked Iron Man 3 = hates all action movies" problem.

#### Seed Selection
Top 10 positive seeds by weight. On each page load, seeds rotate using `(page - 1 + i) % seeds.length` so different pages show different recommendations.

### Phase 2: Fetch Candidates

Four parallel strategies per page:

```
Strategy 1: /recommendations endpoint
  → For each of top 4 seeds
  → TMDB returns "if you liked X, try these"
  → source_weight = seed.weight

Strategy 1b: /similar endpoint  
  → Only for seeds with strategy:'similar' (ratings 9-10)
  → Finds structurally similar films (same director, themes)
  → source_weight = seed.weight

Strategy 2: Liked actor filmographies
  → GET /person/{actorId}/movie_credits
  → Top 20 by popularity, vote_average ≥ 5
  → source_weight = 3.0

Strategy 3: Genre discover
  → Top 2 boosted genres via /discover/movie + /discover/tv
  → vote_count.gte=200, recent films preferred
  → source_weight = 1.0 or 0.8

Strategy 4 (fallback): Trending
  → Only when user has no taste data
  → /trending/movie/week + /tv/top_rated
```

### Phase 3: Scoring

```javascript
// Bayesian average: penalises obscure films with few votes
const bayesian = (voteAvg * voteCount + 6 * 100) / (voteCount + 100);

// Genre alignment bonus
let genreScore = sum(genreBoost[g] * 0.12 for g in movie.genre_ids);

// Recency bonus: small reward for newer films
const year = parseInt(movie.release_date.slice(0, 4));
const recency = Math.max(0, (year - 2000) / 25) * 0.3;

// Final score
score = bayesian * source_weight + genreScore + recency;
```

**Bayesian average** prevents films with 9.8 from 12 votes from outranking films with 8.2 from 50,000 votes.

### Refresh Behaviour

Each press of the refresh button increments `pageOffset` by a random 1-4:
```javascript
const newOffset = (current + random(1-4)) % 10;
pageRef.current = 1 + newOffset;
```

This pulls a different page from TMDB, showing different results while staying relevant.

### Infinite Scroll

Uses a scroll event listener mounted once (`[]` deps) that reads state via refs:
```javascript
const scrollEl = loaderRef.current?.closest('.app-content') || window;
scrollEl.addEventListener('scroll', checkScroll, { passive: true });

// checkScroll reads hasMoreRef.current and doLoadRef.current
// (never stale, never re-mounts)
```

---

## 9. Search System

**File:** `src/pages/Search.js`

### Search Pipeline

```
User types query
  → 350ms debounce
  → enhancedSearch(query, langCode, filters)
    1. /search/movie + /search/tv (parallel)
    2. Year detection: "Spider-Man 2023" → year=2023, query="Spider-Man"
    3. Keyword fallback: /search/keyword → /discover/movie?with_keywords=
    4. Apply client-side filters (genre, year range)
    5. Sort by selected sort option
  → setResults(arr)
```

### Filter System

| Filter | Options | API param |
|--------|---------|-----------|
| Type | All / Movies / Series | determines endpoint |
| Sort | Popularity / Rating / Newest / Oldest | `sort_by` |
| Year | 5 preset ranges | `primary_release_date.gte/lte` |
| Genre | 14 genres (multi-select) | `with_genres` |

When **no query but filters set**, uses `/discover` directly for browsing.

When **query + filters**, fetches by text search then filters client-side.

---

## 10. Cloud Sync (Supabase)

**File:** `src/store.js`, `src/supabase.js`

### Supabase Client

```javascript
// src/supabase.js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);
```

### Data Table

```sql
create table public.user_data (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  watched      jsonb default '[]',
  watchlist    jsonb default '[]',
  ratings      jsonb default '{}',
  profile      jsonb default '{}',
  liked_actors jsonb default '{}',
  disliked_ids jsonb default '[]',
  tv_progress  jsonb default '{}',
  updated_at   timestamptz default now()
);
```

### Row Level Security

```sql
-- Users can only read/write their own row
create policy "Users manage own data"
  on public.user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Sync Strategy

- **Load:** On login, `loadFromCloud()` fetches once and overwrites localStorage
- **Save:** `syncToCloud()` debounced 1500ms — batches rapid changes (e.g. rate movie → triggers one write, not many)
- **Conflict resolution:** Last-write-wins. Cloud always wins on login.

---

## 11. Localization System

**File:** `src/theme.js`, `src/useLocalizedMovies.js`

### ThemeContext

```javascript
const { lang, setLang } = useTheme();
// lang: 'ru' | 'en'

// Translation helper
t(lang, 'Русский текст', 'English text')
```

### TMDB Localization

The `Accept-Language` header is set based on `lang`:
```javascript
const langCode = lang === 'en' ? 'en-US' : 'ru-RU';
// Passed to all TMDB requests
```

### Saved List Localization

`useLocalizedMovies(items, lang)` re-fetches titles/posters for saved items in the current language:

```javascript
// Two-level cache:
// 1. In-memory Map (instantaneous)
// 2. localStorage key 'cinemate_localized_cache_v2' (persists across sessions)

// Batch size: 10 concurrent requests
// Debounced localStorage write: 2000ms
```

Items in lists are stored with `_fallback_title` (original title at save time). If localized data is unavailable, falls back gracefully.

---

## 12. TV Series Tracker

**Files:** `src/store.js`, `src/components/MovieModal.js`, `src/components/MovieCard.js`

### Data Shape

```typescript
interface TvProgress {
  season: number;
  episode: number;
  totalSeasons: number;
}
// Stored as: tvProgress[movieId] = TvProgress
```

### UI Flow

1. User adds a series to Watchlist
2. **In modal:** "Track progress" button appears (only for `media_type === 'tv'` AND `inList === true`)
3. Tapping opens a `RatingPrompt`-style panel with `±` counters for season and episode
4. On save: `setTvProgressEntry(id, { season, episode, totalSeasons })` → store → localStorage → cloud
5. **On card:** golden `S2·E7` badge + progress bar rendered at poster bottom
6. **In Profile queue:** shows show is in "Watching" section (distinct from regular queue items)

---

## 13. Admin Panel

**File:** `src/admin.js`

Controlled by `REACT_APP_ADMIN_ID` environment variable. If the logged-in user's Supabase UUID matches, `isAdmin = true`.

```javascript
const ADMIN_ID = process.env.REACT_APP_ADMIN_ID || null;
const isAdmin = !!(ADMIN_ID && userId === ADMIN_ID);
```

**Admin-only settings visible in Settings modal:**

| Control | Description |
|---------|-------------|
| ❄️ Snow | Force snow effect regardless of month |
| 🗓 Season | Override detected season (Auto / Halloween / New Year / Summer / Winter / Spring / Autumn) |

Settings persist in `localStorage` under `cinemate_admin_overrides`.

---

## 14. PWA & iOS Support

**Files:** `public/index.html`, `public/manifest.json`, `src/liquid-glass.css`

### Apple Touch Icons

Six sizes generated from the original favicon:
```
apple-touch-icon.png        (180×180, default)
apple-touch-icon-180x180.png
apple-touch-icon-167x167.png (iPad Pro)
apple-touch-icon-152x152.png (iPad)
apple-touch-icon-120x120.png (iPhone)
apple-touch-icon-76x76.png   (iPad mini)
```

### Key PWA Meta Tags

```html
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="CineMate"/>
<meta name="viewport" content="..., viewport-fit=cover"/>
```

### Liquid Glass (iOS 26)

`liquid-glass.css` applies Apple's iOS 26 Liquid Glass aesthetic using `@supports (-webkit-touch-callout: none)` — this CSS selector is **only recognised by iOS Safari**, making all styles inside invisible to Android and desktop.

```css
@supports (-webkit-touch-callout: none) {
  .bottom-nav__inner {
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(48px) saturate(2.2) brightness(1.15);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.55),   /* prismatic top edge */
      inset 0 -1px 0 rgba(255,255,255,0.12),  /* bottom edge */
      0 8px 40px rgba(0,0,0,0.28);            /* outer shadow */
  }
}
```

Applied to: bottom nav, modals, rating prompt, settings, roulette, hero labels.

---

## 15. Performance Optimizations

### React

| Optimization | Applied To | Effect |
|-------------|-----------|--------|
| `React.memo` | MovieCard, BottomNav, SideNav, MovieModal, RatingPrompt, ScrollRow | Skip re-render if props unchanged |
| `useCallback` | MovieCard handlers, Search filter callbacks | Stable function references |
| `useMemo` | StoreContext value, allSaved in Recs | Avoid object recreation |
| Memoized context | StoreContext | All consumers skip render if state unchanged |

### Network

| Optimization | Description |
|-------------|-------------|
| Parallel `getPages` | TMDB multi-page fetches run concurrently, not sequentially |
| Session cache | Home page data cached in sessionStorage (5min TTL) |
| Debounced sync | Cloud writes batched with 1500ms debounce |
| Debounced localStorage | Localization cache writes batched with 2000ms debounce |
| Batch size 10 | useLocalizedMovies fetches 10 items concurrently |
| Pages 2 not 3 | Home sections fetch 2 pages = 40 items (was 3 = 60) |

### Canvas

| Optimization | Description |
|-------------|-------------|
| Particles: 28 not 55 | Fewer particles, less GPU work |
| 30fps cap | Both particle and snow effects capped via `ts - last < 33` |
| Snow: 30 not 60 flakes | Half the draw calls |
| `visibilitychange` pause | Canvas loops stop when tab is hidden |

### CSS

```css
.movie-card { contain: layout style; }       /* Isolate card repaints */
.will-change { will-change: transform; }      /* Pre-promote to GPU layer */
content-visibility: auto;                     /* Skip off-screen renders */
```

### Scroll

Infinite scroll uses a single scroll event listener mounted once, reading state via refs — avoids the re-mount/re-subscribe cycle that caused the previous double-trigger bug.

---

## 16. CSS Architecture & Theming

### CSS Variables

```css
:root {
  /* Spacing */
  --nav-h: 72px;      /* Bottom nav height */
  --sidebar-w: 220px; /* Desktop sidebar width */

  /* Dark theme (default) */
  --bg:       #080810;
  --bg2:      #0f0f1a;
  --surface:  #141424;
  --surface2: #1a1a2e;
  --border:   rgba(255,255,255,0.08);
  --text:     #f0eff8;
  --text2:    #a0a0b8;
  --text3:    #606078;
  --accent:   #e8c547;   /* Gold */
  --accent2:  #ff6b35;   /* Orange */
}

[data-theme="light"] {
  --bg:       #f0eff8;
  --bg2:      #ffffff;
  /* ... */
}
```

### Layout

Desktop (≥900px): sidebar fixed, content scrolls independently:
```css
.app-shell  { flex-direction: row; height: 100dvh; overflow: hidden; }
.app-content { flex: 1; height: 100dvh; overflow-y: auto; }
.side-nav   { position: sticky; top: 0; height: 100dvh; }
```

Mobile: full-width single column, bottom nav overlay.

---

## 17. Icon System

**Package:** `solar-icon-set` v2.0.1  
**Style:** Linear (outline) throughout

All Lucide icons replaced with Solar equivalents. Solar exports 1200+ React components as ESM, enabling tree shaking — only imported icons are bundled.

### Key Icon Mappings

| UI Element | Solar Icon |
|-----------|-----------|
| Search | `MagniferLinear` |
| Save to watchlist | `BookmarkLinear` / `BookmarkOpenedLinear` |
| Mark watched | `EyeLinear` / `EyeClosedLinear` |
| Rating | `StarLinear` |
| Home tab | `Home2Linear` |
| For You tab | `MagicStickLinear` |
| Profile tab | `UserLinear` |
| Settings | `SettingsMinimalisticLinear` |
| TV shows | `TVLinear` |
| Films | `VideoLibraryLinear` |

---

## 18. Seasonal & Effects System

**File:** `src/hooks/useSeason.js`, `src/components/Effects.js`

### Season Detection

```javascript
getCurrentSeason(override = null) {
  if (override) return override; // admin override
  
  const month = new Date().getMonth() + 1;
  const day   = new Date().getDate();

  if (month === 10 && day >= 20) return 'halloween';
  if (month === 11 && day >= 25) return 'newyear';
  if (month === 12)               return 'newyear';
  if (month === 1  && day <= 14)  return 'newyear';
  if (month >= 6 && month <= 8)   return 'summer';
  if (month >= 12 || month <= 2)  return 'winter';
  if (month >= 3  && month <= 5)  return 'spring';
  return 'autumn';
}
```

Each season configures a special section on the Home page with themed genres.

### Effects

| Effect | Trigger | Implementation |
|--------|---------|---------------|
| Snow | December–January OR admin override | Canvas, 30 flakes, 25fps |
| Confetti | Mark movie as watched | Canvas, `★ ✓ ✦ ●` shapes |
| Sparks | Rate a movie 10/10 | Canvas burst, 60 particles |
| Particles | Always (background) | Canvas, 28 gold particles, 30fps |

---


## 22. Custom Lists

**Files:** `src/pages/Profile.js`, `src/store.js`

Custom Lists allow users to create curated collections beyond the built-in Watchlist/Watched. Each list is independent, has its own metadata, and syncs to the cloud.

### Data Shape

```typescript
interface CustomList {
  id: string;            // "list_1712345678901"
  name: string;
  description: string;
  image: string | null;  // base64 data URL (user upload)
  items: NormalizedMovie[];
  createdAt: number;     // Date.now()
  showProgress: boolean; // show watched/total progress bar
  deadline: string | null; // ISO date string "2025-12-31"
}

// Stored as: customLists[id] = CustomList
```

### Store Operations

```javascript
createCustomList(name, description, image, opts)
  // opts: { showProgress, deadline }
  // → generates id = `list_${Date.now()}`
  // → returns id

addToCustomList(listId, movie)     // adds if not duplicate
removeFromCustomList(listId, id)   // removes by movie id
updateListMeta(listId, meta)       // patches name/desc/image/opts
deleteCustomList(listId)           // removes from state
isInCustomList(listId, movieId)    // boolean check
```

### Progress Calculation

Progress is computed at render time — not stored — by cross-referencing list items against the `watched[]` slice:

```javascript
const watchedCount = list.items.filter(m => isWatched(m.id)).length;
const pct = total > 0 ? Math.round((watchedCount / total) * 100) : 0;
```

This means progress updates automatically when the user marks a film as watched anywhere in the app.

### List Edit Page

`ListEditPage` handles both create and edit flows:

- **Create:** `listId = null` → `createCustomList()` on save, `setCurrentId()` to persist adds before explicit save
- **Edit:** `listId = existingId` → pre-fills state from `customLists[listId]`, calls `updateListMeta()` on save
- After save, navigates to `{ view: 'detail', id }` in both cases

### List Detail Page

- Shows progress bar + deadline if configured
- Each poster has `movie-card__overlay`-style buttons (Watchlist + Watched) — identical markup and CSS to `MovieCard`
- Buttons are always visible on mobile (no `hover: hover` required), appear on hover on desktop
- Both buttons are full toggles: watched → `removeFromWatched`, watchlist → `removeFromWatchlist`
- Edit button (pencil) in header navigates to `ListEditPage` with the current `listId`

---

## 23. About Page / Landing

**Files:** `src/pages/About.js`, `src/pages/About.css`

The About page doubles as a product landing page with several interactive elements.

### Film Strip

Animated scrolling strip of real TMDB posters (20 films, duplicated for seamless loop). Uses `requestAnimationFrame` with a mutable ref for position — avoids React re-renders entirely:

```javascript
const posRef = useRef(offset);
const animate = () => {
  posRef.current -= direction * (speed / 60);
  if (posRef.current < -total) posRef.current += total;
  trackRef.current.style.transform = `translateX(${posRef.current}px)`;
  rafRef.current = requestAnimationFrame(animate);
};
```

Two rows scroll in opposite directions at different speeds.

### Mouse Parallax

Hero section floating posters respond to mouse position via CSS custom properties:

```javascript
// On mousemove:
el.style.setProperty('--mx', x.toFixed(3)); // -1 to 1
el.style.setProperty('--my', y.toFixed(3));

// In CSS:
.ahp--1 { transform: translateX(calc(var(--mx, 0) * -12px)) ... }
```

No state updates — direct DOM manipulation for 60fps without React overhead.

### Easter Eggs

| Trigger | Effect |
|---------|--------|
| Konami Code `↑↑↓↓←→←→BA` | Full-screen overlay with spinning 🎬 |
| Click logo 7× | "Кинофанат обнаружен!" tooltip appears |
| Hint visible at page bottom | Opacity reveals on hover |

### Quote Rotator

Five film director/critic quotes cycle every 4.5s with fade transition. State-based opacity toggle avoids layout shift.

### Interactive Rating Demo

Fully functional 1–10 star picker with colour coding and Russian labels — demonstrates the rating system without requiring account creation.

---

## 24. Vercel Deployment & SPA Routing

**File:** `vercel.json`

Since CineMate uses tab-based navigation (not `react-router-dom`), all routing is handled via React state. The `vercel.json` rewrite ensures any URL path resolves to `index.html`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This is required for any direct URL access (e.g. bookmarks, shared links) to work — without it Vercel returns 404 for non-root paths.

---

## 19. Build & Deployment

### Build

```bash
npm run build
# → Creates /build with:
#   build/static/js/main.[hash].js  (~146kb gzipped)
#   build/static/css/main.[hash].css (~13kb gzipped)
#   build/index.html
```

### Deployment (Vercel)

1. Push to GitHub `master` branch
2. Vercel webhook triggers
3. Vercel runs `npm run build`
4. Outputs deployed to CDN

**Environment variables** must be set in Vercel dashboard (Settings → Environment Variables) — they are not read from `.env` file in production.

---

## 20. Environment Variables

```bash
# src/.env (local development only — NOT committed)

REACT_APP_TMDB_TOKEN=eyJ...     # TMDB API v4 Bearer token
REACT_APP_SUPABASE_URL=https://[project].supabase.co
REACT_APP_SUPABASE_KEY=sb_publishable_...
REACT_APP_ADMIN_ID=47f2c48c-...  # Supabase user UUID for admin access
```

All variables must be prefixed with `REACT_APP_` to be accessible in Create React App builds.

---

## 21. Database Schema

```sql
-- Run in Supabase SQL Editor

create table if not exists public.user_data (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  watched      jsonb not null default '[]'::jsonb,
  watchlist    jsonb not null default '[]'::jsonb,
  ratings      jsonb not null default '{}'::jsonb,
  profile      jsonb not null default '{}'::jsonb,
  liked_actors jsonb not null default '{}'::jsonb,
  disliked_ids jsonb not null default '[]'::jsonb,
  tv_progress  jsonb not null default '{}'::jsonb,
  custom_lists jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Users manage own data"
  on public.user_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on public.user_data(user_id);
```

### Data Sizes (Estimated)

| Column | Typical Size | Max Expected |
|--------|-------------|-------------|
| `watched` | 2–20kb | ~100kb (1000+ films) |
| `watchlist` | 1–5kb | ~20kb |
| `ratings` | 0.5–5kb | ~20kb |
| `liked_actors` | 0.2–2kb | ~5kb |
| `tv_progress` | 0.1–2kb | ~10kb |
| `custom_lists` | 1–20kb | ~200kb (many lists with images) |

Supabase free tier allows 500MB total — with typical usage this supports **~20,000 users** before needing an upgrade.

---

*Last updated: April 2026*  
*CineMate v1.0.3*