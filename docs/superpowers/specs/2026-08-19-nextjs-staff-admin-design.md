# Next.js Staff Admin — Design Spec

Date: 2026-08-19
Status: approved product decisions; architecture section approved

## Goal

Replace day-to-day Django Jazzmin usage with a staff admin inside the existing Next.js app at `/admin`. Staff can fully manage the board-game library, edit site dictionary strings so they appear on the public site immediately, CRUD events, and process bookings. Django remains the data and auth source. Django Admin stays as an emergency hatch at `/django-admin/`.

## Product decisions (locked)

- Placement: `frontend/app/admin/` in the existing Next.js app, URL `/admin`. No second Next.js project, no `next-intl` locale prefix on admin routes.
- Users: several Django users with `is_staff=True`. Everyone has full access. No roles.
- Events: full CRUD, no moderation inbox. Telegram remains a source that creates visible events. Staff can create events by hand.
- Django Admin: move to `/django-admin/` (fallback). Do not delete it in this project.
- Dictionaries: JSON files `frontend/messages/{ru,en}.json` stay the source of truth. Saving in admin writes those files. The public site reads them at request time so copy changes appear without a Next rebuild.
- Bookings: list + filter + edit guest fields (name, contact, date, guests, event_title) + set status confirmed/rejected. No create, no delete.
- Games: form CRUD for games, categories, tags, expansions, image uploads, RU/EN fields, visibility flags. BoardGameGeek import is out of scope.

## Out of scope

- Menu admin
- FAQ content except keys already in the JSON dictionaries
- Private-hire marketing pages (`frontend/content/privateevents.ts`)
- BGG import
- Event moderation queue / draft workflow
- Creating or deleting bookings from the admin
- Per-user roles / permissions matrix
- A separate `admin/` Next.js application
- Removing Jazzmin / Django Admin
- Replacing CKEditor on the Django fallback admin

## Architecture

Two processes, one domain.

```
Browser
  ├── daerdree.bar/ru|en/...     → Next.js public site
  ├── daerdree.bar/admin/...     → Next.js staff UI (this project)
  ├── daerdree.bar/api/...       → Django (public + /api/admin/*)
  ├── daerdree.bar/django-admin/ → Django Jazzmin fallback
  └── daerdree.bar/media/...     → Django media
```

Locally, Next.js rewrites `/api/*`, `/django-admin/*`, and `/media/*` to `http://127.0.0.1:8000` so the browser origin is `localhost:3000` and session cookies are first-party.

Public DRF endpoints stay read-oriented for the website. All staff writes go through `/api/admin/`. Public and admin serializers are separate: public list/detail keep today's shape so the website does not break.

Security hardening that is part of this split (today these views are too open):

- Public `EventViewSet` becomes read-only (`ReadOnlyModelViewSet`). It currently inherits `ModelViewSet` with default `AllowAny`, so anyone can POST/PUT/DELETE events.
- Public `BookingViewSet` becomes create-only. List moves to `/api/admin/bookings/`. Today `AllowAny` list leaks every booking.

### Auth

Staff are existing Django `User` rows with `is_staff=True` and `is_active=True`.

Flow:

1. `GET /api/admin/csrf/` sets the CSRF cookie (`ensure_csrf_cookie`).
2. `POST /api/admin/login/` with `{ username, password }` and `X-CSRFToken`. On success Django session cookie is set. Non-staff or inactive → 403 with a stable JSON error. Wrong password → 400.
3. `GET /api/admin/me/` returns `{ id, username, is_staff }`. 401 if anonymous.
4. `POST /api/admin/logout/` flushes the session.

All `/api/admin/**` except login/csrf require authenticated staff (`IsAuthenticated` + `user.is_staff`).

Session cookies:

- Production: `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True` (already true).
- Debug/local HTTP: these flags follow `DEBUG` so `http://localhost:3000` can store the cookie. `DEBUG` is read from env (`DEBUG=true`), default false.

Admin UI:

- `/admin/login` — login form, no chrome.
- All other `/admin/*` — server layout calls `/api/admin/me/` with the incoming cookie. 401 → redirect to `/admin/login?next=...`.
- Client fetches to `/api/admin/...` use `credentials: 'include'` and send `X-CSRFToken`.

