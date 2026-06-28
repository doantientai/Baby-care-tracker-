# 🍼 Baby Care Tracker

A private app for two parents to track newborn care together — diapers, feeding,
sleep, temperature, growth and more. Built mobile-first for one-handed logging at
3am.

There are **two versions** in this repo:

| Version | Where | Needs a server / build? | Best for |
| --- | --- | --- | --- |
| **Single HTML file** ⭐ | [`index.html`](index.html) | **No** — just open it | The simplest way to use it |
| React PWA | [`react-app/`](react-app/) | Yes (`npm`, build step) | Future cloud sync, app-store-style PWA |

> ⚠️ The guidance in this app (fever thresholds, stool-color flags, diaper
> targets) reflects **general newborn-care standards** and is **not a
> substitute for medical advice**. When in doubt, call your doctor.

## ⭐ The simple version — `index.html`

One self-contained file. **No server, no build, no install.** Everything (HTML,
CSS, JavaScript) is inside it, and your data is saved privately in the browser
(`localStorage`).

**To use it, pick either:**

1. **Just open the file** — download `index.html` and double-click it (opens as
   `file://…`). Works fully offline. *(The only thing that needs internet is the
   outdoor-weather widget.)*
2. **Host it** (recommended for using it on two phones) — put `index.html` on any
   static host (Netlify drop, GitHub Pages, Cloudflare Pages, a USB-synced
   folder…), open the URL on each phone, and **"Add to Home Screen"** to get an
   app icon.

> Note: data lives **per device/browser**. Use **Settings → Export / Import
> backup** to copy entries between phones (imports are de-duplicated, so
> re-importing is safe).

### First run

Open **Settings** → set the baby's **name** and **date of birth**. The DOB powers
the age-based fever alerts (a fever under 3 months is flagged as an emergency) and
the daily wet-diaper target.

## Features (both versions)

- **Quick logging** — one tap from the home screen for every event type.
- **Diapers** — pee / poop / both, amount, **stool color with danger flags**
  (white/clay, red, black-after-meconium prompt you to call a doctor), texture.
- **Breastfeeding** — two-sided session timer that records **time on each breast
  separately** (start a side → *Switch* → *Stop*), suggests **which side to start
  next**, and logs the **feeding position** (cradle, cross-cradle, football,
  laid-back, side-lying).
- **Bottle** — formula / expressed / mixed, volume with quick presets.
- **Temperature** — measurement method + **automatic fever assessment**; under
  3 months a fever is flagged as an **emergency**.
- **Sleep** — live timer or manual entry; daily totals.
- **Cry, pump, medication / vitamin D, growth, notes.**
- **Weather** — current outdoor conditions for your location (default
  Saint-Cyr-l'École 78210) via the keyless Open-Meteo API, plus a **safe-sleep
  nursery temperature** reminder (16–20 °C).
- **Dashboard** — today's wet/dirty counts vs. age target, feeds, sleep, last-feed
  time and next-side suggestion.
- **Trends** — diapers, feeds and sleep per day, plus a weight curve.
- **Multi-caregiver** — every entry records who logged it (Papa / Maman / …).
- **Backup & share** — CSV export for your pediatrician + JSON backup/restore.

## The React version — `react-app/`

A full Vite + React + TypeScript PWA (Tailwind, Dexie/IndexedDB, Recharts,
installable/offline service worker). Same features, plus a clean data layer
(`react-app/src/db/`) so a cloud backend (e.g. Supabase) can be added later for
live multi-device sync.

```bash
cd react-app
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to react-app/dist
```

If you decide you only want the simple single-file version, you can safely delete
the `react-app/` folder.
