// content/home.ts

export const HERO_CONTENT = {
  title: "THE ULTIMATE TIMECLUB",
  subtitle: "Board Games • Craft Bar • Cyber Lounge",
  buttonText: "FIND OUT MORE AND BOOK!",
  
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
    {
      id: 2,
      desktop: [
        { type: 'image', src: '/images/hero/4.webp' },
        { type: 'image', src: '/images/hero/5.webp' },
        { type: 'image', src: '/images/hero/6.webp' }
      ],
      mobile: { type: 'image', src: '/images/hero/4.webp' }
    },
  ]
};


export const BOOKING_CONTENT = {
  title: "RESERVE YOUR SPOT",
  subtitle: "Limited seats available. Members priority.",
  image: "/images/hero/3.webp", 
  form: {
    namePlaceholder: "Your Name",
    guestsPlaceholder: "Number of Guests",
    datePlaceholder: "Date & Time",
    contactPlaceholder: "Phone / Telegram",
    buttonText: "REQUEST BOOKING"
  },
  socials: {
    whatsapp: "https://wa.me/YOUR_NUMBER",
    instagram: "https://instagram.com/YOUR_PROFILE",
    telegram: "https://t.me/YOUR_PROFILE"
  }
};


export const GAMES_CONTENT = {
  title: "Library",
  subtitle: "Explore our collection",
  buttonText: "View Full List"
};

export const MENU_CONTENT = {
  title: "Our Menu",
  highlightWord: "Menu", 
  description: "Ехал грека через реку, видит грека - в реке рак. Сунул грека руку в реку, рак за руку греку цап!",
  buttonText: "Explore Drinks",
  imageDesktop: "/images/dragon.png", 
  imageMobile: "/images/dragon.png",  
};


export const DIVIDER_CONTENT = {
  image: "/images/separator.webp",
  alt: "Bar Interior Detail",
};

export const EVENTS_CONTENT = {
  title: "Vibe Check",
  subtitle: "Moments, Games, & Madness",
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
  title: "Private Events",
  subtitle: "Crafting Memories, One Night at a Time",
  cards: [
    {
      id: "stack-1",
      title: "The Murmuring Mood",
      description: "Что говорит кот? Кот говорит: \"Мур, епты.\"",
      image: "/images/hero/1.webp", 
    },
    {
      id: "stack-2",
      title: "Custom Menu",
      description: "Повторяющиеся изображения - заглушки.",
      image: "/images/hero/1.webp",
    },
    {
      id: "stack-3",
      title: "Tabletop Games",
      description: "Здесь будет суперважная информация про настолки, кейтеринг и прочее.",
      image: "/images/hero/1.webp",
    },
    {
      id: "stack-4",
      title: "Tech-Enhanced Fun",
      description: "VS Code стал настолько умным, что литералли предлагает мне закончить мои мысли за меня.",
      image: "/images/hero/1.webp",
    },
    {
      id: "stack-5",
      title: "Dedicated Staff",
      description: "Настя, я тебя люблю. Вот эту мысль ВС КОД постеснялся закончить.",
      image: "/images/hero/1.webp",
    },
  ],
  buttonText: "Plan Your Event",
};

// frontend/content/home.ts

export const LOCATION_CONTENT = {
  title: "Find the Lair",
  subtitle: "We are waiting for you",
  address: {
    street: "69 Love St", // Твой адрес
    city: "Larnaka Bay, Cyprus",
    link: "https://goo.gl/maps/...", // Ссылка на Google Maps (для кнопки)
  },
  contact: {
    phone: "+996 555 000 000",
    email: "@daerdree.com",
    instagram: "@daerdreedm",
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
  
  credit: "Website by GIGACHAD, 2026",
};