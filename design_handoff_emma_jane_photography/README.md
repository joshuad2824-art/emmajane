# Handoff: Emma Jane Photography — site + owner CMS + gallery platform

## Overview

Emma Jane Photography is a five-page marketing site for a Tulsa-area lifestyle photographer
(families, seniors, weddings, small-business content), plus a self-serve platform on top of it:

1. **Owner CMS** — Emma signs in from a discreet control at the bottom of any page and edits
   every piece of copy and every photograph in place.
2. **Her own galleries** — collections she publishes to the public `Galleries` page.
3. **Client galleries** — a private gallery per client, opened by an access word or by a direct
   link she shares. Clients mark favourites and download full-size files.
4. **Studio** — the back office where galleries are created, photos uploaded, order and covers
   set, and client links copied.

The design is finished. What is *not* finished is the backend: in the prototype all state lives
in `localStorage` and `IndexedDB` in a single browser. Making it real (Fly.io + Postgres +
object storage) is the job. See `BACKEND.md` for the full server-side specification.

## About the design files

Everything in `prototype/` is a **design reference written in HTML** — a working prototype of
the intended look and behaviour, **not production code to copy**. The task is to **recreate
these designs in the target codebase's environment** using its established patterns. If no
codebase exists yet, pick the framework you'd defend for a small photography business with a
single admin user (a Next.js or Remix app on Fly.io with Postgres and S3-compatible storage is
the obvious default) and implement the designs there.

The prototype pages are `.dc.html` files that use an in-house streaming template runtime
(`support.js`, `<x-dc>`, `{{ holes }}`, `<sc-for>`, `<sc-if>`, `<x-import>`). **Do not port that
runtime.** Read the files for layout, copy, tokens and behaviour; write idiomatic components in
the target framework. To view them, serve `prototype/` over HTTP (`python3 -m http.server`) and
open any `.dc.html` file — they will not work from `file://`.

