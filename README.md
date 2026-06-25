# Seniors Med

A clinical documentation tool for a geriatric clinic — **first slice**.

This slice does one job well: record a single patient visit, generate a clean
formatted record, and save it so it survives refresh and reload.

## Features in this slice

- **Visit form**: patient name, age, date of visit, free-text notes, and a list
  of medications (drug name + an Arabic, right-to-left dosing instruction field).
- **Generate record**: produces a clean, formatted visit record from the form.
- **Reliable persistence**: records are stored in **IndexedDB** (not
  localStorage), so they are not lost on refresh or reload and the app stays
  stable as data grows.
- **Bilingual**: full English / Arabic toggle for the whole interface. Arabic
  renders right-to-left and the layout mirrors correctly.
- **Arabic dosing**: medication dosing instructions always display verbatim,
  right-to-left, in the Arabic font — regardless of the interface language.
- **Brand & accessibility**: clinic colors, Montserrat (English) and Noto Naskh
  Arabic (Arabic) webfonts, large text, big touch targets, and high contrast.
  Works on iPad (touch) and computer.

> **Arabic font note:** This slice uses the free **Noto Naskh Arabic** webfont.
> To switch to **DG Sahabah**, drop the font file in a `fonts/` folder, add an
> `@font-face` rule, and change `--font-ar` in `styles.css`. That is the only
> change needed.

## Files

| File          | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| `index.html`  | Markup: form, generated record, saved records list   |
| `styles.css`  | Brand colors, fonts, RTL mirroring, accessibility    |
| `app.js`      | UI logic: language toggle, meds, generate record     |
| `db.js`       | IndexedDB storage wrapper (save / load visits)       |

## How to preview

The app uses browser features that need to be served over `http://` (not opened
as a `file://` path), so run a tiny local server from the project folder:

```bash
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

**On an iPad:** keep the server running on your computer, find the computer's
local IP address (e.g. `192.168.1.20`), make sure the iPad is on the **same
Wi-Fi**, and open `http://192.168.1.20:8000` in Safari.

### Try it

1. Fill in a patient name (required), age, and date.
2. Add a medication: type the drug name, then type the dosing instruction in
   Arabic — notice it stays right-to-left.
3. Press **Generate record**. The formatted record appears and is saved below.
4. Refresh the page — your saved records are still there.
5. Press the language button (top right) to switch between English and Arabic.
