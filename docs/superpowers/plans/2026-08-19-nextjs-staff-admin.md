# Next.js Staff Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a staff admin at `/admin` in the existing Next.js app that manages games, dictionaries, events, and bookings, backed by Django `/api/admin/` session auth, while Django Jazzmin moves to `/django-admin/`.

**Architecture:** Public DRF stays read-oriented. A new `staff` app owns login/csrf/me/stats. Each domain app grows `admin_serializers.py` + `admin_views.py` registered under `/api/admin/`. Next.js `app/admin/` is locale-free, talks to `/api/admin/` with session+CSRF (dev rewrites to Django). Dictionary JSON files remain source of truth; Next reads them from disk per request.

**Tech Stack:** Django 6, DRF, django-modeltranslation, Next.js 16 App Router, TypeScript, Tailwind 4, next-intl (public site only).

## Global Constraints

- Admin URL is `/admin` on Next.js; Django Admin lives at `/django-admin/`.
- Staff means Django `User.is_staff` and `is_active`; no roles.
- Public website JSON/API shapes must not break (`/api/games`, `/api/events`, `POST /api/bookings/`).
- Dictionary source of truth is `frontend/messages/{ru,en}.json`; saves are visible on the public site without a Next rebuild.
- Admin UI language is Russian, hardcoded; no `next-intl` on `/admin`.
- Visual tokens: background `hsl(60, 3%, 6%)`, text `hsl(0, 13%, 91%)`, accent `hsl(187, 83%, 26%)`, Manrope + Literata.
- Out of scope: menu, BGG import, event moderation inbox, booking create/delete, NextAuth/JWT, TipTap/CKEditor in Next, killing Jazzmin.
- Backend tests: `cd backend && ./venv/bin/python manage.py test <app> -v2`.
- Frontend has no unit test runner; verify with `cd frontend && npx tsc --noEmit` and `npm run lint`.
- Do not commit `id_rsa`, `.env`, media dumps, or `venv/`.

---

## File map

**Create**

- `backend/staff/__init__.py`
- `backend/staff/apps.py`
- `backend/staff/permissions.py` — `IsStaffUser`
- `backend/staff/views.py` — csrf, login, logout, me, stats
- `backend/staff/urls.py`
- `backend/staff/tests.py`
- `backend/cms/json_i18n.py`
- `backend/cms/admin_views.py`
- `backend/boardgames/admin_serializers.py`
- `backend/boardgames/admin_views.py`
- `backend/events/admin_serializers.py`
- `backend/events/admin_views.py`
- `backend/bookings/admin_serializers.py`
- `backend/bookings/admin_views.py`
- `frontend/lib/admin-api.ts`
- `frontend/app/admin/layout.tsx`
- `frontend/app/admin/login/page.tsx`
- `frontend/app/admin/(panel)/layout.tsx`
- `frontend/app/admin/(panel)/page.tsx`
- `frontend/app/admin/(panel)/dictionaries/page.tsx`
- `frontend/app/admin/(panel)/categories/page.tsx`
- `frontend/app/admin/(panel)/tags/page.tsx`
- `frontend/app/admin/(panel)/games/page.tsx`
- `frontend/app/admin/(panel)/games/new/page.tsx`
- `frontend/app/admin/(panel)/games/[id]/page.tsx`
- `frontend/app/admin/(panel)/games/GameForm.tsx`
- `frontend/app/admin/(panel)/events/page.tsx`
- `frontend/app/admin/(panel)/events/new/page.tsx`
- `frontend/app/admin/(panel)/events/[id]/page.tsx`
- `frontend/app/admin/(panel)/events/EventForm.tsx`
- `frontend/app/admin/(panel)/bookings/page.tsx`
- `frontend/app/admin/(panel)/bookings/[id]/page.tsx`
- `frontend/components/admin/AdminShell.tsx`
- `frontend/components/admin/AdminTable.tsx`
- `frontend/app/admin/admin.css`

**Modify**

- `backend/core/settings.py` — DEBUG from env, cookie flags, CORS credentials, INSTALLED_APPS `staff`
- `backend/core/urls.py` — `/django-admin/`, `/api/admin/`
- `backend/events/views.py` — ReadOnlyModelViewSet
- `backend/bookings/views.py` — create-only
- `backend/cms/admin.py` — import flatten/unflatten from json_i18n
- `backend/cms/tests.py` — translations API tests
- `backend/boardgames/tests.py`
- `backend/events/tests.py`
- `backend/bookings/tests.py`
- `frontend/middleware.ts` — skip `/admin`
- `frontend/next.config.ts` — dev rewrites
- `frontend/i18n/request.ts` — runtime file read + `unstable_noStore`
- `frontend/app/robots.ts` — disallow `/django-admin/`

---

### Task 1: Django Admin URL, DEBUG, cookies

**Files:**
- Modify: `backend/core/settings.py`
- Modify: `backend/core/urls.py`
- Test: `backend/staff/tests.py` (create the app + this URL test here so Task 2 can add auth tests to the same file)

**Interfaces:**
- Consumes: nothing
- Produces: Django admin at `/django-admin/`; `DEBUG` from env; `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE` equal `not DEBUG`; `CORS_ALLOW_CREDENTIALS = True`

- [ ] **Step 1: Write the failing test**

Create `backend/staff/__init__.py` (empty), `backend/staff/apps.py`:

```python
from django.apps import AppConfig

class StaffConfig(AppConfig):
    name = 'staff'
    verbose_name = 'Staff API'
```

Create `backend/staff/tests.py`:

```python
from django.test import TestCase, override_settings
from django.urls import reverse


class DjangoAdminUrlTests(TestCase):
    def test_django_admin_lives_under_django_admin(self):
        url = reverse('admin:index')
        self.assertTrue(url.startswith('/django-admin/'))

    def test_legacy_admin_path_is_not_django_admin(self):
        response = self.client.get('/admin/')
        self.assertNotEqual(response.status_code, 200)
```