The design system components mounted via
`<x-import component-from-global-scope="EmmaWilliamsPhotographyDesignSystem_c86721.Button">`
live in `prototype/_ds/.../_ds_bundle.js`. Read that file for the exact `Button`, `Input` and
`Textarea` implementations (plain React, no build step) and reimplement them as real components.

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, shadows, copy and interaction behaviour
are all final and should be reproduced faithfully. All values come from the design tokens listed
below; use those tokens (as CSS custom properties or your styling system's equivalent) rather
than hard-coding hexes in components.

---

## Design tokens

Source of truth: `prototype/_ds/.../tokens/*.css`. Copy these files in as-is if the target
supports CSS custom properties.

### Color

| Token | Value | Use |
|---|---|---|
| `--pine-green` | `#31463c` | primary accent: buttons, links, active states, footer field |
| `--pine-green-dark` | `#20302a` | hover — accents deepen, never lighten |
| `--sage` | `#a8b3a4` | soft secondary green; section alternation, tints |
| `--blue-gray` | `#7b8f9a` | rare cool accent; sunken surfaces |
| `--warm-ivory` | `#f5f2ec` | primary page background |
| `--slate` | `#444b4e` | body ink |

Derived:

```
--color-bg:            var(--warm-ivory)
--color-bg-alt:        color-mix(in oklch, var(--sage) 16%, var(--warm-ivory))
--color-surface:       #ffffff
--color-surface-paper: #faf7f1
--color-surface-sunken:color-mix(in oklch, var(--blue-gray) 20%, var(--warm-ivory))
--color-text:          var(--slate)
--color-text-muted:    color-mix(in srgb, var(--slate) 62%, var(--warm-ivory))
--color-text-inverse:  var(--warm-ivory)
--color-accent:        var(--pine-green)
--color-accent-hover:  var(--pine-green-dark)
--color-accent-soft:   color-mix(in oklch, var(--pine-green) 14%, var(--warm-ivory))
--color-border:        color-mix(in srgb, var(--slate) 20%, transparent)
--color-border-soft:   color-mix(in srgb, var(--slate) 10%, transparent)
--color-line:          color-mix(in srgb, var(--pine-green) 55%, transparent)
--color-focus-ring:    color-mix(in srgb, var(--pine-green) 45%, transparent)
--color-overlay:       color-mix(in srgb, var(--slate) 50%, transparent)
```

Error/warning ink used in forms and destructive actions: `#a3413a` (field errors),
`#7b4a3a` (destructive labels, hover `#5d372a`). No gradients anywhere. Two backgrounds max per
page (warm ivory + the sage-tinted alt); pine green only as a dark field (footer, closing band).

### Typography

Google Fonts, loaded in `tokens/typography.css`:

```
--font-display: "Cormorant Garamond", Georgia, serif   /* headlines only */
--font-body:    "EB Garamond", Georgia, serif          /* paragraphs, nav, buttons, UI */
--font-accent:  "Cormorant Garamond", Georgia, serif   /* always italic — eyebrows, asides */
--font-hand:    "La Belle Aurore", "Cormorant Garamond", cursive  /* notes only, rationed */
```

Weights loaded: Cormorant Garamond 300/400/500/600 + italics 300/400/500; EB Garamond
400/500/600 + italics 400/500; La Belle Aurore 400.

Scale:

```
--text-eyebrow: 0.8125rem   --text-h4: 1.625rem
--text-small:   1rem        --text-h3: 2.125rem
--text-body:    1.1875rem   --text-h2: 3rem
--text-lede:    1.4375rem   --text-h1: 4.25rem
                            --text-display: 6.5rem
```

Leading: `--leading-tight 1.08`, `--leading-snug 1.25`, `--leading-normal 1.6`,
`--leading-relaxed 1.85` (body copy default).
Tracking: `--tracking-tight -0.015em`, `--tracking-normal 0`, `--tracking-wide 0.06em`,
`--tracking-wider 0.14em`, `--tracking-widest 0.24em`.

Signature move: small text (eyebrow/small) in `--font-body`, `text-transform: uppercase`, with
`--tracking-wider` or `--tracking-widest` — nav links, button labels, metadata lines. Headlines
are `--font-display` at `font-weight: 400` (never bold) with `--leading-tight`.

### Spacing, radii, shadows, motion

```
--space-1..11: 4 8 12 16 24 32 48 64 96 128 192 (px)
--content-max: 1180px      --content-narrow: 720px

--radius-sm: 2px   (inputs, tags, small buttons)
--radius-md: 4px   (cards, buttons)
--radius-lg: 8px
--radius-pill: 999px  (rare)

--shadow-sm:     0 1px 2px color-mix(in srgb, var(--slate) 8%, transparent)
--shadow-card:   0 2px 8px color-mix(in srgb, var(--slate) 5%, transparent),
                 0 14px 40px color-mix(in srgb, var(--slate) 7%, transparent)
--shadow-lifted: 0 22px 64px color-mix(in srgb, var(--slate) 13%, transparent)
--shadow-frame:  0 1px 0 color-mix(in srgb, var(--slate) 5%, transparent),
                 0 10px 34px color-mix(in srgb, var(--slate) 10%, transparent)

--ease-standard: cubic-bezier(.4,0,.2,1)
--ease-out:      cubic-bezier(0,0,.2,1)
--ease-gentle:   cubic-bezier(.22,.61,.36,1)
--duration-fast: 180ms   --duration-standard: 320ms   --duration-slow: 640ms
```

Animation is opacity and gentle translate-y only. No bounce, spring, scale-on-press or spin.
Image hover on gallery cards: `transform: scale(1.03)` over `640ms var(--ease-gentle)`.

### Shared components (see `_ds_bundle.js` for source)

**Button** — `--font-body`, uppercase, `--tracking-wider`, `--radius-md`, `1px` border.
Sizes: `sm` / `md` / `lg`; `lg` is `--text-body` with `16px 34px` padding.
`primary` = pine-green fill, ivory text. `secondary` = transparent, pine-green border + text.
`ghost` = text only with an underline that wipes in from the left. Hover deepens to
`--pine-green-dark`; press dims to ~0.85 opacity with no shrink. Disabled = 0.45 opacity.

**Input / Textarea** — a `<label>` column, `gap: 8px`. Optional label span in eyebrow size,
uppercase, `--tracking-wider`, `--color-text-muted`. Field: white background,
`1px solid var(--color-border)` (`#a3413a` when in error), `--radius-sm`, `12px 14px` padding,
`--text-body`. On focus: border becomes `--color-accent` plus a `0 0 0 3px var(--color-focus-ring)`
ring. Error message below in eyebrow size, `#a3413a`.

---

## Screens / views

Global chrome shared by every page:

**Nav** — sticky, `z-index: 30`, `10px 48px` padding, flex row, space-between.
Background `color-mix(in srgb, var(--warm-ivory) 92%, transparent)` with `backdrop-filter: blur(6px)`
and a `1px solid var(--color-border-soft)` bottom border. Logo (`brand/emma-jane-logo.png`) at
`height: 52px` on the left, links on the right in a `24px`-gap flex row: Home, Portfolio,
Galleries, Investment, About, Contact. Links are eyebrow size, uppercase, `--tracking-widest`,
`--color-text`, `padding-bottom: 4px` with a transparent `1px` bottom border that becomes
`--color-line` on hover. The current page's link is `--color-accent` with a solid
`--color-accent` bottom border.

**Footer** — `--pine-green` field, `--color-text-inverse` text, `72px 40px 40px` padding,
centered column, `22px` gap. Logo at `height: 84px` with `filter: brightness(0) invert(1)` and
`opacity: 0.92`; the italic line "collect beautiful moments" in `--font-accent` at `1.2rem`,
`opacity: 0.88`; a wrapping `30px`-gap row of links (Home, Portfolio, Investment, About,
Galleries, Client galleries, email) at `--text-small` / `--tracking-wide` / `opacity: 0.85`;
then the fine print at eyebrow size / `opacity: 0.55`:
"Tulsa, Oklahoma & surrounding areas · © 2026 Emma Jane Photography".

**Admin control** — see "Owner CMS" below.

**Responsive** — one breakpoint at `max-width: 900px`. Nav wraps and centres; page padding
drops to `22px`; section padding drops to ~`56px`; multi-column grids collapse to one column
(image mosaics to two); `h1` → `2.7rem`, `h2` → `2.05rem`, `h3` → `1.45rem`; prose max-widths
released; all hit targets stay ≥ 44px.

### 1. Home (`Home.dc.html`)

Hero → portfolio wall → what I photograph. Hero is a full-bleed `82vh` (min `600px`) image
(`photos/senior-golden.jpg`, `object-position: 50% 34%`) under a top-to-bottom scrim
`linear-gradient(180deg, rgba(49,70,60,0.10) 0%, rgba(49,70,60,0.06) 45%, rgba(49,70,60,0.52) 100%)`.
Content sits `72px` from the bottom, centred: italic eyebrow "real days, real light, softly kept"
at `1.45rem`; `h1` "Photographs that feel like the day itself" in `--font-display` at `4.75rem`,
`--leading-tight`, `max-width: 15ch`, `text-wrap: balance`, with
`text-shadow: 0 2px 28px rgba(32,48,42,0.4)`; then a `16px`-gap button row — primary
"Inquire about your date" and a white-outlined "See the work" (`1px solid rgba(255,255,255,0.75)`,
hover `background: rgba(255,255,255,0.14)`).

### 2. Portfolio (`Portfolio.dc.html`)

The curated image wall — an unequal mosaic at a tight gutter (8–12px), hand-set spans, tall
beside wide. Not a CMS grid of identical squares.

### 3. Galleries (`Galleries.dc.html`) — NEW

Emma's own published collections. Two states in one page, switched by the URL hash.

**Index** (no hash). Header: italic eyebrow "collect beautiful moments"; `h1` "Galleries" at
`4.25rem`; a `58ch` intro paragraph at `--text-body` / `--leading-relaxed`; a secondary
"Open a client gallery" button linking to the client page. Body: a two-column grid,
`gap: 56px 40px`, max width `1180px`. Each card is a link — a `4/3` cover image
(`object-fit: cover`, hover `scale(1.03)`), then the album name as `h2` in `--font-display` at
`--text-h3`, then a metadata line in eyebrow size / uppercase / `--tracking-wider` /
`--color-text-muted` reading "N photographs · <subtitle>". Empty state, italic:
"Nothing published yet. Soon."
Only albums with `live = true` appear here.

**Album detail** (`#<album-id>`). A "← All galleries" back link in eyebrow size; the album name
as `h1` at `4rem`; the subtitle in italic `--text-lede` / muted. Then the mosaic: a six-column
grid, `grid-auto-flow: dense`, `gap: 10px`, with per-photo spans cycling
`[3,3,2,2,2,4,2,3,3,2,2,2]` and aspect ratios cycling
`["4/3","4/5","1/1","3/4","4/5","16/9","1/1","3/2","4/5","4/5","1/1","3/4"]`. Any photo captions
are listed below the mosaic in `--font-hand` at `1.25rem`, muted. Clicking a photo opens the
lightbox (below).

**Lightbox** — fixed full-viewport overlay, `z-index: 60`,
`background: color-mix(in srgb, var(--slate) 88%, transparent)`, `40px` padding, image
`object-fit: contain` with `box-shadow: 0 30px 80px rgba(32,38,36,0.5)`. `cursor: zoom-out`;
closes on click anywhere or Escape.

### 4. Client gallery (`Client Gallery.dc.html`) — NEW

**Locked state.** A `1.15fr / 0.85fr` grid, `72px` gap. Left column: italic eyebrow
"your session, kept safe"; `h1` "Your gallery is waiting" at `4.25rem`, `max-width: 20ch`; two
`50ch` paragraphs (the second muted) explaining the word, that downloads are unlimited and
full-size, and that galleries stay up for ninety days; then the contact email in eyebrow size,
uppercase. Right column: a white card, `1px solid var(--color-border)`, `--radius-md`,
`--shadow-card`, `40px 34px` padding, containing an `h2` "The word I sent you", the access-word
Input, a `min-height: 24px` italic error line in `#7b4a3a`, a full-width primary
"Open my gallery" button, and a muted hint "Capital letters do not matter."
Enter in the field submits. Wrong word: "That one does not open anything — try the word from
your email." Empty: "I will need the word first."

**Unlocked state.** Header: italic "photographed <Month D, YYYY>"; the client name as `h1` at
`4.25rem`; a metadata row (eyebrow / uppercase / muted) with "N photographs", "here until
<Month D, YYYY>", and a "Close the gallery" text button. Then the action row, `14px` gap:
primary "Download every photograph"; secondary "Download the N marked"; an outlined toggle
"Show only marked" / "Show the N marked" / "Show all N" (`min-height: 54px`, `--color-border`,
hover border and text to accent); and a muted text button "Copy the link for family". Below it a
`min-height: 26px` status line in italic `--text-lede`, `--color-accent`.

Grid: three columns, `gap: 34px 26px`. Each photo is a polaroid frame — white surface, `10px`
padding, `--shadow-frame`, containing a `4/5` cover-fit image, `cursor: zoom-in` (opens the
lightbox). Beneath, a space-between caption row: a "Mark this one" / "Marked for print" toggle
(`--radius-sm`, eyebrow size, uppercase, `--tracking-wider`; unmarked = transparent with
`--color-border`; marked = pine-green fill with inverse text) and a muted "Download" text button.

Closing band: `--color-bg-alt` field, `68px 48px 76px` padding, a centred `720px` column with
Emma's note in `--font-hand` at `1.5rem` / `line-height: 1.7`, then "Emma" in `--font-hand` at
`1.8rem` in `--color-accent`.

**Access.** Either the word typed into the locked card, or a direct link — `?g=<word>` (or
`?g=<gallery-id>`, or the equivalent hash) opens the gallery immediately with no word. That is
the link Emma copies from the Studio and sends to clients.

**Downloads.** Per photo, "all", and "only marked". Filenames are
`<client-slug>-01.jpg`, `-02.jpg`, … Bulk download in the prototype fires sequential downloads
700ms apart; in production this should be a server-side zip (see `BACKEND.md`).

### 5. Investment (`Investment.dc.html`)

Pricing and packages: sessions $175–$400, weddings $1,200–$1,400, full-resolution edited files
included in every price. Rows stack on mobile.

### 6. About (`About.dc.html`)

Emma's story beside her portrait (`photos/emma-portrait.jpg`, 4:5).

### 7. Contact (`Contact.dc.html`)

Inquiry form — currently a visual mockup with no submission. Needs wiring (see `BACKEND.md`).

### 8. Studio (`Studio.dc.html`) — NEW, admin only

**Signed out.** A quiet `720px` column: italic eyebrow "for Emma only"; `h1` "The studio is
behind a word" at `3.4rem`; a paragraph pointing at the Admin control at the bottom of any page;
a muted line "Nothing here is public. No client name, no photograph, no word." No password field
here — signing in happens in the bottom bar. **No gallery data of any kind is sent to an
unauthenticated client.**

**Signed in.** Header: italic "good morning, Emma"; `h1` "The studio" at `3.6rem`; then a tab
strip on a `1px solid var(--color-border-soft)` bottom border with two tabs, **My galleries** and
**Client galleries** — eyebrow size, uppercase, `--tracking-widest`, `12px 0` padding; active is
`--color-accent` with a `2px` accent bottom border, inactive is muted with a transparent border.
Below: a space-between row with a count line in italic `--text-lede` / muted and a primary
"New gallery" / "New client gallery" button. Then a `min-height: 26px` status line in italic
`--text-lede` / `--color-accent`.

Count lines: "3 on the site · 1 still a draft — top of the list shows first" for albums;
"2 open · 1 closed" for client galleries; "no galleries yet" when empty.

**List rows.** White surface, `1px solid var(--color-border-soft)`, `--radius-md`,
`--shadow-card`, `22px 26px` padding, wrapping flex row, `22px` gap:
- `92×92` cover thumbnail, `--radius-sm`, `--color-surface-sunken` placeholder background.
- Title block (`flex: 1 1 240px`): the name as `h2` in `--font-display` at `--text-h4`, plus a
  status badge — `4px 11px`, `--radius-sm`, eyebrow size, uppercase, `--tracking-wider`; active
  ("On the site" / "Open") uses `--color-accent-soft` on `--color-accent`, inactive
  ("Draft" / "Closed") uses `--color-surface-sunken` on `--color-text-muted`. Beneath, a
  metadata line in eyebrow size / muted: "N photographs · <subtitle>" for albums,
  "N photographs · photographed Aug 9, 2026 · here until Nov 7, 2026" for client galleries.
  For client galleries a third line in `--font-hand` at `1.15rem` / accent: "the word is
  goldenfield".
- Order buttons: `↑` `↓`, `36px` wide, `min-height: 40px`, `1px solid var(--color-border)`,
  `--radius-sm`, hover border + text to accent. List order is display order.
- Actions: secondary "Edit"; a muted text button — "Take off the site" / "Put it on the site"
  for albums, "Copy the link" for client galleries; and a destructive "Delete" in `#7b4a3a`
  that becomes "Yes, take it down" on first click (inline two-step confirm, no modal).

**Editor.** A white card, `40px 38px 44px` padding, `--shadow-card`. Header row: `h2`
"Editing <name>" / "A new gallery" at `--text-h3`, plus a right-aligned stamp in eyebrow size /
uppercase / muted — "Saved changes go live at once" or "Nobody sees this until you save".

Fields — a two-column grid, `gap: 24px 30px`:
- Albums: **Gallery name** (`Families, at home`), **The line under the title**
  (`Tulsa · morning light`).
- Client galleries: **Client name** (`The Hartleys`), **The word that opens it**
  (`goldenfield`, stored lowercased), **Photographed on** (date), **Files here until** (date,
  default today + 90 days). Then a full-width **A note at the bottom of their gallery**
  Textarea, 3 rows. Then a `--color-bg-alt` panel, `18px 20px`, `--radius-sm`, labelled
  "THE LINK YOU SEND THEM" with the resolved link below it in `--text-body`, `word-break: break-all`.

Validation: name required ("A gallery needs a name." / "A name helps you find it again.");
access word required for client galleries ("They will need a word to get in."). Errors render
through the Input's error state.

Photo manager:
- Label "PHOTOGRAPHS" in eyebrow size / uppercase / muted.
- Drop zone: `--color-surface-paper`, `1px dashed var(--color-border)`, `--radius-sm`,
  `30px 26px` padding, space-between. Left: `--font-hand` at `1.35rem` — "Drag photographs here
  from your computer." / "Drop more in — they land at the end." — with a muted second line
  "Full-size files off the card are fine — the web sizes get made for you." Right: a secondary
  "Choose files" button over a hidden multiple/`image/*` file input. Drag-and-drop and the
  picker both work.
- While uploads process, an italic `--text-lede` muted line: "N photographs are being made
  ready…" (singular "is").
- One row per photo, separated by `1px solid var(--color-border-soft)`, `18px 0` padding,
  wrapping flex, `16px 18px` gap: a `74×74` thumbnail (`--radius-sm`); a caption Input
  (`flex: 1 1 220px`, placeholder "a line in your hand, if it wants one"); then, for albums
  only, a **Cover** toggle (`min-height: 40px`, `0 14px`, `--radius-sm`, eyebrow size,
  uppercase; selected = pine-green fill with inverse text, otherwise transparent with
  `--color-border` and muted text); then `‹` `›` reorder and `×` remove, each `36px` wide,
  `min-height: 40px`, `--radius-sm`, hairline border (`×` in `#7b4a3a`). Reordering keeps the
  cover pinned to the same photo.
- Removing a photo deletes its stored derivatives.

Footer actions, `16px` gap: primary "Save the gallery" / "Save the draft"; for albums a
secondary "Put it on the site" / "Take off the site"; a muted "Never mind" text button.

Save toasts: "Saved." / "Saved, and it is on the site." / "Saved as a draft — nobody sees it
yet." / "Saved. Send them the link when you are ready." New records are added at the top of the
list. Delete: "Gallery taken down." — for client galleries, "Gallery taken down. The word no
longer opens anything."

### Owner CMS (`cms.js`) — the mechanism to replace

`prototype/cms.js` is a deliberately small stand-in. Read it for behaviour, then reimplement it
properly against the backend.

**Signed out.** Below the footer on every page: an ivory strip, `1px solid var(--color-border-soft)`
top border, `14px 40px` padding, centred, holding a single low-contrast text button "ADMIN" in
`--font-body`, eyebrow size, uppercase, `--tracking-widest`, in
`color-mix(in srgb, #444b4e 45%, #f5f2ec)`. Clicking it reveals an inline password field
(`min-height: 40px`, hairline border, `--radius-sm`, white) plus a pine-green "Sign in" button
and an italic error slot ("That isn't it."). Prototype password: `goldenhour`.

**Signed in.** The strip becomes a fixed bottom bar (`z-index: 9998`, pine-green field, ivory
text, `12px 24px`, centred wrapping row, `box-shadow: 0 -6px 24px rgba(49,70,60,0.22)`) and the
body gains `72px` bottom padding. Contents: a status line in italic `1.125rem` — "Signed in as
Emma" or "Editing — click any words or photograph"; a toggle button "Edit this page" /
"Done editing" (inverts to an ivory fill while editing); a "Galleries" link to the Studio; and
two muted text buttons, "Undo my edits" (confirm, then revert this page) and "Sign out".

**Edit mode.** Every leaf text element becomes `contenteditable` with a dashed
`color-mix(in srgb, #31463c 45%, transparent)` outline at `3px` offset, a `#31463c` dashed
outline plus a 7% pine tint on hover, and a solid outline plus 9% tint on focus. Editing a nav
or footer link does not navigate. Every content image (the logo is excluded) gets a `2px` dashed
accent outline, `cursor: pointer`, `title="Click to replace this photograph"`, and opens a file
picker on click; the chosen file is downscaled and swapped in immediately with the toast
"Photograph replaced." Toasts appear as a fixed pine-green pill, `bottom: 76px`, centred,
`11px 20px`, `--radius-md`, fading over `320ms var(--ease-gentle)` and clearing after ~3.2s.

**Important:** the prototype identifies editable nodes by their position in the DOM tree, which
is fine for a static prototype and wrong for production. In the real build, every editable string
and image needs a **stable content key** assigned in the source (e.g. `home.hero.title`,
`home.hero.image`) and stored server-side against that key. Do not port the DOM-path scheme.

---

## Interactions & behaviour summary

- **Navigation** — ordinary page loads; the Galleries album view is a hash route.
- **Client access** — word form, or `?g=<word>` deep link that skips the form.
- **Favourites** — per-photo toggle, session-scoped in the prototype; should persist per
  gallery so Emma can see what was marked (see `BACKEND.md`).
- **Downloads** — single file, all files, marked files only.
- **Uploads** — drag-and-drop or picker, multiple files, progressive per-file feedback.
- **Publish** — albums are draft by default and only appear publicly when `live` is true.
- **Expiry** — client galleries carry an "until" date; past it they read "Closed" in the Studio.
  **In production the word and link must actually stop working after expiry** — the prototype
  only changes the badge.
- **Confirmation** — destructive actions confirm inline (button label changes), never in a modal.
- **Empty states** — always a short italic line, never a dashed placeholder box.
- **Motion** — opacity/translate fades at 180–640ms with `--ease-gentle`; the only transform is
  the 1.03 image hover.

## State

Prototype state, and where it must move to:

| State | Prototype | Production |
|---|---|---|
| Admin session | `localStorage` flag, hard-coded password | Real session/cookie auth, hashed password |
| Page copy overrides | `localStorage`, keyed by DOM path | DB rows keyed by stable content key |
| Page image overrides | `localStorage` data URLs | Object storage + DB rows keyed by content key |
| Albums, client galleries | `localStorage` JSON | Postgres tables |
| Uploaded photos | `IndexedDB` blobs (2400px + 520px derivatives) | Object storage originals + derivatives |
| Client favourites | React state, lost on reload | DB rows per gallery |
| Edit-mode flag | `localStorage` | Client state, admin-only |

Per-view local state: active tab, editing/list mode, the edit form, validation errors, resolved
image URLs, toast text, upload counter, inline delete confirmation, lightbox source, unlocked
gallery id, marked-photo set, "only marked" filter.

## Assets

In `prototype/`:
- `brand/emma-jane-logo.png` — Emma's logo lockup, cropped for nav/footer use. Used at 52px in
  the nav and 84px inverted in the footer.
- `photos/` — eight placeholder photographs (`senior-golden`, `senior-bridge`, `family-beach`,
  `portrait-hat`, `couple-canal`, `street-alley`, `city-bw`, `emma-portrait`). These are
  stand-ins used to seed the prototype's demo galleries; **replace with Emma's real work.**
  `emma-portrait.jpg` is her About photo, cropped 4:5 and warmed.
- Fonts come from Google Fonts (Cormorant Garamond, EB Garamond, La Belle Aurore). Self-host
  them in production.

## Files in this bundle

```
BACKEND.md                     server-side specification — read this second
prototype/
  Home.dc.html                 marketing pages
  Portfolio.dc.html
  Investment.dc.html
  About.dc.html
  Contact.dc.html
  Galleries.dc.html            public album index + album detail + lightbox
  Client Gallery.dc.html       word/link access, favourites, downloads
  Studio.dc.html               admin back office (albums + client galleries)
  cms.js                       the localStorage/IndexedDB stand-in to replace
  support.js                   prototype template runtime — do NOT port
  brand/, photos/              assets
  _ds/.../tokens/*.css         design tokens — copy these in
  _ds/.../styles.css
  _ds/.../_ds_bundle.js        Button / Input / Textarea source to reimplement
```

Serve `prototype/` over HTTP to view. Sign in at the bottom of any page with `goldenhour`;
client gallery demo words are `goldenfield` and `loveletter`.
