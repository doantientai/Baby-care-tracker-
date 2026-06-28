# 🍼 Baby Care Tracker

A private, **local-first** PWA for two parents to track newborn care together —
diapers, feeding, sleep, temperature, growth and more. Built mobile-first for
one-handed logging at 3am.

> ⚠️ The guidance in this app (fever thresholds, stool-color flags, diaper
> targets) reflects **general newborn-care standards** and is **not a
> substitute for medical advice**. When in doubt, call your doctor.

## Features

- **Quick logging** — one tap from the home screen for every event type.
- **Diapers** — pee / poop / both, amount (little / average / full), **stool
  color with danger flags** (white/clay, red, black-after-meconium prompt you to
  call a doctor), and texture.
- **Breastfeeding** — two-sided session timer that records **time on each breast
  separately** (start a side, *Switch*, *Stop*), suggests **which side to start
  next**, and logs the **feeding position** (cradle, cross-cradle, football,
  laid-back, side-lying).
- **Bottle** — formula / expressed / mixed, volume in ml with quick presets.
- **Temperature** — records measurement method and shows an **automatic fever
  assessment**; a fever in a baby **under 3 months is flagged as an emergency**.
- **Sleep** — live timer or manual entry; daily totals.
- **Cry, pump, medication / vitamin D, growth, notes.**
- **Weather** — current outdoor conditions for your location (default:
  Saint-Cyr-l'École 78210) via the keyless Open-Meteo API, plus a **safe-sleep
  nursery temperature** reminder (16–20 °C).
- **Dashboard** — today's wet/dirty diaper counts (vs. age-based target), feeds,
  sleep, last-feed time and next-side suggestion.
- **Trends** — diapers, feeds and sleep per day, plus a weight curve.
- **Multi-caregiver** — every entry records who logged it (Papa / Maman / …).
- **Offline-first PWA** — installable on iPhone & Android, works with no network.
- **Backup & share** — CSV export for your pediatrician, JSON backup/restore to
  move data between phones.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS (mobile-first)
- Dexie (IndexedDB) for local-first storage
- Recharts for trends
- `vite-plugin-pwa` (Workbox) for offline + installability
- Open-Meteo for weather (no API key)

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production / self-hosting:

```bash
npm run build
npm run preview
```

Then deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub
Pages, Cloudflare Pages…). On your phone, open the URL and **"Add to Home
Screen"** to install it as an app.

### First run

Open **Settings** and set your baby's **name** and **date of birth** — the DOB
powers age-based fever alerts and diaper targets. Add/rename caregivers there too.

## Sharing data between two phones

This version stores data **on each device**. To keep two phones in sync today:
**Settings → Export backup (JSON)** on one phone, send the file to the other,
then **Import backup** (imports are de-duplicated, so re-importing is safe).

### Future: live cloud sync

The whole app reads/writes through a single data layer (`src/db/`), so a cloud
backend (e.g. Supabase) can be added later for real-time multi-device sync
without rewriting the UI.

## Project structure

```
src/
  db/        types, Dexie schema, event CRUD
  lib/       clinical rules, weather, time, CSV/JSON export, event display
  state/     settings context, running timers
  components/ UI primitives, event card, log sheet (all forms), weather card
  pages/     Home (dashboard), Timeline, Trends, Settings
```