No JWT, no NextAuth, no extra user table.

### Routing

| Path | App | Notes |
|------|-----|--------|
| `/admin/login` | Next | public to anonymous |
| `/admin` | Next | dashboard |
| `/admin/games` | Next | list |
| `/admin/games/new` | Next | create |
| `/admin/games/[id]` | Next | edit |
| `/admin/categories` | Next | list + inline create/edit |
| `/admin/tags` | Next | list + inline create/edit |
| `/admin/dictionaries` | Next | JSON editor |
| `/admin/events` | Next | list |
| `/admin/events/new` | Next | create |
| `/admin/events/[id]` | Next | edit |
| `/admin/bookings` | Next | list |
| `/admin/bookings/[id]` | Next | edit + status |
| `/django-admin/` | Django | Jazzmin fallback |

`frontend/middleware.ts` excludes `admin` (and existing `api|_next|...`) from next-intl so `/admin` is not rewritten to `/en/admin`.

`frontend/app/robots.ts` already disallows `/admin/` for some bots; keep that, and add `/django-admin/` to the disallow lists that mention `/admin/`.

## Admin chrome

Visual language matches the public site and the current Jazzmin dashboard (`CONTEXT.md`):

- Background `hsl(60, 3%, 6%)`
- Text `hsl(0, 13%, 91%)`
- Accent `hsl(187, 83%, 26%)`
- Fonts: Manrope (UI), Literata (titles)
- UI language: Russian only, hardcoded. Admin is not in the public i18n files.

Layout: left sidebar (logo, nav, username, logout) + main pane. Nav items: Дашборд, Игры, Категории, Теги, Словари, События, Брони. Active item uses the accent color.

Dashboard copies the Jazzmin index intent: counts + links for games, events, pending bookings, dictionary (no count). Counts come from `GET /api/admin/me/` extra payload or a tiny `GET /api/admin/stats/` `{ games, events, bookings_pending }`. Use `/api/admin/stats/` so `me` stays about the user.

Mobile: sidebar collapses to a top bar + menu button. Staff will use a laptop, but the layout must remain usable at 375px.

No GSAP, Lenis, or public Header/Footer on admin routes.

## Games

Domain already in Django: `BoardGame`, `Category`, `Tag`, `Expansion`, `GameImage`. modeltranslation fields: `title`/`description` on games and expansions, `name`/`description` on categories, `name` on tags.

Admin game serializer (write-capable) includes:

- `id`, `slug`
- `title_ru`, `title_en`, `description_ru`, `description_en` (HTML string)
- `categories` and `tags` as ID lists on write; expanded objects on read
- `min_players`, `max_players`, `play_time`, `difficulty` (1–5)
- `designer`, `bgg_type` (plain fields, no importer)
- `image`, `setup_image` (file upload, nullable)
- `images[]`: `{ id, image, image_type, order, alt }` with `image_type` in `cover|background|gallery`
- `expansions[]`: `{ id, title_ru, title_en, description_ru, description_en }`
- `is_active`, `is_visible_ru`, `is_visible_en`
- `created_at` read-only

Slug: if omitted on create, generate from `title_ru` via Django `slugify`, unique with a numeric suffix.

List endpoint: search `title`, filter `is_active`, `is_visible_ru`, `is_visible_en`, `categories`. Pagination page size 50. List payload is a compact card (id, title_ru, title_en, image, is_active, is_visible_ru, is_visible_en) — not the nested gallery.

Game create/update is JSON, not multipart. Expansions are a writable nested list on the game payload (`id` optional: missing id creates, existing id updates, omitted ids are deleted). Images use separate endpoints so files never sit inside a JSON body:

- `POST /api/admin/games/{id}/image/` — multipart field `file` → `BoardGame.image` (replace)
- `DELETE /api/admin/games/{id}/image/` — clears `BoardGame.image`
- `POST /api/admin/games/{id}/setup-image/` and `DELETE` — same for `setup_image`
- `GET/POST /api/admin/games/{id}/gallery/` — list / upload (`file`, `image_type`, `order`, `alt`)
- `PATCH/DELETE /api/admin/games/{id}/gallery/{image_id}/` — metadata or remove

