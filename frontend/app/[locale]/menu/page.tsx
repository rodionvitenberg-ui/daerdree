"use client";

import { useTranslations } from "next-intl";
import AnimatedContent from "@/components/AnimatedContent";
import {
  MENU_SECTIONS,
  COFFEE_CATEGORIES,
  TEA_CATEGORIES,
  type MenuSection,
  type MenuItem,
} from "@/content/menu";

function Price({ value, accent = false }: { value: string; accent?: boolean }) {
  return (
    <span
      className={`shrink-0 font-serif font-bold tabular-nums text-sm md:text-base ${
        accent ? "text-accent" : "text-foreground"
      }`}
    >
      {value}
    </span>
  );
}

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
      {children}
    </span>
  );
}

function PriceRow({ name, sub, price, meta }: { name: string; sub?: string; price: string; meta?: React.ReactNode }) {
  return (
    <li className="group flex flex-col gap-1 py-3">
      <div className="flex items-baseline gap-3">
        <span className="min-w-0 font-serif text-base font-semibold text-foreground md:text-lg">{name}</span>
        <span
          aria-hidden
          className="mx-1 flex-1 border-b border-dotted border-foreground/15 transition-colors duration-300 group-hover:border-accent/50"
        />
        {meta && <MetaBadge>{meta}</MetaBadge>}
        <Price value={price} />
      </div>
      {sub && <p className="font-sans text-sm text-foreground/55">{sub}</p>}
    </li>
  );
}

function BeerRow({ item }: { item: MenuItem }) {
  return (
    <li className="group flex items-baseline gap-3 py-3">
      <span className="min-w-0 font-serif text-base font-semibold text-foreground md:text-lg">{item.name}</span>
      <span
        aria-hidden
        className="mx-1 flex-1 border-b border-dotted border-foreground/15 transition-colors duration-300 group-hover:border-accent/50"
      />
      <span className="font-sans text-xs text-foreground/50 md:hidden">
        {item.size}
        {item.abv ? ` · ${item.abv}` : ""}
      </span>
      <span className="hidden font-sans text-xs font-semibold uppercase tracking-wide text-foreground/50 md:inline">
        {item.size} · {item.abv}
      </span>
      <Price value={item.price!} />
    </li>
  );
}

function WineRow({ name, glass, bottle }: { name: string; glass: string; bottle: string }) {
  return (
    <li className="group flex flex-col gap-1 py-3">
      <div className="flex items-baseline gap-3">
        <span className="min-w-0 font-serif text-base font-semibold text-foreground md:text-lg">{name}</span>
        <span
          aria-hidden
          className="mx-1 flex-1 border-b border-dotted border-foreground/15 transition-colors duration-300 group-hover:border-accent/50"
        />
        <div className="flex shrink-0 items-baseline gap-2">
          <span className="hidden font-sans text-[11px] font-semibold uppercase tracking-wide text-foreground/40 sm:inline">0.2 l</span>
          <Price value={glass} />
          <span className="hidden text-foreground/25 sm:inline">/</span>
          <span className="hidden font-sans text-[11px] font-semibold uppercase tracking-wide text-foreground/40 sm:inline">0.75 l</span>
          <Price value={bottle} accent />
        </div>
      </div>
    </li>
  );
}

