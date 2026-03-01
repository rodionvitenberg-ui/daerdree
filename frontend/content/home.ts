// content/home.ts

export const HERO_CONTENT = {
  title: "ТВОЙ ХОД К ИДЕАЛЬНОМУ ВЕЧЕРУ",
  subtitle: "Игры • Вкусности • Веселье",
  buttonText: "ЗАБРОНИРУЙ СТОЛИК!",
  
  slides: [
    {
      id: 1,
      desktop: [
        { type: 'video', src: '/images/hero/2.mp4' }, 
        { type: 'image', src: '/images/hero/7.webp' }, // Исправил 'images' на 'image'
        { type: 'video', src: '/images/hero/1.mp4' }
      ],
      mobile: { type: 'video', src: '/images/hero/1.mp4' }
    },
  ]
};


export const BOOKING_CONTENT = {
  title: "Хороший вечер начинается с брони",
  subtitle: "Ваш стол уже ждет, а правила мы расскажем!",
  image: "/images/1.png", 
  form: {
    namePlaceholder: "Ваше имя",
    guestsPlaceholder: "Количество гостей",
    datePlaceholder: "Дата и время",
    contactPlaceholder: "Телефон / Telegram",
    buttonText: "ЗАБРОНИРОВАТЬ"
  },
  socials: {
    instagram: "https://instagram.com/daerdree",
    telegram: "https://t.me/daerdreedm"
  }
};


export const GAMES_CONTENT = {
  title: "Библиотека игр",
  subtitle: "Выбирайте, играйте, повторяйте",
  buttonText: "Посмотреть все игры",
};

export const MENU_CONTENT = {
  title: "Наше",
  highlightWord: "Меню", 
  description: "Вкусные коктейли, которые отлично дополняют атмосферу. От классики до авторских шедевров — каждый себе найдет что-то по вкусу.",
  buttonText: "Посмотреть меню",
  imageDesktop: "/images/dragon.png", 
  imageMobile: "/images/dragon.png",  
};


export const DIVIDER_CONTENT = {
  image: "/images/separator.png",
  alt: "Bar Interior Detail",
};

export const EVENTS_CONTENT = {
  title: "Зацени наш вайб",
  subtitle: "Самые яркие моменты из жизни нашего бара",
};

// Генерируем побольше карточек для плотной стены
export const EVENTS_GALLERY = [
  { id: "1", src: "/images/hero/1.webp", title: "Friday Night", height: "tall" },
  { id: "2", src: "/images/hero/2.webp", title: "DnD Masters", height: "short" },
  { id: "3", src: "/images/hero/5.webp", title: "Cocktail Art", height: "short" },
  { id: "4", src: "/images/hero/4.webp", title: "Winning Move", height: "tall" },
  { id: "5", src: "/images/hero/3.webp", title: "Cozy Corner", height: "tall" },
  { id: "6", src: "/images/hero/2.webp", title: "Mafia Don", height: "short" },
  { id: "7", src: "/images/hero/7.webp", title: "Full House", height: "short" },
  { id: "8", src: "/images/hero/6.webp", title: "Focus", height: "tall" },
  { id: "9", src: "/images/hero/5.webp", title: "Cheers", height: "tall" },
  { id: "10", src: "/images/hero/4.webp", title: "Setup", height: "short" },
  { id: "11", src: "/images/hero/3.webp", title: "Dice Roll", height: "short" },
  { id: "12", src: "/images/hero/2.webp", title: "Late Night", height: "tall" },
];

// frontend/content/home.ts

export const CATERING_STACK_CONTENT = {
  title: "Мероприятия под ключ",
  subtitle: "Доверьтесь нам - мы сделаем всё от первого хода до финального тоста!",
  cards: [
    {
      id: "stack-1",
      title: "Ивент, о котором будут говорить",
      description: "Не просто вечер - настоящий игровой опыт.",
      image: "/images/frames/1.jpg", 
    },
    {
      id: "stack-2",
      title: "Ваша компания. Наш сценарий.",
      description: "Подберём формат под любую аудиторию.",
      image: "/images/frames/2.png",
    },
    {
      id: "stack-3",
      title: "Азарт, смех и командный дух",
      description: "Объединяем людей через игру.",
      image: "/images/frames/3.jpg",
    },
    {
      id: "stack-4",
      title: "Вкус, стиль и атмосфера",
      description: "Кейтеринг, который дополняет вечер.",
      image: "/images/frames/4.png",
    },
    {
      id: "stack-5",
      title: "Один шаг до идеального события",
      description: "Оставьте заявку — остальное сделаем мы.",
      image: "/images/frames/5.png",
    },
  ],
  buttonText: "Устроить Ивент",
};

// frontend/content/home.ts

export const LOCATION_CONTENT = {
  title: "Find the Lair",
  subtitle: "We are waiting for you",
  address: {
    street: "Nicou Dimitrou", // Твой адрес
    city: "Larnaka Bay, Cyprus",
    link: "https://goo.gl/maps/...", // Ссылка на Google Maps (для кнопки)
  },
  contact: {
    phone: "+357 95 147376",
    telegram: "@daerdreedm",
    instagram: "@daerdree",
  },
  hours: [
    { day: "Mon - Thu", time: "16:00 - 01:00" },
    { day: "Fri - Sat", time: "16:00 - 04:00" },
    { day: "Sunday", time: "16:00 - 02:00" },
  ],
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d408.99159143182857!2d33.6287453!3d34.9081376!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzTCsDU0JzMwLjEiTiAzM8KwMzcnNDQuMSJF!5e0!3m2!1sen!2skg!4v1767123400102!5m2!1sen!2skg",
};

export const FOOTER_CONTENT = {
  logoImage: "/images/daerdree.png", 
  
  socials: [
    { name: "Instagram", link: "https://instagram.com/daerdree" },
    { name: "TikTok", link: "https://tiktok.com/@daerdree" },
    { name: "Telegram", link: "https://t.me/daerdree" },
  ],
  
  credit: "Powered by IkSoft, 2026",
};