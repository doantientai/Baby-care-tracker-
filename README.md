# 🍼 Baby Care Tracker

A private app for two parents to track newborn care together — diapers, feeding,
sleep, temperature, growth and more. Built mobile-first for one-handed logging at
3am.

It's **one self-contained file** ([`index.html`](index.html)) — **no server, no
build, no install.** Everything (HTML, CSS, JavaScript) lives inside it, and your
data is saved privately in your browser (`localStorage`).

> ⚠️ The guidance in this app (fever thresholds, stool-color flags, diaper
> targets) reflects **general newborn-care standards** and is **not a substitute
> for medical advice**. When in doubt, call your doctor.

## How to use it

Pick either:

1. **Just open the file** — download `index.html` and double-click it (opens as
   `file://…`). Works fully offline. *(The only thing that needs internet is the
   outdoor-weather widget.)*
2. **Host it** (recommended for using it on two phones) — put `index.html` on any
   static host (Netlify drop, GitHub Pages, Cloudflare Pages…), open the URL on
   each phone, and **"Add to Home Screen"** to get an app icon.

> Data lives **per device/browser**. Use **Settings → Export / Import backup** to
> copy entries between phones (imports are de-duplicated, so re-importing is safe).

### First run

Open **Settings** → set the baby's **name** and **date of birth**. The DOB powers
the age-based fever alerts (a fever under 3 months is flagged as an emergency) and
the daily wet-diaper target.

## Features

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

## Tech

Plain HTML + CSS + vanilla JavaScript in a single file. No dependencies, no build
step. Storage via `localStorage`; charts are hand-drawn SVG; weather via the
keyless [Open-Meteo](https://open-meteo.com) API.