Add `'staff'` to `INSTALLED_APPS` in `backend/core/settings.py` (after `'cms'`) so the test module loads. Do not change the admin URL yet.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./venv/bin/python manage.py test staff.tests.DjangoAdminUrlTests -v2`

Expected: `test_django_admin_lives_under_django_admin` FAIL (`/admin/` does not start with `/django-admin/`).

- [ ] **Step 3: Move admin URL and cookie flags**

In `backend/core/urls.py` replace `path('admin/', admin.site.urls)` with:

```python
path('django-admin/', admin.site.urls),
```

In `backend/core/settings.py` replace `DEBUG = False` with:

```python
DEBUG = os.getenv('DEBUG', 'False').lower() in ('1', 'true', 'yes')
```

Replace the two secure-cookie lines with:

```python
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CORS_ALLOW_CREDENTIALS = True
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd backend && ./venv/bin/python manage.py test staff.tests.DjangoAdminUrlTests -v2`

Expected: PASS. `GET /django-admin/login/` is 200 when you curl it later; `/admin/` is no longer Jazzmin.

- [ ] **Step 5: Commit**

```bash
git add backend/core/settings.py backend/core/urls.py backend/staff/__init__.py backend/staff/apps.py backend/staff/tests.py
git commit -m "feat(admin): move Django Admin to /django-admin"
```

---

### Task 2: Staff auth API (csrf, login, logout, me)

**Files:**
- Create: `backend/staff/permissions.py`
- Create: `backend/staff/views.py`
- Create: `backend/staff/urls.py`
- Modify: `backend/core/urls.py`
- Modify: `backend/staff/tests.py`

**Interfaces:**
- Consumes: Django `User`, session auth
- Produces:
  - `GET /api/admin/csrf/` → `{ "detail": "ok" }` + `csrftoken` cookie
  - `POST /api/admin/login/` body `{ "username", "password" }` → `{ "id", "username", "is_staff" }` + session cookie; 400 bad password; 403 not staff
  - `POST /api/admin/logout/` → `{ "detail": "ok" }`
  - `GET /api/admin/me/` → `{ "id", "username", "is_staff" }`; 401 anonymous
  - `IsStaffUser.has_permission(request, view) -> bool`

- [ ] **Step 1: Write the failing tests**

Append to `backend/staff/tests.py`:

```python
from django.contrib.auth.models import User
from rest_framework.test import APITestCase


class StaffAuthTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username='keeper', password='secret-pass', is_staff=True
        )
        self.guest = User.objects.create_user(
            username='guest', password='secret-pass', is_staff=False
        )

    def test_me_anonymous_401(self):
        response = self.client.get('/api/admin/me/')
        self.assertEqual(response.status_code, 401)

    def test_login_staff_ok_and_me(self):
        response = self.client.post(
            '/api/admin/login/',
            {'username': 'keeper', 'password': 'secret-pass'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'keeper')
        me = self.client.get('/api/admin/me/')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data['username'], 'keeper')

    def test_login_non_staff_403(self):
        response = self.client.post(
            '/api/admin/login/',
            {'username': 'guest', 'password': 'secret-pass'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_login_bad_password_400(self):
        response = self.client.post(
            '/api/admin/login/',
            {'username': 'keeper', 'password': 'nope'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_logout_then_me_401(self):
        self.client.post(
            '/api/admin/login/',
            {'username': 'keeper', 'password': 'secret-pass'},
            format='json',
        )
        out = self.client.post('/api/admin/logout/', format='json')
        self.assertEqual(out.status_code, 200)
        me = self.client.get('/api/admin/me/')
        self.assertEqual(me.status_code, 401)

    def test_csrf_endpoint_sets_cookie(self):
        response = self.client.get('/api/admin/csrf/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('csrftoken', response.cookies)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./venv/bin/python manage.py test staff.tests.StaffAuthTests -v2`

Expected: FAIL (404 / URL not found).

- [ ] **Step 3: Implement auth**

`backend/staff/permissions.py`:

```python
from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    message = 'Недостаточно прав.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff and user.is_active)
```

`backend/staff/views.py`:

```python
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .permissions import IsStaffUser


def user_payload(user):
    return {'id': user.id, 'username': user.username, 'is_staff': user.is_staff}


class CsrfView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({'detail': 'ok'})


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'detail': 'Неверный логин или пароль.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_staff or not user.is_active:
            return Response({'detail': 'Недостаточно прав.'}, status=status.HTTP_403_FORBIDDEN)
        login(request, user)
        return Response(user_payload(user))


class LogoutView(APIView):
    permission_classes = [IsStaffUser]

    def post(self, request):
        logout(request)
        return Response({'detail': 'ok'})


class MeView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        return Response(user_payload(request.user))
```

`backend/staff/urls.py`:

```python
from django.urls import path
from .views import CsrfView, LoginView, LogoutView, MeView

urlpatterns = [
    path('csrf/', CsrfView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('me/', MeView.as_view()),
]
```

In `backend/core/urls.py` add:

```python
path('api/admin/', include('staff.urls')),
```

`MeView`/`LogoutView` use DRF `SessionAuthentication` (default). Unauthenticated `IsStaffUser` must yield 401 not 403: override DRF by setting

```python
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
}
```

in `settings.py`. Public views that set `authentication_classes = []` (bookings create, telegram webhook) stay unaffected. `IsStaffUser` failing on an anonymous user: DRF returns 403 if authenticated=False with a permission deny. To get 401, use:

```python
from rest_framework.permissions import IsAuthenticated

class IsStaffUser(BasePermission):
    message = 'Недостаточно прав.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return bool(request.user.is_staff and request.user.is_active)
```

and on `MeView`:

```python
permission_classes = [IsAuthenticated, IsStaffUser]
```

`IsAuthenticated` on anonymous → 401. Staff check on non-staff session → 403. Tests above only cover anonymous 401 and staff 200.

- [ ] **Step 4: Run tests**

Run: `cd backend && ./venv/bin/python manage.py test staff.tests -v2`

Expected: PASS (URL tests from Task 1 and auth tests).

- [ ] **Step 5: Commit**

```bash
git add backend/staff backend/core/urls.py backend/core/settings.py
git commit -m "feat(admin): staff session login API"
```

---

### Task 3: Lock down public events and bookings

**Files:**
- Modify: `backend/events/views.py`
- Modify: `backend/bookings/views.py`
- Modify: `backend/events/tests.py`
- Modify: `backend/bookings/tests.py`

**Interfaces:**
- Consumes: existing public serializers
- Produces: public events GET-only (POST 405); public bookings POST-only (GET 405)

- [ ] **Step 1: Write the failing tests**

`backend/events/tests.py`:

```python
from django.utils import timezone
from rest_framework.test import APITestCase
from events.models import Event


class PublicEventApiTests(APITestCase):
    def test_list_ok(self):
        response = self.client.get('/api/events/')
        self.assertEqual(response.status_code, 200)

    def test_create_not_allowed(self):
        response = self.client.post(
            '/api/events/',
            {
                'title': 'Hack',
                'description': 'nope',
                'event_date': timezone.now().isoformat(),
            },
            format='json',
        )
        self.assertEqual(response.status_code, 405)
```

`backend/bookings/tests.py`:

```python
from rest_framework.test import APITestCase
from bookings.models import Booking


class PublicBookingApiTests(APITestCase):
    def test_create_ok(self):
        response = self.client.post(
            '/api/bookings/',
            {
                'name': 'Ada',
                'contact': '+357',
                'date': 'завтра 19:00',
                'guests': '2',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Booking.objects.count(), 1)

    def test_list_not_allowed(self):
        response = self.client.get('/api/bookings/')
        self.assertEqual(response.status_code, 405)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./venv/bin/python manage.py test events.tests.PublicEventApiTests bookings.tests.PublicBookingApiTests -v2`

Expected: `test_create_not_allowed` FAIL (today EventViewSet is ModelViewSet, likely 201 or 400, not 405). `test_list_not_allowed` FAIL (today 200).

- [ ] **Step 3: Implement lockdown**

`backend/events/views.py` — change the class to:

```python
from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from .models import Event
from .serializers import EventSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 9
    page_size_query_param = 'page_size'
    max_page_size = 100


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Event.objects.filter(is_visible=True).order_by('-event_date')
    serializer_class = EventSerializer
    pagination_class = StandardResultsSetPagination
```

`backend/bookings/views.py` — replace `BookingViewSet` bases:

```python
class BookingViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
```

Keep `telegram_webhook` and `process_event_from_channel` unchanged.

- [ ] **Step 4: Run tests**

Run: `cd backend && ./venv/bin/python manage.py test events.tests.PublicEventApiTests bookings.tests.PublicBookingApiTests -v2`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/events/views.py backend/events/tests.py backend/bookings/views.py backend/bookings/tests.py
git commit -m "fix(api): public events read-only, bookings create-only"
```

---

### Task 4: Next.js admin login and shell

**Files:**
- Modify: `frontend/middleware.ts`
- Modify: `frontend/next.config.ts`
- Modify: `frontend/app/robots.ts`
- Create: `frontend/lib/admin-api.ts`
- Create: `frontend/app/admin/admin.css`
- Create: `frontend/app/admin/layout.tsx`
- Create: `frontend/app/admin/login/page.tsx`
- Create: `frontend/components/admin/AdminShell.tsx`
- Create: `frontend/app/admin/(panel)/layout.tsx`
- Create: `frontend/app/admin/(panel)/page.tsx`

**Interfaces:**
- Consumes: `/api/admin/csrf|login|logout|me/` via same-origin rewrite in development
- Produces: `/admin/login`, `/admin` dashboard placeholder, session gate

- [ ] **Step 1: Middleware, robots, rewrites (no test runner — typecheck is the gate)**

`frontend/middleware.ts` matcher becomes:

```ts
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|admin|django-admin|.*\\..*).*)'],
};
```

`frontend/app/robots.ts` — add `"/django-admin/"` to both existing `disallow` arrays.

`frontend/next.config.ts` — inside `nextConfig`, add:

```ts
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];
    const django = process.env.DJANGO_INTERNAL_URL || 'http://127.0.0.1:8000';
    return [
      { source: '/api/:path*', destination: `${django}/api/:path*` },
      { source: '/cms/:path*', destination: `${django}/cms/:path*` },
      { source: '/django-admin/:path*', destination: `${django}/django-admin/:path*` },
      { source: '/media/:path*', destination: `${django}/media/:path*` },
    ];
  },
