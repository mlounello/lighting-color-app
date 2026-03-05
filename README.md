# Lighting Color Match Web App (MVP)

Static web MVP for converting a target hex color into fixture channel recipes (% + DMX) across Additive and CMY+CTO families.

## What is implemented

- Quick Mix landing screen
  - Fixture family: `Additive LEDs` / `CMY+CTO`
  - Match mode selector: Level A/B/C with descriptions
  - Target color picker + validated hex input (`#RRGGBB`)
  - Emitter checklists in canonical order
  - Quick sets: `RGBW`, `RGBWAUV`, `RGBWLi`, `CMY+CTO`
- Solver/output
  - Deterministic constrained optimization (`w in [0..1]`)
  - Perceptual objective in OKLab
  - Normalized recipes (`max(w)=1`) with
    - Percent output (whole numbers)
    - Optional decimal percent display
    - DMX output (0-255 integer)
  - Near-black guard note and all-zero output
  - Target/predicted swatches + disclaimer
  - CSV copy action
- Fixture Builder (MVP-lite)
  - Name + family + emitter selection
  - Save/update/delete local fixture profiles
  - Select saved fixture and apply to Quick Mix
  - Local persistence via `localStorage`

## Level support status

- Level A: functional (default emitter basis constants)
- Level B: functional with optional per-emitter `x,y` overrides
- Level C: UI present as expert beta; SPD text is stored with fixture profiles but current solve still uses active basis model (no SPD transform pipeline yet)

## Files

- `/Users/mikelounello/lighting-color-app/index.html`
- `/Users/mikelounello/lighting-color-app/styles.css`
- `/Users/mikelounello/lighting-color-app/app.js`

## Run locally

Because this is a static app, any local static server works.

Example:

```bash
npx serve .
```

Then open the served URL in your browser.

## Deploy

Deploy as a static project on Vercel and point `lightingapp.mlounello.com` to the deployment.