Behaviour:

- Staff can add/remove expansions on the game form.
- Staff can upload/replace cover, setup, and gallery rows, reorder them, set `image_type` and `alt`.
- Deleting a game deletes expansions and gallery (model CASCADE, already).
- Create the game JSON first, then upload images on the new id (the create form does this in one UI save: POST game, then image requests).

Categories and tags: separate list pages with create/edit/delete. Fields: `name_ru`, `name_en`, `slug` (autogen), category also `description_ru`/`description_en` and optional `icon`. Cannot delete a category/tag that is still attached to a game — API returns 409 with a Russian message; UI shows it.

Description HTML: public pages already render `dangerouslySetInnerHTML`. Admin v1 uses a textarea for HTML (bold/italic/lists as tags) plus a preview. No CKEditor/TipTap in v1.

Public `BoardGameViewSet` stays read-only. Nested `GameImage` on the public API is not required for this project.

## Dictionaries

Source of truth: `frontend/messages/ru.json` and `frontend/messages/en.json`.

`GET /api/admin/translations/` returns a grouped structure built by flattening both files (same algorithm as `cms/admin.py`):

```json
{
  "groups": [
    {
      "name": "GamesLibrary",
      "keys": [
        { "key": "GamesLibrary.title", "ru": "Наша библиотека", "en": "Our library" }
      ]
    }
  ]
}
```

Nested arrays (FAQ `blocks.*.items`) stay as JSON strings in the value cells if the flatten hits a non-dict. The current flatten already treats non-dict leaves as values; do not invent a structured FAQ editor.

`PUT /api/admin/translations/` body:

```json
{
  "keys": {
    "GamesLibrary.title": { "ru": "...", "en": "..." }
  }
}
```

Server unflattens, writes both files (write to `*.json.tmp` then `os.replace`), and returns the same shape as GET. Missing keys in the PUT relative to the files: treat PUT as a full snapshot of every key that GET would have returned — the UI always submits the complete set, same as today's Django form. Unknown extra keys are ignored. Staff cannot add or delete keys in v1.

Extract flatten/unflatten from `cms/admin.py` into `cms/json_i18n.py` so Django fallback admin and the new API share one implementation.

Public site: `frontend/i18n/request.ts` reads `messages/{locale}.json` from disk with `fs.promises.readFile` on every request. Call `unstable_noStore()` from `next/cache` inside `getRequestConfig` so Next does not bake the JSON at build. Fallback if the file is missing or invalid JSON: empty object (same as `/cms/translations/` today). Do not switch the public site to HTTP-fetching Django; same-machine files are the live path.

The existing `GET /cms/translations/<locale>/` stays; unused by the new admin.

## Events

Admin API is a ModelViewSet on **all** events (including `is_visible=False`), ordered by `-event_date`.

Fields: `id`, `title`, `description`, `title_en`, `description_en`, `image` (required on create, optional on update = keep current), `event_date` (ISO datetime), `is_visible` (default `true`), `telegram_id` (read-only), `created_at` (read-only).

List: search title, filter `is_visible`, pagination 20. Compact rows: id, title, event_date, is_visible, image.

Create/update: multipart for the poster. Empty `title_en`/`description_en` allowed (public site already falls back to RU).

No auto-translate action in v1 (Jazzmin has one; skip). No “import Telegram history” button in v1 (management command and webhook stay).

Public events endpoint: read-only, `is_visible=True` only, current pagination of 9, serializer without `is_visible`/`telegram_id` — website unchanged.

## Bookings

Admin: `List` + `Retrieve` + `Update` (PATCH). No create, no destroy.

Writable: `name`, `contact`, `date`, `guests`, `event_title`, `status` (`pending|confirmed|rejected`). `created_at` read-only.

List: filter `status`, search name/contact, order `-created_at`, page size 20.

