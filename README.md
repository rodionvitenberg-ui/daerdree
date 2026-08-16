# Daerdree — Bar & Board Games

Сайт бара **Daerdree** в Ларнаке (Кипр): атмосферный одностраничник с афишей событий, каталогом настольных игр, меню и онлайн-бронью столиков.

## ✨ Возможности

- **Главная** — иммерсивный hero с видео, галерея «вайба» бара, catering-история
- **События** — публичная афиша и закрытые мероприятия с деталями
- **Настольные игры** — каталог с категориями, механиками/тегами, дополнениями и данными BGG
- **Меню** — интерактивное меню бара
- **Бронирование** — форма онлайн-заявки на бронь столика
- **FAQ** — ответы на частые вопросы
- **Двуязычность** — полная поддержка RU / EN через next-intl (frontend) и django-modeltranslation (backend)
- **Админка** — кастомная Django Jazzmin-панель в фирменном стиле Daerdree

## 🏗 Архитектура

Monorepo с двумя окружениями:

| Папка       | Стек                                                        |
|-------------|-------------------------------------------------------------|
| `frontend/` | Next.js 16 (App Router), TypeScript, Tailwind CSS 4, next-intl, GSAP, Lenis |
| `backend/`  | Django 6, Django REST Framework, PostgreSQL, Jazzmin, CKEditor, modeltranslation |

### Backend (Django apps)

| App           | Назначение                                                   |
|---------------|--------------------------------------------------------------|
| `boardgames`  | Каталог настольных игр: категории, теги/механики, дополнения, данные BGG |
| `menu`        | Категории и позиции меню                                     |
| `events`      | Публичные ивенты и закрытые мероприятия (импорт из Telegram) |
| `bookings`    | Заявки на бронирование столиков                              |
| `cms`         | Управление глобальными строками сайта (Site Translation)     |

## 🚀 Быстрый старт

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # заполнить SECRET_KEY, БД и т.д.
python manage.py migrate --noinput
python manage.py createsuperuser --noinput
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Сайт будет доступен на `http://localhost:3000`, API — на `http://localhost:8000`.

## 🛠 Полезные команды

```bash
# Импорт истории событий из Telegram-канала
cd backend && source venv/bin/activate && python manage.py import_history
```

## 🌐 Продакшн

- **Сайт:** [daerdree.bar](https://daerdree.bar)
- **Instagram:** [@daerdree](https://instagram.com/daerdree)
- **Telegram:** [@daerdreedm](https://t.me/daerdreedm)

---

Powered by [IkSoft](https://iksoft.dev), 2026.