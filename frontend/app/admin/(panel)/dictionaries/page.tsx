"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AdminApiError,
  getTranslations,
  putTranslations,
  type TranslationGroup,
} from "@/lib/admin-api";

type EditorKey = { key: string; ru: string; en: string };
type EditorGroup = { name: string; keys: EditorKey[] };

function leafToText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

// FAQ leaves are arrays/objects; parse JSON if the textarea looks like a collection.
function textToLeaf(text: string): unknown {
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

function displayKey(key: string): string {
  const dot = key.indexOf(".");
  return dot === -1 ? key : key.slice(dot + 1);
}

// Человекочитаемые подписи для ключей переводов. Без совпадения показываем технический ключ.
const KEY_LABELS: Record<string, string> = {
  "GamesLibrary.title": "Заголовок библиотеки",
  "GamesLibrary.searchPlaceholder": "Подсказка поля поиска",
  "GamesLibrary.hideFilters": "Кнопка «Спрятать фильтры»",
  "GamesLibrary.showFilters": "Кнопка «Фильтры»",
  "GamesLibrary.resetFilters": "Кнопка «Сбросить фильтры»",
  "GamesLibrary.players": "Подпись «Игроки»",
  "GamesLibrary.anyPlayers": "Опция «Любое» (игроки)",
  "GamesLibrary.maxTime": "Подпись «Макс. время»",
  "GamesLibrary.anyTime": "Опция «Любое время»",
  "GamesLibrary.upTo30m": "Опция «До 30 мин»",
  "GamesLibrary.upTo1h": "Опция «До 1 часа»",
  "GamesLibrary.upTo15h": "Опция «До 1.5 часов»",
  "GamesLibrary.upTo2h": "Опция «До 2 часов»",
  "GamesLibrary.longTime": "Опция «Долго (3ч+)»",
  "GamesLibrary.difficulty": "Подпись «Сложность»",
  "GamesLibrary.anyDifficulty": "Опция «Любая» (сложность)",
  "GamesLibrary.diffVeryEasy": "Сложность «Очень легко»",
  "GamesLibrary.diffEasy": "Сложность «Легко»",
  "GamesLibrary.diffMedium": "Сложность «Средне»",
  "GamesLibrary.diffHard": "Сложность «Сложно»",
  "GamesLibrary.diffHardcore": "Сложность «Хардкор»",
  "GamesLibrary.category": "Подпись «Категория»",
  "GamesLibrary.allCategories": "Опция «Все категории»",
  "GamesLibrary.loading": "Текст загрузки",
  "GamesLibrary.noGamesTitle": "Заголовок «Игры не найдены»",
  "GamesLibrary.noGamesDesc": "Описание «Игры не найдены»",
  "GamesLibrary.clearFilters": "Кнопка «Очистить фильтры»",
  "GamesLibrary.contentLanguageLabel": "Подпись языка контента",
  "GamesLibrary.langRu": "Язык «Русский»",
  "GamesLibrary.langEn": "Язык «English»",
  "GameCard.diffEasy": "Сложность карточки «Легко»",
  "GameCard.diffLight": "Сложность карточки «Просто»",
  "GameCard.diffMedium": "Сложность карточки «Средне»",
  "GameCard.diffHard": "Сложность карточки «Сложно»",
  "GameCard.diffExpert": "Сложность карточки «Эксперт»",
  "GameCard.playersRange": "Диапазон игроков",
  "GameCard.minutes": "Длительность в минутах",
  "GameDetails.players": "Подпись «Игроки»",
  "GameDetails.playersRange": "Диапазон игроков",
  "GameDetails.playTime": "Подпись «Время игры»",
  "GameDetails.minutes": "Длительность в минутах",
  "GameDetails.difficulty": "Подпись «Сложность»",
  "GameDetails.bookButton": "Кнопка «Оформить бронь»",
  "GameDetails.description": "Подпись «Описание»",
  "GameDetails.categories": "Подпись «Категории»",
  "GameDetails.mechanics": "Подпись «Механики»",
  "GameDetails.expansions": "Подпись «Дополнения»",
  "GameDetails.noDescription": "Заглушка «Нет описания»",
  "Booking.title": "Заголовок брони",
  "Booking.subtitle": "Подзаголовок брони",
  "Booking.error": "Сообщение об ошибке",
  "Booking.eventSelected": "Подпись «Выбранное событие»",
  "Booking.form.nameLabel": "Подпись поля «Имя»",
  "Booking.form.namePlaceholder": "Подсказка поля «Имя»",
  "Booking.form.guestsLabel": "Подпись поля «Гости»",
  "Booking.form.guestsPlaceholder": "Подсказка поля «Гости»",
  "Booking.form.dateLabel": "Подпись поля «Дата и время»",
  "Booking.form.contactLabel": "Подпись поля «Контакты»",
  "Booking.form.contactPlaceholder": "Подсказка поля «Контакты»",
  "Booking.form.submit": "Кнопка «Забронировать»",
  "Booking.form.sending": "Кнопка «Отправка…»",
  "Booking.socialsDivider": "Разделитель соцсетей",
  "EventPage.metadataNotFound": "Заголовок «Событие не найдено»",
  "EventPage.metadataTitleSuffix": "Суффикс заголовка страницы",
  "EventPage.backToHub": "Ссылка «Вернуться к хабу»",
  "EventPage.noImage": "Заглушка «Нет изображения»",
  "EventPage.detailsTitle": "Подзаголовок «Детали события»",
  "EventPage.dateLabel": "Подпись «Дата»",
  "EventPage.timeLabel": "Подпись «Время»",
  "EventPage.locationLabel": "Подпись «Локация»",
  "EventPage.locationValue": "Название локации",
  "EventPage.bookButton": "Кнопка «Забронировать стол»",
  "EventPage.reservationDisclaimer": "Примечание о бронировании",
  "EventsHub.publicSub": "Подзаголовок публичных событий",
  "EventsHub.publicTitle1": "Заголовок публичных (часть 1)",
  "EventsHub.publicTitle2": "Заголовок публичных (часть 2)",
  "EventsHub.publicDesc": "Описание публичных",
  "EventsHub.publicBtn": "Кнопка «Найти игру»",
  "EventsHub.privateSub": "Подзаголовок частных",
  "EventsHub.privateTitle1": "Заголовок частных (часть 1)",
  "EventsHub.privateTitle2": "Заголовок частных (часть 2)",
  "EventsHub.privateDesc": "Описание частных",
  "EventsHub.privateBtn": "Кнопка «Узнать детали»",
  "PublicEvents.back": "Кнопка «Вернуться назад»",
  "PublicEvents.showAll": "Кнопка «Показать всё»",
  "PublicEvents.chooseDate": "Подсказка «Выбери дату»",
  "PublicEvents.title": "Заголовок страницы",
  "PublicEvents.subtitle": "Подзаголовок страницы",
  "PublicEvents.emptyTitle": "Заголовок «Нет событий»",
  "PublicEvents.emptyDesc": "Описание «Нет событий»",
  "PublicEvents.noImage": "Заглушка «Нет изображения»",
  "PublicEvents.tagEvent": "Бейдж «Событие»",
  "PublicEvents.details": "Ссылка «Подробнее»",
  "PublicEvents.loading": "Текст загрузки",
  "PublicEvents.loadMore": "Кнопка «Показать больше»",
  "Header.nav.menu": "Пункт меню «Меню напитков»",
  "Header.nav.games": "Пункт меню «Настольные игры»",
  "Header.nav.events": "Пункт меню «Ивенты»",
  "Header.nav.booking": "Пункт меню «Бронирование»",
  "Header.nav.faq": "Пункт меню «F.A.Q.»",
  "Hero.title": "Заголовок главного экрана",
  "Hero.subtitle": "Подзаголовок главного экрана",
  "Hero.buttonText": "Кнопка главного экрана",
  "MenuPage.title": "Заголовок меню",
  "MenuPage.subtitle": "Подзаголовок меню",
  "MenuPage.navLabel": "Подпись разделов меню",
  "MenuPage.coffeeTitle": "Заголовок «Кофе»",
  "MenuPage.coffeeDesc": "Описание «Кофе»",
  "MenuPage.teaTitle": "Заголовок «Чай»",
  "MenuPage.teaDesc": "Описание «Чай»",
  "MenuPage.cocktailsTitle": "Заголовок «Коктейли»",
  "MenuPage.cocktailsDesc": "Описание «Коктейли»",
  "MenuPage.beerTitle": "Заголовок «Пиво»",
  "MenuPage.beerDesc": "Описание «Пиво»",
  "MenuPage.zeroBeerTitle": "Заголовок «Безалкогольное пиво»",
  "MenuPage.zeroBeerDesc": "Описание «Безалкогольное пиво»",
  "MenuPage.wineTitle": "Заголовок «Вино»",
  "MenuPage.wineDesc": "Описание «Вино»",
  "MenuPage.wineNote": "Примечание о ценах",
  "MenuPage.shotsTitle": "Заголовок «Крепкие напитки»",
  "MenuPage.shotsDesc": "Описание «Крепкие напитки»",
  "Footer.altLogo": "Alt логотипа",
  "Footer.backToTop": "Кнопка «Наверх»",
  "LocationSection.title": "Заголовок «Ищи нас на карте»",
  "LocationSection.subtitle": "Подзаголовок локации",
  "LocationSection.locationTitle": "Заголовок «Местоположение»",
  "LocationSection.street": "Улица локации",
  "LocationSection.city": "Город локации",
  "LocationSection.findOnMap": "Кнопка «Найти нас на карте»",
  "LocationSection.contactsTitle": "Заголовок «Контакты»",
  "CateringStory.title": "Заголовок кейтеринга",
  "CateringStory.subtitle": "Подзаголовок кейтеринга",
  "CateringStory.buttonText": "Кнопка кейтеринга",
  "GamesMarquee.title": "Заголовок ленты игр",
  "GamesMarquee.subtitle": "Подзаголовок ленты игр",
  "GamesMarquee.buttonText": "Кнопка ленты игр",
  "GamesMarquee.noImage": "Заглушка «Нет изображения»",
  "MenuTeaser.title": "Заголовок тизера меню",
  "MenuTeaser.highlightWord": "Выделенное слово тизера",
  "MenuTeaser.description": "Описание тизера",
  "MenuTeaser.buttonText": "Кнопка тизера",
  "MenuTeaser.altBackground": "Alt фона тизера",
  "MenuTeaser.altDragon": "Alt дракона",
  "PrivateEvents.back": "Кнопка «Вернуться назад»",
};

function labelForKey(key: string): string {
  return KEY_LABELS[key] || displayKey(key);
}

function toEditor(groups: TranslationGroup[]): EditorGroup[] {
  return groups.map((group) => ({
    name: group.name,
    keys: group.keys.map((item) => ({
      key: item.key,
      ru: leafToText(item.ru),
      en: leafToText(item.en),
    })),
  }));
}

function snapshot(groups: EditorGroup[]): Record<string, { ru: unknown; en: unknown }> {
  const keys: Record<string, { ru: unknown; en: unknown }> = {};
  for (const group of groups) {
    for (const item of group.keys) {
      keys[item.key] = { ru: textToLeaf(item.ru), en: textToLeaf(item.en) };
    }
  }
  return keys;
}

function textareaRows(value: string): number {
  return Math.min(20, Math.max(2, value.split("\n").length));
}

function GroupSection({
  group,
  defaultOpen,
  saving,
  onPatch,
}: {
  group: EditorGroup;
  defaultOpen: boolean;
  saving: boolean;
  onPatch: (fullKey: string, lang: "ru" | "en", value: string) => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useLayoutEffect(() => {
    if (defaultOpen && ref.current) ref.current.open = true;
  }, [defaultOpen]);
  return (
    <details
      ref={ref}
      className="mb-3 overflow-hidden rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)]"
    >
      <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-semibold">
        {group.name}
      </summary>
      <div className="border-t border-white/[0.08]">
        <div className="hidden grid-cols-[minmax(7rem,18%)_1fr_1fr] gap-3 px-4 py-2.5 md:grid">
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
            Ключ
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
            Русский (ru)
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
            Английский (en)
          </span>
        </div>
        {group.keys.map((item) => {
          const label = labelForKey(item.key);
          return (
            <div
              key={item.key}
              className="grid grid-cols-1 gap-3 border-t border-white/[0.04] px-4 py-3 md:grid-cols-[minmax(7rem,18%)_1fr_1fr]"
            >
              <div className="min-w-0 pt-1">
                <p className="text-xs font-medium text-white/80">{label}</p>
                {KEY_LABELS[item.key] ? (
                  <p className="mt-0.5 break-all text-[11px] text-white/35">{item.key}</p>
                ) : null}
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40 md:sr-only">
                  Русский (ru)
                </span>
                <textarea
                  aria-label={`${label} ru`}
                  value={item.ru}
                  rows={textareaRows(item.ru)}
                  disabled={saving}
                  onChange={(event) => onPatch(item.key, "ru", event.target.value)}
                  className="w-full resize-y rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40 md:sr-only">
                  Английский (en)
                </span>
                <textarea
                  aria-label={`${label} en`}
                  value={item.en}
                  rows={textareaRows(item.en)}
                  disabled={saving}
                  onChange={(event) => onPatch(item.key, "en", event.target.value)}
                  className="w-full resize-y rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50"
                />
              </label>
            </div>
          );
        })}
      </div>
    </details>
  );
}

export default function DictionariesPage() {
  const [groups, setGroups] = useState<EditorGroup[] | null>(null);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTranslations()
      .then((data) => {
        if (!cancelled) {
          setGroups(toEditor(data.groups));
          setError("");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof AdminApiError ? err.message : "Не удалось загрузить.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (savedAt === null) return;
    const id = window.setTimeout(() => setSavedAt(null), 3000);
    return () => window.clearTimeout(id);
  }, [savedAt]);

  function patchKey(fullKey: string, lang: "ru" | "en", value: string) {
    setGroups((current) => {
      if (!current) return current;
      return current.map((group) => ({
        ...group,
        keys: group.keys.map((item) =>
          item.key === fullKey ? { ...item, [lang]: value } : item,
        ),
      }));
    });
  }

  async function onSave() {
    if (!groups) return;
    setError("");
    setSaving(true);
    try {
      await putTranslations(snapshot(groups));
      setSavedAt(Date.now());
    } catch (err) {
      setSavedAt(null);
      setError(err instanceof AdminApiError ? err.message : "Не удалось сохранить.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-[26px] font-medium">Словари</h1>
        <button
          type="button"
          onClick={onSave}
          disabled={!groups || saving}
          className="rounded-md bg-[hsl(187,83%,26%)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(187,65%,32%)] disabled:opacity-60"
        >
          Сохранить
        </button>
      </div>

      {savedAt !== null ? (
        <p className="mb-4 rounded-[10px] border border-[hsl(187,83%,26%)]/40 bg-[hsl(187,83%,26%)]/10 px-4 py-2.5 text-sm">
          Сохранено
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-[10px] border border-[hsl(357,100%,55%)]/30 px-4 py-2.5 text-sm text-[hsl(357,100%,55%)]" role="alert">
          {error}
        </p>
      ) : null}

      {groups === null && !error ? (
        <p className="text-sm text-white/45">Загрузка…</p>
      ) : null}

      {groups && groups.length === 0 ? (
        <p className="rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)] px-5 py-8 text-center text-sm text-white/45">
          Нет ключей.
        </p>
      ) : null}

      {groups?.map((group, index) => (
        <GroupSection
          key={group.name}
          group={group}
          defaultOpen={index === 0}
          saving={saving}
          onPatch={patchKey}
        />
      ))}
    </div>
  );
}