UI: table of recent bookings, pending highlighted. Detail: edit fields, two primary actions «Подтвердить» / «Отклонить» that PATCH `status`. Telegram notifications on **create** stay as they are (`post_save` on Booking). Changing status in admin does **not** send a second Telegram message in v1 (Telegram already has its own confirm/reject buttons).

Public: `POST /api/bookings/` only, `AllowAny`, `status` still read-only default `pending`.

## Error handling

API errors are JSON `{ "detail": "..." }` or field maps `{ "title_ru": ["Обязательное поле."] }`. Language of messages: Russian.

Admin UI:

- Login failure: inline message, stay on the form.
- 401 on any admin fetch: redirect to login.
- 403: banner «Недостаточно прав».
- 409 on category/tag delete: banner with server `detail`.
- 4xx validation on forms: field-level errors, do not clear the form.
- 5xx: banner «Серверная ошибка», keep unsaved form data.
- Dictionary save failure: do not leave one language file written and the other not — write both via temp+replace; if the second write fails, restore from the in-memory snapshot of the previous files.

## Testing

Backend (pytest-style Django `APITestCase` is fine; the repo currently has empty `tests.py` stubs). Cover:

- Login: staff ok, non-staff 403, bad password 400, anonymous me 401.
- CSRF: authenticated unsafe method without token is rejected.
- Public events: GET list ok, POST returns 405.
- Public bookings: POST ok, GET list 405.
- Admin games: unauthenticated 401; staff create/update/delete game with categories, tags, expansion, image; slug autogen.
- Admin translations: GET groups; PUT round-trip does not drop keys; public `get_translations` / file content updates.
- Admin events: create hidden event does not appear on public list; visible does.
- Admin bookings: PATCH status and name; POST to admin bookings 405.

Frontend: no new test runner in v1. Manual/browser verification of login, each of the four sections, and that a dictionary save changes a string on `/ru` without rebuild.

## Deploy notes

Production nginx (not in repo) must route:

- `/admin/` → Next.js (not Django)
- `/django-admin/` → Django
- `/api/` → Django
- `/media/` → Django

Until nginx is updated, `/admin` on production still hits Jazzmin. Call that out in the PR, do not silently break the live Django admin.

## File map (intended)

Backend:

- `backend/core/urls.py` — `/django-admin/`, include admin API
- `backend/core/settings.py` — DEBUG from env, cookie flags, CORS credentials
- `backend/staff/` — login, logout, me, csrf, stats (small app, no models); add to `INSTALLED_APPS`
- `backend/boardgames/admin_serializers.py`, `admin_views.py`
- `backend/events/admin_views.py` (or serializers + views)
- `backend/bookings/admin_views.py`
- `backend/bookings/views.py` — create-only public
- `backend/events/views.py` — read-only public
- `backend/cms/json_i18n.py` — flatten/unflatten + read/write files
- `backend/cms/admin.py` — use json_i18n
- `backend/cms/admin_views.py` — translations GET/PUT
- Tests next to each app

Frontend:

- `frontend/middleware.ts` — skip locale for `/admin`
- `frontend/next.config.ts` — rewrites in development
- `frontend/i18n/request.ts` — runtime file read
- `frontend/app/admin/login/page.tsx`
- `frontend/app/admin/layout.tsx` — fonts, no public header
- `frontend/app/admin/(panel)/layout.tsx` — session gate + sidebar
- `frontend/app/admin/(panel)/page.tsx` — dashboard
- `frontend/app/admin/(panel)/games/...`
- `frontend/app/admin/(panel)/categories/page.tsx`
- `frontend/app/admin/(panel)/tags/page.tsx`
- `frontend/app/admin/(panel)/dictionaries/page.tsx`
- `frontend/app/admin/(panel)/events/...`
- `frontend/app/admin/(panel)/bookings/...`
- `frontend/lib/admin-api.ts` — fetch wrapper with credentials + CSRF

## Success criteria

A staff user can log in at `/admin`, manage games (including categories, tags, expansions, images, RU/EN, visibility), edit dictionary strings and see them on the public site without a rebuild, create/edit/hide events, and confirm/reject/edit bookings. Anonymous users cannot hit `/api/admin/*`. The public website keep working. Django Admin still opens at `/django-admin/`.
