# Emma Jane Photography

The website, owner CMS and client-gallery platform for Emma Jane Photography (Tulsa, OK).
Built from the design handoff in `design_handoff_emma_jane_photography/` — read its `README.md`
for the design and `BACKEND.md` for the server-side spec this implements.

**Stack:** Next.js 16 (App Router) · Postgres · S3-compatible object storage (Tigris on Fly) ·
`sharp` for derivatives · streamed zips with `archiver` · deployed to Fly.io from GitHub Actions.

## What is here

| Area | Where | Notes |
|---|---|---|
| Marketing pages | `src/app/{page,portfolio,investment,about,contact}` | Every line of copy and every photograph is owner-editable via `<Editable k="…">` / `<EditableImage k="…">` with a stable content key. Defaults are compiled in, so a fresh database renders the finished site. |
| Owner CMS | `src/components/{AdminProvider,AdminBar,Editable*}.tsx` | The discreet **Admin** control below the footer → sign in → **Edit this page**. Edits save per key to the `content` table; **Undo my edits** clears the page's prefix. |
| Galleries (public) | `src/app/galleries` | Live albums only; album detail at `/galleries/<slug>` with the dense mosaic and lightbox. Emma can preview drafts while signed in. |
| Client galleries | `src/app/client-gallery`, `src/app/g/[token]` | Opened by the word (`?g=word` still works) or an opaque `/g/<token>` link. A signed, gallery-scoped cookie grants access for ≤30 days and never past `expires_on`. Favourites persist; downloads are the untouched originals, single or as a streamed zip. |
| Studio (admin) | `src/app/studio` | Albums, client galleries and a **Notes** tab for contact-form inquiries. Uploads go through `POST /api/admin/photos` two at a time with live progress. |
| API | `src/app/api/**` | Matches `BACKEND.md` (plus `/order` routes for drag-free reordering, `/api/client-galleries/current`, `/api/health`). |
| Photo pipeline | `src/lib/images.ts` | Magic-byte validation, 50 MB cap, sha-256 dedupe, EXIF-oriented + metadata-stripped `thumb` (520px) and `web` (2400px) JPEGs, original kept as `print`. |
| Photo serving | `src/app/api/photos/[id]/[size]` | One access-checked route: public if used on a page or in a live album, otherwise only with a matching gallery grant or an admin session. Private photos 404 (never 403). |
| Schema | `db/migrations/*.sql` | Applied by `scripts/migrate.mjs` on every boot; also creates the single admin from `ADMIN_PASSWORD` the first time. |

## Run it locally

```bash
npm install
cp .env.example .env.local        # fill in DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD
npm run migrate                   # creates tables + the admin account
npm run dev                       # http://localhost:3000
```

Without `BUCKET_NAME`, uploads land in `./.storage` (fine locally, wrong in production).
Optional: `ADMIN_PASSWORD=… npm run seed:demo` fills the Studio with the prototype's demo
galleries (client words `goldenfield` and `loveletter`) through the real API.

`npm run typecheck` and `npm run build` are what CI runs on every pull request.

## Deploy to Fly.io

The app is one Fly machine (autostop/autostart) plus Fly Postgres and a Tigris bucket. Photos must
live in the bucket, never on the machine — the machine is disposable.

### One-time setup (from your laptop with `flyctl` signed in)

```bash
# 1. The app. If you already created one in the Fly dashboard, put its name in fly.toml instead.
fly launch --no-deploy --copy-config --name emmajane --region dfw

# 2. Postgres — attaching sets DATABASE_URL on the app for you.
fly postgres create --name emmajane-db --region dfw --vm-size shared-cpu-1x --volume-size 1
fly postgres attach emmajane-db --app emmajane

# 3. Object storage — Tigris sets BUCKET_NAME + AWS_* on the app for you.
fly storage create --app emmajane

# 4. Secrets the app needs.
fly secrets set --app emmajane \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  ADMIN_PASSWORD="<Emma's studio password, 10+ characters>" \
  ADMIN_EMAIL="hello@emmajanephoto.com" \
  SITE_URL="https://emmajane.fly.dev"

# 5. First deploy.
fly deploy
```

Optional secrets: `RESEND_API_KEY` + `NOTIFY_EMAIL` turn on email for new inquiries and first
gallery opens. When the custom domain is attached (`fly certs add emmajanephoto.com`), update
`SITE_URL`.

### Deploys from GitHub

`.github/workflows/fly-deploy.yml` runs `flyctl deploy` on every push to `main`. It needs one
repository secret, **`FLY_API_TOKEN`**:

```bash
fly tokens create deploy --app emmajane -x 999999h
```

Paste the output into GitHub → Settings → Secrets and variables → Actions → New repository secret.
Pull requests run `.github/workflows/ci.yml` (typecheck + build) instead of deploying.

### Checking the deployment

- `https://<app>.fly.dev/api/health` → `{"ok":true,"db":"ok","storage":"s3"}`. If `storage` says
  `local`, the bucket is not attached and uploads will vanish on the next deploy.
- `fly logs` shows `migrate: created the admin account …` on the first boot.
- Sign in at the bottom of any page with `ADMIN_PASSWORD`, then open **Galleries** in the bar.

## Environment variables

See `.env.example`. Required: `DATABASE_URL`, `SESSION_SECRET`, and (first boot only)
`ADMIN_PASSWORD`. Storage: `BUCKET_NAME`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. Optional: `SITE_URL`, `ADMIN_EMAIL`,
`RESEND_API_KEY`, `NOTIFY_EMAIL`, `FROM_EMAIL`.

## Backups

The photographs are the business. Turn on object versioning for the bucket and schedule Fly
Postgres snapshots (`fly postgres` volumes take daily snapshots by default; keep them).
