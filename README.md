![Cinimate Banner](https://i.imgur.com/FFhyZ66.png)
---
## 📸 Screenshots
 
| Home | Movie Details | Roulette |
|------|--------------|-----------------|
| ![Home](https://i.imgur.com/oCevBol.jpeg) | ![Modal](https://i.imgur.com/woZYbKq.jpeg) | ![Roulette](https://i.imgur.com/xZYO5Om.jpeg) |



 
---
## ✨ Features
 
### 🏠 Home
- **Auto-playing hero slider** — top trending titles rotate every 5 seconds with smooth fade transitions
- **Mood filter** — instantly switch the entire feed by vibe: Fun, Scary, Action, Drama, Mind-bending
- **8+ curated sections** — Now Playing, Coming Soon, Top Movies, Popular Series, and more — all deduplicated so no title appears twice
- **Countdown badges** — Coming Soon cards show a live countdown: "in 12 days", "in 3 hours"
- **Seasonal picks** — the feed automatically surfaces Halloween horror, Christmas family films, summer blockbusters, etc. based on the current date
- **Watch Together** — a dedicated section with tags (First Date / With Friends / Family) that surfaces the right films for the occasion

 
### 🔍 Search
- Multi-word and year-aware search across movies and TV shows
- 3-column poster grid with instant results
- Actor/director search with direct navigation to their filmography page
 
### 🎯 Recommendations
- **Infinite scroll feed** powered by a taste algorithm that weighs your ratings, watchlist, and watch history
- Ratings of 8–10 strongly boost similar content; ratings of 1–4 suppress that genre
- Uses TMDB's `/recommendations` endpoint for titles you rated highly — the most direct signal
- Feed snapshot on load means adding a new title won't re-shuffle the current page
 
### 👤 Profile
- Custom avatar (upload from camera roll) and bio
- Stats: watched count, queued, movies vs series breakdown
- Poster grid for both Watchlist and Watched lists, with your personal rating badge on each card
- **Watchlist Roulette** — spin a wheel to pick what to watch tonight, with a confetti burst on the result
- Edit your rating for any watched film directly from the film's detail card
 
### ⭐ Rating System
- Rate any watched film 1–10 directly after marking it watched
- Animated confirmation phase: a coloured ring pulses with the score, dots light up one by one
- Gold sparks burst on a perfect 10
- Ratings feed directly into the recommendation algorithm
 
### 🌍 Localization
- Full Russian / English toggle
- All TMDB data (titles, descriptions, posters) re-fetched in the selected language
- Language-neutral storage: saved lists always display in the current UI language
 
### 🔐 Auth & Sync
- Email/password sign-up and sign-in via Supabase Auth
- All data (watchlist, watched, ratings, profile) synced to the cloud in real time
- Guest mode available — with a clear warning that data is device-local only
- Sign out from Settings; data persists across devices when signed in
 
### 🎨 Visual Details
- Genre-coloured accent line at the bottom of every card (red for Horror, blue for Sci-Fi, pink for Romance…)
- Flash animation on save — green pulse for Watched, yellow for Watchlist
- Heartbeat animation on the bookmark button
- Dominant colour extracted from the poster tints the modal backdrop
- Confetti of stars and checkmarks bursts when you mark something watched
- Snow falls on the interface in December and January
- Dark and light themes, synced to user preference
 
---
 
## 🛠 Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, CSS Modules |
| Auth & Database | Supabase (PostgreSQL + Auth) |
| Movie Data | TMDB API v3 |
| Hosting | Vercel |
| Icons | Lucide React |
| Fonts | Bebas Neue, DM Sans |
 
---
 
## 🚀 Getting Started
 
### Prerequisites
- Node.js 18+
- A free [TMDB API key](https://www.themoviedb.org/settings/api)
- A free [Supabase](https://supabase.com) project
 
### Installation
 
```bash
git clone https://github.com/YOUR_USERNAME/cinimate.git
cd cinimate
npm install
```
 
### Environment Variables
 
Create a `.env` file in the root:
 
```env
REACT_APP_TMDB_TOKEN=your_tmdb_bearer_token
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your_supabase_anon_key
```
 
### Database Setup
 
Run this in your Supabase SQL Editor:
 
```sql
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  watched    jsonb default '[]'::jsonb,
  watchlist  jsonb default '[]'::jsonb,
  ratings    jsonb default '{}'::jsonb,
  profile    jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);
 
alter table public.user_data enable row level security;
 
create policy "Users can manage their own data"
  on public.user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```
 
### Run Locally
 
```bash
npm start
```
 
Open [http://localhost:3000](http://localhost:3000).
 
---
 
## 📁 Project Structure
 
```
src/
├── api.js                    # TMDB fetch wrapper with multi-page support
├── auth.js                   # Supabase auth context
├── store.js                  # Global state: watchlist, watched, ratings
├── theme.js                  # Dark/light theme + language context
├── supabase.js               # Supabase client
├── useLocalizedMovies.js     # Hook: hydrates saved lists in current language
├── components/
│   ├── MovieCard.js/css      # Poster card with genre colour, rating badge, flash
│   ├── MovieModal.js/css     # Film detail sheet: backdrop, cast, streaming, ratings
│   ├── BottomNav.js/css      # Mobile tab bar with filled/outline icon states
│   ├── SideNav.js/css        # Desktop sidebar
│   ├── Roulette.js/css       # Watchlist spin wheel
│   ├── RatingPrompt.js/css   # Animated post-watch rating dialog
│   ├── Countdown.js          # Live release countdown badge
│   └── Particles.js/css      # Background particle canvas
├── hooks/
│   └── useSeason.js          # Current season detection for themed sections
└── pages/
    ├── Home.js/css           # Hero slider, mood filter, all sections
    ├── Search.js/css         # Search with poster grid
    ├── Recs.js/css           # Infinite recommendation feed
    ├── Profile.js/css        # User stats, lists, roulette
    ├── AuthScreen.js/css     # Sign in / sign up / guest flow
    ├── ActorPage.js/css      # Actor filmography
    └── CollectionPage.js/css # Movie collection / studio page
```
 
---
 
## 🗺 Roadmap
 
- [ ] Google OAuth sign-in
- [ ] Share profile / lists with friends
- [ ] "Watch Together" real-time voting
- [ ] Offline mode with cached posters
 
---
 
## 🙏 Credits
 
- Movie data provided by [The Movie Database (TMDB)](https://www.themoviedb.org). This product uses the TMDB API but is not endorsed or certified by TMDB.
- Authentication and database by [Supabase](https://supabase.com)
- Icons by [Lucide](https://lucide.dev)
 
---
 
## 📄 License
 
MIT — feel free to fork and build on it.
