# Structured by AI — marketing site

A single-page portfolio site for **Structured by AI**. The visual design route is
adapted from [landonorris.com](https://landonorris.com/) (agency: OFF+BRAND):
a muted dark base + cream rounded panels + **one** electric accent (lime), editorial
serif × uppercase sans, a living generative background, and scroll-driven reveals.

## Stack

- **Plain HTML/CSS** — no build step. Deploy the folder as-is.
- **[Lenis](https://github.com/darkroomengineering/lenis)** (CDN) — smooth/inertia scroll.
- **[GSAP + ScrollTrigger](https://gsap.com/)** (CDN) — clip-path wipe-up reveals, theme
  inversion, velocity-reactive marquee, magnetic buttons.
- **Canvas contour field** (`js/background.js`) — a dependency-free generative
  topographic background (marching squares over drifting value-noise). Whisper-low
  lime alpha on dark; inverts to ink on cream sections.

Everything degrades gracefully: with JS off, or `prefers-reduced-motion`, all content
is shown statically and the animated background is disabled.

## Design tokens (the system)

Defined in `css/style.css` `:root`. The whole look is enforced by restraint:

| Token | Value | Use |
|---|---|---|
| `--lime` | `#d2ff00` | the single accent (CTAs, serif words, lines) |
| `--base` | `#1b1d17` | dark olive-charcoal page background |
| `--cream` | `#efefe5` | light section panels |
| `--ink` | `#111112` | text on cream |
| `--ease` | `cubic-bezier(0.65,0.05,0,1)` | the one signature easing |
| `--dur` | `0.75s` | the one signature duration |

Fonts (Google Fonts): **Archivo** (uppercase display + UI), **Fraunces** (italic serif
accent words), **Space Mono** (`{ }` eyebrows + technical labels).

### How sections work

- Dark sections are **transparent** so the fixed contour canvas shows through.
- Cream sections are **opaque rounded panels** (`.section--cream`) that slide up over
  the living background (the "lip").
- `data-theme="dark|cream"` on each section drives the per-section colour inversion
  (handled by ScrollTrigger in `main.js`), and the nav logo auto-inverts via
  `mix-blend-mode: difference`.
- `[data-reveal]` / `[data-reveal-stagger]` = clip-path wipe-up on scroll.

## Run locally

```bash
cd freelance/site
python3 -m http.server 8848
# open http://localhost:8848
```

## Deploy (GitHub Pages, served at /structuredbyai/)

All asset paths are **relative**, so the site works from a subpath. Copy the contents
of this folder to the `structuredbyai` repo (or a `/docs` folder / `gh-pages` branch)
and enable Pages.

## Extend

- **Add a section:** copy a `<section>` block, give it an `id`, `data-theme`, and
  `[data-reveal]` wrappers. Cream panels get `class="section section--cream"`.
- **Change the accent:** edit `--lime` in `:root` (and the default `color` in
  `background.js`'s `SBAI_BG` opts).
- **Swap the background:** replace `window.SBAI_BG` in `js/background.js` — the factory
  contract is `SBAI_BG(canvas, {color}) -> { destroy(), setTheme(name) }`.