```

Keep the existing `redirects()` and `images` blocks.

- [ ] **Step 2: Admin fetch helper**

`frontend/lib/admin-api.ts`:

```ts
const DJANGO_INTERNAL = process.env.DJANGO_INTERNAL_URL || 'http://127.0.0.1:8000';

function csrfFromDocument(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export class AdminApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(typeof body === 'object' && body && 'detail' in body ? String((body as { detail: string }).detail) : `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function adminFetch<T>(path: string, init: RequestInit = {}, cookieHeader?: string): Promise<T> {
  const isServer = typeof window === 'undefined';
  const base = isServer ? DJANGO_INTERNAL : '';
  const headers = new Headers(init.headers);
  if (cookieHeader) headers.set('cookie', cookieHeader);
  if (!headers.has('content-type') && init.body && !(init.body instanceof FormData)) {
    headers.set('content-type', 'application/json');
  }
  if (init.method && init.method !== 'GET' && init.method !== 'HEAD') {
    const csrf = csrfFromDocument();
    if (csrf) headers.set('X-CSRFToken', csrf);
  }
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new AdminApiError(res.status, data);
  return data as T;
}

export type StaffUser = { id: number; username: string; is_staff: boolean };

export function adminLogin(username: string, password: string) {
  return adminFetch<StaffUser>('/api/admin/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function adminLogout() {
  return adminFetch<{ detail: string }>('/api/admin/logout/', { method: 'POST' });
}

export function adminMe(cookieHeader?: string) {
  return adminFetch<StaffUser>('/api/admin/me/', {}, cookieHeader);
}

export function adminCsrf() {
  return adminFetch<{ detail: string }>('/api/admin/csrf/');
}
```

- [ ] **Step 3: Login page, shell, dashboard placeholder**

`frontend/app/admin/admin.css`:

```css
.admin-root {
  min-height: 100vh;
  background: hsl(60, 3%, 6%);
  color: hsl(0, 13%, 91%);
  font-family: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
}
.admin-root a { color: inherit; text-decoration: none; }
.admin-accent { color: hsl(187, 83%, 26%); }
```

`frontend/app/admin/layout.tsx`:

```tsx
import { Manrope, Literata } from 'next/font/google';
import '../[locale]/globals.css';
import './admin.css';

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-manrope', display: 'swap' });
const literata = Literata({ subsets: ['latin', 'cyrillic'], weight: ['400', '500', '600'], variable: '--font-literata', display: 'swap' });

export const metadata = { title: 'Daerdree Admin', robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${literata.variable} admin-root`}>{children}</body>
    </html>
  );
}
```

`frontend/app/admin/login/page.tsx` — client form: on mount `adminCsrf()`, submit `adminLogin`, on success `router.push(next || '/admin')`. On `AdminApiError` show `error.message` under the form. Fields: Логин, Пароль, button Войти. Dark card centered, Literata heading «Daerdree Admin».

`frontend/components/admin/AdminShell.tsx` — client sidebar:

```tsx
const NAV = [
  { href: '/admin', label: 'Дашборд' },
  { href: '/admin/games', label: 'Игры' },
  { href: '/admin/categories', label: 'Категории' },
  { href: '/admin/tags', label: 'Теги' },
  { href: '/admin/dictionaries', label: 'Словари' },
  { href: '/admin/events', label: 'События' },
  { href: '/admin/bookings', label: 'Брони' },
];
```

Props: `{ username: string, children: React.ReactNode }`. Logout button calls `adminLogout()` then `window.location.href = '/admin/login'`. Active link: `pathname === href` or `pathname.startsWith(href + '/')` except dashboard which is exact. Mobile: menu button toggles sidebar. Do not import public Header/Footer/SmoothScroll.

`frontend/app/admin/(panel)/layout.tsx` (server):

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminMe, AdminApiError } from '@/lib/admin-api';
import AdminShell from '@/components/admin/AdminShell';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const cookieHeader = (await cookies()).toString();
  try {
    const me = await adminMe(cookieHeader);
    return <AdminShell username={me.username}>{children}</AdminShell>;
  } catch (e) {
    if (e instanceof AdminApiError && e.status === 401) redirect('/admin/login');
    throw e;
  }
}
```

