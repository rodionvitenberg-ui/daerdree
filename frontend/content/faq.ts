export interface FAQItem {
  question: string;
  answer: string | string[]; // Строка или массив параграфов
  list?: string[]; // Для списков (например, цены или языки)
}

export interface FAQBlock {
  id: string;
  image: string; // Путь к картинке
  items: FAQItem[];
  cta?: {
    text: string;
    link?: string;
    icon?: 'arrow' | 'telegram';
  };
}

export const faqData: FAQBlock[] = [
  {
    id: "payment-rules",
    // Использую существующие картинки как заглушки, замените на нужные (например /images/faq/1.webp)
    image: "/images/hero/1.webp", 
    items: [
      {
        question: "How does the payment system work at Daerdree?",
        answer: "If you are playing games, we use a deposit system. It’s €5 per hour per person. You can use this same money to pay for orders at our wonderful bar. We will record the start time of the game and the total bar tab. Whichever amount is higher by the end of the evening will be the final total on your bill."
      },
      {
        question: "Can I bring my own game? And how would that work?",
        answer: "If the game you bring is not in our collection, all participants will receive a 50% discount on the deposit system. In the end, one hour of such a game will cost only €2.5 per hour per person."
      },
      {
        question: "What if I’m not playing? Will I be kicked out?",
        answer: "Of course not! We also operate as a regular bar (but with a cool dragon eye on the wall). We have a diverse selection of drinks to suit every taste. For those who do not participate in games, the deposit system does not apply. You only pay the menu prices."
      }
    ]
  },
  {
    id: "rent-games",
    image: "/images/hero/2.webp",
    items: [
      {
        question: "Is it possible to rent a game?",
        answer: [
          "Yes, we provide such services, but with important conditions.",
          "Not every game in the collection is available for rent. It is best to inquire about a specific game in advance via our social media.",
          "The security deposit for a game is double the cost of a new one. We will return it in full when the game is back on the shelf.",
          "The rental fee is per day and varies depending on the cost of the games:"
        ],
        list: [
          "Games up to €50 - €5 per day",
          "Games from €50 to €75 - €7 per day",
          "Games from €75 - €10 per day"
        ]
      },
      {
        question: "Contact Us",
        answer: "If you didn't find the answer to your question—feel free to write to us in private messages, we will definitely reply!"
      }
    ],
    cta: {
      text: "Let's organize your celebration together!",
      icon: "arrow"
    }
  },
  {
    id: "private-events",
    image: "/images/hero/3.webp",
    items: [
      {
        question: "Is it possible to organize a private event for our celebration at Daerdree?",
        answer: [
          "Absolutely!",
          "We have a great opportunity to organize a private event so you can celebrate your special day in the cozy atmosphere of our dragon's den.",
          "The cost of closing the venue for your event depends on the day of the week, so please contact us directly for more detailed information.",
          "We are ready to help make your celebration unforgettable!",
          "Additionally, we also offer catering for your convenience. More details about it can be found in the current \"Catering\" section."
        ]
      }
    ],
    cta: {
      text: "Let's organize your celebration together!",
      icon: "arrow"
    }
  },
  {
    id: "new-players",
    image: "/images/hero/4.webp",
    items: [
      {
        question: "I don't know much about board games, but I've wanted to try them for a long time. What should I do?",
        answer: "Come to Daerdree and choose a game! We will gladly explain the rules, guide you through the game, and if necessary, join you in any game. And if your eyes are spinning from the abundance of choices, we will help you pick a game that suits your preferences."
      },
      {
        question: "I love board games, but it's hard for me to gather friends to play together. Are there any options for this?",
        answer: [
          "We regularly host open game nights. This event is open to everyone! It’s a great place to meet new people, enjoy board games, and relax in a cozy atmosphere. Announcements appear regularly on our Telegram channel.",
          "We play social games every Wednesday!"
        ]
      }
    ],
    cta: {
      text: "Game night announcements",
      link: "https://t.me/daerdree_channel", // Замените на реальную ссылку
      icon: "telegram"
    }
  },
  {
    id: "solo-specific",
    image: "/images/hero/5.webp",
    items: [
      {
        question: "What if I come alone on a day when there is no open game night?",
        answer: "No problem! First, we promote the idea of \"open tables\": we strive to bring board game enthusiasts together into a single game so that no one is bored. Second, we are always ready to play with a guest ourselves."
      },
      {
        question: "I want to play a specific game on a specific day. Can you organize that?",
        answer: "Of course! Just write to us with the game name, date, and time. We will then cast our lines into our social networks and gather a party of like-minded people for you."
      },
      {
        question: "Do you have games in English?",
        answer: "We have:",
        list: [
          "Games in Russian",
          "Games in English",
          "Language-independent games"
        ]
      },
      {
        question: "",
        answer: "Our dragon guardians are always happy to help you choose a game according to your wishes."
      }
    ]
  },
  {
    id: "hours-pets",
    image: "/images/hero/6.webp",
    items: [
      {
        question: "What days are we open and what time can I come?",
        answer: "Daerdree is open from Wednesday to Sunday inclusive. We open our doors:",
        list: [
          "Weekdays - from 15:00 (3 PM)",
          "Weekends - from 12:00 (12 PM)"
        ]
      },
      {
        question: "",
        answer: "And we don't close until the last client leaves. If everyone leaves early enough, we close at 22:00 (10 PM)."
      },
      {
        question: "Is it possible to visit us outside of working hours?",
        answer: "Yes, we are always ready to respond and open the bar specifically for you. You can write to us on social media and request an opening at the required time. However, there is a small request: we need to have at least 24 hours to plan the event. Otherwise, we cannot guarantee anything."
      },
      {
        question: "Can I bring pets?",
        answer: "Yes, we adore animals! The main thing is that the pet is ready to be in a bar environment."
      }
    ]
  }
];