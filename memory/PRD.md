# EKIPA Z JEEPA — Product Requirements

## Problem Statement (original, PL)
> strona internetowa dla klubu pilkarskiego

## User Choices
- Klub: **EKIPA Z JEEPA**
- Barwy: **różowe** (#FF007F) — logo dostarczy klient
- Sekcje: Strona główna, Aktualności, Zawodnicy, Terminarz, Wyniki, Galeria
- Panel administratora z logowaniem: **TAK**
- AI: **TAK** — asystent kibica + podsumowania meczów (Claude Sonnet 4.5 via Emergent LLM Key)
- Styl: **Nowoczesny, ciemny motyw sportowy**

## Architecture
- Backend: FastAPI + Motor (MongoDB) + JWT (cookie httpOnly) + bcrypt + emergentintegrations
- Frontend: React 19 + Tailwind + framer-motion + react-fast-marquee + sonner + lucide-react
- DB: MongoDB collections — users, news, players, matches, gallery, chat_messages

## Implemented (2026-04-28)
- Auth: login/logout/me/refresh, admin seeded from .env, bcrypt + JWT cookies
- CRUD: news, players, matches, gallery (admin-protected for write)
- Public read endpoints with seed demo data (10 players, 6 matches, 3 news, 6 photos)
- AI: `/api/ai/chat` (fan assistant w/ club context) and `/api/ai/match-summary/{id}`
- Frontend pages: Home, Aktualności, Zawodnicy, Terminarz, Wyniki, Galeria, Login, Admin
- Floating AI ChatBot widget (bottom-left) — public
- Admin panel: 4 tabs (Aktualności / Zawodnicy / Mecze / Galeria) + AI summary trigger
- Design: Dark obsidian (#0A0A0A) + electric pink (#FF007F), Anton headings + Inter body
- Testing: 21/21 backend pytest, 100% frontend e2e flows

## Backlog (future)
- P1: Edit (not just create/delete) for news/players/gallery in admin panel
- P1: Tabela ligowa (league table) — placeholder added in design
- P2: Sklep / bilety prezentacja
- P2: Newsletter sign-up
- P2: Player detail page route
- P2: Lenis smooth scroll integration
- P2: Image upload (currently URL-only) via storage integration