`frontend/app/admin/(panel)/page.tsx` — heading «Панель» and four links (Игры, Словари, События, Брони). Counts come in Task 12; do not invent numbers.

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npx tsc --noEmit`

Expected: exit 0. Nested `app/admin/layout.tsx` and `app/[locale]/layout.tsx` both render `<html>` — that is valid in App Router because they are disjoint route trees.

- [ ] **Step 5: Commit**

```bash
git add frontend/middleware.ts frontend/next.config.ts frontend/app/robots.ts frontend/lib/admin-api.ts frontend/app/admin frontend/components/admin
git commit -m "feat(admin): Next.js login and staff shell"
```

---

### Task 5: Dictionary backend + public runtime read

**Files:**
- Create: `backend/cms/json_i18n.py`
- Create: `backend/cms/admin_views.py`
- Modify: `backend/cms/admin.py` — import flatten/unflatten/MESSAGES_DIR/LANGUAGES from json_i18n
- Modify: `backend/staff/urls.py` — translations routes
- Modify: `backend/cms/tests.py`
- Modify: `frontend/i18n/request.ts`

**Interfaces:**
- Consumes: `frontend/messages/{ru,en}.json`
- Produces:
  - `cms.json_i18n.flatten_json`, `unflatten_json`, `read_lang(lang)`, `write_messages(keys)`, `get_messages_dir()`, `LANGUAGES`
  - `GET /api/admin/translations/` → `{ groups: [{ name, keys: [{ key, ru, en }] }] }`
  - `PUT /api/admin/translations/` body `{ keys: { "Group.key": { ru, en } } }` full snapshot; staff-only
  - `getRequestConfig` reads files from disk every request

- [ ] **Step 1: Write the failing tests**

`backend/cms/tests.py`:

```python
import json
import tempfile
from pathlib import Path
from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase
from cms.json_i18n import flatten_json, unflatten_json


class FlattenTests(APITestCase):
    def test_roundtrip(self):
        nested = {'A': {'b': 'x', 'c': 'y'}}
        flat = flatten_json(nested)
        self.assertEqual(flat, {'A.b': 'x', 'A.c': 'y'})
        self.assertEqual(unflatten_json(flat), nested)


class TranslationsApiTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username='keeper', password='secret-pass', is_staff=True
        )

    def test_anonymous_401(self):
        self.assertEqual(self.client.get('/api/admin/translations/').status_code, 401)

    def test_get_and_put_roundtrip(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            ru = {'Header': {'cta': 'Бронь'}}
            en = {'Header': {'cta': 'Book'}}
            (tmp_path / 'ru.json').write_text(json.dumps(ru), encoding='utf-8')
            (tmp_path / 'en.json').write_text(json.dumps(en), encoding='utf-8')
            with override_settings(MESSAGES_DIR=str(tmp_path)):
                # json_i18n must read settings.MESSAGES_DIR if set, else default path
                self.client.force_authenticate(self.staff)
                got = self.client.get('/api/admin/translations/')
                self.assertEqual(got.status_code, 200)
                keys = {item['key']: item for g in got.data['groups'] for item in g['keys']}
                self.assertEqual(keys['Header.cta']['ru'], 'Бронь')
                payload = {'keys': {'Header.cta': {'ru': 'Забронировать', 'en': 'Reserve'}}}
                put = self.client.put('/api/admin/translations/', payload, format='json')
                self.assertEqual(put.status_code, 200)
                written_ru = json.loads((tmp_path / 'ru.json').read_text(encoding='utf-8'))
                self.assertEqual(written_ru['Header']['cta'], 'Забронировать')
```

`json_i18n.py` must use `getattr(settings, 'MESSAGES_DIR', default)` so the test override works.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./venv/bin/python manage.py test cms.tests -v2`

Expected: FAIL (module `cms.json_i18n` missing).

- [ ] **Step 3: Implement json_i18n, views, wire URLs, switch public i18n**

`backend/cms/json_i18n.py`:

```python
import json
import os
from django.conf import settings

LANGUAGES = ['ru', 'en']

def get_messages_dir():
    return getattr(settings, 'MESSAGES_DIR', os.path.join(settings.BASE_DIR.parent, 'frontend', 'messages'))

def flatten_json(y):
    out = {}
    def flatten(x, name=''):
        if isinstance(x, dict):
            for a in x:
                flatten(x[a], name + a + '.')
        else:
            out[name[:-1]] = x
    flatten(y)
    return out

def unflatten_json(dictionary):
    result = {}
    for key, value in dictionary.items():
        parts = key.split('.')
        d = result
        for part in parts[:-1]:
            d = d.setdefault(part, {})
        d[parts[-1]] = value
    return result

def read_lang(lang):
    filepath = os.path.join(get_messages_dir(), f'{lang}.json')
    if not os.path.exists(filepath):
        return {}
    with open(filepath, encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def grouped_payload():
    flat = {lang: flatten_json(read_lang(lang)) for lang in LANGUAGES}
    all_keys = set()
    for lang in LANGUAGES:
        all_keys.update(flat[lang].keys())
    groups = {}
    for key in sorted(all_keys):
        parts = key.split('.', 1)
        name = parts[0] if len(parts) > 1 else 'Общие'
        groups.setdefault(name, []).append({
            'key': key,
            'ru': flat['ru'].get(key, ''),
            'en': flat['en'].get(key, ''),
        })
    return {'groups': [{'name': n, 'keys': items} for n, items in groups.items()]}

def write_messages(keys):
    """keys: {full.key: {ru, en}} full snapshot. Unknown extra keys ignored. Missing keys dropped."""
    new_data = {lang: {} for lang in LANGUAGES}
    for full_key, pair in keys.items():
        if not isinstance(pair, dict):
            continue
        for lang in LANGUAGES:
            new_data[lang][full_key] = pair.get(lang, '')
    directory = get_messages_dir()
    os.makedirs(directory, exist_ok=True)
    previous = {lang: read_lang(lang) for lang in LANGUAGES}
    written = []
    try:
        for lang in LANGUAGES:
            unflattened = unflatten_json(new_data[lang])
            final_path = os.path.join(directory, f'{lang}.json')
            tmp_path = final_path + '.tmp'
            with open(tmp_path, 'w', encoding='utf-8') as f:
                json.dump(unflattened, f, ensure_ascii=False, indent=2)
            os.replace(tmp_path, final_path)
            written.append(lang)
    except Exception:
        for lang in written:
            final_path = os.path.join(directory, f'{lang}.json')
            with open(final_path, 'w', encoding='utf-8') as f:
                json.dump(previous[lang], f, ensure_ascii=False, indent=2)
        raise
```

`backend/cms/admin_views.py`:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from staff.permissions import IsStaffUser
from .json_i18n import grouped_payload, write_messages

class TranslationsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        return Response(grouped_payload())

    def put(self, request):
        keys = request.data.get('keys')
        if not isinstance(keys, dict):
            return Response({'detail': 'Ожидался объект keys.'}, status=status.HTTP_400_BAD_REQUEST)
        write_messages(keys)
        return Response(grouped_payload())
```

Wire in `backend/staff/urls.py`:

```python
from cms.admin_views import TranslationsView
# ...
path('translations/', TranslationsView.as_view()),
```

Update `backend/cms/admin.py` to `from .json_i18n import flatten_json, unflatten_json, LANGUAGES, get_messages_dir` and use `get_messages_dir()` instead of local `MESSAGES_DIR`. Delete the local copies of flatten/unflatten.

`frontend/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server';
import { unstable_noStore } from 'next/cache';
import { readFile } from 'fs/promises';
import { join } from 'path';

const locales = ['en', 'ru'];
const defaultLocale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  unstable_noStore();
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale)) locale = defaultLocale;
  let messages = {};
  try {
    const raw = await readFile(join(process.cwd(), 'messages', `${locale}.json`), 'utf8');
    messages = JSON.parse(raw);
  } catch {
    messages = {};
  }
  return { locale, messages };
});
```

- [ ] **Step 4: Run tests**

Run: `cd backend && ./venv/bin/python manage.py test cms.tests -v2`

Expected: PASS. If `override_settings(MESSAGES_DIR=...)` does not affect `get_messages_dir`, fail the test run and fix `get_messages_dir` — do not skip.

- [ ] **Step 5: Commit**

```bash
git add backend/cms frontend/i18n/request.ts backend/staff/urls.py
git commit -m "feat(admin): translations API and live JSON read"
```

---

### Task 6: Dictionaries UI

**Files:**
- Create: `frontend/app/admin/(panel)/dictionaries/page.tsx`

**Interfaces:**
- Consumes: `GET/PUT /api/admin/translations/` via `adminFetch`
- Produces: grouped accordion editor, RU/EN columns, save writes full snapshot

- [ ] **Step 1: Page**

Client page `'use client'`. On mount `adminFetch('/api/admin/translations/')`. Render each group as `<details>` (open first group). Each key: label `display` after first dot, two textareas `ru` / `en`. Keep local state of all keys. Save button: `adminFetch('/api/admin/translations/', { method: 'PUT', body: JSON.stringify({ keys }) })` where `keys` is `{ [key]: { ru, en } }` for every key currently loaded (full snapshot). Success banner «Сохранено» (clears after 3s). `AdminApiError` banner with message. Textareas for values that look like JSON arrays stay plain text (FAQ leaves). Do not add/delete keys.

Extend `frontend/lib/admin-api.ts` with:

```ts
export type TranslationKey = { key: string; ru: string | number | unknown; en: string | number | unknown };
export type TranslationGroup = { name: string; keys: TranslationKey[] };
export type TranslationsResponse = { groups: TranslationGroup[] };

