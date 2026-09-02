# Backend specification — Emma Jane Photography

Read `README.md` first for the design. This file covers what the prototype fakes and the real
build has to provide. Target deployment is Fly.io.

## Shape of the thing

One small app, one admin user, an unbounded number of anonymous visitors. Traffic is low;
photo volume is not. Nothing here needs to scale — it needs to be cheap, durable, and safe
enough that a client's private gallery is genuinely private.

Suggested stack (substitute freely, but keep the shape):

- **App** — Next.js or Remix on Fly.io, one machine, autostop/autostart on.
- **Database** — Postgres (Fly Postgres, or Neon/Supabase if you'd rather not operate it).
  Data volume is tiny: hundreds of rows.
- **Object storage** — S3-compatible (Tigris on Fly, Cloudflare R2, or B2). Originals plus
  generated derivatives. **Not** the machine's local disk, and not a Fly volume — photos must
  outlive the machine.
- **Image processing** — `sharp` in the app process is fine at this volume. If a wedding upload
  of 800 frames blocks requests, move it to a small queue (a `jobs` table plus a worker loop is
  sufficient; don't reach for Redis yet).
- **Zip download** — stream the archive rather than buffering it (`archiver` piped to the
  response, reading each object as a stream).

## Data model

```
admin
  id, email, password_hash, created_at
  -- one row. Password hashed with argon2id or bcrypt. No signup route.

session
  id, admin_id, expires_at, created_at
  -- httpOnly, Secure, SameSite=Lax cookie holding the session id.

content
  key            text primary key      -- 'home.hero.title', 'investment.wedding.price'
  kind           text                  -- 'text' | 'image'
  value          text                  -- the copy, or the photo_id for images
  updated_at
  -- The CMS store. Keys are assigned in the source, not derived from the DOM.

photo
  id             uuid primary key
  storage_key    text                  -- object key of the original
  original_name  text
  width, height  int
  bytes          bigint
  content_hash   text                  -- dedupe repeat uploads
  created_at

photo_variant
  photo_id, size            -- 'thumb' (520px) | 'web' (2400px) | 'print' (original)
  storage_key, width, height, bytes
  primary key (photo_id, size)

album                                   -- Emma's own collections
  id, slug, name, subtitle
  live           boolean default false
  cover_photo_id uuid null
  position       int
  created_at, updated_at

album_photo
  album_id, photo_id, position, caption
  primary key (album_id, photo_id)

client_gallery
  id, slug
  client_name    text
  access_word    text                  -- stored lowercased; unique among unexpired galleries
  shot_on        date
  expires_on     date                  -- default now + 90 days
  note           text                  -- the handwritten closing note
  position       int
  created_at, updated_at

client_gallery_photo
  gallery_id, photo_id, position
  primary key (gallery_id, photo_id)

favourite                                -- what the client marked for print
  gallery_id, photo_id, marked_at
  primary key (gallery_id, photo_id)

inquiry                                  -- the Contact form
  id, name, email, phone, session_type, preferred_date, message
  created_at, read_at
```

## Auth

- Single admin. Password from an env var on first boot, hashed into `admin`; changeable later.
- `POST /api/admin/login` → verify, create `session`, set cookie. Rate-limit hard: 5 attempts
  per IP per 15 minutes, then a delay. The prototype's `goldenhour` is a placeholder — replace
  it, and never ship a password in client code.
- `POST /api/admin/logout` → delete session.
- Every `/api/admin/*` route and the `/studio` page require a valid session server-side.
  The signed-out Studio page must not contain any gallery data in its payload.
- The whole admin surface should be `noindex`.

## Content (the owner CMS)

The prototype makes text editable by walking the DOM and keying edits by node position. Replace
that with explicit keys.

- Every editable string in a page renders through a helper — e.g. `<Editable k="home.hero.title">`
  — that reads from the `content` table (falling back to the default copy compiled into the
  component) and, when an admin session is present, renders `contentEditable` with the edit-mode
  affordances described in the README.
- `GET /api/content?prefix=home.` → `{ key: value }` for server-side render.
- `PATCH /api/admin/content` → `{ key, value }[]`. Debounce on blur; one request per edit is fine.
- `DELETE /api/admin/content?prefix=home.` → the "Undo my edits" reset.
- Image slots work the same way: `<EditableImage k="home.hero.image">` resolves the key to a
  `photo_id` and renders the `web` variant; replacing it uploads a photo and repoints the key.
- Keep the compiled-in defaults as the fallback so a fresh database renders the finished site.

## Photo upload pipeline

`POST /api/admin/photos` (multipart, or presigned direct-to-storage PUT then a metadata POST —
prefer the latter for 800-frame uploads).

For each file:
1. Validate MIME and magic bytes; cap file size (say 50 MB) and count per request.
2. Hash the bytes; if `content_hash` already exists, reuse that `photo` row.
3. Store the original.
4. Generate derivatives with `sharp`, preserving orientation from EXIF and stripping the rest
   (GPS especially — client galleries must not leak a family's home coordinates):
   - `thumb` — 520px longest edge, JPEG q80
   - `web` — 2400px longest edge, JPEG q88
   - `print` — the original, untouched, for downloads
5. Return `{ id, thumb_url, web_url, width, height }`.

Report progress per file so the Studio's "N photographs are being made ready…" line is honest.
Uploads must be resumable in spirit: a failed file should not lose the ones that succeeded.

Serve images through a CDN or signed URLs with a long cache and immutable filenames. **Client
gallery photos must not be publicly guessable** — serve them via a route that checks the
gallery's access grant, or via short-lived signed URLs minted after the word is accepted.

## Public API

```
GET  /api/albums                        live albums, ordered by position, with cover + count
GET  /api/albums/:slug                  one album with its photos, captions, order
POST /api/client-galleries/unlock       { word } -> sets a scoped access cookie, returns gallery
GET  /api/client-galleries/:slug        requires the access cookie (or a valid link token)
POST /api/client-galleries/:slug/favourites   { photo_id, marked }
GET  /api/client-galleries/:slug/download/:photo_id
GET  /api/client-galleries/:slug/download?scope=all|marked      streamed zip
POST /api/inquiries                     the Contact form
```

Access rules:
- The word is matched case-insensitively against `access_word` among galleries where
  `expires_on >= today`. Expired galleries return the same "does not open anything" response as
  a wrong word — do not disclose that a gallery existed.
- On success, set an httpOnly cookie scoped to that gallery id, expiring at the earlier of 30
  days and `expires_on`.
- The shareable link is `?g=<word>` in the prototype. In production prefer an opaque signed
  token — `/g/<token>` — so the word isn't sitting in browser history and forwarded email
  threads. Keep the `?g=<word>` form working as a fallback if Emma has already sent links.
- Rate-limit unlock attempts per IP.
- Downloads always check the access grant. Filenames follow
  `<client-slug>-01.jpg` as in the prototype.

## Admin API

```
GET    /api/admin/albums                       all albums including drafts
POST   /api/admin/albums
PATCH  /api/admin/albums/:id                   name, subtitle, live, cover_photo_id, position
DELETE /api/admin/albums/:id
PUT    /api/admin/albums/:id/photos            full ordered list [{ photo_id, caption }]

GET    /api/admin/client-galleries
POST   /api/admin/client-galleries
PATCH  /api/admin/client-galleries/:id         name, word, shot_on, expires_on, note, position
DELETE /api/admin/client-galleries/:id
PUT    /api/admin/client-galleries/:id/photos  full ordered list
GET    /api/admin/client-galleries/:id/favourites   what the client marked

GET    /api/admin/inquiries
POST   /api/admin/photos
DELETE /api/admin/photos/:id                   only when unreferenced
```

Sending the whole ordered photo list on save (rather than per-photo position patches) keeps
reordering simple and idempotent — it matches how the Studio editor already works.

## Things the prototype gets wrong on purpose

1. **Password in client code.** `cms.js` compares against a literal. Real auth, server-side.
2. **DOM-path content keys.** Brittle; assign explicit keys in the source instead.
3. **Expiry is cosmetic.** The badge changes but the word still works. Enforce it server-side.
4. **Bulk download fires N browser downloads.** Ship a streamed zip.
5. **Favourites are lost on reload.** Persist them, and surface them to Emma in the Studio —
   knowing which frames a client wants printed is the point of the feature.
6. **No originals.** The prototype downscales everything to 2400px, so "full-size" is a
   half-truth. Keep and serve the originals for downloads.
7. **Single browser.** Everything is `localStorage`/`IndexedDB`, so Emma's edits do not exist on
   her phone. That is the whole reason for this document.
8. **Contact form does nothing.** Wire it to `inquiry` plus an email notification.

## Worth adding while you're in there

- Email on inquiry, and on a client opening their gallery for the first time.
- A "gallery about to expire" nudge so Emma can extend before a family loses access.
- Download counts per gallery — reassuring for her, and it tells her when it's safe to archive.
- Backups: nightly `pg_dump` to object storage, and versioning on the photo bucket. The
  photographs are the business; losing them is unrecoverable.
- `robots.txt` disallowing `/studio` and the client gallery routes, and `noindex` headers on both.
