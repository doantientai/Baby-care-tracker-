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

> By default data lives **per device/browser**. To share one live log between
> both phones, connect a **Google Sheet** (see below). Without it, you can still
> copy data with **Settings → Export / Import backup** (imports are de-duplicated).

## Share data between two phones (Google Sheet)

The app can save every entry to a **shared Google Sheet** so both parents
always see the same log — still no server of your own. It uses a small Google
Apps Script (included as [`google-apps-script.gs`](google-apps-script.gs)) that
turns your Sheet into a private API. The app keeps working offline and syncs when
back online (last edit wins; deletes propagate).

**One-time setup (~5 min):**

1. Create a new **Google Sheet**.
2. **Extensions → Apps Script**.
3. Delete the sample code, paste the contents of `google-apps-script.gs`, **Save**.
   *(Optional: set a `SECRET` string at the top to lock down access.)*
4. **Deploy → New deployment → Web app** — *Execute as: Me*, *Who has access:
   Anyone*. Authorize when prompted.
5. Copy the **Web app URL** (ends in `/exec`).
6. In the app: **Settings → Cloud sync** → paste the URL (and the secret, if set)
   → **Sync now**.
7. Paste the **same URL** in the app on the other phone. Done — both stay in sync.

> The sync uses simple `GET` requests to avoid browser CORS issues. If your
> browser blocks cross-origin requests from a `file://` page, **host `index.html`**
> (e.g. GitHub Pages) and open it from there — then sync works everywhere.

### First run

Open **Settings** → set the baby's **name** and **date of birth**, and your
**location** (for the weather widget; it defaults to Paris). The DOB powers the
age-based fever alerts (a fever under 3 months is flagged as an emergency) and the
daily wet-diaper target. Each device starts blank — there's no preset baby,
location, or personal data in the app.

## Features

- **Dark mode** — Light, Dark, or Auto (follows your phone); easy on the eyes at 3am.
- **English, French & Vietnamese** — switch language any time in Settings.
- **Built-in help** — an ⓘ button on every log type explains it with brief newborn-care guidance.
- **Quick logging** — one tap from the home screen for every event type.
- **Diapers** — pee / poop / both, amount, **stool color with danger flags**
  (white/clay, red, black-after-meconium prompt you to call a doctor), texture.
- **Breastfeeding** — two-sided session timer that records **time on each breast
  separately** (start a side → *Switch* → *Stop*), suggests **which side to start
  next**, and logs the **feeding position** (cradle, cross-cradle, football,
  laid-back, side-lying). The timer can be **paused/resumed** mid-feed (burping,
  re-latching) so interruptions don't inflate the time.
- **Bottle** — formula / expressed / mixed, volume with quick presets.
- **Temperature** — measurement method + **automatic fever assessment**; under
  3 months a fever is flagged as an **emergency**.
- **Sleep** — live timer or manual entry; daily totals.
- **Cry, pump, medication / vitamin D, growth, notes.**
- **Log after the fact** — every entry's time is editable, with one-tap shortcuts
  (Now, −5m, −15m, −30m, −1h, −2h) for when you log a bit late.
- **Vitamin D reminder** — a Home-screen prompt from your set time (default 7am) until you log it that day, with one-tap "Log it" (Settings → Reminders).
- **What-to-wear advice** — outfit suggestion based on the current outdoor temperature ("one layer more than an adult"), shown in the weather card.
- **Weather** — current outdoor conditions for your location (set it in Settings;
  defaults to Paris) via the keyless Open-Meteo API, plus a **safe-sleep nursery
  temperature** reminder (16–20 °C).
- **Dashboard** — today's wet/dirty counts vs. age target, feeds, sleep, last-feed
  time and next-side suggestion.
- **Trends** — diapers, feeds and sleep per day, plus a weight curve.
- **"Done by"** — each entry records who *performed* the care; breastfeeding and
  pumping default to mom, diapers to dad (editable; configure caregivers in Settings).
- **Backup & share** — CSV export for your pediatrician + JSON backup/restore
  (a backup can also carry the baby profile).
- **Auto-update** — when a new version is deployed, the app shows a one-tap
  "Update available" refresh.

## Tech

Plain HTML + CSS + vanilla JavaScript in a single file. No dependencies, no build
step. Local storage via `localStorage`; optional shared storage via a Google Sheet
(Apps Script web app); charts are hand-drawn SVG; weather via the keyless
[Open-Meteo](https://open-meteo.com) API.