function CoffeeTeaSection({ section }: { section: MenuSection }) {
  const categories = section.id === "coffee" ? COFFEE_CATEGORIES : TEA_CATEGORIES;

  return (
    <div>
      {section.note && (
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-1.5 font-sans text-sm text-foreground/70">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          {section.note}
        </p>
      )}
      <div className="grid gap-x-14 gap-y-8 md:grid-cols-2">
        {categories.map((cat) => {
          const items = section.items.filter((i) => i.category === cat.key);
          if (items.length === 0) return null;
          return (
            <div key={cat.key}>
              <h3 className="mb-1 font-sans text-xs font-bold uppercase tracking-[0.25em] text-accent">{cat.label}</h3>
              <ul className="divide-y divide-foreground/5">
                {items.map((item) => (
                  <PriceRow key={item.name} name={item.name} price={item.price!} meta={<>{item.size}</>} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimpleSection({ section }: { section: MenuSection }) {
  return (
    <ul className="divide-y divide-foreground/5">
      {section.items.map((item, i) => (
        <PriceRow key={`${item.name}-${i}`} name={item.name} sub={item.ingredients} price={item.price!} />
      ))}
    </ul>
  );
}

function MenuBlock({
  section,
  title,
  desc,
  children,
}: {
  section: MenuSection;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={section.id}
      className="scroll-mt-[calc(var(--header-height)+var(--safe-top)+4rem)]"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          {section.eyebrow && (
            <p className="mb-1 font-sans text-xs font-bold uppercase tracking-[0.3em] text-accent">{section.eyebrow}</p>
          )}
          <h2
            id={`${section.id}-heading`}
            className="font-serif text-3xl font-bold uppercase tracking-widest text-foreground md:text-4xl"
          >
            {title}
          </h2>
        </div>
        <span aria-hidden className="hidden h-px flex-1 bg-gradient-to-r from-foreground/10 to-transparent sm:block" />
      </div>
      <p className="mb-8 font-sans text-sm text-foreground/45 md:text-base">{desc}</p>
      {children}
    </section>
  );
}

const NAV_LABELS: Record<string, string> = {
  coffee: "Coffee",
  tea: "Tea",
  cocktails: "Cocktails",
  beer: "Beer",
  wine: "Wine",
  shots: "Shots",
};

export default function MenuPage() {
  const t = useTranslations("MenuPage");

  return (
    <div className="min-h-dvh bg-background pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="container mx-auto px-4 md:px-8">
        <AnimatedContent distance={20} direction="vertical">
          <div className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
            <p className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.4em] text-foreground/45">
              Daerdree Bar & Timeclub
            </p>
            <h1 className="font-serif text-4xl font-black uppercase tracking-widest text-accent md:text-6xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl font-sans text-base text-foreground/55 md:text-lg">
              {t("subtitle")}
            </p>
          </div>
        </AnimatedContent>

        <nav
          aria-label={t("navLabel")}
          className="sticky top-[calc(var(--header-height)+var(--safe-top))] z-30 -mx-4 mb-14 border-y border-foreground/5 bg-background/85 px-4 py-3 backdrop-blur-xl md:mx-0 md:rounded-full md:border md:px-2"
        >
          <ul className="flex justify-start gap-1 overflow-x-auto scrollbar-hide md:justify-center">
            {MENU_SECTIONS.map((section) => (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  className="flex min-h-10 items-center rounded-full px-4 font-sans text-xs font-bold uppercase tracking-widest text-foreground/55 transition-colors duration-300 hover:bg-accent/10 hover:text-accent md:text-sm"
                >
                  {NAV_LABELS[section.id]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-auto flex max-w-4xl flex-col gap-20 md:gap-28">
          <MenuBlock section={MENU_SECTIONS[0]} title={t("coffeeTitle")} desc={t("coffeeDesc")}>
            <CoffeeTeaSection section={MENU_SECTIONS[0]} />
          </MenuBlock>

          <MenuBlock section={MENU_SECTIONS[1]} title={t("teaTitle")} desc={t("teaDesc")}>
            <CoffeeTeaSection section={MENU_SECTIONS[1]} />
          </MenuBlock>

          <MenuBlock section={MENU_SECTIONS[2]} title={t("cocktailsTitle")} desc={t("cocktailsDesc")}>
            <div className="grid gap-x-14 gap-y-2 md:grid-cols-2">
              <SimpleSection
                section={{
                  id: MENU_SECTIONS[2].id,
                  items: MENU_SECTIONS[2].items.slice(0, Math.ceil(MENU_SECTIONS[2].items.length / 2)),
                }}
              />
              <SimpleSection
                section={{
                  id: MENU_SECTIONS[2].id,
                  items: MENU_SECTIONS[2].items.slice(Math.ceil(MENU_SECTIONS[2].items.length / 2)),
                }}
              />
            </div>
          </MenuBlock>

          <MenuBlock section={MENU_SECTIONS[3]} title={t("beerTitle")} desc={t("beerDesc")}>
            <ul className="divide-y divide-foreground/5">
              {MENU_SECTIONS[3].items.map((item) => (
                <BeerRow key={item.name} item={item} />
              ))}
            </ul>
          </MenuBlock>

          <MenuBlock section={MENU_SECTIONS[4]} title={t("wineTitle")} desc={t("wineDesc")}>
            <ul className="divide-y divide-foreground/5">
              {MENU_SECTIONS[4].items.map((item) => (
                <WineRow key={item.name} name={item.name} glass={item.priceGlass!} bottle={item.priceBottle!} />
              ))}
            </ul>
            <p className="mt-6 flex items-center gap-2 font-sans text-xs text-foreground/40">
              <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
              {t("wineNote")}
            </p>
          </MenuBlock>

          <MenuBlock section={MENU_SECTIONS[5]} title={t("shotsTitle")} desc={t("shotsDesc")}>
            <div className="grid gap-x-14 md:grid-cols-2">
              <SimpleSection section={{ id: MENU_SECTIONS[5].id, items: MENU_SECTIONS[5].items }} />
            </div>
          </MenuBlock>
        </div>
      </div>
    </div>
  );
}
