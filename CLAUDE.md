# 60+ Seniors — Project Guide

Web presence and clinical tools for 60+ Seniors Clinic (geriatric practice, Cairo).
Audience is older adults and their caregivers, so every decision favors clarity,
legibility, and accessibility over visual flourish.

## Commands

<!-- Fill these in once, then they're available every session. Examples: -->
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — lint check
- `npm test` — run tests

## Brand — non-negotiable

Colors (use exactly these hex values, never approximate):
- Aegean Blue `#144053` — primary / headers / text on light
- Baby Blue `#6dcad6` — accent / highlights
- Oceana Blue `#489399` — secondary
- Metal Gray `#9c9da0` — muted text / borders
- Cloudy Gray `#dddddd` — backgrounds / dividers
- White `#ffffff`

Typography:
- Montserrat for all English / Latin text
- DG Sahabah for all Arabic text
- Never substitute system fonts; load both webfonts explicitly

Logo: the "60+" mark with the medical cross. Don't recolor, redraw, or stretch it.

## Structure

Three top-level sections, in this order:
1. Seniors (umbrella / brand)
2. Seniors Clinic (medical practice)
3. Seniors Connect (community programme)

## Bilingual — required everywhere

- Full English / Arabic toggle on every page and component
- Arabic renders right-to-left (RTL); layout must mirror correctly, not just swap text
- Never hardcode user-facing strings; keep EN and AR in parallel and easy to edit
- Test both directions before considering anything done

## Accessibility — senior-first

- Large default font sizes; generous line spacing and tap targets
- High contrast against backgrounds (meet WCAG AA at minimum)
- Simple, predictable navigation; no tiny icons as the only label
- Forms and buttons clearly labeled in both languages

## Integrations

- Booking flows route to WhatsApp (preserve the configured number/link)

## Conventions

- Edit existing files; don't regenerate a working file from scratch unless asked
- Keep changes focused — one concern per change
- Show a short plan before multi-file edits

## Don't

- Don't invent new brand colors or fonts
- Don't ship English-only or Arabic-only components
- Don't break RTL to make the English view look "neater"
- Don't shrink text or controls below the senior-friendly defaults
- Don't add dependencies without flagging them first
