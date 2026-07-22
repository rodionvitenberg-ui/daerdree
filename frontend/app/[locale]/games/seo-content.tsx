"use client";

import { useLocale } from "next-intl";

export default function GamesSeoContent() {
  const locale = useLocale();
  const isRu = locale === "ru";

  return (
    <section className="mt-20 mb-10 max-w-4xl mx-auto px-4">
      <div className="border-t border-white/10 pt-10">
        <h2 className="font-serif text-2xl md:text-3xl font-bold uppercase tracking-widest text-accent mb-6 text-center">
          {isRu ? "Часто задаваемые вопросы о настольных играх" : "Frequently Asked Questions about Board Games"}
        </h2>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-2">
              {isRu ? "Какие настольные игры есть в Daerdree?" : "What board games does Daerdree have?"}
            </h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {isRu
                ? "У нас более 50 настольных игр: от классических (Монополия, Уно, Шахматы) до стратегических хитов (Колонизаторы, Каркассон, Эпические схватки). Мы постоянно обновляем ассортимент."
                : "We have over 50 board games: from classics (Monopoly, Uno, Chess) to strategic hits (Settlers of Catan, Carcassonne, Epic Battles). We regularly update our collection."}
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-2">
              {isRu ? "Сколько стоит поиграть в настольные игры?" : "How much does it cost to play board games?"}
            </h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {isRu
                ? "Игры бесплатны для посетителей бара. Вы заказываете напитки и закуски — а играете без дополнительной платы. Никаких скрытых сборов."
                : "Board games are free for bar guests. You order drinks and snacks — and play without any extra charge. No hidden fees."}
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-2">
              {isRu ? "Нужно ли бронировать стол для игр?" : "Do I need to reserve a table for games?"}
            </h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {isRu
                ? "Рекомендуем бронировать на вечер пятницы и выходные. В будни обычно есть свободные столы. Бронь можно оформить на нашем сайте в разделе «Бронь»."
                : "We recommend booking for Friday and Saturday evenings. Weekdays are usually fine. You can book directly on our website in the \"Book\" section."}
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-2">
              {isRu ? "Подходит ли бар для новичков?" : "Is Daerdree suitable for beginners?"}
            </h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {isRu
                ? "Да! Мы подбираем игру под уровень компании. Для новичков у нас есть простые и весёлые игры, а для опытных — сложные стратегии. Наш персонал всегда поможет с правилами."
                : "Yes! We match games to your group's experience level. Beginners get easy fun games, while experts can dive into complex strategies. Our staff will help with the rules."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}