export function getTranslations() {
  return adminFetch<TranslationsResponse>('/api/admin/translations/');
}
export function putTranslations(keys: Record<string, { ru: unknown; en: unknown }>) {
  return adminFetch<TranslationsResponse>('/api/admin/translations/', {
    method: 'PUT',
    body: JSON.stringify({ keys }),
  });
}
```

Stringify non-string leaves with `typeof v === 'string' ? v : JSON.stringify(v, null, 2)` in the textarea; on save, if the original was non-string, `JSON.parse` the textarea (on parse error keep the string). Simpler acceptable path: coerce every leaf to `String(value)` on load and save strings only — **do this simpler path**. FAQ nested arrays currently flatten to objects-as-leaves? Flatten only stores non-dict leaves; arrays are leaves and become JSON-looking text via String(array) which is useless. Check: `flatten_json` treats arrays as leaves (`isinstance(x, dict)` is False), so the value is a list. GET JSON will serialize lists as JSON arrays. UI: if `typeof ru !== 'string'`, `JSON.stringify`. On save, if textarea starts with `[` or `{`, `JSON.parse`, else string. That preserves FAQ.

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/admin/(panel)/dictionaries/page.tsx frontend/lib/admin-api.ts
git commit -m "feat(admin): dictionaries editor"
```

---

### Task 7: Categories and tags admin API

**Files:**
- Create: `backend/boardgames/admin_serializers.py`
- Create: `backend/boardgames/admin_views.py`
- Modify: `backend/core/urls.py` or `backend/staff/urls.py` to include a DRF router for admin resources
- Modify: `backend/boardgames/tests.py`

**Interfaces:**
- Consumes: `Category`, `Tag` models, `IsStaffUser`
- Produces:
  - `/api/admin/categories/` ModelViewSet, fields `id, slug, name_ru, name_en, description_ru, description_en, icon`
  - `/api/admin/tags/` ModelViewSet, fields `id, slug, name_ru, name_en, icon`
  - slug autogen from `name_ru` if blank
  - DELETE returns 409 `{ detail }` when `games` still reference the row

- [ ] **Step 1: Write the failing tests**

Append to `backend/boardgames/tests.py` (replace the empty TestCase):

```python
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from boardgames.models import Category, Tag, BoardGame


class AdminCategoryTagTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username='keeper', password='secret-pass', is_staff=True)
        self.client.force_authenticate(self.staff)

    def test_create_category_autogen_slug(self):
        response = self.client.post(
            '/api/admin/categories/',
            {'name_ru': 'Стратегия', 'name_en': 'Strategy'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['slug'])

    def test_delete_category_in_use_409(self):
        cat = Category.objects.create(name='Пати', slug='party')
        game = BoardGame.objects.create(
            title='Codenames', slug='codenames', description='', play_time=20
        )
        game.categories.add(cat)
        response = self.client.delete(f'/api/admin/categories/{cat.id}/')
        self.assertEqual(response.status_code, 409)
        self.assertTrue(Category.objects.filter(id=cat.id).exists())

    def test_anonymous_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/admin/categories/')
        self.assertEqual(response.status_code, 401)
```

`BoardGame` requires `play_time` (no default) and `description`. Provide them.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./venv/bin/python manage.py test boardgames.tests.AdminCategoryTagTests -v2`

Expected: FAIL 404.

- [ ] **Step 3: Implement**

`admin_serializers.py` — `CategoryAdminSerializer` and `TagAdminSerializer` (`ModelSerializer`, translation fields explicit). In `create`/`validate`, if not slug: `slugify(name_ru or name)`.

`admin_views.py`:

```python
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.text import slugify
from staff.permissions import IsStaffUser
from .models import Category, Tag
from .admin_serializers import CategoryAdminSerializer, TagAdminSerializer

class CategoryAdminViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategoryAdminSerializer
    permission_classes = [IsAuthenticated, IsStaffUser]

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.games.exists():
            return Response(
                {'detail': 'Категория привязана к играм и не может быть удалена.'},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)
```

Same for `Tag` using `obj.boardgame_set.exists()` unless `related_name` is set — Tag M2M on BoardGame has default `boardgame_set`. Check model: `tags = models.ManyToManyField(Tag, blank=True)` — related name is `boardgame_set`. Use `obj.boardgame_set.exists()` and message «Тег привязан к играм и не может быть удалён.»

Register a router in `backend/staff/urls.py`:

```python
from rest_framework.routers import DefaultRouter
from boardgames.admin_views import CategoryAdminViewSet, TagAdminViewSet

router = DefaultRouter()
router.register(r'categories', CategoryAdminViewSet)
router.register(r'tags', TagAdminViewSet)

urlpatterns = [
    ...existing auth and translations...,
]
urlpatterns += router.urls
```

`DefaultRouter` on the same include (`/api/admin/`) yields `/api/admin/categories/`.

- [ ] **Step 4: Run tests**

Run: `cd backend && ./venv/bin/python manage.py test boardgames.tests.AdminCategoryTagTests -v2`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/boardgames/admin_serializers.py backend/boardgames/admin_views.py backend/boardgames/tests.py backend/staff/urls.py
git commit -m "feat(admin): category and tag API"
```

---

### Task 8: Games admin API (JSON + image endpoints)

**Files:**
- Modify: `backend/boardgames/admin_serializers.py`
- Modify: `backend/boardgames/admin_views.py`
- Modify: `backend/staff/urls.py`
- Modify: `backend/boardgames/tests.py`

**Interfaces:**
- Consumes: `BoardGame`, `Expansion`, `GameImage`, `IsStaffUser`
- Produces:
  - `GET/POST /api/admin/games/`
  - `GET/PUT/PATCH/DELETE /api/admin/games/{id}/`
  - List compact: `id, title_ru, title_en, image, is_active, is_visible_ru, is_visible_en, slug`
  - Detail includes nested expansions and gallery
  - Writable expansions nested list (omitted ids deleted)
  - `POST/DELETE /api/admin/games/{id}/image/`
  - `POST/DELETE /api/admin/games/{id}/setup-image/`
  - `GET/POST /api/admin/games/{id}/gallery/`
  - `PATCH/DELETE /api/admin/games/{id}/gallery/{image_id}/`
  - slug from `title_ru` if blank
  - search `title`, filters `is_active`, `is_visible_ru`, `is_visible_en`

- [ ] **Step 1: Write the failing tests**

Add `AdminGameTests` to `backend/boardgames/tests.py`:

```python
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from boardgames.models import BoardGame, Category, Expansion, GameImage


GIF = (
    b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff'
    b'\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c'
    b'\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
)


class AdminGameTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username='keeper', password='secret-pass', is_staff=True)
        self.client.force_authenticate(self.staff)
        self.cat = Category.objects.create(name='Стратегия', slug='strategy')

    def test_create_with_expansion_and_slug(self):
        response = self.client.post(
            '/api/admin/games/',
            {
                'title_ru': 'Кодовые имена',
                'title_en': 'Codenames',
                'description_ru': '<p>да</p>',
                'description_en': '<p>yes</p>',
                'min_players': 2,
                'max_players': 8,
                'play_time': 20,
                'difficulty': 2,
                'categories': [self.cat.id],
                'tags': [],
                'expansions': [
                    {'title_ru': 'Дуэт', 'title_en': 'Duet', 'description_ru': '', 'description_en': ''}
                ],
                'is_active': True,
                'is_visible_ru': True,
                'is_visible_en': True,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['slug'])
        game_id = response.data['id']
        self.assertEqual(Expansion.objects.filter(game_id=game_id).count(), 1)

    def test_upload_cover_and_gallery(self):
        game = BoardGame.objects.create(
            title='X', slug='x', description='', play_time=10
        )
        cover = SimpleUploadedFile('c.gif', GIF, content_type='image/gif')
        cover_res = self.client.post(
            f'/api/admin/games/{game.id}/image/',
            {'file': cover},
            format='multipart',
        )
        self.assertEqual(cover_res.status_code, 200)
        gal = SimpleUploadedFile('g.gif', GIF, content_type='image/gif')
        gal_res = self.client.post(
            f'/api/admin/games/{game.id}/gallery/',
            {'file': gal, 'image_type': 'gallery', 'order': 0, 'alt': 'стол'},
            format='multipart',
        )
        self.assertEqual(gal_res.status_code, 201)
        self.assertEqual(GameImage.objects.filter(game=game).count(), 1)

    def test_hidden_game_not_on_public_list(self):
        BoardGame.objects.create(
            title='Secret', slug='secret', description='', play_time=10,
            is_active=True, is_visible_ru=False, is_visible_en=False,
        )
        public = self.client.get('/api/games/')
        self.assertEqual(public.status_code, 200)
        # unauthenticated public list uses is_visible_ru by default
        self.client.force_authenticate(user=None)
        public = self.client.get('/api/games/')
        titles = [row['title'] for row in (public.data if isinstance(public.data, list) else public.data.get('results', public.data))]
        self.assertNotIn('Secret', titles)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./venv/bin/python manage.py test boardgames.tests.AdminGameTests -v2`

Expected: FAIL 404 on `/api/admin/games/`.

- [ ] **Step 3: Implement serializers and viewset**

`BoardGameListSerializer` — compact fields.

`ExpansionAdminSerializer` — `id`, `title_ru`, `title_en`, `description_ru`, `description_en`.

`GameImageAdminSerializer` — `id`, `image`, `image_type`, `order`, `alt`.

`BoardGameAdminSerializer` — all spec fields; `categories`/`tags` as `PrimaryKeyRelatedField(many=True)`; `expansions` nested; `images` read-only nested (`source='images'`). `create`/`update` must wrap M2M and expansions: create game without M2M, `set()` categories/tags, sync expansions (delete missing ids, update existing, create new). Autogen slug from `title_ru`.

`BoardGameAdminViewSet(ModelViewSet)`:

- `get_serializer_class`: list → list serializer, else detail
- `get_queryset`: `prefetch_related('categories', 'tags', 'expansions', 'images')`
- `filter_backends` SearchFilter + DjangoFilterBackend; `search_fields = ['title']`; `filterset_fields = ['is_active', 'is_visible_ru', 'is_visible_en']`
- `permission_classes = [IsAuthenticated, IsStaffUser]`
- pagination page size 50

Actions on the viewset (keep URLs as specified):

```python
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser

@action(detail=True, methods=['post', 'delete'], url_path='image', parser_classes=[MultiPartParser, FormParser])
def cover_image(self, request, pk=None):
    game = self.get_object()
    if request.method == 'DELETE':
        game.image.delete(save=True)
        return Response({'image': None})
    f = request.FILES.get('file')
    if not f:
        return Response({'detail': 'Файл не передан.'}, status=400)
    game.image = f
    game.save()
    return Response({'image': request.build_absolute_uri(game.image.url) if game.image else None})
```

Same pattern for `url_path='setup-image'` writing `setup_image`.

Gallery: `@action(detail=True, methods=['get', 'post'], url_path='gallery', ...)` GET lists `GameImageAdminSerializer(game.images.all(), many=True)`. POST creates `GameImage(game=..., image=file, image_type=..., order=..., alt=...)`.

Nested image item: extra action `url_path='gallery/(?P<image_id>[^/.]+)'` is awkward with `@action`. Prefer a tiny `GameImageAdminViewSet` with queryset scoped in `get_queryset` via `game_pk` from URL.

Register:

```python
router.register(r'games', BoardGameAdminViewSet)
```

And in `BoardGameAdminViewSet.get_urls` or a second router:

```python
# staff/urls.py
from django.urls import path
from boardgames.admin_views import GameGalleryItemView

urlpatterns += [
    path('games/<int:game_id>/gallery/<int:image_id>/', GameGalleryItemView.as_view()),
]
```

`GameGalleryItemView` (APIView): PATCH `image_type`, `order`, `alt`; DELETE the row. 404 if image.game_id != game_id. Permissions staff.

- [ ] **Step 4: Run tests**

Run: `cd backend && ./venv/bin/python manage.py test boardgames.tests -v2`

Expected: PASS (category + game tests). Public games list assertion must match actual list shape (unpaginated array today).

- [ ] **Step 5: Commit**

```bash
git add backend/boardgames backend/staff/urls.py
git commit -m "feat(admin): board game write API"
```

---

### Task 9: Games / categories / tags UI

**Files:**
- Create: `frontend/app/admin/(panel)/categories/page.tsx`
- Create: `frontend/app/admin/(panel)/tags/page.tsx`
- Create: `frontend/app/admin/(panel)/games/page.tsx`
- Create: `frontend/app/admin/(panel)/games/new/page.tsx`
- Create: `frontend/app/admin/(panel)/games/[id]/page.tsx`
- Create: `frontend/app/admin/(panel)/games/GameForm.tsx`
- Create: `frontend/components/admin/AdminTable.tsx`
- Modify: `frontend/lib/admin-api.ts` with game/category/tag helpers

**Interfaces:**
- Consumes: Task 7–8 endpoints
- Produces: list + form UX in Russian

- [ ] **Step 1: Shared table + taxonomy pages**

`AdminTable` — simple HTML table, columns via render props, empty state «Пусто».

Categories page: load list, form fields name_ru, name_en, submit POST; row click edits PATCH; delete button, on 409 show `detail`. Tags page identical without descriptions.

- [ ] **Step 2: Game list and form**

List: search input (query `?search=`), columns title_ru, title_en, visibility flags, link «Изменить», link «Новая игра».

`GameForm` props `{ gameId?: number }`. If `gameId`, GET detail. Fields:

- title_ru, title_en
- description_ru, description_en as textareas + `div.prose` preview via `dangerouslySetInnerHTML`
- min_players, max_players, play_time, difficulty (select 1–5: Очень легко…Хардкор)
- designer, bgg_type
- checkboxes is_active, is_visible_ru, is_visible_en
- multi-select categories and tags (from `/api/admin/categories/` and `/tags/`)
- expansions: list of mini-forms, add/remove
- After game exists (edit, or after create): cover/setup file inputs calling image endpoints; gallery list with upload, type select, order, alt, delete

Save: if new, POST `/api/admin/games/` then `router.push(`/admin/games/${id}`)` and upload pending files. If edit, PATCH then upload. Field errors from 400 body mapped next to inputs. Delete game button on edit with `confirm('Удалить игру?')`.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/admin/(panel)/games frontend/app/admin/(panel)/categories frontend/app/admin/(panel)/tags frontend/components/admin frontend/lib/admin-api.ts
git commit -m "feat(admin): games categories tags UI"
```

---

### Task 10: Events admin API + UI

**Files:**
- Create: `backend/events/admin_serializers.py`
- Create: `backend/events/admin_views.py`
- Modify: `backend/staff/urls.py`
- Modify: `backend/events/tests.py`
- Create: `frontend/app/admin/(panel)/events/page.tsx`
- Create: `frontend/app/admin/(panel)/events/new/page.tsx`
- Create: `frontend/app/admin/(panel)/events/[id]/page.tsx`
- Create: `frontend/app/admin/(panel)/events/EventForm.tsx`

**Interfaces:**
- Consumes: `Event` model (all rows, not only visible)
- Produces: `/api/admin/events/` ModelViewSet; image multipart on create/update; UI list/create/edit; `telegram_id` read-only; no auto-translate; no Telegram import button

- [ ] **Step 1: Write the failing tests**

Append `AdminEventTests` in `backend/events/tests.py`:

```python
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase
from events.models import Event

GIF = (
    b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff'
    b'\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c'
    b'\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
)

class AdminEventTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username='keeper', password='secret-pass', is_staff=True)
        self.client.force_authenticate(self.staff)

    def test_hidden_event_on_admin_not_public(self):
        image = SimpleUploadedFile('e.gif', GIF, content_type='image/gif')
        create = self.client.post(
            '/api/admin/events/',
            {
                'title': 'Закрыто',
                'description': 'текст',
                'event_date': timezone.now().isoformat(),
                'is_visible': False,
                'image': image,
            },
            format='multipart',
        )
        self.assertEqual(create.status_code, 201)
        admin_list = self.client.get('/api/admin/events/')
        titles = [row['title'] for row in admin_list.data['results']]
        self.assertIn('Закрыто', titles)
        self.client.force_authenticate(user=None)
        public = self.client.get('/api/events/')
        public_rows = public.data['results']
        self.assertFalse(any(r['title'] == 'Закрыто' for r in public_rows))

    def test_anonymous_401(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get('/api/admin/events/').status_code, 401)
```

Admin list uses DRF pagination (`page_size` 20) so `results` exists. Confirm the view sets `PageNumberPagination` with `page_size = 20`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./venv/bin/python manage.py test events.tests.AdminEventTests -v2`

Expected: FAIL 404.

- [ ] **Step 3: Implement API + UI**

Serializer fields: `id, title, description, title_en, description_en, image, event_date, is_visible, telegram_id, created_at`. `telegram_id` and `created_at` read-only. `image` required on create, not required on update.

ViewSet: queryset `Event.objects.all().order_by('-event_date')`, `permission_classes = [IsAuthenticated, IsStaffUser]`, search `title`, filter `is_visible`, pagination 20.

Parser: MultiPartParser + JSONParser so JSON PATCH of text fields still works; image replace via multipart PATCH.

Register `router.register(r'events', EventAdminViewSet)`.

UI: list with title, date, is_visible, link; form with RU/EN fields, datetime-local for `event_date`, checkbox is_visible, file input, show telegram_id as read-only if present. Default is_visible true. No translate button.

- [ ] **Step 4: Run tests + tsc**

Run: `cd backend && ./venv/bin/python manage.py test events.tests -v2`

Run: `cd frontend && npx tsc --noEmit`

Expected: PASS / exit 0.

- [ ] **Step 5: Commit**

```bash
git add backend/events frontend/app/admin/(panel)/events backend/staff/urls.py frontend/lib/admin-api.ts
git commit -m "feat(admin): events CRUD"
```

---

### Task 11: Bookings admin API + UI

**Files:**
- Create: `backend/bookings/admin_serializers.py`
- Create: `backend/bookings/admin_views.py`
- Modify: `backend/staff/urls.py`
- Modify: `backend/bookings/tests.py`
- Create: `frontend/app/admin/(panel)/bookings/page.tsx`
- Create: `frontend/app/admin/(panel)/bookings/[id]/page.tsx`

**Interfaces:**
- Consumes: `Booking` model
- Produces: admin list/retrieve/PATCH only (POST 405, DELETE 405); writable `name, contact, date, guests, event_title, status`; UI confirm/reject

- [ ] **Step 1: Write the failing tests**

Append to `backend/bookings/tests.py`:

```python
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from bookings.models import Booking


class AdminBookingTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username='keeper', password='secret-pass', is_staff=True)
        self.client.force_authenticate(self.staff)
        self.booking = Booking.objects.create(
            name='Ada', contact='+357', date='завтра', guests='2', status='pending'
        )

    def test_list_and_patch_status(self):
        listing = self.client.get('/api/admin/bookings/')
        self.assertEqual(listing.status_code, 200)
        patch = self.client.patch(
            f'/api/admin/bookings/{self.booking.id}/',
            {'status': 'confirmed', 'name': 'Ada Lovelace'},
            format='json',
        )
        self.assertEqual(patch.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertEqual(self.booking.name, 'Ada Lovelace')

    def test_create_not_allowed(self):
        response = self.client.post('/api/admin/bookings/', {'name': 'x'}, format='json')
        self.assertEqual(response.status_code, 405)

    def test_anonymous_401(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get('/api/admin/bookings/').status_code, 401)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./venv/bin/python manage.py test bookings.tests.AdminBookingTests -v2`

Expected: FAIL 404.

- [ ] **Step 3: Implement**

```python
# admin_views.py
from rest_framework import mixins, viewsets, filters
from rest_framework.permissions import IsAuthenticated
from staff.permissions import IsStaffUser
from .models import Booking
from .admin_serializers import BookingAdminSerializer

class BookingAdminViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Booking.objects.all().order_by('-created_at')
    serializer_class = BookingAdminSerializer
    permission_classes = [IsAuthenticated, IsStaffUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'contact']
    filterset_fields = ['status']
```

Need `DjangoFilterBackend` in filter_backends as well for `status`. Pagination 20.

Serializer: all fields; `created_at` read-only; `status` choices pending/confirmed/rejected.

Do **not** send Telegram on status change.

UI list: name, date, guests, status, created_at; pending rows visually marked; filter select status. Detail: inputs for writable fields, buttons «Подтвердить» / «Отклонить» PATCH status, save PATCH other fields.

- [ ] **Step 4: Run tests + tsc**

Run: `cd backend && ./venv/bin/python manage.py test bookings.tests -v2`

Run: `cd frontend && npx tsc --noEmit`

Expected: PASS / exit 0.

- [ ] **Step 5: Commit**

```bash
git add backend/bookings frontend/app/admin/(panel)/bookings backend/staff/urls.py frontend/lib/admin-api.ts
git commit -m "feat(admin): bookings queue"
```

---

### Task 12: Dashboard stats + nginx note

**Files:**
- Modify: `backend/staff/views.py` — `StatsView`
- Modify: `backend/staff/urls.py`
- Modify: `backend/staff/tests.py`
- Modify: `frontend/app/admin/(panel)/page.tsx`
- Modify: `README.md` — `/admin` vs `/django-admin`, nginx routes

**Interfaces:**
- Consumes: `BoardGame`, `Event`, `Booking`
- Produces: `GET /api/admin/stats/` `{ "games": int, "events": int, "bookings_pending": int }`

- [ ] **Step 1: Write the failing test**

```python
class StaffStatsTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username='keeper', password='secret-pass', is_staff=True)
        self.client.force_authenticate(self.staff)
        Booking.objects.create(name='A', contact='1', date='x', guests='1', status='pending')
        Booking.objects.create(name='B', contact='2', date='x', guests='1', status='confirmed')

    def test_stats(self):
        response = self.client.get('/api/admin/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['bookings_pending'], 1)
        self.assertIn('games', response.data)
        self.assertIn('events', response.data)
```

Import `Booking` in `staff/tests.py`.

- [ ] **Step 2: Run to verify fail**

Run: `cd backend && ./venv/bin/python manage.py test staff.tests.StaffStatsTests -v2`

Expected: FAIL 404.

- [ ] **Step 3: Implement stats + dashboard cards**

```python
class StatsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        from boardgames.models import BoardGame
        from events.models import Event
        from bookings.models import Booking
        return Response({
            'games': BoardGame.objects.count(),
            'events': Event.objects.count(),
            'bookings_pending': Booking.objects.filter(status='pending').count(),
        })
```

Dashboard: four cards (Игры → `/admin/games` with count, События → `/admin/events`, Брони (ожидают) → `/admin/bookings`, Словари → `/admin/dictionaries` without count). Style like Jazzmin dashboard cards (border, accent icon-less title).

README: document that staff UI is `https://daerdree.bar/admin`, Jazzmin is `/django-admin/`, and production nginx must send `/admin/` to Next, `/django-admin/` and `/api/` to Django. Do not invent an nginx file that is not in the repo.

- [ ] **Step 4: Run tests**

Run: `cd backend && ./venv/bin/python manage.py test staff.tests boardgames.tests events.tests bookings.tests cms.tests -v2`

Run: `cd frontend && npx tsc --noEmit`

Expected: all PASS, tsc exit 0.

- [ ] **Step 5: Commit**

```bash
git add backend/staff frontend/app/admin/(panel)/page.tsx README.md
git commit -m "feat(admin): dashboard stats"
```

---

## Self-review (plan vs spec)

| Spec item | Task |
|-----------|------|
| `/admin` in existing Next app, no locale prefix | 4 |
| Django Admin `/django-admin/` | 1 |
| Staff session login, csrf, me, logout | 2, 4 |
| Public events read-only | 3 |
| Public bookings create-only | 3 |
| Games CRUD, expansions, images, RU/EN, visibility, no BGG | 8, 9 |
| Categories/tags + 409 if in use | 7, 9 |
| Dictionaries JSON source of truth, live on site | 5, 6 |
| Events full CRUD, no inbox, no auto-translate | 10 |
| Bookings list/edit/status, no create/delete, no extra Telegram | 11 |
| Dashboard counts | 12 |
| robots `/django-admin/` | 4 |
| Dev rewrites | 4 |
| Cookie flags follow DEBUG | 1 |
| Nginx note | 12 |
| Out of scope not scheduled | — |
