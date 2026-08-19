# Task: Admin overhaul + calendar + filters + dictionaries + header hide

## Утверждённый план (уточнено)
1. Календарь: заменить только в букинге (сайт Booking) + в админке (EventForm, bookings/[id]).
2. Словари: только человекочитаемые подписи (map на фронте), бэкенд НЕ трогать.
3. Фильтрация: бэкенд-фильтры УЖЕ есть (games: search+is_active/is_visible_ru/is_visible_en; events: search+is_visible; bookings: search+status). Менять backend не нужно — только фронт.
4. Возврат к состоянию списка игр через URL-query (search+фильтры).
5. Header (сайт): прятать при скролле вниз, показывать при скролле вверх.

## Что уже сделано (файлы + суть)

### Phase 0 — исследования
- backend фильтры подтверждены: boardgames/admin_views.py (BoardGameAdminViewSet: SearchFilter+DjangoFilterBackend, filterset is_active/is_visible_ru/is_visible_en, search 'title'); events/admin_views.py (search 'title', filterset is_visible); bookings/admin_views.py (search name/contact, filterset status).
- Словари: backend/cms/json_i18n.py grouped_payload → groups[{name, keys[{key,ru,en}]}], full key вида "Booking.form.dateLabel"; фронт page.tsx показывает displayKey (последний сегмент). Бэкенд подписей не отдаёт — делаем локальную map.
- календарь frontend/components/ui/calendar.tsx нигде не использовался; стили были на shadcn-токенах (светлые).

### Phase 1 — Календарь (ГОТОВО)
- frontend/components/ui/calendar.tsx:
  - Добавлены localMonths/localShortMonths/localWeekDays(locale) через Intl; внутри Calendar const months/shortMonths/weekDays из пропа locale.
  - Тёмные стили: контейнер rounded-[10px] border-white/[0.08] bg-[hsl(56,100%,3%)]; навигация text-white/60 hover:bg-white/[0.06]; popover месяц/год bg-[hsl(60,4%,9%)] border-white/[0.1]; selected bg-[hsl(187,83%,26%)]; today bg-white/[0.06] text-[hsl(187,83%,26%)]; weekdays text-white/40; день active:scale-[0.96] transition-transform; disabled text-white/30.
- NEW frontend/components/ui/date-time-field.tsx: DateTimeField (value "YYYY-MM-DDTHH:MM", onChange, disabled, locale, кнопка-поле + Calendar popover + input type=time), toDatePart/toTimePart/formatDisplay.
- EventForm.tsx: import DateTimeField; заменили input datetime-local на <DateTimeField>.
- Booking.tsx (сайт): заменили datetime-local на DateTimeField; скрытый input name="date" value={dateValue||defaultDate}; импорт useLocale+useTranslations из одного модуля.
- bookings/[id]/page.tsx: заменили текстовый input «Дата» на DateTimeField (ru-RU).

### Phase 3 — Возврат к списку (ГОТОВО для games + events/bookings)
- games/page.tsx: search в URL (?search=), useRouter+useSearchParams, debounce 300ms + router.replace.
- GameForm.tsx: onDelete → router.push(`/admin/games${window.location.search}`).
- events/page.tsx: search+is_visible в URL.
- bookings/page.tsx: search+status в URL, поиск по имени/контакту (bэкенд search), статус через updateStatus.

### Phase 4 — Фильтры (ГОТОВО)
- games/page.tsx: селекты Активна(yes/no)+RU+EN, updateFilter(key,value) меняет URL и state, listGames с query-строкой (params.toString() ? `/api/admin/games/?${params}` : undefined). loadMore использует next (содержит фильтры).
- events/page.tsx: селект Видимость + URL sync + listEvents с query.
- bookings/page.tsx: селект Статус (уже был) + URL sync + поиск.

## Осталось сделать
- Phase 5: dictionaries/page.tsx — человекочитаемые подписи. Сделать map: key→подпись (например "GamesLibrary.title"→"Заголовок библиотеки", "Booking.form.dateLabel"→"Подпись поля «Дата и время»" и т.д.), колонка «Ключ» показывает подпись жирно + ключ мелко text-white/45; либо если подписи нет — показывать ключ. Локальный словарь на русском. (dirty-маркер/подсветку en можно пропустить — user просил только подписи.)
- Phase 6: Header.tsx — скрытие/показ при скролле: useState hidden + useEffect scroll listener (lastY > currentY+4 → hidden; up → show), класс на <header> transition-transform -translate-y-full; НЕ прятать когда mobile nav открыт (isOpen). Также не трогать sticky.
- Phase 7: admin visual polish (можно урезать до малого: активный nav-бейдж в AdminShell; hover строк AdminTable уже есть). Ponytail: сделать чуть-чуть.
- Phase 8: cd frontend && npm run build + проверить lint.

## Важные замечания/риски
- listGames/listEvents/listBookings сигнатуры: (search='', url?) — url переопределяет путь полностью; передаём урл вида `/api/admin/games/?search=...` — ок, adminNextPath парсит next.
- В loadMore для games всё ещё search передаётся, но next уже содержит фильтры — ок.
- В games/page.tsx useEffect с query: router.replace на /admin/games с пустым search убирает query — router.replace(`, { scroll:false })` — ок.
- date-time-field.tsx: onSelect явно cast `as (date: Date | undefined) => void` из-за union-типа Calendar.onSelect.
- Не добавлять новых зависимостей.
- global .clinerules: минимальные изменения, никаких рефакторингов вне задачи.

## Команды проверки
- cd frontend && npm run build
- (опционально) npm run lint